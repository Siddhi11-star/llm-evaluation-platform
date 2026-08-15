"""
Database package — PyMongo client initialisation.
"""

from pymongo import MongoClient
from config import cfg

_client: MongoClient | None = None


def get_client() -> MongoClient:
    """Return a singleton MongoClient."""
    global _client
    if _client is None:
        _client = MongoClient(cfg.MONGO_URI, serverSelectionTimeoutMS=3000)
    return _client


def get_db():
    """Return the application database handle."""
    return get_client()[cfg.MONGO_DB]


def ensure_indexes():
    """Create required indexes (idempotent — safe to call on every startup)."""
    try:
        db = get_db()
        db["users"].create_index("email", unique=True)
    except Exception:
        import logging
        logging.getLogger(__name__).warning(
            "Could not create DB indexes — MongoDB may not be running yet."
        )
