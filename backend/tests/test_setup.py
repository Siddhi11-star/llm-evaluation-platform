"""Validation script testing core components, schemas, security, and routes."""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))


def test_core_config():
    """Verify settings loads properly."""
    from app.core.config import settings

    assert settings.PROJECT_NAME == "JudgeAI Evaluation Platform"
    assert "http://localhost:5173" in settings.BACKEND_CORS_ORIGINS
    assert settings.EMBEDDING_DIMENSION == 1536
    assert settings.VECTOR_SEARCH_INDEX_NAME == "task_embeddings_vector_index"
    print("✓ Config and settings loaded successfully.")


def test_security():
    """Verify bcrypt hashing and JWT token creation/decoding."""
    from app.core.security import (
        create_access_token,
        decode_access_token,
        get_password_hash,
        verify_password,
    )

    raw_password = "SecurePassword123!"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    user_id = "507f1f77bcf86cd799439011"
    token = create_access_token(subject=user_id, extra_claims={"email": "test@example.com"})
    decoded = decode_access_token(token)
    assert decoded["sub"] == user_id
    assert decoded["email"] == "test@example.com"
    print("✓ Security (bcrypt password hashing and JWT token lifecycle) verified.")


def test_schemas():
    """Verify Pydantic user, onboarding, and task schemas."""
    from bson import ObjectId
    from app.schemas.health import DatabaseHealth, HealthResponse
    from app.schemas.task import TaskEmbeddingCreate, TaskEmbeddingResponse
    from app.schemas.user import (
        OnboardingData,
        OnboardingStepEnum,
        UserCreate,
        UserOnboardingUpdate,
        UserResponse,
    )

    # UserCreate
    user_in = UserCreate(
        email="test@judgeai.com",
        password="mypassword123",
        full_name="Judge Tester",
        organization_name="AI Lab",
        role="Evaluator",
    )
    assert user_in.email == "test@judgeai.com"

    # UserResponse with ObjectId conversion
    mock_id = ObjectId()
    user_resp = UserResponse(
        _id=str(mock_id),
        email="test@judgeai.com",
        full_name="Judge Tester",
        is_active=True,
        is_onboarded=False,
        onboarding_step=OnboardingStepEnum.WELCOME.value,
        onboarding_data=OnboardingData(
            organization_name="AI Lab",
            role="Evaluator",
            use_case="rag_eval",
            preferred_models=["qwen3:14b", "llama-3.3-70b-versatile"],
        ),
    )
    assert user_resp.id == str(mock_id)
    assert user_resp.onboarding_data.use_case == "rag_eval"

    # Onboarding update
    onboarding_update = UserOnboardingUpdate(
        step=OnboardingStepEnum.COMPLETED.value,
        is_onboarded=True,
        use_case="summarization",
    )
    assert onboarding_update.is_onboarded is True

    # TaskEmbedding
    embedding = [0.1] * 1536
    task = TaskEmbeddingCreate(
        task_description="Summarize legal document",
        model_id="llama-3.3-70b-versatile",
        provider="groq",
        score_value=8.5,
        task_embedding=embedding,
    )
    assert task.model_id == "llama-3.3-70b-versatile"
    assert len(task.task_embedding) == 1536

    print("✓ Schemas validation and serialization verified.")


def test_vector_search_definition():
    """Verify Atlas Vector Search index definition."""
    from app.db.vector_search import (
        build_vector_search_pipeline,
        get_task_embeddings_vector_index_definition,
    )

    definition = get_task_embeddings_vector_index_definition(dimension=1536, similarity="cosine")
    fields = definition["fields"]
    vector_field = next(f for f in fields if f["type"] == "vector")
    assert vector_field["path"] == "task_embedding"
    assert vector_field["numDimensions"] == 1536
    assert vector_field["similarity"] == "cosine"

    pipeline = build_vector_search_pipeline(query_vector=[0.0] * 1536, limit=10)
    assert "$vectorSearch" in pipeline[0]
    assert pipeline[0]["$vectorSearch"]["index"] == "task_embeddings_vector_index"
    print("✓ Atlas Vector Search index definition verified.")


def test_fastapi_app():
    """Verify FastAPI application, routing, and CORS middleware configuration."""
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.testclient import TestClient
    from app.main import app

    openapi = app.openapi()
    paths = openapi.get("paths", {})

    assert "/health" in paths
    assert "/api/v1/health" in paths
    assert "/api/v1/auth/signup" in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/users/me" in paths
    assert "/api/v1/users/me/onboarding" in paths

    # Check CORS middleware is present
    has_cors = any(m.cls == CORSMiddleware for m in app.user_middleware)
    assert has_cors is True

    # Test root endpoint with TestClient
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

    print("✓ FastAPI app, OpenAPI paths, and root endpoint verified.")


if __name__ == "__main__":
    print("Running JudgeAI Backend Setup Tests...")
    test_core_config()
    test_security()
    test_schemas()
    test_vector_search_definition()
    test_fastapi_app()
    print("\nAll verification tests PASSED successfully! 🚀")
