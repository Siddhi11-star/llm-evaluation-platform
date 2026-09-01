"""
Database Persistence Layer for Evaluation Agent.
Supports MongoDB with automatic local file persistence backup.
Ensures evaluation records are permanently preserved and isolated by user_id.
"""

import os
import json
import logging
import asyncio
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger("evaluations.db")

# Directory for file persistence backup
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
FILE_STORE_PATH = DATA_DIR / "evaluations_store.json"

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_EVAL_DB_NAME", os.getenv("MONGODB_DB_NAME", "judgeai_evaluations"))


class EvaluationDatabase:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    _memory_store: Dict[str, Dict[str, Any]] = {}
    _is_initialized: bool = False
    _active_loop = None

    @classmethod
    def _load_file_store(cls) -> Dict[str, Dict[str, Any]]:
        """Loads records from the local persistent JSON file."""
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
            logger.warning(f"Could not load local evaluation store file: {e}")
        return {}

    @classmethod
    def _save_file_store(cls):
        """Atomically saves memory records to the local persistent JSON file."""
        try:
            temp_path = DATA_DIR / "evaluations_store.tmp"
            serializable = {}
            for k, v in cls._memory_store.items():
                doc_copy = dict(v)
                if isinstance(doc_copy.get("created_at"), datetime):
                    doc_copy["created_at"] = doc_copy["created_at"].isoformat()
                serializable[k] = doc_copy

            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2, default=str)
            temp_path.replace(FILE_STORE_PATH)
        except Exception as e:
            logger.error(f"Failed to persist evaluations to file store: {e}")

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
            logger.info(f"Connecting Evaluation Database to MongoDB at {MONGODB_URI}...")
            cls.client = AsyncIOMotorClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=2500,
            )
            cls.db = cls.client[MONGODB_DB_NAME]
            await cls.client.admin.command("ping")
            logger.info(f"Connected to MongoDB database '{MONGODB_DB_NAME}' for Evaluation Agent successfully.")

            # Create Indexes
            await cls.db.evaluations.create_index("id", unique=True)
            await cls.db.evaluations.create_index([("user_id", 1), ("created_at", -1)])
            await cls.db.evaluations.create_index("created_at")

            # Sync file store records to MongoDB if not present
            for run_id, doc in cls._memory_store.items():
                try:
                    existing = await cls.db.evaluations.find_one({"id": run_id})
                    if not existing:
                        db_doc = dict(doc)
                        if isinstance(db_doc.get("created_at"), str):
                            try:
                                db_doc["created_at"] = datetime.fromisoformat(db_doc["created_at"])
                            except Exception:
                                pass
                        await cls.db.evaluations.insert_one(db_doc)
                except Exception:
                    pass

        except Exception as e:
            logger.warning(f"MongoDB connection failed or not running: {e}. Active fallback: persistent file store ({FILE_STORE_PATH}).")
            cls.client = None
            cls.db = None

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            logger.info("Evaluation Database MongoDB connection closed.")
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
    async def save_evaluation(cls, doc: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Permanently saves an evaluation run record associated with user_id.
        """
        await cls.ensure_initialized()
        run_id = doc["id"]
        doc["user_id"] = user_id.lower().strip()

        # Update local memory and file backup
        cls._memory_store[run_id] = doc
        cls._save_file_store()

        # Update MongoDB if connected
        if cls.db is not None:
            try:
                db_doc = dict(doc)
                await cls.db.evaluations.update_one(
                    {"id": run_id},
                    {"$set": db_doc},
                    upsert=True,
                )
            except Exception as e:
                logger.error(f"Error saving evaluation to MongoDB: {e}")

        return doc

    @classmethod
    async def list_evaluations(
        cls,
        user_id: str,
        query: Optional[str] = None,
        model: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        page: int = 1,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Lists evaluations for a specific authenticated user, ordered newest first.
        """
        await cls.ensure_initialized()
        uid = user_id.lower().strip()

        # Attempt to read from MongoDB first
        if cls.db is not None:
            try:
                mongo_filter: Dict[str, Any] = {"user_id": uid}
                if model and model != "all":
                    mongo_filter["model"] = model
                if status and status != "all":
                    mongo_filter["status"] = status
                if query and query.strip():
                    q = query.strip()
                    mongo_filter["$or"] = [
                        {"task": {"$regex": q, "$options": "i"}},
                        {"id": {"$regex": q, "$options": "i"}},
                    ]

                total = await cls.db.evaluations.count_documents(mongo_filter)
                skip = (page - 1) * limit
                cursor = cls.db.evaluations.find(mongo_filter).sort("created_at", -1).skip(skip).limit(limit)
                runs = await cursor.to_list(length=limit)

                # Strip MongoDB _id
                for r in runs:
                    r.pop("_id", None)

                return runs, total
            except Exception as e:
                logger.warning(f"MongoDB query failed: {e}. Falling back to file store.")

        # Fallback to in-memory/file store
        all_user_runs = [
            r for r in cls._memory_store.values()
            if r.get("user_id", "").lower().strip() == uid
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

        all_user_runs.sort(key=get_sort_key, reverse=True)

        filtered = []
        for r in all_user_runs:
            if query:
                q = query.lower()
                if q not in r.get("task", "").lower() and q not in r.get("id", "").lower():
                    continue
            if model and model != "all" and r.get("model") != model:
                continue
            if status and status != "all" and r.get("status") != status:
                continue
            filtered.append(r)

        total = len(filtered)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        return filtered[start_idx:end_idx], total

    @classmethod
    async def get_evaluation_by_id(cls, run_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single evaluation record by ID.
        If user_id is provided, enforces user isolation.
        """
        await cls.ensure_initialized()

        if cls.db is not None:
            try:
                filter_query: Dict[str, Any] = {"id": run_id}
                if user_id:
                    filter_query["user_id"] = user_id.lower().strip()
                doc = await cls.db.evaluations.find_one(filter_query)
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find failed: {e}")

        # Fallback to local store
        doc = cls._memory_store.get(run_id)
        if doc:
            if user_id and doc.get("user_id", "").lower().strip() != user_id.lower().strip():
                return None
            return doc
        return None

    @classmethod
    async def delete_evaluation(cls, run_id: str, user_id: Optional[str] = None) -> bool:
        """
        Deletes an evaluation run for a user.
        """
        await cls.ensure_initialized()
        deleted = False

        if cls.db is not None:
            try:
                filter_query: Dict[str, Any] = {"id": run_id}
                if user_id:
                    filter_query["user_id"] = user_id.lower().strip()
                res = await cls.db.evaluations.delete_one(filter_query)
                if res.deleted_count > 0:
                    deleted = True
            except Exception as e:
                logger.warning(f"MongoDB delete failed: {e}")

        if run_id in cls._memory_store:
            doc = cls._memory_store[run_id]
            if not user_id or doc.get("user_id", "").lower().strip() == user_id.lower().strip():
                del cls._memory_store[run_id]
                cls._save_file_store()
                deleted = True

        return deleted

    @classmethod
    async def get_dashboard_stats(cls, user_id: str) -> Dict[str, Any]:
        """
        Computes dashboard statistics for a specific user.
        """
        runs, total = await cls.list_evaluations(user_id=user_id, limit=1000)
        passed = sum(1 for r in runs if r.get("status") == "Passed")
        flagged = total - passed
        pass_rate = round((passed / total * 100) if total > 0 else 0.0, 1)
        avg_score = round(sum(r.get("score", 0) for r in runs) / total if total > 0 else 0.0, 1)

        return {
            "total_evaluations": total,
            "passed_count": passed,
            "flagged_count": flagged,
            "pass_rate": pass_rate,
            "average_score": avg_score,
            "active_judges_count": 6,
            "planned_judge_model": "gpt-oss:120b-cloud",
        }
