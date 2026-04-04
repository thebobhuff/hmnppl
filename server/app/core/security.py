"""Security utilities — API key authentication and request size enforcement.

Provides:
    - A FastAPI dependency that validates the ``X-API-Key`` header.
    - Middleware that rejects oversized request bodies based on route tier.

Size limits (configurable via environment):
    - ``MAX_UPLOAD_BYTES``  — file/evidence uploads (default 10 MB)
    - ``MAX_AI_PAYLOAD_BYTES`` — AI endpoint JSON payloads (default 10 KB)
"""

from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from app.core.config import Settings, get_settings

# ---------------------------------------------------------------------------
# Size limits (bytes)
# ---------------------------------------------------------------------------

# 10 MB — for evidence / file upload endpoints
DEFAULT_MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024
# 10 KB — for AI endpoint JSON payloads
DEFAULT_MAX_AI_PAYLOAD_BYTES: int = 10 * 1024


# ---------------------------------------------------------------------------
# API-key validation dependency
# ---------------------------------------------------------------------------


def _extract_api_key(request: Request) -> str | None:
    """Read the API key from the ``X-API-Key`` header.

    Returns ``None`` when the header is absent.
    """
    return request.headers.get("X-API-Key")


async def validate_api_key(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> str:
    """FastAPI dependency that enforces API key authentication.

    Raises:
        HTTPException: 401 if the key is missing or does not match.
    """
    key = _extract_api_key(request)

    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )

    if key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    return key


# ---------------------------------------------------------------------------
# Request-size-limit middleware
# ---------------------------------------------------------------------------


def _resolve_max_body_bytes(
    path: str,
    max_upload: int,
    max_ai: int,
) -> int | None:
    """Return the maximum allowed body size for *path*, or ``None`` for unlimited.

    Routes under ``/ai/`` use the AI payload limit.  Everything else
    falls back to the upload limit.
    """
    if path.startswith("/ai"):
        return max_ai
    return max_upload


def create_request_size_middleware(
    max_upload_bytes: int = DEFAULT_MAX_UPLOAD_BYTES,
    max_ai_payload_bytes: int = DEFAULT_MAX_AI_PAYLOAD_BYTES,
):
    """Return a FastAPI middleware callable that enforces request body size limits.

    Args:
        max_upload_bytes: Maximum body size for general / upload routes.
        max_ai_payload_bytes: Maximum body size for ``/ai/*`` routes.

    Usage::

        from app.core.security import create_request_size_middleware
        app = FastAPI()
        create_request_size_middleware().add_to(app)
    """

    class _RequestSizeMiddleware:
        """Middleware class so tests can reference the limiter state."""

        def __init__(self) -> None:
            self.max_upload_bytes = max_upload_bytes
            self.max_ai_payload_bytes = max_ai_payload_bytes

        def add_to(self, app: FastAPI) -> None:
            """Register this middleware on the given FastAPI *app*."""

            @app.middleware("http")
            async def request_size_middleware(request: Request, call_next):
                return await self._check(request, call_next)

        async def _check(self, request: Request, call_next):  # noqa: ANN001
            """Enforce body-size limits before routing the request."""
            # Only check methods that carry a body
            if request.method in ("GET", "HEAD", "OPTIONS"):
                return await call_next(request)

            content_length = request.headers.get("content-length")
            if content_length is not None:
                try:
                    length = int(content_length)
                except (ValueError, TypeError):
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"detail": "Invalid Content-Length header."},
                    )

                limit = _resolve_max_body_bytes(
                    request.url.path,
                    self.max_upload_bytes,
                    self.max_ai_payload_bytes,
                )

                if limit is not None and length > limit:
                    limit_label = (
                        "AI payload" if request.url.path.startswith("/ai") else "upload"
                    )
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": (
                                f"{limit_label} payload exceeds the "
                                f"maximum allowed size of {limit} bytes."
                            ),
                        },
                    )

            return await call_next(request)

    return _RequestSizeMiddleware()
