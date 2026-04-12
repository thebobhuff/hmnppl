"""Language Checker Agent — legal language review and hot spot flagging.

Reviews disciplinary documents for:
1. Emotional or heated language
2. Protected class mentions
3. Legal risk factors
4. Specific passages that need revision (hot spots)
5. Overall legal soundness assessment

Per Lijo Joseph's requirements:
- Agent must flag potential "hot spots" for HR review
- Ensure documentation is legally sound and free of emotional language
- Protected class information should NOT be discoverable in the system
- Automation of state-specific termination paperwork compliance
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent
from app.agents.prompts import build_language_checker_prompt
from app.agents.schemas import RiskLevel

logger = logging.getLogger(__name__)

PROTECTED_CLASS_KEYWORDS = [
    "age",
    "race",
    "gender",
    "sex",
    "religion",
    "disability",
    "national origin",
    "sexual orientation",
    "pregnancy",
    "marital status",
    "veteran",
    "genetic",
    "ethnic",
    "color",
    "creed",
]


class LanguageCheckerAgent(BaseAgent):
    """Reviews disciplinary documents for legal risk and language issues."""

    async def run(
        self,
        document_content: str,
        document_type: str = "disciplinary",
        escalation_level: str | None = None,
        state_jurisdiction: str | None = None,
    ) -> dict[str, Any]:
        # Pre-scan for protected class mentions
        protected_mentions = []
        content_lower = document_content.lower()
        for keyword in PROTECTED_CLASS_KEYWORDS:
            if keyword in content_lower:
                protected_mentions.append(keyword)

        messages = build_language_checker_prompt(
            document_content=document_content,
            document_type=document_type,
            escalation_level=escalation_level,
            state_jurisdiction=state_jurisdiction,
        )

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.1,
            max_tokens=2000,
        )

        parsed = self._parse_json(result["content"])

        # Merge pre-scan results with AI analysis
        ai_protected = parsed.get("protected_class_mentions", [])
        all_protected = list(set(protected_mentions + ai_protected))

        hot_spots = parsed.get("hot_spots", [])
        formatted_hot_spots = []
        for spot in hot_spots:
            formatted_hot_spots.append(
                {
                    "location": spot.get("location", ""),
                    "issue": spot.get("issue", ""),
                    "severity": spot.get("severity", "medium"),
                    "suggestion": spot.get("suggestion", ""),
                }
            )

        # If protected class mentions found, escalate risk
        legal_risk = parsed.get("legal_risk_level", "low")
        if all_protected:
            legal_risk = RiskLevel.HIGH.value

        # If critical hot spots found, document is not legally sound
        is_sound = parsed.get("is_legally_sound", True)
        critical_spots = [
            s for s in formatted_hot_spots if s.get("severity") == "critical"
        ]
        if critical_spots or all_protected:
            is_sound = False

        return {
            "overall_assessment": parsed.get("overall_assessment", ""),
            "hot_spots": formatted_hot_spots,
            "emotional_language_detected": parsed.get(
                "emotional_language_detected", False
            ),
            "legal_risk_level": legal_risk,
            "protected_class_mentions": all_protected,
            "suggestions": parsed.get("suggestions", []),
            "is_legally_sound": is_sound,
        }
