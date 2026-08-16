from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the speaker: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")
    thinking: Optional[str] = Field(None, description="Optional internal reasoning trace")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model: Optional[str] = None
    tokens: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Existing session ID. If not provided, a new session is created.")
    message: str = Field(..., description="User prompt text")
    model: Optional[str] = Field(None, description="Override model, defaults to MiniMax-Text-01 (M3)")
    system_prompt: Optional[str] = Field(None, description="Optional custom system directive")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=1.0)
    stream: Optional[bool] = Field(False, description="Whether to stream the response chunks")


class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessage
    model: str
    finish_reason: Optional[str] = "stop"
    usage: Optional[Dict[str, int]] = None


class ChatSession(BaseModel):
    session_id: str
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: Optional[str] = None


class ChatSessionDetail(BaseModel):
    session_id: str
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessage]


class UpdateSessionTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
