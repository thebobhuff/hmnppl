"""Training Gap Detection Agent - Identifies training deficiencies from incident patterns.

Per Lijo Joseph: "If I'm playing this out, I'm having onboarding issues...
Maybe my training on onboarding sucks and maybe I need that recommendation."
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_training_gap_prompt

logger = logging.getLogger(__name__)


class TrainingGapAgent(BaseAgent):
    """Analyzes incidents to identify systemic training gaps across the organization."""

    async def run(
        self,
        incidents: list[dict[str, Any]],
        training_catalog: list[dict[str, Any]] | None = None,
        department: str | None = None,
        time_window_days: int = 90,
    ) -> dict[str, Any]:
        if not incidents:
            return {
                "gaps_found": False,
                "training_gaps": [],
                "systemic_issues": [],
                "recommendations": [],
                "affected_departments": [],
                "priority_level": "none",
                "confidence": 1.0,
            }

        messages = build_training_gap_prompt(
            incidents=incidents,
            training_catalog=training_catalog or [],
            department=department,
            time_window_days=time_window_days,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.2,
            max_tokens=2000,
        )

        parsed = self._parse_json(result["content"])

        return {
            "gaps_found": parsed.get("gaps_found", False),
            "training_gaps": parsed.get("training_gaps", []),
            "systemic_issues": parsed.get("systemic_issues", []),
            "recommendations": parsed.get("recommendations", []),
            "affected_departments": parsed.get("affected_departments", []),
            "priority_level": parsed.get("priority_level", "low"),
            "confidence": parsed.get("confidence", 0.0),
        }
