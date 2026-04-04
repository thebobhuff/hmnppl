# Codebase Scout Report: AI HR Platform

> **Scout Date:** 2026-03-29
> **Feature Slug:** `ai-hr-platform`
> **Status:** GREENFIELD — No application code exists. Only `REQUIREMENTS.md` in `ai_docs/ai-hr-platform/`.

---

## Tech Stack

### Required — Declared in Requirements

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Frontend Framework | Next.js (App Router) | 14.x+ (latest stable) | **Not installed** |
| Language (Frontend) | TypeScript | 5.x | **Not installed** |
| Language (Backend) | Python | 3.11+ | **Not installed** |
| Backend Framework | FastAPI (recommended) | 0.100+ | **Not installed** |
| Database | Supabase (PostgreSQL) | Latest hosted | **Not provisioned** |
| Auth | Supabase Auth | Latest | **Not configured** |
| UI Components | Aceternity UI + shadcn/ui | Latest | **Not installed** |
| Charts | EvilCharts | Latest | **Not installed** |
| Font | Playfair Display (Google Fonts) | — | **Not configured** |
| Hosting (Frontend) | Vercel | — | **Not linked** |
| AI/LLM Routing | Hugging Face + OpenRouter | — | **Not configured** |
| SSO Providers | Google OAuth, Microsoft (Azure Entra ID) | — | **Not configured** |
| CSS Framework | Tailwind CSS | 3.x | **Not installed** |

### Required — Implied by Architecture

| Layer | Technology | Purpose | Status |
|-------|-----------|---------|--------|
| API Client | TanStack Query (React Query) or SWR | Data fetching & caching | **Not installed** |
| Forms | React Hook Form + Zod | Form validation | **Not installed** |
| State Management | Zustand or Jotai | Client-side state | **Not installed** |
| ORM/DB Client | Supabase JS Client | Database access | **Not installed** |
| Python HTTP Client | httpx | Python → AI provider calls | **Not installed** |
| Python DB Driver | asyncpg or SQLAlchemy async | Python DB access (if needed) | **Not installed** |
| Email Service | Resend, SendGrid, or Supabase Edge Functions | Transactional email | **Not installed** |
| File Storage | Supabase Storage | Evidence attachments, documents | **Not configured** |
| E-signature | Custom canvas-based engine | Document signing | **Must be built** |

---

## Project Structure

### Current State

```
F:/Projects/HumanResourcesPlatform/
└── ai_docs/
    └── ai-hr-platform/
        └── REQUIREMENTS.md          ← Only file in the project
```

### Proposed Structure (To Be Created)

```
F:/Projects/HumanResourcesPlatform/
├── .github/                          # CI/CD, PR templates, ADR index
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test
│       └── deploy.yml                # Vercel + Python service deploy
├── .env.local                        # Local env vars (gitignored)
├── .env.example                      # Template for required env vars
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── next.config.ts                    # Next.js App Router config
├── tailwind.config.ts                # Custom palette: Dark Slate Grey, Vanilla Custard, etc.
├── tsconfig.json
├── postcss.config.mjs
├── package.json
├── components.json                   # shadcn/ui config
│
├── public/
│   ├── fonts/
│   │   └── PlayfairDisplay-*.woff2   # Self-hosted Playfair Display
│   ├── images/
│   │   └── logo.svg, og-image.png
│   └── favicon.ico
│
├── src/
│   ├── app/                          # Next.js App Router — routes & layouts
│   │   ├── (marketing)/              # Route group: public landing page
│   │   │   ├── layout.tsx            # Landing page layout (no sidebar)
│   │   │   ├── page.tsx              # Landing page (/)
│   │   │   └── pricing/page.tsx
│   │   ├── (auth)/                   # Route group: auth pages
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts     # SSO callback handler
│   │   ├── (dashboard)/              # Route group: authenticated app
│   │   │   ├── layout.tsx            # Dashboard layout (sidebar, header)
│   │   │   ├── overview/page.tsx     # Dashboard home
│   │   │   ├── incidents/            # Incident management
│   │   │   │   ├── page.tsx          # List view
│   │   │   │   ├── new/page.tsx      # Submit issue (manager flow)
│   │   │   │   └── [id]/page.tsx     # Incident detail
│   │   │   ├── discipline/           # Disciplinary actions
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── meetings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── policies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── employees/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── company/
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── onboarding/page.tsx
│   │   │   └── admin/                # Super Admin routes
│   │   │       └── tenants/page.tsx
│   │   ├── (employee-portal)/        # Route group: employee-facing
│   │   │   ├── layout.tsx            # Lightweight employee layout
│   │   │   ├── documents/page.tsx    # Documents to sign
│   │   │   └── documents/[id]/page.tsx  # Sign document
│   │   ├── api/                      # Next.js API Routes (BFF layer)
│   │   │   ├── auth/                 # Auth helpers
│   │   │   ├── incidents/
│   │   │   ├── discipline/
│   │   │   ├── documents/
│   │   │   ├── signatures/
│   │   │   ├── meetings/
│   │   │   ├── policies/
│   │   │   └── ai/                   # Proxy to Python AI service
│   │   ├── layout.tsx                # Root layout (providers)
│   │   └── globals.css               # Tailwind + custom CSS vars
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   │   ├── aceternity/               # Aceternity UI components
│   │   ├── landing/                  # Landing page sections
│   │   ├── dashboard/                # Dashboard shell (sidebar, header)
│   │   ├── incidents/                # Incident-specific components
│   │   ├── discipline/               # Discipline-specific components
│   │   ├── meetings/                 # Meeting-specific components
│   │   ├── documents/                # Document viewer/editor
│   │   ├── signatures/               # E-signature canvas component
│   │   ├── policies/                 # Policy builder components
│   │   ├── charts/                   # EvilCharts wrappers
│   │   └── shared/                   # Cross-cutting components
│   │
│   ├── lib/                          # Core utilities
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   ├── server.ts            # Server-side Supabase client
│   │   │   ├── middleware.ts         # Auth middleware helper
│   │   │   └── admin.ts             # Service-role client (server only)
│   │   ├── ai/                       # AI service client
│   │   │   ├── client.ts            # HTTP client to Python AI service
│   │   │   └── types.ts             # AI request/response types
│   │   ├── auth/
│   │   │   ├── roles.ts             # Role definitions & helpers
│   │   │   ├── permissions.ts       # Permission checks
│   │   │   └── middleware.ts        # Route protection
│   │   ├── db/
│   │   │   ├── types.ts             # Generated Supabase types
│   │   │   └── queries/             # Typed query helpers
│   │   ├── utils.ts                  # General utilities (cn, formatDate, etc.)
│   │   └── constants.ts              # App-wide constants
│   │
│   ├── hooks/                        # Custom React hooks
│   ├── stores/                       # Zustand stores (if used)
│   ├── types/                        # Shared TypeScript types
│   │   ├── api.ts                    # API request/response types
│   │   ├── models.ts                 # Domain models
│   │   └── enums.ts                  # Enumerations
│   └── styles/                       # Additional styles if needed
│
├── supabase/                         # Supabase local development
│   ├── config.toml                   # Supabase project config
│   ├── migrations/                   # SQL migration files (versioned)
│   │   ├── 00001_create_companies.sql
│   │   ├── 00002_create_departments.sql
│   │   ├── 00003_create_users.sql
│   │   ├── 00004_create_policies.sql
│   │   ├── 00005_create_incidents.sql
│   │   ├── 00006_create_disciplinary_actions.sql
│   │   ├── 00007_create_meetings.sql
│   │   ├── 00008_create_documents.sql
│   │   ├── 00009_create_signatures.sql
│   │   └── 00010_enable_rls_policies.sql
│   ├── seed.sql                      # Development seed data
│   └── functions/                    # Supabase Edge Functions
│       └── send-email/              # Email notification function
│
├── server/                           # Python AI backend
│   ├── pyproject.toml                # Python project config
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                    # Container for deployment
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry
│   │   ├── config.py                 # Settings (from env vars)
│   │   ├── deps.py                   # Dependency injection
│   │   ├── routers/
│   │   │   ├── evaluate.py           # POST /evaluate-incident
│   │   │   ├── generate.py           # POST /generate-document
│   │   │   ├── summarize.py          # POST /summarize-meeting
│   │   │   ├── agenda.py             # POST /generate-agenda
│   │   │   └── health.py             # GET /health
│   │   ├── services/
│   │   │   ├── ai_router.py          # Model-agnostic AI routing
│   │   │   ├── providers/
│   │   │   │   ├── huggingface.py
│   │   │   │   └── openrouter.py
│   │   │   ├── policy_engine.py      # Policy interpretation
│   │   │   ├── confidence.py         # Confidence scoring
│   │   │   └── document_gen.py       # Document generation
│   │   ├── models/
│   │   │   ├── incident.py           # Pydantic models
│   │   │   ├── policy.py
│   │   │   └── document.py
│   │   └── prompts/                  # AI prompt templates
│   │       ├── evaluate_incident.py
│   │       ├── generate_warning.py
│   │       ├── generate_pip.py
│   │       ├── summarize_meeting.py
│   │       └── generate_agenda.py
│   └── tests/
│       ├── test_evaluate.py
│       ├── test_generate.py
│       └── test_policy_engine.py
│
├── docs/                             # Project documentation
│   ├── adr/                          # Architecture Decision Records
│   │   ├── README.md                 # ADR index
│   │   ├── ADR-0001-python-hosting-strategy.md
│   │   ├── ADR-0002-ai-provider-abstraction.md
│   │   └── ADR-0003-esignature-approach.md
│   └── architecture/
│       ├── system-context.md
│       └── data-model.md
│
├── ai_docs/                          # AI-generated project docs
│   └── ai-hr-platform/
│       ├── REQUIREMENTS.md           # Already exists
│       └── CODE_SCOUT.md             # This file
│
└── README.md
```

---

## Existing Patterns

### Current State: GREENFIELD

**No application code exists.** The repository contains only the `REQUIREMENTS.md` document. All patterns, conventions, and infrastructure must be established from scratch.

### Patterns to Establish

| Area | Recommended Pattern | Rationale |
|------|-------------------|-----------|
| **Routing** | Next.js App Router with route groups | `(marketing)`, `(auth)`, `(dashboard)`, `(employee-portal)` for layout isolation |
| **Data Fetching** | Server Components by default; client-side via TanStack Query | Minimize JS bundle; cache aggressively on server |
| **Auth Flow** | Supabase Auth + middleware.ts for route protection | Supabase handles session; middleware enforces per-route auth |
| **Multi-tenancy** | Supabase RLS policies scoped to `company_id` | Every query auto-filters by tenant via RLS; no manual filtering |
| **API Layer** | Next.js API Routes as BFF; Python FastAPI for AI | Frontend never calls Python directly; Next.js proxies AI requests |
| **AI Calls** | Async job pattern for AI generation (queue → process → notify) | AI generation takes 2-5s; use polling or SSE for status |
| **Forms** | React Hook Form + Zod schemas | Type-safe validation; Zod schemas shared between client/server |
| **State** | Server state via TanStack Query; minimal client state via Zustand | Most state lives in the DB; client state only for UI (modals, filters) |
| **Error Handling** | Error boundaries per route group; structured error responses | Graceful degradation; consistent error format across API |
| **Testing** | Vitest (unit) + Playwright (E2E) + pytest (Python) | Fast unit tests; real browser E2E; Python service tests |
| **CSS/Styling** | Tailwind CSS with custom design tokens from color palette | Utility-first; custom theme maps to the 5-color palette |
| **Components** | shadcn/ui for primitives; Aceternity UI for animated showcases | shadcn for accessible, composable base; Aceternity for visual impact |

---

## Reusable Components & Services

> Nothing exists yet. This table catalogues what needs to be built or installed.

| Component/Service | Location (Planned) | Relevance | Priority |
|-------------------|-------------------|-----------|----------|
| **Supabase Client (browser)** | `src/lib/supabase/client.ts` | Auth state, realtime, DB queries from client | P0 |
| **Supabase Client (server)** | `src/lib/supabase/server.ts` | Server Component data fetching with cookies | P0 |
| **Auth Middleware** | `src/middleware.ts` | Route protection, role-based redirects | P0 |
| **Role/Permission System** | `src/lib/auth/roles.ts`, `permissions.ts` | 5-tier RBAC (super_admin → employee) | P0 |
| **Landing Page Sections** | `src/components/landing/` | Hero, features, CTA, footer | P0 |
| **Dashboard Shell** | `src/components/dashboard/` | Sidebar, header, breadcrumbs, notifications | P0 |
| **Incident Form** | `src/components/incidents/` | Multi-step issue submission (manager flow) | P0 |
| **AI Document Viewer** | `src/components/documents/` | View, edit, approve AI-generated documents | P0 |
| **E-Signature Canvas** | `src/components/signatures/` | Draw/typed signature capture with audit data | P0 |
| **Policy Builder** | `src/components/policies/` | Structured rule editor for policy configuration | P0 |
| **Meeting Scheduler** | `src/components/meetings/` | Schedule 3-way meetings, AI agenda display | P0 |
| **Employee Timeline** | `src/components/employees/` | Unified employee record view (incidents + docs + meetings) | P0 |
| **AI Service Client** | `src/lib/ai/client.ts` | HTTP client to Python AI backend | P0 |
| **Python AI Router** | `server/app/services/ai_router.py` | Model-agnostic routing (HF/OpenRouter) | P0 |
| **Policy Engine** | `server/app/services/policy_engine.py` | Interpret rules, evaluate incidents | P0 |
| **Confidence Scorer** | `server/app/services/confidence.py` | Calculate AI confidence for auto-vs-escalate decision | P0 |
| **Notification Service** | `supabase/functions/send-email/` | Email notifications for incidents, documents, meetings | P0 |
| **Audit Logger** | DB triggers + `src/lib/audit.ts` | Log all sensitive actions with user/IP/timestamp | P0 |
| **Database Migrations** | `supabase/migrations/` | Versioned schema changes | P0 |
| **RLS Policies** | `supabase/migrations/00010_enable_rls_policies.sql` | Multi-tenant data isolation | P0 |

---

## Architecture Constraints

### Hard Constraints (Non-Negotiable per Requirements)

1. **Next.js App Router** — Must use the App Router (not Pages Router). All routes under `src/app/`.
2. **Supabase as sole database** — PostgreSQL via Supabase. RLS for multi-tenancy. No secondary databases.
3. **Vercel hosting for frontend** — Next.js deploys to Vercel. Build-time and serverless execution only.
4. **Python backend** — AI processing must run in Python. **Cannot run natively on Vercel.** Requires separate hosting (see Open Questions below).
5. **UI libraries locked** — Aceternity UI + shadcn/ui + EvilCharts + Playfair Display font. No substitutions.
6. **Color palette locked** — Dark Slate Grey (base), Vanilla Custard (accent), Honey Bronze (secondary), Brown Red (alerts), Night Bordeaux (danger).
7. **AI model-agnostic** — Must not couple to a single provider. Abstract via routing layer.
8. **Multi-tenant isolation** — Strict data isolation via RLS. No cross-tenant data leakage, ever.
9. **Compliance by design** — SOC 2, HIPAA, GDPR, CCPA, EEOC must be architecturally supported from Phase 1.

### Technical Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| Vercel has no Python runtime | Python backend must be hosted separately | Deploy Python to Railway, Render, or AWS Lambda; Next.js proxies via API routes |
| Supabase Row Level Security | Every table needs `company_id` column and RLS policy | Include in all migrations; test with multi-tenant fixtures |
| Serverless cold starts | Python AI service may have latency on first request | Use keep-alive pings; consider always-on for minimal hosting |
| Supabase free tier limits | 500MB DB, 1GB storage, 50K monthly active users | Monitor usage; plan for paid tier before production |
| E-signature legal validity | Custom engine needs to meet ESIGN Act + UETA | Implement tamper evidence, audit trail, IP logging, identity verification |
| AI latency | Document generation may take 2-5s | Use async pattern: submit → poll/SSE → complete |
| Large file attachments | Evidence files may be large | Supabase Storage with signed URLs; enforce size limits |

---

## Integration Points

### Phase 1 Integrations (Must Build)

```
┌──────────────────────────────────────────────────────────────────┐
│                        SYSTEM CONTEXT                            │
│                                                                  │
│  ┌─────────┐     ┌──────────────┐     ┌──────────────────────┐  │
│  │ Browser  │────▶│  Next.js     │────▶│  Supabase            │  │
│  │ (User)   │     │  (Vercel)    │     │  - PostgreSQL DB     │  │
│  └─────────┘     │              │     │  - Auth (SSO/Email)   │  │
│                   │  - SSR/RSC   │     │  - Storage (files)   │  │
│  ┌─────────┐     │  - API BFF   │     │  - Edge Functions    │  │
│  │ Mobile   │────▶│  - Middleware│     │  - Realtime          │  │
│  │ Browser  │     └──────┬───────┘     └──────────────────────┘  │
│  └─────────┘             │                                       │
│                          │ HTTP (internal API)                    │
│                          ▼                                       │
│                   ┌──────────────┐     ┌──────────────────────┐  │
│                   │  Python AI   │────▶│  Hugging Face API    │  │
│                   │  (FastAPI)   │     ├──────────────────────┤  │
│                   │              │────▶│  OpenRouter API       │  │
│                   └──────────────┘     └──────────────────────┘  │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │ Azure Entra ID   │◀────│  Next.js (SSO callback)          │  │
│  │ (Microsoft SSO)  │     │  Python (account provisioning)   │  │
│  └──────────────────┘     └──────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │ Google OAuth     │◀────│  Next.js (SSO callback)          │  │
│  └──────────────────┘     └──────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │ Email Provider   │◀────│  Supabase Edge Functions          │  │
│  │ (Resend/SendGrid)│     │  (notification triggers)         │  │
│  └──────────────────┘     └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### API Contract Points

| Integration | Direction | Protocol | Auth Method |
|------------|-----------|----------|-------------|
| Browser → Next.js | Inbound | HTTPS | Cookie (Supabase session) |
| Next.js → Supabase DB | Outbound | PostgreSQL (Supabase client) | Service role key (server) / RLS (client) |
| Next.js → Supabase Auth | Outbound | Supabase SDK | Anon key + session |
| Next.js → Python AI | Outbound | HTTPS REST | Internal API key / JWT validation |
| Python → Hugging Face | Outbound | HTTPS REST | HF API token |
| Python → OpenRouter | Outbound | HTTPS REST | OpenRouter API key |
| Next.js → Azure Entra ID | Outbound | OAuth 2.0 / OIDC | Client ID + secret |
| Next.js → Google OAuth | Outbound | OAuth 2.0 | Client ID + secret |
| Supabase Edge Fn → Email Provider | Outbound | HTTPS REST | Provider API key |

---

## Technical Risks

### Critical Risks

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|-----------|
| R1 | **Python hosting architecture unclear** — Vercel does not natively support Python. The separation between Next.js (Vercel) and Python AI service must be designed upfront. | **Certain** | Critical | Decide hosting strategy (Railway, Render, AWS Lambda, Fly.io) before any Python code is written. Write ADR. |
| R2 | **Custom e-signature engine legal validity** — Building a legally enforceable e-signature engine is non-trivial. ESIGN Act and UETA requirements include intent to sign, consent, attribution, and record retention. | High | Critical | Consult legal counsel. Implement all ESIGN/UETA requirements. Fallback plan: integrate DocuSign/HelloSign if custom engine is insufficient. |
| R3 | **RLS policy complexity** — Multi-tenant data isolation via Supabase RLS requires careful policy design. Incorrect policies can leak data across tenants. | High | Critical | Write RLS policies with explicit tests. Create integration tests that verify cross-tenant isolation. Review policies before every migration. |
| R4 | **AI confidence scoring reliability** — The decision to auto-act vs. escalate depends on confidence scoring. An unreliable scorer could either spam HR with false escalations or auto-generate incorrect documents. | Medium | Critical | Default to conservative (90% threshold). Log all confidence scores. Monitor HR override rate as a quality signal. |

### High Risks

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|-----------|
| R5 | **Scope creep** — Requirements document is comprehensive (27+ functional requirements across 3 phases). Phase 1 must be strictly scoped. | High | High | Phase 1 = Auth + Landing + Discipline/Counseling ONLY. Ship each module complete before starting next. |
| R6 | **AI provider reliability** — Hugging Face and OpenRouter are the primary AI providers. API availability, rate limits, and model quality are outside our control. | Medium | High | Implement retry logic, fallback provider chain, circuit breaker. Monitor provider uptime. |
| R7 | **Supabase free tier limitations** — Phase 1 may work on free tier, but production use will require paid plans. DB size, storage, and MAU limits may be hit quickly. | Medium | Medium | Monitor usage weekly. Plan migration to Supabase Pro ($25/mo) before onboarding first paying client. |
| R8 | **EvilCharts maturity** — EvilCharts is a less established charting library. May lack features or have compatibility issues with Next.js App Router. | Medium | Medium | Spike evaluation early. Fallback: Recharts or Nivo if EvilCharts proves insufficient. |

### Open Architectural Questions

1. **Python hosting strategy** — Where does the Python FastAPI service run? Options:
   - **Railway** (recommended): Simple deploy, good cold start, $5/mo base
   - **Render**: Similar to Railway, free tier available
   - **AWS Lambda** (via Mangum): Cheaper at low volume, cold start penalty
   - **Fly.io**: Good for always-on, Docker-based
   
2. **Real-time notifications** — Should incident status updates use Supabase Realtime (WebSocket) or polling?
   - Recommendation: Supabase Realtime for MVP; it's already included

3. **Document storage format** — Should AI-generated documents be stored as:
   - HTML (rendered in browser, easy to edit)
   - Markdown (portable, versionable)
   - PDF (final format only, generated on signature)
   - Recommendation: Markdown in DB → rendered HTML for viewing → PDF export on final signature

4. **File attachment strategy** — Evidence files need secure upload and access:
   - Supabase Storage with signed URLs (recommended)
   - Pre-signed S3 URLs (if Supabase Storage limits hit)

---

## Recommendations

### 1. Project Initialization (Day 1)

```bash
# 1. Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Install shadcn/ui
npx shadcn@latest init

# 3. Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install zustand
npm install date-fns
npm install lucide-react          # Icons (shadcn uses this)

# 4. Install Aceternity UI
npm install framer-motion clsx tailwind-merge
# (Copy Aceternity components as needed — they're copy-paste)

# 5. Initialize Python project
mkdir server && cd server
python -m venv .venv
pip install fastapi uvicorn httpx pydantic pydantic-settings python-dotenv
```

### 2. Establish These ADRs Before Coding

| ADR | Decision Needed |
|-----|----------------|
| ADR-0001 | Python hosting strategy (Railway vs Render vs Lambda vs Fly.io) |
| ADR-0002 | AI provider abstraction layer design |
| ADR-0003 | E-signature engine approach (custom vs integrate) |
| ADR-0004 | Document storage format (Markdown/HTML/PDF) |
| ADR-0005 | Notification architecture (Realtime vs polling vs both) |
| ADR-0006 | Multi-tenant session management strategy |

### 3. Build Order (Phase 1)

```
Week 1: Foundation
├── Next.js project setup (config, Tailwind theme, fonts)
├── Supabase project creation + initial migrations
├── Auth setup (email/password + Google SSO)
├── Middleware for route protection
├── Dashboard shell layout (sidebar, header)
└── Landing page (hero, features, CTA)

Week 2: Core Module — Incidents & Policies
├── Database migrations (all Phase 1 tables + RLS)
├── Policy CRUD (Company Admin creates policies)
├── Incident submission form (Manager flow)
├── Employee list/detail views
└── Incident list/detail views

Week 3: AI Integration
├── Python FastAPI service scaffold
├── AI router (HuggingFace + OpenRouter abstraction)
├── Policy engine (interpret rules → structured output)
├── Incident evaluation endpoint (POST /evaluate-incident)
├── Document generation endpoint (POST /generate-document)
├── Meeting agenda generation (POST /generate-agenda)
└── Meeting summary generation (POST /summarize-meeting)

Week 4: Document & Signing Flow
├── AI-generated document review UI (HR Agent)
├── Meeting scheduling UI
├── Meeting notes + AI summary UI
├── Document delivery to employee portal
├── E-signature canvas component
├── Signature audit trail (IP, timestamp, user agent)
└── Dispute flow (if enabled)

Week 5: Polish & Ship
├── Email notifications (Supabase Edge Functions)
├── Audit logging (DB triggers + application-level)
├── Microsoft SSO (Azure Entra ID)
├── Company onboarding wizard
├── Employee CSV import
├── Responsive design pass
├── E2E tests for critical flows
└── Deploy to production
```

### 4. Tailwind Theme Configuration

The custom palette must be established in `tailwind.config.ts` before any UI work:

```typescript
// tailwind.config.ts — Color tokens to establish
{
  theme: {
    extend: {
      colors: {
        'slate-grey': {
          50:  '#e8ecef',
          100: '#c8d3d7',
          200: '#9fb0b7',
          300: '#768d97',
          400: '#4d6a77',
          500: '#344f5a',
          600: '#2d454e',
          700: '#223d44',
          800: '#1a2f35',
          900: '#111e22',
          950: '#0a1215',
        },
        'vanilla': {
          50:  '#fffef0',
          100: '#fffbd9',
          200: '#fff8a8',
          300: '#ffe866',
          400: '#ffdd33',
          500: '#ffd900',  // Primary accent
          600: '#e6c300',
          700: '#b39800',
          800: '#806d00',
          900: '#4d4100',
        },
        'honey': {
          50:  '#fef6e8',
          100: '#fce8c5',
          200: '#f8d08b',
          300: '#eabe7b',
          400: '#e0a84a',
          500: '#db9224',  // Secondary accent
          600: '#c07c1a',
          700: '#9a6214',
          800: '#74480e',
          900: '#4e2f09',
        },
        'brown-red': {
          50:  '#fce8e8',
          100: '#f7c5c6',
          200: '#ef9a9b',
          300: '#e47071',
          400: '#d94e50',
          500: '#c93638',  // Alert
          600: '#a82d2f',
          700: '#872425',
          800: '#661b1c',
          900: '#451213',
        },
        'bordeaux': {
          50:  '#fee8e8',
          100: '#fcc5c5',
          200: '#f89a9b',
          300: '#f46f70',
          400: '#f04445',
          500: '#e21d24',  // Danger/critical
          600: '#c4181e',
          700: '#9e1318',
          800: '#780e12',
          900: '#52090c',
          950: '#3a0608',
        },
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
      },
    },
  },
}
```

### 5. Supabase RLS Pattern

Every table must follow this pattern for multi-tenant isolation:

```sql
-- Example: Incidents table RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Users can only see incidents from their own company
CREATE POLICY "Users can view own company incidents"
  ON incidents FOR SELECT
  USING (company_id = (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Super admins can see all
CREATE POLICY "Super admins can view all incidents"
  ON incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Managers can only report incidents for their direct reports
CREATE POLICY "Managers can create incidents for direct reports"
  ON incidents FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND employee_id IN (
      SELECT id FROM users WHERE manager_id = auth.uid()
    )
  );
```

### 6. Python AI Service API Contract

The Next.js BFF layer communicates with the Python service via these endpoints:

```
POST /api/v1/evaluate-incident
  Body: { incident, employee_history, company_policies }
  Response: { confidence, recommendation, suggested_action, reasoning }

POST /api/v1/generate-document
  Body: { action_type, incident, employee, policy_references, company_settings }
  Response: { document_content, document_type, metadata }

POST /api/v1/generate-agenda
  Body: { meeting_type, incident, participants, policy_references }
  Response: { agenda_items, suggested_duration, talking_points }

POST /api/v1/summarize-meeting
  Body: { meeting_type, notes, participants, action_items }
  Response: { summary, key_points, action_items, follow_up_plan }

GET /api/v1/health
  Response: { status: "ok", models_available: [...] }
```

### 7. Key Design Decisions for Implementation Team

1. **Start with Supabase local development** — Use `supabase init` and `supabase start` for local PostgreSQL + Auth + Storage. This enables offline development and versioned migrations.

2. **Use Server Components aggressively** — Default to RSC for data fetching. Only add `"use client"` when interactivity is needed (forms, modals, signatures).

3. **TypeScript strict mode** — Enable `strict: true` in `tsconfig.json`. Generate Supabase types with `supabase gen types` for end-to-end type safety.

4. **Test multi-tenancy first** — Before building any UI, verify RLS policies with multiple test tenants. Data leakage is the #1 risk.

5. **AI prompts are code** — Store all AI prompts in `server/app/prompts/` as versioned, testable modules. Never inline prompts in business logic.

6. **E-signature is a build, not an install** — The custom e-signature engine requires: canvas capture, typed signature option, timestamp + IP logging, tamper evidence (hash chain), and an audit trail table. Budget significant time for this.

7. **Error monitoring from day 1** — Install Sentry (or equivalent) during project setup. AI service errors, RLS policy failures, and auth issues will be hard to debug without observability.

---

## Summary

This is a **greenfield project** with a comprehensive requirements document and zero existing code. The implementation team must:

1. **Decide Python hosting first** (ADR-0001) — this is the biggest architectural unknown
2. **Establish the project scaffold** — Next.js, Tailwind theme, Supabase project, Python service
3. **Build infrastructure before features** — Migrations, RLS policies, auth, middleware, dashboard shell
4. **Implement Phase 1 module-by-module** — Auth → Landing → Policies → Incidents → AI → Documents → Signing
5. **Test multi-tenancy continuously** — RLS is the security backbone; every feature must verify tenant isolation

The requirements document is thorough and well-structured. The main risks are the Python hosting strategy, e-signature legal validity, and AI confidence scoring reliability — all of which should be validated with spikes before committing to implementation.
