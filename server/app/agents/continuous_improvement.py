"""Continuous Improvement Agent - Generates AI-powered insights from incident patterns.

Per Lijo Joseph: The system should recognize patterns and recommend process improvements.
"5 designers with onboarding issues - maybe training sucks."
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_continuous_improvement_prompt

logger = logging.getLogger(__name__)


class ContinuousImprovementAgent(BaseAgent):
    """Analyzes organizational patterns to recommend process and policy improvements."""

    async def run(
        self,
        incidents: list[dict[str, Any]],
        policies: list[dict[str, Any]] | None = None,
        manager_stats: list[dict[str, Any]] | None = None,
        training_gaps: list[dict[str, Any]] | None = None,
        org_health: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not incidents and not manager_stats:
            return {
                "insights": [],
                "process_recommendations": [],
                "policy_recommendations": [],
                "manager_recommendations": [],
                "overall_assessment": "Insufficient data for continuous improvement analysis.",
                "priority_actions": [],
                "confidence": 0.0,
            }

        messages = build_continuous_improvement_prompt(
            incidents=incidents,
            policies=policies or [],
            manager_stats=manager_stats or [],
            training_gaps=training_gaps or [],
            org_health=org_health or {},
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.3,
            max_tokens=2500,
        )

        parsed = self._parse_json(result["content"])

        return {
            "insights": parsed.get("insights", []),
            "process_recommendations": parsed.get("process_recommendations", []),
            "policy_recommendations": parsed.get("policy_recommendations", []),
            "manager_recommendations": parsed.get("manager_recommendations", []),
            "overall_assessment": parsed.get("overall_assessment", ""),
            "priority_actions": parsed.get("priority_actions", []),
            "confidence": parsed.get("confidence", 0.0),
        }
