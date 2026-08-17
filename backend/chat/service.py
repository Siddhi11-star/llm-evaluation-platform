import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
try:
    from .db import MongoDB, IN_MEMORY_SESSIONS, IN_MEMORY_MESSAGES
    from .models import (
        ChatMessage,
        SendMessageRequest,
        ChatResponse,
        ChatSession,
        ChatSessionDetail,
    )
    from .ollama_client import ollama_client
    from .minimax_client import minimax_client
    from .config import settings
except ImportError:
    from db import MongoDB, IN_MEMORY_SESSIONS, IN_MEMORY_MESSAGES
    from models import (
        ChatMessage,
        SendMessageRequest,
        ChatResponse,
        ChatSession,
        ChatSessionDetail,
    )
    from ollama_client import ollama_client
    from minimax_client import minimax_client
    from config import settings

logger = logging.getLogger("chat.service")


class ChatService:
    @staticmethod
    def _generate_title(first_message: str) -> str:
        trimmed = first_message.strip().replace("\n", " ")
        if len(trimmed) > 36:
            return trimmed[:36] + "..."
        return trimmed or "New Chat"

    @classmethod
    async def get_or_create_session(cls, session_id: Optional[str] = None, first_message: str = "", model: str = "") -> ChatSession:
        db = MongoDB.get_db()
        target_model = model or (settings.OLLAMA_MODEL if settings.USE_OLLAMA else settings.MINIMAX_MODEL)
        now = datetime.utcnow()

        if session_id:
            if db is not None:
                doc = await db.chat_sessions.find_one({"session_id": session_id})
                if doc:
                    return ChatSession(
                        session_id=doc["session_id"],
                        title=doc.get("title", "Chat"),
                        model=doc.get("model", target_model),
                        created_at=doc.get("created_at", now),
                        updated_at=doc.get("updated_at", now),
                        message_count=doc.get("message_count", 0),
                        last_message_preview=doc.get("last_message_preview"),
                    )
            elif session_id in IN_MEMORY_SESSIONS:
                s = IN_MEMORY_SESSIONS[session_id]
                return ChatSession(**s)

        new_id = session_id or f"sess_{uuid.uuid4().hex[:12]}"
        title = cls._generate_title(first_message)
        session_data = {
            "session_id": new_id,
            "title": title,
            "model": target_model,
            "created_at": now,
            "updated_at": now,
            "message_count": 0,
            "last_message_preview": None,
        }

        if db is not None:
            await db.chat_sessions.update_one(
                {"session_id": new_id},
                {"$set": session_data},
                upsert=True
            )
        else:
            IN_MEMORY_SESSIONS[new_id] = session_data

        return ChatSession(**session_data)

    @classmethod
    async def get_session_history(cls, session_id: str) -> List[ChatMessage]:
        db = MongoDB.get_db()
        messages: List[ChatMessage] = []

        if db is not None:
            cursor = db.chat_messages.find({"session_id": session_id}).sort("timestamp", 1)
            async for doc in cursor:
                messages.append(ChatMessage(
                    role=doc["role"],
                    content=doc["content"],
                    thinking=doc.get("thinking"),
                    files=doc.get("files"),
                    timestamp=doc.get("timestamp"),
                    model=doc.get("model"),
                    tokens=doc.get("tokens"),
                    metadata=doc.get("metadata"),
                ))
        else:
            stored = IN_MEMORY_MESSAGES.get(session_id, [])
            messages = [ChatMessage(**m) for m in stored]

        return messages

    @staticmethod
    def _build_system_prompt(model: str) -> str:
        lower = model.lower()
        if "glm" in lower:
            return f"You are JudgeAI powered by GLM ({model}). Provide comprehensive, logically sound, step-by-step reasoning with zero hallucination."
        if "deepseek" in lower:
            return f"You are JudgeAI powered by DeepSeek ({model}). Perform rigorous chain-of-thought verification and structured analytical evaluation."
        if "nemotron" in lower:
            return f"You are JudgeAI powered by NVIDIA Nemotron ({model}). Focus on rigorous rubric scoring, safety guardrails, and model evaluation."
        if "gpt-oss" in lower:
            return f"You are JudgeAI powered by GPT-OSS ({model}). Provide direct, authoritative, and structured technical insights."
        if "gemma" in lower:
            return f"You are JudgeAI powered by Google Gemma ({model}). Deliver precise, concise, and benchmark-accurate responses."
        return f"You are JudgeAI, an AI evaluation assistant powered by Ollama ({model}). You provide highly accurate, structured, and insightful answers with zero hallucination."

    @classmethod
    async def send_message(cls, req: SendMessageRequest) -> ChatResponse:
        active_model = req.model or (settings.OLLAMA_MODEL if settings.USE_OLLAMA else settings.MINIMAX_MODEL)
        session = await cls.get_or_create_session(
            session_id=req.session_id,
            first_message=req.message,
            model=active_model
        )

        now = datetime.utcnow()
        db = MongoDB.get_db()

        # 1. Save user message to MongoDB
        serialized_files = [f.model_dump() for f in req.files] if req.files else None
        user_msg_data = {
            "session_id": session.session_id,
            "role": "user",
            "content": req.message,
            "files": serialized_files,
            "timestamp": now,
            "model": active_model,
            "tokens": len(req.message.split()),
        }

        if db is not None:
            await db.chat_messages.insert_one(user_msg_data)
        else:
            IN_MEMORY_MESSAGES.setdefault(session.session_id, []).append(user_msg_data)

        # 2. Build conversation context
        history = await cls.get_session_history(session.session_id)
        prompt_payload: List[Dict[str, Any]] = []

        if req.system_prompt:
            prompt_payload.append({"role": "system", "content": req.system_prompt})
        else:
            prompt_payload.append({
                "role": "system",
                "content": cls._build_system_prompt(active_model),
            })

        # Augment latest prompt if files/photos are attached
        augmented_user_message = req.message
        if req.files:
            file_sections = []
            for f in req.files:
                if f.type.startswith("image/"):
                    file_sections.append(f"[Attached Photo/Image: {f.name} ({f.type})]")
                else:
                    file_sections.append(
                        f"--- Attached Document: {f.name} ({f.type}) ---\n{f.content or ''}\n--- End of {f.name} ---"
                    )
            augmented_user_message = "\n\n".join(file_sections) + f"\n\nUser Query:\n{req.message}"

        for msg in history[-10:]:
            # Use augmented content for the current prompt
            content_to_send = augmented_user_message if msg.timestamp == now else msg.content
            prompt_payload.append({"role": msg.role, "content": content_to_send})

        # 3. Call Ollama for MiniMax inference (or fallback to MiniMax Cloud if configured)
        if settings.USE_OLLAMA:
            result = await ollama_client.chat(
                messages=prompt_payload,
                model=active_model,
                temperature=req.temperature or 0.7,
            )
        else:
            result = await minimax_client.generate_response(
                messages=prompt_payload,
                model=active_model,
                temperature=req.temperature or 0.7,
            )

        assistant_text = result["content"]
        assistant_thinking = result.get("thinking")
        tokens_used = result.get("usage", {}).get("completion_tokens", len(assistant_text.split()))

        # 4. Save assistant reply to MongoDB
        assistant_now = datetime.utcnow()
        assistant_msg_data = {
            "session_id": session.session_id,
            "role": "assistant",
            "content": assistant_text,
            "thinking": assistant_thinking,
            "timestamp": assistant_now,
            "model": active_model,
            "tokens": tokens_used,
            "metadata": {"finish_reason": result.get("finish_reason")},
        }

        if db is not None:
            await db.chat_messages.insert_one(assistant_msg_data)
            await db.chat_sessions.update_one(
                {"session_id": session.session_id},
                {
                    "$set": {
                        "updated_at": assistant_now,
                        "model": active_model,
                        "last_message_preview": assistant_text[:60] + ("..." if len(assistant_text) > 60 else ""),
                    },
                    "$inc": {"message_count": 2},
                }
            )
        else:
            IN_MEMORY_MESSAGES.setdefault(session.session_id, []).append(assistant_msg_data)
            if session.session_id in IN_MEMORY_SESSIONS:
                IN_MEMORY_SESSIONS[session.session_id]["updated_at"] = assistant_now
                IN_MEMORY_SESSIONS[session.session_id]["message_count"] += 2
                IN_MEMORY_SESSIONS[session.session_id]["last_message_preview"] = assistant_text[:60]

        return ChatResponse(
            session_id=session.session_id,
            message=ChatMessage(
                role="assistant",
                content=assistant_text,
                thinking=assistant_thinking,
                timestamp=assistant_now,
                model=active_model,
                tokens=tokens_used,
            ),
            model=active_model,
            finish_reason=result.get("finish_reason", "stop"),
            usage=result.get("usage"),
        )

    @classmethod
    async def list_sessions(cls, limit: int = 50) -> List[ChatSession]:
        db = MongoDB.get_db()
        sessions: List[ChatSession] = []

        if db is not None:
            cursor = db.chat_sessions.find().sort("updated_at", -1).limit(limit)
            async for doc in cursor:
                sessions.append(ChatSession(
                    session_id=doc["session_id"],
                    title=doc.get("title", "Chat"),
                    model=doc.get("model", settings.OLLAMA_MODEL),
                    created_at=doc.get("created_at", datetime.utcnow()),
                    updated_at=doc.get("updated_at", datetime.utcnow()),
                    message_count=doc.get("message_count", 0),
                    last_message_preview=doc.get("last_message_preview"),
                ))
        else:
            sorted_in_mem = sorted(
                IN_MEMORY_SESSIONS.values(),
                key=lambda s: s.get("updated_at", datetime.min),
                reverse=True
            )[:limit]
            sessions = [ChatSession(**s) for s in sorted_in_mem]

        return sessions

    @classmethod
    async def get_session_detail(cls, session_id: str) -> Optional[ChatSessionDetail]:
        session = await cls.get_or_create_session(session_id=session_id)
        messages = await cls.get_session_history(session_id)
        return ChatSessionDetail(
            session_id=session.session_id,
            title=session.title,
            model=session.model,
            created_at=session.created_at,
            updated_at=session.updated_at,
            messages=messages,
        )

    @classmethod
    async def update_session_title(cls, session_id: str, new_title: str) -> bool:
        db = MongoDB.get_db()
        if db is not None:
            res = await db.chat_sessions.update_one(
                {"session_id": session_id},
                {"$set": {"title": new_title, "updated_at": datetime.utcnow()}}
            )
            return res.modified_count > 0
        elif session_id in IN_MEMORY_SESSIONS:
            IN_MEMORY_SESSIONS[session_id]["title"] = new_title
            IN_MEMORY_SESSIONS[session_id]["updated_at"] = datetime.utcnow()
            return True
        return False

    @classmethod
    async def delete_session(cls, session_id: str) -> bool:
        db = MongoDB.get_db()
        if db is not None:
            await db.chat_messages.delete_many({"session_id": session_id})
            res = await db.chat_sessions.delete_one({"session_id": session_id})
            return res.deleted_count > 0
        else:
            IN_MEMORY_MESSAGES.pop(session_id, None)
            return IN_MEMORY_SESSIONS.pop(session_id, None) is not None
