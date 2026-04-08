"""Base agent class for the AI HR Platform agent layer.

All agents inherit from this class and implement a run() method.
Provides shared dependencies: AI router, PII sanitizer, output validator.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

from app.core.config import Settings
from app.services.ai_router import AIRouter
from app.services.pii_sanitizer import sanitize_dict
from app.services.output_validator import parse_json_output

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all HR agents."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.ai_router = AIRouter(settings)

    @abstractmethod
    async def run(self, **kwargs: Any) -> dict[str, Any]:
        """Execute the agent's primary workflow."""

    def _sanitize(self, data: dict[str, Any]) -> dict[str, Any]:
        """Sanitize data before sending to AI."""
        return sanitize_dict(data)

    def _parse_json(self, raw: str) -> dict[str, Any]:
        """Parse JSON from AI response."""
        return parse_json_output(raw)

    async def _call_ai(
        self,
        messages: list[dict[str, str]],
        model: str = "openrouter:meta-llama/llama-3-8b-instruct",
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> dict[str, Any]:
        """Call the AI router with retry/circuit breaker."""
        return await self.ai_router.call(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
