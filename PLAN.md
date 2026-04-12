# HMNPPL Platform Plan
> Generated: 2026-04-12
> Source: Codebase analysis + Lijo Joseph transcripts + Market Research

## Executive Summary

HMNPPL is an AI-first HR ERP focused on employee discipline and counseling. The codebase is mature (48/48 tasks complete, 247 story points) with NextJS 15 + FastAPI + Supabase. The market gap is massive: **no competitor offers AI-powered discipline workflows or autonomous AI agents.**

## Market Position

### Competitive Landscape (Key Players)
| Platform | Pricing | AI Level | Discipline | Weakness |
|----------|---------|----------|------------|----------|
| **UKG** | Custom ($45+/emp/mo) | Basic chatbot | None | Outdated UI, complex setup |
| **Workday** | Custom | "Agent System of Record" (new) | None | Long implementation, expensive |
| **Rippling** | Custom | AI assistant (glorified search) | None | Hidden fees, complex |
| **BambooHR** | $6-8/emp/mo | None | None | Basic, limited features |
| **HiBob** | $8+/emp/mo | Basic AI | None | Surface-level AI |
| **Lattice** | $11/seat/mo | AI for performance only | Basic PIP (not discipline) | Narrow focus |
| **Personio** | Custom (€8-15/emp/mo) | Basic | None | Europe-focused |
| **Gusto** | $40+/mo | None | None | No performance management |

### Our Moat
1. **Only AI-powered discipline workflows** in the market
2. **Autonomous AI agents** (not chatbots) — agents take action, not just suggest
3. **Configurable policy engine** feeding company rules directly to AI
4. **Custom e-signature engine** (competitors use third-party)
5. **Dark premium UI** — deliberate contrast to competitors' light/friendly themes

### Target Market
- **Primary**: Mid-market companies (200-5000 employees)
- **Buyer**: HR VP / HR Directors
- **Users**: HR agents (daily), managers (weekly), employees (rarely)

## Current Codebase Status

### What's Built (Phase 1 MVP — 100%)
- Multi-tenant auth (email, Google SSO, Microsoft SSO)
- 5-tier RBAC (Super Admin, Company Admin, HR Agent, Manager, Employee)
- 21 Supabase migrations (14 tables, full RLS, audit triggers)
- Policy engine (CRUD, conflict detection, versioning)
- AI pipeline (incident evaluation → document generation → HR review)
- PII sanitizer (strips SSN, salary, address before AI calls)
- E-signature engine (canvas drawing + typed, SHA-256 tamper evidence)
- Progressive discipline tracking
- Three-way meeting management (scheduling, AI agendas, summaries)
- Employee portal (document viewing, signing, dispute)
- Marketing landing page
- Onboarding wizard (5-step)
- Dashboard analytics
- CI/CD (GitHub Actions → Vercel + Railway)

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | NextJS 15, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| Backend | Python FastAPI 0.110+ |
| Database | Supabase (PostgreSQL) with RLS |
| AI | OpenRouter + Hugging Face (model-agnostic) |
| Auth | Supabase Auth |
| Hosting | Vercel (frontend) + Railway (backend) |
| Testing | Vitest + Playwright + pytest |

## Gaps: Lijo's Requirements vs Current Code

### From the Lijo Joseph Interviews

#### 🔴 Critical Missing Features
1. **Manager Coaching Agent** — Agent should coach managers on tone, empathy, firmness before/during discipline conversations
2. **Same vs New Issue Detection** — Agent must discern if this is a repeat offense or a completely different issue
3. **Training Gap Detection** — Agent asks "What training have they had?" and suggests relevant training
4. **Problem Manager Detection** — Dashboard that identifies managers with high incident rates (maybe it's the manager, not the employees)
5. **Organization Health Dashboard** — Stage-gate view of all disciplinary actions, pattern recognition across org

#### 🟡 Important Missing Features
6. **State-Specific Termination Paperwork** — Auto-generate Cal/OSHA, COBRA, separation notices by state
7. **Continuous Improvement Feedback Loop** — "5 designers with onboarding issues → maybe training sucks"
8. **Auto-Escalation for Safety/Legal** — Safety violations, violence, financial impropriety bypass agent entirely → auto-escalate to HR
9. **Agent Challenges Managers** — Agent doesn't roll over; challenges "I want them terminated tomorrow" with appropriate pushback
10. **Protected Class Guardrails** — Agent avoids documenting protected class info (discoverable risk)

#### 🟢 Design Direction Conflict
- **Current**: Dark premium theme (dark slate, vanilla custard yellow)
- **Lijo wants**: Warm/cool tones, soft, rounded edges, "soft landing" feel
- **Recommendation**: Keep dark premium as default, add warm/soft option in settings. Dark premium is our differentiator per market research.

## Recommended Roadmap

### Wave 6: Lijo Feature Gap (4-6 weeks)
**Priority: Close gaps from partner interviews**

| ID | Feature | Estimate | Priority |
|----|---------|----------|----------|
| L-001 | Manager Coaching Agent (prompt engineering + new agent) | 8pts | P0 |
| L-002 | Same vs New Issue Detection (agent logic) | 5pts | P0 |
| L-003 | Training Gap Detection (new agent + training tracker) | 5pts | P0 |
| L-004 | Problem Manager Detection (dashboard + analytics) | 8pts | P0 |
| L-005 | Organization Health Dashboard (pattern recognition) | 8pts | P0 |
| L-006 | State-Specific Termination Paperwork (document templates) | 13pts | P1 |
| L-007 | Continuous Improvement Feedback (AI insights) | 5pts | P1 |
| L-008 | Auto-Escalation for Safety/Legal (routing logic) | 3pts | P0 |
| L-009 | Agent Pushback Logic (manager coaching enhancement) | 5pts | P1 |
| L-010 | Protected Class Guardrails (PII sanitizer extension) | 3pts | P0 |

**Total: ~63 story points (~4-6 weeks solo, ~3 weeks team of 3)**

### Wave 7: Polish & Partner Testing (2-3 weeks)
- Deploy to staging for Lijo testing
- Integrate feedback from 2 beta testers
- Fine-tune AI coaching prompts to match Lijo's consultation style
- State paperwork templates (CA, TX, NY — start with 3 states)
- Security hardening (CSRF tokens, rate limiting, pen test prep)

### Wave 8: Go-to-Market Prep (2-3 weeks)
- Pricing page and billing integration (Stripe)
- Sales deck / demo environment
- API documentation for ERP integrations
- UKG/Workday data export format support
- Landing page A/B testing setup

### Wave 9+: Phase 2 Features (ongoing)
- AI Recruiting (JD generation, posting, screening, scheduling)
- Onboarding Orchestration (offer letters, ID/tax, Azure Entra ID)
- Benefits Management (enrollment, life events)
- Performance Reviews (360 feedback, AI summaries, goals)
- AI Coaching & Development
- Embedded Video Conferencing

## Pricing Strategy (Recommendation)

Based on market research:

| Tier | Price | Target | Features |
|------|-------|--------|----------|
| **Starter** | $8/employee/month | Small (50-200) | Discipline workflows, policy engine, e-signature |
| **Professional** | $15/employee/month | Mid (200-1000) | + Manager coaching, analytics, state paperwork |
| **Enterprise** | Custom | Large (1000+) | + API access, SSO, dedicated support, custom integrations |

**Why this pricing:**
- HiBob charges $8+/emp/mo and has NO discipline features
- BambooHR charges $6-8/emp/mo — basic HRIS only
- Lattice charges $11/seat/mo — performance only
- Our autonomous AI + discipline workflows justify premium pricing
- Minimum $4,000/year (matching Personio floor)

## Technical Debt & TODOs

| ID | Item | Priority |
|----|------|----------|
| SEC-007 | CSRF tokens for state-changing mutations | High |
| SEC-008 | Rate limiting on auth endpoints | High |
| SEC-011 | Third-party penetration testing | High |
| AI-007 | Connect frontend mock data to real API calls | Medium |
| PERF-001 | React Server Components for data-heavy pages | Medium |
| TEST-001 | Run Playwright E2E tests | Medium |

## Immediate Next Steps

1. **This week**: Start Wave 6 — build Manager Coaching Agent (L-001) and Same vs New Issue Detection (L-002)
2. **Deploy staging**: Get a live URL for Lijo to test
3. **State paperwork**: Research CA, TX, NY termination document requirements
4. **Design review**: Decide on dark premium vs warm/soft design direction with Lijo
5. **Pricing**: Finalize pricing tiers for landing page

## Key Risks

1. **AI coaching quality** — Coaching tone must match experienced HR professionals (Lijo's style). Requires extensive prompt tuning.
2. **Legal compliance** — State-specific paperwork must be vetted by employment lawyers before deployment.
3. **Design conflict** — Current dark premium vs Lijo's warm/soft preference. Need alignment.
4. **Market timing** — Workday's "Agent System of Record" suggests competitors are waking up to autonomous AI. First-mover advantage is time-sensitive.
5. **Protected class data** — Must be extremely careful about what the agent documents. Legal review required.
