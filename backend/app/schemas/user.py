from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Any
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field


def str_object_id(v: Any) -> str:
    """Convert MongoDB ObjectId or any value to str."""
    if v is None:
        return ""
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(str_object_id)]


class OnboardingStepEnum(str, Enum):
    """Lifecycle stages during user onboarding."""
    WELCOME = "welcome"
    USE_CASE = "use_case"
    MODELS = "models"
    API_KEYS = "api_keys"
    COMPLETED = "completed"


class OnboardingData(BaseModel):
    """Detailed user onboarding configuration and preferences."""
    organization_name: str | None = None
    role: str | None = None
    use_case: str | None = None
    preferred_models: list[str] = Field(default_factory=list)
    default_provider: str | None = "groq"
    completed_steps: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class UserBase(BaseModel):
    """Shared user properties."""
    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    """Schema for user signup."""
    password: str = Field(min_length=6, description="Password must be at least 6 characters")
    organization_name: str | None = None
    role: str | None = None


class UserLogin(BaseModel):
    """Schema for user login with email and password."""
    email: EmailStr
    password: str


class UserOnboardingUpdate(BaseModel):
    """Schema for updating user onboarding state and preferences."""
    step: str | None = Field(default=None, description="Current onboarding step identifier")
    is_onboarded: bool | None = None
    organization_name: str | None = None
    role: str | None = None
    use_case: str | None = None
    preferred_models: list[str] | None = None
    default_provider: str | None = None
    completed_step: str | None = Field(default=None, description="Step to mark as completed")
    metadata: dict[str, Any] | None = None


class UserUpdate(BaseModel):
    """Schema for general profile updates."""
    full_name: str | None = None
    organization_name: str | None = None
    role: str | None = None
    password: str | None = Field(default=None, min_length=6)


class UserResponse(UserBase):
    """Public user response schema returned across API endpoints."""
    id: PyObjectId = Field(alias="_id")
    is_active: bool = True
    is_superuser: bool = False
    is_onboarded: bool = False
    onboarding_step: str = OnboardingStepEnum.WELCOME.value
    onboarding_data: OnboardingData = Field(default_factory=OnboardingData)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_encoders={datetime: lambda dt: dt.isoformat()},
    )


class UserInDB(UserResponse):
    """Internal user model including hashed password."""
    hashed_password: str
