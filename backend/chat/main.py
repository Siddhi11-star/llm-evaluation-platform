import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Ensure directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from .config import settings
    from .db import MongoDB
    from .router import router as chat_router
except ImportError:
    from config import settings
    from db import MongoDB
    from router import router as chat_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("chat.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing JudgeAI Chat Service with MiniMax M3...")
    await MongoDB.connect()
    yield
    logger.info("Shutting down Chat Service...")
    await MongoDB.close()


app = FastAPI(
    title="JudgeAI Chat Service (MiniMax M3)",
    description="Dedicated Chat backend powered by MiniMax M3 Cloud with MongoDB chat history persistence.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Chat Router
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "service": "JudgeAI Chat Service",
        "model": settings.MINIMAX_MODEL,
        "docs": "/docs",
        "health": "/chat/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
