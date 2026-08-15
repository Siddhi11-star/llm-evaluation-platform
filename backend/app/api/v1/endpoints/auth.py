from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db
from app.core.security import create_access_token
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.user_service import user_service

router = APIRouter()


@router.post(
    "/signup",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def signup(
    user_in: UserCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> Token:
    """Create a new user account with hashed password and return access token."""
    existing_user = await user_service.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = await user_service.create(db, user_in=user_in)
    user_response = UserResponse.model_validate(user)
    access_token = create_access_token(
        subject=str(user["_id"]),
        extra_claims={"email": user_response.email},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate user and retrieve access token",
)
async def login(
    user_in: UserLogin,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> Token:
    """Authenticate with email and password to receive a JWT access token."""
    user = await user_service.authenticate(
        db,
        email=user_in.email,
        password=user_in.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    user_response = UserResponse.model_validate(user)
    access_token = create_access_token(
        subject=str(user["_id"]),
        extra_claims={"email": user_response.email},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )


@router.post(
    "/login/access-token",
    response_model=Token,
    summary="OAuth2 compatible token login for Swagger UI",
)
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> Token:
    """OAuth2 compatible token login, getting an access token for future requests."""
    user = await user_service.authenticate(
        db,
        email=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    user_response = UserResponse.model_validate(user)
    access_token = create_access_token(
        subject=str(user["_id"]),
        extra_claims={"email": user_response.email},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )
