"""
Comprehensive Automated Test Suite for JudgeAI Phase 5: Account Management.
Tests:
1. Profile update (name change, persistence)
2. Password change (standard user verification, wrong current password rejection, OAuth initial password setup)
3. Security Status overview (email verification, OAuth providers, active sessions)
4. Secure Email Change Flow (request OTP, OTP generation & hashing, wrong OTP rejection, successful verification & email update)
5. Active Sessions & Device Management (session listing, current session identification, individual session revocation)
6. Logout from All Devices (revoke all user sessions)
7. Account Deletion (confirmation protection, password verification, cascade cleanup of user and session documents)
8. Fast-API Router Endpoint End-to-End Integration
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
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_token_or_otp,
    generate_numeric_otp,
)
from backend.auth_users.db import UserDatabase
from backend.auth_users.router import (
    update_profile as update_profile_endpoint,
    change_password as change_password_endpoint,
    get_security_status as get_security_status_endpoint,
    request_email_change as request_email_change_endpoint,
    verify_email_change as verify_email_change_endpoint,
    list_sessions as list_sessions_endpoint,
    revoke_session_endpoint,
    revoke_all_sessions_endpoint,
    delete_account_endpoint,
    UpdateProfileRequest,
    ChangePasswordRequest,
    RequestEmailChangeRequest,
    VerifyEmailChangeRequest,
    DeleteAccountRequest,
)
from fastapi import HTTPException, Response, Request


async def run_all_phase5_tests():
    print("=" * 70)
    print("       JudgeAI Phase 5 Account Management Test Suite       ")
    print("=" * 70)

    passed = 0
    failed = 0

    def check(desc: str, condition: bool):
        nonlocal passed, failed
        if condition:
            print(f"  [PASS] {desc}")
            passed += 1
        else:
            print(f"  [FAIL] {desc}")
            failed += 1

    await UserDatabase.connect()

    # ------------------------------------------------------------------
    # 1. Profile Update
    # ------------------------------------------------------------------
    print("\n--- 1. Profile Update (PUT /auth/profile) ---")
    user1_id = str(uuid.uuid4())
    user1_email = f"p5_user1_{uuid.uuid4().hex[:6]}@example.com"
    user1 = await UserDatabase.create_user(
        name="Original Name",
        email=user1_email,
        password_hash=hash_password("OriginalPassword123!"),
        email_verified=True,
    )

    auth_ctx1 = {
        "id": user1["id"],
        "user_id": user1["id"],
        "email": user1["email"],
        "name": user1["name"],
        "role": user1.get("role", "user"),
        "email_verified": True,
        "token_jti": "jti_p5_1",
    }

    # Update name
    update_req = UpdateProfileRequest(name="Jane Doe Renamed")
    res_prof = await update_profile_endpoint(req=update_req, current_user=auth_ctx1)
    check("Profile update returns updated user object", res_prof.name == "Jane Doe Renamed")

    # Verify DB persistence
    db_user1 = await UserDatabase.get_user_by_id(user1["id"])
    check("Database persists updated user name", db_user1.get("name") == "Jane Doe Renamed")

    # ------------------------------------------------------------------
    # 2. Change Password
    # ------------------------------------------------------------------
    print("\n--- 2. Password Change (POST /auth/change-password) ---")

    # 2a. Rejection of incorrect current password
    bad_pw_req = ChangePasswordRequest(current_password="WrongCurrentPassword!", new_password="NewSecretPass123!")
    bad_pw_caught = False
    try:
        await change_password_endpoint(req=bad_pw_req, current_user=auth_ctx1)
    except HTTPException as e:
        bad_pw_caught = (e.status_code == 400 and "incorrect" in e.detail.lower())
    check("Change password rejects incorrect current password with 400", bad_pw_caught)

    # 2b. Rejection of short new password
    short_pw_caught = False
    try:
        short_pw_req = ChangePasswordRequest(current_password="OriginalPassword123!", new_password="short")
        await change_password_endpoint(req=short_pw_req, current_user=auth_ctx1)
    except Exception as e:
        short_pw_caught = "8" in str(e) or "short" in str(e).lower()
    check("Change password enforces minimum password length (8 chars)", short_pw_caught)

    # 2c. Successful password change for standard user
    valid_pw_req = ChangePasswordRequest(current_password="OriginalPassword123!", new_password="NewStrongPassword456!")
    res_pw = await change_password_endpoint(req=valid_pw_req, current_user=auth_ctx1)
    check("Valid password change returns success message", "success" in res_pw.message.lower())

    # Verify DB updated hash
    db_user1_after = await UserDatabase.get_user_by_id(user1["id"])
    check("New password hash verifies against new password", verify_password("NewStrongPassword456!", db_user1_after["password_hash"]))
    check("Old password fails verification against updated hash", not verify_password("OriginalPassword123!", db_user1_after["password_hash"]))

    # 2d. OAuth user initial password setup (no previous password)
    oauth_user, _ = await UserDatabase.find_or_create_oauth_user(
        provider="google",
        provider_user_id=f"goog_{uuid.uuid4().hex[:8]}",
        email=f"oauth_user_{uuid.uuid4().hex[:6]}@gmail.com",
        name="Google User No Pass",
        avatar_url=None,
    )
    auth_ctx_oauth = {
        "id": oauth_user["id"],
        "user_id": oauth_user["id"],
        "email": oauth_user["email"],
        "name": oauth_user["name"],
        "role": oauth_user.get("role", "user"),
        "email_verified": True,
        "token_jti": "jti_oauth_p5",
    }
    check("OAuth user initially has password_hash = None", oauth_user.get("password_hash") is None)

    oauth_set_pw_req = ChangePasswordRequest(current_password=None, new_password="InitialOAuthPassword123!")
    res_oauth_pw = await change_password_endpoint(req=oauth_set_pw_req, current_user=auth_ctx_oauth)
    check("OAuth user can set initial password without providing current_password", "success" in res_oauth_pw.message.lower())

    db_oauth_user = await UserDatabase.get_user_by_id(oauth_user["id"])
    check("OAuth user now has valid password_hash in database", verify_password("InitialOAuthPassword123!", db_oauth_user["password_hash"]))

    # ------------------------------------------------------------------
    # 3. Security Status Overview
    # ------------------------------------------------------------------
    print("\n--- 3. Security Status Overview (GET /auth/security-status) ---")
    sec_user_id = str(uuid.uuid4())
    sec_email = f"sec_user_{uuid.uuid4().hex[:6]}@example.com"
    sec_user = await UserDatabase.create_user(
        name="Security Overview User",
        email=sec_email,
        password_hash=hash_password("SecPass123!"),
        email_verified=True,
    )
    # Link github provider
    await UserDatabase.find_or_create_oauth_user(
        provider="github",
        provider_user_id="gh_12345",
        email=sec_email,
        name="Security Overview User",
    )

    # Create 2 sessions
    s1_id = f"jti_s1_{uuid.uuid4().hex[:6]}"
    s2_id = f"jti_s2_{uuid.uuid4().hex[:6]}"
    await UserDatabase.create_session(
        user_id=sec_user["id"],
        refresh_token_hash=f"hash_s1_{uuid.uuid4().hex[:6]}",
        session_id=s1_id,
        expires_at=int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()),
    )
    await UserDatabase.create_session(
        user_id=sec_user["id"],
        refresh_token_hash=f"hash_s2_{uuid.uuid4().hex[:6]}",
        session_id=s2_id,
        expires_at=int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()),
    )

    auth_ctx_sec = {
        "id": sec_user["id"],
        "user_id": sec_user["id"],
        "email": sec_email,
        "name": "Security Overview User",
        "role": "user",
        "email_verified": True,
        "token_jti": s1_id,
    }

    sec_status = await get_security_status_endpoint(current_user=auth_ctx_sec)
    check("Security status reports email_verified = True", sec_status.email_verified is True)
    check("Security status reports has_password = True", sec_status.has_password is True)
    check("Security status lists linked OAuth provider 'github'", "github" in sec_status.providers)
    check("Security status reports correct active session count (2)", sec_status.active_sessions_count == 2)

    # ------------------------------------------------------------------
    # 4. Secure Email Change Flow
    # ------------------------------------------------------------------
    print("\n--- 4. Secure Email Change Flow (Request + Verify OTP) ---")
    chg_user_id = str(uuid.uuid4())
    old_email = f"chg_old_{uuid.uuid4().hex[:6]}@example.com"
    new_email = f"chg_new_{uuid.uuid4().hex[:6]}@example.com"

    chg_user = await UserDatabase.create_user(
        name="Email Changer",
        email=old_email,
        password_hash=hash_password("ChangerPass123!"),
        email_verified=True,
    )

    auth_ctx_chg = {
        "id": chg_user["id"],
        "user_id": chg_user["id"],
        "email": old_email,
        "name": "Email Changer",
        "role": "user",
        "email_verified": True,
        "token_jti": "jti_chg_user",
    }

    # 4a. Request email change to existing email fails
    dup_req = RequestEmailChangeRequest(new_email=sec_email)
    dup_caught = False
    try:
        await request_email_change_endpoint(req=dup_req, request=None, current_user=auth_ctx_chg)
    except HTTPException as e:
        dup_caught = (e.status_code == 400 and "already exists" in e.detail.lower())
    check("Request email change rejects already registered email address", dup_caught)

    # 4b. Request email change to same email fails
    same_req = RequestEmailChangeRequest(new_email=old_email)
    same_caught = False
    try:
        await request_email_change_endpoint(req=same_req, request=None, current_user=auth_ctx_chg)
    except HTTPException as e:
        same_caught = (e.status_code == 400 and "different" in e.detail.lower() or "same" in e.detail.lower())
    check("Request email change rejects identical existing email address", same_caught)

    # 4c. Successful email change request
    with patch("backend.auth_users.email_service.EmailService.send_email_change_otp", new_callable=AsyncMock) as mock_send_email:
        mock_send_email.return_value = {"status": "sent", "id": "mock_email_id"}
        req_chg = RequestEmailChangeRequest(new_email=new_email)
        res_req = await request_email_change_endpoint(req=req_chg, request=None, current_user=auth_ctx_chg)

        check("Request email change returns pending verification message", "confirmation code" in res_req.message.lower())
        check("Email service was called to dispatch OTP to new email", mock_send_email.called)

    # Inspect pending email change state in DB
    db_chg_user = await UserDatabase.get_user_by_id(chg_user["id"])
    check("DB stores pending_email correctly", db_chg_user.get("pending_email") == new_email.lower())
    check("DB stores hashed email change OTP", bool(db_chg_user.get("email_change_otp_hash")))

    # 4d. Reject wrong OTP
    bad_verify_req = VerifyEmailChangeRequest(new_email=new_email, otp="999999")
    bad_otp_caught = False
    mock_resp_fail = Response()
    try:
        await verify_email_change_endpoint(req=bad_verify_req, request=None, response=mock_resp_fail, current_user=auth_ctx_chg)
    except HTTPException as e:
        bad_otp_caught = (e.status_code == 400 and "invalid" in e.detail.lower())
    check("Verify email change rejects incorrect OTP", bad_otp_caught)

    # 4e. Verify with correct OTP using direct OTP hash from DB
    test_otp = "123456"
    test_otp_hash = hash_token_or_otp(test_otp)
    exp_iso = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    await UserDatabase.set_email_change_otp(
        user_id=chg_user["id"],
        new_email=new_email,
        otp_hash=test_otp_hash,
        expires_at_iso=exp_iso,
    )

    mock_resp_ok = Response()
    verify_req = VerifyEmailChangeRequest(new_email=new_email, otp=test_otp)
    res_verify = await verify_email_change_endpoint(req=verify_req, request=None, response=mock_resp_ok, current_user=auth_ctx_chg)
    check("Verify email change returns updated user object with new email", res_verify.user.email == new_email.lower())

    # Verify DB state after email change
    db_chg_updated = await UserDatabase.get_user_by_id(chg_user["id"])
    check("Database primary email updated to new email", db_chg_updated.get("email") == new_email.lower())
    check("Pending email field cleared in database", db_chg_updated.get("pending_email") is None)
    check("Email change OTP hash cleared in database", db_chg_updated.get("email_change_otp_hash") is None)
    check("Email remains verified after change", db_chg_updated.get("email_verified") is True)

    # ------------------------------------------------------------------
    # 5. Active Sessions & Individual Revocation
    # ------------------------------------------------------------------
    print("\n--- 5. Active Sessions & Individual Revocation ---")
    sess_owner_id = str(uuid.uuid4())
    sess_owner_email = f"sess_owner_{uuid.uuid4().hex[:6]}@example.com"
    sess_owner = await UserDatabase.create_user(
        name="Session Owner",
        email=sess_owner_email,
        password_hash=hash_password("Pass123!"),
        email_verified=True,
    )

    # Create 3 sessions
    s1_id = f"jti_dev_1_{uuid.uuid4().hex[:6]}"
    s2_id = f"jti_dev_2_{uuid.uuid4().hex[:6]}"
    s3_id = f"jti_dev_3_{uuid.uuid4().hex[:6]}"
    await UserDatabase.create_session(sess_owner["id"], f"hash_d1_{uuid.uuid4().hex[:6]}", s1_id, int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()))
    await UserDatabase.create_session(sess_owner["id"], f"hash_d2_{uuid.uuid4().hex[:6]}", s2_id, int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()))
    await UserDatabase.create_session(sess_owner["id"], f"hash_d3_{uuid.uuid4().hex[:6]}", s3_id, int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()))

    mock_req = MagicMock(spec=Request)
    mock_req.cookies = {}
    mock_req.headers = {}
    auth_ctx_sess = {
        "id": sess_owner["id"],
        "user_id": sess_owner["id"],
        "email": sess_owner_email,
        "name": "Session Owner",
        "role": "user",
        "email_verified": True,
        "token_jti": s1_id,
    }

    # List active sessions
    sessions_list = await list_sessions_endpoint(request=mock_req, current_user=auth_ctx_sess)
    check("List sessions returns all 3 active sessions", len(sessions_list) == 3)

    current_item = next((s for s in sessions_list if s.is_current), None)
    check("Current session is correctly identified", current_item is not None)

    # Revoke individual session (s2_id)
    res_rev = await revoke_session_endpoint(session_id=s2_id, current_user=auth_ctx_sess)
    check("Revoke individual session returns success message", "success" in res_rev.message.lower())

    # List again to confirm only 2 remain active
    sessions_list_after = await list_sessions_endpoint(request=mock_req, current_user=auth_ctx_sess)
    check("Active sessions list now contains 2 sessions after single revocation", len(sessions_list_after) == 2)
    check("Revoked session s2_id is not in active list", not any(s.id == s2_id for s in sessions_list_after))

    # ------------------------------------------------------------------
    # 6. Revoke All User Sessions
    # ------------------------------------------------------------------
    print("\n--- 6. Revoke All User Sessions (POST /auth/sessions/revoke-all) ---")
    mock_resp_rev_all = Response()
    res_rev_all = await revoke_all_sessions_endpoint(response=mock_resp_rev_all, current_user=auth_ctx_sess)
    check("Revoke all sessions returns success status", "success" in res_rev_all.message.lower())

    # Check cookies cleared
    rev_cookie_headers = [v.decode("latin1") for k, v in mock_resp_rev_all.raw_headers if k == b"set-cookie"]
    del_acc = next((h for h in rev_cookie_headers if settings.COOKIE_ACCESS_NAME in h), "")
    check("Revoke all sessions clears access cookie", "Max-Age=0" in del_acc or "expires=" in del_acc.lower())

    # Check active sessions in DB
    remaining = await UserDatabase.list_active_sessions(sess_owner["id"])
    check("All sessions are revoked in the database (active count == 0)", len(remaining) == 0)

    # ------------------------------------------------------------------
    # 7. Account Deletion
    # ------------------------------------------------------------------
    print("\n--- 7. Account Deletion (DELETE /auth/account) ---")
    del_user_id = str(uuid.uuid4())
    del_user_email = f"del_user_{uuid.uuid4().hex[:6]}@example.com"
    del_user = await UserDatabase.create_user(
        name="Account To Delete",
        email=del_user_email,
        password_hash=hash_password("DeletePass123!"),
        email_verified=True,
    )
    del_jti = f"jti_del_1_{uuid.uuid4().hex[:6]}"
    await UserDatabase.create_session(del_user["id"], f"hash_del_1_{uuid.uuid4().hex[:6]}", del_jti, int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()))

    auth_ctx_del = {
        "id": del_user["id"],
        "user_id": del_user["id"],
        "email": del_user_email,
        "name": "Account To Delete",
        "role": "user",
        "email_verified": True,
        "token_jti": del_jti,
    }

    # 7a. Rejection without confirmation = 'DELETE'
    no_conf_req = DeleteAccountRequest(confirmation="NO", password="DeletePass123!")
    no_conf_caught = False
    try:
        await delete_account_endpoint(req=no_conf_req, response=Response(), current_user=auth_ctx_del)
    except HTTPException as e:
        no_conf_caught = (e.status_code == 400 and "delete" in e.detail.lower())
    check("Delete account requires explicit confirmation='DELETE'", no_conf_caught)

    # 7b. Rejection with wrong password
    wrong_del_pw = DeleteAccountRequest(confirmation="DELETE", password="WrongPassword!")
    wrong_del_caught = False
    try:
        await delete_account_endpoint(req=wrong_del_pw, response=Response(), current_user=auth_ctx_del)
    except HTTPException as e:
        wrong_del_caught = (e.status_code == 400 and "incorrect" in e.detail.lower())
    check("Delete account rejects incorrect password", wrong_del_caught)

    # 7c. Successful account deletion
    mock_del_resp = Response()
    del_req = DeleteAccountRequest(confirmation="DELETE", password="DeletePass123!")
    res_del = await delete_account_endpoint(req=del_req, response=mock_del_resp, current_user=auth_ctx_del)
    check("Delete account returns successful purge message", "deleted" in res_del.message.lower())

    # Check DB purge
    purged_user = await UserDatabase.get_user_by_id(del_user["id"])
    check("User document permanently removed from database", purged_user is None)

    purged_sessions = await UserDatabase.list_active_sessions(del_user["id"])
    check("All associated sessions removed from database", len(purged_sessions) == 0)

    # 7d. OAuth user deletion without password
    oauth_del_user, _ = await UserDatabase.find_or_create_oauth_user(
        provider="google",
        provider_user_id=f"goog_del_{uuid.uuid4().hex[:8]}",
        email=f"oauth_del_{uuid.uuid4().hex[:6]}@gmail.com",
        name="OAuth Delete User",
    )
    auth_ctx_oauth_del = {
        "id": oauth_del_user["id"],
        "user_id": oauth_del_user["id"],
        "email": oauth_del_user["email"],
        "name": oauth_del_user["name"],
        "role": "user",
        "email_verified": True,
        "token_jti": "jti_del_oauth",
    }
    oauth_del_req = DeleteAccountRequest(confirmation="DELETE", password="")
    res_oauth_del = await delete_account_endpoint(req=oauth_del_req, response=Response(), current_user=auth_ctx_oauth_del)
    check("OAuth user without password can delete account with confirmation='DELETE'", "deleted" in res_oauth_del.message.lower())

    purged_oauth_user = await UserDatabase.get_user_by_id(oauth_del_user["id"])
    check("OAuth user document permanently removed from database", purged_oauth_user is None)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 70)
    print(f" Phase 5 Test Results: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_all_phase5_tests())
