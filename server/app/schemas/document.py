"""Pydantic schemas for the ``POST /generate-document`` endpoint.

These models define the wire contract for requesting AI-generated HR
documents (e.g., offer letters, warning notices, policy acknowledgements).
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---- Enums ----


class DocumentType(str, Enum):
    """Supported document generation types."""

    OFFER_LETTER = "offer_letter"
    WARNING_NOTICE = "warning_notice"
    POLICY_ACKNOWLEDGEMENT = "policy_acknowledgement"
    TERMINATION_LETTER = "termination_letter"
    PERFORMANCE_REVIEW = "performance_review"
    CUSTOM = "custom"


# ---- Request ----


class GenerateDocumentRequest(BaseModel):
    """Payload for document generation.

    The caller specifies the document type and provides a set of key-value
    template variables that the AI will use to populate the document.
    """

    document_type: DocumentType = Field(
        description="The type of HR document to generate.",
    )
    template_variables: Dict[str, Any] = Field(
        default_factory=dict,
        description="Key-value pairs injected into the document template.",
    )
    employee_name: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Target employee name for personalisation.",
    )
    department: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Department context for the document.",
    )
    additional_instructions: Optional[str] = Field(
        default=None,
        max_length=2_000,
        description="Free-text instructions to guide generation.",
    )


# ---- Response ----


class GenerateDocumentResponse(BaseModel):
    """AI-generated document result."""

    document_content: str = Field(
        description="Full generated document text.",
    )
    document_type: DocumentType = Field(
        description="Echo of the requested document type.",
    )
    placeholders_filled: List[str] = Field(
        default_factory=list,
        description="Template variables that were successfully populated.",
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Non-fatal issues encountered during generation.",
    )
