# Build Tasks: AI HR Platform — Phase 1 MVP

> **Status**: Ready to Build
> **Author**: @dev-lead-developer
> **Date**: 2026-03-29
> **PRD Reference**: PRD.md (APPROVED at 95% confidence)
> **Total Tasks**: 48
> **Total Estimate**: 247 story points
> **Estimated Waves**: 6
> **Realistic Timeline**: 8-10 weeks (solo), 6 weeks (team of 3)

---

## Wave Summary

| Wave | Name | Tasks | Points | [S] Serial | [P] Parallel | Depends On |
|------|------|-------|--------|------------|-------------|------------|
| 0 | Spikes & Scaffolding | 7 | 34 | 5 | 2 | — |
| 1 | Foundation (DB + Auth + Shell) | 9 | 50 | 5 | 4 | Wave 0 |
| 2 | Core Backend (Policies + Incidents + AI) | 8 | 40 | 3 | 5 | Wave 1 |
| 3 | Core Frontend (Screens + Components) | 8 | 44 | 2 | 6 | Wave 2 |
| 4 | Integration & Signing | 8 | 38 | 3 | 5 | Wave 3 |
| 5 | Polish, Testing & Deploy | 8 | 41 | 4 | 4 | Wave 4 |

## Dependency Graph

```
Wave 0 ──▶ Wave 1 ──▶ Wave 2 ──▶ Wave 3 ──▶ Wave 4 ──▶ Wave 5
[S][P]       [S][P]     [S][P]     [P][P]     [S][P]     [S][P]
                          [P]        [P]        [P]        [P]
```

---

## Wave 0: Spikes & Scaffolding

### T001: Project Scaffold — Next.js + Tailwind + Design Tokens
- **Wave**: 0
- **Type**: [S]
- **Role**: @dev-frontend-developer
- **Depends on**: None
- **Estimate**: 5
- **Description**: Initialize Next.js 14+ App Router project with TypeScript strict mode. Configure Tailwind CSS with the full color/typography/spacing token system from UI.md. Install and configure shadcn/ui with dark theme defaults. Set up Playfair Display font. Create the `tailwind.config.ts` with all brand colors, text colors, border colors. Set up ESLint + Prettier. Create `.env.example` with all required env vars. Initialize git repo with `.gitignore`.
- **Files to create/modify**: `package.json`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`, `.env.example`, `.gitignore`, `src/app/layout.tsx`, `src/lib/utils.ts`, `src/styles/globals.css`
- **Acceptance Criteria**:
  - [ ] `npm run dev` starts successfully with dark theme rendering
  - [ ] All brand colors accessible as `bg-brand-dark-slate`, `bg-brand-vanilla`, etc.
  - [ ] Playfair Display loads for headings, system-ui for body
  - [ ] shadcn/ui `Button` component renders with dark theme
  - [ ] ESLint + Prettier run without errors
  - [ ] `.env.example` documents all env vars from DevOps review
- **Notes**: Use `npx create-next-app@latest` with App Router + TypeScript + Tailwind + ESLint. shadcn init with "New York" style + dark mode.

### T002: Supabase Project + Database Schema (14 tables)
- **Wave**: 0
- **Type**: [S]
- **Role**: @dev-dba
- **Depends on**: None
- **Estimate**: 8
- **Description**: Create Supabase project. Write all migration files for the expanded schema: 14 tables (11 original + `meeting_participants`, `incident_witnesses`, `policy_versions` junction/history tables). Include all ENUMs, NOT NULL constraints, CHECK constraints, UNIQUE constraints, and foreign keys with proper cascade rules from DBA review. Add all indexes from PRD + DBA review (including covering indexes). Create `auth.company_id()` and `auth.user_role()` helper functions for RLS performance. Create 3 storage buckets (evidence, documents, avatars). Seed data: 3 AI policy templates, default company settings.
- **Files to create/modify**: `supabase/config.toml`, `supabase/migrations/00001_extensions.sql`, `00002_enums.sql`, `00003_companies.sql`, `00004_departments.sql`, `00005_users.sql`, `00006_policies.sql`, `00007_policy_versions.sql`, `00008_incidents.sql`, `00009_incident_witnesses.sql`, `00010_documents.sql`, `00011_disciplinary_actions.sql`, `00012_meetings.sql`, `00013_meeting_participants.sql`, `00014_signatures.sql`, `00015_audit_log.sql`, `00016_notifications.sql`, `00017_indexes.sql`, `00018_rls_policies.sql`, `00019_audit_triggers.sql`, `00020_storage_buckets.sql`, `00021_seed_data.sql`
- **Acceptance Criteria**:
  - [ ] `supabase start` runs locally with all migrations applied
  - [ ] All 14 tables created with correct columns, types, constraints
  - [ ] All foreign keys reference correctly (circular FK on disciplinary_actions.document_id is nullable)
  - [ ] All indexes created (including covering indexes for HR queue)
  - [ ] RLS enabled on all tenant-scoped tables with helper functions
  - [ ] Audit triggers on 6 sensitive tables (incidents, disciplinary_actions, documents, signatures, policies, users)
  - [ ] 3 storage buckets created (evidence, documents, avatars)
  - [ ] Seed data: 3 policy templates load successfully
  - [ ] `updated_at` auto-update triggers on all tables with that column
- **Notes**: Critical: the circular FK between `disciplinary_actions.document_id → documents.id` means `document_id` must be nullable on `disciplinary_actions`. Documents table created first. `meetings.participants` is replaced by `meeting_participants` junction table. `incidents.witness_ids` is replaced by `incident_witnesses` junction table. Add `reference_number` to incidents, `status` to disciplinary_actions, `content_hash` to signatures, `policy_snapshot` JSONB to incidents.

### T003: Python FastAPI Service Scaffold + Railway Deploy
- **Wave**: 0
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: None
- **Estimate**: 5
- **Description**: Create Python FastAPI service in `server/` directory with: project structure (routers, services, models, schemas, core), Dockerfile, Railway configuration, health endpoint (`GET /health`), shared API key auth middleware (validates `AI_SERVICE_API_KEY` header), CORS configured for Vercel frontend only, structured logging, pydantic v2 schemas for all 4 AI endpoints, error handling middleware, and rate limiting scaffolding. Deploy to Railway staging.
- **Files to create/modify**: `server/requirements.txt`, `server/Dockerfile`, `server/railway.json`, `server/app/main.py`, `server/app/core/config.py`, `server/app/core/security.py`, `server/app/core/logging.py`, `server/app/routers/health.py`, `server/app/routers/ai.py`, `server/app/schemas/incident.py`, `server/app/schemas/document.py`, `server/app/schemas/meeting.py`, `server/app/tests/test_health.py`
- **Acceptance Criteria**:
  - [ ] `docker build -t ai-hr-service .` succeeds
  - [ ] `GET /health` returns `{ "status": "ok", "timestamp": "..." }`
  - [ ] API key auth rejects requests without valid `AI_SERVICE_API_KEY` header with 401
  - [ ] CORS allows only the configured frontend origin
  - [ ] Pydantic schemas defined for all 4 AI endpoint request/response types
  - [ ] Service deploys to Railway staging and health check passes
- **Notes**: Use Python 3.12, FastAPI 0.110+, pydantic v2, httpx for async HTTP, pytest + httpx for testing. Railway free tier has cold starts — document the keep-alive ping need.

### T004: Spike — RLS + RBAC Test Matrix
- **Wave**: 0
- **Type**: [P]
- **Role**: @dev-testing-engineer
- **Depends on**: T002
- **Estimate**: 5
- **Description**: Build the automated cross-tenant test suite that will become the CI quality gate. Create: (1) Supabase test project manager (seed/teardown), (2) Authenticated test client factory (`client_as(role, company_id)`), (3) Multi-tenant fixture (2 companies with full data graphs), (4) Parameterized test matrix: every table × every role × CRUD operations, (5) Cross-tenant isolation verification (Company A user cannot access Company B data). Write as pytest suite that can run locally and in CI.
- **Files to create/modify**: `tests/conftest.py`, `tests/fixtures/companies.py`, `tests/fixtures/users.py`, `tests/fixtures/policies.py`, `tests/fixtures/incidents.py`, `tests/rls/test_cross_tenant_isolation.py`, `tests/rls/test_rbac_matrix.py`, `tests/utils/test_client.py`, `tests/utils/db_manager.py`
- **Acceptance Criteria**:
  - [ ] Test suite creates 2 companies with full data graphs (users, policies, incidents)
  - [ ] Test client factory produces authenticated clients for all 5 roles
  - [ ] Cross-tenant test: Company A user reads 0 rows from Company B across all 14 tables
  - [ ] RBAC matrix: every role × key resource access pattern tested (50+ combinations)
  - [ ] Test suite runs in < 60 seconds locally
  - [ ] Test suite can be integrated into CI pipeline
- **Notes**: This is the #1 security gate. Must be complete before any feature code ships. Use Supabase local dev + `supabase test db` for fast local execution.

### T005: Spike — Rich Text Editor with Track Changes (Tiptap)
- **Wave**: 0
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T001
- **Estimate**: 5
- **Description**: Evaluate Tiptap (with Collaboration/Track Changes extensions) for the HR document review panel. Build a working prototype that: (1) Renders an AI-generated document in rich text, (2) Allows inline editing with tracked changes visible, (3) Captures before/after diff as JSON for audit trail, (4) Supports read-only mode (for employee view). Test with 5KB+ documents. Evaluate bundle size impact.
- **Files to create/modify**: `spikes/tiptap-editor/Editor.tsx`, `spikes/tiptap-editor/TrackChanges.tsx`, `spikes/tiptap-editor/AuditCapture.ts`, `spikes/tiptap-editor/README.md`
- **Acceptance Criteria**:
  - [ ] Editor renders 5KB Markdown/HTML document without lag
  - [ ] Track changes visible: additions in green, deletions in strikethrough red
  - [ ] Diff capture produces structured JSON with before/after text
  - [ ] Read-only mode prevents all edits
  - [ ] Bundle size measured and documented (< 100KB gzipped for editor chunk)
  - [ ] Decision documented: proceed with Tiptap, or simplify to diff-view for MVP
- **Notes**: If Tiptap Pro's track-changes requires paid license, evaluate open-source alternatives or simplify to a diff-view approach (side-by-side original vs. edited). Document the decision.

### T006: Spike — E-Signature Canvas Legal Feasibility
- **Wave**: 0
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: None
- **Estimate**: 3
- **Description**: Research and document the ESIGN Act + UETA requirements for a custom e-signature engine. Create a compliance checklist covering: (1) Intent to sign, (2) Consent to do business electronically, (3) Attribution (who signed), (4) Record retention, (5) Tamper evidence. Build minimal proof-of-concept: canvas drawing capture → SHA-256 hash of document+signature → timestamp+IP capture → append-only storage. Document legal opinion needed.
- **Files to create/modify**: `spikes/e-signature/COMPLIANCE_CHECKLIST.md`, `spikes/e-signature/signature_poc.py`, `spikes/e-signature/README.md`
- **Acceptance Criteria**:
  - [ ] ESIGN/UETA compliance checklist with all requirements mapped to technical implementation
  - [ ] Proof-of-concept: canvas stroke data → base64 image → SHA-256 hash computed correctly
  - [ ] Document: which requirements need legal sign-off before production use
  - [ ] Decision: proceed with custom engine OR integrate DocuSign (with timeline impact)
- **Notes**: If legal review says custom engine is not defensible, the fallback is DocuSign API integration which adds ~5 days to the timeline. Get stakeholder decision on this before Wave 4.

### T007: Spike — AI Model Evaluation + Prompt Architecture
- **Wave**: 0
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T003
- **Estimate**: 3
- **Description**: Evaluate AI models via OpenRouter for the 4 AI tasks. Build a minimal end-to-end pipeline: structured policy JSONB → prompt construction → LLM call → parsed output. Test with 5 sample scenarios against 2-3 models (Llama 3 8B, Llama 3 70B, Mistral). Measure: latency, cost per call, output quality. Design the prompt architecture: system templates (server-controlled, immutable), structured data payloads (no free-text concatenation), response schemas. Document the model selection per task.
- **Files to create/modify**: `spikes/ai-evaluation/evaluate.py`, `spikes/ai-evaluation/prompts.py`, `spikes/ai-evaluation/test_scenarios.json`, `spikes/ai-evaluation/README.md`
- **Acceptance Criteria**:
  - [ ] At least 2 models tested for each AI task
  - [ ] Structured prompt architecture documented (system template + JSON payload pattern)
  - [ ] Latency benchmarked: evaluate-incident, generate-document, generate-agenda, summarize-meeting
  - [ ] Cost per call estimated for each model/task combination
  - [ ] Recommended model per task documented with rationale
  - [ ] Response validation schema defined for each endpoint
- **Notes**: Start with OpenRouter as the single provider. HuggingFace inference can be added later as fallback. The key question: can an 8B model reliably produce legal-grade discipline documents? If not, budget for a larger model on document generation.

---

## Wave 1: Foundation (DB + Auth + Security + Shell)

### T008: RLS Policies — All 14 Tables
- **Wave**: 1
- **Type**: [S]
- **Role**: @dev-dba
- **Depends on**: T002, T004
- **Estimate**: 8
- **Description**: Write comprehensive RLS policies for all 14 tables covering all 5 roles. Use `auth.company_id()` and `auth.user_role()` helper functions for performance. Policies include: super_admin (all tenants), company_admin (own tenant config), hr_agent (own tenant HR data), manager (own direct reports + own incidents), employee (own documents + own incidents only). Apply to all CRUD operations (SELECT, INSERT, UPDATE, DELETE). Verify against the T004 test suite.
- **Files to create/modify**: `supabase/migrations/00018_rls_policies.sql` (expand significantly)
- **Acceptance Criteria**:
  - [ ] RLS policies on all 14 tables for all 5 roles
  - [ ] Cross-tenant test suite (T004) passes with 100% isolation
  - [ ] RBAC matrix test (T004) passes all 50+ role×resource combinations
  - [ ] Performance: RLS policy adds < 5ms per query (verified with EXPLAIN ANALYZE)
  - [ ] `auth.company_id()` helper function used (no inline subqueries)
- **Notes**: This is the security foundation. Every feature depends on correct RLS. Get Security Engineer sign-off on policies before proceeding.

### T009: Auth — Supabase Auth Integration (Email/Password + Google SSO)
- **Wave**: 1
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T002
- **Estimate**: 5
- **Description**: Implement Next.js server-side Supabase Auth integration. Create: Supabase client utilities (browser client, server client, admin client), auth callback route handler, login/signup API routes, session middleware with HttpOnly cookies, Google OAuth provider setup, session timeout configuration (15min admin, 30min employee, 8hr absolute max). User profile auto-creation on signup (trigger inserts into `users` table with company_id, role, etc.).
- **Files to create/modify**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/middleware.ts`, `src/app/auth/callback/route.ts`, `src/app/api/v1/auth/login/route.ts`, `src/app/api/v1/auth/signup/route.ts`, `src/app/api/v1/auth/logout/route.ts`
- **Acceptance Criteria**:
  - [ ] Email/password signup creates company workspace + assigns Company Admin role
  - [ ] Login returns session with HttpOnly, Secure, SameSite=Strict cookies
  - [ ] Google SSO callback creates user + links to company
  - [ ] Session middleware validates cookie on every request
  - [ ] Idle timeout: 15min for admin roles, 30min for employees
  - [ ] Absolute max session: 8 hours
  - [ ] Logout clears session and redirects to login
- **Notes**: Use `@supabase/ssr` package for server-side Auth. Configure Google OAuth in Supabase dashboard. The middleware must refresh tokens transparently.

### T010: RBAC Middleware — 3-Layer Enforcement
- **Wave**: 1
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T009
- **Estimate**: 5
- **Description**: Implement 3-layer RBAC enforcement. Layer 1: Next.js middleware route protection (redirect unauthenticated, block by role for route prefixes). Layer 2: API dependency injection — `requireRole()` function that reads role from DB (not JWT) and validates tenant ownership. Layer 3: RLS policies (T008). Create role enum type, permission constants, and utility functions for checking access.
- **Files to create/modify**: `src/middleware.ts` (expand), `src/lib/auth/rbac.ts`, `src/lib/auth/permissions.ts`, `src/lib/auth/require-role.ts`, `src/app/api/v1/_middleware.ts`
- **Acceptance Criteria**:
  - [ ] Unauthenticated users redirected to /login from all protected routes
  - [ ] Employee accessing /admin gets 403
  - [ ] Manager accessing /incidents (other tenant) gets 403
  - [ ] Role read from DB on every API request (not JWT alone)
  - [ ] Role change takes effect immediately (no stale JWT role)
  - [ ] All three layers agree on access decisions
- **Notes**: The `requireRole()` function should be used as a dependency in every API route handler. Pattern: `export const GET = withAuth(requireRole('hr_agent'), async (req) => { ... })`.

### T011: Security Headers + CORS + Rate Limiting
- **Wave**: 1
- **Type**: [P]
- **Role**: @dev-security-engineer
- **Depends on**: T003
- **Estimate**: 3
- **Description**: Add security middleware to both Next.js and Python services. Next.js: CSP headers, X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy. Python: CORS locked to Vercel frontend origin, request size limits (10MB evidence, 10KB AI payloads), rate limiting (100/min standard, 20/min AI, 10/min auth), API key validation. Add security header tests.
- **Files to create/modify**: `src/middleware.ts` (add headers), `server/app/core/security.py` (expand), `server/app/core/rate_limit.py`
- **Acceptance Criteria**:
  - [ ] All security headers present on every response (verified by test)
  - [ ] CORS rejects requests from non-Vercel origins
  - [ ] Rate limiting: 101st request in 1 minute returns 429 with Retry-After
  - [ ] File upload > 10MB rejected with 413
  - [ ] AI payload > 10KB rejected with 413
- **Notes**: Quick win with high security value. CSP should be strict but allow Supabase and Google/Microsoft OAuth origins.

### T012: Dashboard Shell Layout (Sidebar + Header)
- **Wave**: 1
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T001
- **Estimate**: 5
- **Description**: Build the authenticated app shell: Sidebar component (expanded 240px / collapsed 64px / drawer on mobile) with role-adaptive navigation items from UX.md, Header component with breadcrumbs + notification bell + user profile dropdown, PageContainer wrapper, responsive behavior at 4 breakpoints. Sidebar nav items change based on user role. Implement sidebar collapsed state persistence to localStorage.
- **Files to create/modify**: `src/components/layout/Shell.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/PageContainer.tsx`, `src/components/navigation/SidebarNavItem.tsx`, `src/components/navigation/Breadcrumb.tsx`, `src/stores/sidebar-store.ts`, `src/app/(dashboard)/layout.tsx`
- **Acceptance Criteria**:
  - [ ] Desktop: sidebar expanded 240px with icons + labels
  - [ ] Laptop: sidebar collapsed 64px with icons only, expand on hover
  - [ ] Tablet: sidebar hidden, hamburger menu opens drawer
  - [ ] Mobile: bottom nav bar with 5 items
  - [ ] Navigation items change per role (5 role layouts from UX.md)
  - [ ] Header shows breadcrumbs + notification bell (placeholder) + user dropdown
  - [ ] Sidebar state persisted to localStorage
- **Notes**: This is the foundation for all authenticated screens. Use shadcn/ui Sheet for drawer, DropdownMenu for user menu. Active nav item: Vanilla bg, text-inverse.

### T013: Landing Page
- **Wave**: 1
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T001
- **Estimate**: 5
- **Description**: Build the marketing landing page per UI.md Screen 1: sticky transparent navbar, hero section with Playfair Display heading and Vanilla Custard CTA, Aceternity UI animated dashboard preview (floating cards), 3×2 feature grid, CTA section, footer. All responsive. Lazy-load below-fold sections. LCP target: < 1.5s.
- **Files to create/modify**: `src/app/(marketing)/page.tsx`, `src/app/(marketing)/layout.tsx`, `src/components/landing/Hero.tsx`, `src/components/landing/FeatureGrid.tsx`, `src/components/landing/CTASection.tsx`, `src/components/landing/Navbar.tsx`, `src/components/landing/Footer.tsx`
- **Acceptance Criteria**:
  - [ ] Hero renders with Playfair Display heading + CTA
  - [ ] Feature grid: 6 cards in 3×2 grid (desktop), 2×3 (tablet), 1×6 (mobile)
  - [ ] Aceternity UI floating card animation on dashboard preview
  - [ ] CTA buttons link to /signup
  - [ ] LCP < 1.5s desktop, < 2.5s mobile (measured with Lighthouse)
  - [ ] Below-fold sections lazy-loaded (no Aceternity in initial bundle)
- **Notes**: Code-split aggressively. Aceternity UI + Framer Motion must only load for this route group. Use `next/dynamic` for animated sections.

### T014: Login / Signup Page
- **Wave**: 1
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T001, T009
- **Estimate**: 3
- **Description**: Build login and signup pages per UI.md Screen 2. Centered card layout (max-width 420px), Google SSO button, Microsoft SSO button (placeholder for now), email/password fields, form validation with Zod, error states, loading states, redirect to dashboard on success. Signup includes company name field.
- **Files to create/modify**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/layout.tsx`, `src/components/auth/LoginForm.tsx`, `src/components/auth/SignupForm.tsx`, `src/lib/validations/auth.ts`
- **Acceptance Criteria**:
  - [ ] Login form validates email format + password required
  - [ ] Google SSO button redirects to OAuth flow
  - [ ] Invalid credentials show error: "Invalid email or password"
  - [ ] Successful login redirects to /dashboard
  - [ ] Signup form creates company workspace and redirects to onboarding
  - [ ] Form inputs show Vanilla focus ring on focus
  - [ ] Loading state: button spinner + "Signing in..."
- **Notes**: Use React Hook Form + Zod for validation. Share Zod schemas between client and server. Use `@supabase/ssr` for auth calls.

### T015: Shared Form + Data Display Components
- **Wave**: 1
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T001
- **Estimate**: 5
- **Description**: Build the shared component library (27 components from frontend review). Wrap shadcn/ui primitives with dark theme + brand tokens: TextInput, Textarea, Select, Checkbox, Toggle, Radio, MultiSelect (custom), DatePicker, TimePicker, FileUpload (custom), FormField wrapper, Card, Badge (4 severity variants), Avatar, StatCard, Table (dark + responsive), List, Skeleton, EmptyState, ErrorState, Toast (4 types), Alert, Modal, Drawer, ProgressBar, Tabs, Pagination, DropdownMenu, LinkButton, Button (4 variants + loading).
- **Files to create/modify**: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/checkbox.tsx`, `src/components/ui/switch.tsx`, `src/components/ui/radio-group.tsx`, `src/components/ui/multi-select.tsx`, `src/components/ui/date-picker.tsx`, `src/components/ui/time-picker.tsx`, `src/components/ui/file-upload.tsx`, `src/components/ui/form-field.tsx`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/avatar.tsx`, `src/components/ui/stat-card.tsx`, `src/components/ui/table.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/error-state.tsx`, `src/components/ui/toast.tsx`, `src/components/ui/modal.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/progress-bar.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/pagination.tsx`, `src/components/ui/dropdown-menu.tsx`
- **Acceptance Criteria**:
  - [ ] All 27 components render with dark theme brand tokens
  - [ ] Button: 4 variants (primary/secondary/ghost/danger) with loading + disabled states
  - [ ] Badge: 4 severity colors (honey/brown-red/bordeaux/success)
  - [ ] FileUpload: drag-drop zone, file size validation, progress indicator
  - [ ] FormField: wraps any input with label, required indicator, error message
  - [ ] StatCard: label + value + trend arrow + icon
  - [ ] EmptyState: icon + title + description + optional CTA
  - [ ] All focus states: Vanilla ring-2 ring-offset-2
- **Notes**: Generate shadcn components with `npx shadcn-ui@latest add [component]`. Then customize with brand tokens. Custom components (FileUpload, MultiSelect, StatCard, EmptyState) built from scratch.

### T016: Company Onboarding Wizard
- **Wave**: 1
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T012, T014
- **Estimate**: 5
- **Description**: Build 5-step company onboarding wizard per UX.md Flow 5: Step 1 (company info), Step 2 (invite team via email), Step 3 (configure policies from AI templates), Step 4 (AI settings: threshold slider + dispute toggle), Step 5 (review + activate). Wizard supports: resume from last step, auto-save progress, step indicator, minimum 1 active policy required. On completion, sets `companies.onboarding_completed = true`.
- **Files to create/modify**: `src/app/onboarding/page.tsx`, `src/components/onboarding/OnboardingWizard.tsx`, `src/components/onboarding/StepCompanyInfo.tsx`, `src/components/onboarding/StepInviteTeam.tsx`, `src/components/onboarding/StepConfigurePolicies.tsx`, `src/components/onboarding/StepAISettings.tsx`, `src/components/onboarding/StepReviewActivate.tsx`, `src/lib/validations/onboarding.ts`, `src/app/api/v1/companies/onboarding/route.ts`
- **Acceptance Criteria**:
  - [ ] 5 steps with FormStepIndicator showing progress
  - [ ] Each step validates before allowing "Continue"
  - [ ] Auto-saves progress (resume from last step on return)
  - [ ] Step 3: shows 3 AI policy templates, user selects ≥ 1
  - [ ] Step 4: confidence threshold slider (50-99%, default 90%)
  - [ ] Step 5: plain English summary of "How AI will interpret your policies"
  - [ ] Completion sets `onboarding_completed = true` and redirects to dashboard
- **Notes**: Use Zustand store for wizard form state (auto-saved to localStorage). Policy templates from seed data in T002. The "test panel" from UX.md (preview AI interpretation) is deferred to Wave 3 when AI endpoints exist.

---

## Wave 2: Core Backend (Policies + Incidents + AI Service)

### T017: Policy CRUD API + Rule Engine
- **Wave**: 2
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T008, T010
- **Estimate**: 5
- **Description**: Implement full Policy CRUD API: GET list, GET :id, POST create, PUT update, PATCH toggle active/inactive, DELETE (soft-delete: set is_active=false). Policy rules stored as structured JSONB with schema validation. Conflict detection on activation (overlapping trigger+condition combinations). Version history: on update, create `policy_versions` entry with current content/rules. Policy snapshot: when incident links to policy, store `policy_snapshot` JSONB on incident.
- **Files to create/modify**: `src/app/api/v1/policies/route.ts`, `src/app/api/v1/policies/[id]/route.ts`, `src/app/api/v1/policies/[id]/toggle/route.ts`, `src/lib/validations/policy.ts`, `src/lib/services/policy-service.ts`, `src/lib/services/policy-conflict-detector.ts`
- **Acceptance Criteria**:
  - [ ] POST /policies creates policy with structured JSONB rules
  - [ ] GET /policies returns list filtered by company_id (from session)
  - [ ] PUT /policies/:id creates policy_versions entry before updating
  - [ ] PATCH /policies/:id/toggle activates/deactivates with conflict check
  - [ ] DELETE soft-deletes (is_active=false), never hard delete
  - [ ] Conflict detection: overlapping trigger+condition on activation returns 409
  - [ ] Only company_admin can create/edit/activate policies
- **Notes**: JSONB schema for rules: `{ triggers: [{ type, field, operator, value }], conditions: [{ field, operator, value }], actions: [{ type, escalation_level, document_template }], escalation_ladder: [{ level, action_type }] }`. Validate with Zod.

### T018: Incident Submission API + Status Machine
- **Wave**: 2
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T008, T010, T017
- **Estimate**: 5
- **Description**: Implement incident submission and lifecycle API. POST /incidents: validates employee is direct report of submitter, creates incident with status "ai_evaluating", generates reference_number (INC-YYYY-NNNN), stores policy_snapshot of all active policies. PATCH /incidents/:id/status: state machine transitions (ai_evaluating → ai_evaluated → pending_hr_review → approved → meeting_scheduled → document_delivered → signed / disputed). GET /incidents: queue view with filtering by status, severity, date range. GET /incidents/:id: full detail with AI evaluation. Upload evidence to Supabase Storage.
- **Files to create/modify**: `src/app/api/v1/incidents/route.ts`, `src/app/api/v1/incidents/[id]/route.ts`, `src/app/api/v1/incidents/[id]/status/route.ts`, `src/app/api/v1/incidents/[id]/evidence/route.ts`, `src/lib/validations/incident.ts`, `src/lib/services/incident-service.ts`, `src/lib/services/incident-state-machine.ts`, `src/lib/utils/reference-number.ts`
- **Acceptance Criteria**:
  - [ ] POST /incidents validates reporter is employee's manager, returns 403 if not
  - [ ] POST /incidents creates incident with status "ai_evaluating" and reference_number
  - [ ] Reference number format: INC-YYYY-NNNN, unique per company
  - [ ] PATCH /incidents/:id/status enforces valid state transitions only
  - [ ] Invalid transition returns 409 with allowed next states
  - [ ] GET /incidents supports cursor pagination + filtering
  - [ ] Evidence upload generates signed URL for direct upload to Supabase Storage
  - [ ] `policy_snapshot` JSONB captured at creation from all active policies
- **Notes**: State machine is critical. Define all valid transitions upfront. Each status change should create an audit_log entry via the DB trigger.

### T019: AI Router + Policy Evaluation Endpoint
- **Wave**: 2
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T003, T007
- **Estimate**: 8
- **Description**: Implement the core AI evaluation pipeline in the Python service. Build: (1) Model-agnostic AI router with provider fallback (OpenRouter primary), (2) Policy evaluation engine: takes structured JSONB rules + incident data → deterministic rule matching → LLM-based document generation with confidence scoring, (3) POST /evaluate-incident endpoint: input (incident + employee history + company policies) → output (confidence score, recommendation, matched rule, reasoning), (4) PII stripping layer: sanitize all data before LLM call, (5) Output validation: verify response matches schema, no fabricated policy references, (6) Retry logic with exponential backoff, circuit breaker pattern.
- **Files to create/modify**: `server/app/routers/ai.py` (expand), `server/app/services/ai_router.py`, `server/app/services/policy_engine.py`, `server/app/services/pii_sanitizer.py`, `server/app/services/output_validator.py`, `server/app/services/circuit_breaker.py`, `server/app/prompts/evaluate_incident.py`, `server/app/schemas/evaluation.py`, `server/tests/test_evaluate_incident.py`
- **Acceptance Criteria**:
  - [ ] POST /evaluate-incident accepts incident + history + policies, returns confidence + recommendation
  - [ ] Deterministic rule matching: same input → same matched rule (no LLM for matching)
  - [ ] LLM generates recommendation text with confidence score
  - [ ] PII stripping: no SSN/salary/address/email in any AI payload (verified by test)
  - [ ] Output validation rejects: fabricated policy sections, invalid action types, empty responses
  - [ ] Circuit breaker opens after 3 consecutive failures, auto-recovers after 30s
  - [ ] Retry: 3 attempts with exponential backoff (2s, 4s, 8s)
  - [ ] Per-request cost logging to audit trail
- **Notes**: Key architecture decision from reviews: the policy engine does DETERMINISTIC rule matching (code, not LLM). The LLM only generates the document text and confidence assessment given a matched rule. This prevents the LLM from "deciding" which rule applies.

### T020: AI Document Generation Endpoint
- **Wave**: 2
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T019
- **Estimate**: 5
- **Description**: Implement POST /generate-document endpoint. Input: action type + incident + employee + matched policy rule. Output: generated disciplinary document content with correct policy references (section numbers verified), employee details, incident specifics, required actions and deadlines. Uses the capable model (per spike T007 recommendation). Response includes content hash for tamper detection.
- **Files to create/modify**: `server/app/routers/ai.py` (add endpoint), `server/app/services/document_generator.py`, `server/app/prompts/generate_document.py`, `server/app/schemas/document.py`, `server/tests/test_generate_document.py`
- **Acceptance Criteria**:
  - [ ] Generates document for all 4 action types: verbal warning, written warning, PIP, termination review
  - [ ] Policy references include actual section numbers from matched rule
  - [ ] Employee name and details populated correctly (from sanitized data)
  - [ ] Required actions and deadlines included per policy rules
  - [ ] Content hash (SHA-256) computed and returned with response
  - [ ] Output validation: no fabricated sections, all references resolve to real policy
  - [ ] Latency p95 < 5s
- **Notes**: Document templates should be prompt-engineered per action type. The prompt should include the specific policy section text as context (not just the section number) so the LLM references it accurately.

### T021: AI Meeting Agenda + Summary Endpoints
- **Wave**: 2
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T019
- **Estimate**: 3
- **Description**: Implement POST /generate-agenda and POST /summarize-meeting endpoints. Agenda: input (meeting type + incident + participants + policy) → structured agenda with talking points. Summary: input (meeting type + notes + participants + action items) → structured summary with key points, action items (owner + deadline), follow-up plan. Both use cheaper models per cost optimization rules.
- **Files to create/modify**: `server/app/routers/ai.py` (add 2 endpoints), `server/app/services/agenda_generator.py`, `server/app/services/meeting_summarizer.py`, `server/app/prompts/generate_agenda.py`, `server/app/prompts/summarize_meeting.py`, `server/tests/test_agenda.py`, `server/tests/test_summary.py`
- **Acceptance Criteria**:
  - [ ] POST /generate-agenda returns structured agenda: numbered talking points + policy references
  - [ ] Agenda for PIP/termination includes mandatory sections (expectations, timeline, consequences)
  - [ ] POST /summarize-meeting returns: key discussion points, action items with owners+deadlines, follow-up plan
  - [ ] Both endpoints validate output structure against schema
  - [ ] Both use cheapest capable model (cost optimization)
  - [ ] Latency p95 < 4s for both
- **Notes**: These are lower-risk AI tasks — the LLM is summarizing, not creating legal documents. Quality bar is still high but more forgiving.

### T022: Disciplinary Actions + Document Review API
- **Wave**: 2
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T018, T020
- **Estimate**: 5
- **Description**: Implement disciplinary action CRUD + HR review flow. POST /disciplinary-actions: creates action linked to incident with status "pending_approval". POST /disciplinary-actions/:id/review: HR approve (with optional edits + before/after diff), approve-with-edits (track changes), reject (mandatory reason + next step: regenerate/escalate/close). POST /disciplinary-actions/:id/regenerate: sends feedback to AI for re-generation. Document storage: content stored in documents table with content_hash.
- **Files to create/modify**: `src/app/api/v1/disciplinary-actions/route.ts`, `src/app/api/v1/disciplinary-actions/[id]/route.ts`, `src/app/api/v1/disciplinary-actions/[id]/review/route.ts`, `src/app/api/v1/disciplinary-actions/[id]/regenerate/route.ts`, `src/lib/services/disciplinary-action-service.ts`, `src/lib/services/document-service.ts`
- **Acceptance Criteria**:
  - [ ] POST creates disciplinary action with status "pending_approval"
  - [ ] Review approve: status → "approved", audit log entry with approver
  - [ ] Review approve-with-edits: before/after diff stored in audit trail
  - [ ] Review reject: mandatory reason (min 20 chars), next step required
  - [ ] Regenerate: AI re-processes with HR feedback, new document created
  - [ ] Documents stored with content_hash for tamper detection
  - [ ] Only hr_agent can review/reject/regenerate
- **Notes**: The three-branch reject flow (regenerate/escalate/close) must be implemented carefully. Each branch has different downstream effects.

### T023: Meetings API + Notification Scaffolding
- **Wave**: 2
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T022
- **Estimate**: 3
- **Description**: Implement meetings CRUD API: POST create (auto-identify participants from disciplinary action), PATCH update (notes, AI summary), GET list (upcoming/completed). Create notification service: in-app notifications via `notifications` table + email notifications via Resend (supabase Edge Function or server-side). Key events: incident submitted → notify HR, document approved → notify manager, meeting scheduled → notify participants, document awaiting signature → notify employee, signature received → notify HR.
- **Files to create/modify**: `src/app/api/v1/meetings/route.ts`, `src/app/api/v1/meetings/[id]/route.ts`, `src/app/api/v1/notifications/route.ts`, `src/lib/services/meeting-service.ts`, `src/lib/services/notification-service.ts`, `supabase/functions/send-email/index.ts`
- **Acceptance Criteria**:
  - [ ] POST /meetings creates meeting with participants auto-identified from action
  - [ ] PATCH /meetings/:id stores notes and triggers AI summary
  - [ ] GET /meetings filters by status (upcoming/completed) and company
  - [ ] Notification service creates in-app notification for key events
  - [ ] Email notification sent via Resend for: incident submitted, meeting scheduled
  - [ ] Notifications table has `read` flag and `read_at` timestamp
- **Notes**: Resend integration: create Supabase Edge Function that calls Resend API with template + recipient. Start with 4 key email templates. Reminder escalation (24h/72h/7d) deferred to Wave 4.

### T024: Users + Employees API
- **Wave**: 2
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T008, T010
- **Estimate**: 3
- **Description**: Implement user management API: GET list (paginated, filterable by department/role), GET :id (profile), GET :id/timeline (disciplinary history aggregation), POST invite (email invitation with role), PATCH :id (update profile/role), DELETE (soft-delete: status='deactivated'). Direct reports: GET /users/me/direct-reports returns employees where manager_id = current user. CSV import: POST /users/import with async job pattern.
- **Files to create/modify**: `src/app/api/v1/users/route.ts`, `src/app/api/v1/users/[id]/route.ts`, `src/app/api/v1/users/invite/route.ts`, `src/app/api/v1/users/import/route.ts`, `src/app/api/v1/users/me/route.ts`, `src/app/api/v1/users/me/direct-reports/route.ts`, `src/lib/services/user-service.ts`
- **Acceptance Criteria**:
  - [ ] GET /users returns paginated list filtered by company_id from session
  - [ ] GET /users/:id/timeline aggregates incidents + documents + meetings + signatures chronologically
  - [ ] POST /users/invite sends email invitation and creates user record
  - [ ] GET /users/me returns current user profile
  - [ ] GET /users/me/direct-reports returns employees with manager_id = current user
  - [ ] DELETE sets status to 'deactivated', never hard deletes
  - [ ] Role changes invalidate user sessions
- **Notes**: Timeline aggregation is the most complex query — joins across 4+ tables. Consider a materialized view or pre-computed summary if performance is an issue.

---

## Wave 3: Core Frontend (Screens + Components)

### T025: Policy Builder UI (4-Step Wizard)
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T017, T015
- **Estimate**: 8
- **Description**: Build the Policy Builder per UX.md Flow 5 and UI.md Screen 4. 4-step wizard with FormStepIndicator. Step 1: basic info (title, category, effective date, rich text policy content). Step 2: structured rules with PolicyRuleEditor — add/edit/delete rules with trigger/condition/action fields + drag-and-drop escalation ladder (using @dnd-kit) + conflict detection banner. Step 3: AI settings (threshold override slider, toggles) + AI test panel (preview how AI interprets rules). Step 4: review + activate with plain English summary. Connect to Policy API (T017).
- **Files to create/modify**: `src/app/(dashboard)/policies/new/page.tsx`, `src/app/(dashboard)/policies/[id]/edit/page.tsx`, `src/components/policy/PolicyBuilder.tsx`, `src/components/policy/PolicyRuleEditor.tsx`, `src/components/policy/EscalationLadder.tsx`, `src/components/policy/ConflictBanner.tsx`, `src/components/policy/AITestPanel.tsx`, `src/components/policy/PolicyReview.tsx`, `src/stores/policy-wizard-store.ts`
- **Acceptance Criteria**:
  - [ ] 4 steps with FormStepIndicator, navigation with validation gates
  - [ ] PolicyRuleEditor: add/edit/delete rules with trigger/condition/action dropdowns
  - [ ] EscalationLadder: drag-and-drop reorder, add/remove levels
  - [ ] ConflictBanner: shows when rules overlap, links to resolution
  - [ ] AITestPanel: sends sample scenario to /evaluate-incident, shows prediction
  - [ ] Review step: plain English summary of AI interpretation
  - [ ] Save as Draft + Activate Policy buttons
  - [ ] Connects to Policy API (T017) for create/update
- **Notes**: This is the most complex frontend component. The PolicyRuleEditor + EscalationLadder DnD is 3-4 days alone. Use @dnd-kit/core + @dnd-kit/sortable. Start with a simplified version: no drag-drop for MVP, use arrow buttons for reorder.

### T026: Report Issue Form (4-Step Multi-Step Form)
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T018, T015
- **Estimate**: 5
- **Description**: Build the Report Issue form per UX.md Flow 1 and UI.md Screen 5. 4-step wizard: Step 1 (select employee from direct reports + issue type grid), Step 2 (date picker + severity radio + description textarea with guided prompts), Step 3 (evidence file upload + witness multi-select + union toggle), Step 4 (review summary + attestation checkbox + submit). Auto-save to localStorage every 30s. Connect to Incident API (T018).
- **Files to create/modify**: `src/app/(dashboard)/incidents/new/page.tsx`, `src/components/incidents/ReportIssueWizard.tsx`, `src/components/incidents/StepSelectEmployee.tsx`, `src/components/incidents/StepIncidentDetails.tsx`, `src/components/incidents/StepEvidence.tsx`, `src/components/incidents/StepReviewSubmit.tsx`, `src/components/incidents/IssueTypeGrid.tsx`, `src/stores/report-issue-store.ts`
- **Acceptance Criteria**:
  - [ ] Step 1: employee search (filtered to direct reports from API), issue type visual grid
  - [ ] Step 2: date (defaults today, ≤ today), severity with descriptions, description (10-2000 chars)
  - [ ] Step 3: file upload (drag-drop, max 10MB), witness picker, union toggle
  - [ ] Step 4: review summary with edit links, attestation checkbox required
  - [ ] Auto-save to localStorage every 30s, resume on return
  - [ ] Submit creates incident, shows success screen with reference number
  - [ ] Network failure: "Saved as draft" toast
- **Notes**: Use Zustand store for form state. Employee picker should prefetch direct reports on mount and filter client-side with debounce. Issue type grid: visual 2×4 grid with icons, not a dropdown.

### T027: Incident Queue + Dashboard Home (HR Agent)
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T018, T012, T015
- **Estimate**: 5
- **Description**: Build the HR Agent Incident Queue per UI.md Screen 6 (tab-based: AI Review / Manual / Approved / All, filterable card list with severity-colored left borders, AI confidence bars, Load More pagination) and Dashboard Home per UI.md Screen 3 (4 StatCards, pending reviews list, upcoming meetings, recent activity). Role-adaptive dashboard: also build Manager Dashboard (report CTA + team + my reports) and Employee Dashboard (pending docs + signed docs).
- **Files to create/modify**: `src/app/(dashboard)/incidents/page.tsx`, `src/app/(dashboard)/page.tsx`, `src/components/incidents/IncidentQueue.tsx`, `src/components/incidents/IncidentCard.tsx`, `src/components/dashboard/HRDashboard.tsx`, `src/components/dashboard/ManagerDashboard.tsx`, `src/components/dashboard/EmployeeDashboard.tsx`, `src/components/dashboard/StatCardGrid.tsx`, `src/components/dashboard/PendingReviews.tsx`, `src/components/dashboard/UpcomingMeetings.tsx`, `src/components/dashboard/RecentActivity.tsx`, `src/hooks/use-dashboard-stats.ts`
- **Acceptance Criteria**:
  - [ ] Incident Queue: tabs filter by status, cards show severity + AI confidence + policy match
  - [ ] Cards have severity-colored left borders (honey/brown-red/bordeaux)
  - [ ] AI confidence bar fills proportionally with color based on threshold
  - [ ] Load More pagination with cursor
  - [ ] Dashboard adapts per role: HR (queue + stats), Manager (reports + team), Employee (docs)
  - [ ] StatCards show pending counts, trend arrows, and link to filtered views
  - [ ] Data fetched via TanStack Query with staleTime: 30s
- **Notes**: Dashboard is data-fetching heavy but interaction-light. Use TanStack Query for all data. StatCards should show real-time counts. Consider Supabase Realtime for badge count updates.

### T028: AI Document Review (Three-Panel)
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T022, T005, T012
- **Estimate**: 8
- **Description**: Build the AI Document Review screen per UX.md Flow 2 and UI.md Screen 7. Three-panel layout (desktop: 40/30/30, laptop: 50/50 tabs, tablet: stacked, mobile: full-width tabs). Left: editable document with Tiptap track-changes (from spike T005). Center: employee timeline with prior incidents. Right: AI reasoning (confidence breakdown, matched rule, alternatives, what-if). Bottom: sticky action bar (Approve / Approve with Edits / Reject). Reject opens modal with mandatory reason + next step radio.
- **Files to create/modify**: `src/app/(dashboard)/incidents/[id]/review/page.tsx`, `src/components/review/DocumentReview.tsx`, `src/components/review/ReviewLeftPanel.tsx`, `src/components/review/ReviewCenterPanel.tsx`, `src/components/review/ReviewRightPanel.tsx`, `src/components/review/ReviewActionBar.tsx`, `src/components/review/RejectModal.tsx`, `src/components/review/EmployeeTimeline.tsx`, `src/components/review/AIReasoning.tsx`, `src/components/review/ConfidenceBreakdown.tsx`, `src/components/domain/AIConfidenceIndicator.tsx`, `src/hooks/use-review.ts`
- **Acceptance Criteria**:
  - [ ] Three-panel layout renders correctly at all 4 breakpoints
  - [ ] Left panel: document editable with track-changes (Tiptap)
  - [ ] Center panel: employee timeline with prior incidents and milestones
  - [ ] Right panel: AI reasoning with confidence breakdown bar + alternatives
  - [ ] Approve: confirmation modal → status change → meeting prompt
  - [ ] Approve with Edits: track changes → log diff → save
  - [ ] Reject: modal with required reason (min 20 chars) + next step choice
  - [ ] All three panels load independently (Suspense boundaries per panel)
  - [ ] Panels skeleton during loading (no blank screens)
- **Notes**: Most complex frontend screen. Use React Suspense for independent panel loading. Each panel fetches its own data via TanStack Query. Track-changes depends on spike T005 outcome — fallback to diff-view if Tiptap doesn't work.

### T029: Meeting Scheduler + Summary Screens
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T023, T015
- **Estimate**: 5
- **Description**: Build Meeting Scheduler (UI.md Screen 8) and Meeting Summary (UI.md Screen 9). Scheduler: single-column form with auto-identified participants, AI-generated editable agenda, date/time picker, external meeting link field. Summary: two-panel layout — left (editable AI summary with sections: key points, action items, follow-up) + right (read-only original notes). Finalize button sends summary to employee.
- **Files to create/modify**: `src/app/(dashboard)/meetings/new/page.tsx`, `src/app/(dashboard)/meetings/[id]/page.tsx`, `src/app/(dashboard)/meetings/[id]/summary/page.tsx`, `src/components/meetings/MeetingScheduler.tsx`, `src/components/meetings/MeetingSummary.tsx`, `src/components/meetings/AgendaEditor.tsx`, `src/components/meetings/ParticipantList.tsx`, `src/components/meetings/NotesEditor.tsx`, `src/hooks/use-meeting.ts`
- **Acceptance Criteria**:
  - [ ] Scheduler: participants auto-populated from disciplinary action
  - [ ] AI agenda generates on load (skeleton while loading), editable
  - [ ] Date/time picker with calendar widget
  - [ ] Meeting link field (external URL)
  - [ ] Summary: two-panel layout, AI summary editable on left, notes read-only on right
  - [ ] "Finalize & Send to Employee" button creates document + notification
  - [ ] Action items have owner + deadline fields
- **Notes**: Meeting occurs externally (Zoom/Teams/Meet). Platform only manages metadata, notes, and AI summary. The AI summary should render as structured sections (not a blob of text).

### T030: Employee Portal + Document Signing
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T022, T015
- **Estimate**: 8
- **Description**: Build Employee Portal (UI.md Screen 10) and Document Signing (UI.md Screen 11). Portal: card-based pending documents list + signed documents list. Signing: full document render, "View referenced policy" side panel, acknowledgment checkbox, ESignatureCanvas (draw + type modes), Dispute button (if enabled), confirmation modal with legal language. ESignatureCanvas: HTML5 Canvas drawing with Vanilla stroke, typed signature with font selector, undo, clear, touch support.
- **Files to create/modify**: `src/app/(dashboard)/documents/page.tsx`, `src/app/(dashboard)/documents/[id]/sign/page.tsx`, `src/components/documents/PendingDocumentList.tsx`, `src/components/documents/SignedDocumentList.tsx`, `src/components/documents/DocumentViewer.tsx`, `src/components/signatures/ESignatureCanvas.tsx`, `src/components/signatures/SignatureModeSelector.tsx`, `src/components/signatures/DisputeForm.tsx`, `src/components/signatures/AcknowledgmentCheckbox.tsx`, `src/stores/signature-store.ts`, `src/components/domain/PolicyReferenceLink.tsx`
- **Acceptance Criteria**:
  - [ ] Portal: pending docs with CTA buttons, signed docs with checkmarks
  - [ ] Signing: full document renders in readable format
  - [ ] "View referenced policy" opens drawer with policy text
  - [ ] Acknowledgment checkbox required before signing
  - [ ] ESignatureCanvas: draw mode with smooth strokes, type mode with font selector
  - [ ] Canvas supports touch devices with appropriate stroke width
  - [ ] Clear and undo buttons functional
  - [ ] Dispute button visible only when company dispute_enabled=true
  - [ ] Dispute form requires min 50 chars, routes to HR queue
  - [ ] Confirmation modal: "This is legally binding under ESIGN/UETA"
  - [ ] Signature captures: IP, timestamp, user agent, SHA-256 content hash
  - [ ] Signed document becomes immutable (append-only)
- **Notes**: ESignatureCanvas is the most complex custom component. If spike T006 identified legal issues with custom engine, this task pivots to DocuSign integration. Signature data (drawn: base64 image, typed: string + font) sent to API for hash computation.

### T031: Notification Bell + In-App Notifications
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T023, T012
- **Estimate**: 3
- **Description**: Build the notification system UI. NotificationBell in header with unread badge count. Dropdown panel with notification list (unread: Vanilla left border, read: no border). Each notification links to its entity (incident, meeting, document). "Mark all read" button. Connect to notifications API. Consider Supabase Realtime subscription for live updates.
- **Files to create/modify**: `src/components/domain/NotificationBell.tsx`, `src/components/notifications/NotificationPanel.tsx`, `src/components/notifications/NotificationItem.tsx`, `src/hooks/use-notifications.ts`
- **Acceptance Criteria**:
  - [ ] Bell icon shows unread count badge (max "99+")
  - [ ] Dropdown shows recent notifications with entity links
  - [ ] Unread notifications have Vanilla left border, read are dim
  - [ ] "Mark all read" sets all to read
  - [ ] Clicking notification navigates to entity (incident, meeting, document)
  - [ ] Badge count updates on new notifications (polling or Realtime)
- **Notes**: Start with polling (every 30s). Supabase Realtime can be added as an enhancement if the polling approach causes UX issues.

### T032: User Management + Employee Timeline Screens
- **Wave**: 3
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T024, T015
- **Estimate**: 3
- **Description**: Build team management screens: user list (table with role badges, department filter), user detail (profile + disciplinary timeline), invite user form, employee CSV import (file upload + validation + progress). Employee timeline: chronological display of all incidents, documents, meetings, signatures for a given employee.
- **Files to create/modify**: `src/app/(dashboard)/team/page.tsx`, `src/app/(dashboard)/team/[id]/page.tsx`, `src/app/(dashboard)/team/invite/page.tsx`, `src/components/team/UserList.tsx`, `src/components/team/UserDetail.tsx`, `src/components/team/InviteForm.tsx`, `src/components/team/EmployeeTimeline.tsx`, `src/components/team/CSVImport.tsx`
- **Acceptance Criteria**:
  - [ ] User list: table with name, role, department, status; filter by role/department
  - [ ] User detail: profile card + disciplinary timeline
  - [ ] Invite form: email + role selector, sends invitation
  - [ ] CSV import: file upload, validation errors displayed, progress bar
  - [ ] Timeline: chronological list of all events (incidents, documents, meetings)
- **Notes**: Timeline component is reusable for the HR review center panel (T028).

---

## Wave 4: Integration & Edge Cases

### T033: End-to-End AI Pipeline Integration
- **Wave**: 4
- **Type**: [S]
- **Role**: @dev-backend-developer
- **Depends on**: T019, T020, T021, T022
- **Estimate**: 5
- **Description**: Wire the complete AI pipeline: incident created → Next.js BFF calls Python /evaluate-incident → confidence score stored → if ≥ threshold, auto-calls /generate-document → document stored → status updates → notification to HR. Implement the BFF proxy routes in Next.js that call the Python service with the shared API key. Implement the async job pattern: submit → poll for AI result → complete. Handle all degradation modes: AI down → manual queue, cost cap → disabled, rate limit → queued.
- **Files to create/modify**: `src/app/api/v1/ai/evaluate/route.ts`, `src/app/api/v1/ai/generate-document/route.ts`, `src/app/api/v1/ai/generate-agenda/route.ts`, `src/app/api/v1/ai/summarize-meeting/route.ts`, `src/lib/services/ai-proxy-service.ts`, `src/lib/services/degradation-handler.ts`
- **Acceptance Criteria**:
  - [ ] Incident submission triggers AI evaluation automatically
  - [ ] BFF proxies to Python service with API key auth
  - [ ] Confidence ≥ threshold → auto-generates document → HR queue
  - [ ] Confidence < threshold → manual review queue without document
  - [ ] AI service down → incident routes to manual queue with "AI unavailable" badge
  - [ ] All 5 degradation modes from PRD Section 17 work correctly
  - [ ] Cost tracking per tenant logged to audit trail
- **Notes**: This is the integration glue that makes all the AI pieces work together. The BFF never exposes the Python service URL or API key to the browser.

### T034: Feature Flags System
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T017
- **Estimate**: 2
- **Description**: Implement the feature flag system from PRD Section 17. Flags stored in `companies.settings.feature_flags` JSONB. Create utility functions: `isFeatureEnabled(companyId, flagName)`, `setFeatureFlag(companyId, flagName, enabled)`, `getFeatureFlags(companyId)`. Phase 1 flags: ai_auto_generate, ai_meeting_summary, employee_dispute, microsoft_sso, e_signature_v2. All AI flags default to false (dark launch).
- **Files to create/modify**: `src/lib/services/feature-flag-service.ts`, `src/lib/feature-flags.ts`
- **Acceptance Criteria**:
  - [ ] Feature flags read from companies.settings JSONB
  - [ ] `isFeatureEnabled()` returns boolean with default fallback
  - [ ] All AI flags default to false
  - [ ] Flags checkable in both Next.js API routes and React components
  - [ ] Admin can toggle flags per company via Settings API
- **Notes**: Simple JSONB-based approach for Phase 1. No third-party service needed.

### T035: Progressive Discipline Logic
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T019, T024
- **Estimate**: 5
- **Description**: Implement progressive discipline tracking. When a new incident is evaluated: (1) Query employee's prior incidents of same type, (2) Count prior actions by escalation level, (3) Apply company policy escalation ladder (Level 1→2→3→4), (4) Pass full history to AI for context, (5) If employee has active PIP → flag for termination review regardless of confidence, (6) Store previous_incident_count on new incident. The AI receives the escalation context but doesn't decide the level — deterministic code does.
- **Files to create/modify**: `src/lib/services/progressive-discipline-service.ts`, `server/app/services/escalation_engine.py`
- **Acceptance Criteria**:
  - [ ] Employee with 0 priors → AI recommends Level 1 (verbal warning)
  - [ ] Employee with 1 verbal warning + same type → Level 2 (written warning)
  - [ ] Employee with active PIP + new incident → termination review flag (mandatory)
  - [ ] previous_incident_count stored on each new incident
  - [ ] Full incident history passed to AI evaluation
  - [ ] HR Agent sees highlighted prior actions in review panel
  - [ ] Escalation ladder per company policy respected
- **Notes**: The escalation engine is deterministic code, not AI. The AI generates the document text, but the escalation level is computed from the policy rules + employee history.

### T036: Signature Reminder Escalation
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T023, T030
- **Estimate**: 3
- **Description**: Implement the signature reminder escalation chain. Cron job (or Supabase Edge Function scheduled): check unsigned documents. At 24h: send email + in-app reminder to employee. At 72h: send escalated email to employee + manager. At 7d: send urgent email to employee + manager + HR, mark document as "overdue." Update document status to "overdue" after 7 days.
- **Files to create/modify**: `supabase/functions/reminder-check/index.ts`, `src/lib/services/reminder-service.ts`
- **Acceptance Criteria**:
  - [ ] 24h: email + notification to employee "Reminder: Document awaiting your signature"
  - [ ] 72h: escalated email to employee + manager "Action Required"
  - [ ] 7d: urgent email to employee + manager + HR "URGENT: Document overdue"
  - [ ] Document status updates to "overdue" at 7d mark
  - [ ] No duplicate reminders (track sent timestamps)
  - [ ] Cron runs every hour, checks all pending documents
- **Notes**: Use Supabase pg_cron or a scheduled Edge Function. Track reminder_sent_at timestamps on the document or a separate table to prevent duplicates.

### T037: Microsoft SSO Integration
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T009
- **Estimate**: 3
- **Description**: Add Microsoft SSO via Azure Entra ID. Configure Supabase Auth Microsoft provider with Azure app registration. Implement callback handler. Verify `tid` (tenant ID) claim for enterprise accounts. Map SSO user to internal user record. Test end-to-end login flow.
- **Files to create/modify**: Supabase dashboard configuration, `src/app/auth/callback/route.ts` (expand), `src/lib/auth/sso.ts`
- **Acceptance Criteria**:
  - [ ] Microsoft SSO button on login page redirects to Microsoft login
  - [ ] Callback creates user record with correct company_id
  - [ ] Enterprise accounts verified (reject personal Microsoft accounts if configured)
  - [ ] MFA enrollment still required for admin/manager roles
- **Notes**: Requires Azure portal configuration (app registration, redirect URIs, admin consent). Start this in Wave 1 (Azure registration) even though code is Wave 4.

### T038: AI Cost Controls + Per-Tenant Budget
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-backend-developer
- **Depends on**: T033
- **Estimate**: 3
- **Description**: Implement AI cost tracking and enforcement. Per-request: log token count, model used, estimated cost to audit_log with entity_type='ai_cost'. Per-tenant: monthly budget cap in companies.settings.ai_monthly_budget_usd (default $50). Daily aggregation: check cumulative spend. At 80%: alert Super Admin. At 100%: disable AI features for tenant, route all incidents to manual queue. Reset monthly. Cost optimization rules: incident eval → cheapest model, doc gen → capable model, summaries → mid-tier, agendas → cheapest.
- **Files to create/modify**: `server/app/services/cost_tracker.py`, `server/app/services/budget_enforcer.py`, `src/lib/services/cost-monitor-service.ts`
- **Acceptance Criteria**:
  - [ ] Every AI API call logs: token count, model, estimated cost, tenant ID
  - [ ] Monthly spend aggregated per tenant
  - [ ] 80% threshold triggers notification to Super Admin
  - [ ] 100% threshold disables AI features for that tenant
  - [ ] AI disabled → all incidents route to manual HR queue
  - [ ] Cost resets at month boundary
  - [ ] Cost optimization: correct model per task type
- **Notes**: This is a financial safeguard. Without it, a single tenant with heavy usage could create unlimited AI costs.

### T039: Company Settings + Admin Screens
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T012, T015, T034
- **Estimate**: 3
- **Description**: Build Company Admin settings screens: AI Configuration (confidence threshold slider, cost budget), Employee Options (dispute toggle, notification preferences), Feature Flags (toggle per-flag with descriptions), Integrations (SSO status, API keys placeholder). Super Admin: platform command center (tenant list, health, AI performance summary).
- **Files to create/modify**: `src/app/(dashboard)/settings/page.tsx`, `src/app/(dashboard)/settings/ai/page.tsx`, `src/app/(dashboard)/settings/employees/page.tsx`, `src/app/(dashboard)/settings/features/page.tsx`, `src/app/(dashboard)/settings/integrations/page.tsx`, `src/app/(admin)/page.tsx`
- **Acceptance Criteria**:
  - [ ] AI Config: threshold slider (50-99%), monthly budget input
  - [ ] Employee Options: dispute toggle with clear description
  - [ ] Feature Flags: list of flags with on/off toggles and descriptions
  - [ ] Changes save to companies.settings JSONB
  - [ ] Super Admin: sees all tenants with basic health metrics
- **Notes**: Settings screens are straightforward forms. The key complexity is reading/writing the JSONB settings column correctly.

### T040: Audit Log Viewer (Super Admin + Company Admin)
- **Wave**: 4
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T012, T015
- **Estimate**: 2
- **Description**: Build audit log viewer for Super Admin (all tenants) and Company Admin (own tenant). Table view with filters: date range, user, action type, entity type. Paginated with cursor. Read-only (append-only table). Export to CSV.
- **Files to create/modify**: `src/app/(admin)/audit-log/page.tsx`, `src/app/(dashboard)/settings/audit-log/page.tsx`, `src/components/audit/AuditLogTable.tsx`, `src/app/api/v1/audit-log/route.ts`
- **Acceptance Criteria**:
  - [ ] Table shows: timestamp, user, action, entity type, entity ID, details
  - [ ] Filter by date range, user, action type, entity type
  - [ ] Paginated with cursor
  - [ ] Super Admin sees all tenants, Company Admin sees own tenant only
  - [ ] Export to CSV downloads filtered results
  - [ ] Read-only: no edit/delete actions available
- **Notes**: Audit log is critical for compliance (SOC 2, HIPAA). The API endpoint must have strict RLS.

---

## Wave 5: Polish, Testing & Deploy

### T041: E2E Tests — 5 Critical User Journeys
- **Wave**: 5
- **Type**: [S]
- **Role**: @dev-testing-engineer
- **Depends on**: T033, T030
- **Estimate**: 8
- **Description**: Write Playwright E2E tests for the 5 critical user flows from UX.md: (1) Manager submits issue end-to-end, (2) HR reviews and approves document, (3) Meeting scheduling + AI summary, (4) Employee signs document, (5) Admin configures policy. Each flow tests happy path + key error states. Pre-login storage state for each role. Use factory functions for test data.
- **Files to create/modify**: `e2e/flows/manager-submit-issue.spec.ts`, `e2e/flows/hr-review-document.spec.ts`, `e2e/flows/meeting-scheduling.spec.ts`, `e2e/flows/employee-sign-document.spec.ts`, `e2e/flows/admin-configure-policy.spec.ts`, `e2e/fixtures/auth.setup.ts`, `e2e/fixtures/test-data.ts`, `playwright.config.ts`
- **Acceptance Criteria**:
  - [ ] Flow 1: Manager selects employee → fills 4 steps → submits → sees reference number
  - [ ] Flow 2: HR opens review → three-panel renders → approves → status changes
  - [ ] Flow 3: Schedule meeting → AI agenda generates → add notes → AI summary → finalize
  - [ ] Flow 4: Employee views document → acknowledges → signs → confirmation
  - [ ] Flow 5: Admin creates policy → adds rules → AI test panel → activates
  - [ ] Auth setup: pre-login for all 5 roles
  - [ ] All 5 flows pass in < 60 seconds total
- **Notes**: Use Playwright's `storageState` for pre-authenticated sessions. Mock AI responses for deterministic tests (VCR cassettes from T004 pattern).

### T042: Responsive Design Pass (All 11 Screens)
- **Wave**: 5
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T025-T032
- **Estimate**: 5
- **Description**: Test and fix all 11 screens at all 4 breakpoints (desktop ≥1280, laptop 1024-1279, tablet 768-1023, mobile <768). Focus areas: three-panel review on tablet/mobile, e-signature canvas on touch devices, multi-step forms on mobile, sidebar collapse behavior, table → card view switching, notification panel on mobile.
- **Files to create/modify**: Various component files as needed
- **Acceptance Criteria**:
  - [ ] All 11 screens functional and usable at all 4 breakpoints
  - [ ] Three-panel review: tabs with swipe on mobile
  - [ ] E-signature canvas: touch-friendly stroke width, orientation change warning
  - [ ] Multi-step forms: bottom-fixed "Continue" button on mobile
  - [ ] Tables switch to card views on tablet
  - [ ] No horizontal scroll on any screen at any breakpoint
  - [ ] Touch targets ≥ 44×44px on all interactive elements
- **Notes**: This is a dedicated responsive pass, not incremental. Fix all issues in one sweep.

### T043: Accessibility Audit + Fixes
- **Wave**: 5
- **Type**: [P]
- **Role**: @dev-frontend-developer
- **Depends on**: T025-T032
- **Estimate**: 5
- **Description**: Accessibility audit of all 11 screens against WCAG 2.1 Level AA. Test: keyboard navigation for all flows, screen reader (NVDA/VoiceOver) for critical paths, color contrast verification (all text meets 4.5:1), focus management on route changes and modals, ARIA labels on dynamic content, reduced motion support. Fix all issues found.
- **Files to create/modify**: Various component files as needed
- **Acceptance Criteria**:
  - [ ] All 11 screens navigable by keyboard only
  - [ ] Focus management: modals trap focus, return on close
  - [ ] Screen reader: AI results announced, form errors announced
  - [ ] Color contrast: all text ≥ 4.5:1 against dark backgrounds
  - [ ] Reduced motion: all animations replaced with instant changes
  - [ ] ARIA labels on all custom components (canvas, timeline, confidence bars)
  - [ ] axe-core automated scan: 0 violations on all screens
- **Notes**: Run axe-core as part of E2E tests. Manual screen reader testing on at least the signing flow and incident submission flow.

### T044: Security Review + Pen Test Prep
- **Wave**: 5
- **Type**: [S]
- **Role**: @dev-security-engineer
- **Depends on**: T008, T033, T038
- **Estimate**: 5
- **Description**: Comprehensive security review of the complete application. (1) SAST scan on all code (CodeQL/Semgrep), (2) Dependency vulnerability check (npm audit + pip audit), (3) Cross-tenant isolation verification (run T004 test suite), (4) Auth/authorization verification (all 5 roles × key endpoints), (5) Input validation audit (all form endpoints), (6) AI prompt injection testing (extraction, override, exfiltration attempts), (7) PII masking verification (intercept AI calls, verify no PII), (8) Rate limiting verification. Document findings and remediate critical/high issues.
- **Files to create/modify**: Security findings documented, fixes applied to relevant files
- **Acceptance Criteria**:
  - [ ] SAST scan: 0 critical, 0 high findings
  - [ ] Dependency audit: 0 critical, 0 high CVEs
  - [ ] Cross-tenant test suite passes (0 leakage across 14 tables)
  - [ ] RBAC: all 5 roles verified against all endpoint domains
  - [ ] Prompt injection: all 4 attack types blocked
  - [ ] PII masking: verified no PII in AI payloads
  - [ ] Rate limiting: 429 returned at configured thresholds
  - [ ] Document: security findings + remediation report
- **Notes**: This is the final security gate before production. Any critical findings must be fixed before proceeding to deployment.

### T045: Performance Audit + Optimization
- **Wave**: 5
- **Type**: [P]
- **Role**: @dev-performance-engineer
- **Depends on**: T033, T030
- **Estimate**: 5
- **Description**: Performance audit of all 11 screens and key API endpoints. Measure: LCP/FID/CLS per screen, API response times (p50/p95/p99) per endpoint category, bundle size per route. Verify against budgets from performance review. Fix any violations. Specific checks: AI call doesn't block page render, Aceternity UI isolated to marketing route, ESignatureCanvas lazy-loaded, three-panel Suspense boundaries working, Playfair Display preloaded.
- **Files to create/modify**: Various files as needed for optimization
- **Acceptance Criteria**:
  - [ ] All screens meet LCP budgets (from performance review)
  - [ ] CRUD endpoints p95 < 500ms
  - [ ] AI endpoints p95 < 5s
  - [ ] Dashboard bundle < 150KB gzipped
  - [ ] Employee portal bundle < 80KB gzipped
  - [ ] Landing page bundle < 200KB gzipped
  - [ ] No Framer Motion in dashboard/employee bundles
  - [ ] Document: performance report with all measurements
- **Notes**: Use `@next/bundle-analyzer` for bundle size analysis. Use Vercel Speed Insights for production CWV. Set up `pg_stat_statements` for slow query monitoring.

### T046: CI/CD Pipeline + Deployment Automation
- **Wave**: 5
- **Type**: [S]
- **Role**: @dev-devops-engineer
- **Depends on**: T041, T044
- **Estimate**: 5
- **Description**: Set up the complete CI/CD pipeline per DevOps review. `ci.yml`: lint + format + type check + unit tests (frontend + backend) + integration tests + migration check + security scan + build. `deploy.yml`: deploy backend (Railway) → run migrations (Supabase) → deploy frontend (Vercel) → smoke tests. Configure: Vercel project, Railway environment, Supabase staging + production links. Production promotion runbook documented.
- **Files to create/modify**: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `railway.json`, `vercel.json`, `docs/deployment-runbook.md`
- **Acceptance Criteria**:
  - [ ] CI pipeline runs on every PR with all stages passing
  - [ ] Unit tests: Vitest (frontend) + pytest (backend) with coverage gates
  - [ ] Integration tests: RLS verification + API contract tests
  - [ ] Security scan: npm audit + pip audit blocks on high/critical
  - [ ] Deploy pipeline: backend → migrations → frontend → smoke tests
  - [ ] Smoke tests: /health endpoint, auth flow, sample AI call
  - [ ] Staging auto-deploys on main merge
  - [ ] Production deployment is manual promotion from staging
- **Notes**: The CI pipeline is the quality gate. No merge without all checks passing. RLS test suite runs on every PR that touches migrations.

### T047: Final Integration Verification
- **Wave**: 5
- **Type**: [S]
- **Role**: @dev-testing-engineer
- **Depends on**: T041, T044, T045
- **Estimate**: 5
- **Description**: Final integration verification before production. Run the complete test suite: all unit tests (~300), all integration tests (~80), all E2E tests (~30). Verify the complete pipeline: manager submits → AI evaluates → HR reviews → meeting scheduled → notes + summary → employee signs → audit trail complete. Test with the golden dataset (50+ scenarios). Verify all P0 acceptance criteria from PRD Section 6.
- **Files to create/modify**: Test files, `tests/golden-dataset/` scenarios, `docs/test-report.md`
- **Acceptance Criteria**:
  - [ ] Unit tests: ≥ 250 passing, ≥ 70% coverage frontend, ≥ 80% backend
  - [ ] Integration tests: ≥ 60 passing, including full RLS matrix
  - [ ] E2E tests: all 5 critical flows passing
  - [ ] Golden dataset: ≥ 95% accuracy on evaluate-incident, 0% fabrication
  - [ ] Full pipeline test: submit → evaluate → review → meeting → sign → audit verified
  - [ ] All 16 P0 FR acceptance criteria verified passing
  - [ ] Document: final test report with coverage and results
- **Notes**: This is the ship gate. All tests must pass. Any P0 test failure blocks production deployment.

### T048: Production Deployment + Monitoring Setup
- **Wave**: 5
- **Type**: [S]
- **Role**: @dev-devops-engineer
- **Depends on**: T046, T047
- **Estimate**: 3
- **Description**: Execute production deployment per the runbook. (1) Configure production Supabase project with all migrations, (2) Deploy Python service to Railway production, (3) Deploy Next.js to Vercel production, (4) Configure production environment variables, (5) Set up Sentry for error monitoring, (6) Configure Vercel Speed Insights, (7) Set up Supabase pg_stat_statements, (8) Run production smoke tests, (9) Verify all 5 degradation modes work, (10) Document rollback plan.
- **Files to create/modify**: `docs/production-deployment-checklist.md`, `docs/rollback-plan.md`, monitoring configuration files
- **Acceptance Criteria**:
  - [ ] Production Supabase: all migrations applied, RLS enabled, storage buckets created
  - [ ] Production Railway: Python service running, /health returns 200
  - [ ] Production Vercel: Next.js deployed, landing page loads
  - [ ] Sentry: error monitoring capturing events
  - [ ] Speed Insights: CWV metrics flowing
  - [ ] Smoke tests pass against production
  - [ ] Rollback plan tested and documented
  - [ ] All AI feature flags OFF in production (dark launch)
- **Notes**: All AI features start disabled in production. Enable for HR partner pilot per the gradual rollout plan from PRD Section 17.

---

## Risk Register

| Task | Risk | Probability | Impact | Mitigation |
|------|------|------------|--------|------------|
| T005 | Tiptap track-changes doesn't work well or is too expensive | Medium | High | Fallback to diff-view (side-by-side) for MVP |
| T006 | Legal review says custom e-signature not enforceable | Medium | Critical | Pivot to DocuSign integration (+5 days) |
| T007 | Open-source models can't produce legal-grade documents | High | High | Budget for larger/commercial model on document generation |
| T008 | RLS policies have subtle bugs allowing cross-tenant access | Low | Critical | Automated test suite runs on every PR |
| T019 | AI evaluation latency exceeds 5s on cold start | Medium | Medium | Keep-alive pings, Railway "always on" ($5/mo) |
| T025 | PolicyRuleEditor drag-and-drop too complex for MVP | Medium | Low | Simplify to arrow-button reorder, no drag-drop |
| T028 | Three-panel review too heavy for mobile | High | Low | Graceful degradation to tabbed view |
| T030 | E-signature canvas performance on low-end devices | Medium | Medium | Lazy-load, cap canvas resolution, hash in Web Worker |
| T041 | E2E tests flaky due to AI response variability | High | Medium | Mock all AI responses with VCR cassettes |
| T046 | CI/CD pipeline takes > 15 minutes | Medium | Low | Parallelize test stages, cache aggressively |

## Spike Tasks

| Spike | Purpose | Time-box | Outcome Needed |
|-------|---------|----------|----------------|
| T004 | RLS + RBAC test matrix | 5 days | Automated cross-tenant test suite as CI gate |
| T005 | Rich text editor with track changes | 5 days | Tiptap feasibility decision + prototype |
| T006 | E-signature legal feasibility | 3 days | Legal compliance checklist + custom vs. DocuSign decision |
| T007 | AI model evaluation + prompt architecture | 3 days | Model selection per task + prompt architecture + cost benchmarks |

---

*End of TASKS.md*
