"""Manager Coach Agent — empathy coaching, training tracking, language guidance.

Coaches managers on:
1. How to approach disciplinary conversations with empathy
2. Specific language to use and avoid
3. Training recommendations for the employee
4. Documentation checklist for the record
5. Risk warnings for legal/compliance awareness

Per Lijo Joseph's requirements:
- Agent must coach managers on demonstrating empathy while holding standards
- Agent must track and request documentation of employee training
- Agent must suggest further training if needed
- Build continuous record for formal write-ups or PIPs
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_manager_coach_prompt

logger = logging.getLogger(__name__)


class ManagerCoachAgent(BaseAgent):
    """Coaches managers on handling disciplinary conversations."""

    async def run(
        self,
        incident_type: str,
        incident_description: str,
        escalation_level: str = "verbal_warning",
        manager_communication_style: str | None = None,
        employee_context: str | None = None,
        specific_concern: str | None = None,
        training_history: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        messages = build_manager_coach_prompt(
            incident_type=incident_type,
            incident_description=incident_description,
            escalation_level=escalation_level,
            manager_communication_style=manager_communication_style,
            employee_context=employee_context,
            specific_concern=specific_concern,
            training_history=training_history,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.3,
            max_tokens=2000,
        )

        parsed = self._parse_json(result["content"])

        training_recs = parsed.get("training_recommendations", [])
        formatted_training = []
        for rec in training_recs:
            formatted_training.append(
                {
                    "training_type": rec.get("training_type", ""),
                    "reason": rec.get("reason", ""),
                    "priority": rec.get("priority", "medium"),
                    "suggested_timeline": rec.get("suggested_timeline"),
                }
            )

        return {
            "empathy_coaching": parsed.get("empathy_coaching", ""),
            "suggested_language": parsed.get("suggested_language", []),
            "language_to_avoid": parsed.get("language_to_avoid", []),
            "conversation_structure": parsed.get("conversation_structure", []),
            "training_recommendations": formatted_training,
            "documentation_checklist": parsed.get("documentation_checklist", []),
            "risk_warnings": parsed.get("risk_warnings", []),
        }
