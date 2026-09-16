"""
Database persistence layer for JudgeAI Agent Swarm Sessions.
Supports MongoDB with automatic persistent local file fallback backup.
Enforces strict user isolation.
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

try:
    from .config import settings
except ImportError:
    from config import settings

logger = logging.getLogger("swarm.db")

DATA_DIR = Path(__file__).resolve().parent / "data"
FILE_STORE_PATH = DATA_DIR / "swarm_store.json"


class SwarmDatabase:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    _memory_store: Dict[str, Dict[str, Any]] = {}
    _is_initialized: bool = False
    _active_loop = None

    @classmethod
    def _ensure_data_dir(cls):
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning(f"Failed to create data directory for Swarm: {e}")

    @classmethod
    def _load_file_store(cls) -> Dict[str, Dict[str, Any]]:
        cls._ensure_data_dir()
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
            logger.warning(f"Failed to read Swarm file store ({FILE_STORE_PATH}): {e}. Starting fresh.")
        return {}

    @classmethod
    def _save_file_store(cls):
        cls._ensure_data_dir()
        try:
            temp_path = FILE_STORE_PATH.with_suffix(".tmp")
            # Convert datetime objects if any to isoformat
            serializable = {}
            for k, v in cls._memory_store.items():
                item = dict(v)
                for date_key in ("created_at", "updated_at"):
                    if isinstance(item.get(date_key), datetime):
                        item[date_key] = item[date_key].isoformat()
                serializable[k] = item

            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2, default=str)
            temp_path.replace(FILE_STORE_PATH)
        except Exception as e:
            logger.error(f"Failed to persist Swarm file store to disk: {e}")

    @classmethod
    async def connect(cls):
        """Initializes MongoDB connection and loads persistent storage."""
        cls._memory_store = cls._load_file_store()
        cls._is_initialized = True
        try:
            cls._active_loop = asyncio.get_running_loop()
        except RuntimeError:
            cls._active_loop = None

        try:
            logger.info(f"Connecting Swarm Database to MongoDB at {settings.MONGODB_URI}...")
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2500,
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            await cls.client.admin.command("ping")
            logger.info(f"Connected to MongoDB database '{settings.MONGODB_DB_NAME}' for Agent Swarm successfully.")

            # Create Indexes
            collection = cls.db[settings.MONGODB_COLLECTION]
            await collection.create_index("id", unique=True)
            await collection.create_index([("user_id", 1), ("created_at", -1)])
            await collection.create_index("created_at")

            # Sync file store records to MongoDB if not present
            for session_id, doc in cls._memory_store.items():
                try:
                    existing = await collection.find_one({"id": session_id})
                    if not existing:
                        db_doc = dict(doc)
                        if isinstance(db_doc.get("created_at"), str):
                            try:
                                db_doc["created_at"] = datetime.fromisoformat(db_doc["created_at"])
                            except Exception:
                                pass
                        await collection.insert_one(db_doc)
                except Exception:
                    pass

        except Exception as e:
            logger.warning(
                f"MongoDB connection failed or not running: {e}. Active fallback: persistent file store ({FILE_STORE_PATH})."
            )
            cls.client = None
            cls.db = None

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            logger.info("Agent Swarm MongoDB connection closed.")
        cls.client = None
        cls.db = None
        cls._active_loop = None

    @classmethod
    def get_db(cls) -> Optional[AsyncIOMotorDatabase]:
        return cls.db

    @classmethod
    async def ensure_initialized(cls):
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if not cls._is_initialized or (current_loop is not None and cls._active_loop != current_loop):
            await cls.connect()

    @classmethod
    async def save_session(cls, doc: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Permanently saves a completed swarm session associated with user_id.
        Safely handles MongoDB errors without raising or corrupting the session output.
        """
        await cls.ensure_initialized()
        session_id = doc.get("id")
        if not session_id:
            import time
            session_id = f"swarm-{int(time.time())}"
            doc["id"] = session_id

        doc_copy = dict(doc)
        uid = str(user_id).lower().strip()
        doc_copy["user_id"] = uid

        now_iso = datetime.now(timezone.utc).isoformat()
        if "created_at" not in doc_copy or not doc_copy["created_at"]:
            doc_copy["created_at"] = now_iso
        if "updated_at" not in doc_copy or not doc_copy["updated_at"]:
            doc_copy["updated_at"] = now_iso

        # Update local memory and file backup
        cls._memory_store[session_id] = doc_copy
        cls._save_file_store()

        # Update MongoDB if connected
        if cls.db is not None:
            try:
                db_doc = dict(doc_copy)
                collection = cls.db[settings.MONGODB_COLLECTION]
                await collection.update_one(
                    {"id": session_id},
                    {"$set": db_doc},
                    upsert=True,
                )
            except Exception as e:
                logger.error(f"Error saving Swarm session to MongoDB: {e}")

        # Return clean document without MongoDB internal _id
        doc_copy.pop("_id", None)
        return doc_copy

    @classmethod
    async def list_sessions(
        cls,
        user_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Lists swarm sessions for a specific authenticated user, ordered newest first.
        Strictly isolates records by user_id.
        """
        await cls.ensure_initialized()
        uid = str(user_id).lower().strip()

        # Attempt to read from MongoDB first
        if cls.db is not None:
            try:
                collection = cls.db[settings.MONGODB_COLLECTION]
                mongo_filter = {"user_id": uid}
                total = await collection.count_documents(mongo_filter)
                cursor = collection.find(mongo_filter).sort("created_at", -1).skip(skip).limit(limit)
                sessions = await cursor.to_list(length=limit)

                for s in sessions:
                    s.pop("_id", None)

                return sessions, total
            except Exception as e:
                logger.warning(f"MongoDB query failed: {e}. Falling back to file store.")

        # Fallback to in-memory/file store
        all_user_sessions = [
            dict(s) for s in cls._memory_store.values()
            if str(s.get("user_id", "")).lower().strip() == uid
        ]

        def get_sort_key(item):
            ca = item.get("created_at")
            if isinstance(ca, datetime):
                return ca
            if isinstance(ca, str):
                try:
                    return datetime.fromisoformat(ca)
                except Exception:
                    pass
            return datetime.min

        all_user_sessions.sort(key=get_sort_key, reverse=True)

        total = len(all_user_sessions)
        end_idx = skip + limit
        paginated = all_user_sessions[skip:end_idx]
        for s in paginated:
            s.pop("_id", None)

        return paginated, total

    @classmethod
    async def get_session_by_id(
        cls,
        session_id: str,
        user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single swarm session record by ID.
        If user_id is provided, enforces user isolation (returns None if owner does not match).
        """
        await cls.ensure_initialized()
        uid = str(user_id).lower().strip() if user_id else None

        if cls.db is not None:
            try:
                collection = cls.db[settings.MONGODB_COLLECTION]
                filter_query: Dict[str, Any] = {"id": session_id}
                if uid:
                    filter_query["user_id"] = uid
                doc = await collection.find_one(filter_query)
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find failed: {e}. Falling back to file store.")

        # Fallback to local store
        doc = cls._memory_store.get(session_id)
        if doc:
            doc_user = str(doc.get("user_id", "")).lower().strip()
            if uid and doc_user != uid:
                return None
            doc_copy = dict(doc)
            doc_copy.pop("_id", None)
            return doc_copy

        return None

    @classmethod
    async def delete_session(cls, session_id: str, user_id: Optional[str] = None) -> bool:
        """
        Deletes a swarm session for a user.
        """
        await cls.ensure_initialized()
        uid = str(user_id).lower().strip() if user_id else None
        deleted = False

        if cls.db is not None:
            try:
                collection = cls.db[settings.MONGODB_COLLECTION]
                filter_query: Dict[str, Any] = {"id": session_id}
                if uid:
                    filter_query["user_id"] = uid
                res = await collection.delete_one(filter_query)
                if res.deleted_count > 0:
                    deleted = True
            except Exception as e:
                logger.warning(f"MongoDB delete failed: {e}")

        if session_id in cls._memory_store:
            doc = cls._memory_store[session_id]
            doc_user = str(doc.get("user_id", "")).lower().strip()
            if not uid or doc_user == uid:
                del cls._memory_store[session_id]
                cls._save_file_store()
                deleted = True

        return deleted
