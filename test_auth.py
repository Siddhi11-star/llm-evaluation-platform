"""
Comprehensive Automated Test Suite for JudgeAI Phase 1 Authentication & Security.
"""

import sys
import os
import asyncio
import jwt
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch, AsyncMock

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from backend.auth_users.config import settings
from backend.auth_users.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from backend.auth_users.db import UserDatabase
from backend.auth_users.router import signup, login, get_me, update_onboarding
from backend.auth_users.models import (
    UserSignupRequest,
    UserLoginRequest,
    UpdateOnboardingRequest,
)
from backend.shared.auth_middleware import get_current_authenticated_user
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


async def run_all_tests():
    print("=" * 70)
    print("       ⚖️  JudgeAI Phase 1 Authentication & Security Test Suite     ")
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

    # ---------------------------------------------------------
    # 1. Password Hashing Tests
    # ---------------------------------------------------------
    print("\n--- 1. Password Hashing & Validation ---")
    raw_pw = "SecurePassword123!"
    pw_hash = hash_password(raw_pw)

    assert_test("Bcrypt hash is generated", pw_hash.startswith("$2b$") or pw_hash.startswith("$2a$"))
    assert_test("Hash is not plaintext", pw_hash != raw_pw)
    assert_test("Correct password verifies", verify_password(raw_pw, pw_hash))
    assert_test("Incorrect password fails", not verify_password("WrongPassword!", pw_hash))
    assert_test("Empty password fails verification", not verify_password("", pw_hash))

    try:
        hash_password("short")
        assert_test("Reject short password (<8 chars)", False, "Should have raised ValueError")
    except ValueError:
        assert_test("Reject short password (<8 chars)", True)

    # ---------------------------------------------------------
    # 2. JWT Generation & Verification Tests
    # ---------------------------------------------------------
    print("\n--- 2. JWT Token Issuance & Decoding ---")
    test_uid = str(uuid.uuid4())
    test_email = "tester@judgeai.dev"
    token = create_access_token(subject=test_uid, email=test_email)

    assert_test("JWT Token generated", isinstance(token, str) and len(token) > 20)

    decoded = decode_access_token(token)
    assert_test("JWT Subject claim matches", decoded.get("sub") == test_uid)
    assert_test("JWT Email claim matches", decoded.get("email") == test_email)
    assert_test("JWT contains iat and exp", "iat" in decoded and "exp" in decoded)

    # Expired token test
    expired_token = create_access_token(
        subject=test_uid,
        email=test_email,
        expires_delta=timedelta(seconds=-10)
    )
    try:
        decode_access_token(expired_token)
        assert_test("Expired JWT rejected with 401", False, "Should have raised HTTPException")
    except HTTPException as e:
        assert_test("Expired JWT rejected with 401", e.status_code == 401 and "expired" in e.detail.lower())

    # Forged token test
    forged_token = jwt.encode(
        {"sub": test_uid, "email": test_email, "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())},
        "wrong-secret-key-attacker-signature",
        algorithm="HS256"
    )
    try:
        decode_access_token(forged_token)
        assert_test("Forged JWT rejected with 401", False, "Should have raised HTTPException")
    except HTTPException as e:
        assert_test("Forged JWT rejected with 401", e.status_code == 401 and "invalid" in e.detail.lower())

    # ---------------------------------------------------------
    # 3. User Database & Registration Tests
    # ---------------------------------------------------------
    print("\n--- 3. User Database & Registration Operations ---")
    await UserDatabase.connect()

    unique_email = f"user_{uuid.uuid4().hex[:6]}@judgeai.dev"
    signup_req = UserSignupRequest(
        name="Alex River",
        email=unique_email,
        password="ProductionPassword2026!"
    )

    with patch("backend.auth_users.email_service.EmailService.send_verification_otp", new_callable=AsyncMock) as mock_otp:
        mock_otp.return_value = True
        signup_res = await signup(signup_req)
        assert_test("Signup creates MongoDB user", signup_res.user.email == unique_email.lower())
        assert_test("Signup returns valid JWT access token", len(signup_res.access_token) > 20)
        assert_test("User ID is returned", bool(signup_res.user.id))

        # Mark email verified, then test duplicate email signup rejection
        await UserDatabase.mark_email_verified(signup_res.user.id)
        try:
            await signup(signup_req)
            assert_test("Duplicate email signup rejected", False, "Should have raised duplicate error")
        except HTTPException as e:
            assert_test("Duplicate email signup rejected", e.status_code == 400 and "already exists" in e.detail.lower())

    # ---------------------------------------------------------
    # 4. User Login Tests
    # ---------------------------------------------------------
    print("\n--- 4. User Login & Credential Verification ---")
    login_req_ok = UserLoginRequest(
        email=unique_email,
        password="ProductionPassword2026!"
    )
    
    # In Phase 2, unverified user login must return 403
    unverified_email = f"unverified_{uuid.uuid4().hex[:6]}@judgeai.dev"
    with patch("backend.auth_users.email_service.EmailService.send_verification_otp", new_callable=AsyncMock) as mock_u_otp:
        mock_u_otp.return_value = True
        await signup(UserSignupRequest(name="Unverified", email=unverified_email, password="Password123!"))
    try:
        await login(UserLoginRequest(email=unverified_email, password="Password123!"))
        assert_test("Unverified user login blocked (403)", False)
    except HTTPException as e:
        assert_test("Unverified user login blocked (403)", e.status_code == 403)

    login_res = await login(login_req_ok)
    assert_test("Login with correct credentials succeeds", login_res.user.email == unique_email.lower())
    assert_test("Login returns access token", len(login_res.access_token) > 20)

    # Wrong password test
    login_req_bad = UserLoginRequest(
        email=unique_email,
        password="WrongPassword999!"
    )
    try:
        await login(login_req_bad)
        assert_test("Login with wrong password returns 401", False)
    except HTTPException as e:
        assert_test("Login with wrong password returns 401", e.status_code == 401 and "invalid email or password" in e.detail.lower())

    # Nonexistent user test (must not leak user existence)
    login_req_ghost = UserLoginRequest(
        email="nonexistent_ghost_account@judgeai.dev",
        password="AnyPassword123!"
    )
    try:
        await login(login_req_ghost)
        assert_test("Nonexistent user returns generic 401 (no leak)", False)
    except HTTPException as e:
        assert_test("Nonexistent user returns generic 401 (no leak)", e.status_code == 401 and "invalid email or password" in e.detail.lower())

    # ---------------------------------------------------------
    # 5. /auth/me & Middleware Protected Routes
    # ---------------------------------------------------------
    print("\n--- 5. Authenticated /me & Shared Middleware ---")
    auth_user = await get_current_authenticated_user(
        credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials=login_res.access_token)
    )
    assert_test("Shared auth middleware validates token", auth_user["email"] == unique_email.lower())

    me_profile = await get_me(current_user=auth_user)
    assert_test("/auth/me returns authenticated user details", me_profile.email == unique_email.lower())
    assert_test("User name is preserved", me_profile.name == "Alex River")

    # Missing credentials test
    try:
        await get_current_authenticated_user(credentials=None, authorization=None)
        assert_test("Unauthenticated request returns 401", False)
    except HTTPException as e:
        assert_test("Unauthenticated request returns 401", e.status_code == 401)

    # ---------------------------------------------------------
    # 6. Onboarding Persistence Sync
    # ---------------------------------------------------------
    print("\n--- 6. Onboarding Persistence Sync ---")
    onboard_req = UpdateOnboardingRequest(
        plan="Pro",
        role="ML Engineer",
        use_cases=["Quality Assurance", "Model Selection"],
        models=["GPT-4o", "Claude 3.5 Sonnet"],
        priorities=["Accuracy", "Reasoning"]
    )
    updated_profile = await update_onboarding(onboard_req, current_user=auth_user)
    assert_test("Onboarding updates plan to Pro", updated_profile.plan == "Pro")
    assert_test("Onboarding sets role to ML Engineer", updated_profile.role == "ML Engineer")
    assert_test("Onboarding sets completed flag", updated_profile.onboarding_completed is True)

    # ---------------------------------------------------------
    # 7. Evaluations User Isolation via JWT
    # ---------------------------------------------------------
    print("\n--- 7. Evaluation Service JWT Isolation ---")
    from backend.evaluations.router import get_current_user as eval_get_user

    eval_user_id = eval_get_user(
        authorization=f"Bearer {login_res.access_token}",
        x_user_id="attacker_fake_user@malicious.com" # Should be overridden by verified JWT
    )
    assert_test(
        "Client-supplied X-User-Id cannot override verified JWT",
        eval_user_id == auth_user["id"].lower() or eval_user_id == unique_email.lower(),
        f"Expected {auth_user['id']} but got {eval_user_id}"
    )

    # ---------------------------------------------------------
    # Final Summary
    # ---------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"  Test Results: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)
    else:
        print("\n🎉 ALL PHASE 1 AUTHENTICATION & SECURITY TESTS PASSED SUCCESSFULLY!\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
