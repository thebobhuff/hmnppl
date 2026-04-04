# Wave 2 Checkpoint: Core Backend (Policies + Incidents + AI)

> **Feature**: ai-hr-platform
> **Wave**: 2
> **Completed at**: 2026-04-04
> **Context Window**: ~120k tokens used

## Completed Tasks

| Task                                             | Status      | Files Changed                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T017: Policy CRUD API + Rule Engine              | ✅ Complete | `src/lib/validations/policy.ts`, `src/lib/services/policy-service.ts`, `src/lib/services/policy-conflict-detector.ts`, `src/app/api/v1/policies/route.ts`, `src/app/api/v1/policies/[id]/route.ts`, `src/app/api/v1/policies/[id]/toggle/route.ts`                                                                                                                                                 |
| T018: Incident Submission API + Status Machine   | ✅ Complete | `src/lib/validations/incident.ts`, `src/lib/services/incident-service.ts`, `src/lib/services/incident-state-machine.ts`, `src/lib/utils/reference-number.ts`, `src/app/api/v1/incidents/route.ts`, `src/app/api/v1/incidents/[id]/route.ts`, `src/app/api/v1/incidents/[id]/status/route.ts`, `src/app/api/v1/incidents/[id]/evidence/route.ts`, `src/app/api/v1/users/me/direct-reports/route.ts` |
| T019: AI Router + Policy Evaluation Endpoint     | ✅ Complete | `server/app/services/ai_router.py`, `server/app/services/policy_engine.py`, `server/app/services/pii_sanitizer.py`, `server/app/services/output_validator.py`, `server/app/prompts/__init__.py`, `server/app/routers/ai.py` (full rewrite), `src/lib/services/ai-proxy-service.ts`                                                                                                                 |
| T020: AI Document Generation Endpoint            | ✅ Complete | Implemented in `server/app/routers/ai.py` + `server/app/prompts/__init__.py`                                                                                                                                                                                                                                                                                                                       |
| T021: AI Meeting Agenda + Summary Endpoints      | ✅ Complete | Implemented in `server/app/routers/ai.py` + `server/app/prompts/__init__.py`                                                                                                                                                                                                                                                                                                                       |
| T022: Disciplinary Actions + Document Review API | ✅ Complete | `src/lib/services/disciplinary-action-service.ts`, `src/lib/services/document-service.ts`, `src/app/api/v1/disciplinary-actions/route.ts`, `src/app/api/v1/disciplinary-actions/[id]/route.ts`, `src/app/api/v1/disciplinary-actions/[id]/review/route.ts`, `src/app/api/v1/disciplinary-actions/[id]/regenerate/route.ts`                                                                         |
| T023: Meetings API + Notification Scaffolding    | ✅ Complete | `src/lib/services/meeting-service.ts`, `src/app/api/v1/meetings/route.ts`, `src/app/api/v1/meetings/[id]/route.ts`                                                                                                                                                                                                                                                                                 |
| T024: Users + Employees API                      | ✅ Complete | `src/lib/services/user-service.ts`, `src/app/api/v1/users/route.ts`, `src/app/api/v1/users/[id]/route.ts`, `src/app/api/v1/users/[id]/timeline/route.ts`                                                                                                                                                                                                                                           |

## File Changes Summary

- **Created**: ~35 new files across services, validations, API routes, and Python AI services
- **Modified**: `server/app/routers/ai.py` (full rewrite from stubs to full implementation)
- **Deleted**: N/A

## Architecture Notes

### AI Pipeline (Python FastAPI on Railway)

- **Model-agnostic router**: OpenRouter primary, HuggingFace fallback
- **Circuit breaker**: Opens after 3 consecutive failures, 30s recovery
- **Retry logic**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **PII sanitization**: SSN, email, phone, address, salary stripped before AI calls
- **Output validation**: Schema validation, no fabricated policy references
- **Cost tracking**: Per-request cost estimation logged in response metadata
- **Model selection per task**:
  - Incident evaluation: Llama 3 8B (cheapest)
  - Document generation: Llama 3 70B (capable for legal-grade)
  - Agenda/Summary: Llama 3 8B (cheapest)

### BFF Pattern (Next.js API Routes)

- All AI calls proxied through Next.js → Python service
- API key never exposed to browser
- Degradation handling: AI down → manual queue fallback
- 60s timeout on AI calls

### State Machines

- **Incident status**: 13 states with validated transitions
- **Disciplinary action**: pending_approval → approved/rejected
- **Policy lifecycle**: draft → active (with conflict detection)

## Next Pending Tasks

### Wave 3: Core Frontend (Screens + Components)

- T025: Policy Builder UI (4-Step Wizard) [P] — 8pts
- T026: Report Issue Form (4-Step Multi-Step Form) [P] — 5pts
- T027: Incident Queue + Dashboard Home [P] — 5pts
- T028: AI Document Review (Three-Panel) [P] — 8pts
- T029: Meeting Scheduler + Summary Screens [P] — 5pts
- T030: Employee Portal + Document Signing [P] — 8pts
- T031: Notification Bell + In-App Notifications [P] — 3pts
- T032: User Management + Employee Timeline Screens [P] — 3pts

### Remaining Waves

- Wave 4: Integration & Edge Cases — 8 tasks
- Wave 5: Polish, Testing & Deploy — 8 tasks

## Session State

- **Wave progress**: 3 of 6 waves complete (Wave 0 + Wave 1 + Wave 2)
- **Story points**: 124 / 247 (50%)
- **Next action**: Start Wave 3 frontend screens (T025-T032)

---

_This checkpoint enables session recovery if the context window is exceeded._
