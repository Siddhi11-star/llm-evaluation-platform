from datetime import datetime, timezone
from fastapi import APIRouter

from app.core.config import settings
from app.db.session import ping_db
from app.schemas.health import DatabaseHealth, HealthResponse

router = APIRouter()


@router.get(
    "",
    response_model=HealthResponse,
    summary="System and Database Health Check",
)
@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System and Database Health Check",
    include_in_schema=False,
)
async def health_check() -> HealthResponse:
    """Check health status of the API server and async MongoDB connection."""
    db_ping = await ping_db()
    is_healthy = db_ping.get("status") == "connected"

    db_health = DatabaseHealth(
        status=db_ping.get("status", "unknown"),
        latency_ms=db_ping.get("latency_ms"),
        database_name=settings.MONGODB_DB_NAME,
    )

    return HealthResponse(
        status="healthy" if is_healthy else "degraded",
        project=settings.PROJECT_NAME,
        version="0.1.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_health,
        details={"debug": settings.DEBUG},
    )
