import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

logger = logging.getLogger("chat.db")


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=3000
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            
            # Ping database to verify connection
            await cls.client.admin.command('ping')
            logger.info(f"Connected to MongoDB database '{settings.MONGODB_DB_NAME}' successfully.")

            # Create Indexes
            await cls.db.chat_sessions.create_index("session_id", unique=True)
            await cls.db.chat_sessions.create_index("updated_at")
            await cls.db.chat_messages.create_index([("session_id", 1), ("timestamp", 1)])
        except Exception as e:
            logger.warning(f"MongoDB connection failed or not running: {e}. Falling back to in-memory store.")
            cls.client = None
            cls.db = None

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_db(cls) -> Optional[AsyncIOMotorDatabase]:
        return cls.db


# In-memory storage fallback if MongoDB is not active
IN_MEMORY_SESSIONS = {}
IN_MEMORY_MESSAGES = {}
