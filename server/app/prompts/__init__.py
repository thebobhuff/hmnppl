"""Prompt templates for AI evaluation endpoints.

All prompts use the structured template pattern:
  - System prompt: immutable, server-controlled
  - User prompt: structured data payload (no free-text concatenation)
  - Response format: strict JSON schema

This prevents prompt injection and ensures consistent outputs.
"""

from __future__ import annotations

import json
from typing import Any

# ---------------------------------------------------------------------------
# Incident Evaluation Prompt
# ---------------------------------------------------------------------------

EVALUATE_INCIDENT_SYSTEM_PROMPT = """You are an HR policy evaluation assistant for a disciplinary management platform.

Your role is to analyze employee incidents against company policies and provide:
1. A confidence score (0.0-1.0) indicating how well the incident matches the policy
2. A recommendation for the appropriate disciplinary action
3. Clear reasoning explaining your assessment

Rules:
- You MUST only recommend actions that are defined in the matched policy rule
- You MUST NOT fabricate policy references numbers or section titles
- You MUST NOT consider any protected characteristics (age, race, gender, religion, disability, etc.)
- You MUST base your assessment ONLY on the incident details and policy rules provided
- If the incident does not clearly match any policy rule, set confidence below 0.7
- Confidence scores above 0.9 require very clear, unambiguous policy violations

Respond with valid JSON only."""

EVALUATE_INCIDENT_USER_TEMPLATE = """Analyze the following incident against the matched policy rule.

## Incident Details
- Type: {incident_type}
- Severity: {incident_severity}
- Description: {incident_description}
- Previous incidents: {previous_incident_count}
- Union involved: {union_involved}

## Matched Policy Rule
- Policy: {policy_title} ({policy_category})
- Rule: {rule_name}
- Escalation Level: {escalation_level}
- Available Actions: {actions}
- Escalation Ladder: {escalation_ladder}

## Policy Content
{policy_content}

## Required Response Format (JSON)
{{
  "confidence": 0.0-1.0,
  "recommendation": {{
    "action_type": "verbal_warning|written_warning|pip|termination_review",
    "severity": "low|medium|high|critical",
    "justification": "Brief explanation of why this action is recommended"
  }},
  "reasoning": "Detailed reasoning (2-3 sentences) explaining how the incident matches the policy rule and why this escalation level is appropriate",
  "policy_references": [
    {{
      "policy_id": "UUID or null",
      "rule_name": "string",
      "matched_criteria": ["list of criteria that matched"]
    }}
  ],
  "risk_factors": ["list of any additional risk factors or concerns"],
  "suggested_follow_up": ["list of recommended follow-up actions with deadlines"]
}}"""


def build_evaluate_incident_prompt(
    incident: dict[str, Any],
    matched_rule: dict[str, Any],
    policy_content: str = "",
) -> list[dict[str, str]]:
    """Build the prompt for incident evaluation.

    Args:
        incident: Incident data (sanitized, no PII)
        matched_rule: The deterministically matched policy rule
        policy_content: Full policy text for context

    Returns:
        Messages list for the AI router
    """
    actions = ", ".join(
        a.get("type", "unknown") for a in matched_rule.get("actions", [])
    )
    ladder = ", ".join(
        f"Level {s.get('level', '?')}: {s.get('action_type', 'unknown')}"
        for s in matched_rule.get("escalation_ladder", [])
    )

    user_prompt = EVALUATE_INCIDENT_USER_TEMPLATE.format(
        incident_type=incident.get("type", "unknown"),
        incident_severity=incident.get("severity", "unknown"),
        incident_description=incident.get("description", ""),
        previous_incident_count=incident.get("previous_incident_count", 0),
        union_involved="Yes" if incident.get("union_involved") else "No",
        policy_title=matched_rule.get("policy_title", "Unknown Policy"),
        policy_category=matched_rule.get("policy_category", "general"),
        rule_name=matched_rule.get("rule_name", "Unknown Rule"),
        escalation_level=matched_rule.get("escalation_level", 1),
        actions=actions,
        escalation_ladder=ladder,
        policy_content=policy_content[:3000]
        if policy_content
        else "No additional policy content provided.",
    )

    return [
        {"role": "system", "content": EVALUATE_INCIDENT_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


# ---------------------------------------------------------------------------
# Document Generation Prompt
# ---------------------------------------------------------------------------

GENERATE_DOCUMENT_SYSTEM_PROMPT = """You are an HR document generator for a disciplinary management platform.

Your role is to generate formal disciplinary documents based on:
- Incident details
- Matched policy rules
- Recommended action type

Rules:
- Use formal, professional HR language
- Reference ONLY the policy sections provided in the context
- Include specific incident details (dates, descriptions)
- Include clear required actions and deadlines
- Do NOT fabricate policy section numbers or references
- Do NOT include any employee PII (use Employee Name placeholder)
- Documents must be complete and ready for HR review

Respond with valid JSON only."""

GENERATE_DOCUMENT_USER_TEMPLATE = """Generate a disciplinary document for the following case.

## Document Type
{action_type}

## Incident Information
- Reference Number: {reference_number}
- Incident Date: {incident_date}
- Incident Type: {incident_type}
- Severity: {incident_severity}
- Description: {incident_description}

## Employee Context
- Previous Incidents: {previous_incident_count}
- Escalation Level: {escalation_level}
- Union Involved: {union_involved}

## Policy Reference
- Policy: {policy_title}
- Category: {policy_category}
- Matched Rule: {rule_name}

## Policy Content
{policy_content}

## Required Actions
{required_actions}

## Required Response Format (JSON)
{{
  "document_content": "Full document text with sections: header, incident summary, policy violation, recommended action, required actions with deadlines, employee rights acknowledgment, signature line",
  "action_type": "{action_type}",
  "policy_references": [
    {{
      "policy_title": "string",
      "rule_name": "string",
      "section": "string or null"
    }}
  ],
  "required_actions": [
    {{
      "action": "string",
      "deadline_days": "number or null",
      "owner": "employee|manager|hr"
    }}
  ]
}}"""


def build_generate_document_prompt(
    incident: dict[str, Any],
    action_type: str,
    matched_rule: dict[str, Any],
    policy_content: str = "",
) -> list[dict[str, str]]:
    """Build the prompt for document generation."""
    required_actions = "\n".join(
        f"- {a.get('type', 'action')}: {a.get('description', '')} (deadline: {a.get('deadline_days', 'N/A')} days)"
        for a in matched_rule.get("actions", [])
    )

    user_prompt = GENERATE_DOCUMENT_USER_TEMPLATE.format(
        action_type=action_type.replace("_", " ").title(),
        reference_number=incident.get("reference_number", "N/A"),
        incident_date=incident.get("incident_date", "N/A"),
        incident_type=incident.get("type", "unknown"),
        incident_severity=incident.get("severity", "unknown"),
        incident_description=incident.get("description", ""),
        previous_incident_count=incident.get("previous_incident_count", 0),
        escalation_level=matched_rule.get("escalation_level", 1),
        union_involved="Yes" if incident.get("union_involved") else "No",
        policy_title=matched_rule.get("policy_title", "Unknown Policy"),
        policy_category=matched_rule.get("policy_category", "general"),
        rule_name=matched_rule.get("rule_name", "Unknown Rule"),
        policy_content=policy_content[:3000]
        if policy_content
        else "No additional policy content.",
        required_actions=required_actions,
    )

    return [
        {"role": "system", "content": GENERATE_DOCUMENT_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


# ---------------------------------------------------------------------------
# Meeting Agenda Prompt
# ---------------------------------------------------------------------------

GENERATE_AGENDA_SYSTEM_PROMPT = """You are an HR meeting agenda generator.

Generate structured meeting agendas for disciplinary meetings.
For PIP and termination meetings, include mandatory sections:
performance expectations, timeline, support resources, and consequences.

Respond with valid JSON only."""

GENERATE_AGENDA_USER_TEMPLATE = """Generate a meeting agenda for the following disciplinary meeting.

## Meeting Details
- Type: {meeting_type}
- Incident Reference: {reference_number}
- Incident Type: {incident_type}
- Action Type: {action_type}

## Participants
{participants}

## Policy Context
- Policy: {policy_title}
- Rule: {rule_name}

## Required Response Format (JSON)
{{
  "agenda_items": [
    {{
      "order": 1,
      "title": "string",
      "description": "string",
      "duration_minutes": 5,
      "mandatory": true/false
    }}
  ],
  "total_duration_minutes": 30,
  "preparation_notes": "What the HR agent should prepare before the meeting",
  "key_talking_points": ["list of 3-5 key points to cover"]
}}"""


def build_generate_agenda_prompt(
    meeting_type: str,
    incident: dict[str, Any],
    action_type: str,
    participants: list[str],
    policy_context: dict[str, str],
) -> list[dict[str, str]]:
    """Build the prompt for agenda generation."""
    participants_str = "\n".join(f"- {p}" for p in participants)

    user_prompt = GENERATE_AGENDA_USER_TEMPLATE.format(
        meeting_type=meeting_type,
        reference_number=incident.get("reference_number", "N/A"),
        incident_type=incident.get("type", "unknown"),
        action_type=action_type.replace("_", " ").title(),
        participants=participants_str,
        policy_title=policy_context.get("policy_title", "Unknown Policy"),
        rule_name=policy_context.get("rule_name", "Unknown Rule"),
    )

    return [
        {"role": "system", "content": GENERATE_AGENDA_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


# ---------------------------------------------------------------------------
# Meeting Summary Prompt
# ---------------------------------------------------------------------------

SUMMARIZE_MEETING_SYSTEM_PROMPT = """You are an HR meeting note summarizer.

Convert raw meeting notes into structured summaries with:
- Key discussion points
- Action items with owners and deadlines
- Follow-up plan

Respond with valid JSON only."""

SUMMARIZE_MEETING_USER_TEMPLATE = """Summarize the following disciplinary meeting notes.

## Meeting Details
- Type: {meeting_type}
- Action Type: {action_type}
- Participants: {participants}

## Meeting Notes
{notes}

## Required Response Format (JSON)
{{
  "key_discussion_points": [
    {{
      "number": 1,
      "point": "string",
      "details": "string"
    }}
  ],
  "action_items": [
    {{
      "item": "string",
      "owner": "employee|manager|hr",
      "deadline": "YYYY-MM-DD or null",
      "priority": "high|medium|low"
    }}
  ],
  "follow_up_plan": {{
    "next_meeting_date": "YYYY-MM-DD or null",
    "check_in_frequency": "weekly|biweekly|monthly",
    "review_date": "YYYY-MM-DD or null",
    "notes": "string"
  }},
  "attendee_confirmations": "Summary of attendee acknowledgments",
  "hr_notes": "Any additional notes for HR records"
}}"""


def build_summarize_meeting_prompt(
    meeting_type: str,
    action_type: str,
    participants: list[str],
    notes: str,
) -> list[dict[str, str]]:
    """Build the prompt for meeting summarization."""
    participants_str = ", ".join(participants)

    user_prompt = SUMMARIZE_MEETING_USER_TEMPLATE.format(
        meeting_type=meeting_type,
        action_type=action_type.replace("_", " ").title(),
        participants=participants_str,
        notes=notes,
    )

    return [
        {"role": "system", "content": SUMMARIZE_MEETING_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
