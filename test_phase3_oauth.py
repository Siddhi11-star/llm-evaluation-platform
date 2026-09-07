"""
Comprehensive Automated Test Suite for JudgeAI Phase 3 Authentication: Google & GitHub OAuth.
Tests: CSRF State Cryptography, Google OpenID Connect flow, GitHub OAuth flow,
User creation, Duplicate Email linking, email_verified preservation, error redirects,
and unconfigured credential fallbacks.
"""

import sys
import os
import asyncio
import uuid
import urllib.parse
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
    decode_access_token,
)
from backend.auth_users.db import UserDatabase
from backend.auth_users.oauth_service import OAuthService, OAuthError
from backend.auth_users.router import (
    google_login,
    google_callback,
    github_login,
    github_callback,
)
from fastapi.responses import RedirectResponse


async def run_all_phase3_tests():
    print("=" * 70)
    print("       ⚖️  JudgeAI Phase 3 Google & GitHub OAuth Test Suite       ")
    print("=" * 70)

    passed = 0
    failed = 0

    def check(desc: str, condition: bool):
        nonlocal passed, failed
        if condition:
            print(f"  [✓ PASS] {desc}")
            passed += 1
        else:
            print(f"  [✗ FAIL] {desc}")
            failed += 1

    await UserDatabase.connect()

    # ------------------------------------------------------------------
    # 1. Stateless HMAC-SHA256 CSRF State Cryptography
    # ------------------------------------------------------------------
    print("\n--- 1. CSRF State Cryptography & Security ---")

    google_state = OAuthService.generate_oauth_state("google")
    check("Generated signed state token for Google", bool(google_state and "." in google_state))

    valid_google = OAuthService.verify_oauth_state(google_state, "google")
    check("Valid Google state token verified successfully", valid_google is True)

    mismatched_provider = OAuthService.verify_oauth_state(google_state, "github")
    check("Mismatched provider in state rejected", mismatched_provider is False)

    tampered_state = google_state[:-4] + "dead"
    check("Tampered state token signature rejected", OAuthService.verify_oauth_state(tampered_state, "google") is False)

    check("Malformed state token rejected", OAuthService.verify_oauth_state("invalid_state_string", "google") is False)

    # Test expired state
    with patch("time.time", return_value=1000000):
        old_state = OAuthService.generate_oauth_state("google")
    with patch("time.time", return_value=1000000 + (settings.OAUTH_STATE_EXPIRY_MINUTES * 60) + 10):
        check("Expired state token rejected", OAuthService.verify_oauth_state(old_state, "google") is False)

    # ------------------------------------------------------------------
    # 2. Google OAuth 2.0 / OpenID Connect Service Logic
    # ------------------------------------------------------------------
    print("\n--- 2. Google OAuth Service & Exchange ---")

    with patch.object(settings, "GOOGLE_CLIENT_ID", "mock-google-client-id"), \
         patch.object(settings, "GOOGLE_CLIENT_SECRET", "mock-google-client-secret"), \
         patch.object(settings, "GOOGLE_REDIRECT_URI", "http://localhost:8004/auth/google/callback"):

        auth_url = OAuthService.get_google_auth_url(google_state)
        check("Google auth URL contains accounts.google.com", "accounts.google.com/o/oauth2/v2/auth" in auth_url)
        check("Google auth URL contains client_id", "mock-google-client-id" in auth_url)
        check("Google auth URL contains openid email profile scope", "openid" in auth_url and "email" in auth_url)
        check("Google auth URL contains CSRF state", urllib.parse.quote(google_state) in auth_url or google_state in auth_url)

        # Mock successful token and userinfo exchange
        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.json.return_value = {"access_token": "mock-google-access-token"}

        mock_userinfo_resp = MagicMock()
        mock_userinfo_resp.status_code = 200
        mock_userinfo_resp.json.return_value = {
            "sub": "google-user-12345",
            "name": "Sarah Connor",
            "email": "sarah.connor@example.com",
            "picture": "https://example.com/sarah.jpg",
            "email_verified": True,
        }

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_token_resp), \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_userinfo_resp):
            profile = await OAuthService.exchange_google_code("mock-auth-code")
            check("Google exchange returned email", profile["email"] == "sarah.connor@example.com")
            check("Google exchange returned verified status", profile["email_verified"] is True)
            check("Google exchange returned provider_user_id", profile["provider_user_id"] == "google-user-12345")
            check("Google exchange returned avatar_url", profile["avatar_url"] == "https://example.com/sarah.jpg")

        # Mock unverified Google email
        mock_unverified_resp = MagicMock()
        mock_unverified_resp.status_code = 200
        mock_unverified_resp.json.return_value = {
            "sub": "google-user-67890",
            "name": "Unverified User",
            "email": "unverified@example.com",
            "email_verified": False,
        }
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_token_resp), \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_unverified_resp):
            rejected = False
            try:
                await OAuthService.exchange_google_code("mock-code")
            except OAuthError:
                rejected = True
            check("Unverified Google email raises OAuthError", rejected)

    # ------------------------------------------------------------------
    # 3. GitHub OAuth Service Logic
    # ------------------------------------------------------------------
    print("\n--- 3. GitHub OAuth Service & Email Resolution ---")

    github_state = OAuthService.generate_oauth_state("github")
    check("Generated signed state token for GitHub", bool(github_state and "." in github_state))

    with patch.object(settings, "GITHUB_CLIENT_ID", "mock-github-client-id"), \
         patch.object(settings, "GITHUB_CLIENT_SECRET", "mock-github-client-secret"), \
         patch.object(settings, "GITHUB_REDIRECT_URI", "http://localhost:8004/auth/github/callback"):

        gh_auth_url = OAuthService.get_github_auth_url(github_state)
        check("GitHub auth URL contains github.com/login/oauth", "github.com/login/oauth/authorize" in gh_auth_url)
        check("GitHub auth URL contains client_id", "mock-github-client-id" in gh_auth_url)
        check("GitHub auth URL requests read:user user:email", "read%3Auser" in gh_auth_url or "read:user" in gh_auth_url)

        # Mock GitHub exchange with /user and /user/emails
        mock_gh_token_resp = MagicMock()
        mock_gh_token_resp.status_code = 200
        mock_gh_token_resp.json.return_value = {"access_token": "mock-gh-access-token"}

        mock_gh_user_resp = MagicMock()
        mock_gh_user_resp.status_code = 200
        mock_gh_user_resp.json.return_value = {
            "id": 987654,
            "login": "octocat",
            "name": "The Octocat",
            "avatar_url": "https://avatars.githubusercontent.com/u/987654",
            "email": None,  # Private email on profile
        }

        mock_gh_emails_resp = MagicMock()
        mock_gh_emails_resp.status_code = 200
        mock_gh_emails_resp.json.return_value = [
            {"email": "unverified@github.com", "primary": False, "verified": False},
            {"email": "octocat@github.com", "primary": True, "verified": True},
        ]

        async def mock_gh_get(url, **kwargs):
            if "emails" in url:
                return mock_gh_emails_resp
            return mock_gh_user_resp

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_gh_token_resp), \
             patch("httpx.AsyncClient.get", side_effect=mock_gh_get):
            gh_profile = await OAuthService.exchange_github_code("mock-gh-code")
            check("GitHub exchange resolved primary verified email", gh_profile["email"] == "octocat@github.com")
            check("GitHub exchange set email_verified=True", gh_profile["email_verified"] is True)
            check("GitHub exchange returned github_id", gh_profile["provider_user_id"] == "987654")

    # ------------------------------------------------------------------
    # 4. User Database OAuth Creation & Account Linking
    # ------------------------------------------------------------------
    print("\n--- 4. MongoDB OAuth User Creation & Account Linking ---")

    new_oauth_email = f"oauth_user_{uuid.uuid4().hex[:6]}@example.com"
    user_doc, is_new = await UserDatabase.find_or_create_oauth_user(
        provider="google",
        provider_user_id="google-id-111",
        email=new_oauth_email,
        name="New Google User",
        avatar_url="https://example.com/avatar.png"
    )
    check("New OAuth user created with is_new=True", is_new is True)
    check("OAuth user has email_verified=True immediately", user_doc.get("email_verified") is True)
    check("OAuth user has onboarding_completed=False initially", user_doc.get("onboarding_completed") is False)
    check("OAuth user has google_id recorded", user_doc.get("google_id") == "google-id-111")
    check("OAuth user has providers list containing google", "google" in user_doc.get("providers", []))

    # Existing password user linking to OAuth account
    pw_email = f"pw_user_{uuid.uuid4().hex[:6]}@example.com"
    existing_pw_user = await UserDatabase.create_user(
        name="Existing User",
        email=pw_email,
        password_hash=hash_password("Password123!"),
        email_verified=False  # initially unverified
    )
    check("Created existing password user", existing_pw_user is not None)

    linked_doc, linked_is_new = await UserDatabase.find_or_create_oauth_user(
        provider="github",
        provider_user_id="github-id-222",
        email=pw_email,
        name="Existing User Updated",
        avatar_url="https://github.com/avatar.png"
    )
    check("Existing user identified on OAuth login (is_new=False)", linked_is_new is False)
    check("Existing user ID preserved upon linking", linked_doc["id"] == existing_pw_user["id"])
    check("OAuth login verified user's previously unverified email", linked_doc.get("email_verified") is True)
    check("Existing password hash preserved upon OAuth link", linked_doc.get("password_hash") is not None)
    check("Existing user has github_id attached", linked_doc.get("github_id") == "github-id-222")
    check("Providers list updated with github", "github" in linked_doc.get("providers", []))

    # ------------------------------------------------------------------
    # 5. OAuth Router Endpoints & Redirect Responses
    # ------------------------------------------------------------------
    print("\n--- 5. Router OAuth Endpoints & Callback Redirects ---")

    # Unconfigured Google OAuth redirect
    with patch.object(OAuthService, "is_google_configured", return_value=False):
        resp: RedirectResponse = await google_login()
        check("Unconfigured Google redirects to /login with error", "/login?error=" in resp.headers["location"])

    # Configured Google OAuth redirect
    with patch.object(OAuthService, "is_google_configured", return_value=True), \
         patch.object(OAuthService, "get_google_auth_url", return_value="https://accounts.google.com/test"):
        resp: RedirectResponse = await google_login()
        check("Configured Google redirects to Google consent URL", "accounts.google.com" in resp.headers["location"])

    # Callback with OAuth Error (user denied consent)
    resp: RedirectResponse = await google_callback(error="access_denied")
    check("OAuth cancellation redirects to /login with cancelled message", "/login?error=" in resp.headers["location"])

    # Callback with Invalid CSRF State
    resp: RedirectResponse = await google_callback(code="valid-code", state="invalid-state")
    check("Invalid CSRF state redirects to /login with security error", "/login?error=" in resp.headers["location"])

    # Callback with Valid Code & State (Full Flow)
    mock_exchange_profile = {
        "provider": "google",
        "provider_user_id": "sub-999",
        "email": f"success_{uuid.uuid4().hex[:6]}@example.com",
        "name": "Success User",
        "avatar_url": None,
        "email_verified": True,
    }
    valid_state = OAuthService.generate_oauth_state("google")
    with patch.object(OAuthService, "exchange_google_code", new_callable=AsyncMock, return_value=mock_exchange_profile):
        resp: RedirectResponse = await google_callback(code="good-code", state=valid_state)
        location = resp.headers["location"]
        check("Successful Google OAuth callback redirects with JWT token", "/login?token=" in location)
        check("New user param (is_new=1) included in redirect", "is_new=1" in location)

        # Validate JWT token contents
        token_str = location.split("token=")[1].split("&")[0]
        claims = decode_access_token(token_str)
        check("Issued JWT contains email claim", claims.get("email") == mock_exchange_profile["email"])
        check("Issued JWT has email_verified=True claim", claims.get("email_verified") is True)

    # ------------------------------------------------------------------
    # 6. GitHub Router Flow
    # ------------------------------------------------------------------
    print("\n--- 6. GitHub Router Endpoints & Flow ---")

    with patch.object(OAuthService, "is_github_configured", return_value=False):
        gh_resp: RedirectResponse = await github_login()
        check("Unconfigured GitHub redirects to /login with error", "/login?error=" in gh_resp.headers["location"])

    valid_gh_state = OAuthService.generate_oauth_state("github")
    mock_gh_profile = {
        "provider": "github",
        "provider_user_id": "gh-777",
        "email": f"gh_success_{uuid.uuid4().hex[:6]}@example.com",
        "name": "GitHub Dev",
        "avatar_url": "https://avatars.github.com/u/777",
        "email_verified": True,
    }
    with patch.object(OAuthService, "exchange_github_code", new_callable=AsyncMock, return_value=mock_gh_profile):
        gh_cb_resp: RedirectResponse = await github_callback(code="good-gh-code", state=valid_gh_state)
        gh_location = gh_cb_resp.headers["location"]
        check("Successful GitHub OAuth callback redirects with JWT token", "/login?token=" in gh_location)
        check("New GitHub user param included", "is_new=1" in gh_location)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"  Phase 3 Test Results: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 70)

    if failed == 0:
        print("\n🎉 ALL PHASE 3 GOOGLE & GITHUB OAUTH TESTS PASSED SUCCESSFULLY!\n")
    else:
        print(f"\n❌ {failed} TEST(S) FAILED.\n")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_all_phase3_tests())
