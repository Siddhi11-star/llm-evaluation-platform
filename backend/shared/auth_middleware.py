"""
Shared Authentication Dependency for JudgeAI Microservices (Phase 1 & Phase 2).
Validates signed JWT Bearer tokens, resolves authenticated user identity,
and enforces email verification for protected resources.
"""

from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

try:
    from backend.auth_users.config import settings
    from backend.auth_users.db import UserDatabase
except ImportError:
    try:
        from auth_users.config import settings
        from auth_users.db import UserDatabase
    except ImportError:
        import os
        class FallbackSettings:
            JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "judgeai-dev-secret-key-change-in-production-e938bf8c991a47290bc")
            JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        settings = FallbackSettings()
        UserDatabase = None

security_bearer = HTTPBearer(auto_error=False)


async def get_current_authenticated_user(
    request: Optional[Request] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and cryptographically verifies JWT tokens.
    Inspects HTTP-only cookies ('judgeai_access_token') first, then 'Authorization: Bearer' headers.
    Returns the authenticated user dict: {'id': ..., 'email': ..., 'name': ..., 'email_verified': ...}
    Raises HTTP 401 on missing/expired token.
    """
    token = None
    # 1. Check HTTP-only cookie first (Phase 4 Hardening)
    cookie_name = getattr(settings, "COOKIE_ACCESS_NAME", "judgeai_access_token")
    if request is not None:
        cookies = getattr(request, "cookies", {})
        if isinstance(cookies, dict) and cookie_name in cookies:
            token = cookies.get(cookie_name)

    # 2. Fallback to Authorization Bearer header
    if not token:
        if credentials and credentials.credentials:
            token = credentials.credentials
        elif authorization and authorization.startswith("Bearer "):
            token = authorization.split("Bearer ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token claims.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.get("type") == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type: refresh tokens cannot be used for resource authentication.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Retrieve live user from DB if available
        email_verified = payload.get("email_verified", False)
        user_name = payload.get("name", "User")
        user_plan = payload.get("plan", "Free")

        if UserDatabase is not None:
            user_doc = await UserDatabase.get_user_by_id(user_id)
            if user_doc:
                email_verified = user_doc.get("email_verified", False)
                user_name = user_doc.get("name", user_name)
                user_plan = user_doc.get("plan", user_plan)

        return {
            "id": str(user_id),
            "email": str(email),
            "name": str(user_name),
            "plan": str(user_plan),
            "email_verified": bool(email_verified),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_verified_user(
    current_user: Dict[str, Any] = Depends(get_current_authenticated_user)
) -> Dict[str, Any]:
    """
    Strict dependency for endpoints that mandate email verification.
    """
    if not current_user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required. Please verify your email before accessing this resource.",
        )
    return current_user
