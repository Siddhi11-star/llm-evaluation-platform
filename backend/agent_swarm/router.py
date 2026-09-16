import json
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import BaseModel

try:
    from .swarm_engine import run_swarm, run_swarm_stream
    from .config import settings
    from .db import SwarmDatabase
    from backend.shared.auth_middleware import get_current_authenticated_user
except ImportError:
    try:
        from swarm_engine import run_swarm, run_swarm_stream
        from config import settings
        from db import SwarmDatabase
        from shared.auth_middleware import get_current_authenticated_user
    except ImportError:
        import os
        from swarm_engine import run_swarm, run_swarm_stream
        from config import settings
        from db import SwarmDatabase

        security_bearer = HTTPBearer(auto_error=False)

        async def get_current_authenticated_user(
            credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
            authorization: Optional[str] = Header(None),
        ) -> Dict[str, Any]:
            token = None
            if credentials and credentials.credentials:
                token = credentials.credentials
            elif authorization and authorization.startswith("Bearer "):
                token = authorization.split("Bearer ", 1)[1].strip()

            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication credentials were not provided.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            secret_key = getattr(settings, "JWT_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "judgeai-dev-secret-key-change-in-production-e938bf8c991a47290bc"))
            algorithm = getattr(settings, "JWT_ALGORITHM", os.getenv("JWT_ALGORITHM", "HS256"))

            try:
                payload = jwt.decode(token, secret_key, algorithms=[algorithm])
                user_id = payload.get("sub")
                email = payload.get("email")
                if not user_id or not email:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Malformed token claims.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                return {
                    "id": str(user_id),
                    "email": str(email),
                    "name": payload.get("name", "User"),
                    "email_verified": payload.get("email_verified", False),
                }
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session has expired. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except jwt.InvalidTokenError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

security_bearer = HTTPBearer(auto_error=False)

async def get_current_authenticated_user_flexible(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    Resolves authenticated user from Authorization header, Bearer credentials, or token query param.
    """
    raw_token = None
    if credentials and credentials.credentials:
        raw_token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split("Bearer ", 1)[1].strip()
    elif token:
        raw_token = token.strip()

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    secret_key = getattr(settings, "JWT_SECRET_KEY", "judgeai-dev-secret-key-change-in-production-e938bf8c991a47290bc")
    algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(raw_token, secret_key, algorithms=[algorithm])
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token claims.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {
            "id": str(user_id),
            "email": str(email),
            "name": payload.get("name", "User"),
            "email_verified": payload.get("email_verified", False),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

logger = logging.getLogger("swarm.router")

router = APIRouter(prefix="/api/swarm")


class SwarmRunRequest(BaseModel):
    prompt: str
    model: Optional[str] = None  # ignored — orchestrator dynamically assigns specialized models


async def format_sse_stream(generator):
    """Encodes async generator dictionaries into standard text/event-stream chunks."""
    async for item in generator:
        event_name = item.get("event", "message")
        event_data = json.dumps(item.get("data", {}))
        yield f"event: {event_name}\ndata: {event_data}\n\n"


@router.post("/run")
async def run_swarm_endpoint(
    req: SwarmRunRequest,
    current_user: Dict[str, Any] = Depends(get_current_authenticated_user)
):
    """
    Main endpoint: receives user prompt from authenticated user,
    runs the full multi-agent swarm pipeline, persists the completed session
    to MongoDB with strict user ID association, and returns the session deliverable.
    """
    user_id = current_user.get("id") or current_user.get("email")
    logger.info(f"POST /api/swarm/run — user={user_id} prompt={req.prompt[:80]}…")

    # Run genuine multi-agent swarm pipeline
    result = await run_swarm(prompt=req.prompt, model=req.model)

    # Persist session to MongoDB with user ID and telemetry
    try:
        saved_session = await SwarmDatabase.save_session(result, user_id=user_id)
        return saved_session
    except Exception as e:
        logger.error(f"Failed to persist swarm session: {e}")
        # Even if DB write fails, safely return the execution result without crashing
        result["user_id"] = user_id
        return result


@router.post("/stream")
@router.post("/run/stream")
async def run_swarm_stream_post(
    req: SwarmRunRequest,
    current_user: Dict[str, Any] = Depends(get_current_authenticated_user_flexible)
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for swarm execution via POST.
    Streams execution lifecycle events:
      - swarm_started
      - orchestrator_planning
      - agent_started
      - agent_completed / agent_failed
      - synthesis_started
      - synthesis_completed
      - swarm_completed
    Persists completed session to MongoDB.
    """
    user_id = current_user.get("id") or current_user.get("email")
    logger.info(f"POST /api/swarm/stream — user={user_id} prompt={req.prompt[:80]}…")

    stream_gen = run_swarm_stream(prompt=req.prompt, user_id=user_id, model=req.model)

    return StreamingResponse(
        format_sse_stream(stream_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/stream")
async def run_swarm_stream_get(
    prompt: str = Query(..., description="Prompt to run the swarm on"),
    model: Optional[str] = Query(None, description="Optional model parameter"),
    current_user: Dict[str, Any] = Depends(get_current_authenticated_user_flexible)
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for swarm execution via GET.
    Enables native browser EventSource connections.
    """
    user_id = current_user.get("id") or current_user.get("email")
    logger.info(f"GET /api/swarm/stream — user={user_id} prompt={prompt[:80]}…")

    stream_gen = run_swarm_stream(prompt=prompt, user_id=user_id, model=model)

    return StreamingResponse(
        format_sse_stream(stream_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/history")
async def get_swarm_history(
    limit: int = Query(50, ge=1, le=100, description="Max number of sessions to return"),
    skip: int = Query(0, ge=0, description="Number of sessions to skip for pagination"),
    current_user: Dict[str, Any] = Depends(get_current_authenticated_user)
):
    """
    Retrieves all swarm history sessions for the authenticated user only.
    Orders sessions newest first.
    """
    user_id = current_user.get("id") or current_user.get("email")
    sessions, total = await SwarmDatabase.list_sessions(user_id=user_id, limit=limit, skip=skip)
    return {
        "sessions": sessions,
        "total": total,
        "limit": limit,
        "skip": skip,
        "user_id": user_id,
    }


@router.get("/history/{session_id}")
async def get_swarm_session_detail(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_authenticated_user)
):
    """
    Retrieves detailed results for a single swarm session.
    Strictly enforces user isolation: returns 404 if the session does not belong to the user.
    """
    user_id = current_user.get("id") or current_user.get("email")
    session = await SwarmDatabase.get_session_by_id(session_id=session_id, user_id=user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swarm session not found or access denied."
        )
    return session


@router.get("/health")
async def health():
    """Returns connectivity and health status for Ollama and MongoDB."""
    db_connected = SwarmDatabase.get_db() is not None
    return {
        "status": "ok",
        "orchestrator": settings.ORCHESTRATOR_MODEL,
        "agent_models": settings.AGENT_MODELS,
        "ollama_url": settings.OLLAMA_BASE_URL,
        "mongodb_connected": db_connected,
        "database_name": settings.MONGODB_DB_NAME,
    }


@router.get("/models")
async def list_agent_models():
    """Returns the list of available sub-agent cloud models."""
    return {
        "orchestrator": settings.ORCHESTRATOR_MODEL,
        "agents": settings.AGENT_MODELS,
    }
