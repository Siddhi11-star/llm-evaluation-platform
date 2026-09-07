"""
Pydantic data models for JudgeAI Authentication & User Accounts (Phase 1 & Phase 2).
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, field_validator


class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name")
    email: str = Field(..., description="Valid Email Address")
    password: str = Field(..., min_length=8, max_length=128, description="Account Password (min 8 chars)")

    @field_validator("email")
    def validate_and_normalize_email(cls, v: str) -> str:
        s = v.strip().lower()
        if "@" not in s or "." not in s.split("@")[-1]:
            raise ValueError("Invalid email format.")
        return s

    @field_validator("name")
    def clean_name(cls, v: str) -> str:
        return v.strip()


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Registered Email Address")
    password: str = Field(..., min_length=1, description="Account Password")

    @field_validator("email")
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class VerifyEmailRequest(BaseModel):
    email: str = Field(..., description="User Email Address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @field_validator("email")
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("otp")
    def validate_otp(cls, v: str) -> str:
        s = v.strip()
        if not s.isdigit() or len(s) != 6:
            raise ValueError("OTP must be exactly 6 numeric digits.")
        return s


class ResendVerificationRequest(BaseModel):
    email: str = Field(..., description="User Email Address")

    @field_validator("email")
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered Email Address")

    @field_validator("email")
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Password Reset Security Token")
    password: str = Field(..., min_length=8, max_length=128, description="New Password (min 8 chars)")


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    email_verified: bool = False
    onboarding_completed: bool = False
    plan: Optional[str] = "Free"
    role: Optional[str] = None
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GenericMessageResponse(BaseModel):
    status: str = "success"
    message: str


class UpdateOnboardingRequest(BaseModel):
    plan: Optional[str] = Field(default="Free", description="Selected Pricing Tier Plan")
    role: Optional[str] = Field(default=None, description="User Job Role")
    use_cases: Optional[List[str]] = Field(default=None, description="Target AI Use Cases")
    models: Optional[List[str]] = Field(default=None, description="Preferred Model IDs")
    priorities: Optional[List[str]] = Field(default=None, description="Rubric Priorities")


# ==============================================================================
# Phase 5: Account Management Models
# ==============================================================================

class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Updated Full Name")

    @field_validator("name")
    def clean_name(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        return s


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = Field(default=None, description="Current password (optional if setting initial password for OAuth users)")
    new_password: str = Field(..., min_length=8, max_length=128, description="New Password (min 8 chars)")


class RequestEmailChangeRequest(BaseModel):
    new_email: str = Field(..., description="New Email Address to change to")

    @field_validator("new_email")
    def validate_and_normalize_email(cls, v: str) -> str:
        s = v.strip().lower()
        if "@" not in s or "." not in s.split("@")[-1]:
            raise ValueError("Invalid email format.")
        return s


class VerifyEmailChangeRequest(BaseModel):
    new_email: str = Field(..., description="New Email Address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code sent to new email")

    @field_validator("new_email")
    def validate_and_normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("otp")
    def validate_otp(cls, v: str) -> str:
        s = v.strip()
        if not s.isdigit() or len(s) != 6:
            raise ValueError("OTP must be exactly 6 numeric digits.")
        return s


class DeleteAccountRequest(BaseModel):
    password: Optional[str] = Field(default=None, description="Current password for verification (if user has password)")
    confirmation: str = Field(..., description="Type 'DELETE' to confirm irreversible account deletion")


class SessionItemResponse(BaseModel):
    id: str
    created_at: str
    expires_at: int
    is_current: bool
    is_revoked: bool = False


class SecurityStatusResponse(BaseModel):
    email: str
    email_verified: bool
    has_password: bool
    providers: List[str] = []
    active_sessions_count: int = 1

