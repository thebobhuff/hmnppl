"""Manager Pushback Agent - Challenges managers who want disproportionate discipline.

Per Lijo Joseph: The agent shouldn't roll over when a manager says
"I want them terminated tomorrow." It should push back with appropriate guidance.
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_pushback_prompt

logger = logging.getLogger(__name__)


class ManagerPushbackAgent(BaseAgent):
    """Evaluates manager requests for discipline proportionality and pushes back when needed."""

    async def run(
        self,
        requested_action: str,
        incident_type: str,
        incident_description: str,
        employee_history: list[dict[str, Any]] | None = None,
        policy_context: dict[str, Any] | None = None,
        manager_notes: str | None = None,
    ) -> dict[str, Any]:
        messages = build_pushback_prompt(
            requested_action=requested_action,
            incident_type=incident_type,
            incident_description=incident_description,
            employee_history=employee_history or [],
            policy_context=policy_context or {},
            manager_notes=manager_notes,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.2,
            max_tokens=1500,
        )

        parsed = self._parse_json(result["content"])

        return {
            "is_appropriate": parsed.get("is_appropriate", True),
            "proportionality_score": parsed.get("proportionality_score", 1.0),
            "pushback_required": parsed.get("pushback_required", False),
            "pushback_message": parsed.get("pushback_message", ""),
            "suggested_alternative": parsed.get("suggested_alternative", ""),
            "reasoning": parsed.get("reasoning", ""),
            "legal_risk_flag": parsed.get("legal_risk_flag", False),
            "progressive_discipline_step": parsed.get("progressive_discipline_step", ""),
            "confidence": parsed.get("confidence", 0.0),
        }
