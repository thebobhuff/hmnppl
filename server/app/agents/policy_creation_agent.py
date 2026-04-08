"""Policy Creation Agent - Conversational policy interview and draft generation."""

from __future__ import annotations

import logging
from typing import Any

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an HR Policy Creation Assistant.

Your job is to interview the user conversationally to create a policy draft.

Requirements to gather:
- policy type / title
- purpose
- scope / who it applies to
- key rules and requirements
- escalation or consequences
- exceptions
- effective date
- if the policy needs a draft review or can be finalized later

When enough information is available, generate a policy draft in markdown with these sections:
- Title
- Purpose
- Scope
- Policy Statement
- Procedures
- Consequences
- Exceptions
- Effective Date
- Revision History

Be conversational, concise, and guide the user one question at a time unless they are ready to draft."""


class PolicyCreationAgent(BaseAgent):
    """Conversational policy creator that turns answers into a draft policy."""

    async def run(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
        context: dict[str, Any] | None = None,
        conversation_id: str | None = None,
    ) -> dict[str, Any]:
        history = history or []
        context = context or {}

        policies = context.get("policies", [])
        screen = context.get("screen", {})

        policy_catalog = (
            "\n".join(
                f"- {p.get('title', 'Untitled')} ({p.get('category', 'unknown')})"
                for p in policies
            )
            or "No policies available"
        )

        messages = [
            {
                "role": "system",
                "content": f"{SYSTEM_PROMPT}\n\nCurrent screen: {screen.get('label', 'Unknown')}\n\nAvailable policies:\n{policy_catalog}",
            }
        ]
        messages.extend(history)
        messages.append({"role": "user", "content": message})

        result = await self._call_ai(
            messages=messages,
            model="openrouter:stepfun/step-3.5-flash:free",
            temperature=0.5,
            max_tokens=1800,
        )

        content = result["content"]
        parsed = self._parse_json(content)

        return {
            "conversation_id": conversation_id,
            "response": parsed.get("response", content),
            "question": parsed.get("question"),
            "policy_draft": parsed.get("policy_draft"),
            "ready_for_draft": parsed.get("ready_for_draft", False),
            "context_summary": parsed.get("context_summary"),
        }
