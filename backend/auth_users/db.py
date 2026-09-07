"""
Database Persistence Layer for JudgeAI User Accounts (Phase 1 & Phase 2).
Supports MongoDB with automatic local file persistence backup.
"""

import os
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
try:
    from .config import settings
except ImportError:
    from config import settings

logger = logging.getLogger("auth.db")

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
FILE_STORE_PATH = DATA_DIR / "users_store.json"


class UserDatabase:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    _memory_store: Dict[str, Dict[str, Any]] = {}
    _is_initialized: bool = False

    @classmethod
    def _load_file_store(cls) -> Dict[str, Dict[str, Any]]:
        """Loads user records from the local persistent JSON file."""
        if not FILE_STORE_PATH.exists():
            return {}
        try:
            with open(FILE_STORE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                elif isinstance(data, list):
                    return {item["id"]: item for item in data if "id" in item}
        except Exception as e:
            logger.warning(f"Could not load local user store file: {e}")
        return {}

    @classmethod
    def _save_file_store(cls):
        """Atomically saves memory records to the local persistent JSON file."""
        try:
            temp_path = DATA_DIR / "users_store.tmp"
            serializable = {}
            for k, v in cls._memory_store.items():
                doc_copy = dict(v)
                for date_key in (
                    "created_at",
                    "updated_at",
                    "last_login_at",
                    "email_verification_otp_expires_at",
                    "email_verification_last_sent_at",
                    "password_reset_expires_at",
                    "password_reset_last_sent_at",
                ):
                    if isinstance(doc_copy.get(date_key), datetime):
                        doc_copy[date_key] = doc_copy[date_key].isoformat()
                serializable[k] = doc_copy
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2, default=str)
            if temp_path.exists():
                temp_path.replace(FILE_STORE_PATH)
        except Exception as e:
            logger.error(f"Failed to persist user store to file: {e}")

    @classmethod
    async def connect(cls):
        """Connects to MongoDB and initializes collections & indexes."""
        if cls._is_initialized and (cls.db is not None or len(cls._memory_store) > 0):
            return

        cls._memory_store = cls._load_file_store()

        try:
            logger.info(f"Connecting to MongoDB for Auth at {settings.MONGODB_URI}...")
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2500
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            await cls.client.admin.command("ping")
            logger.info(f"Connected to MongoDB database '{settings.MONGODB_DB_NAME}' successfully.")

            # Create unique index on normalized email and token lookups
            await cls.db.users.create_index("email", unique=True)
            await cls.db.users.create_index("password_reset_token_hash")
            await cls.db.users.create_index("created_at")
        except Exception as e:
            logger.warning(f"MongoDB connection failed for Auth: {e}. Running in local file-persistent mode.")
            cls.client = None
            cls.db = None

        cls._is_initialized = True

    @classmethod
    async def close(cls):
        """Closes MongoDB connection and persists local store."""
        cls._save_file_store()
        if cls.client:
            cls.client.close()
            logger.info("MongoDB Auth connection closed.")

    @classmethod
    async def create_user(
        cls,
        name: str,
        email: str,
        password_hash: str,
        email_verified: bool = False
    ) -> Dict[str, Any]:
        """
        Creates a new user account with email_verified=False (Phase 2 default).
        """
        await cls.connect()
        normalized_email = email.lower().strip()

        # Check existing
        existing = await cls.get_user_by_email(normalized_email)
        if existing:
            if existing.get("email_verified", False):
                raise ValueError("An account with this email address already exists. Please log in.")
            else:
                # Account exists but is unverified: update credentials and allow re-sending OTP
                uid = existing["id"]
                now_iso = datetime.now(timezone.utc).isoformat()
                updates = {
                    "name": name.strip(),
                    "password_hash": password_hash,
                    "updated_at": now_iso,
                }
                if cls.db is not None:
                    await cls.db.users.update_one(
                        {"$or": [{"id": uid}, {"_id": uid}]},
                        {"$set": updates}
                    )
                if uid in cls._memory_store:
                    cls._memory_store[uid].update(updates)
                    cls._save_file_store()
                existing.update(updates)
                return existing

        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        user_doc: Dict[str, Any] = {
            "id": user_id,
            "_id": user_id,
            "name": name.strip(),
            "email": normalized_email,
            "password_hash": password_hash,
            "email_verified": email_verified,
            "onboarding_completed": False,
            "plan": "Free",
            "role": None,
            "onboarding_data": {},
            # OTP Verification Fields
            "email_verification_otp_hash": None,
            "email_verification_otp_expires_at": None,
            "email_verification_attempts": 0,
            "email_verification_last_sent_at": None,
            # Password Reset Fields
            "password_reset_token_hash": None,
            "password_reset_expires_at": None,
            "password_reset_attempts": 0,
            "password_reset_last_sent_at": None,
            # Timestamps
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "last_login_at": now.isoformat(),
        }

        if cls.db is not None:
            try:
                await cls.db.users.insert_one(dict(user_doc))
            except Exception as e:
                logger.error(f"MongoDB user insert error: {e}")

        cls._memory_store[user_id] = user_doc
        cls._save_file_store()

        return user_doc

    @classmethod
    async def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        """Finds user by normalized email."""
        await cls.connect()
        normalized_email = email.lower().strip()

        if cls.db is not None:
            try:
                doc = await cls.db.users.find_one({"email": normalized_email})
                if doc:
                    if "_id" in doc and "id" not in doc:
                        doc["id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find_one by email failed: {e}")

        for u in cls._memory_store.values():
            if u.get("email", "").lower().strip() == normalized_email:
                return u
        return None

    @classmethod
    async def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """Finds user by user ID."""
        await cls.connect()
        uid = str(user_id).strip()

        if cls.db is not None:
            try:
                doc = await cls.db.users.find_one({"$or": [{"id": uid}, {"_id": uid}]})
                if doc:
                    if "_id" in doc and "id" not in doc:
                        doc["id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find_one by id failed: {e}")

        return cls._memory_store.get(uid)

    @classmethod
    async def get_user_by_reset_token_hash(cls, token_hash: str) -> Optional[Dict[str, Any]]:
        """Finds user by password_reset_token_hash."""
        await cls.connect()
        if not token_hash:
            return None

        if cls.db is not None:
            try:
                doc = await cls.db.users.find_one({"password_reset_token_hash": token_hash})
                if doc:
                    if "_id" in doc and "id" not in doc:
                        doc["id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find_one by reset token hash failed: {e}")

        for u in cls._memory_store.values():
            if u.get("password_reset_token_hash") == token_hash:
                return u
        return None

    @classmethod
    async def set_verification_otp(
        cls,
        user_id: str,
        otp_hash: str,
        expires_at_iso: str
    ) -> bool:
        """Stores new OTP hash and resets attempt counter."""
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "email_verification_otp_hash": otp_hash,
            "email_verification_otp_expires_at": expires_at_iso,
            "email_verification_attempts": 0,
            "email_verification_last_sent_at": now_iso,
            "updated_at": now_iso,
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB set_verification_otp failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()
            return True

        return True

    @classmethod
    async def increment_otp_attempts(cls, user_id: str) -> int:
        """Increments failed OTP attempts counter."""
        await cls.connect()
        uid = str(user_id).strip()
        user_doc = await cls.get_user_by_id(uid)
        if not user_doc:
            return 0

        current_attempts = int(user_doc.get("email_verification_attempts", 0)) + 1
        updates = {
            "email_verification_attempts": current_attempts,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB increment_otp_attempts failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()

        return current_attempts

    @classmethod
    async def mark_email_verified(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """Marks email as verified and wipes out OTP fields."""
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "email_verified": True,
            "email_verification_otp_hash": None,
            "email_verification_otp_expires_at": None,
            "email_verification_attempts": 0,
            "updated_at": now_iso,
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB mark_email_verified failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()
            return cls._memory_store[uid]

        return await cls.get_user_by_id(uid)

    @classmethod
    async def set_password_reset_token(
        cls,
        user_id: str,
        token_hash: str,
        expires_at_iso: str
    ) -> bool:
        """Stores password reset token hash."""
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "password_reset_token_hash": token_hash,
            "password_reset_expires_at": expires_at_iso,
            "password_reset_attempts": 0,
            "password_reset_last_sent_at": now_iso,
            "updated_at": now_iso,
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB set_password_reset_token failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()

        return True

    @classmethod
    async def reset_password_and_clear_token(
        cls,
        user_id: str,
        new_password_hash: str
    ) -> bool:
        """Updates user password and invalidates reset token."""
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "password_hash": new_password_hash,
            "password_reset_token_hash": None,
            "password_reset_expires_at": None,
            "password_reset_attempts": 0,
            "updated_at": now_iso,
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB reset_password_and_clear_token failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()

        return True

    @classmethod
    async def update_last_login(cls, user_id: str):
        """Updates last_login_at timestamp."""
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": {"last_login_at": now_iso, "updated_at": now_iso}}
                )
            except Exception as e:
                logger.warning(f"MongoDB update_last_login failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid]["last_login_at"] = now_iso
            cls._memory_store[uid]["updated_at"] = now_iso
            cls._save_file_store()

    @classmethod
    async def update_onboarding(cls, user_id: str, onboarding_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates user onboarding details."""
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "onboarding_completed": True,
            "onboarding_data": onboarding_data,
            "plan": onboarding_data.get("plan", "Free"),
            "role": onboarding_data.get("role"),
            "updated_at": now_iso,
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB update_onboarding failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()
            return cls._memory_store[uid]

        return await cls.get_user_by_id(uid)

    @classmethod
    async def find_or_create_oauth_user(
        cls,
        provider: str,
        provider_user_id: str,
        email: str,
        name: str,
        avatar_url: Optional[str] = None
    ) -> tuple[Dict[str, Any], bool]:
        """
        Finds or creates an OAuth authenticated user.
        If user exists with the same email, links provider info and ensures email_verified=True.
        If user is new, creates record with email_verified=True and onboarding_completed=False.
        Returns tuple of (user_dict, is_new_user).
        """
        await cls.connect()
        normalized_email = email.lower().strip()
        provider_name = provider.lower().strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        existing = await cls.get_user_by_email(normalized_email)
        if existing:
            uid = existing["id"]
            providers = list(existing.get("providers", []))
            if provider_name not in providers:
                providers.append(provider_name)

            updates: Dict[str, Any] = {
                "email_verified": True,
                "email_verification_otp_hash": None,
                "email_verification_otp_expires_at": None,
                "email_verification_attempts": 0,
                f"{provider_name}_id": provider_user_id,
                "providers": providers,
                "last_login_at": now_iso,
                "updated_at": now_iso,
            }
            if avatar_url and not existing.get("avatar_url"):
                updates["avatar_url"] = avatar_url
            if not existing.get("name") or existing.get("name") == "User":
                updates["name"] = name.strip()

            if cls.db is not None:
                try:
                    await cls.db.users.update_one(
                        {"$or": [{"id": uid}, {"_id": uid}]},
                        {"$set": updates}
                    )
                except Exception as e:
                    logger.warning(f"MongoDB update OAuth user failed: {e}")

            if uid in cls._memory_store:
                cls._memory_store[uid].update(updates)
                cls._save_file_store()

            existing.update(updates)
            return existing, False

        # Create new OAuth user
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        user_doc: Dict[str, Any] = {
            "id": user_id,
            "_id": user_id,
            "name": name.strip(),
            "email": normalized_email,
            "password_hash": None,  # OAuth users have no password initially
            "email_verified": True,  # Verified by OAuth provider
            "onboarding_completed": False,
            "plan": "Free",
            "role": None,
            "auth_provider": provider_name,
            "providers": [provider_name],
            f"{provider_name}_id": provider_user_id,
            "avatar_url": avatar_url,
            "onboarding_data": {},
            # OTP Verification Fields
            "email_verification_otp_hash": None,
            "email_verification_otp_expires_at": None,
            "email_verification_attempts": 0,
            "email_verification_last_sent_at": None,
            # Password Reset Fields
            "password_reset_token_hash": None,
            "password_reset_expires_at": None,
            "password_reset_attempts": 0,
            "password_reset_last_sent_at": None,
            # Timestamps
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "last_login_at": now.isoformat(),
        }

        if cls.db is not None:
            try:
                await cls.db.users.insert_one(dict(user_doc))
            except Exception as e:
                logger.error(f"MongoDB OAuth user insert error: {e}")

        cls._memory_store[user_id] = user_doc
        cls._save_file_store()

        return user_doc, True

    # ------------------------------------------------------------------
    # Phase 4 Hardening: Session & Refresh Token Store
    # ------------------------------------------------------------------
    _sessions_memory: Dict[str, Dict[str, Any]] = {}

    @classmethod
    async def create_session(
        cls,
        user_id: str,
        refresh_token_hash: str,
        session_id: str,
        expires_at: int
    ) -> Dict[str, Any]:
        """
        Stores an active session record with refresh token hash (Phase 4).
        """
        await cls.connect()
        sess_doc: Dict[str, Any] = {
            "id": session_id,
            "_id": session_id,
            "user_id": str(user_id),
            "refresh_token_hash": refresh_token_hash,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_revoked": False,
        }

        if cls.db is not None:
            try:
                await cls.db.sessions.insert_one(dict(sess_doc))
            except Exception as e:
                logger.warning(f"MongoDB session insert error: {e}")

        cls._sessions_memory[refresh_token_hash] = sess_doc
        return sess_doc

    @classmethod
    async def get_session_by_token_hash(cls, token_hash: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves active non-revoked session by refresh token hash.
        """
        await cls.connect()
        if not token_hash:
            return None

        if cls.db is not None:
            try:
                doc = await cls.db.sessions.find_one({
                    "refresh_token_hash": token_hash,
                    "is_revoked": False
                })
                if doc:
                    if "_id" in doc and "id" not in doc:
                        doc["id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB get_session failed: {e}")

        sess = cls._sessions_memory.get(token_hash)
        if sess and not sess.get("is_revoked", False):
            return sess
        return None

    @classmethod
    async def rotate_session(
        cls,
        old_token_hash: str,
        new_token_hash: str,
        new_session_id: str,
        new_expires_at: int
    ) -> Optional[Dict[str, Any]]:
        """
        Rotates refresh token: invalidates old hash and stores new hash.
        """
        await cls.connect()
        old_sess = await cls.get_session_by_token_hash(old_token_hash)
        if not old_sess:
            return None

        user_id = old_sess["user_id"]
        # Invalidate old session
        await cls.revoke_session(old_token_hash)

        # Create new rotated session
        return await cls.create_session(
            user_id=user_id,
            refresh_token_hash=new_token_hash,
            session_id=new_session_id,
            expires_at=new_expires_at
        )

    @classmethod
    async def revoke_session(cls, token_hash: str) -> bool:
        """
        Revokes an active session by refresh token hash (Phase 4).
        """
        await cls.connect()
        if not token_hash:
            return False

        if cls.db is not None:
            try:
                await cls.db.sessions.update_one(
                    {"refresh_token_hash": token_hash},
                    {"$set": {"is_revoked": True, "revoked_at": datetime.now(timezone.utc).isoformat()}}
                )
            except Exception as e:
                logger.warning(f"MongoDB revoke_session failed: {e}")

        if token_hash in cls._sessions_memory:
            cls._sessions_memory[token_hash]["is_revoked"] = True

        return True

    @classmethod
    async def revoke_all_user_sessions(cls, user_id: str) -> bool:
        """
        Revokes all active sessions for a user upon password reset or security event.
        """
        await cls.connect()
        uid = str(user_id).strip()

        if cls.db is not None:
            try:
                await cls.db.sessions.update_many(
                    {"user_id": uid, "is_revoked": False},
                    {"$set": {"is_revoked": True, "revoked_at": datetime.now(timezone.utc).isoformat()}}
                )
            except Exception as e:
                logger.warning(f"MongoDB revoke_all_user_sessions failed: {e}")

        for h, sess in cls._sessions_memory.items():
            if sess.get("user_id") == uid:
                sess["is_revoked"] = True

        return True

    # ------------------------------------------------------------------
    # Phase 5: Account Management Methods
    # ------------------------------------------------------------------

    @classmethod
    async def update_profile(cls, user_id: str, name: str) -> Optional[Dict[str, Any]]:
        """
        Updates user full name / profile data.
        """
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()
        updates = {
            "name": name.strip(),
            "updated_at": now_iso
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB update_profile failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()
            return cls._memory_store[uid]

        return await cls.get_user_by_id(uid)

    @classmethod
    async def change_password(cls, user_id: str, new_password_hash: str) -> bool:
        """
        Updates user password hash and resets password attempt metadata.
        """
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()
        updates = {
            "password_hash": new_password_hash,
            "password_reset_token_hash": None,
            "password_reset_expires_at": None,
            "updated_at": now_iso
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB change_password failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()

        return True

    @classmethod
    async def set_email_change_otp(
        cls,
        user_id: str,
        new_email: str,
        otp_hash: str,
        expires_at_iso: str
    ) -> bool:
        """
        Stores pending email change request with OTP hash and target email.
        """
        await cls.connect()
        uid = str(user_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "pending_email": new_email.lower().strip(),
            "email_change_otp_hash": otp_hash,
            "email_change_otp_expires_at": expires_at_iso,
            "email_change_attempts": 0,
            "email_change_requested_at": now_iso,
            "updated_at": now_iso
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB set_email_change_otp failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()

        return True

    @classmethod
    async def increment_email_change_attempts(cls, user_id: str) -> int:
        """
        Increments failed email change OTP attempts.
        """
        await cls.connect()
        uid = str(user_id).strip()
        user_doc = await cls.get_user_by_id(uid)
        if not user_doc:
            return 0

        current_attempts = int(user_doc.get("email_change_attempts", 0)) + 1
        updates = {
            "email_change_attempts": current_attempts,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB increment_email_change_attempts failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()

        return current_attempts

    @classmethod
    async def verify_and_update_email(cls, user_id: str, new_email: str) -> Optional[Dict[str, Any]]:
        """
        Atomically updates the user's primary email address and clears pending email change fields.
        """
        await cls.connect()
        uid = str(user_id).strip()
        normalized_email = new_email.lower().strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        updates = {
            "email": normalized_email,
            "email_verified": True,
            "pending_email": None,
            "email_change_otp_hash": None,
            "email_change_otp_expires_at": None,
            "email_change_attempts": 0,
            "updated_at": now_iso
        }

        if cls.db is not None:
            try:
                await cls.db.users.update_one(
                    {"$or": [{"id": uid}, {"_id": uid}]},
                    {"$set": updates}
                )
            except Exception as e:
                logger.warning(f"MongoDB verify_and_update_email failed: {e}")

        if uid in cls._memory_store:
            cls._memory_store[uid].update(updates)
            cls._save_file_store()
            return cls._memory_store[uid]

        return await cls.get_user_by_id(uid)

    @classmethod
    async def list_active_sessions(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Returns list of active, unrevoked sessions for a user.
        """
        await cls.connect()
        uid = str(user_id).strip()
        sessions: List[Dict[str, Any]] = []

        if cls.db is not None:
            try:
                cursor = cls.db.sessions.find({"user_id": uid, "is_revoked": False})
                async for doc in cursor:
                    if "_id" in doc and "id" not in doc:
                        doc["id"] = str(doc["_id"])
                    sessions.append(doc)
                return sessions
            except Exception as e:
                logger.warning(f"MongoDB list_active_sessions failed: {e}")

        for s in cls._sessions_memory.values():
            if s.get("user_id") == uid and not s.get("is_revoked", False):
                sessions.append(s)

        return sessions

    @classmethod
    async def revoke_session_by_id(cls, user_id: str, session_id: str) -> bool:
        """
        Revokes an individual session by its session identifier (jti).
        """
        await cls.connect()
        uid = str(user_id).strip()
        sid = str(session_id).strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        if cls.db is not None:
            try:
                result = await cls.db.sessions.update_one(
                    {"$or": [{"id": sid}, {"_id": sid}], "user_id": uid},
                    {"$set": {"is_revoked": True, "revoked_at": now_iso}}
                )
                if result.modified_count > 0:
                    for s in cls._sessions_memory.values():
                        if s.get("id") == sid:
                            s["is_revoked"] = True
                    return True
            except Exception as e:
                logger.warning(f"MongoDB revoke_session_by_id failed: {e}")

        for s in cls._sessions_memory.values():
            if s.get("id") == sid and s.get("user_id") == uid:
                s["is_revoked"] = True
                return True

        return False

    @classmethod
    async def delete_account(cls, user_id: str) -> bool:
        """
        Permanently deletes a user account and all associated sessions (Phase 5).
        """
        await cls.connect()
        uid = str(user_id).strip()

        if cls.db is not None:
            try:
                await cls.db.users.delete_one({"$or": [{"id": uid}, {"_id": uid}]})
                await cls.db.sessions.delete_many({"user_id": uid})
            except Exception as e:
                logger.warning(f"MongoDB delete_account failed: {e}")

        if uid in cls._memory_store:
            del cls._memory_store[uid]
            cls._save_file_store()

        keys_to_remove = [k for k, v in cls._sessions_memory.items() if v.get("user_id") == uid]
        for k in keys_to_remove:
            del cls._sessions_memory[k]

        return True



