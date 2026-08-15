"""Centralized MongoDB collection accessors for JudgeAI."""

from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from app.db.session import get_db

# Collection names
USERS_COLLECTION = "users"
TASK_EMBEDDINGS_COLLECTION = "task_embeddings"
EVALUATION_RUNS_COLLECTION = "evaluation_runs"
SCORES_COLLECTION = "scores"
RUBRICS_COLLECTION = "rubrics"


def get_users_collection(db: AsyncIOMotorDatabase | None = None) -> AsyncIOMotorCollection:
    database = db or get_db()
    return database[USERS_COLLECTION]


def get_task_embeddings_collection(db: AsyncIOMotorDatabase | None = None) -> AsyncIOMotorCollection:
    database = db or get_db()
    return database[TASK_EMBEDDINGS_COLLECTION]


def get_evaluation_runs_collection(db: AsyncIOMotorDatabase | None = None) -> AsyncIOMotorCollection:
    database = db or get_db()
    return database[EVALUATION_RUNS_COLLECTION]


def get_scores_collection(db: AsyncIOMotorDatabase | None = None) -> AsyncIOMotorCollection:
    database = db or get_db()
    return database[SCORES_COLLECTION]


def get_rubrics_collection(db: AsyncIOMotorDatabase | None = None) -> AsyncIOMotorCollection:
    database = db or get_db()
    return database[RUBRICS_COLLECTION]
