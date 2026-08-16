from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.api.v1.endpoints.health import health_check
from app.core.config import settings
from app.db.session import close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """FastAPI lifespan context manager handling async startup and shutdown hooks."""
    # Startup: Initialize async Motor client
    await connect_to_mongo()
    yield
    # Shutdown: Close database connections
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API service for JudgeAI LLM evaluation platform with parallel judges, multi-rubric scoring, and vector-based recommendations.",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS Middleware for Vite Frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health probe endpoint
app.add_api_route(
    "/health",
    health_check,
    methods=["GET"],
    tags=["Health"],
    summary="Top-level Health Probe",
)


@app.get("/", tags=["Root"], summary="Root API Index")
async def root() -> JSONResponse:
    """Root endpoint welcoming clients and referencing documentation."""
    return JSONResponse(
        content={
            "project": settings.PROJECT_NAME,
            "version": "0.1.0",
            "status": "online",
            "docs_url": "/docs",
            "api_v1_url": settings.API_V1_STR,
        }
    )


import os
from fastapi.responses import FileResponse, HTMLResponse

# Mount API V1 endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/swarm-monitor", response_class=HTMLResponse, tags=["Agent Swarm"])
@app.get("/agent-swarm-monitor", response_class=HTMLResponse, tags=["Agent Swarm"])
async def serve_swarm_monitor() -> FileResponse:
    """Serve the plain HTML/CSS/JS dense Kimi-style Agent Swarm Control Console."""
    html_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../frontend/agent_swarm_monitor.html")
    )
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return HTMLResponse("<h1>Agent Swarm Monitor not found</h1>", status_code=404)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
