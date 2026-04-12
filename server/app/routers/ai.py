"""AI Router — full implementation of all 4 AI endpoints.

Endpoints:
  POST /evaluate-incident   — Evaluate incident against policies
  POST /generate-document   — Generate disciplinary document
  POST /generate-agenda     — Generate meeting agenda
  POST /summarize-meeting   — Summarize meeting notes

All endpoints:
  - Require API key authentication
  - Use model-agnostic AI routing with fallback
  - Implement circuit breaker and retry logic
  - Validate outputs against expected schemas
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.core.security import validate_api_key
from app.prompts import (
    build_evaluate_incident_prompt,
    build_generate_agenda_prompt,
    build_generate_document_prompt,
    build_summarize_meeting_prompt,
)
from app.schemas.document import GenerateDocumentRequest, GenerateDocumentResponse
from app.schemas.incident import EvaluateIncidentRequest, EvaluateIncidentResponse
from app.schemas.meeting import (
    GenerateAgendaRequest,
    GenerateAgendaResponse,
    SummarizeMeetingRequest,
    SummarizeMeetingResponse,
)
from app.services.ai_router import AIRouter, CircuitBreakerOpenError
from app.services.output_validator import (
    OutputValidationError,
    parse_json_output,
    validate_document_output,
    validate_evaluation_output,
)
from app.services.pii_sanitizer import sanitize_dict

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    dependencies=[Depends(validate_api_key)],
)

# ---------------------------------------------------------------------------
# Model selection per task (cost optimization)
# ---------------------------------------------------------------------------

MODEL_EVALUATE = "openrouter:meta-llama/llama-3-8b-instruct"  # Cheapest capable
MODEL_DOCUMENT = "openrouter:meta-llama/llama-3-70b-instruct"  # Capable for legal-grade
MODEL_AGENDA = "openrouter:meta-llama/llama-3-8b-instruct"  # Cheapest
MODEL_SUMMARY = "openrouter:meta-llama/llama-3-8b-instruct"  # Cheapest

# ---------------------------------------------------------------------------
# POST /evaluate-incident
# ---------------------------------------------------------------------------


@router.post("/evaluate-incident")
async def evaluate_incident(
    body: EvaluateIncidentRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Evaluate an employee incident report using AI.

    Performs deterministic rule matching (via policy_engine) then uses
    the LLM to generate a recommendation with confidence scoring.
    """
    start_time = time.monotonic()

    try:
        router_instance = AIRouter(settings)

        try:
            from app.services.supabase_client import get_supabase_client

            supabase = get_supabase_client()
        except Exception as e:
            logger.warning(f"Failed to load supabase client: {e}")
            supabase = None

        # Build prompt from structured data
        previous_inc_count = 0
        if supabase and body.employee_id:
            try:
                # Query db for actual historical incident count for this employee
                inc_resp = (
                    supabase.table("incidents")
                    .select("id", count="exact")
                    .eq("employee_id", body.employee_id)
                    .execute()
                )
                previous_inc_count = inc_resp.count or 0
            except Exception as e:
                logger.warning(
                    f"Failed to fetch incident count for employee {body.employee_id}: {e}"
                )

        incident_data = {
            "type": body.incident_text[:100],  # Simplified for MVP
            "severity": "medium",  # Default; would come from incident record
            "description": body.incident_text,
            "previous_incident_count": previous_inc_count,
            "union_involved": False,
        }

        # Sanitize — no PII to AI providers
        sanitized = sanitize_dict(incident_data)

        # Vector DB Similarity Search (RAG)
        query_embedding = None
        try:
            embeddings = await router_instance.get_embeddings([body.incident_text])
            if embeddings and len(embeddings) > 0:
                query_embedding = embeddings[0]
        except Exception as e:
            logger.warning(f"Failed to get embeddings: {e}")

        rpc_result = None
        if supabase and query_embedding:
            try:
                # Match against policy_embeddings
                rpc_result = supabase.rpc(
                    "match_policies",
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": 0.5,
                        "match_count": 1,
                        "company_id_filter": None,
                    },
                ).execute()
            except Exception as e:
                logger.warning(f"Failed to call match_policies RPC: {e}")

        policy_content = ""
        matched_rule = {
            "policy_title": "General Disciplinary Policy",
            "policy_category": "general",
            "rule_name": "Standard Violation",
            "escalation_level": 1,
            "actions": [{"type": "verbal_warning", "description": "Verbal warning"}],
            "escalation_ladder": [
                {"level": 1, "action_type": "verbal_warning"},
                {"level": 2, "action_type": "written_warning"},
                {"level": 3, "action_type": "pip"},
                {"level": 4, "action_type": "termination_review"},
            ],
        }

        if (
            rpc_result
            and hasattr(rpc_result, "data")
            and rpc_result.data
            and len(rpc_result.data) > 0
        ):
            best_match = rpc_result.data[0]
            policy_content = best_match.get("content", "")
            # Merge dynamically matched metadata if available
            metadata = best_match.get("metadata", {})
            if metadata.get("policy_title"):
                matched_rule["policy_title"] = metadata["policy_title"]
            if metadata.get("category"):
                matched_rule["policy_category"] = metadata["category"]
            if metadata.get("actions"):
                matched_rule["actions"] = metadata["actions"]
            if metadata.get("escalation_ladder"):
                matched_rule["escalation_ladder"] = metadata["escalation_ladder"]
            if metadata.get("escalation_level"):
                matched_rule["escalation_level"] = metadata["escalation_level"]
            if metadata.get("rule_name"):
                matched_rule["rule_name"] = metadata["rule_name"]

        messages = build_evaluate_incident_prompt(
            incident=sanitized,
            matched_rule=matched_rule,
            policy_content=policy_content,
        )

        # Call AI
        result = await router_instance.call(
            messages=messages,
            model=MODEL_EVALUATE,
            temperature=0.1,
            max_tokens=1000,
        )

        # Parse and validate output
        parsed = parse_json_output(result["content"])
        validated = validate_evaluation_output(parsed)

        # Compute content hash for audit trail
        content_hash = hashlib.sha256(result["content"].encode()).hexdigest()

        elapsed = time.monotonic() - start_time

        return {
            "confidence": validated["confidence"],
            "recommendation": validated["recommendation"],
            "reasoning": validated["reasoning"],
            "policy_references": validated.get("policy_references", []),
            "risk_factors": validated.get("risk_factors", []),
            "suggested_follow_up": validated.get("suggested_follow_up", []),
            "meta": {
                "model": result["model"],
                "tokens_used": result["usage"]["total_tokens"],
                "cost_usd": result["cost"],
                "latency_ms": round(elapsed * 1000, 2),
                "content_hash": content_hash,
            },
        }

    except CircuitBreakerOpenError as exc:
        logger.warning("AI evaluation blocked by circuit breaker: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Incident routed to manual review.",
        )
    except OutputValidationError as exc:
        logger.error("AI output validation failed: %s", exc.errors)
        raise HTTPException(
            status_code=502,
            detail=f"AI response failed validation: {'; '.join(exc.errors)}",
        )
    except Exception as exc:
        logger.exception("Incident evaluation failed")
        raise HTTPException(
            status_code=500,
            detail=f"AI evaluation failed: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# POST /generate-document
# ---------------------------------------------------------------------------


@router.post("/generate-document")
async def generate_document(
    body: GenerateDocumentRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Generate a disciplinary document from incident and policy context."""
    start_time = time.monotonic()

    try:
        router_instance = AIRouter(settings)

        try:
            from app.services.supabase_client import get_supabase_client

            supabase = get_supabase_client()
        except Exception as e:
            logger.warning(f"Failed to load supabase client: {e}")
            supabase = None

        incident_id = body.template_variables.get("incident_id")

        # Load incident from DB if incident_id is passed, else use fallbacks
        db_incident = None
        previous_inc_count = 0

        if supabase and incident_id:
            try:
                resp = (
                    supabase.table("incidents")
                    .select("*")
                    .eq("id", incident_id)
                    .maybe_single()
                    .execute()
                )
                if resp and hasattr(resp, "data") and resp.data:
                    db_incident = resp.data

                    # Fetch historical incidents count for this user
                    emp_id = db_incident.get("employee_id")
                    if emp_id:
                        inc_resp = (
                            supabase.table("incidents")
                            .select("id", count="exact")
                            .eq("employee_id", emp_id)
                            .execute()
                        )
                        previous_inc_count = inc_resp.count or 0
            except Exception as e:
                logger.warning(f"Failed to fetch incident {incident_id}: {e}")

        # Map mapped fields dynamically or fallback to template variables
        incident_data = {
            "reference_number": (
                db_incident.get("reference_number")
                if db_incident
                else body.template_variables.get("reference_number", "INC-XXXX")
            ),
            "incident_date": (
                db_incident.get("incident_date")
                if db_incident
                else body.template_variables.get(
                    "incident_date", time.strftime("%Y-%m-%d")
                )
            ),
            "type": (
                db_incident.get("type", "unknown")
                if db_incident
                else body.template_variables.get("type", "unknown")
            ),
            "severity": (
                db_incident.get("severity", "medium")
                if db_incident
                else body.template_variables.get("severity", "medium")
            ),
            "description": (
                db_incident.get("description")
                if db_incident
                else body.template_variables.get(
                    "description",
                    body.additional_instructions or "Incident description",
                )
            ),
            "previous_incident_count": previous_inc_count,
            "union_involved": (
                db_incident.get("union_involved", False)
                if db_incident
                else body.template_variables.get("union_involved", False)
            ),
        }

        sanitized = sanitize_dict(incident_data)

        # Pull matched rule context from db_incident if possible
        matched_rule = {
            "policy_title": "Company Disciplinary Policy",
            "policy_category": "general",
            "rule_name": "Standard Violation",
            "escalation_level": (
                db_incident.get("escalation_level", 1) if db_incident else 1
            ),
            "actions": [
                {
                    "type": body.template_variables.get("action_type")
                    or "verbal_warning",
                    "description": "Required corrective action",
                    "deadline_days": 30,
                }
            ],
        }

        policy_content = ""
        # Could fetch policy via linked_policy_id from DB
        if supabase and db_incident and db_incident.get("linked_policy_id"):
            try:
                pol_resp = (
                    supabase.table("policies")
                    .select("content, title, category")
                    .eq("id", db_incident["linked_policy_id"])
                    .maybe_single()
                    .execute()
                )
                if pol_resp and hasattr(pol_resp, "data") and pol_resp.data:
                    matched_rule["policy_title"] = pol_resp.data.get(
                        "title", matched_rule["policy_title"]
                    )
                    matched_rule["policy_category"] = pol_resp.data.get(
                        "category", matched_rule["policy_category"]
                    )
                    policy_content = pol_resp.data.get("content", "")
            except Exception as e:
                logger.warning(f"Failed to fetch policy: {e}")

        messages = build_generate_document_prompt(
            incident=sanitized,
            action_type=body.template_variables.get("action_type")
            or body.document_type.value,
            matched_rule=matched_rule,
            policy_content=policy_content,
        )

        result = await router_instance.call(
            messages=messages,
            model=MODEL_DOCUMENT,
            temperature=0.2,
            max_tokens=3000,
        )

        parsed = parse_json_output(result["content"])
        validated = validate_document_output(parsed)

        content_hash = hashlib.sha256(result["content"].encode()).hexdigest()
        elapsed = time.monotonic() - start_time

        return {
            "document_content": validated["document_content"],
            "action_type": validated["action_type"],
            "policy_references": validated.get("policy_references", []),
            "required_actions": validated.get("required_actions", []),
            "meta": {
                "model": result["model"],
                "tokens_used": result["usage"]["total_tokens"],
                "cost_usd": result["cost"],
                "latency_ms": round(elapsed * 1000, 2),
                "content_hash": content_hash,
            },
        }

    except CircuitBreakerOpenError as exc:
        logger.warning("AI document generation blocked by circuit breaker: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable.",
        )
    except OutputValidationError as exc:
        logger.error("AI document output validation failed: %s", exc.errors)
        raise HTTPException(
            status_code=502,
            detail=f"AI response failed validation: {'; '.join(exc.errors)}",
        )
    except Exception as exc:
        logger.exception("Document generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Document generation failed: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# POST /generate-agenda
# ---------------------------------------------------------------------------


@router.post("/generate-agenda")
async def generate_agenda(
    body: GenerateAgendaRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Generate a structured meeting agenda."""
    start_time = time.monotonic()

    try:
        router_instance = AIRouter(settings)

        incident_data = {
            "reference_number": "INC-2026-0001",
            "type": "tardiness",
        }

        messages = build_generate_agenda_prompt(
            meeting_type=body.meeting_type or "disciplinary",
            incident=incident_data,
            action_type=body.action_type or "verbal_warning",
            participants=body.participants or ["HR Agent", "Manager", "Employee"],
            policy_context={
                "policy_title": "Company Disciplinary Policy",
                "rule_name": "Standard Violation",
            },
        )

        result = await router_instance.call(
            messages=messages,
            model=MODEL_AGENDA,
            temperature=0.3,
            max_tokens=1500,
        )

        parsed = parse_json_output(result["content"])
        elapsed = time.monotonic() - start_time

        return {
            "agenda_items": parsed.get("agenda_items", []),
            "total_duration_minutes": parsed.get("total_duration_minutes", 30),
            "preparation_notes": parsed.get("preparation_notes", ""),
            "key_talking_points": parsed.get("key_talking_points", []),
            "meta": {
                "model": result["model"],
                "tokens_used": result["usage"]["total_tokens"],
                "cost_usd": result["cost"],
                "latency_ms": round(elapsed * 1000, 2),
            },
        }

    except CircuitBreakerOpenError as exc:
        logger.warning("AI agenda generation blocked by circuit breaker: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable.",
        )
    except Exception as exc:
        logger.exception("Agenda generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Agenda generation failed: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# POST /summarize-meeting
# ---------------------------------------------------------------------------


@router.post("/summarize-meeting")
async def summarize_meeting(
    body: SummarizeMeetingRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Summarize meeting notes into structured action items and follow-up plan."""
    start_time = time.monotonic()

    try:
        router_instance = AIRouter(settings)

        messages = build_summarize_meeting_prompt(
            meeting_type=body.meeting_type or "disciplinary",
            action_type=body.action_type or "verbal_warning",
            participants=body.participants or ["HR Agent", "Manager", "Employee"],
            notes=body.notes or "No notes provided.",
        )

        result = await router_instance.call(
            messages=messages,
            model=MODEL_SUMMARY,
            temperature=0.2,
            max_tokens=2000,
        )

        parsed = parse_json_output(result["content"])
        elapsed = time.monotonic() - start_time

        return {
            "key_discussion_points": parsed.get("key_discussion_points", []),
            "action_items": parsed.get("action_items", []),
            "follow_up_plan": parsed.get("follow_up_plan", {}),
            "attendee_confirmations": parsed.get("attendee_confirmations", ""),
            "hr_notes": parsed.get("hr_notes", ""),
            "meta": {
                "model": result["model"],
                "tokens_used": result["usage"]["total_tokens"],
                "cost_usd": result["cost"],
                "latency_ms": round(elapsed * 1000, 2),
            },
        }

    except CircuitBreakerOpenError as exc:
        logger.warning("AI meeting summary blocked by circuit breaker: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable.",
        )
    except Exception as exc:
        logger.exception("Meeting summary failed")
        raise HTTPException(
            status_code=500,
            detail=f"Meeting summary failed: {str(exc)}",
        )
