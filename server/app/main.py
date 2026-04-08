"""FastAPI application entry point.

Creates the application instance, registers middleware (CORS, request ID,
rate limiting, request size limits), includes routers, and initialises
structured logging.
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.core.rate_limit import RateLimiter, TIER_AI, TIER_STANDARD
from app.core.security import create_request_size_middleware
from app.routers import ai, agents, health


# ---- Lifespan ----


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler — runs on startup and shutdown."""
    settings = get_settings()
    setup_logging(level=settings.LOG_LEVEL)
    logger = get_logger(__name__)
    logger.info(
        "AI HR Platform service starting",
        extra={"log_level": settings.LOG_LEVEL},
    )
    yield
    logger.info("AI HR Platform service shutting down")


# ---- Application factory ----


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="AI HR Platform — AI Service",
        version="0.1.0",
        description=(
            "Python micro-service providing AI-powered HR features: "
            "incident evaluation, document generation, meeting agenda "
            "creation, and meeting summarisation."
        ),
        lifespan=lifespan,
    )

    # ---- Middleware ----

    # Security response headers on every response
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        """Apply security headers to every HTTP response."""
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        return response

    # CORS — locked to configured origins only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting — tiered by route prefix
    rate_limiter = RateLimiter()
    rate_limiter.configure("/ai", TIER_AI)
    rate_limiter.configure("", TIER_STANDARD)  # default fallback
    rate_limiter.add_to(app)

    # Request size limits — reject oversized payloads
    size_limiter = create_request_size_middleware()
    size_limiter.add_to(app)

    # Request-ID — attach a unique identifier to every request
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        """Inject a ``X-Request-ID`` header for distributed tracing."""
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # ---- Routers ----

    app.include_router(health.router)
    app.include_router(ai.router)
    app.include_router(agents.router)

    return app


# Module-level app instance for uvicorn
app = create_app()
