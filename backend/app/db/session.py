import logging
import time
from typing import Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)


class MongoManager:
    """Singleton-style manager holding the Motor AsyncIOMotorClient connection."""

    def __init__(self) -> None:
        self.client: AsyncIOMotorClient | None = None

    def get_database(self) -> AsyncIOMotorDatabase:
        if self.client is None:
            raise RuntimeError("Database client is not initialized. Call connect_to_mongo() first.")
        return self.client[settings.MONGODB_DB_NAME]


mongo_manager = MongoManager()


async def connect_to_mongo() -> None:
    """Initialize the async Motor MongoDB client connection."""
    logger.info("Connecting to MongoDB at %s (database: %s)...", settings.MONGODB_URI, settings.MONGODB_DB_NAME)
    try:
        mongo_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )
        # Verify connection
        await mongo_manager.client.admin.command("ping")
        logger.info("Successfully connected to MongoDB.")
    except Exception as exc:
        logger.warning("MongoDB ping failed on startup (will retry on query): %s", exc)


async def close_mongo_connection() -> None:
    """Close the Motor MongoDB client connection."""
    if mongo_manager.client is not None:
        logger.info("Closing MongoDB connection...")
        mongo_manager.client.close()
        mongo_manager.client = None
        logger.info("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    """Dependency / helper to retrieve the active AsyncIOMotorDatabase instance."""
    return mongo_manager.get_database()


async def ping_db() -> dict[str, Any]:
    """Ping MongoDB database to check health and latency."""
    if mongo_manager.client is None:
        return {"status": "unconnected", "latency_ms": None}

    start_time = time.perf_counter()
    try:
        await mongo_manager.client.admin.command("ping")
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {"status": "connected", "latency_ms": latency_ms}
    except Exception as exc:
        logger.error("MongoDB ping error: %s", exc)
        return {"status": "error", "error": str(exc), "latency_ms": None}
