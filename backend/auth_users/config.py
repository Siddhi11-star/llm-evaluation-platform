"""
Configuration settings for JudgeAI Auth Service (Port 8004) - Phase 1, 2, 3 & 4.
Explicitly loads .env from project root.
"""

import os
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

# Explicitly load .env file from project root if present
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE)
else:
    load_dotenv()


class AuthSettings:
    AUTH_HOST: str = os.getenv("AUTH_HOST", "0.0.0.0")
    AUTH_PORT: int = int(os.getenv("AUTH_PORT", "8004"))

    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_AUTH_DB_NAME", os.getenv("MONGODB_DB_NAME", "judgeai_auth"))
    MONGODB_AUTH_DB_NAME: str = os.getenv("MONGODB_AUTH_DB_NAME", os.getenv("MONGODB_DB_NAME", "judgeai_auth"))

    # JWT & Session Configuration (Phase 4 Hardening)
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "judgeai-dev-secret-key-change-in-production-e938bf8c991a47290bc"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))  # 15 min short-lived access
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))        # 7 days long-lived session

    # HTTP-only Cookie Settings
    COOKIE_ACCESS_NAME: str = "judgeai_access_token"
    COOKIE_REFRESH_NAME: str = "judgeai_refresh_token"
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1", "yes")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    COOKIE_DOMAIN: Optional[str] = os.getenv("COOKIE_DOMAIN", None)

    # Rate Limiting Policies (Phase 4)
    RATE_LIMIT_LOGIN_MAX: int = int(os.getenv("RATE_LIMIT_LOGIN_MAX", "5"))
    RATE_LIMIT_LOGIN_WINDOW_SEC: int = int(os.getenv("RATE_LIMIT_LOGIN_WINDOW_SEC", "60"))
    RATE_LIMIT_OTP_MAX: int = int(os.getenv("RATE_LIMIT_OTP_MAX", "5"))
    RATE_LIMIT_OTP_WINDOW_SEC: int = int(os.getenv("RATE_LIMIT_OTP_WINDOW_SEC", "60"))
    RATE_LIMIT_FORGOT_MAX: int = int(os.getenv("RATE_LIMIT_FORGOT_MAX", "5"))
    RATE_LIMIT_FORGOT_WINDOW_SEC: int = int(os.getenv("RATE_LIMIT_FORGOT_WINDOW_SEC", "3600"))

    # Resend Email Integration
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "").strip()
    RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev").strip()
    RESEND_FROM_NAME: str = os.getenv("RESEND_FROM_NAME", "JudgeAI").strip()

    # SMTP Fallback Email Integration (Gmail, Sendgrid, etc.)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "").strip()
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "").strip()
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "").strip()
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "").strip()
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    # Developer test bypass for OTP (allows 123456 / 000000 when external mailers are in sandbox)
    DEV_BYPASS_OTP: bool = os.getenv("DEV_BYPASS_OTP", "true").lower() in ("true", "1", "yes")

    # OTP & Password Reset Security Policies
    EMAIL_OTP_EXPIRY_MINUTES: int = int(os.getenv("EMAIL_OTP_EXPIRY_MINUTES", "10"))
    EMAIL_OTP_RESEND_COOLDOWN_SECONDS: int = int(os.getenv("EMAIL_OTP_RESEND_COOLDOWN_SECONDS", "60"))
    EMAIL_OTP_MAX_ATTEMPTS: int = int(os.getenv("EMAIL_OTP_MAX_ATTEMPTS", "5"))
    PASSWORD_RESET_EXPIRY_MINUTES: int = int(os.getenv("PASSWORD_RESET_EXPIRY_MINUTES", "30"))
    PASSWORD_RESET_MAX_ATTEMPTS: int = int(os.getenv("PASSWORD_RESET_MAX_ATTEMPTS", "5"))

    # Frontend URL for Password Reset Links and OAuth Redirects
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8443").rstrip("/")

    # Google OAuth 2.0 / OpenID Connect
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8004/auth/google/callback"
    ).strip()

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "").strip()
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
    GITHUB_REDIRECT_URI: str = os.getenv(
        "GITHUB_REDIRECT_URI",
        "http://localhost:8004/auth/github/callback"
    ).strip()

    # CSRF State Expiry in Minutes
    OAUTH_STATE_EXPIRY_MINUTES: int = int(os.getenv("OAUTH_STATE_EXPIRY_MINUTES", "10"))

    FRONTEND_URLS: List[str] = [
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = AuthSettings()
