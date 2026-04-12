"""Issue Similarity Agent - Detects if a new incident is a repeat offense or a new issue type.

Per Lijo Joseph: The agent must discern if this is the same issue recurring
or a completely different problem. This drives progressive discipline vs. new-track handling.
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_issue_similarity_prompt

logger = logging.getLogger(__name__)


class IssueSimilarityAgent(BaseAgent):
    """Compares new incidents against employee history to determine same vs new issue."""

    async def run(
        self,
        incident_type: str,
        incident_description: str,
        employee_history: list[dict[str, Any]] | None = None,
        policy_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        # Short-circuit: no history means this is a new issue by definition
        if not employee_history:
            return {
                "is_repeat_issue": False,
                "is_same_category": False,
                "similarity_score": 0.0,
                "matched_incidents": [],
                "progression_analysis": "No prior incidents. This is a first offense.",
                "recommended_track": "new_issue",
                "training_relevant": False,
                "confidence": 1.0,
            }

        messages = build_issue_similarity_prompt(
            incident_type=incident_type,
            incident_description=incident_description,
            employee_history=employee_history,
            policy_context=policy_context or {},
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.1,
            max_tokens=1200,
        )

        parsed = self._parse_json(result["content"])

        return {
            "is_repeat_issue": parsed.get("is_repeat_issue", False),
            "is_same_category": parsed.get("is_same_category", False),
            "similarity_score": parsed.get("similarity_score", 0.0),
            "matched_incidents": parsed.get("matched_incidents", []),
            "progression_analysis": parsed.get("progression_analysis", ""),
            "recommended_track": parsed.get("recommended_track", "new_issue"),
            "training_relevant": parsed.get("training_relevant", False),
            "training_topic": parsed.get("training_topic"),
            "confidence": parsed.get("confidence", 0.0),
        }
