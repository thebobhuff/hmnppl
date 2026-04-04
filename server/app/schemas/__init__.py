"""Pydantic request/response schemas for AI service endpoints."""

from app.schemas.incident import (
    EvaluateIncidentRequest,
    EvaluateIncidentResponse,
    SeverityLevel,
)
from app.schemas.document import (
    GenerateDocumentRequest,
    GenerateDocumentResponse,
    DocumentType,
)
from app.schemas.meeting import (
    GenerateAgendaRequest,
    GenerateAgendaResponse,
    SummarizeMeetingRequest,
    SummarizeMeetingResponse,
)

__all__ = [
    "EvaluateIncidentRequest",
    "EvaluateIncidentResponse",
    "SeverityLevel",
    "GenerateDocumentRequest",
    "GenerateDocumentResponse",
    "DocumentType",
    "GenerateAgendaRequest",
    "GenerateAgendaResponse",
    "SummarizeMeetingRequest",
    "SummarizeMeetingResponse",
]
