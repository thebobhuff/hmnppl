"""In-memory rate-limiting middleware.

Implements a sliding-window rate limiter that tracks request counts per
client key (IP address or API key) and returns HTTP 429 when limits are
exceeded.

Rate-limit tiers:
    - Standard endpoints:  100 requests / minute
    - AI endpoints (/ai/*):  20 requests / minute
    - Auth endpoints:        10 requests / minute  (reserved for future use)

The limiter uses a simple fixed-window counter per key that resets every
60 seconds.  This is lightweight and suitable for single-instance
deployments; for multi-instance production, replace the in-memory store
with Redis.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

WINDOW_SECONDS: int = 60  # 1-minute sliding window


@dataclass
class RateLimitTier:
    """A named rate-limit configuration."""

    max_requests: int
    window_seconds: int = WINDOW_SECONDS


# Pre-defined tiers
TIER_STANDARD = RateLimitTier(max_requests=100)
TIER_AI = RateLimitTier(max_requests=20)
TIER_AUTH = RateLimitTier(max_requests=10)


@dataclass
class _Bucket:
    """Tracks request count and window start for a single key."""

    count: int = 0
    window_start: float = 0.0


# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------


class RateLimiter:
    """In-memory fixed-window rate limiter.

    Usage::

        limiter = RateLimiter()
        limiter.configure("/ai", TIER_AI)
        limiter.configure("", TIER_STANDARD)  # default

        app = FastAPI()
        limiter.add_to(app)
    """

    def __init__(self) -> None:
        # prefix -> tier (longest prefix match wins)
        self._tiers: list[Tuple[str, RateLimitTier]] = []
        # (prefix, key) -> bucket
        self._buckets: Dict[Tuple[str, str], _Bucket] = {}

    # ---- public API ----

    def configure(self, path_prefix: str, tier: RateLimitTier) -> None:
        """Register a rate-limit *tier* for routes matching *path_prefix*.

        An empty prefix serves as the default/fallback tier.
        """
        self._tiers.append((path_prefix, tier))
        # Sort longest prefix first so more specific routes take precedence
        self._tiers.sort(key=lambda pair: len(pair[0]), reverse=True)

    def add_to(self, app: FastAPI) -> None:
        """Register the middleware on a FastAPI application."""

        @app.middleware("http")
        async def rate_limit_middleware(request: Request, call_next):
            return await self._check(request, call_next)

    # ---- internals ----

    def _resolve_tier(self, path: str) -> RateLimitTier:
        """Return the best-matching tier for *path*."""
        for prefix, tier in self._tiers:
            if prefix and path.startswith(prefix):
                return tier
        # Fallback: return the default tier (empty prefix) or standard
        for prefix, tier in self._tiers:
            if prefix == "":
                return tier
        return TIER_STANDARD

    def _client_key(self, request: Request) -> str:
        """Derive a client identifier from the request.

        Prefers ``X-Forwarded-For`` (first entry) for reverse-proxy setups,
        then ``X-API-Key`` for authenticated API traffic, then falls back to
        the direct client address.
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"key:{api_key}"
        client = request.client
        if client:
            return client.host
        return "unknown"

    async def _check(self, request: Request, call_next):  # noqa: ANN001
        """Enforce rate limits and return 429 if exceeded."""
        path = request.url.path
        tier = self._resolve_tier(path)
        key = self._client_key(request)
        now = time.monotonic()

        bucket_key = (tier.max_requests, key)
        bucket = self._buckets.get(bucket_key)

        if bucket is None:
            bucket = _Bucket(count=1, window_start=now)
            self._buckets[bucket_key] = bucket
        else:
            # Reset window if expired
            if now - bucket.window_start >= tier.window_seconds:
                bucket.count = 1
                bucket.window_start = now
            else:
                bucket.count += 1

        remaining = max(0, tier.max_requests - bucket.count)
        reset_at = bucket.window_start + tier.window_seconds

        # Check limit
        if bucket.count > tier.max_requests:
            retry_after = int(reset_at - now) + 1
            response = JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please retry later."},
            )
            response.headers["Retry-After"] = str(max(retry_after, 1))
            response.headers["X-RateLimit-Limit"] = str(tier.max_requests)
            response.headers["X-RateLimit-Remaining"] = "0"
            response.headers["X-RateLimit-Reset"] = str(int(reset_at))
            return response

        # Limit not exceeded — proceed and annotate response
        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(tier.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(reset_at))
        return response

    def reset(self) -> None:
        """Clear all buckets — useful in tests."""
        self._buckets.clear()
