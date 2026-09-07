"""
Security utilities for password hashing, JWT token issuance/validation,
cryptographic OTP generation, password reset tokens, and HTTP-only cookie management.
"""

import hmac
import hashlib
import secrets
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from fastapi import HTTPException, status, Response
try:
    from .config import settings
except ImportError:
    from config import settings


def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using bcrypt with a salt round factor of 12.
    """
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored bcrypt hash.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def generate_numeric_otp(length: int = 6) -> str:
    """
    Generates a cryptographically secure numeric OTP of the specified length.
    """
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))


def generate_secure_reset_token() -> str:
    """
    Generates a cryptographically secure URL-safe random string for password resets.
    """
    return secrets.token_urlsafe(32)


def hash_token_or_otp(raw_value: str) -> str:
    """
    Computes a deterministic salted SHA-256 hash for secure token/OTP storage in MongoDB.
    Raw OTPs and reset tokens are NEVER stored in plaintext.
    """
    if not raw_value:
        raise ValueError("Value to hash cannot be empty.")
    salt = settings.JWT_SECRET_KEY.encode("utf-8")
    h = hashlib.sha256(raw_value.strip().encode("utf-8") + salt)
    return h.hexdigest()


def verify_token_or_otp(raw_value: str, stored_hash: str) -> bool:
    """
    Constant-time comparison of a submitted OTP/token against its stored SHA-256 hash.
    """
    if not raw_value or not stored_hash:
        return False
    try:
        calculated_hash = hash_token_or_otp(raw_value)
        return hmac.compare_digest(calculated_hash, stored_hash)
    except Exception:
        return False


def create_access_token(
    subject: str,
    email: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None
) -> str:
    """
    Issues a signed JWT access token containing subject, email, type='access', iat, and exp.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "email": email.lower().strip(),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: str,
    email: str,
    session_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Issues a signed JWT refresh token with long expiration (Phase 4).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "email": email.lower().strip(),
        "type": "refresh",
        "jti": session_id or secrets.token_hex(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and cryptographically validates a JWT access token.
    Raises HTTPException(401) on invalid signature, malformation, or expiry.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        sub: Optional[str] = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing required subject claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT refresh token (Phase 4).
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type: expected refresh token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: Optional[str] = None
):
    """
    Sets secure, HTTP-only cookies on the response for access and refresh tokens (Phase 4).
    """
    access_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.COOKIE_ACCESS_NAME,
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )

    if refresh_token:
        refresh_max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
        response.set_cookie(
            key=settings.COOKIE_REFRESH_NAME,
            value=refresh_token,
            max_age=refresh_max_age,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            domain=settings.COOKIE_DOMAIN,
            path="/",
        )


def clear_auth_cookies(response: Response):
    """
    Deletes the auth cookies from the client browser upon logout (Phase 4).
    """
    response.delete_cookie(
        key=settings.COOKIE_ACCESS_NAME,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )
    response.delete_cookie(
        key=settings.COOKIE_REFRESH_NAME,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )
