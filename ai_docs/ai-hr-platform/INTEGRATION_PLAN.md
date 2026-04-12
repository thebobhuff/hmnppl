# AI-First HR Platform: Competitive Integration Plan

## Executive Summary

The HR technology landscape is shifting from traditional "Systems of Record" (Workday, SAP) to "Systems of Intelligence" (Rippling, Eightfold, Paradox). To succeed, our platform must move beyond simple chat interfaces and deliver **Agentic Workflows**—AI that doesn't just answer questions, but executes multi-step HR processes autonomously while maintaining strict compliance and Human-in-the-Loop (HITL) safeguards.

This document outlines the strategic integration plan to wire up our existing Next.js/FastAPI scaffolding and systematically replace placeholder data with context-aware, AI-driven backend services.

---

## 1. Competitive Baseline vs. Our Platform

| Feature Category        | Traditional Tools (Workday)   | Modern Tools (Rippling/Lattice)  | **Our AI-First Approach**                                                                                  |
| :---------------------- | :---------------------------- | :------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Policy Management**   | Static PDFs, manual updates   | Basic tracking & acknowledgments | **Auto-generating** policies based on changing local laws; RAG-powered Q&A.                                |
| **Incident Management** | Manual forms, slow HR review  | Ticketing systems, routed to HR  | **AI Mediation & Resolution**: AI analyzes incidents, suggests disciplinary steps, auto-drafts PIPs.       |
| **Performance Reviews** | Annual manual forms           | Continuous feedback loops        | **Ambient tracking**: AI synthesizes project data, chat sentiment, and metrics to draft unbiased reviews.  |
| **Onboarding**          | Manual data entry, checklists | Automated provisioning (IT/HR)   | **Conversational Onboarding**: AI guides the employee, auto-configures app access, drafts welcome packets. |

---

## 2. Codebase Integration Roadmap (Wiring the Stubs)

Based on the codebase crawl, we have several critical areas currently using mock data that must be wired up to act as the foundation for the AI engine.

### Phase 1: Core Data Unification (Weeks 1-2)

_Goal: Replace all hardcoded arrays with real database queries so the AI has live context._

- **Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)**
  - _Current:_ Hardcoded stats (`PENDING_REVIEWS`, `UPCOMING_MEETINGS`, `MY_REPORTS`).
  - _Action:_ Build unified aggregate endpoints in FastAPI. Create a `/api/v1/dashboard/summary` endpoint that returns real counts based on the user's RBAC role.
- **Policies (`src/app/(dashboard)/policies/page.tsx`)**
  - _Current:_ `MOCK_POLICIES`.
  - _Action:_ Wire up to the existing `policiesAPI.list()`.
  - _AI Hook:_ Add a "Generate Policy" button that hits the FastAPI backend to draft a new policy using an LLM.
- **Documents (`src/app/(dashboard)/documents/page.tsx`)**
  - _Current:_ `MOCK_DOCUMENTS`.
  - _Action:_ Wire up to `documentsAPI.list()`.

### Phase 2: Agentic Workflows & AI Backend (Weeks 3-4)

_Goal: Remove hardcoded AI logic in FastAPI and connect deep LLM capabilities._

- **Incident Resolution Engine (`server/app/routers/ai.py`)**
  - _Current:_ `evaluate-incident` uses hardcoded context (`matched_rule`).
  - _Action:_ Implement Vector DB (pgvector) in Supabase. When an incident is reported, embed the text, run a similarity search against the company's actual active policies, and feed the _real_ matched policy to the LLM to determine the severity and recommended action.
- **Automated Document Generation (`server/app/routers/ai.py`)**
  - _Current:_ `generate-document` uses hardcoded incident dates and references.
  - _Action:_ Fetch the actual incident from PostgreSQL. Generate PIPs, Warnings, or Commendations using the real employee history, and push them to the Tiptap editor (`TrackChangesEditor.tsx`) for Human-in-the-Loop review.

### Phase 3: Advanced AI Modules (Weeks 5-6)

_Goal: Build the "Killer Features" missing from the UI stubs._

- **AI Performance & Analytics (`platform-analytics/page.tsx`, `ai-performance/page.tsx`)**
  - _Action:_ Build out the "Under Construction" pages. Aggregate AI evaluation accuracy (e.g., how often does HR accept the AI's disciplinary recommendation vs. overriding it?). Render this using Recharts.
- **Conversational HR Helpdesk**
  - _Action:_ Build a chat UI component. Create an agent in FastAPI (`/api/v1/agents/policy-chat`) equipped with RAG tools to answer employee questions ("How much PTO do I have?", "What is the bereavement policy?") by querying the database.

---

## 3. Deep Integration Strategy (The "Moat")

To truly compete with Deel or Rippling, the AI cannot be a thin wrapper. It must be deeply embedded:

1.  **Context-Aware Prompts:** Every prompt sent to the LLM must automatically inject the caller's `company_id`, the active `feature_flags` from the `companies` table, and the `ai_confidence_threshold`.
2.  **Human-in-the-Loop (HITL) by Default:** All AI-generated write-ups (terminations, PIPs, policy changes) are saved strictly as `status = "draft"`. They are piped into the Tiptap document editor where a `company_admin` or `hr_agent` must "Approve & Sign."
3.  **Feedback Loop:** When an HR admin edits an AI-generated document in the Tiptap editor, we must capture the diff. Feed this diff back into the `/api/v1/feedback` endpoint to fine-tune the company's specific system prompt over time (e.g., "Company X prefers softer language in warnings").

---

## Next Immediate Steps for the Development Team

1. Tackle the **Dashboard** and **Policies** views by ripping out the mock components and plugging in the SWR/fetch hooks to the real API.
2. Update the FastAPI `evaluate-incident` route to pull the actual employee's incident history from the database rather than assuming `previous_incident_count: 0`.
