from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_password_hash, verify_password
from app.db.collections import get_users_collection
from app.schemas.user import (
    OnboardingData,
    OnboardingStepEnum,
    UserCreate,
    UserOnboardingUpdate,
    UserResponse,
    UserUpdate,
)


class UserService:
    """Service providing user creation, lookup, authentication, and onboarding workflows."""

    async def get_by_email(self, db: AsyncIOMotorDatabase, email: str) -> dict[str, Any] | None:
        """Find a raw user document by email."""
        collection = get_users_collection(db)
        user = await collection.find_one({"email": email.lower().strip()})
        return user

    async def get_by_id(self, db: AsyncIOMotorDatabase, user_id: str) -> dict[str, Any] | None:
        """Find a raw user document by MongoDB ObjectId string."""
        if not ObjectId.is_valid(user_id):
            return None
        collection = get_users_collection(db)
        user = await collection.find_one({"_id": ObjectId(user_id)})
        return user

    async def create(self, db: AsyncIOMotorDatabase, user_in: UserCreate) -> dict[str, Any]:
        """Create and persist a new user record with hashed password and initial onboarding state."""
        collection = get_users_collection(db)
        now = datetime.now(timezone.utc)

        onboarding_data = OnboardingData(
            organization_name=user_in.organization_name,
            role=user_in.role,
        ).model_dump()

        user_doc = {
            "email": user_in.email.lower().strip(),
            "hashed_password": get_password_hash(user_in.password),
            "full_name": user_in.full_name,
            "is_active": True,
            "is_superuser": False,
            "is_onboarded": False,
            "onboarding_step": OnboardingStepEnum.WELCOME.value,
            "onboarding_data": onboarding_data,
            "created_at": now,
            "updated_at": now,
        }

        result = await collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    async def authenticate(
        self, db: AsyncIOMotorDatabase, email: str, password: str
    ) -> dict[str, Any] | None:
        """Verify user credentials and return the user document if valid."""
        user = await self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.get("hashed_password", "")):
            return None
        return user

    async def update_onboarding(
        self,
        db: AsyncIOMotorDatabase,
        user_id: str,
        update_in: UserOnboardingUpdate,
    ) -> dict[str, Any] | None:
        """Update onboarding step and configuration parameters for a user."""
        if not ObjectId.is_valid(user_id):
            return None

        collection = get_users_collection(db)
        user = await self.get_by_id(db, user_id)
        if not user:
            return None

        now = datetime.now(timezone.utc)
        onboarding_data = user.get("onboarding_data", {})

        if update_in.organization_name is not None:
            onboarding_data["organization_name"] = update_in.organization_name
        if update_in.role is not None:
            onboarding_data["role"] = update_in.role
        if update_in.use_case is not None:
            onboarding_data["use_case"] = update_in.use_case
        if update_in.preferred_models is not None:
            onboarding_data["preferred_models"] = update_in.preferred_models
        if update_in.default_provider is not None:
            onboarding_data["default_provider"] = update_in.default_provider

        completed_steps = set(onboarding_data.get("completed_steps", []))
        if update_in.completed_step:
            completed_steps.add(update_in.completed_step)
        onboarding_data["completed_steps"] = list(completed_steps)

        if update_in.metadata:
            meta = onboarding_data.get("metadata", {})
            meta.update(update_in.metadata)
            onboarding_data["metadata"] = meta

        update_fields: dict[str, Any] = {
            "onboarding_data": onboarding_data,
            "updated_at": now,
        }

        if update_in.step is not None:
            update_fields["onboarding_step"] = update_in.step
        if update_in.is_onboarded is not None:
            update_fields["is_onboarded"] = update_in.is_onboarded

        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields},
        )
        return await self.get_by_id(db, user_id)

    async def update_profile(
        self,
        db: AsyncIOMotorDatabase,
        user_id: str,
        user_update: UserUpdate,
    ) -> dict[str, Any] | None:
        """Update general user profile attributes."""
        if not ObjectId.is_valid(user_id):
            return None

        collection = get_users_collection(db)
        update_dict: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        if user_update.full_name is not None:
            update_dict["full_name"] = user_update.full_name
        if user_update.password is not None:
            update_dict["hashed_password"] = get_password_hash(user_update.password)

        if user_update.organization_name is not None or user_update.role is not None:
            user = await self.get_by_id(db, user_id)
            if user:
                onboarding = user.get("onboarding_data", {})
                if user_update.organization_name is not None:
                    onboarding["organization_name"] = user_update.organization_name
                if user_update.role is not None:
                    onboarding["role"] = user_update.role
                update_dict["onboarding_data"] = onboarding

        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict},
        )
        return await self.get_by_id(db, user_id)


user_service = UserService()
