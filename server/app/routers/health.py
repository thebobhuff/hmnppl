"""Health-check router.

Provides a lightweight ``GET /health`` endpoint for uptime monitoring,
load-balancer probes, and Railway health checks.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Return service health status.

    Returns:
        A JSON object with ``status`` and an ISO 8601 ``timestamp``.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
