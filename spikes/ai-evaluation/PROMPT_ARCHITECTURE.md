# Prompt Architecture — AI HR Platform

> **Spike:** T007 — AI Model Evaluation + Prompt Architecture  
> **Author:** Backend Team  
> **Date:** 2026-03-29  
> **Status:** Recommended

---

## 1. Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Server-controlled templates** | All prompt templates live server-side. The front-end NEVER sees or sends raw prompt text. This prevents prompt injection via the UI. |
| **Structured data payloads** | Incidents, employee context, and policy rules are serialised as JSON objects — not interpolated into free-text strings. This makes prompts deterministic, testable, and version-controllable. |
| **JSON-only output** | Every AI response must be valid JSON conforming to a predefined schema. Parsing failures trigger a retry or fallback — never raw-text rendering. |
| **Cheapest capable model** | Each task type is mapped to the smallest model that consistently meets quality thresholds (see §5). |
| **No PII in prompts** | Employee names, IDs, and personal details are replaced with placeholders before the prompt reaches the model. The server re-hydrates after response. |

---

## 2. Prompt Template Pattern

### 2.1 System Template (Immutable)

System messages are **hard-coded** in `server/app/services/ai/prompts.py`. They are never user-supplied.

```
SYSTEM_TEMPLATE_EVALUATE = (
    "You are an HR discipline evaluation engine. "
    "Evaluate the incident against the provided policy rules. "
    "Output ONLY structured JSON matching the schema below. "
    "Do not include explanations, markdown, or commentary."
)
```

### 2.2 Structured Data Payload

The user message is a JSON object — not a narrative string:

```python
user_payload = {
    "incident": {
        "type": "tardiness",
        "severity": "medium",
        "description": "Employee arrived 25 minutes late without prior notification",
        "incident_date": "2026-03-15"
    },
    "employee_context": {
        "prior_incidents": 0,
        "has_active_pip": False
    },
    "policy_rules": [
        {
            "trigger": {"type": "tardiness"},
            "conditions": [{"field": "prior_count", "operator": "eq", "value": 0}],
            "action": {"type": "verbal_warning", "escalation_level": 1}
        }
    ],
    "response_schema": { ... }  # JSON Schema embedded so model self-validates
}
```

**Why JSON instead of free-text?**

1. **Determinism** — Same input always produces the same structure.
2. **Testability** — Golden-dataset tests can assert exact field values.
3. **Token efficiency** — JSON is more compact than narrative descriptions.
4. **Schema enforcement** — We embed the expected schema so the model constrains its own output.

### 2.3 Messages Array Construction

```python
def build_evaluation_prompt(
    incident: dict,
    employee: dict,
    policy_rules: list[dict],
) -> list[dict[str, str]]:
    """Build the messages array for the OpenRouter chat completion API."""
    return [
        {"role": "system", "content": SYSTEM_TEMPLATE_EVALUATE},
        {"role": "user", "content": json.dumps({
            "incident": _scrub_pii(incident),
            "employee_context": _scrub_pii(employee),
            "policy_rules": policy_rules,
            "response_schema": EVALUATION_RESPONSE_SCHEMA,
        })},
    ]
```

---

## 3. Response Validation Schemas

### 3.1 Evaluation Response Schema

```json
{
    "type": "object",
    "required": ["matched_rule", "escalation_level", "action_type", "confidence", "reasoning"],
    "properties": {
        "matched_rule": {
            "type": "string",
            "description": "The action type of the matched policy rule"
        },
        "escalation_level": {
            "type": "integer",
            "minimum": 0,
            "description": "Discipline escalation level"
        },
        "action_type": {
            "type": "string",
            "enum": ["verbal_warning", "written_warning", "suspension", "termination", "no_action", "pip_review"]
        },
        "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Model confidence score 0-100"
        },
        "reasoning": {
            "type": "string",
            "description": "Brief explanation of why this rule was matched"
        },
        "policy_rule_index": {
            "type": "integer",
            "description": "0-based index of the matched rule in the policy_rules array, or -1 if no match"
        }
    },
    "additionalProperties": false
}
```

### 3.2 Document Generation Response Schema

```json
{
    "type": "object",
    "required": ["document_content", "document_type", "placeholders_filled"],
    "properties": {
        "document_content": {
            "type": "string",
            "description": "Full generated document text"
        },
        "document_type": {
            "type": "string",
            "enum": ["verbal_warning", "written_warning", "suspension_notice", "termination_letter", "pip_notice", "coaching_memo"]
        },
        "placeholders_filled": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of template variables that were populated"
        },
        "warnings": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Non-fatal issues during generation"
        },
        "tone_score": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "How well the document matches expected professional tone"
        }
    },
    "additionalProperties": false
}
```

### 3.3 Validation Flow

```
AI Response (raw text)
    │
    ▼
JSON.parse() ───────► Failure ──► Retry (up to 2x) with "Respond with valid JSON only"
    │
    ▼ (success)
jsonschema.validate(response, SCHEMA)
    │
    ▼
Valid ──► Return to caller
Invalid ──► Log warning + return structured error (never expose raw AI output)
```

---

## 4. PII Scrubbing Strategy

Before any data is sent to the AI model, PII is replaced with placeholders:

| Field | Original | Scrubbed |
|-------|----------|----------|
| Employee name | "John Smith" | "[EMPLOYEE_NAME]" |
| Employee ID | "EMP-12345" | "[EMPLOYEE_ID]" |
| Email | "john@company.com" | "[EMPLOYEE_EMAIL]" |
| Department | "Engineering" | (kept — not PII) |
| Manager name | "Jane Doe" | "[MANAGER_NAME]" |

The server maintains a **PII map** per request:

```python
pii_map: dict[str, str] = {}  # placeholder -> real value

def _scrub_pii(data: dict) -> dict:
    """Recursively replace PII fields with placeholders."""
    PII_FIELDS = {"name", "employee_name", "email", "manager_name", "employee_id"}
    scrubbed = {}
    for key, value in data.items():
        if key in PII_FIELDS and isinstance(value, str):
            placeholder = f"[{key.upper()}]"
            pii_map[placeholder] = value
            scrubbed[key] = placeholder
        elif isinstance(value, dict):
            scrubbed[key] = _scrub_pii(value)
        elif isinstance(value, list):
            scrubbed[key] = [_scrub_pii(item) if isinstance(item, dict) else item for item in value]
        else:
            scrubbed[key] = value
    return scrubbed

def _restore_pii(text: str, pii_map: dict[str, str]) -> str:
    """Replace placeholders back with real values in the final output."""
    for placeholder, real_value in pii_map.items():
        text = text.replace(placeholder, real_value)
    return text
```

---

## 5. Model Selection Strategy

### Decision Matrix

| Task | Primary Model | Fallback Model | Rationale |
|------|--------------|----------------|-----------|
| **Incident Evaluation** | `meta-llama/llama-3-70b-instruct` | `openai/gpt-4o-mini` | Rule matching is mostly logic, not creativity. 70B Llama is cheaper and sufficient. |
| **Document Generation** | `openai/gpt-4o-mini` | `meta-llama/llama-3-70b-instruct` | Requires nuanced, professional language. GPT-4o-mini consistently produces better prose. |
| **Meeting Agenda** | `meta-llama/llama-3-70b-instruct` | `mistralai/mistral-7b-instruct` | Structured output with low complexity. 70B Llama balances cost and quality. |
| **Meeting Summary** | `openai/gpt-4o-mini` | `meta-llama/llama-3-70b-instruct` | Requires understanding long transcripts. GPT-4o-mini has better context handling. |

### Selection Logic

```python
TASK_MODEL_MAP = {
    "evaluate_incident": "meta-llama/llama-3-70b-instruct",
    "generate_document": "openai/gpt-4o-mini",
    "generate_agenda": "meta-llama/llama-3-70b-instruct",
    "summarize_meeting": "openai/gpt-4o-mini",
}

FALLBACK_MODEL = "openai/gpt-4o-mini"

def get_model_for_task(task: str) -> str:
    return TASK_MODEL_MAP.get(task, FALLBACK_MODEL)
```

### Cost Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Monthly AI spend | > $50 | Alert + switch to cheaper model |
| Per-call cost | > $0.01 | Log warning |
| Per-call latency p95 | > 5s | Alert + investigate model load |

---

## 6. Security Controls

### 6.1 Input Validation (Before Prompt Construction)

1. **Type validation** — All inputs validated by Pydantic schemas (already enforced by FastAPI).
2. **Length limits** — All string fields have `max_length` constraints.
3. **Enum constraints** — Only whitelisted values for `type`, `severity`, `action_type`.
4. **No raw prompt injection** — User input is JSON-serialised, never interpolated into the system template.

### 6.2 Output Validation (After AI Response)

1. **JSON parse check** — Response must be valid JSON.
2. **Schema validation** — Response must match the predefined JSON Schema.
3. **Enum check** — All enum fields must match whitelisted values.
4. **Confidence threshold** — If `confidence < 70`, flag for human review.
5. **No PII leakage** — Scan response for patterns matching SSN, email, phone.

### 6.3 Prompt Injection Mitigation

- System messages are immutable (server-side constants).
- User messages are structured JSON, not free-text.
- Response schemas enforce `additionalProperties: false` to reject injected fields.
- Model outputs never rendered as HTML without sanitisation.

---

## 7. Caching Strategy

Policy rule evaluation is **deterministic** for the same inputs. Cache results:

```python
import hashlib, json

def cache_key(incident: dict, employee: dict, policy_rules: list) -> str:
    payload = json.dumps({
        "incident": incident,
        "employee": employee,
        "rules": policy_rules,
    }, sort_keys=True)
    return f"ai:eval:{hashlib.sha256(payload.encode()).hexdigest()}"
```

- **TTL:** 24 hours (policy rules may change).
- **Scope:** Per-tenant (different organisations have different policies).
- **Invalidation:** On policy rule update, clear all cached evaluations for that tenant.

---

## 8. Prompt Versioning

Each prompt template is versioned in code:

```python
PROMPT_VERSIONS = {
    "evaluate_incident": "1.0.0",
    "generate_document": "1.0.0",
    "generate_agenda": "1.0.0",
    "summarize_meeting": "1.0.0",
}
```

All AI responses include a `prompt_version` field for audit trail:

```json
{
    "matched_rule": "verbal_warning",
    "confidence": 92,
    "prompt_version": "1.0.0",
    "model": "meta-llama/llama-3-70b-instruct"
}
```

---

## 9. Observability

Every AI call logs structured data:

```python
logger.info("ai_evaluation_complete", extra={
    "task": "evaluate_incident",
    "model": model_id,
    "prompt_version": PROMPT_VERSIONS["evaluate_incident"],
    "latency_ms": elapsed_ms,
    "tokens_in": usage.get("prompt_tokens"),
    "tokens_out": usage.get("completion_tokens"),
    "confidence": result.get("confidence"),
    "matched_rule": result.get("matched_rule"),
    "cache_hit": False,
    "request_id": request_id,
})
```

---

## 10. Implementation Checklist

- [ ] Create `server/app/services/ai/` package
- [ ] Implement `prompts.py` with all templates and schemas
- [ ] Implement `pii.py` with scrub/restore functions
- [ ] Implement `client.py` wrapping OpenRouter API calls
- [ ] Implement `validation.py` with JSON Schema validation
- [ ] Implement `cache.py` with Redis-backed caching
- [ ] Wire into existing router stubs in `server/app/routers/ai.py`
- [ ] Add OpenRouter dependency to `requirements.txt`
- [ ] Add `OPENROUTER_API_KEY` to production environment config
- [ ] Write integration tests against mock OpenRouter responses
- [ ] Load test with realistic throughput (100 evals + 50 docs per month)
