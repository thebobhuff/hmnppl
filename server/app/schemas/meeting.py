"""Pydantic schemas for meeting-related endpoints.

Defines request/response models for:
- ``POST /generate-agenda`` — produce a meeting agenda from a topic list
- ``POST /summarize-meeting`` — produce an AI summary of meeting notes
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


# ---- Generate Agenda ----


class GenerateAgendaRequest(BaseModel):
    """Payload for meeting agenda generation.

    The caller supplies the meeting title, duration, and topics to cover.
    The AI returns a structured agenda with time allocations.
    """

    meeting_title: str = Field(
        ...,
        min_length=1,
        max_length=300,
        description="Title or purpose of the meeting.",
    )
    duration_minutes: int = Field(
        ...,
        ge=5,
        le=480,
        description="Planned meeting length in minutes.",
    )
    topics: List[str] = Field(
        ...,
        min_length=1,
        description="List of topics to cover.",
    )
    participants: Optional[List[str]] = Field(
        default=None,
        description="Names or roles of expected participants.",
    )
    additional_instructions: Optional[str] = Field(
        default=None,
        max_length=2_000,
        description="Extra guidance for agenda structure.",
    )


class AgendaItem(BaseModel):
    """A single agenda entry with time allocation."""

    topic: str = Field(description="Agenda item topic.")
    duration_minutes: int = Field(ge=1, description="Allocated time in minutes.")
    presenter: Optional[str] = Field(default=None, description="Person responsible.")
    notes: Optional[str] = Field(default=None, description="Additional notes.")


class GenerateAgendaResponse(BaseModel):
    """AI-generated meeting agenda."""

    meeting_title: str = Field(description="Echo of the meeting title.")
    total_duration_minutes: int = Field(description="Total allocated duration.")
    agenda_items: List[AgendaItem] = Field(
        default_factory=list,
        description="Ordered list of agenda entries.",
    )
    preparation_notes: List[str] = Field(
        default_factory=list,
        description="Pre-meeting preparation suggestions.",
    )


# ---- Summarize Meeting ----


class SummarizeMeetingRequest(BaseModel):
    """Payload for meeting summarisation.

    The caller provides raw meeting notes or a transcript and the AI
    returns a structured summary with action items.
    """

    meeting_notes: str = Field(
        ...,
        min_length=10,
        max_length=50_000,
        description="Raw meeting notes or transcript text.",
    )
    meeting_title: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Optional title for context.",
    )
    participants: Optional[List[str]] = Field(
        default=None,
        description="Names or roles of attendees.",
    )


class ActionItem(BaseModel):
    """A follow-up task identified during the meeting."""

    task: str = Field(description="Description of the action item.")
    assignee: Optional[str] = Field(default=None, description="Person responsible.")
    deadline: Optional[str] = Field(default=None, description="Due date or timeframe.")


class Decision(BaseModel):
    """A decision recorded during the meeting."""

    decision: str = Field(description="What was decided.")
    rationale: Optional[str] = Field(default=None, description="Why it was decided.")


class SummarizeMeetingResponse(BaseModel):
    """AI-generated meeting summary."""

    summary: str = Field(description="Concise narrative summary of the meeting.")
    key_points: List[str] = Field(
        default_factory=list,
        description="Bulleted list of key takeaways.",
    )
    action_items: List[ActionItem] = Field(
        default_factory=list,
        description="Follow-up tasks with owners and deadlines.",
    )
    decisions: List[Decision] = Field(
        default_factory=list,
        description="Formal decisions recorded during the meeting.",
    )
