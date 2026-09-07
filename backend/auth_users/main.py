"""
Main FastAPI Application for JudgeAI Auth Service (Port 8004).
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure package directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

try:
    from .config import settings
    from .db import UserDatabase
    from .router import router as auth_router
except ImportError:
    from config import settings
    from db import UserDatabase
    from router import router as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("auth.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing JudgeAI Auth Service...")
    await UserDatabase.connect()
    yield
    logger.info("Shutting down Auth Service...")
    await UserDatabase.close()


app = FastAPI(
    title="JudgeAI Auth Service",
    description="Authentication & User Account Microservice for JudgeAI Evaluation Ecosystem.",
    version="1.0.0",
    lifespan=lifespan,
)

# Security Headers Middleware (Phase 4 Hardening)
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Enable CORS specifically for frontend origins (credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth Router
app.include_router(auth_router)


@app.get("/")
async def root():
    return {
        "service": "JudgeAI Auth Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auth_users"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.AUTH_HOST, port=settings.AUTH_PORT, reload=True)
