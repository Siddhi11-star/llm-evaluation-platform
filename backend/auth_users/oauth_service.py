"""
OAuth Service for JudgeAI Authentication (Phase 3).
Handles Google OAuth 2.0 / OpenID Connect and GitHub OAuth flows,
stateless HMAC-SHA256 CSRF state tokens, code-to-token exchanges,
and user profile & email resolution.
"""

import hmac
import hashlib
import base64
import json
import time
import secrets
import logging
import urllib.parse
from typing import Dict, Any, Optional
import httpx

try:
    from .config import settings
except ImportError:
    from config import settings

logger = logging.getLogger("auth.oauth")


class OAuthError(Exception):
    """Custom exception raised for OAuth exchange or verification failures."""
    pass


class OAuthService:
    @staticmethod
    def _get_signing_key() -> bytes:
        """Returns the cryptographic secret key for signing CSRF states."""
        return settings.JWT_SECRET_KEY.encode("utf-8")

    @classmethod
    def generate_oauth_state(cls, provider: str, return_url: Optional[str] = None) -> str:
        """
        Generates a stateless, tamper-proof, time-limited CSRF state token.
        Payload includes timestamp, nonce, provider, and optional return path.
        """
        payload = {
            "p": provider.lower().strip(),
            "t": int(time.time()),
            "n": secrets.token_hex(8),
            "r": return_url or "",
        }
        json_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        raw_b64 = base64.urlsafe_b64encode(json_bytes).decode("utf-8").rstrip("=")

        sig = hmac.new(
            cls._get_signing_key(),
            raw_b64.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return f"{raw_b64}.{sig}"

    @classmethod
    def verify_oauth_state(cls, state: Optional[str], expected_provider: str) -> bool:
        """
        Verifies CSRF state token signature, provider matching, and expiration window.
        """
        if not state or "." not in state:
            return False

        try:
            raw_b64, sig = state.split(".", 1)
            # Recompute expected signature
            expected_sig = hmac.new(
                cls._get_signing_key(),
                raw_b64.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(sig, expected_sig):
                logger.warning(f"OAuth state signature mismatch for provider {expected_provider}")
                return False

            # Add back base64 padding if needed
            padding = 4 - (len(raw_b64) % 4)
            if padding < 4:
                raw_b64 += "=" * padding

            payload_bytes = base64.urlsafe_b64decode(raw_b64.encode("utf-8"))
            payload = json.loads(payload_bytes.decode("utf-8"))

            if payload.get("p") != expected_provider.lower().strip():
                logger.warning(f"OAuth state provider mismatch: expected {expected_provider}, got {payload.get('p')}")
                return False

            timestamp = int(payload.get("t", 0))
            max_age_sec = settings.OAUTH_STATE_EXPIRY_MINUTES * 60
            if time.time() - timestamp > max_age_sec:
                logger.warning(f"OAuth state expired for provider {expected_provider}")
                return False

            return True
        except Exception as e:
            logger.warning(f"Error parsing OAuth state token: {e}")
            return False

    # ----------------------------------------------------------------------
    # Google OAuth 2.0 / OpenID Connect
    # ----------------------------------------------------------------------

    @classmethod
    def is_google_configured(cls) -> bool:
        """Checks if Google OAuth credentials are present."""
        return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)

    @classmethod
    def get_google_auth_url(cls, state: str) -> str:
        """Constructs Google OAuth 2.0 consent URL."""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    @classmethod
    async def exchange_google_code(cls, code: str) -> Dict[str, Any]:
        """
        Exchanges Google authorization code for access token and retrieves user profile.
        Returns normalized user profile dict.
        """
        if not cls.is_google_configured():
            raise OAuthError("Google OAuth is not configured on this server.")

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(token_url, data=data)
            if token_resp.status_code != 200:
                logger.error(f"Google token exchange failed: {token_resp.status_code} {token_resp.text}")
                raise OAuthError("Failed to authenticate with Google.")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise OAuthError("Google response did not contain an access token.")

            # Fetch User Profile
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            user_resp = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if user_resp.status_code != 200:
                logger.error(f"Google userinfo request failed: {user_resp.status_code} {user_resp.text}")
                raise OAuthError("Failed to fetch user profile from Google.")

            profile = user_resp.json()

        email = (profile.get("email") or "").lower().strip()
        if not email:
            raise OAuthError("Google account does not have an associated email.")

        email_verified = bool(profile.get("email_verified", False))
        if not email_verified:
            raise OAuthError("Your Google email is not verified.")

        return {
            "provider": "google",
            "provider_user_id": str(profile.get("sub", "")),
            "email": email,
            "name": profile.get("name") or email.split("@")[0],
            "avatar_url": profile.get("picture"),
            "email_verified": True,
        }

    # ----------------------------------------------------------------------
    # GitHub OAuth
    # ----------------------------------------------------------------------

    @classmethod
    def is_github_configured(cls) -> bool:
        """Checks if GitHub OAuth credentials are present."""
        return bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET)

    @classmethod
    def get_github_auth_url(cls, state: str) -> str:
        """Constructs GitHub OAuth authorization URL."""
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
            "scope": "read:user user:email",
            "state": state,
        }
        return f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"

    @classmethod
    async def exchange_github_code(cls, code: str) -> Dict[str, Any]:
        """
        Exchanges GitHub authorization code for access token and retrieves user profile
        and verified primary email.
        """
        if not cls.is_github_configured():
            raise OAuthError("GitHub OAuth is not configured on this server.")

        token_url = "https://github.com/login/oauth/access_token"
        data = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        }
        headers = {"Accept": "application/json"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(token_url, data=data, headers=headers)
            if token_resp.status_code != 200:
                logger.error(f"GitHub token exchange failed: {token_resp.status_code} {token_resp.text}")
                raise OAuthError("Failed to authenticate with GitHub.")

            token_data = token_resp.json()
            if "error" in token_data:
                logger.error(f"GitHub token response error: {token_data}")
                raise OAuthError(token_data.get("error_description") or "GitHub authorization failed.")

            access_token = token_data.get("access_token")
            if not access_token:
                raise OAuthError("GitHub response did not contain an access token.")

            # Fetch User Profile
            auth_headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "JudgeAI-Auth-Service",
            }
            user_resp = await client.get("https://api.github.com/user", headers=auth_headers)
            if user_resp.status_code != 200:
                logger.error(f"GitHub user request failed: {user_resp.status_code} {user_resp.text}")
                raise OAuthError("Failed to fetch user profile from GitHub.")
            gh_user = user_resp.json()

            # Fetch User Emails (to get verified primary email)
            emails_resp = await client.get("https://api.github.com/user/emails", headers=auth_headers)
            emails_data = emails_resp.json() if emails_resp.status_code == 200 else []

        # Find primary verified email or first verified email
        verified_email = None
        if isinstance(emails_data, list):
            # First priority: primary and verified
            for e in emails_data:
                if e.get("primary") and e.get("verified") and e.get("email"):
                    verified_email = e["email"].lower().strip()
                    break
            # Second priority: any verified email
            if not verified_email:
                for e in emails_data:
                    if e.get("verified") and e.get("email"):
                        verified_email = e["email"].lower().strip()
                        break

        # Fallback to public email if available
        if not verified_email and gh_user.get("email"):
            verified_email = gh_user["email"].lower().strip()

        if not verified_email:
            raise OAuthError("No verified email address found on your GitHub account.")

        name = gh_user.get("name") or gh_user.get("login") or verified_email.split("@")[0]
        avatar_url = gh_user.get("avatar_url")
        gh_id = str(gh_user.get("id", ""))

        return {
            "provider": "github",
            "provider_user_id": gh_id,
            "email": verified_email,
            "name": name,
            "avatar_url": avatar_url,
            "email_verified": True,
        }
