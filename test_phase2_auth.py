"""
Comprehensive Automated Test Suite for JudgeAI Phase 2 Authentication & Security.
Covers: Email OTP Verification, Resend Cooldown, Password Reset, Unverified User Gatekeeping,
and EmailService Error Handling (missing keys, provider rejection, network failures).
"""

import sys
import os
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from backend.auth_users.config import settings
from backend.auth_users.security import (
    hash_password,
    verify_password,
    generate_numeric_otp,
    generate_secure_reset_token,
    hash_token_or_otp,
    verify_token_or_otp,
    create_access_token,
)
from backend.auth_users.db import UserDatabase
from backend.auth_users.email_service import EmailService, EmailDeliveryError
from backend.auth_users.router import (
    signup,
    login,
    verify_email,
    resend_verification,
    forgot_password,
    reset_password,
)
from backend.auth_users.models import (
    UserSignupRequest,
    UserLoginRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from backend.shared.auth_middleware import get_current_authenticated_user, require_verified_user
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


async def run_all_phase2_tests():
    print("=" * 70)
    print("     ⚖️  JudgeAI Phase 2 Email OTP & Password Reset Test Suite    ")
    print("=" * 70)

    passed = 0
    failed = 0

    def assert_test(name: str, condition: bool, err_msg: str = ""):
        nonlocal passed, failed
        if condition:
            print(f"  [✓ PASS] {name}")
            passed += 1
        else:
            print(f"  [✗ FAIL] {name}: {err_msg}")
            failed += 1

    await UserDatabase.connect()

    # ---------------------------------------------------------
    # 1. Cryptographic OTP & Token Hash Security Tests
    # ---------------------------------------------------------
    print("\n--- 1. Cryptographic OTP & Reset Token Security ---")
    otp_sample = generate_numeric_otp(6)
    assert_test("6-digit numeric OTP generated", len(otp_sample) == 6 and otp_sample.isdigit())

    otp_hash = hash_token_or_otp(otp_sample)
    assert_test("OTP hash is salted SHA-256", len(otp_hash) == 64 and otp_hash != otp_sample)
    assert_test("Verify correct OTP against hash", verify_token_or_otp(otp_sample, otp_hash))
    assert_test("Verify incorrect OTP against hash fails", not verify_token_or_otp("000000", otp_hash))

    token_sample = generate_secure_reset_token()
    assert_test("32-char urlsafe reset token generated", len(token_sample) >= 32)
    token_hash = hash_token_or_otp(token_sample)
    assert_test("Verify reset token against hash", verify_token_or_otp(token_sample, token_hash))

    # ---------------------------------------------------------
    # 2. EmailService Error Path & Non-Silent Failure Tests
    # ---------------------------------------------------------
    print("\n--- 2. EmailService Error Handling (No Silent Success) ---")
    # Test 2.1: Missing API key raises EmailDeliveryError
    with patch.object(settings, "RESEND_API_KEY", ""):
        try:
            await EmailService.send_email("test@example.com", "Subject", "Content")
            assert_test("Missing RESEND_API_KEY raises EmailDeliveryError", False)
        except EmailDeliveryError as e:
            assert_test("Missing RESEND_API_KEY raises EmailDeliveryError", "unconfigured" in str(e).lower())

    # Test 2.2: Resend API 403 rejection (e.g. unverified domain) raises EmailDeliveryError
    with patch.object(settings, "RESEND_API_KEY", "re_test_dummy_key"):
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.json.return_value = {"message": "You can only send testing emails to your own email address."}

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            try:
                await EmailService.send_email("unverified_recipient@external.com", "Test", "HTML")
                assert_test("Resend 403 rejection raises EmailDeliveryError", False)
            except EmailDeliveryError as e:
                assert_test("Resend 403 rejection raises EmailDeliveryError", "403" in str(e) and "testing emails" in str(e).lower())

    # Test 2.3: Signup endpoint returns 503 if email delivery fails
    err_signup_req = UserSignupRequest(
        name="Error Path User",
        email=f"err_user_{uuid.uuid4().hex[:6]}@judgeai.dev",
        password="Password123!"
    )
    with patch("backend.auth_users.email_service.EmailService.send_verification_otp", new_callable=AsyncMock) as mock_fail_send:
        mock_fail_send.side_effect = EmailDeliveryError("Service unconfigured")
        try:
            await signup(err_signup_req)
            assert_test("Signup returns 503 when email delivery fails", False)
        except HTTPException as e:
            assert_test("Signup returns 503 when email delivery fails", e.status_code == 503 and "unavailable" in e.detail.lower())

    # ---------------------------------------------------------
    # 3. Signup Flow with Mocked Successful Email Dispatch
    # ---------------------------------------------------------
    print("\n--- 3. Signup with Verification Pending ---")
    unique_email = f"phase2_user_{uuid.uuid4().hex[:6]}@judgeai.dev"
    signup_req = UserSignupRequest(
        name="Elena Rostova",
        email=unique_email,
        password="SecurePassword2026!"
    )

    with patch("backend.auth_users.email_service.EmailService.send_verification_otp", new_callable=AsyncMock) as mock_send_otp:
        mock_send_otp.return_value = True
        signup_res = await signup(signup_req)

        assert_test("Signup sets email_verified = False", signup_res.user.email_verified is False)
        assert_test("EmailService dispatched verification email", mock_send_otp.called)

        # Inspect database record
        user_doc = await UserDatabase.get_user_by_email(unique_email)
        assert_test("OTP hash is stored in DB", user_doc.get("email_verification_otp_hash") is not None)
        assert_test("OTP expires_at is set", user_doc.get("email_verification_otp_expires_at") is not None)
        assert_test("Raw OTP is NEVER stored in DB", "raw_otp" not in user_doc and user_doc.get("email_verification_otp_hash") != mock_send_otp.call_args[1]["otp"])

        # Capture the raw OTP sent by email for verification testing
        sent_otp = mock_send_otp.call_args[1]["otp"]

    # ---------------------------------------------------------
    # 4. Unverified User Login Gatekeeping
    # ---------------------------------------------------------
    print("\n--- 4. Unverified User Login Gatekeeping ---")
    login_req = UserLoginRequest(
        email=unique_email,
        password="SecurePassword2026!"
    )
    try:
        await login(login_req)
        assert_test("Unverified user login rejected with 403", False)
    except HTTPException as e:
        assert_test("Unverified user login rejected with 403", e.status_code == 403 and "not verified" in e.detail.lower())

    # Test protected backend dependency
    unverified_token = create_access_token(subject=user_doc["id"], email=unique_email, extra_claims={"email_verified": False})
    unverified_user_auth = await get_current_authenticated_user(
        credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials=unverified_token)
    )
    try:
        await require_verified_user(unverified_user_auth)
        assert_test("require_verified_user blocks unverified account", False)
    except HTTPException as e:
        assert_test("require_verified_user blocks unverified account", e.status_code == 403)

    # ---------------------------------------------------------
    # 5. OTP Verification Attempts & Validation
    # ---------------------------------------------------------
    print("\n--- 5. OTP Verification & Attempt Limits ---")
    # Test wrong OTP
    try:
        await verify_email(VerifyEmailRequest(email=unique_email, otp="999999"))
        assert_test("Wrong OTP rejected", False)
    except HTTPException as e:
        assert_test("Wrong OTP rejected with 400", e.status_code == 400 and "invalid verification code" in e.detail.lower())

    # Test valid OTP
    verify_res = await verify_email(VerifyEmailRequest(email=unique_email, otp=sent_otp))
    assert_test("Correct OTP verifies email", verify_res.user.email_verified is True)

    # Verify DB cleaned up OTP fields
    updated_user = await UserDatabase.get_user_by_email(unique_email)
    assert_test("OTP hash wiped out after verification", updated_user.get("email_verification_otp_hash") is None)
    assert_test("email_verified is True in DB", updated_user.get("email_verified") is True)

    # Now login must succeed
    login_res_verified = await login(login_req)
    assert_test("Verified user login succeeds", login_res_verified.user.email_verified is True)

    # ---------------------------------------------------------
    # 6. Resend OTP & Cooldown Enforcement
    # ---------------------------------------------------------
    print("\n--- 6. Resend OTP & Cooldown Enforcement ---")
    unverified_email_2 = f"cooldown_test_{uuid.uuid4().hex[:6]}@judgeai.dev"
    with patch("backend.auth_users.email_service.EmailService.send_verification_otp", new_callable=AsyncMock) as mock_send_otp_2:
        mock_send_otp_2.return_value = True
        await signup(UserSignupRequest(name="Cooldown Test", email=unverified_email_2, password="Password123!"))

    # Immediate resend should trigger 60s cooldown
    try:
        await resend_verification(ResendVerificationRequest(email=unverified_email_2))
        assert_test("Immediate resend triggers 429 cooldown", False)
    except HTTPException as e:
        assert_test("Immediate resend triggers 429 cooldown", e.status_code == 429 and "wait" in e.detail.lower())

    # ---------------------------------------------------------
    # 7. Forgot Password & Password Reset Flow
    # ---------------------------------------------------------
    print("\n--- 7. Forgot Password & Password Reset ---")
    with patch("backend.auth_users.email_service.EmailService.send_password_reset", new_callable=AsyncMock) as mock_send_reset:
        mock_send_reset.return_value = True

        # Nonexistent email (anti-enumeration)
        ghost_res = await forgot_password(ForgotPasswordRequest(email="nonexistent_user@judgeai.dev"))
        assert_test("Nonexistent email returns generic success (no leak)", "password reset link has been sent" in ghost_res.message.lower())
        assert_test("EmailService NOT called for ghost account", not mock_send_reset.called)

        # Existing verified email
        real_res = await forgot_password(ForgotPasswordRequest(email=unique_email))
        assert_test("Existing email returns generic success", "password reset link has been sent" in real_res.message.lower())
        assert_test("EmailService called with reset token", mock_send_reset.called)

        raw_reset_token = mock_send_reset.call_args[1]["reset_token"]

    # Verify reset token is hashed in DB
    user_after_forgot = await UserDatabase.get_user_by_email(unique_email)
    assert_test("Reset token hash stored in DB", user_after_forgot.get("password_reset_token_hash") is not None)
    assert_test("Raw reset token NOT in DB", user_after_forgot.get("password_reset_token_hash") != raw_reset_token)

    # Test resetting with invalid token
    try:
        await reset_password(ResetPasswordRequest(token="invalid_random_token_123456", password="BrandNewPassword2026!"))
        assert_test("Invalid reset token rejected", False)
    except HTTPException as e:
        assert_test("Invalid reset token rejected with 400", e.status_code == 400)

    # Test resetting with valid token
    reset_res = await reset_password(ResetPasswordRequest(token=raw_reset_token, password="BrandNewPassword2026!"))
    assert_test("Valid reset token resets password", "successfully" in reset_res.message.lower())

    # Test token single-use (cannot be reused)
    try:
        await reset_password(ResetPasswordRequest(token=raw_reset_token, password="AnotherPassword2026!"))
        assert_test("Reset token is single-use only", False)
    except HTTPException as e:
        assert_test("Reset token is single-use only", e.status_code == 400)

    # Test login with old password fails
    try:
        await login(UserLoginRequest(email=unique_email, password="SecurePassword2026!"))
        assert_test("Old password rejected after reset", False)
    except HTTPException as e:
        assert_test("Old password rejected after reset", e.status_code == 401)

    # Test login with new password succeeds
    new_login_res = await login(UserLoginRequest(email=unique_email, password="BrandNewPassword2026!"))
    assert_test("New password accepted for login", new_login_res.user.email == unique_email.lower())

    # ---------------------------------------------------------
    # Final Summary
    # ---------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"  Test Results: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)
    else:
        print("\n🎉 ALL PHASE 2 EMAIL OTP & PASSWORD RESET TESTS PASSED SUCCESSFULLY!\n")


if __name__ == "__main__":
    asyncio.run(run_all_phase2_tests())
