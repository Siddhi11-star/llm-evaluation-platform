from typing import Any
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class Token(BaseModel):
    """Schema returned upon successful authentication."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse | None = None


class TokenPayload(BaseModel):
    """Payload decoded from JWT token."""
    sub: str | None = None
    exp: int | None = None
    email: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)
