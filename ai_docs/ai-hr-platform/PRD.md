# AI HR Platform — Product Requirements Document

> **Status**: ✅ APPROVED
> **Author**: Product Team (Senior PM synthesis)
> **Date**: 2026-03-29
> **Confidence Score**: 95% (approved at Iteration 3)
> **Review Iterations**: 3 (Iteration 1: 88%, Iteration 2: 94%, Iteration 3: 95% APPROVED)

---

## 1. Executive Summary

The AI HR Platform is a multi-tenant SaaS HR ERP where autonomous AI agents handle administrative tasks — discipline, recruiting, onboarding, benefits, reviews, and coaching — so HR professionals can focus on people, not paperwork. Phase 1 delivers authentication, a marketing landing page, and the industry's first AI-powered employee discipline and counseling module, featuring a configurable policy engine that feeds company rules to AI agents for compliant, consistent HR execution.

**No competitor offers AI-powered discipline workflows.** This is our market entry point and competitive moat. The platform's core philosophy — "Let computers talk to computers. Let humans manage the human interactions." — addresses the finding that HR teams spend 57% of their time on manual administrative tasks (source: Lattice/Rippling research).

## 2. Problem Statement

### Current Situation

HR professionals at mid-to-large companies are drowning in administrative paperwork. The discipline and counseling process — one of the most legally sensitive HR functions — is handled manually via spreadsheets, generic document templates, and disconnected tools. There is no purpose-built platform for managing employee discipline workflows end-to-end.

### Customer Evidence

- HR partner confirmed this would solve "the majority of their daily problems"
- Top pain points: employee issues, handling recruitment requests, hirings, firings
- Industry average disciplinary processing time: 5-7 days (SHRM)
- HR teams spend 57% of their time on manual administrative tasks

### Competitive Gap

Research across 7+ competitors (Rippling, BambooHR, Workday, HiBob, Lattice, Personio, Gusto) reveals:
- **No competitor offers autonomous AI agents** — all use AI as chatbots or assistants only
- **No competitor has discipline-specific workflows** — some offer basic PIP functionality (Lattice), but none provide a comprehensive discipline management solution
- **Users consistently complain** about: hidden fees, clunky/outdated UIs, lack of customization, no discipline features, AI that's "just a chatbot wrapper"
- All competitors use light, bright, friendly UIs — our dark premium approach is a deliberate differentiator

### Business Impact

Without this platform: HR teams remain bogged down in admin tasks, compliance gaps create legal liability, response times on employee issues are slow (5-7 days), and managers lack real-time HR support. The market opportunity: $38B HR tech market growing at 7-8% CAGR, with AI-enabled solutions driving disproportionate growth.

## 3. Goals & Non-Goals

### Goals

| # | Goal | Metric | Target | Timeline |
|---|------|--------|--------|----------|
| G1 | Land first paying client | Active paid subscription | 1 client | 6 months |
| G2 | Reduce discipline processing time | Submission → signed document | < 48 hours (vs. 5-7 day industry avg) | Phase 1 |
| G3 | Achieve AI document quality | HR approval rate without modification | > 80% | Phase 1 |
| G4 | Drive manager adoption | Managers submitting ≥1 issue/month | > 70% of active managers | Month 3 post-launch |
| G5 | Employee portal engagement | Documents signed within 24 hours | > 90% | Phase 1 |
| G6 | Platform reliability | Uptime SLA | 99.9% | Ongoing |
| G7 | Zero compliance violations | Critical audit findings | 0 | Ongoing |

### Non-Goals

- **Phase 1 does NOT include:** Recruiting, onboarding orchestration, benefits management, performance reviews, coaching modules (these are Phase 2+)
- **Phase 1 does NOT include:** Embedded video conferencing (meetings use external links; AI handles documentation only)
- **Phase 1 does NOT include:** Native mobile apps (desktop + responsive web only)
- **Phase 1 does NOT include:** Light mode UI (dark-only for brand consistency)
- **Phase 1 does NOT include:** Payroll processing or integration
- **Phase 1 does NOT include:** Multi-language support (English only)

## 4. Target Users

### Primary Personas

**Persona 1: HR Agent (Power User)**
- *Role:* Day-to-day HR staff at client companies
- *Tech skill:* Medium-high. Comfortable with SaaS tools but not a developer.
- *Context:* Works at a desk, uses the platform daily, processes 5-20 disciplinary actions per month.
- *Primary goal:* Efficiently review AI-generated documents, approve/manage discipline workflows, maintain compliance.
- *Frustration:* Spending hours drafting documents that could be auto-generated. Manual tracking of progressive discipline histories. Fear of compliance gaps.
- *Quote:* "I just want to focus on the conversation with the employee, not the paperwork around it."

**Persona 2: Company Manager (Initiator)**
- *Role:* Team managers who need to report employee issues
- *Tech skill:* Medium. Uses email, Slack, basic project management tools.
- *Context:* Submits issues sporadically (1-3 per month). Needs "HR in their pocket."
- *Primary goal:* Quickly report employee issues and get HR support without navigating complex processes.
- *Frustration:* Not knowing what happens after they report an issue. Feeling like HR is a black box. Finding discipline conversations uncomfortable.
- *Quote:* "I just need HR to handle this — I don't want to become an HR expert."

**Persona 3: Employee (Signatory)**
- *Role:* Individual contributors receiving and signing documents
- *Tech skill:* Low-medium. Infrequent user, needs simple experience.
- *Context:* Logs in rarely (only when documents need signing). May be stressed or anxious about disciplinary documents.
- *Primary goal:* Understand what they're signing, sign quickly and easily, have the option to dispute if needed.
- *Frustration:* Confusing legal documents. Not understanding their rights. Feeling like a "punishment portal."
- *Quote:* "I just want to understand what this means and move on."

### Secondary Personas

**Persona 4: Company Admin / HR VP (Buyer)**
- *Role:* Decision maker who purchases the platform
- *Context:* Evaluates ROI, configures policies, manages team access
- *Primary goal:* Ensure compliance, reduce HR overhead, protect the company legally

**Persona 5: Super Admin (Platform Owner)**
- *Role:* The stakeholder, managing the platform itself
- *Context:* Manages all tenants, monitors platform health, configures global settings

## 5. User Flows

### Flow 1: Manager Submits Employee Issue (Primary Entry Point)

```
START: Manager clicks "Report Issue" from Dashboard or Employee detail
  │
  ▼
[Step 1] Select Employee + Issue Type
  → Searchable dropdown of direct reports only
  → Visual grid of incident types (tardiness, absence, insubordination, etc.)
  │
  ├─ Error: Employee not in direct reports
  │  → "You can only report issues for your direct reports."
  │
  ▼
[Step 2] Incident Details
  → Date (date picker, defaults today)
  → Severity selector with contextual descriptions
  → Description (rich text with guided prompts per type)
  │
  ├─ Validation: Required fields missing → inline errors
  │
  ▼
[Step 3] Evidence & Context
  → Attach evidence files (drag-drop, max 10MB each)
  → Add witnesses (employee picker)
  → Flag union involvement (toggle)
  │
  ├─ Error: File too large → "File exceeds 10MB limit"
  │
  ▼
[Step 4] Review & Submit
  → Summary of all entered data
  → Attestation checkbox: "I attest this report is truthful"
  → Submit → Confirmation with incident reference number
  │
  ▼
[Step 5] AI Evaluation (async, background)
  → AI loads company policy + employee history
  → Calculates confidence score
  │
  ├─ Confidence ≥ threshold → AI generates doc → HR Review queue
  ├─ Confidence < threshold → Manual HR Review queue
  └─ AI failure → Auto-escalate to manual HR Review
  │
END: Manager notified. Can track status from "My Reports."
```

### Flow 2: HR Agent Reviews AI Document

```
START: HR Agent receives notification of pending review
  │
  ▼
[Step 1] Open AI Document Review (three-panel layout)
  → LEFT: AI-generated document (editable, track changes)
  → CENTER: Employee history timeline + profile
  → RIGHT: Policy + AI reasoning ("Why this recommendation?")
  │
  ▼
[Step 2] Review AI Reasoning
  → Matched policy rule, confidence breakdown, what-if scenarios
  │
  ▼
[Step 3] Decision
  │
  ├─ APPROVE → Confirmation modal → Schedule meeting
  ├─ APPROVE WITH EDITS → Track changes logged → Schedule meeting
  ├─ REJECT → Mandatory reason → Options:
  │    ├─ "Regenerate with feedback" → AI regenerates
  │    ├─ "Escalate to legal" → Legal Hold
  │    └─ "Close without action" → Manager notified
  │
END: Document approved/rejected, next step initiated.
```

### Flow 3: Three-Way Meeting Management

```
START: Document approved → System prompts "Schedule Meeting"
  │
  ▼
[Step 1] Meeting Setup
  → AI-generated agenda (editable)
  → Participants auto-identified (employee, manager, HR rep)
  → Date/time + external meeting link (Zoom/Teams/Meet)
  │
  ▼
[Step 2] Send Invitations → Notifications to all participants
  │
  ▼
[Step 3] Meeting Occurs (external platform)
  → HR Agent takes notes in platform alongside
  │
  ▼
[Step 4] AI Summary Generation
  → HR inputs notes → AI generates structured summary
  → Key points, action items, deadlines, follow-up plan
  → HR reviews and finalizes
  │
END: Summary + document delivered to employee for signing.
```

### Flow 4: Employee Signs Document

```
START: Employee receives email + in-app notification
  │
  ▼
[Step 1] Employee Portal → Pending documents list
  │
  ▼
[Step 2] Document Review
  → Full document rendered in readable format
  → "View referenced policy" side panel
  │
  ▼
[Step 3] Decision
  │
  ├─ SIGN → Acknowledgment statement → Signature capture (draw/type)
  │    → Confirmation → Copy emailed → Audit trail recorded
  │
  ├─ DISPUTE (if enabled) → Must acknowledge receipt first
  │    → Dispute form (min 50 chars) → Sent to HR review queue
  │
  └─ NO ACTION → Reminders at 24h, 72h, 7d escalation
  │
END: Document signed or disputed.
```

### Flow 5: Company Admin Configures Policy

```
START: Admin navigates to Settings → Policies → "Create New Policy"
  │
  ▼
[Step 1] Choose Creation Method
  → AI Template / Upload Existing / Start from Scratch
  │
  ▼
[Step 2] Policy Builder — Basic Info
  → Title, category, effective date, full policy text (AI context)
  │
  ▼
[Step 3] Structured Rules (Key Step)
  → Visual rule builder: [TRIGGER] → [CONDITION] → [ACTION]
  → Escalation ladder visualization (Level 1-4+)
  → Drag-and-drop reorder, conflict detection
  │
  ▼
[Step 4] AI Settings
  → Confidence threshold (inherits company default or override)
  → Toggle: Auto-generate documents / Require HR approval / Allow disputes
  → Test panel: Input sample scenario, see AI response
  │
  ▼
[Step 5] Review & Activate
  → Summary + "How AI will interpret this" plain English preview
  → Active = AI uses for future incidents; Draft = not fed to AI
  │
END: Policy configured and feeding AI evaluation engine.
```

### Decision Points & Error States

| Decision Point | Paths | Recovery |
|----------------|-------|----------|
| AI confidence score | Above threshold → auto-generate / Below → manual review | HR can always override either direction |
| HR document review | Approve / Modify / Reject / Escalate | Rejection requires reason; escalation routes to legal |
| Employee signature | Sign / Dispute / No action | No action triggers escalation reminders |
| Policy conflict | AI detects conflicting rules | Admin must resolve before activation |

### Edge Case Flows

- **Empty state:** New company with no policies → AI cannot evaluate → all incidents require manual HR review
- **Loading state:** AI evaluation → "AI is analyzing the incident..." with animated indicator
- **Permission denied:** Employee tries to access HR tools → 403 with redirect to their portal
- **Session expiry:** Mid-form → data preserved via auto-save, redirect to login, return to previous state
- **AI provider down:** Graceful degradation → "AI analysis temporarily unavailable" → manual HR mode

## 6. Functional Requirements

### P0 — Must Have (Phase 1 MVP)

| ID | Requirement | Acceptance Criteria | Owner |
|----|------------|---------------------|-------|
| FR-001 | Multi-tenant authentication | Given a new user, when they sign up via email/password, Google SSO, or Microsoft SSO, then a company workspace is created and they are assigned the Company Admin role. Given an existing user, when they log in, then they see only their company's data. | Backend |
| FR-002 | Role-based access control (5 tiers) | Given a user with role X, when they navigate the platform, then they see only features and data permitted for their role. Super Admin: all tenants. Company Admin: own tenant config. HR Agent: own tenant HR tools. Manager: direct reports + issue submission. Employee: own documents only. | Backend |
| FR-003 | Configurable policy engine | **Given** a Company Admin with an active workspace, **when** they create or edit a policy defining rules (trigger: incident type, conditions: severity + history, actions: document type, escalation ladder: Level 1→4), **then** those rules are stored as structured JSONB and fed to the AI evaluation engine for all future incidents. **Given** a policy is updated, **when** a previously created incident exists, **then** that incident retains the policy version active at its creation time. **Given** a policy with conflicting rules, **when** the Admin attempts to activate it, **then** the system blocks activation and surfaces the conflict. | Backend + AI |
| FR-004 | AI autonomy threshold | **Given** a Company Admin navigating to Settings → AI Configuration, **when** they set a confidence threshold (range: 50-99%, default: 90%), **then** all subsequent AI evaluations compare their score against this threshold: ≥ threshold → auto-generate document and queue for HR approval; < threshold → route to HR manual review queue without document generation. **Given** the threshold is changed, **when** incidents are already in the pipeline, **then** existing evaluations retain their original threshold; only new evaluations use the updated value. | Backend + AI |
| FR-005 | Employee dispute toggle | **Given** a Company Admin navigating to Settings → Employee Options, **when** they enable the dispute toggle, **then** the employee document signing screen displays a "Dispute" button alongside "Sign." **Given** the dispute toggle is disabled, **when** an employee views a document, **then** the "Dispute" button is hidden and the employee can only Sign or take no action. **Given** the toggle state changes, **when** documents already pending signature exist, **then** their dispute availability reflects the setting at the time the document was delivered. | Backend |
| FR-006 | Issue submission by managers | **Given** a Manager with direct reports, **when** they submit an issue (type: tardiness, date: 2026-03-15, severity: medium, description: "Employee arrived 25 minutes late"), **then** the incident is created with status "ai_evaluating" and the AI evaluates it against active company policies. **Given** a Manager who selects an employee not in their direct reports, **when** they submit, **then** the submission is rejected with "You can only report issues for your direct reports." | Frontend + AI |
| FR-007 | AI-generated disciplinary documents | **Given** a reported incident with status "ai_evaluating" matching a policy violation, **when** the AI confidence score ≥ company threshold, **then** the system auto-generates a disciplinary document (type: verbal warning, written warning, PIP, or termination recommendation) containing: correct policy references with section numbers, employee name/details, incident specifics, required actions and deadlines, and a document content hash. **Given** an incident where AI confidence < threshold, **when** HR manually requests document generation, **then** the system generates the document with a flag indicating manual override. **Given** the AI cannot match any active policy, **when** evaluation completes, **then** the incident is routed to HR manual review with reason "No matching policy found." | AI |
| FR-008 | HR agent review and approval | **Given** an AI-generated document in the HR queue, **when** the HR Agent opens it, **then** a three-panel layout displays: LEFT (editable document with track-changes support), CENTER (employee history timeline + profile + prior incidents), RIGHT (AI reasoning: matched policy rule, confidence breakdown, alternative recommendations). **Given** the HR Agent clicks "Approve," **when** they confirm, **then** the document status changes to "approved" and the system prompts meeting scheduling. **Given** the HR Agent clicks "Approve with Edits," **when** they modify the document, **then** all changes are logged in audit trail with before/after snapshots and the meeting prompt appears. **Given** the HR Agent clicks "Reject," **when** the rejection modal appears, **then** a mandatory reason field (min 20 chars) must be completed and the Agent must choose: "Regenerate with feedback" (AI re-processes), "Escalate to legal" (incident flagged Legal Hold), or "Close without action" (manager notified). | Frontend + Backend |
| FR-009 | Three-way meeting management | **Given** an approved disciplinary action requiring a meeting, **when** the HR Agent clicks "Schedule Meeting," **then** the system auto-identifies participants (employee, reporting manager, HR Agent), generates an AI agenda (editable) with structured talking points from the matched policy, and presents date/time picker + external meeting link field (Zoom/Teams/Meet). **Given** the meeting is scheduled, **when** the HR Agent confirms, **then** invitations (email + in-app notification) are sent to all participants with the agenda, meeting link, and a reference to the incident. **Given** a meeting for a PIP or termination action, **when** the agenda is generated, **then** it includes mandatory sections: performance expectations, timeline, support resources, and consequences of non-improvement. | Frontend + Backend |
| FR-010 | AI meeting documentation | **Given** a meeting with status "completed" and HR Agent-entered notes, **when** the HR Agent clicks "Generate Summary," **then** AI produces a structured summary containing: key discussion points (numbered), agreed action items with owner + deadline, follow-up plan with next meeting date suggestion, and attendee confirmation of discussion. **Given** the AI-generated summary, **when** the HR Agent reviews it, **then** they can edit any section, add or remove action items, and finalize. **Given** the finalized summary, **when** the HR Agent clicks "Finalize," **then** it is attached to the disciplinary action record, delivered to the employee's pending documents, and the audit trail records the finalization event. | AI + Frontend |
| FR-011 | Employee document signing | **Given** an approved disciplinary document delivered to an employee's portal, **when** the employee opens it, **then** the full document is rendered in a readable format with a "View referenced policy" side panel. **Given** the employee clicks "Sign," **when** the signature capture modal appears, **then** they can choose canvas drawing (finger/mouse) or typed signature, and after signing an acknowledgment statement ("I acknowledge receipt and understanding of this document"), the signature is recorded with: IP address, timestamp, user agent string, and SHA-256 content hash of the signed document. **Given** a signed document, **when** any user views it, **then** the document content is immutable (append-only), and the audit trail displays all signature events. **Given** dispute capability is enabled, **when** the employee clicks "Dispute," **then** they must first acknowledge receipt, then complete a dispute form (min 50 chars) which routes to HR review queue. | Frontend + Backend |
| FR-012 | Disciplinary record tracking | **Given** a disciplinary action processed through the platform (submission → AI evaluation → HR approval → meeting → employee signature), **when** any authorized user views the employee's record, **then** the timeline displays: incident date, type, severity, reporting manager, AI-generated document content, meeting notes and summary, employee signature status, follow-up actions with owners and deadlines, linked policy with version, evidence attachments, witness names, union flag, and AI confidence score. **Given** an employee with zero prior incidents, **when** a new incident is reported, **then** the timeline shows a single entry. **Given** an employee with prior incidents, **when** a new incident is reported, **then** the timeline shows the full chronological history and the AI receives the count of prior incidents for escalation evaluation. | Backend |
| FR-014 | Custom e-signature engine | **Given** any HR document requiring signature (disciplinary document, meeting summary acknowledgment), **when** presented to a signer, **then** they can sign using: (a) canvas drawing with stroke data captured, or (b) typed signature using a selected font. **Given** a completed signature, **when** it is submitted, **then** the system records: signer ID and role, signature type (drawn/typed), signature data (image data or typed string), IP address, user agent, exact timestamp (UTC), and computes a SHA-256 hash of document content + signature data. **Given** a signed document, **when** any subsequent access occurs, **then** the system verifies the content hash matches and flags any tampering in the audit trail. **Given** a signed document, **when** a user with edit permissions attempts to modify it, **then** the modification is blocked (append-only after signature). | Frontend + Backend |
| FR-015 | Company workspace onboarding | **Given** a new Company Admin completing registration, **when** their workspace is created, **then** they are presented with a guided wizard: Step 1 (company info: name, industry, size, country, region), Step 2 (invite team: email invites for HR agents and managers), Step 3 (configure policies: choose from AI templates or upload existing, minimum 1 active policy required), Step 4 (AI settings: set confidence threshold, toggle dispute capability), Step 5 (review and activate). **Given** the wizard is partially completed, **when** the Admin leaves and returns, **then** they resume from the last incomplete step. **Given** onboarding is complete, **when** the Admin finishes, **then** `companies.onboarding_completed` is set to `true` and the full dashboard is unlocked. | Frontend + Backend |
| FR-016 | Progressive discipline tracking | **Given** an employee with 0 prior incidents of a given type, **when** a new incident is reported, **then** the AI recommends Level 1 action (e.g., verbal warning) per company policy escalation ladder. **Given** an employee with 1 prior verbal warning, **when** a second similar incident is reported, **then** the AI considers the escalation ladder and recommends Level 2 (e.g., written warning). **Given** an employee with prior PIP, **when** a new incident is reported, **then** the AI flags this as high severity and recommends termination review with a mandatory HR escalation regardless of confidence score. **Given** the AI generates a recommendation, **when** it references the escalation ladder, **then** the HR Agent sees the employee's full incident history in the review panel with prior actions highlighted. | AI + Backend |

### P1 — Should Have (Phase 2+)

| ID | Requirement | Acceptance Criteria | Owner |
|----|------------|---------------------|-------|
| FR-017 | AI recruitment — JD generation | Given a role specification, AI generates a complete JD based on industry standards and company requirements. | AI |
| FR-018 | AI recruitment — autonomous posting | Given an approved JD, AI posts to configured job boards without manual intervention. | AI + Backend |
| FR-019 | AI recruitment — candidate screening | Given incoming applications, AI screens, ranks, and filters candidates against job requirements. | AI |
| FR-020 | AI recruitment — interview scheduling | Given shortlisted candidates, AI coordinates availability and sends invitations. | AI + Backend |
| FR-021 | Onboarding orchestration | Given a "Hire" action, platform initiates: offer letter, ID/tax collection, Azure Entra ID account provisioning, onboarding document collection. | Backend + AI |
| FR-022 | AI benefits management | AI guides employees through plan selection, processes enrollment changes, tracks utilization. | AI + Frontend |
| FR-023 | AI performance reviews | AI generates review templates, collects 360 feedback, summarizes performance, suggests goals, flags flight risks. | AI + Frontend |
| FR-024 | Azure Entra ID integration | Platform provisions/deprovisions employee identities via Microsoft Graph API. | Backend |
| FR-025 | AI coaching and development | AI suggests development plans, training resources, and skill-building activities based on performance data. | AI |

### P2 — Nice to Have

| ID | Requirement | Acceptance Criteria | Owner |
|----|------------|---------------------|-------|
| FR-026 | Embedded video conferencing | Built-in video/audio for meetings with AI-assisted note-taking. | Frontend |
| FR-027 | Conversational HR assistant | Always-available AI chatbot for instant, policy-aware HR guidance. | AI + Frontend |
| FR-028 | Benefits analytics dashboard | Utilization metrics, cost trends, AI-generated cost-saving recommendations. | Frontend |
| FR-029 | Custom workflow builder | Visual builder for proprietary HR processes. | Frontend + Backend |

## 7. Non-Functional Requirements

| ID | Category | Requirement | Target | Source |
|----|----------|-------------|--------|--------|
| NFR-001 | Performance | Page load time (LCP) | < 2s desktop, < 3s mobile | Requirements |
| NFR-002 | Performance | API response time | < 500ms CRUD, < 5s AI generation | Requirements |
| NFR-003 | Performance | Mobile responsiveness | Functional on ≥ 375px width | Requirements |
| NFR-004 | Security | Authentication | Supabase Auth: email/password, Google SSO, Microsoft SSO, magic link | Requirements |
| NFR-005 | Security | Data encryption | AES-256 at rest (Supabase default + pgsodium column-level for PII/PHI), TLS 1.2+ in transit | Security Engineer |
| NFR-006 | Security | Audit logging | DB-level triggers on all sensitive tables. Append-only audit_log table. 7-year retention. Entries include: timestamp, user, action, before/after snapshot, IP, user agent. | Security Engineer |
| NFR-007 | Security | Multi-tenant isolation | RLS on every table. Tenant ID derived server-side (never from client). Automated cross-tenant test suite runs on every deployment. | Security Engineer + Architect |
| NFR-008 | Security | RBAC enforcement | Three layers: middleware (route), API dependency injection (endpoint), RLS (row). All must agree. | Security Engineer |
| NFR-009 | Security | AI prompt injection defense | Structured data payloads only (no free-text concatenation into system prompts). Server-side prompt templates. Output validation against rules engine. | Security Engineer |
| NFR-010 | Security | PII protection in AI calls | All PII stripped/pseudonymized before sending to AI providers. No SSN, salary, address, email leaves the system. | Security Engineer |
| NFR-011 | Security | Session management | Idle timeout: 15min admin, 30min employee. Absolute max: 8hr. Single-use refresh tokens. MFA required for admin/manager roles. | Security Engineer |
| NFR-012 | Compliance | SOC 2 Type II | Audit trails, access controls, encryption, change management, incident response plan. Design for compliance from day one. | Security Engineer |
| NFR-013 | Compliance | HIPAA | BAA with Supabase (Enterprise plan). PHI fields encrypted. Minimum necessary access. Break-glass procedure for emergency access. AI providers must not receive PHI. | Security Engineer |
| NFR-014 | Compliance | GDPR | Data subject rights (access, rectification, erasure with audit trail exemption, portability). Consent management. DPAs with all processors. | Security Engineer |
| NFR-015 | Compliance | CCPA | "Do Not Sell My Info" link. 12-month lookback disclosure. Contractual prohibition on AI providers using data for training. | Security Engineer |
| NFR-016 | Compliance | EEOC | AI bias monitoring. Quarterly disparate impact analysis (four-fifths rule). No protected characteristics as AI inputs. Annual third-party bias audit. | Security Engineer |
| NFR-017 | Availability | Uptime SLA | 99.9% target | Requirements |
| NFR-018 | Availability | Disaster recovery | Daily Supabase backups. RPO: 1 hour. RTO: 4 hours. Tested quarterly. | Architect |
| NFR-019 | Technology | Frontend | Next.js App Router + Aceternity UI + shadcn/ui + Playfair Display + EvilCharts + Tailwind CSS | Requirements |
| NFR-020 | Technology | Backend | Python FastAPI on Railway (separate from Vercel) | Architect |
| NFR-021 | Technology | Database | Supabase (PostgreSQL) with RLS for multi-tenancy | Requirements |
| NFR-022 | Technology | AI/LLM | Model-agnostic via Hugging Face + OpenRouter. Task-specific model selection. | Requirements |
| NFR-023 | Accessibility | WCAG compliance | Target Level AA. Keyboard navigation for all critical flows. Screen reader support. Color contrast ≥ 4.5:1. Focus rings on all interactive elements. Reduced motion support. | UX Designer |
| NFR-024 | Scalability | Multi-tenancy | Unlimited company workspaces with strict data isolation | Requirements |
| NFR-025 | Performance | API rate limiting | Standard endpoints: 100 req/min per user. AI endpoints: 20 req/min per user. Auth endpoints: 10 req/min per IP (brute-force protection). Rate limit headers (X-RateLimit-Remaining) in all responses. 429 response with Retry-After header when exceeded. | Security Engineer |
| NFR-026 | Performance | AI cost control | Per-tenant monthly AI spend cap (default $50/mo, configurable). Alert at 80% consumption. Graceful degradation at 100% (see Section 17). Per-request cost logging to audit trail. | Data Analyst + Architect |

## 8. Data Model

### Entities & Attributes

**11 Phase 1 Tables** (9 original from REQUIREMENTS.md + 2 additions from Architect):

| Entity | Key Attributes | Purpose |
|--------|---------------|---------|
| **companies** | id, name, industry, size, country, region, subscription_tier, settings (JSONB: AI threshold, dispute toggle, notification prefs), onboarding_completed | Tenant root. Settings drive AI behavior. |
| **departments** | id, company_id, name, head_id | Organizational structure |
| **users** | id (Supabase Auth), company_id, department_id, role, first_name, last_name, email, phone, job_title, avatar_url, manager_id, status, hire_date, termination_date, last_login_at | All user types in one table, differentiated by role enum |
| **policies** | id, company_id, category, title, summary, content, rules (JSONB), severity_levels (JSONB), is_active, version, effective_date, expiry_date, created_by | AI context + structured rules for evaluation |
| **incidents** | id, company_id, employee_id, reported_by, type, description, incident_date, severity, evidence_attachments (JSONB), witness_ids, union_involved, status, ai_confidence_score, ai_recommendation (JSONB), linked_policy_id, previous_incident_count, escalation_level | Core discipline entity. Status drives workflow. |
| **disciplinary_actions** | id, incident_id, company_id, employee_id, action_type, document_content, document_id, approved_by, approved_at, follow_up_actions (JSONB), resolved_at | The disciplinary outcome linked to incident |
| **meetings** | id, disciplinary_action_id, company_id, type, agenda, scheduled_at, duration_minutes, participants, meeting_link, notes, ai_summary, action_items (JSONB), outcome, status | Three-way meeting lifecycle |
| **documents** | id, company_id, type, title, content, content_hash, file_url, created_by, status, version | All HR documents with tamper evidence |
| **signatures** | id, document_id, signer_id, signer_role, signature_type, signature_data, ip_address, user_agent, signed_at, dispute, dispute_reason | E-signature audit trail |
| **audit_log** *(NEW)* | id, company_id, user_id, action, entity_type, entity_id, details (JSONB), ip_address, user_agent, created_at | Append-only compliance log. 7-year retention. |
| **notifications** *(NEW)* | id, company_id, user_id, type, title, message, entity_type, entity_id, read, created_at | In-app notification tracking |

### Entity Relationship Diagram

```
Company 1:N Department
Company 1:N User
Company 1:N Policy
Company 1:N Document
Company 1:N Notification
Company 1:N AuditLog
Department 1:N User
User (Manager) 1:N User (Employee) [via manager_id]
User 1:N Incident [as employee]
User 1:N Incident [as reporter]
Policy 1:N Incident [via linked_policy_id]
Incident 1:1 DisciplinaryAction
DisciplinaryAction 1:N Meeting
DisciplinaryAction 1:1 Document
Document 1:N Signature
User 1:N Signature [as signer]
```

### Data Volumes

- Phase 1: 1-10 client companies, 50-500 employees each
- Year 1 target: 100 companies, 50,000 total employees
- Documents: ~10 per employee per year
- Concurrent users: 50-100 (Phase 1) → 5,000+ (Year 1)

### Key Indexes (from Architect)

- All `company_id` columns indexed for tenant isolation
- `incidents(company_id, status, created_at DESC)` for queue views
- `incidents(company_id, employee_id, incident_date DESC)` for employee history
- `policies(company_id, category, is_active) WHERE is_active = true` for AI lookup
- `notifications(user_id, read, created_at DESC) WHERE read = false` for unread count
- `audit_log(company_id, created_at DESC)` for compliance queries

### Database Migration Strategy

**Tool:** Supabase CLI with versioned SQL migration files (`supabase/migrations/YYYYMMDD_description.sql`). Each migration is numbered, immutable after merge, and runs in a transaction.

**Process:**
1. All schema changes require a migration file (no manual DB edits)
2. Migrations are reviewed in PR (RLS policy changes require Security Engineer approval)
3. `supabase db push` for staging; `supabase db push --linked` for production
4. Backward-compatible changes only: additive columns (nullable or with defaults), new tables, new indexes
5. Destructive changes (column drops, type changes) require a two-release migration: add new → migrate data → drop old
6. Seed data (AI policy templates, default settings) versioned alongside migrations
7. Migration testing: every migration runs against a snapshot of production data in CI before deploy

## 9. API Surface

### Endpoints Overview

| Domain | Endpoints | Auth | Min Role |
|--------|-----------|------|----------|
| **Auth** | POST register, POST login, POST logout, GET session, GET/POST SSO Google/Microsoft, GET callback | Public/Mixed | Varies |
| **Companies** | GET /me, PATCH /me, POST /me/onboarding | Required | employee / company_admin |
| **Users** | GET list, GET :id, POST invite, PATCH :id, DELETE :id, POST import, GET :id/timeline | Required | manager / hr_agent |
| **Policies** | GET list, GET :id, POST create, PUT update, PATCH toggle, DELETE | Required | manager (read) / company_admin (write) |
| **Incidents** | GET list, GET :id, POST create, PATCH :id/status | Required | manager (create own reports) / hr_agent (all) |
| **Discipline** | GET list, GET :id, POST review/:id (approve/reject), POST regenerate/:id | Required | hr_agent |
| **Meetings** | GET list, GET :id, POST create, PATCH :id (notes/summary), POST generate-agenda, POST generate-summary | Required | hr_agent |
| **Documents** | GET list, GET :id, POST generate, GET :id/pdf | Required | hr_agent (manage) / employee (own) |
| **Signatures** | POST create (sign), POST dispute/:id | Required | employee (own docs) |
| **AI** | POST evaluate-incident, POST generate-document, POST generate-agenda, POST summarize-meeting, GET health | Required (proxied) | hr_agent |

**API Design Principles:**
- BFF pattern: Browser → Next.js API Routes → Python AI service
- Versioned: `/api/v1/*`
- Cursor-based pagination for large collections
- Consistent error format: `{ error: { code, message, details[] } }`
- Tenant ID always derived server-side from session, never from request params

### API Contract Documentation

**Format:** OpenAPI 3.1 specification auto-generated from Python FastAPI type hints (backend) and Zod schemas (frontend). Living documentation via Swagger UI at `/docs` (staging only).

**Key Endpoint Example — POST /api/v1/incidents (Manager submits issue):**

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    employee_id: UUID (required, must be direct report),
    type: enum<tardiness|absence|insubordination|performance|misconduct|other> (required),
    incident_date: ISO 8601 date (required, ≤ today),
    severity: enum<low|medium|high|critical> (required),
    description: string (required, 10-2000 chars),
    evidence_attachments?: [{ name: string, url: string, size_bytes: number }],
    witness_ids?: UUID[],
    union_involved?: boolean
  }
  
Response 201:
  { incident: { id, status: "ai_evaluating", reference_number, created_at } }
  
Response 400: { error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }
Response 403: { error: { code: "NOT_DIRECT_REPORT", message: "You can only report issues for your direct reports." } }
```

**Contract Testing:** pactum.js or schemathesis runs in CI against live staging API on every PR. Contracts are the source of truth — frontend generates types from OpenAPI spec.

## 10. Architecture Overview

### System Components

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser    │────▶│  Next.js (Vercel)│────▶│  Supabase    │
│   Mobile     │     │  - SSR/RSC       │     │  - PostgreSQL│
│              │     │  - API BFF       │     │  - Auth      │
│              │     │  - Middleware     │     │  - Storage   │
│              │     │       │          │     │  - Edge Fn   │
│              │     │       │ HTTP     │     └──────────────┘
│              │     │       ▼          │
│              │     │  ┌──────────┐   │     ┌──────────────┐
│              │     │  │ Python   │   │     │ AI Providers │
│              │     │  │ FastAPI  │───┼────▶│ - HuggingFace│
│              │     │  │ (Railway)│   │     │ - OpenRouter │
│              │     │  └──────────┘   │     └──────────────┘
│              │     │                  │
│              │     │  ┌──────────┐   │     ┌──────────────┐
│              │     │  │ Email    │   │     │ SSO Providers│
│              │     │  │ (Resend) │   │     │ - Google     │
│              │     │  └──────────┘   │     │ - Microsoft  │
└─────────────┘     └─────────────────┘     └──────────────┘
```

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js App Router | SSR/RSC, API routes as BFF, Vercel-native |
| UI primitives | shadcn/ui | Accessible, composable, customizable for dark theme |
| UI showcase | Aceternity UI | Animated components for landing page and visual impact |
| Charts | EvilCharts | Per stakeholder requirement. Fallback: Recharts if insufficient. |
| Backend | Python FastAPI on Railway | Python required for AI; can't run on Vercel; Railway for simple deploy |
| Database | Supabase (PostgreSQL) | Auth, RLS, Storage, Edge Functions, Realtime in one service |
| AI routing | Model-agnostic (HF + OpenRouter) | Cost optimization, provider flexibility, open-source preference |
| State management | TanStack Query + Zustand | Server state via TQ, minimal client state via Zustand |
| Forms | React Hook Form + Zod | Type-safe validation; Zod schemas shared client/server |
| Testing | Vitest + Playwright + pytest | Fast unit tests, real-browser E2E, Python service tests |

### Python AI Service (4 Core Endpoints)

| Endpoint | Input | Output |
|----------|-------|--------|
| POST /evaluate-incident | Incident + employee history + company policies | Confidence score + recommendation + reasoning |
| POST /generate-document | Action type + incident + employee + policy references | Generated document content |
| POST /generate-agenda | Meeting type + incident + participants + policies | Structured agenda with talking points |
| POST /summarize-meeting | Meeting type + notes + participants + action items | Structured summary + action items + follow-up plan |

## 11. Design Specifications

### Visual Direction

- **Style:** Dark, premium, sophisticated. "Executive command center, not a time tracker."
- **Brand message:** "An HR ERP that's AI-Based. Let computers talk to computers."
- **Emotional tone:** Professional yet modern. Serious for discipline content, warm for CTAs and positive outcomes.
- **Color palette:**
  - Dark Slate Grey (#111e22): page bg, sidebar
  - Slate Grey (#223d44): card bg, elevated surfaces
  - Vanilla Custard (#ffd900): primary CTA, accent, links, active states
  - Honey Bronze (#db9224): secondary accent, badges, pending states
  - Brown Red (#c93638): alerts, medium severity
  - Night Bordeaux (#e21d24): danger, critical, destructive actions
  - Success (#22c55e): completed actions, signed status
- **Typography:** Playfair Display (serif) for headings. System sans-serif for body.
- **Dark-only for Phase 1.** No light mode.

### Component Inventory (Phase 1)

| Category | Components | Count |
|----------|-----------|-------|
| Layout | Shell, Sidebar, Header, Footer, Page Container | 5 |
| Navigation | Sidebar Nav Item, Breadcrumb, Tabs, Pagination | 4 |
| Forms | Text Input, Textarea, Select, Multi-Select, Date Picker, Time Picker, File Upload, Toggle, Radio, Checkbox, Form Field | 11 |
| Data Display | Table, Card, List, Timeline, Badge, Avatar, Stat Card, Document Preview | 8 |
| Feedback | Toast, Alert, Modal, Drawer, Skeleton, Empty State, Error State, Progress Bar, AI Processing Indicator | 9 |
| Actions | Button (primary/secondary/ghost/danger), Dropdown Menu, Context Menu, Link Button | 4 |
| Domain-Specific | E-Signature Canvas, Document Viewer, AI Confidence Indicator, Policy Rule Editor, Incident Severity Badge, Meeting Participant List, Meeting Agenda, Employee Disciplinary Summary, Notification Bell, Policy Reference Link, Form Step Indicator | 11 |
| **Total** | | **52** |

### Responsive Breakpoints

| Breakpoint | Width | Sidebar | Layout |
|-----------|-------|---------|--------|
| Desktop (primary) | ≥1280px | Expanded 240px | Full grid |
| Laptop | 1024-1279px | Collapsed 64px | Adapted grid |
| Tablet | 768-1023px | Hidden (drawer) | Stacked |
| Mobile | <768px | Hidden (drawer) | Single column, card lists |

### Key Screens (11 total)

1. Landing Page (marketing)
2. Login/Signup (auth)
3. Dashboard Home (role-adaptive)
4. Policy Builder (Company Admin)
5. Report Issue Form (Manager, multi-step)
6. Incident Queue (HR Agent)
7. AI Document Review (HR Agent, three-panel)
8. Meeting Scheduler (HR Agent)
9. Meeting Summary (AI-generated, editable)
10. Employee Portal — Pending Documents
11. Document Signing (with e-signature canvas)

## 12. Security & Compliance

### Threat Model Summary (STRIDE)

| Category | Top Threat | Risk | Mitigation |
|----------|-----------|------|------------|
| **Spoofing** | Session token theft via XSS | High | HttpOnly cookies, CSP headers, HSTS, token rotation |
| **Tampering** | Post-signature document modification | High | Cryptographic hash chain, immutable audit log, version control |
| **Repudiation** | Manager denies issuing disciplinary action | High | E-signature bound to auth session, tamper-evident audit trail, 7-year retention |
| **Info Disclosure** | Multi-tenant data leakage via RLS bypass | **Critical** | Automated cross-tenant test suite on every deployment, RLS on every table, server-side tenant derivation |
| **Info Disclosure** | PII sent to AI providers | High | PII stripping/pseudonymization before all AI API calls, contractual zero-data-retention |
| **Denial of Service** | AI endpoint flooding, cost exhaustion | High | Per-user rate limiting, per-tenant cost caps, queue-based processing |
| **Elevation of Privilege** | Client-side role manipulation | High | Role stored server-side, validated from DB on every request, never from JWT alone |

### Authentication & Authorization

- **Auth:** Supabase Auth as sole provider. Email/password + Google SSO + Microsoft SSO + magic link.
- **MFA:** Required for admin and manager roles. TOTP via Supabase Auth.
- **Session:** HttpOnly, Secure, SameSite=Strict cookies. Single-use refresh tokens.
- **RBAC:** 5 tiers enforced at 3 layers (middleware, API, RLS).
- **Tenant isolation:** Tenant ID from authenticated user profile (server-side), never from request params.

### Data Protection

- **Classification:** Public → Internal → Confidential → Restricted (SSN, salary, PHI, signatures)
- **Encryption:** AES-256 at rest (Supabase + pgsodium column-level for Restricted fields), TLS 1.2+ in transit
- **PII handling:** Minimize collection, mask in UI (SSN: `***-**-1234`), no PII in URLs/logs/error messages, no PII to AI providers
- **Retention:** Disciplinary records 7 years post-termination. Audit log 7 years. AI logs 3 years.

### Compliance Matrix

| Framework | Key Requirements | Status |
|-----------|-----------------|--------|
| SOC 2 Type II | Audit trails, access controls, encryption, change management, incident response | Design for compliance |
| HIPAA | BAA with Supabase, PHI encryption, minimum necessary access, break-glass procedure | Requires Supabase Enterprise + BAA |
| GDPR | Data subject rights, consent management, DPAs, right to erasure (with audit trail exemption) | Architectural support in Phase 1 |
| CCPA | "Do Not Sell" link, data disclosure, opt-out, no AI training on our data | Contractual with AI providers |
| EEOC | No protected characteristics as AI inputs, disparate impact analysis, human oversight on all AI decisions | AI bias monitoring from Phase 1 |

## 13. Analytics & Success Metrics

### North Star Metric

**Disciplinary Actions Completed End-to-End via AI** — Actions that travel the full pipeline (submission → AI evaluation → HR approval → meeting → employee signature) without leaving the platform.

Target: ≥10/month by Month 4; ≥50/month by Month 6.

### Primary KPIs

| # | Metric | Target | Concern Threshold |
|---|--------|--------|--------------------|
| P1 | Paying clients | 1 by Month 6 | 0 by Month 5 |
| P2 | Disciplinary processing time | < 48 hours median | > 96 hours |
| P3 | AI document approval rate | > 80% unmodified | < 60% |
| P4 | Manager issue submission rate | > 70% monthly | < 40% |
| P5 | Employee signature speed | > 90% within 24h | < 70% |
| P6 | Platform uptime | 99.9% | < 99.5% |
| P7 | Landing page → signup conversion | ≥ 3% | < 1% |

### Guardrail Metrics

| Metric | Hard Threshold | Escalation |
|--------|---------------|------------|
| Cross-tenant access attempts | > 0 in 24h | Immediate alert to Super Admin |
| Audit log completeness | < 99% | Engineering investigation within 4h |
| API error rate (5xx) | > 1% sustained 15min | Auto-alert; page if > 5% |
| E-signature tampering | > 0 | Immediate freeze + forensic review |

### Tracking Plan Summary

~80 events across 8 domains: Auth & Onboarding, Landing Page, Policy Management, Incident Management, AI Operations, Meetings, Documents & Signing, System & Infrastructure. Full tracking plan in Analytics Analyst deliverable.

### Dashboards

1. **Super Admin:** Platform command center (all tenants, health, AI performance, security events, revenue pipeline)
2. **Company Admin:** HR operations overview (incident pipeline, manager adoption, AI trust score, policy coverage)
3. **HR Agent:** Personal work queue (pending reviews, upcoming meetings, awaiting signatures, follow-up actions)

## 14. Test Strategy

### Test Pyramid

| Level | Coverage | Tools | Est. Count |
|-------|----------|-------|------------|
| Unit Tests (65%) | Business logic, validation, AI prompts, RBAC, hashing | Vitest + pytest | ~250-300 |
| Integration Tests (20%) | API contracts, RLS verification, AI integration, SSO, email | pytest + httpx + testcontainers | ~80-100 |
| E2E Tests (10%) | Critical user journeys (5-8 flows) | Playwright | ~30-40 |
| Manual/Exploratory (5%) | Accessibility, compliance, AI quality, penetration testing | Manual + axe-core + external pentest | Ongoing |

### Critical Test Scenarios (P0 — Ship Blockers)

1. **Multi-tenant data isolation** — Cross-tenant access attempts blocked at API and RLS level
2. **Authentication all methods** — Email/password, Google, Microsoft, token lifecycle
3. **RBAC enforcement** — Every role × every endpoint (~50 combinations)
4. **AI document accuracy** — ≥95% on golden dataset, 0% fabricated outputs
5. **E-signature audit trail integrity** — Append-only, tamper-evident, hash verification
6. **Data encryption** — At rest and in transit, zero plaintext PII

### Quality Gates

| Gate | Criteria | Approver |
|------|----------|----------|
| Feature Complete | All P0 FRs implemented, P0 tests passing, no P0 bugs | Engineering Lead + QA Lead |
| Integration Ready | API contracts tested, AI service tested, RLS verified, SSO tested | QA Lead |
| Production Ready | Security review passed, multi-tenancy verified, performance met, accessibility passed, no P0/P1 bugs | QA Lead + PM |
| Launch Approved | UAT sign-off, monitoring configured, rollback plan tested, incident runbook ready | PM (final) |

### AI-Specific Testing

- **Golden dataset:** 50+ curated incident scenarios across 8 categories
- **Accuracy target:** ≥95% exact match or reasonable alternative. 0% fabricated. 0% unsafe.
- **Bias testing:** Diverse employee profiles, no protected characteristics in AI inputs
- **Prompt injection resistance:** Dedicated test suite for extraction, override, exfiltration, XSS attempts

## 15. Competitive Positioning

### Our Differentiation

| Factor | Our Platform | Competitors |
|--------|-------------|-------------|
| **AI approach** | Autonomous agents that execute multi-step workflows | Chatbots and assistants that suggest but don't act |
| **Discipline workflows** | Purpose-built, AI-powered, end-to-end | Non-existent. Manual spreadsheets or basic PIP at best. |
| **Policy engine** | Configurable rules feeding AI for consistent enforcement | Static policy documents, manual interpretation |
| **E-signature** | Custom-built, integrated, with full audit trail | Third-party integration or not available |
| **UI** | Dark, premium, sophisticated | Light, bright, generic |
| **Philosophy** | "Let computers talk to computers" | "AI helps you work faster" |

### Competitive Advantages

1. **First-mover in AI discipline workflows** — No competitor offers this. "Discipline as a Service" is a new category.
2. **Configurable policy engine** — Feeds company-specific rules to AI agents, enabling proactive compliance.
3. **Dark premium UI** — Stands out in a market of generic, light-themed HR tools.
4. **Custom e-signature** — Part of value prop, reduces third-party dependency.
5. **Autonomous + assistive** — AI acts above threshold, escalates below. Humans always in the loop for critical decisions.

### Competitive Gaps to Address

- **Brand trust:** Competitors have years of market presence. We need strong social proof and case studies.
- **Feature breadth:** Competitors offer full HR suites. We start with one module. Must communicate roadmap clearly.
- **Integration depth:** Competitors have deep integrations. We start with fewer but focus on quality.

## 16. Technical Risks & Spikes

| Risk | Probability | Impact | Mitigation | Spike Needed |
|------|------------|--------|------------|--------------|
| Python hosting architecture unclear | Certain | Critical | Decision: Railway for Phase 1. ADR-0001 to document. | ✅ Python hosting spike (1 day) |
| Custom e-signature legal validity | High | Critical | Implement ESIGN Act + UETA requirements. Legal review before launch. Fallback: integrate DocuSign. | ✅ E-signature spike (2 days) |
| Multi-tenant RLS complexity | High | Critical | Automated cross-tenant test suite. RLS review as required code-review gate. | ✅ RLS spike with test fixtures (2 days) |
| AI confidence scoring reliability | Medium | Critical | Default conservative (90%). Monitor HR override rate. Log all scores. | ✅ AI accuracy benchmark with 50+ scenarios (3 days) |
| EvilCharts compatibility with Next.js App Router | Medium | Medium | Early evaluation. Fallback: Recharts. | ✅ EvilCharts spike (1 day) |
| AI provider reliability | Medium | High | Retry logic, fallback provider chain, circuit breaker. | ✅ AI provider fallback architecture (1 day) |
| Supabase free tier limits | Medium | Medium | Monitor weekly. Plan for Pro tier before first paying client. | No spike — operational monitoring |

## 17. Rollout Plan

### Phase 1 — MVP (Weeks 1-5)

**Scope:** Auth + Landing Page + Discipline/Counseling Module

```
Week 1: Foundation
├── Next.js project setup (config, Tailwind theme, Playfair, design tokens)
├── Supabase project creation + initial migrations (11 tables + RLS)
├── Auth setup (email/password + Google SSO)
├── Middleware for route protection + RBAC
├── Dashboard shell layout (sidebar, header)
└── Landing page (hero, features, CTA)

Week 2: Core Module — Incidents & Policies
├── Policy CRUD (Company Admin creates policies)
├── Incident submission form (Manager flow, multi-step)
├── Employee list/detail views
└── Incident list/detail views (HR Agent queue)

Week 3: AI Integration
├── Python FastAPI service scaffold + deploy to Railway
├── AI router (HuggingFace + OpenRouter abstraction)
├── Policy engine (interpret rules → structured output)
├── Endpoints: evaluate-incident, generate-document, generate-agenda, summarize-meeting
└── Confidence scorer + validation pipeline

Week 4: Document & Signing Flow
├── AI-generated document review UI (three-panel)
├── Meeting scheduling + AI agenda UI
├── Meeting notes + AI summary UI
├── Document delivery to employee portal
├── E-signature canvas component (draw + type)
├── Signature audit trail (IP, timestamp, hash)
└── Dispute flow (if enabled)

Week 5: Polish & Ship
├── Email notifications (Supabase Edge Functions + Resend)
├── Audit logging (DB triggers + application-level)
├── Microsoft SSO (Azure Entra ID)
├── Company onboarding wizard
├── Employee CSV import
├── Responsive design pass
├── E2E tests for critical flows
└── Deploy to production
```

### Phase 2 — Enhancement (Weeks 6-12)

- Recruitment module (JD generation, posting, screening, scheduling)
- Onboarding orchestration (Azure Entra ID integration)
- Performance reviews + AI coaching
- Benefits management
- Enhanced meeting features (embedded video exploration)
- Billing/subscription system

### Feature Flag & Gradual Rollout Strategy

**Implementation:** Custom feature flags stored in `companies.settings` JSONB column (key: `feature_flags`). No third-party service required for Phase 1 scale. Each flag: `{ flag_name: { enabled: boolean, enabled_for_users: uuid[] | null, enabled_percentage: number | null } }`.

**Phase 1 Flags:**

| Flag | Purpose | Default | Rollout |
|------|---------|---------|---------|
| `ai_auto_generate` | AI autonomous document generation | `false` | Enable after HR partner validates AI quality (≥80% approval rate on golden dataset) |
| `ai_meeting_summary` | AI-generated meeting summaries | `false` | Enable after manual note-taking is stable |
| `employee_dispute` | Employee dispute submission | `true` | Per-company via FR-005 toggle |
| `microsoft_sso` | Microsoft SSO login | `false` | Enable Week 5 after Google SSO is validated |
| `e_signature_v2` | Typed signature option | `false` | Enable after canvas-only signature is validated |

**Gradual Rollout Plan (for AI features specifically):**

1. **Week 3 (internal):** AI endpoints deployed to staging. HR partner tests with real scenarios. All results logged.
2. **Week 4 (pilot):** `ai_auto_generate` enabled for HR partner's company only. All AI-generated documents require HR approval regardless of confidence score (belt-and-suspenders mode).
3. **Week 5 (expanded pilot):** If AI approval rate ≥80% on pilot data, enable `ai_auto_generate` for all companies but require approval for all documents. Confidence-based autonomy remains disabled.
4. **Month 2 (autonomous):** If sustained ≥85% approval rate, enable confidence-based autonomy (above threshold → auto-generate, below → manual). Monitor daily for first 2 weeks.

**Dark Launch:** All AI features will be deployed to production infrastructure behind feature flags before external access is granted. This validates deployment, networking, and infrastructure without user exposure.

### AI Cost Controls

**Per-Tenant Budget:** Each tenant has a monthly AI spend cap stored in `companies.settings.ai_monthly_budget_usd` (default: $50/month). When 80% of budget is consumed, the Super Admin receives an alert. At 100%, AI features degrade gracefully (see degradation mode below) and new AI requests are queued until the next billing cycle or the cap is increased.

**Per-Request Cost Tracking:** Each AI API call logs token count, model used, and estimated cost to `audit_log` with `entity_type = 'ai_cost'`. Daily aggregation per tenant available on Super Admin dashboard.

**Cost Optimization Rules:**
- Incident evaluation: use cheapest capable model first (e.g., Llama 3 8B); escalate to larger model only if confidence < 70%
- Document generation: always use capable model (quality-critical)
- Meeting summaries: use mid-tier model (acceptable quality at lower cost)
- Agenda generation: use cheapest capable model

### AI Service Degradation Mode

When the Python AI service is unavailable or a tenant's cost cap is reached, the platform degrades gracefully:

| Scenario | Behavior | User Experience |
|----------|----------|-----------------|
| AI service down (transient) | Retry with exponential backoff (3 attempts, 2s/4s/8s). If all fail, route to manual queue. | Manager: "Your report has been submitted. HR will review it manually." HR: Incident appears in manual review queue with "AI unavailable" badge. |
| AI service down (sustained >5min) | Circuit breaker opens. All new incidents route directly to HR manual queue. | Platform status banner: "AI analysis is temporarily unavailable. All incidents will be handled manually by your HR team." |
| Tenant cost cap reached | AI features disabled for tenant. Manual workflows fully functional. | HR Agent sees: "AI budget reached for this billing cycle. All submissions will require manual processing." |
| AI provider rate-limited | Queue-based processing with backoff. FIFO order preserved. | Manager: "Your report is being processed. This may take longer than usual." |
| AI returns invalid/unsafe output | Output discarded. Incident routed to HR manual review. Error logged with full prompt/output for debugging. | HR: Incident appears with "AI evaluation failed — manual review required" badge. |

**Recovery:** All degradation modes auto-recover. Circuit breaker resets after 30s probe. Cost cap resets monthly. Rate limits clear per provider policy. HR agents are notified when AI service resumes.

### Phase 3 — Scale (Months 4-12)

- Enterprise features (SAML SSO, custom roles, audit log export)
- Multi-language support
- Advanced analytics/reporting
- Public API for third-party integrations
- Mobile app consideration
- SOC 2 Type II certification pursuit

## 18. Open Questions

| # | Question | Impact | Resolution Needed By |
|---|----------|--------|---------------------|
| 1 | E-signature legal validation — has a lawyer confirmed custom engine enforceability under ESIGN/UETA? | High: may need to integrate DocuSign instead | Before e-signature development |
| 2 | Which specific open-source model(s) should power Phase 1 AI? (Llama 3, Mistral, Mixtral?) | Medium: affects quality and cost | Before AI service development |
| 3 | Python backend on Vercel clarification — confirmed separate service on Railway? | Medium: architecture decision | Before any Python code |
| 4 | Data residency requirements for target clients? | Medium: Supabase region selection | Before first client |
| 5 | Policy engine: flat rules or conditional logic (jurisdiction-based)? | Medium: affects policy builder complexity | During policy builder design |
| 6 | Notification channels beyond email? (SMS, Slack, Teams) | Low: Phase 1 email-only is fine | Phase 2 planning |
| 7 | Employee dispute resolution workflow after HR receives dispute? | Medium: affects dispute flow design | During discipline module development |
| 8 | Multi-language support timeline? | Low: English-only for Phase 1 | Phase 2 planning |
| 9 | Billing model? (PEPM, flat rate, freemium?) | Medium: affects data model and landing page | Before first paying client |
| 10 | HR partner availability for workflow validation? | High: domain expertise critical | Immediately |

## 19. Appendix

### A. Research Summary

Full competitive analysis in `RESEARCH.md`. Key findings:
- 7+ competitors analyzed (Rippling, BambooHR, Workday, HiBob, Lattice, Personio, Gusto)
- No competitor offers autonomous AI agents or discipline workflows
- Market size: $38B growing at 7-8% CAGR
- Users want: automation, clean UI, self-service portals, transparent pricing
- Users hate: hidden fees, clunky UIs, lack of customization, AI that's just a chatbot
- Our entry: "Discipline as a Service" — a new category

### B. Codebase Assessment

Full assessment in `CODE_SCOUT.md`. Key findings:
- Greenfield project — zero code exists
- Python can't run on Vercel — needs Railway or similar
- 11 database tables with RLS needed
- Recommended build order: 5-week sprint plan documented
- Tailwind theme configuration documented with full color palette

### C. Team Input Sources

| Discipline | Subagent | Key Contributions |
|-----------|----------|-------------------|
| UX Design | @product-ux-designer | 5 complete user flows with error paths, 12 wireframe descriptions, full information architecture, usability considerations for sensitive discipline content |
| Architecture | @product-system-architect | System architecture diagram, 11-table data model with SQL schemas, 50+ API endpoints, RLS policy patterns, AI service API contracts, index strategy |
| Security | @product-security-engineer | STRIDE threat model (24 threats), 40+ security requirements, compliance analysis (HIPAA/GDPR/CCPA/SOC2/EEOC), auth design, AI-specific security controls |
| Analytics | @product-data-analyst | North Star metric, 7 primary KPIs, 10 secondary KPIs, 7 guardrail metrics, ~80 event tracking plan, 3 dashboard specifications, AI performance metrics |
| QA | @product-qa-lead | Test pyramid (460+ tests), 6 P0 scenarios, 7 P1 scenarios, 5 P2 scenarios, 4 quality gates, AI golden dataset approach, multi-tenancy test matrix |
| UI Design | @product-ui-designer | Full Tailwind theme config, 52-component inventory, responsive strategy, 11 screen specifications with color/typography tokens, animation philosophy |
