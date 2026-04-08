"""Escalation Router Agent — determines disciplinary escalation level.

Routes incidents to the correct path:
- Verbal warning → agent handles with manager coaching
- Written warning → agent drafts, HR reviews before delivery
- PIP → agent compiles, HR reviews and approves
- Termination → HR only, agent never decides
- Immediate HR escalation → bypass agent entirely
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_escalation_router_prompt
from app.agents.schemas import EscalationLevel

logger = logging.getLogger(__name__)


class EscalationRouterAgent(BaseAgent):
    """Determines the appropriate escalation level for a disciplinary incident."""

    async def run(
        self,
        incident_type: str,
        incident_description: str,
        previous_incident_count: int = 0,
        previous_incidents: list[dict[str, Any]] | None = None,
        employee_training_history: list[dict[str, Any]] | None = None,
        severity: str = "medium",
        manager_notes: str | None = None,
        policy_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        messages = build_escalation_router_prompt(
            incident_type=incident_type,
            incident_description=incident_description,
            previous_incident_count=previous_incident_count,
            previous_incidents=previous_incidents,
            employee_training_history=employee_training_history,
            severity=severity,
            manager_notes=manager_notes,
            policy_context=policy_context,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.1,
            max_tokens=1200,
        )

        parsed = self._parse_json(result["content"])

        escalation = parsed.get("escalation_level", "verbal_warning")

        # Enforce: termination review always requires HR
        if escalation == EscalationLevel.TERMINATION_REVIEW.value:
            parsed["requires_hr_review"] = True
            parsed.setdefault("recommended_next_steps", [])
            parsed["recommended_next_steps"].insert(
                0,
                "Escalate to HR for termination review — agent cannot process this level",
            )

        # Enforce: immediate HR escalation always bypasses agent
        if escalation == EscalationLevel.IMMEDIATE_HR_ESCALATION.value:
            parsed["requires_hr_review"] = True

        return {
            "escalation_level": escalation,
            "requires_hr_review": parsed.get("requires_hr_review", False),
            "reasoning": parsed.get("reasoning", ""),
            "coaching_needed": parsed.get("coaching_needed", False),
            "coaching_topics": parsed.get("coaching_topics", []),
            "training_gaps": parsed.get("training_gaps", []),
            "recommended_next_steps": parsed.get("recommended_next_steps", []),
            "confidence": parsed.get("confidence", 0.0),
        }
