from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from .models import (
    SendMessageRequest,
    ChatResponse,
    ChatSession,
    ChatSessionDetail,
    UpdateSessionTitleRequest,
)
from .service import ChatService
from .ollama_client import ollama_client
from .db import MongoDB
from .config import settings

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(req: SendMessageRequest):
    """
    Submit a prompt to Ollama (targeting MiniMax or selected model), persist conversation in MongoDB, and return reply.
    """
    try:
        response = await ChatService.send_message(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.get("/models")
async def list_available_models():
    """
    Lists models available in local Ollama instance.
    """
    installed = await ollama_client.list_models()
    return {
        "provider": "ollama",
        "default_model": settings.OLLAMA_MODEL,
        "use_ollama": settings.USE_OLLAMA,
        "ollama_url": settings.OLLAMA_BASE_URL,
        "models": installed or [
            {"name": "minimax", "modified_at": "latest", "size": "7B"},
            {"name": "minimax-m3", "modified_at": "latest", "size": "14B"},
            {"name": "llama3.3:70b", "modified_at": "latest", "size": "70B"},
            {"name": "mistral", "modified_at": "latest", "size": "7B"},
            {"name": "deepseek-r1", "modified_at": "latest", "size": "8B"},
        ],
    }


@router.post("/pull-model")
async def pull_ollama_model(model_name: str = Body(..., embed=True)):
    """
    Instructs Ollama to pull a model (e.g. 'minimax' or 'minimax-m3').
    """
    result = await ollama_client.pull_model(model_name)
    return result


@router.get("/sessions", response_model=List[ChatSession])
async def list_chat_sessions(limit: int = Query(50, ge=1, le=200)):
    """
    List all chat history sessions stored in MongoDB.
    """
    return await ChatService.list_sessions(limit=limit)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_chat_session(session_id: str):
    """
    Retrieve full conversation history for a specific session.
    """
    detail = await ChatService.get_session_detail(session_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Session not found")
    return detail


@router.put("/sessions/{session_id}")
async def update_session_title(session_id: str, req: UpdateSessionTitleRequest):
    """
    Update the title of a chat session.
    """
    success = await ChatService.update_session_title(session_id, req.title)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not modified")
    return {"status": "success", "session_id": session_id, "title": req.title}


@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """
    Delete a chat session and all its associated messages from MongoDB.
    """
    success = await ChatService.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "message": f"Session {session_id} deleted successfully"}


@router.get("/health")
async def chat_health_check():
    """
    Returns connectivity status for Ollama, MiniMax, and MongoDB.
    """
    db_connected = MongoDB.get_db() is not None
    ollama_models = await ollama_client.list_models()
    return {
        "status": "healthy",
        "service": "JudgeAI Chat Backend",
        "engine": "ollama",
        "model": settings.OLLAMA_MODEL,
        "ollama_connected": len(ollama_models) > 0 or bool(settings.OLLAMA_BASE_URL),
        "ollama_url": settings.OLLAMA_BASE_URL,
        "mongodb_connected": db_connected,
        "database_name": settings.MONGODB_DB_NAME,
    }
