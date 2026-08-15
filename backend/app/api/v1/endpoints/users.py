from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_active_user, get_db
from app.schemas.user import UserOnboardingUpdate, UserResponse, UserUpdate
from app.services.user_service import user_service

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def read_user_me(
    current_user: Annotated[UserResponse, Depends(get_current_active_user)],
) -> UserResponse:
    """Fetch the currently authenticated user's profile and onboarding state."""
    return current_user


@router.patch(
    "/me/onboarding",
    response_model=UserResponse,
    summary="Update onboarding progress and configuration",
)
async def update_user_onboarding_step(
    onboarding_in: UserOnboardingUpdate,
    current_user: Annotated[UserResponse, Depends(get_current_active_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> UserResponse:
    """Save progress for user onboarding steps (e.g., use case, selected models, org details)."""
    updated_user = await user_service.update_onboarding(
        db,
        user_id=current_user.id,
        update_in=onboarding_in,
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return UserResponse.model_validate(updated_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update user profile information",
)
async def update_user_me(
    user_update: UserUpdate,
    current_user: Annotated[UserResponse, Depends(get_current_active_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> UserResponse:
    """Update profile attributes such as full name or password."""
    updated_user = await user_service.update_profile(
        db,
        user_id=current_user.id,
        user_update=user_update,
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return UserResponse.model_validate(updated_user)
