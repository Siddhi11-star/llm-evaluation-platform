"""
Phase 4 Automated Security Hardening Test Suite for JudgeAI Authentication.
Tests:
1. Short-lived Access Token (15m) & Long-lived Refresh Token (7d) Cryptography & Claims
2. HTTP-Only Cookie Setting & Clearing
3. Server-Side Session Persistence & Refresh Token Rotation
4. Server-Side Session Revocation on Logout & Password Reset
5. In-Memory Sliding-Window Rate Limiting & Retry-After Enforcement
6. Dual-Mode Authentication Middleware (HTTP-only Cookie + Bearer Fallback)
"""

import asyncio
import os
import sys
import uuid
import time
from unittest.mock import MagicMock

from backend.auth_users.config import settings
from backend.auth_users.db import UserDatabase
from backend.auth_users.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    hash_token_or_otp,
)
from backend.auth_users.rate_limiter import sliding_window_rate_limiter, enforce_rate_limit
from backend.auth_users.router import (
    router,
    refresh_token_endpoint,
    logout_endpoint,
    LoginRequest,
    SignupRequest,
    VerifyEmailRequest,
    ResetPasswordRequest,
)
from backend.shared.auth_middleware import get_current_authenticated_user, require_verified_user
from fastapi import HTTPException, Response, Request
from starlette.datastructures import Headers


async def run_all_phase4_tests():
    print("=" * 70)
    print("       JudgeAI Phase 4 Auth Security Hardening Test Suite      ")
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
    # 1. Access & Refresh Token Cryptography & Types
    # ------------------------------------------------------------------
    print("\n--- 1. Token Lifecycles, Claims & Types ---")

    test_uid = str(uuid.uuid4())
    test_email = "security.tester@example.com"

    access_tok = create_access_token(subject=test_uid, email=test_email)
    acc_claims = decode_access_token(access_tok)
    check("Access token contains type='access'", acc_claims.get("type") == "access")
    check("Access token expiration is <= 15 minutes", (acc_claims["exp"] - acc_claims["iat"]) <= 15 * 60 + 5)

    refresh_tok = create_refresh_token(subject=test_uid, email=test_email)
    ref_claims = decode_refresh_token(refresh_tok)
    check("Refresh token contains type='refresh'", ref_claims.get("type") == "refresh")
    check("Refresh token contains jti session identifier", bool(ref_claims.get("jti")))
    check("Refresh token expiration is >= 7 days", (ref_claims["exp"] - ref_claims["iat"]) >= 7 * 24 * 3600 - 5)

    # Cross-decoding protection
    try:
        decode_refresh_token(access_tok)
        acc_as_ref = False
    except HTTPException:
        acc_as_ref = True
    check("decode_refresh_token rejects access token", acc_as_ref)

    # Auth middleware rejects refresh token
    try:
        req_ref = MagicMock(spec=Request)
        req_ref.cookies = {}
        await get_current_authenticated_user(request=req_ref, credentials=None, authorization=f"Bearer {refresh_tok}")
        ref_as_acc = False
    except HTTPException as e:
        ref_as_acc = (e.status_code == 401)
    check("Auth middleware rejects refresh token used for resource access", ref_as_acc)

    # ------------------------------------------------------------------
    # 2. HTTP-Only Cookie Setting & Clearing
    # ------------------------------------------------------------------
    print("\n--- 2. HTTP-Only Cookie Setting & Clearing ---")

    res = Response()
    set_auth_cookies(res, access_token=access_tok, refresh_token=refresh_tok)

    # Extract Set-Cookie headers from raw_headers
    set_cookie_headers = [v.decode("latin1") for k, v in res.raw_headers if k == b"set-cookie"]
    acc_cookie = next((h for h in set_cookie_headers if settings.COOKIE_ACCESS_NAME in h), "")
    ref_cookie = next((h for h in set_cookie_headers if settings.COOKIE_REFRESH_NAME in h), "")

    check("Response sets access token cookie", bool(acc_cookie))
    check("Response sets refresh token cookie", bool(ref_cookie))
    check("Cookies have HttpOnly attribute", "HttpOnly" in acc_cookie and "HttpOnly" in ref_cookie)
    check("Cookies have Path=/", "Path=/" in acc_cookie and "Path=/" in ref_cookie)
    check("Cookies have SameSite=lax", f"SameSite={settings.COOKIE_SAMESITE}" in acc_cookie.lower() or "samesite=lax" in acc_cookie.lower())

    # Test clear_auth_cookies
    logout_res = Response()
    clear_auth_cookies(logout_res)
    logout_cookie_headers = [v.decode("latin1") for k, v in logout_res.raw_headers if k == b"set-cookie"]
    del_acc = next((h for h in logout_cookie_headers if settings.COOKIE_ACCESS_NAME in h), "")
    del_ref = next((h for h in logout_cookie_headers if settings.COOKIE_REFRESH_NAME in h), "")
    check("Logout clears access token cookie", 'Max-Age=0' in del_acc or 'expires=' in del_acc.lower())
    check("Logout clears refresh token cookie", 'Max-Age=0' in del_ref or 'expires=' in del_ref.lower())

    # ------------------------------------------------------------------
    # 3. Session Persistence & Refresh Token Rotation
    # ------------------------------------------------------------------
    print("\n--- 3. Session Persistence & Refresh Token Rotation ---")

    sess_user_id = str(uuid.uuid4())
    sess_email = f"sess_user_{uuid.uuid4().hex[:6]}@example.com"
    user_record = await UserDatabase.create_user(
        name="Session Test User",
        email=sess_email,
        password_hash=hash_password("Password123!"),
        email_verified=True
    )

    init_refresh_token = create_refresh_token(subject=user_record["id"], email=sess_email)
    init_ref_claims = decode_refresh_token(init_refresh_token)
    init_ref_hash = hash_token_or_otp(init_refresh_token)

    # Store initial session
    await UserDatabase.create_session(
        user_id=user_record["id"],
        refresh_token_hash=init_ref_hash,
        session_id=init_ref_claims["jti"],
        expires_at=init_ref_claims["exp"]
    )

    stored_sess = await UserDatabase.get_session_by_token_hash(init_ref_hash)
    check("Session created in database", stored_sess is not None)
    check("Session retrievable by refresh token hash", stored_sess.get("user_id") == user_record["id"] if stored_sess else False)

    # Perform refresh via endpoint with HTTP-only cookie
    mock_refresh_req = MagicMock(spec=Request)
    mock_refresh_req.cookies = {settings.COOKIE_REFRESH_NAME: init_refresh_token}
    mock_refresh_res = Response()

    refresh_result = await refresh_token_endpoint(
        request=mock_refresh_req,
        response=mock_refresh_res,
        refresh_token_payload={"refresh_token": init_refresh_token}
    )

    check("POST /auth/refresh returns new access token", bool(refresh_result.get("access_token")))
    check("POST /auth/refresh returns user profile", refresh_result.get("user", {}).get("email") == sess_email)

    # Verify old refresh token is rotated (invalidated)
    old_sess_after_rot = await UserDatabase.get_session_by_token_hash(init_ref_hash)
    check("Old refresh token hash invalidated after rotation", old_sess_after_rot is None)

    # Attempt replay of rotated refresh token
    replay_blocked = False
    try:
        await refresh_token_endpoint(
            request=mock_refresh_req,
            response=Response(),
            refresh_token_payload={"refresh_token": init_refresh_token}
        )
    except HTTPException as e:
        if e.status_code == 401:
            replay_blocked = True
    check("Re-using already rotated refresh token rejected with 401", replay_blocked)

    # ------------------------------------------------------------------
    # 4. Server-Side Session Revocation on Logout & Password Reset
    # ------------------------------------------------------------------
    print("\n--- 4. Server-Side Session Revocation ---")

    new_refresh_token = refresh_result.get("refresh_token")
    new_ref_hash = hash_token_or_otp(new_refresh_token)

    # Revoke session directly
    await UserDatabase.revoke_session(new_ref_hash)
    revoked_sess = await UserDatabase.get_session_by_token_hash(new_ref_hash)
    check("Revoked session not returned by get_session_by_token_hash", revoked_sess is None)

    # Test logout endpoint revocation
    logout_refresh_token = create_refresh_token(subject=user_record["id"], email=sess_email)
    logout_ref_claims = decode_refresh_token(logout_refresh_token)
    logout_ref_hash = hash_token_or_otp(logout_refresh_token)
    await UserDatabase.create_session(
        user_id=user_record["id"],
        refresh_token_hash=logout_ref_hash,
        session_id=logout_ref_claims["jti"],
        expires_at=logout_ref_claims["exp"]
    )

    mock_logout_req = MagicMock(spec=Request)
    mock_logout_req.cookies = {settings.COOKIE_REFRESH_NAME: logout_refresh_token}
    mock_logout_res = Response()

    logout_out = await logout_endpoint(
        request=mock_logout_req,
        response=mock_logout_res,
        logout_payload={"refresh_token": logout_refresh_token}
    )
    check("POST /auth/logout returns success", logout_out.get("success") is True)

    # Revoke all sessions for user
    uniq_hash = f"hash_{uuid.uuid4().hex[:6]}"
    uniq_jti = f"jti_{uuid.uuid4().hex[:6]}"
    await UserDatabase.create_session(
        user_id=user_record["id"],
        refresh_token_hash=uniq_hash,
        session_id=uniq_jti,
        expires_at=int(time.time()) + 3600
    )
    await UserDatabase.revoke_all_user_sessions(user_record["id"])
    active_after_revoke = await UserDatabase.get_session_by_token_hash(uniq_hash)
    check("revoke_all_user_sessions invalidated active session", active_after_revoke is None)

    # ------------------------------------------------------------------
    # 5. Sliding-Window Rate Limiting
    # ------------------------------------------------------------------
    print("\n--- 5. Sliding-Window Rate Limiting ---")

    rate_key = f"test_rate_key_{uuid.uuid4().hex[:6]}"
    max_requests = 3
    window_sec = 10

    # 3 allowed
    for _ in range(max_requests):
        allowed, _ = sliding_window_rate_limiter.is_allowed(rate_key, max_requests, window_sec)
        check("Requests within limit allowed", allowed)

    # 4th request blocked
    allowed_4th, retry_after = sliding_window_rate_limiter.is_allowed(rate_key, max_requests, window_sec)
    check("Request exceeding limit blocked", not allowed_4th)
    check("Retry-After is positive integer", retry_after > 0)

    # Rate limiter reset
    sliding_window_rate_limiter.reset(rate_key)
    allowed_after_reset, _ = sliding_window_rate_limiter.is_allowed(rate_key, max_requests, window_sec)
    check("Resetting rate limit key immediately allows requests", allowed_after_reset)

    # Test enforce_rate_limit helper raises 429
    ip_key = f"action_{uuid.uuid4().hex[:6]}"
    rate_429_thrown = False
    try:
        for _ in range(3):
            enforce_rate_limit(action=ip_key, ip="192.168.1.100", max_requests=2, window_seconds=60)
    except HTTPException as e:
        if e.status_code == 429 and "Retry-After" in e.headers:
            rate_429_thrown = True
    check("enforce_rate_limit raises HTTP 429 with Retry-After header", rate_429_thrown)

    # ------------------------------------------------------------------
    # 6. Dual-Mode Authentication Middleware (Cookie + Bearer)
    # ------------------------------------------------------------------
    print("\n--- 6. Dual-Mode Authentication Middleware ---")

    dual_user_email = f"dual_user_{uuid.uuid4().hex[:6]}@example.com"
    dual_user = await UserDatabase.create_user(
        name="Dual Auth User",
        email=dual_user_email,
        password_hash=hash_password("Password123!"),
        email_verified=True
    )
    dual_access_token = create_access_token(
        subject=dual_user["id"],
        email=dual_user["email"],
        extra_claims={"name": "Dual Auth User", "email_verified": True}
    )

    # Mode A: Via HTTP-only cookie (no Bearer header)
    cookie_req = MagicMock(spec=Request)
    cookie_req.cookies = {settings.COOKIE_ACCESS_NAME: dual_access_token}
    cookie_req.headers = {}
    user_from_cookie = await get_current_authenticated_user(request=cookie_req, credentials=None, authorization=None)
    check("Auth middleware resolves user from HTTP-only cookie", user_from_cookie["id"] == dual_user["id"])

    # Mode B: Via Authorization Bearer header (no cookie)
    bearer_req = MagicMock(spec=Request)
    bearer_req.cookies = {}
    user_from_bearer = await get_current_authenticated_user(
        request=bearer_req,
        credentials=None,
        authorization=f"Bearer {dual_access_token}"
    )
    check("Auth middleware resolves user from Bearer header", user_from_bearer["id"] == dual_user["id"])

    # Mode C: require_verified_user blocks unverified
    unverified_user = await UserDatabase.create_user(
        name="Unverified User",
        email=f"unverified_{uuid.uuid4().hex[:6]}@example.com",
        password_hash=hash_password("Password123!"),
        email_verified=False
    )
    blocked_unverified = False
    try:
        await require_verified_user({"id": unverified_user["id"], "email": unverified_user["email"], "email_verified": False})
    except HTTPException as e:
        if e.status_code == 403:
            blocked_unverified = True
    check("require_verified_user rejects unverified user with 403", blocked_unverified)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"  Phase 4 Test Results: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 70)

    if failed == 0:
        print("\n[SUCCESS] ALL PHASE 4 AUTH SECURITY HARDENING TESTS PASSED SUCCESSFULLY!\n")
    else:
        print(f"\n[ERROR] {failed} TEST(S) FAILED.\n")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_all_phase4_tests())
