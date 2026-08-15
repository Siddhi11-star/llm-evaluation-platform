"""Service handling task embedding storage and vector search queries."""

from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.collections import get_task_embeddings_collection
from app.db.vector_search import build_vector_search_pipeline
from app.schemas.task import TaskEmbeddingCreate


class VectorService:
    """Service for indexing and retrieving task embeddings with vector similarity search."""

    async def insert_task_embedding(
        self,
        db: AsyncIOMotorDatabase,
        task_in: TaskEmbeddingCreate,
    ) -> dict[str, Any]:
        """Save a new task embedding document to MongoDB."""
        collection = get_task_embeddings_collection(db)
        doc = task_in.model_dump()
        doc["created_at"] = datetime.now(timezone.utc)
        result = await collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def search_similar_tasks(
        self,
        db: AsyncIOMotorDatabase,
        query_vector: list[float],
        limit: int = 5,
        num_candidates: int = 50,
        filter_query: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Search similar past evaluation tasks using Atlas Vector Search aggregation."""
        collection = get_task_embeddings_collection(db)
        pipeline = build_vector_search_pipeline(
            query_vector=query_vector,
            limit=limit,
            num_candidates=num_candidates,
            filter_query=filter_query,
        )
        cursor = collection.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        return results


vector_service = VectorService()
