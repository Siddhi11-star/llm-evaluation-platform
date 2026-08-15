"""MongoDB Atlas Vector Search index definitions and query pipeline builders for task_embeddings."""

import logging
from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.operations import SearchIndexModel

from app.core.config import settings
from app.db.collections import TASK_EMBEDDINGS_COLLECTION

logger = logging.getLogger(__name__)


def get_task_embeddings_vector_index_definition(
    dimension: int = settings.EMBEDDING_DIMENSION,
    similarity: str = settings.EMBEDDING_SIMILARITY_METRIC,
) -> dict[str, Any]:
    """Return the Atlas Vector Search JSON index definition for task_embeddings collection.

    This matches MongoDB Atlas Search index configuration for vector queries on task_embedding.
    """
    return {
        "fields": [
            {
                "type": "vector",
                "path": "task_embedding",
                "numDimensions": dimension,
                "similarity": similarity,
            },
            {
                "type": "filter",
                "path": "provider",
            },
            {
                "type": "filter",
                "path": "model_id",
            },
            {
                "type": "filter",
                "path": "judge_model_used",
            },
        ]
    }


def build_vector_search_pipeline(
    query_vector: list[float],
    limit: int = 5,
    num_candidates: int = 50,
    filter_query: dict[str, Any] | None = None,
    index_name: str = settings.VECTOR_SEARCH_INDEX_NAME,
) -> list[dict[str, Any]]:
    """Build a MongoDB $vectorSearch aggregation pipeline for task similarity search."""
    vector_search_stage: dict[str, Any] = {
        "index": index_name,
        "path": "task_embedding",
        "queryVector": query_vector,
        "numCandidates": num_candidates,
        "limit": limit,
    }

    if filter_query:
        vector_search_stage["filter"] = filter_query

    pipeline: list[dict[str, Any]] = [
        {"$vectorSearch": vector_search_stage},
        {
            "$project": {
                "_id": 1,
                "task_description": 1,
                "model_id": 1,
                "provider": 1,
                "score_value": 1,
                "reasoning": 1,
                "judge_model_used": 1,
                "cost_per_1k_tokens": 1,
                "avg_latency_ms": 1,
                "created_at": 1,
                "similarity_score": {"$meta": "vectorSearchScore"},
            }
        },
    ]
    return pipeline


async def create_vector_search_index(
    db: AsyncIOMotorDatabase,
    index_name: str = settings.VECTOR_SEARCH_INDEX_NAME,
    dimension: int = settings.EMBEDDING_DIMENSION,
    similarity: str = settings.EMBEDDING_SIMILARITY_METRIC,
) -> dict[str, Any]:
    """Attempt to create the Atlas Vector Search index on the task_embeddings collection.

    Note: Atlas Search indexes require MongoDB Atlas (v7.0+). On local MongoDB instances,
    this helper logs the schema and provides instructions.
    """
    collection = db[TASK_EMBEDDINGS_COLLECTION]
    definition = get_task_embeddings_vector_index_definition(
        dimension=dimension,
        similarity=similarity,
    )

    try:
        search_index_model = SearchIndexModel(
            definition=definition,
            name=index_name,
            type="vectorSearch",
        )
        # Using Motor's create_search_index if connected to Atlas
        result = await collection.create_search_index(model=search_index_model)
        logger.info("Atlas Vector Search index '%s' created successfully: %s", index_name, result)
        return {"status": "created", "index_name": result, "definition": definition}
    except Exception as exc:
        logger.info(
            "Atlas Vector Search index creation skipped (standard for local/non-Atlas MongoDB): %s",
            exc,
        )
        return {
            "status": "skipped",
            "message": "Atlas Search requires MongoDB Atlas cluster. Index definition is ready.",
            "definition": definition,
            "error": str(exc),
        }
