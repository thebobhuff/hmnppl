"""Policy Chat Agent - Handles chat interactions about policies."""

from __future__ import annotations

import logging
from typing import Any
from pathlib import Path
import json

from app.services.ai_router import AIRouter
from app.core.config import Settings

logger = logging.getLogger(__name__)


class PolicyChatAgent:
    """Chat agent for policy questions and policy creation."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.ai_router = AIRouter(settings)
        self.conversation_dir = Path(".data/policy-chats")
        self.conversation_dir.mkdir(parents=True, exist_ok=True)

    def _conversation_path(self, conversation_id: str) -> Path:
        return self.conversation_dir / f"{conversation_id}.json"

    def _load_conversation(self, conversation_id: str) -> dict[str, Any]:
        path = self._conversation_path(conversation_id)
        if not path.exists():
            return {"conversation_id": conversation_id, "messages": [], "files": []}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {"conversation_id": conversation_id, "messages": [], "files": []}

    def _save_conversation(self, conversation_id: str, payload: dict[str, Any]) -> None:
        path = self._conversation_path(conversation_id)
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def _normalize_messages(
        self, history: list[dict[str, str]]
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        for item in history:
            role = item.get("role", "user")
            if role not in {"user", "assistant", "system"}:
                role = "user"
            messages.append({"role": role, "content": item.get("content", "")})
        return messages

    async def chat(
        self,
        message: str,
        history: list[dict[str, str]],
        context: dict[str, Any],
        conversation_id: str | None = None,
    ) -> dict[str, Any]:
        """Process a chat message and return response."""

        policies = context.get("policies", [])
        screen = context.get("screen", {})
        files = context.get("files", [])
        conversation_id = conversation_id or context.get("conversation_id") or "default"
        prior_conversation = self._load_conversation(conversation_id)

        policy_list = (
            "\n".join(
                [
                    f"- {p.get('title', 'Untitled')} ({p.get('category', 'unknown')})"
                    for p in policies
                ]
            )
            or "No policies available"
        )

        file_context = (
            "\n".join(
                [
                    f"File: {f.get('name')} ({f.get('type')}, {f.get('size')} bytes)\n{f.get('content', '')[:4000]}"
                    for f in files
                ]
            )
            or "No uploaded files"
        )

        system_prompt = f"""You are an HR Policy Assistant. You help managers and HR professionals understand company policies and create new policies.

Available policies:
{policy_list}

Current screen:
{screen.get("label", "Unknown")}

Uploaded file context:
{file_context}

Guidelines:
- Be conversational and helpful
- When asked about policies, provide accurate information
- When helping create policies, guide users to create a new policy
- If asked to create a policy, explain the process and offer to help
- Be concise but thorough in your responses"""

        messages = [{"role": "system", "content": system_prompt}]

        stored_history = prior_conversation.get("messages", [])
        normalized_history = self._normalize_messages(history)
        if stored_history:
            messages.extend(
                self._normalize_messages(
                    [
                        {"role": m.get("role", "user"), "content": m.get("content", "")}
                        for m in stored_history
                    ]
                )
            )
        messages.extend(normalized_history)

        messages.append({"role": "user", "content": message})

        try:
            result = await self.ai_router.call(
                messages=messages,
                model="openrouter:stepfun/step-3.5-flash:free",
                temperature=0.7,
                max_tokens=500,
            )

            payload = {
                "conversation_id": conversation_id,
                "messages": [
                    *stored_history,
                    *normalized_history,
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": result["content"]},
                ],
                "files": files,
                "screen": screen,
                "updated_at": result.get("created_at"),
            }
            self._save_conversation(conversation_id, payload)

            return {
                "response": result["content"],
                "model": result["model"],
                "conversation_id": conversation_id,
            }

        except Exception as exc:
            logger.exception("Policy chat failed")
            payload = {
                "conversation_id": conversation_id,
                "messages": [
                    *prior_conversation.get("messages", []),
                    {"role": "user", "content": message},
                    {
                        "role": "assistant",
                        "content": "I'm sorry, I encountered an error processing your request. Please try again.",
                    },
                ],
                "files": files,
                "screen": screen,
            }
            self._save_conversation(conversation_id, payload)
            return {
                "response": "I'm sorry, I encountered an error processing your request. Please try again.",
                "conversation_id": conversation_id,
            }
