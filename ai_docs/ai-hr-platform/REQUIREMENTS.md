# AI HR Platform — Requirements Document

> Generated from stakeholder interview on 2026-03-29
> Confidence Score: 94%

## 1. Executive Summary

The AI HR Platform is a multi-tenant SaaS HR ERP system where AI agents autonomously handle administrative tasks — recruiting, onboarding, discipline, benefits, reviews, and coaching — freeing HR professionals to focus on human interactions, not paperwork. The platform features a configurable policy engine that feeds company rules to AI agents, ensuring compliant and consistent HR execution. Phase 1 delivers authentication, a marketing landing page, and the employee discipline and counseling module.

## 2. Problem Statement

HR professionals spend the majority of their time on administrative paperwork — drafting documents, tracking compliance, managing candidate pipelines, processing enrollments — instead of engaging with people. Existing HR solutions are workflow tools that still require humans to push every button. The AI HR Platform lets computers talk to computers, with AI agents autonomously executing HR workflows within configurable policy guardrails, so humans can focus on the human side of HR.

**Evidence:** An HR partner confirmed this would solve the majority of their daily problems. The biggest pain points are employee issues, handling recruitment requests, hirings, and firings — all paperwork-heavy, repetitive processes.

**Impact of not solving:** HR teams remain bogged down in administrative tasks, response times on employee issues are slow, compliance gaps create legal liability, and managers lack real-time HR support.

## 3. Target Users

### Primary Users

| Role | Description | Key Needs |
|------|-------------|-----------|
| **HR Agent** | Day-to-day HR staff at client companies. Power users of the platform. Technically comfortable but not developers. | AI-assisted drafting, policy-compliant document generation, employee record management, approval workflows, recruitment pipeline management. |
| **Company Manager** | Managers of teams within client companies. Need HR support without waiting for HR. | Submit disciplinary issues, view team performance, manage direct reports' HR needs, access AI coaching/advice, feel like they "have HR in their pocket." |
| **Employee** | Individual contributors at client companies. Infrequent users. | Review and sign documents (offer letters, contracts, disciplinary actions), enroll in benefits, view their HR file. |

### Secondary Users

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Company Admin (HR VP/Executive)** | Buyer persona. Manages company workspace, policies, billing. | Configure company policies, view analytics/dashboard, manage user roles, control AI autonomy settings, billing management. |
| **Super Admin (Platform Owner)** | The stakeholder. Manages the platform itself. | Tenant management, platform-wide settings, monitor system health, manage billing across clients. |
| **Candidates/Applicants** | People applying for jobs. Not full users. | Apply for positions, receive communications, sign offer letters. |

## 4. User Stories

### P0 — Must Have (Phase 1: Discipline & Counseling)

- As a **Super Admin**, I want to create a new company workspace so that client organizations can use the platform.
- As a **Company Admin**, I want to configure company policies (e.g., "3 tardies = verbal warning, 5 = written warning") so that the AI enforces them consistently.
- As a **Company Admin**, I want to set AI autonomy thresholds (e.g., 90% confidence) so that the AI only acts autonomously when sufficiently certain.
- As a **Company Admin**, I want to toggle whether employees can dispute disciplinary actions so that the policy matches our company culture.
- As an **HR Agent**, I want to log in via email/password, Google SSO, or Microsoft SSO so that I can access the platform securely.
- As a **Manager**, I want to submit an employee issue (e.g., tardiness, insubordination) so that the appropriate HR process is initiated.
- As an **AI Agent**, I want to analyze reported issues against company policy so that I can determine the correct disciplinary action.
- As an **AI Agent**, I want to auto-generate disciplinary documents (verbal warnings, written warnings, PIPs, termination letters) when confidence exceeds the configured threshold so that HR agents can review and approve them.
- As an **HR Agent**, I want to review AI-generated disciplinary documents before they are sent so that I maintain human oversight on sensitive actions.
- As an **HR Agent**, I want to schedule a three-way meeting (employee, manager, HR rep) with an AI-generated agenda so that the conversation is structured and productive.
- As an **HR Agent**, I want the AI to generate meeting summaries and action items from meeting notes so that outcomes are documented for compliance.
- As an **Employee**, I want to log in to the employee portal to view and sign disciplinary documents so that I have visibility into my HR record.
- As an **Employee**, I want to acknowledge or (if enabled) dispute a disciplinary action so that my response is formally recorded.
- As a **Visitor**, I want to view a marketing landing page that clearly explains the platform's value so that I can decide to sign up.

### P1 — Should Have (Phase 2+)

- As an **HR Agent**, I want the AI to autonomously generate job descriptions from a role title so that I can quickly post open positions.
- As an **HR Agent**, I want the AI to autonomously post jobs to job boards so that candidates are sourced without manual effort.
- As an **HR Agent**, I want the AI to autonomously screen and rank candidates so that I only review qualified applicants.
- As an **HR Agent**, I want the AI to autonomously schedule interviews by coordinating calendars so that the logistics are handled.
- As an **HR Agent**, I want to click "Hire" on a candidate and have the platform initiate onboarding (collect ID, tax info, generate offer letter, create IT accounts via Azure Entra) so that the new hire is ready on day one.
- As an **HR Agent**, I want the AI to manage benefits enrollment, including helping employees navigate plan selection so that enrollment is smooth.
- As an **HR Agent**, I want the AI to track benefits changes triggered by life events so that coverage stays current.
- As a **Manager**, I want the AI to auto-generate performance review summaries from feedback so that reviews are data-driven and efficient.
- As a **Manager**, I want the AI to suggest performance goals based on role and history so that development plans are relevant.
- As an **HR Agent**, I want the AI to flag flight-risk employees so that retention efforts can be proactive.
- As an **HR Agent**, I want the AI to nudge managers to complete reviews on time so that nothing falls through the cracks.
- As a **Company Admin**, I want the platform to integrate with Azure Entra ID for account provisioning and deprovisioning so that IT accounts are managed automatically.

### P2 — Nice to Have

- As an **HR Agent**, I want embedded video conferencing for disciplinary/coaching meetings so that everything stays in one platform.
- As a **Manager**, I want a conversational AI chatbot accessible at any time so that I can get instant HR guidance.
- As a **Company Admin**, I want benefits utilization analytics so that I can identify cost-saving opportunities.
- As a **Company Admin**, I want custom workflow builders so that I can define proprietary HR processes.
- As a **Super Admin**, I want a model-agnostic AI layer that can swap between OpenAI, Anthropic, Hugging Face, and OpenRouter models so that we optimize cost and capability per task.

## 5. Functional Requirements

| ID | Requirement | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| FR-001 | Multi-tenant authentication | Given a new user, when they sign up via email/password, Google SSO, or Microsoft SSO, then a company workspace is created and they are assigned the Company Admin role. Given an existing user, when they log in, then they see their company's data only. | P0 |
| FR-002 | Role-based access control | Given a user with a specific role (Super Admin, Company Admin, HR Agent, Manager, Employee), when they navigate the platform, then they see only the features and data permitted for their role. | P0 |
| FR-003 | Configurable policy engine | Given a Company Admin, when they define a policy rule (e.g., "3 tardies = verbal warning"), then the AI agent uses that rule when evaluating reported incidents. When they update a rule, future incidents use the updated rule. | P0 |
| FR-004 | AI autonomy threshold | Given a Company Admin, when they set an AI confidence threshold (default 90%), then the AI acts autonomously above that threshold and escalates to HR review below it. | P0 |
| FR-005 | Issue submission by managers | Given a Manager, when they submit an employee issue (type, description, date, severity, evidence), then the AI evaluates the issue against company policy and determines the appropriate action. | P0 |
| FR-006 | AI-generated disciplinary documents | Given a reported issue matching a policy violation with confidence ≥ threshold, when the AI processes it, then a disciplinary document is auto-generated (verbal warning, written warning, PIP, or termination) with correct policy references, employee details, and required actions. | P0 |
| FR-007 | HR agent review and approval | Given an AI-generated disciplinary document, when it is presented to the HR Agent, then they can approve, modify, or reject it. Only approved documents proceed to the employee. | P0 |
| FR-008 | Three-way meeting management | Given an approved disciplinary action requiring a meeting, when the HR Agent schedules it, then the platform identifies participants (employee, manager, HR rep), generates an agenda, provides a meeting space (Phase 1: external link + documentation; Phase 2: embedded video), and creates a record. | P0 |
| FR-009 | AI meeting documentation | Given a three-way meeting has occurred, when the HR Agent inputs meeting notes (or Phase 2: AI records automatically), then the AI generates a structured summary with key discussion points, agreed actions, deadlines, and participant attestations. | P0 |
| FR-010 | Employee document signing | Given an approved disciplinary document, when it is sent to the employee, then they can view it in the employee portal, sign/acknowledge it via the built-in e-signature engine, and (if enabled) dispute it with a written response. | P0 |
| FR-011 | Disciplinary record tracking | Given a disciplinary action, when it is processed through the platform, then the employee's record captures: incident date, type, severity, reporting manager, AI-generated document, meeting notes, employee signature/acknowledgment, follow-up actions and deadlines, linked policy, evidence attachments, witness statements, and union involvement flags. | P0 |
| FR-012 | Marketing landing page | Given a visitor to the platform's URL, when they view the landing page, then they see: brand name, core message ("An HR ERP that's AI-Based — Let computers talk to computers"), feature highlights, CTA to sign up, with the defined color palette and Playfair font. | P0 |
| FR-013 | Custom e-signature engine | Given any HR document requiring signature, when it is presented to a signer, then they can sign it using the platform's built-in e-signature capability with audit trail (who signed, when, IP address, tamper evidence). | P0 |
| FR-014 | Company workspace onboarding | Given a new Company Admin signing up, when they complete registration, then a new company workspace is created with default settings, and they are guided through initial policy configuration. | P0 |
| FR-015 | Progressive discipline tracking | Given an employee with multiple incidents, when a new incident is reported, then the AI considers the employee's full disciplinary history and escalates the response according to policy (e.g., verbal → written → PIP → termination). | P0 |
| FR-016 | AI recruitment — JD generation | Given an HR Agent specifying a role, when they request a job description, then the AI generates a complete, role-specific JD based on industry standards and any company-specific requirements. | P1 |
| FR-017 | AI recruitment — posting | Given an approved job description, when the HR Agent approves posting, then the AI posts it to configured job boards autonomously. | P1 |
| FR-018 | AI recruitment — candidate screening | Given incoming applications, when candidates apply, then the AI screens, ranks, and filters candidates against the job requirements, auto-rejecting obvious mismatches and surfacing top candidates. | P1 |
| FR-019 | AI recruitment — interview scheduling | Given a shortlisted candidate, when the AI initiates scheduling, then it coordinates availability across interviewer(s) and candidate calendars and sends invitations. | P1 |
| FR-020 | Onboarding orchestration | Given a candidate marked "Hired," when the HR Agent clicks "Hire," then the platform initiates: offer letter generation, ID/tax info collection, account creation via Azure Entra ID API, onboarding document collection, and first-day readiness checklist. | P1 |
| FR-021 | AI benefits management | Given an employee eligible for benefits, when open enrollment begins or a life event occurs, then the AI guides the employee through plan selection, processes enrollment changes, and updates records. | P1 |
| FR-022 | AI performance reviews | Given a review cycle, when it begins, then the AI generates review templates, collects 360 feedback, summarizes performance, suggests goals, and flags flight risks. | P1 |
| FR-023 | Azure Entra ID integration | Given an employee being hired or terminated, when the action is processed, then the platform calls Azure Entra ID via app registration API to create or disable the user's identity/profile. | P1 |
| FR-024 | AI coaching and development | Given an employee with performance data, when a manager or HR agent requests coaching recommendations, then the AI suggests development plans, training resources, and skill-building activities. | P1 |
| FR-025 | Embedded video conferencing | Given a scheduled meeting, when participants join, then they can conduct a video/audio call directly within the platform with AI-assisted note-taking. | P2 |
| FR-026 | Conversational HR assistant | Given a manager with an HR question, when they open the AI chat, then they receive instant, policy-aware guidance in a conversational interface. | P2 |
| FR-027 | Benefits analytics | Given a Company Admin, when they view the benefits dashboard, then they see utilization metrics, cost trends, and AI-generated cost-saving recommendations. | P2 |

## 6. Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-001 | Performance | Page load time | < 2 seconds on desktop, < 3 seconds on mobile |
| NFR-002 | Performance | API response time | < 500ms for standard CRUD, < 5s for AI generation |
| NFR-003 | Performance | Mobile responsiveness | All features functional on screens ≥ 375px width |
| NFR-004 | Security | Authentication | Supabase Auth with email/password, Google SSO, Microsoft SSO, magic link |
| NFR-005 | Security | Data encryption | Encryption at rest (Supabase default) and in transit (TLS) |
| NFR-006 | Security | Audit logging | All sensitive actions (document generation, approvals, signatures, terminations) logged with timestamp, user, action, and IP |
| NFR-007 | Security | Role-based access control | 5-tier role system with strict data isolation between tenants |
| NFR-008 | Compliance | SOC 2 | Design for SOC 2 Type II from day one — audit trails, access controls, encryption |
| NFR-009 | Compliance | HIPAA | PHI handled with BAA-ready infrastructure, minimum necessary access, encryption |
| NFR-010 | Compliance | GDPR | Data portability, right to erasure, consent management, data processing agreements |
| NFR-011 | Compliance | CCPA | Consumer data rights, opt-out mechanisms, data disclosure logs |
| NFR-012 | Compliance | EEOC | AI bias monitoring in recruiting and discipline, disparate impact analysis |
| NFR-013 | Compliance | State employment laws | Configurable policy engine allows per-jurisdiction rule customization |
| NFR-014 | Availability | Uptime | 99.9% uptime SLA target |
| NFR-015 | Availability | Disaster recovery | Daily backups via Supabase, point-in-time recovery capability |
| NFR-016 | Technology | Frontend framework | Next.js with Aceternity UI components, shadcn/ui, Playfair Display font |
| NFR-017 | Technology | Charts library | EvilCharts for all data visualizations |
| NFR-018 | Technology | Backend | Python (FastAPI or similar) |
| NFR-019 | Technology | Database | Supabase (PostgreSQL) with Row Level Security for multi-tenancy |
| NFR-020 | Technology | Hosting | Vercel (frontend + API routes) |
| NFR-021 | Technology | AI/LLM | Model-agnostic architecture; primary providers: Hugging Face, OpenRouter; capable of using different models per task |
| NFR-022 | Accessibility | WCAG compliance | Target Level AA for all user-facing interfaces |
| NFR-023 | Scalability | Multi-tenancy | Support unlimited company workspaces with strict data isolation |

## 7. Data Model

### Entities

#### Company
- `id` (UUID, PK)
- `name` (string)
- `industry` (string)
- `size` (enum: 1-50, 51-200, 201-500, 501-1000, 1000+)
- `settings` (JSONB — AI thresholds, dispute toggles, feature flags)
- `created_at`, `updated_at` (timestamps)

#### Department
- `id` (UUID, PK)
- `company_id` (UUID, FK → Company)
- `name` (string)
- `head_id` (UUID, FK → User, nullable)
- `created_at`, `updated_at` (timestamps)

#### User
- `id` (UUID, PK — Supabase Auth user ID)
- `company_id` (UUID, FK → Company)
- `department_id` (UUID, FK → Department, nullable)
- `role` (enum: super_admin, company_admin, hr_agent, manager, employee)
- `first_name`, `last_name` (string)
- `email` (string, unique)
- `phone` (string, nullable)
- `job_title` (string)
- `manager_id` (UUID, FK → User, nullable — self-referential)
- `status` (enum: active, onboarding, terminated, suspended)
- `hire_date` (date)
- `termination_date` (date, nullable)
- `created_at`, `updated_at` (timestamps)

#### Policy
- `id` (UUID, PK)
- `company_id` (UUID, FK → Company)
- `category` (enum: discipline, attendance, performance, conduct, benefits, general)
- `title` (string)
- `content` (text — full policy text, used as AI context)
- `rules` (JSONB — structured rules for AI enforcement, e.g., [{"trigger": "3 tardies", "action": "verbal_warning"}])
- `severity_levels` (JSONB — company-defined escalation ladder)
- `is_active` (boolean)
- `version` (integer)
- `created_by` (UUID, FK → User)
- `created_at`, `updated_at` (timestamps)

#### Incident / Issue
- `id` (UUID, PK)
- `company_id` (UUID, FK → Company)
- `employee_id` (UUID, FK → User)
- `reported_by` (UUID, FK → User — the manager)
- `type` (enum: tardiness, absence, insubordination, policy_violation, performance, harassment, theft, other)
- `description` (text)
- `incident_date` (date)
- `severity` (enum: low, medium, high, critical)
- `evidence_attachments` (JSONB — array of file references)
- `witness_ids` (UUID[], FK → User[])
- `union_involved` (boolean)
- `status` (enum: reported, ai_evaluating, hr_review, document_generated, meeting_scheduled, meeting_completed, document_sent, signed, closed, disputed)
- `ai_confidence_score` (float)
- `ai_recommendation` (JSONB — AI's suggested action and reasoning)
- `linked_policy_id` (UUID, FK → Policy)
- `created_at`, `updated_at` (timestamps)

#### Disciplinary Action
- `id` (UUID, PK)
- `incident_id` (UUID, FK → Incident)
- `company_id` (UUID, FK → Company)
- `employee_id` (UUID, FK → User)
- `action_type` (enum: verbal_warning, written_warning, suspension, pip, termination, coaching, counseling)
- `document_content` (text — AI-generated document body)
- `document_id` (UUID, FK → Document)
- `approved_by` (UUID, FK → User — HR Agent who approved)
- `approved_at` (timestamp)
- `follow_up_actions` (JSONB — array of {action, deadline, responsible_party})
- `resolved_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

#### Meeting
- `id` (UUID, PK)
- `disciplinary_action_id` (UUID, FK → Disciplinary Action)
- `company_id` (UUID, FK → Company)
- `type` (enum: disciplinary, counseling, pip_review, coaching)
- `agenda` (text — AI-generated)
- `scheduled_at` (timestamp)
- `duration_minutes` (integer)
- `participants` (UUID[], FK → User[])
- `meeting_link` (string — external link, Phase 1)
- `notes` (text — raw notes from HR Agent)
- `ai_summary` (text — AI-generated summary)
- `action_items` (JSONB — array of {item, assignee, deadline})
- `outcome` (enum: resolved, escalated, follow_up_required, no_action)
- `status` (enum: scheduled, completed, cancelled, rescheduled)
- `created_at`, `updated_at` (timestamps)

#### Document
- `id` (UUID, PK)
- `company_id` (UUID, FK → Company)
- `type` (enum: offer_letter, employment_contract, verbal_warning, written_warning, pip, termination, benefits_enrollment, policy_acknowledgment, nda, other)
- `title` (string)
- `content` (text)
- `created_by` (UUID, FK → User — or "AI" if AI-generated)
- `status` (enum: draft, pending_review, approved, sent, signed, disputed, archived)
- `version` (integer)
- `created_at`, `updated_at` (timestamps)

#### Signature
- `id` (UUID, PK)
- `document_id` (UUID, FK → Document)
- `signer_id` (UUID, FK → User)
- `signer_role` (string — role at time of signing)
- `signature_data` (text — digital signature capture)
- `ip_address` (string)
- `user_agent` (string)
- `signed_at` (timestamp)
- `dispute` (boolean)
- `dispute_reason` (text, nullable)
- `created_at` (timestamp)

#### Employee Record (Composite View)
- Aggregation of: User + Disciplinary Actions + Documents + Performance Reviews + Benefits Enrollments + Meeting History
- Presented as a unified employee profile/timeline

#### Job Requisition (Phase 2)
- `id`, `company_id`, `department_id`, `title`, `description`, `requirements`, `status`, `posted_to` (JSONB), `created_by`, dates

#### Candidate (Phase 2)
- `id`, `job_requisition_id`, `name`, `email`, `resume_url`, `ai_score`, `ai_screening_notes`, `status`, `interview_schedule` (JSONB)

#### Benefits Plan (Phase 2)
- `id`, `company_id`, `type` (medical, dental, vision, 401k, life, etc.), `provider`, `plan_details` (JSONB), `cost_structure` (JSONB)

#### Performance Review (Phase 2)
- `id`, `company_id`, `employee_id`, `reviewer_id`, `cycle`, `ratings` (JSONB), `goals` (JSONB), `feedback` (text), `ai_summary`, `status`, dates

### Relationships

```
Company 1:N Department
Company 1:N User
Company 1:N Policy
Company 1:N Document
Department 1:N User
User (Manager) 1:N User (Employee) [via manager_id]
User 1:N Incident [as employee]
User 1:N Incident [as reporter]
Incident 1:1 Disciplinary Action
Disciplinary Action 1:N Meeting
Disciplinary Action 1:1 Document
Document 1:N Signature
User 1:N Signature [as signer]
Policy 1:N Incident [via linked_policy_id]
Company 1:N Job Requisition (Phase 2)
Job Requisition 1:N Candidate (Phase 2)
Company 1:N Benefits Plan (Phase 2)
User 1:N Benefits Enrollment (Phase 2)
User 1:N Performance Review (Phase 2)
```

### Data Volumes

- **Phase 1 target:** 1-10 client companies, 50-500 employees per company
- **Growth target (Year 1):** Up to 100 client companies, 50,000 total employees
- **Document volume:** ~10 documents per employee per year
- **Concurrent users:** ~50-100 during Phase 1, scaling to 5,000+

## 8. User Flows

### Flow 1: Discipline & Counseling (Phase 1 — Primary Flow)

```
1. MANAGER submits issue
   → Manager logs in → navigates to "Report Issue" → selects employee
   → Chooses incident type, enters description, date, severity
   → Attaches evidence (files, screenshots)
   → Adds witnesses (if any), flags union involvement
   → Submits

2. AI EVALUATES incident
   → AI loads company policy for incident type
   → AI reviews employee's disciplinary history (progressive discipline)
   → AI calculates confidence score
   → IF confidence ≥ threshold: AI generates recommendation + document
   → IF confidence < threshold: flags for HR manual review

3. HR AGENT REVIEWS
   → HR Agent receives notification of new incident + AI recommendation
   → Reviews AI-generated disciplinary document (warning, PIP, etc.)
   → Reviews linked policy and employee history
   → Approves, modifies, or rejects the document
   → If rejected: adds notes, AI regenerates or case closed

4. MEETING SCHEDULED
   → If meeting required: HR Agent schedules three-way meeting
   → AI generates agenda based on incident + policy
   → Platform identifies participants (employee, manager, HR rep)
   → Meeting link provided (external: Zoom/Teams/Meet)
   → Notifications sent to all parties

5. MEETING OCCURS (external)
   → Meeting takes place on external platform
   → HR Agent takes notes in platform (or uploads)

6. AI DOCUMENTS meeting
   → AI generates meeting summary from notes
   → AI extracts action items, deadlines, responsible parties
   → AI generates follow-up plan
   → HR Agent reviews and finalizes

7. DOCUMENT SENT to employee
   → Finalized disciplinary document sent to employee portal
   → Employee receives notification (email + in-app)
   → Employee logs in, views document in full
   → Employee signs/acknowledges via e-signature engine
   → IF dispute enabled: employee can submit written dispute

8. RECORD CLOSED
   → All data attached to employee's permanent record
   → Follow-up actions tracked with deadlines
   → Manager receives reminders for follow-up actions
   → Full audit trail preserved
```

### Flow 2: New Client Onboarding (Platform)

```
1. HR VP/Executive visits landing page
2. Clicks "Get Started" / "Sign Up"
3. Creates account via email/password, Google, or Microsoft SSO
4. Company workspace created automatically
5. Guided through initial setup:
   - Company name, industry, size
   - Invite HR Agents (email invites)
   - Define initial policies (templates provided by AI)
   - Set AI autonomy threshold (default 90%)
   - Toggle employee dispute capability
6. HR Agents invited, set up their profiles
7. Managers invited by HR Agents
8. Employees imported (CSV) or invited individually
9. Platform ready for use
```

### Flow 3: Employee Document Signing

```
1. Employee receives email notification: "You have a document to review"
2. Employee clicks link → logs in (SSO or email/password)
3. Employee portal shows pending documents
4. Employee opens document, reads full content
5. Employee reviews linked policy (if applicable)
6. Employee signs via e-signature:
   - Types name (legal acknowledgment)
   - Draws signature (canvas capture)
   - Timestamp + IP recorded
7. IF dispute enabled AND employee disputes:
   - Employee writes dispute reason
   - Dispute flagged for HR Agent review
   - Original document remains in "disputed" status
8. Confirmation shown, copy emailed to employee
```

## 9. Design Direction

### Visual Identity

- **Style:** Dark, premium, sophisticated — a departure from typical bland HR software
- **Brand message:** "An HR ERP that's AI-Based. Let computers talk to computers."
- **Emotional tone:** Professional yet modern; conveys trust, intelligence, and efficiency

### Color Palette

| Color | Role | Key Shades |
|-------|------|------------|
| **Dark Slate Grey** | Primary structural color — backgrounds, containers, text | 900 (#111e22) for primary bg, 800 (#223d44) for cards, 50-200 for text |
| **Vanilla Custard** | Warm accent — CTAs, highlights, success states | 500 (#ffd900) for primary accent, 300 (#ffe866) for hover |
| **Honey Bronze** | Secondary accent — secondary buttons, badges, warm tones | 500 (#db9224) for secondary, 300 (#eabe7b) for light accents |
| **Brown Red** | Caution/alert — warnings, moderate severity | 500 (#c93638) for alerts |
| **Night Bordeaux** | Danger/critical — errors, high severity, destructive actions | 500 (#e21d24) for critical, 800-950 for deep backgrounds |

### Typography

- **Primary font:** Playfair Display (serif) — for headings, brand elements, premium feel
- **Body font:** System or paired sans-serif for readability in data-dense interfaces

### Component Libraries

- **Framework:** Next.js (App Router)
- **UI Components:** Aceternity UI (animated, modern components) + shadcn/ui (accessible, composable primitives)
- **Charts:** EvilCharts for all data visualizations
- **Design tokens:** Mapped from color palette with full shade scales (50-950)

### Platforms

- Desktop web (primary)
- Mobile responsive (secondary — all features functional ≥ 375px)
- No native mobile apps in Phase 1

### Reference Products

- Aceternity UI showcase for interaction patterns
- Dark-themed SaaS dashboards (Linear, Raycast) for UX patterns

## 10. Integrations

| Integration | Purpose | Phase | Method |
|-------------|---------|-------|--------|
| **Supabase Auth** | Authentication (email/password, Google, Microsoft, magic link) | Phase 1 | Supabase SDK |
| **Azure Entra ID** | Employee account provisioning and deprovisioning | Phase 1 (setup), Phase 2 (full) | Microsoft Graph API via App Registration |
| **Hugging Face** | Open-source LLM provider for AI agents | Phase 1 | API |
| **OpenRouter** | Model routing for multi-model AI architecture | Phase 1 | API |
| **Email Service** | Notifications, document delivery, invites | Phase 1 | Supabase Edge Functions + email provider |
| **Calendar Services** | Meeting scheduling (Google Calendar, Outlook) | Phase 2 | OAuth + Calendar APIs |
| **Job Boards** | Autonomous job posting | Phase 2 | Job board APIs |
| **Benefits Providers** | Plan data, enrollment integration | Phase 2 | Provider-specific APIs |
| **Video Conferencing** | Embedded meetings | Phase 2 | WebRTC or provider SDK |
| **Payroll Systems** | Data sync for hires/terminations | Phase 2 | API |

## 11. Constraints & Assumptions

### Constraints

- **Builder:** AI-driven development (no human engineering team)
- **Tech stack:** Next.js, Python, Supabase, Vercel — non-negotiable
- **UI libraries:** Aceternity UI + shadcn/ui + Playfair Display + EvilCharts — non-negotiable
- **AI approach:** Model-agnostic, preference for open-source (Hugging Face, OpenRouter)
- **Phase 1 timeline:** Deliver Auth + Landing Page + Discipline/Counseling module first
- **Build approach:** Module-by-module (Option A) — build deep, ship working software per module

### Assumptions

1. Supabase Row Level Security is sufficient for multi-tenant data isolation
2. Supabase provides adequate encryption at rest and in transit for HIPAA readiness
3. Phase 1 discipline module can operate without real-time video — documentation and external links sufficient
4. Custom e-signature engine can achieve legal validity without third-party providers (needs legal validation)
5. AI confidence scoring can reliably determine when to act vs. escalate (needs testing with real policies)
6. Open-source models via Hugging Face/OpenRouter are capable enough for HR document generation, policy interpretation, and compliance reasoning
7. Vercel hosting can support Python backend (via serverless functions or separate Python service)
8. The HR partner will validate workflows and provide domain expertise as needed
9. Compliance certifications (SOC 2, HIPAA, etc.) will be pursued post-launch with the architecture designed to support them

### Needs Validation

- Legal review of custom e-signature engine for enforceability in all 50 states
- AI bias testing framework for EEOC compliance in recruiting and discipline
- Supabase BAA availability for HIPAA-covered data
- Azure Entra ID API rate limits for provisioning at scale
- Open-source model performance benchmarks for HR-specific tasks

## 12. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| AI makes incorrect disciplinary decision, creating legal liability | Medium | Critical | Human-in-the-loop for all disciplinary documents (HR approval required); configurable confidence threshold (default 90%); full audit trail; AI disclaimer on all generated content |
| Non-compliance with HIPAA/GDPR/SOC 2 | Medium | Critical | Design for compliance from day one; encryption at rest and in transit; audit logging on all sensitive actions; row-level security for multi-tenancy; pursue formal certification post-launch |
| Low adoption — managers don't trust AI for HR decisions | High | High | Start with assistive (not fully autonomous) workflows; transparent AI reasoning ("why this action was recommended"); always provide human override; manager-facing UX must feel like "HR in your pocket" not "HR by robot" |
| Custom e-signature engine not legally enforceable | Medium | High | Research e-signature law (ESIGN Act, UETA); implement tamper-evidence, audit trail, identity verification; legal review before launch; Phase 2 fallback to provider integration if needed |
| Scope creep — too many modules too fast | High | Medium | Strict module-by-module approach (Option A); Phase 1 locked to Auth + Landing + Discipline; each module must be "done" before starting the next |
| Data breach exposing sensitive employee data | Low | Critical | Supabase encryption; row-level security; principle of least privilege; regular security audits; incident response plan |
| Open-source model quality insufficient for nuanced HR decisions | Medium | Medium | Model-agnostic architecture allows switching to commercial models (OpenAI, Anthropic) if needed; task-specific model selection; human review on critical decisions |

## 13. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Paying clients on platform | 1 within 6 months | Billing records |
| Time to process disciplinary action (submission → signed document) | < 48 hours (vs. industry avg of 5-7 days) | Platform analytics |
| AI document approval rate (HR agent approves without modification) | > 80% | Platform analytics |
| Manager adoption (managers who submit at least 1 issue per month) | > 70% of active managers | Usage analytics |
| Employee portal engagement (employees who sign documents within 24 hours) | > 90% | Platform analytics |
| Platform uptime | 99.9% | Vercel/monitoring dashboards |
| Compliance audit findings | Zero critical findings | Annual audit |

## 14. Open Questions

1. **E-signature legal validation:** Has a lawyer confirmed that a custom-built e-signature engine is enforceable under ESIGN Act and UETA in all target jurisdictions? What identity verification is required?
2. **AI model selection for Phase 1:** Which specific open-source model(s) should power the discipline/counseling AI? (e.g., Llama 3, Mistral, Mixtral via Hugging Face/OpenRouter)
3. **Python backend architecture on Vercel:** Vercel primarily supports Node.js. Should the Python backend run as a separate service (e.g., on Railway, Render, AWS Lambda) with the Next.js frontend on Vercel calling it via API?
4. **Data residency requirements:** Do any target clients require data to be stored in specific geographic regions? This affects Supabase region selection.
5. **Policy engine complexity:** Should the policy engine support conditional logic (e.g., "IF employee in California AND company size > 50 THEN apply this rule") or just flat rules?
6. **Notification channels:** Beyond email, should the platform support SMS, Slack, or Teams notifications?
7. **Employee dispute workflow:** When an employee disputes a disciplinary action, what happens next? Does it go back to HR? To legal? Is there an appeals process?
8. **Multi-language support:** Do any target clients need the platform in languages other than English?
9. **Billing model:** Per-employee-per-month? Per-company flat rate? Freemium? This affects the data model and landing page.
10. **HR partner involvement:** How available is the HR partner for workflow validation during development? Can we send them prototypes for review?

## Appendix: Interview Transcript Summary

### Stage 1: Vision & Purpose
- **Product:** AI-powered HR ERP — autonomous + assistive AI agents handle administrative HR tasks so humans can focus on people
- **Origin:** HR partner who believes this solves the majority of their problems
- **Success metric:** 1 paying client within 6 months
- **Core philosophy:** "Let computers talk to computers. Let humans manage the human interactions."

### Stage 2: Users & Audience
- **Three user tiers:** HR agents (power users), managers (team-level HR needs), employees (document signing portal)
- **Buyer persona:** HR VPs and executives at client companies; company managers
- **Manager experience goal:** "Feel like they have HR in their pocket"

### Stage 3: Core Functionality
- **Recruitment:** AI autonomously generates JDs, posts to job boards, screens candidates, schedules interviews
- **Discipline & Counseling (Phase 1):** Manager reports issue → AI evaluates against policy (90% confidence threshold) → generates document → HR reviews → meeting scheduled with AI agenda → AI summarizes meeting → employee signs → record tracked. Includes evidence, witnesses, union flags, follow-up actions.
- **Onboarding:** Click "Hire" → AI orchestrates: offer letter, ID/tax collection, Azure Entra account provisioning
- **Benefits:** AI helps employees navigate plan selection, manages life events, tracks utilization
- **Reviews & Coaching:** AI generates summaries, suggests goals, flags flight risks, nudges managers
- **E-signature:** Custom-built engine — part of the value proposition. Any and all HR forms.
- **Policy engine:** Companies define policies as context for AI agents. Very configurable. Includes dispute toggle, AI autonomy threshold, per-company rules.

### Stage 4: Design & Experience
- **Stack:** Next.js, Aceternity UI, shadcn/ui, Playfair Display font, EvilCharts
- **Color palette:** Dark Slate Grey (base), Vanilla Custard (accent/CTA), Honey Bronze (secondary), Brown Red (alerts), Night Bordeaux (danger)
- **Platforms:** Desktop + mobile responsive, no native apps
- **Meeting video:** Phase 1 = documentation only (external link + AI notes); Phase 2 = embedded video
- **Brand message:** "An HR ERP that's AI-Based. Let computers talk to computers."

### Stage 5: Data & Content
- **Core entities:** Company, Department, User, Policy, Incident, Disciplinary Action, Meeting, Document, Signature
- **Phase 2 entities:** Job Requisition, Candidate, Benefits Plan, Performance Review
- **Multi-tenant:** Strict data isolation between companies via Supabase RLS
- **5-tier roles:** Super Admin, Company Admin, HR Agent, Manager, Employee
- **Discipline record fields:** Incident details, severity, evidence attachments, witness statements, union flag, AI confidence score, linked policy, meeting notes, signatures, follow-up actions, deadlines

### Stage 6: Non-Functional Requirements
- **Compliance:** SOC 2, GDPR, HIPAA, CCPA, EEOC, state employment laws — all required
- **Tech stack:** Python backend, Vercel hosting, Supabase (PostgreSQL + Auth + Storage), model-agnostic AI (open-source via Hugging Face/OpenRouter)
- **Auth:** Email/password, Google SSO, Microsoft SSO, magic link — all via Supabase

### Stage 7: Context & Constraints
- **Builder:** AI-driven (no human dev team)
- **Approach:** Module-by-module, build deep (Option A)
- **Phase 1:** Auth + Landing Page + Discipline/Counseling
- **Stakeholders:** Stakeholder (product owner), HR partner (domain expert/first customer), HR VPs/Executives (buyers), company managers (end users)
- **Top risks:** Compliance and adoption
- **ITSM:** Azure Entra ID integration for account provisioning/deprovisioning
