"""Risk Classifier Agent — detects high-risk incidents that bypass the agent loop.

Per Lijo Joseph's requirements:
- Safety violations, violence, financial impropriety → immediate HR escalation
- Protected class mentions → bypass agent, go to HR
- High-risk incidents → flag for HR awareness
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_risk_classifier_prompt
from app.agents.schemas import RiskLevel

logger = logging.getLogger(__name__)

HIGH_RISK_TYPES = {
    "safety_violation",
    "violence",
    "harassment",
    "financial_impropriety",
}


class RiskClassifierAgent(BaseAgent):
    """Classifies incident risk level and determines if HR bypass is needed."""

    async def run(
        self,
        incident_type: str,
        incident_description: str,
        severity: str = "medium",
        employee_role: str | None = None,
        department: str | None = None,
        involves_protected_class: bool = False,
        additional_context: str | None = None,
    ) -> dict[str, Any]:
        # Pre-check: if protected class or high-risk type, bypass immediately
        if involves_protected_class:
            return {
                "risk_level": RiskLevel.CRITICAL.value,
                "bypasses_agent": True,
                "bypass_reason": "Incident involves protected class characteristics — requires immediate HR review",
                "risk_factors": ["Protected class involvement"],
                "recommended_action": "Escalate to HR immediately. Do not proceed with agent workflow.",
                "confidence": 1.0,
            }

        if incident_type in HIGH_RISK_TYPES:
            return {
                "risk_level": RiskLevel.CRITICAL.value,
                "bypasses_agent": True,
                "bypass_reason": f"Incident type '{incident_type}' is a high-risk category requiring immediate HR review",
                "risk_factors": [f"High-risk incident type: {incident_type}"],
                "recommended_action": "Escalate to HR immediately. Do not proceed with agent workflow.",
                "confidence": 1.0,
            }

        # For non-high-risk types, use AI to assess
        messages = build_risk_classifier_prompt(
            incident_type=incident_type,
            incident_description=incident_description,
            severity=severity,
            employee_role=employee_role,
            department=department,
            involves_protected_class=involves_protected_class,
            additional_context=additional_context,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.1,
            max_tokens=800,
        )

        parsed = self._parse_json(result["content"])

        # Post-validation: if AI says critical, enforce bypass
        if parsed.get("risk_level") in ("critical",):
            parsed["bypasses_agent"] = True
            if not parsed.get("bypass_reason"):
                parsed["bypass_reason"] = "Critical risk level requires HR review"

        return {
            "risk_level": parsed.get("risk_level", "medium"),
            "bypasses_agent": parsed.get("bypasses_agent", False),
            "bypass_reason": parsed.get("bypass_reason"),
            "risk_factors": parsed.get("risk_factors", []),
            "recommended_action": parsed.get("recommended_action", ""),
            "confidence": parsed.get("confidence", 0.0),
        }
