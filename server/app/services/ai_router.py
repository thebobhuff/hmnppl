"""AI Router — model-agnostic LLM routing with provider fallback.

Routes AI requests to the best available provider:
  1. OpenRouter (primary) — supports multiple models via single API
  2. HuggingFace (fallback) — open-source models

Implements circuit breaker pattern and retry logic with exponential backoff.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)


class CircuitBreakerOpenError(Exception):
    """Raised when the circuit breaker is open and requests are blocked."""


class CircuitBreaker:
    """Circuit breaker for AI provider calls.

    States:
      - closed: normal operation, requests pass through
      - open: failures exceeded threshold, requests blocked
      - half_open: recovery period, one test request allowed

    Transitions:
      closed → open: after `failure_threshold` consecutive failures
      open → half_open: after `recovery_timeout` seconds
      half_open → closed: on successful request
      half_open → open: on failed request
    """

    def __init__(
        self,
        failure_threshold: int = 3,
        recovery_timeout: float = 30.0,
    ) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failure_count = 0
        self._last_failure_time: float = 0.0
        self._state: str = "closed"

    @property
    def state(self) -> str:
        now = time.monotonic()
        if (
            self._state == "open"
            and (now - self._last_failure_time) >= self.recovery_timeout
        ):
            self._state = "half_open"
            logger.info("Circuit breaker transitioning to half_open")
        return self._state

    def record_success(self) -> None:
        self._failure_count = 0
        self._state = "closed"

    def record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.monotonic()
        if self._failure_count >= self.failure_threshold:
            self._state = "open"
            logger.warning(
                "Circuit breaker opened after %d consecutive failures",
                self._failure_count,
            )

    def allow_request(self) -> bool:
        if self.state == "closed":
            return True
        if self.state == "half_open":
            return True
        return False

    def reset(self) -> None:
        self._failure_count = 0
        self._state = "closed"
        self._last_failure_time = 0.0


class AIRouter:
    """Model-agnostic AI router with provider fallback.

    Usage:
        router = AIRouter(settings)
        response = await router.call(
            messages=[{"role": "system", "content": "..."}, {"role": "user", "content": "..."}],
            model="openrouter:meta-llama/llama-3-70b-instruct",
            temperature=0.1,
            max_tokens=2000,
        )
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=3, recovery_timeout=30.0
        )
        self._cost_per_request: dict[str, float] = {}

    async def call(
        self,
        messages: list[dict[str, str]],
        model: str = "openrouter:meta-llama/llama-3-70b-instruct",
        temperature: float = 0.1,
        max_tokens: int = 2000,
        response_format: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call the AI provider with retry logic.

        Args:
            messages: Chat messages (system + user)
            model: Model identifier (openrouter: or hf: prefix)
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens in response
            response_format: Optional JSON schema for structured output

        Returns:
            dict with keys: content, usage (prompt_tokens, completion_tokens, total_tokens), cost

        Raises:
            CircuitBreakerOpenError: If circuit breaker is open
            RuntimeError: If all providers fail
        """
        if not self.circuit_breaker.allow_request():
            raise CircuitBreakerOpenError(
                "AI service is temporarily unavailable (circuit breaker open). "
                "Please try again in 30 seconds."
            )

        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries):
            try:
                if model.startswith("openrouter:"):
                    result = await self._call_openrouter(
                        model=model.replace("openrouter:", ""),
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        response_format=response_format,
                    )
                elif model.startswith("hf:"):
                    result = await self._call_huggingface(
                        model=model.replace("hf:", ""),
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                else:
                    raise ValueError(f"Unknown model provider prefix in: {model}")

                self.circuit_breaker.record_success()
                return result

            except CircuitBreakerOpenError:
                raise
            except Exception as exc:
                self.circuit_breaker.record_failure()
                logger.warning(
                    "AI call attempt %d/%d failed: %s",
                    attempt + 1,
                    max_retries,
                    exc,
                )
                if attempt < max_retries - 1:
                    delay = base_delay * (2**attempt)
                    logger.info("Retrying in %.1f seconds...", delay)
                    await asyncio.sleep(delay)
                else:
                    raise RuntimeError(
                        f"All {max_retries} AI call attempts failed. Last error: {exc}"
                    ) from exc

        raise RuntimeError("AI call failed after all retries")

    async def _call_openrouter(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
        response_format: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call OpenRouter API."""
        if not self.settings.OPENROUTER_API_KEY:
            raise RuntimeError("OPENROUTER_API_KEY not configured")

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ai-hr-platform.com",
                    "X-Title": "AI HR Platform",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        choice = data["choices"][0]["message"]
        usage = data.get("usage", {})

        cost = self._estimate_openrouter_cost(model, usage.get("total_tokens", 0))

        return {
            "content": choice["content"],
            "usage": {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
            "cost": cost,
            "model": model,
        }

    async def _call_huggingface(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> dict[str, Any]:
        """Call HuggingFace Inference API."""
        if not self.settings.HUGGINGFACE_API_TOKEN:
            raise RuntimeError("HUGGINGFACE_API_TOKEN not configured")

        combined_prompt = "\n".join(
            f"{msg['role']}: {msg['content']}" for msg in messages
        )

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers={
                    "Authorization": f"Bearer {self.settings.HUGGINGFACE_API_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": combined_prompt,
                    "parameters": {
                        "temperature": temperature,
                        "max_new_tokens": max_tokens,
                        "return_full_text": False,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()

        content = (
            data[0]["generated_text"]
            if isinstance(data, list)
            else data.get("generated_text", "")
        )

        return {
            "content": content,
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "cost": 0.0,
            "model": model,
        }

    @staticmethod
    def _estimate_openrouter_cost(model: str, total_tokens: int) -> float:
        """Estimate cost for an OpenRouter API call.

        Approximate pricing per 1K tokens (as of 2026):
          - Llama 3 8B: $0.0002/1K input, $0.0002/1K output
          - Llama 3 70B: $0.0008/1K input, $0.0008/1K output
          - Mistral Large: $0.002/1K input, $0.006/1K output
        """
        pricing: dict[str, float] = {
            "meta-llama/llama-3-8b-instruct": 0.0002,
            "meta-llama/llama-3-70b-instruct": 0.0008,
            "mistralai/mistral-large": 0.004,
            "anthropic/claude-3.5-sonnet": 0.003,
            "openai/gpt-4o": 0.0025,
            "stepfun/step-3.5-flash:free": 0.0,
        }

        rate = pricing.get(model, 0.001)
        return (total_tokens / 1000) * rate

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Get embeddings (via OpenRouter OpenAI shim)."""
        if not self.settings.OPENROUTER_API_KEY:
            raise RuntimeError("OPENROUTER_API_KEY not configured")
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "input": texts,
                    "model": "openai/text-embedding-3-small"
                }
            )
            response.raise_for_status()
            data = response.json()
            
        embeddings = []
        for item in sorted(data.get("data", []), key=lambda x: x.get("index", 0)):
            embeddings.append(item["embedding"])
        return embeddings
