# AI HR Platform — UX Specification

> **Status**: Approved
> **Author**: @product-ux-designer (synthesized by Senior PM)
> **Date**: 2026-03-29
> **Source**: PRD.md (approved at 95% confidence, Iteration 3)

---

## 1. UX Vision & Principles

### Core Philosophy

The AI HR Platform is an **executive command center**, not a time tracker. Every design decision reinforces the feeling of a premium, powerful tool that respects its users' expertise. The dark theme isn't just aesthetic — it reduces eye strain during long HR sessions and signals that this is a serious, professional environment for handling sensitive matters.

**Design North Star:** "Make the human feel powerful, make the AI invisible."

### Design Principles

| # | Principle | Description | Application |
|---|-----------|-------------|-------------|
| DP-1 | **AI as silent partner** | AI should feel like a brilliant assistant who prepared everything before you arrived. Show results, not process. | AI processing indicators use subtle animations; results appear as if "already done." Never show raw AI confidence scores to employees. |
| DP-2 | **Progressive gravity** | The interface gains visual weight as the situation escalates. A verbal warning feels different from a termination. | Severity badges scale in visual intensity. Color shifts from Honey Bronze (low) through Brown Red (medium) to Night Bordeaux (critical). |
| DP-3 | **Transparent authority** | Users always know who decided what and why. AI recommendations come with reasoning, never as black-box mandates. | Three-panel review: AI reasoning is always visible. "Why this recommendation?" links are ever-present. |
| DP-4 | **Calm competence** | The interface never panics. Even when errors occur, the messaging is measured, professional, and solution-oriented. | Error states use Slate Grey backgrounds with Honey Bronze accents (not red). Recovery paths are always shown alongside errors. |
| DP-5 | **Respect the stakes** | Discipline affects careers. Every confirmation, signature, and submission is treated with the gravity it deserves. | No "Are you sure?" nagging for trivial actions. Mandatory confirmation for irreversible actions with clear consequence language. |
| DP-6 | **Role-adaptive focus** | Each role sees exactly what they need — no more, no less. Managers don't see admin tools. Employees don't see AI scores. | Dashboard completely restructures per role. Navigation items appear/disappear based on permissions. |

### Emotional Design Matrix

| Context | Emotional Tone | Visual Treatment | Example |
|---------|---------------|-----------------|---------|
| Discipline creation | Serious, measured | Neutral dark panels, minimal animation | Form steps progress calmly, no celebratory animations |
| AI recommendation | Confident, informative | Clean data display, reasoning sidebar | Confidence bar fills smoothly; no dramatic reveals |
| Document signing | Formal, weighty | Centered document, generous whitespace | Signature pad is prominent; acknowledgment statement is clear |
| Landing page / marketing | Premium, aspirational | Aceternity UI animations, bold typography | Gradient animations, floating elements, strong CTAs |
| Success completions | Warm, professional | Subtle Success (#22c55e) accents | "Document signed" confirmation with checkmark, not confetti |
| Error states | Calm, solution-oriented | Slate Grey bg, Honey Bronze accents | "Something went wrong. Here's what you can do." |
| Alerts / urgent items | Attentive, not alarming | Brown Red accents, never full-screen takeover | Badge counts on sidebar items, not popup floods |

### Trust-Building UX Patterns

1. **Audit trail visibility:** Every action shows "Last modified by [name] at [time]" — users feel accountability
2. **AI reasoning panels:** "Why did AI recommend this?" is always one click away
3. **Policy references:** Documents show exactly which policy section applies, with link to full text
4. **Preview before commit:** Every irreversible action has a clear preview step
5. **Status transparency:** Real-time status indicators on all items in workflow (no "processing" black holes)

---

## 2. Information Architecture

### Global Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (240px desktop, 64px laptop, drawer on mobile)     │
│                                                              │
│  ── SUPER ADMIN ──                                           │
│  ├── 🏠 Command Center (platform-wide dashboard)             │
│  ├── 🏢 Tenants (all companies)                              │
│  ├── 📊 Platform Analytics                                   │
│  ├── 🤖 AI Performance                                       │
│  ├── 🔒 Security Events                                      │
│  ├── ⚙️ Platform Settings                                    │
│  └── 👤 My Profile                                           │
│                                                              │
│  ── COMPANY ADMIN ──                                         │
│  ├── 🏠 Dashboard                                            │
│  ├── 👥 Team (users + departments)                           │
│  ├── 📋 Policies                                             │
│  ├── 📊 Reports                                              │
│  ├── ⚙️ Company Settings                                     │
│  │   ├── AI Configuration                                    │
│  │   ├── Employee Options                                    │
│  │   ├── Notifications                                       │
│  │   └── Integrations                                        │
│  └── 👤 My Profile                                           │
│                                                              │
│  ── HR AGENT ──                                              │
│  ├── 🏠 Dashboard                                            │
│  ├── 📨 Incident Queue                                       │
│  │   ├── AI Review Pending                                   │
│  │   ├── Manual Review                                       │
│  │   ├── Approved / In Progress                              │
│  │   └── All Incidents                                       │
│  ├── 📅 Meetings                                             │
│  │   ├── Upcoming                                            │
│  │   ├── Completed                                           │
│  │   └── All Meetings                                        │
│  ├── 👥 Employees                                            │
│  ├── 📋 Policies (read-only)                                 │
│  ├── 📊 My Reports                                           │
│  └── 👤 My Profile                                           │
│                                                              │
│  ── MANAGER ──                                               │
│  ├── 🏠 Dashboard                                            │
│  ├── 📨 Report Issue (+)                                     │
│  ├── 📋 My Reports                                           │
│  │   ├── Submitted                                           │
│  │   ├── In Progress                                         │
│  │   └── Resolved                                            │
│  ├── 👥 My Team (direct reports)                             │
│  ├── 📅 My Meetings                                          │
│  └── 👤 My Profile                                           │
│                                                              │
│  ── EMPLOYEE ──                                              │
│  ├── 🏠 My Documents                                         │
│  │   ├── Pending Signature                                   │
│  │   ├── Signed                                              │
│  │   └── All Documents                                       │
│  ├── 📅 My Meetings                                          │
│  └── 👤 My Profile                                           │
└─────────────────────────────────────────────────────────────┘
```

### URL Structure

```
/                           → Landing page (unauthenticated)
/login                      → Login form
/signup                     → Registration form
/auth/callback              → SSO callback handler
/onboarding                 → Company setup wizard (Company Admin)

/dashboard                  → Role-adaptive home
/team                       → User management (Admin, HR)
/team/:id                   → Employee detail / timeline
/team/invite                → Invite users
/policies                   → Policy list (Admin: CRUD, HR: read)
/policies/new               → Create policy
/policies/:id               → View/edit policy

/incidents                  → Incident queue (HR)
/incidents/new              → Report issue form (Manager)
/incidents/:id              → Incident detail
/incidents/:id/review       → AI document review (HR, three-panel)

/meetings                   → Meeting list
/meetings/new               → Schedule meeting
/meetings/:id               → Meeting detail / notes
/meetings/:id/summary       → AI-generated summary

/documents                  → Document list (HR, Employee)
/documents/:id              → View document
/documents/:id/sign         → E-signature flow (Employee)

/settings                   → Company settings (Admin)
/settings/ai                → AI configuration
/settings/profile           → User profile

/admin                      → Super Admin panel (Super Admin only)
/admin/tenants              → Tenant management
/admin/analytics            → Platform analytics
```

### Breadcrumb Logic

```
Dashboard > Incidents > INC-2026-0042 > Review
Dashboard > Policies > "Attendance Policy v2" > Edit
Dashboard > My Team > John Smith > Timeline
Dashboard > Meetings > MTG-2026-0015 > Summary
```

Breadcrumbs are clickable at every level. The current page is shown in Vanilla Custard (not linked). Breadcrumbs collapse on mobile: `... > Review` with tap to expand.

---

## 3. Detailed User Flows

### Flow 1: Manager Submits Employee Issue

```
START: Manager clicks "Report Issue" (sidebar CTA or Dashboard card)
  │
  ▼
┌─────────────────────────────────────────────────┐
│ STEP 1: Select Employee + Issue Type            │
│                                                  │
│ ┌──────────────────────────────────────┐         │
│ │ Search employee...              [🔍]  │         │
│ │ Results: direct reports only          │         │
│ │ ┌──────────────────────────────┐      │         │
│ │ │ 👤 John Smith - Developer    │ ✓    │         │
│ │ │ 👤 Sarah Jones - Designer    │      │         │
│ │ │ 👤 Mike Chen - QA Engineer   │      │         │
│ │ └──────────────────────────────┘      │         │
│ │                                       │         │
│ │ Issue Type (visual grid, 2x4):        │         │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │         │
│ │ │Tard│ │Absn│ │Insp│ │Perf│          │         │
│ │ └────┘ └────┘ └────┘ └────┘          │         │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │         │
│ │ │Mscn│ │VioP│ │Thef│ │Othr│          │         │
│ │ └────┘ └────┘ └────┘ └────┘          │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [Cancel]                            [Continue →] │
└─────────────────────────────────────────────────┘
  │
  ├─ VALIDATION: Employee required + Type required
  ├─ ERROR: Search returns no results → "No direct reports found"
  ├─ ERROR: Employee not in direct reports → inline "You can only report issues for your direct reports"
  │
  ▼
┌─────────────────────────────────────────────────┐
│ STEP 2: Incident Details                        │
│                                                  │
│ Date: [📅 2026-03-29] (defaults today)          │
│                                                  │
│ Severity:                                        │
│ ┌──────────────────────────────────────┐         │
│ │ ○ Low     - Minor, first occurrence  │         │
│ │ ○ Medium  - Repeated or notable      │  ← selected by default based on type   │
│ │ ○ High    - Serious violation        │         │
│ │ ○ Critical- Severe, immediate action │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ Description:                                     │
│ ┌──────────────────────────────────────┐         │
│ │ Tell us what happened...             │         │
│ │ (Guided prompt changes per type)     │         │
│ │ Min 10 chars | ████████░░ 80/2000    │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [← Back]                            [Continue →] │
└─────────────────────────────────────────────────┘
  │
  ├─ VALIDATION: Date required (≤ today), Severity required, Description ≥10 chars
  ├─ AUTO-SAVE: Draft saved to localStorage every 30s
  │
  ▼
┌─────────────────────────────────────────────────┐
│ STEP 3: Evidence & Context                      │
│                                                  │
│ Evidence Files (optional):                       │
│ ┌──────────────────────────────────────┐         │
│ │  📎 Drag & drop or click to upload   │         │
│ │  Max 10MB each | PDF, JPG, PNG, DOCX │         │
│ └──────────────────────────────────────┘         │
│ [📎 email_proof.pdf] [📎 attendance_log.xlsx]   │
│                                                  │
│ Witnesses (optional):                            │
│ [Search employees in company... 🔍]             │
│ [👤 Sarah Jones ×] [👤 Alex Rivera ×]           │
│                                                  │
│ Union Involvement: [Toggle OFF]                  │
│                                                  │
│ [← Back]                            [Continue →] │
└─────────────────────────────────────────────────┘
  │
  ├─ ERROR: File >10MB → "File exceeds 10MB limit. Please compress or split."
  ├─ ERROR: Unsupported format → "Supported formats: PDF, JPG, PNG, DOCX"
  │
  ▼
┌─────────────────────────────────────────────────┐
│ STEP 4: Review & Submit                         │
│                                                  │
│ ┌──────────────────────────────────────┐         │
│ │ Employee:    John Smith              │         │
│ │ Type:        Tardiness               │         │
│ │ Date:        March 29, 2026          │         │
│ │ Severity:    Medium                  │         │
│ │ Description: "Employee arrived 25    │         │
│ │              minutes late without..."│         │
│ │ Evidence:    2 files attached        │         │
│ │ Witnesses:   Sarah Jones, Alex R.    │         │
│ │ Union:       No                      │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ ☐ I attest this report is truthful and           │
│   accurate to the best of my knowledge.          │
│                                                  │
│ [← Back]                  [✋ Submit Report]     │
│                           (Vanilla Custard CTA)  │
└─────────────────────────────────────────────────┘
  │
  ├─ VALIDATION: Attestation checkbox must be checked
  │
  ▼
┌─────────────────────────────────────────────────┐
│ SUBMISSION SUCCESS                               │
│                                                  │
│        ✅ Report Submitted                       │
│                                                  │
│ Reference: INC-2026-0042                        │
│ Status: AI is analyzing the incident...          │
│                                                  │
│ [What happens next?]                             │
│ 1. AI evaluates against company policies         │
│ 2. HR reviews the recommendation                 │
│ 3. You'll be notified of next steps              │
│                                                  │
│ [View My Reports]  [Report Another Issue]        │
└─────────────────────────────────────────────────┘
  │
  ▼
BACKGROUND: AI Evaluation (async)
  ├─ → Manager sees "AI Evaluating" in My Reports list
  ├─ → AI processing: 2-10 seconds typical
  ├─ → On completion: incident status updates, notifications fire
  │
  ├─ SUCCESS: Confidence ≥ threshold → AI doc generated → HR Review queue
  ├─ LOW CONFIDENCE: Confidence < threshold → HR Manual Review queue
  ├─ NO MATCHING POLICY: → HR Manual Review with "No matching policy" note
  └─ AI FAILURE: → Auto-escalate to HR Manual Review, error logged
  │
END: Manager can track status from "My Reports"
```

**Loading States:**
- Form submission: Button changes to spinner + "Submitting..." (2-3s)
- AI evaluation: Status pill shows animated pulse "AI Evaluating..." in My Reports
- No blocking loaders on the Manager side — they see the success screen immediately

**Error Recovery:**
- Network failure during submit: "Your report was saved as a draft. Retry when you're back online." Draft appears in "My Reports" with draft badge.
- Session timeout mid-form: Auto-saved to localStorage. On re-login, prompt: "You have an unsaved report. Resume?"
- Employee removed (terminated) between Step 1 and submit: Submission fails with "This employee is no longer in your direct reports."

---

### Flow 2: HR Agent Reviews AI Document

```
START: HR Agent receives notification (in-app + email)
  "New AI document ready for review: INC-2026-0042 (John Smith)"
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ INCIDENT QUEUE (HR Agent)                                           │
│                                                                      │
│ Tabs: [AI Review (3)] [Manual Review (1)] [Approved (12)] [All]    │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ 🔵 INC-2026-0042 | Tardiness | Medium | John Smith            │  │
│ │    AI Confidence: 94% | Policy: Attendance Policy v2            │  │
│ │    AI Recommendation: Written Warning                           │  │
│ │    Submitted: 2 hours ago by Manager: Lisa Park                 │  │
│ │    [Review Now →]                                               │  │
│ ├─────────────────────────────────────────────────────────────────┤  │
│ │ 🔵 INC-2026-0041 | Performance | High | Maria Garcia           │  │
│ │    AI Confidence: 88% (below 90% threshold)                    │  │
│ │    Manual Review Required                                       │  │
│ │    Submitted: 4 hours ago by Manager: Tom Wilson                │  │
│ │    [Review Now →]                                               │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
  │
  ▼ HR clicks "Review Now" on INC-2026-0042
┌─────────────────────────────────────────────────────────────────────┐
│ AI DOCUMENT REVIEW — Three-Panel Layout                             │
│                                                                      │
│ ┌──────────────────┬──────────────────┬──────────────────┐          │
│ │ LEFT PANEL       │ CENTER PANEL     │ RIGHT PANEL      │          │
│ │ (40% width)      │ (30% width)      │ (30% width)      │          │
│ │                  │                  │                   │          │
│ │ 📄 DOCUMENT      │ 👤 EMPLOYEE      │ 🤖 AI REASONING  │          │
│ │ (Editable)       │ HISTORY          │                   │          │
│ │                  │                  │ Matched Policy:   │          │
│ │ RE: Written      │ John Smith       │ Attendance Policy │          │
│ │ Warning —        │ Developer        │ v2, Section 3.2   │          │
│ │ Tardiness        │ Hired: 2024-06   │                   │          │
│ │                  │ Dept: Engineering │ Confidence: 94%  │          │
│ │ Dear John,       │                  │ ████████░░        │          │
│ │                  │ TIMELINE:        │                   │          │
│ │ This letter      │ ├─ 2024-06: Hire │ Breakdown:        │          │
│ │ serves as a      │ ├─ 2025-03:      │ • Policy match:   │          │
│ │ formal written   │ │  Verbal Warning │   97%            │          │
│ │ warning for      │ │  (Tardiness)    │ • History match:  │          │
│ │ repeated         │ ├─ 2025-08:       │   91%            │          │
│ │ tardiness...     │ │  Performance    │ • Severity fit:   │          │
│ │                  │ │  Review (Good)  │   95%            │          │
│ │ [track changes   │ └─ 2026-03: ←NOW │                   │          │
│ │  enabled]        │                  │ Alternatives:     │          │
│ │                  │ Prior Incidents: │ • Verbal Warning  │          │
│ │                  │ 1 (Tardiness)    │   (78% conf.)     │          │
│ │                  │                  │ • PIP (62% conf.) │          │
│ │                  │                  │                   │          │
│ │                  │                  │ What-If:          │          │
│ │                  │                  │ "If no prior      │          │
│ │                  │                  │  incidents,       │          │
│ │                  │                  │  would recommend  │          │
│ │                  │                  │  verbal warning"  │          │
│ └──────────────────┴──────────────────┴──────────────────┘          │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ ACTION BAR                                                      │  │
│ │                                                                  │  │
│ │ [✅ Approve] [✏️ Approve with Edits] [❌ Reject] [📅 Schedule] │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Approve Flow:**
```
Click "Approve" → Confirmation modal:
  "You are approving a Written Warning for John Smith (INC-2026-0042).
   This will schedule a three-way meeting and deliver the document
   for employee signature."
  [Cancel] [Confirm Approval]
     │
     ▼ Confirm
  → Document status: "approved"
  → Audit log entry: approved_by, approved_at, document_hash
  → Prompt: "Schedule meeting?" → redirects to Meeting Scheduler
  → Notifications: Manager notified "Your report INC-2026-0042 has been approved"
```

**Approve with Edits Flow:**
```
Click "Approve with Edits" → Document becomes editable (track changes on)
  HR modifies text → each change logged with before/after
  Click "Finalize Edits" → Review changes modal → Confirm
  → Same as Approve but audit trail includes all modifications
```

**Reject Flow:**
```
Click "Reject" → Rejection modal:
  ┌─────────────────────────────────────────────┐
  │ Reject AI Recommendation                     │
  │                                              │
  │ Reason (required, min 20 chars):             │
  │ ┌──────────────────────────────────┐         │
  │ │ The severity assessment does not │         │
  │ │ account for the employee's...    │         │
  │ └──────────────────────────────────┘         │
  │                                              │
  │ Choose next step:                            │
  │ ○ Regenerate with feedback → AI re-processes │
  │ ○ Escalate to legal → Legal Hold flag        │
  │ ○ Close without action → Manager notified    │
  │                                              │
  │ [Cancel]                    [Confirm Reject] │
  └─────────────────────────────────────────────┘
```

---

### Flow 3: Three-Way Meeting Management

```
START: After document approval, HR clicks "Schedule Meeting"
  │
  ▼
┌─────────────────────────────────────────────────┐
│ SCHEDULE MEETING                                 │
│                                                  │
│ Meeting Type: [Written Warning Discussion ▼]     │
│ (auto-populated from incident type)              │
│                                                  │
│ Participants (auto-identified):                  │
│ ✅ John Smith (Employee)                         │
│ ✅ Lisa Park (Manager)                           │
│ ✅ You (HR Agent)                                │
│ [+ Add Participant]                              │
│                                                  │
│ AI-Generated Agenda (editable):                  │
│ ┌──────────────────────────────────────┐         │
│ │ 1. Review of incident details        │         │
│ │ 2. Policy reference: Attendance 3.2  │         │
│ │ 3. Discussion of improvement plan    │         │
│ │ 4. Next steps and follow-up          │         │
│ │ [+ Add Agenda Item]                  │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ Date & Time: [📅 April 2, 2026] [🕐 10:00 AM]  │
│ Duration: [30 min ▼]                             │
│                                                  │
│ Meeting Link: [Paste Zoom/Teams/Meet URL...]     │
│                                                  │
│ [Cancel]                             [Schedule]  │
└─────────────────────────────────────────────────┘
  │
  ▼ Scheduled
  → Invitations sent (email + in-app) to all participants
  → Meeting appears in all participants' "My Meetings"
  → Calendar invite attached to email
  │
  ▼ Meeting Day
┌─────────────────────────────────────────────────┐
│ MEETING: INC-2026-0042 — In Progress            │
│                                                  │
│ Participants: John Smith, Lisa Park, You         │
│ Meeting Link: [Open Zoom →]                      │
│                                                  │
│ Agenda (reference):                              │
│ 1. Review of incident details          ✓         │
│ 2. Policy reference: Attendance 3.2    ✓         │
│ 3. Discussion of improvement plan      ← current │
│ 4. Next steps and follow-up                     │
│                                                  │
│ Notes (HR types here):                           │
│ ┌──────────────────────────────────────┐         │
│ │ Discussed tardiness pattern. John    │         │
│ │ acknowledged the issue. Agreed to    │         │
│ │ improve punctuality. Lisa will       │         │
│ │ track attendance weekly...           │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [End Meeting & Generate Summary]                 │
└─────────────────────────────────────────────────┘
  │
  ▼ Click "End Meeting & Generate Summary"
  → AI generates summary (2-5 seconds)
  → Loading: "AI is generating meeting summary..."
┌─────────────────────────────────────────────────┐
│ AI MEETING SUMMARY (editable)                    │
│                                                  │
│ ┌──────────────────────────────────────┐         │
│ │ Meeting Summary: Written Warning     │         │
│ │ Date: April 2, 2026                  │         │
│ │                                      │         │
│ │ Key Discussion Points:               │         │
│ │ 1. Employee acknowledged pattern     │         │
│ │    of tardiness over past quarter    │         │
│ │ 2. Manager confirmed impact on team  │         │
│ │    scheduling and productivity       │         │
│ │ 3. Employee expressed commitment     │         │
│ │    to improvement                    │         │
│ │                                      │         │
│ │ Action Items:                        │         │
│ │ • John: Arrive on time daily         │         │
│ │   Owner: John Smith | By: April 30   │         │
│ │ • Lisa: Weekly attendance check-in   │         │
│ │   Owner: Lisa Park | By: April 30    │         │
│ │                                      │         │
│ │ Follow-Up:                           │         │
│ │ Next check-in: April 30, 2026        │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [Edit Summary]  [Finalize & Send to Employee]    │
└─────────────────────────────────────────────────┘
  │
  ▼ Finalize
  → Summary attached to disciplinary record
  → Summary delivered to employee's pending documents
  → Audit trail records finalization
  → Employee can sign to acknowledge
```

---

### Flow 4: Employee Signs Document

```
START: Employee receives notification
  "You have a document requiring your signature"
  │
  ▼
┌─────────────────────────────────────────────────┐
│ MY DOCUMENTS — Pending Signature (1)            │
│                                                  │
│ ┌─────────────────────────────────────────────┐  │
│ │ 📄 Written Warning — Tardiness              │  │
│ │    Reference: INC-2026-0042                 │  │
│ │    Date: March 30, 2026                     │  │
│ │    Status: ⏳ Awaiting your signature       │  │
│ │                                             │  │
│ │    [Review & Sign →]                        │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ Signed Documents (3)                             │
│ └─ Verbal Warning — Jan 15, 2026 ✓              │
└─────────────────────────────────────────────────┘
  │
  ▼ Click "Review & Sign"
┌─────────────────────────────────────────────────┐
│ DOCUMENT REVIEW                                  │
│                                                  │
│ ┌──────────────────────────────────────┐         │
│ │ Written Warning — Tardiness          │         │
│ │ Reference: INC-2026-0042             │         │
│ │                                      │         │
│ │ Dear John,                           │         │
│ │                                      │         │
│ │ This letter serves as a formal       │         │
│ │ written warning for repeated         │         │
│ │ tardiness...                         │         │
│ │                                      │         │
│ │ [Full document rendered in readable  │         │
│ │  format with proper formatting]      │         │
│ │                                      │         │
│ │ Policy Reference:                    │         │
│ │ [📎 Attendance Policy v2, §3.2]      │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [View Referenced Policy] side panel toggle       │
│                                                  │
│ ─── ACKNOWLEDGMENT ───                           │
│                                                  │
│ ☐ I acknowledge receipt and understanding of     │
│   this document. I understand this constitutes   │
│   a formal written warning.                      │
│                                                  │
│ ─── SIGNATURE ───                                │
│                                                  │
│ Signature Method: [✏️ Draw] [⌨️ Type]            │
│                                                  │
│ ┌──────────────────────────────────────┐         │
│ │                                      │         │
│ │    [Canvas drawing area]              │         │
│ │    or                                │         │
│ │    John Smith (typed, in script font) │         │
│ │                                      │         │
│ │    [Clear]                           │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [Dispute this Document]  [✍️ Sign Document]      │
│ (if enabled)              (Vanilla Custard CTA)  │
└─────────────────────────────────────────────────┘
  │
  ▼ Click "Sign Document"
  → Signature validation: must not be empty
  → Acknowledgment checkbox must be checked
  → Confirmation modal: "You are signing this document electronically. This is legally binding."
  → [Cancel] [Confirm Signature]
     │
     ▼ Confirm
  → Signature recorded with: IP, timestamp, user agent, SHA-256 hash
  → Document becomes immutable (append-only)
  → Confirmation screen with green checkmark
  → Copy emailed to employee
  → HR notified: "John Smith signed INC-2026-0042"
  │
  ├─ DISPUTE FLOW (if enabled):
  │  Click "Dispute this Document"
  │  → Must acknowledge receipt first (checkbox)
  │  → Dispute form appears:
  │    "Please explain your dispute (minimum 50 characters):"
  │    [textarea]
  │  → [Submit Dispute]
  │  → Dispute routes to HR review queue
  │  → Employee sees: "Your dispute has been submitted. HR will review it."
  │
  └─ NO ACTION PATH:
     → Reminders at 24h (email + in-app)
     → Reminders at 72h (email + in-app, escalated)
     → Reminders at 7d (email to employee + manager + HR)
     → Status shows "Overdue" badge
```

---

### Flow 5: Company Admin Configures Policy

```
START: Admin navigates to Settings → Policies → "Create New Policy"
  │
  ▼
┌─────────────────────────────────────────────────┐
│ CREATE POLICY — Choose Method                    │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ 🤖       │ │ 📤       │ │ ✏️       │         │
│ │ AI       │ │ Upload   │ │ From     │         │
│ │ Template │ │ Existing │ │ Scratch  │         │
│ │          │ │          │ │          │         │
│ │ Describe │ │ Upload   │ │ Build    │         │
│ │ your     │ │ your     │ │ step by  │         │
│ │ policy   │ │ PDF/DOCX │ │ step     │         │
│ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘
  │
  ▼ User chooses "AI Template" (example)
┌─────────────────────────────────────────────────┐
│ POLICY BUILDER — Step 1: Basic Info              │
│                                                  │
│ Title: [Attendance Policy           ]            │
│ Category: [Discipline ▼]                         │
│ Effective Date: [📅 April 1, 2026]              │
│ Expiry Date: [None ▼]                            │
│                                                  │
│ Policy Text (full text for AI context):          │
│ ┌──────────────────────────────────────┐         │
│ │ This policy outlines expectations    │         │
│ │ for employee attendance and          │         │
│ │ punctuality...                       │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [← Back]                            [Continue →] │
└─────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────┐
│ POLICY BUILDER — Step 2: Structured Rules        │
│                                                  │
│ ┌─────────────────────────────────────────┐      │
│ │ RULE 1                          [⋮] [×]│      │
│ │ Trigger:  [Tardiness ▼]                 │      │
│ │ Condition: [Severity ≥ Medium ▼]        │      │
│ │            AND [Prior incidents ≥ 1]     │      │
│ │ Action:   [Written Warning ▼]           │      │
│ │                                          │      │
│ │ ─── ESCALATION LADDER ───               │      │
│ │ Level 1: Verbal Warning   [drag handle] │      │
│ │ Level 2: Written Warning  [drag handle] │      │
│ │ Level 3: PIP              [drag handle] │      │
│ │ Level 4: Termination Review[drag handle]│      │
│ │ [+ Add Level]                           │      │
│ ├─────────────────────────────────────────┤      │
│ │ RULE 2                          [⋮] [×]│      │
│ │ Trigger:  [Absence ▼]                   │      │
│ │ Condition: [Unexcused ▼]                │      │
│ │ Action:   [Written Warning ▼]           │      │
│ │ ...                                     │      │
│ ├─────────────────────────────────────────┤      │
│ │ [+ Add Rule]                            │      │
│ └─────────────────────────────────────────┘      │
│                                                  │
│ ⚠️ Conflict: Rule 1 and Rule 2 overlap on        │
│    "unexcused tardiness + absence combo"         │
│    [Resolve Conflict →]                          │
│                                                  │
│ [← Back]                            [Continue →] │
└─────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────┐
│ POLICY BUILDER — Step 3: AI Settings             │
│                                                  │
│ Confidence Threshold:                            │
│ [Override company default? ☐]                   │
│ Company default: 90%                             │
│ Override: [85 %] (range slider, 50-99%)         │
│                                                  │
│ ☑ Auto-generate documents above threshold        │
│ ☑ Require HR approval for all documents          │
│ ☑ Allow employees to dispute                     │
│                                                  │
│ TEST PANEL:                                      │
│ "Test how AI will interpret this policy"         │
│ ┌──────────────────────────────────────┐         │
│ │ Sample scenario:                     │         │
│ │ Employee: 2 prior tardiness verbal   │         │
│ │ warnings. New tardiness report,      │         │
│ │ medium severity.                     │         │
│ │                                      │         │
│ │ AI Prediction:                       │         │
│ │ Recommendation: Written Warning      │         │
│ │ Confidence: 92%                      │         │
│ │ Escalation Level: 2                  │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ [← Back]                            [Continue →] │
└─────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────┐
│ POLICY BUILDER — Step 4: Review & Activate       │
│                                                  │
│ ┌──────────────────────────────────────┐         │
│ │ Policy: Attendance Policy v2         │         │
│ │ Category: Discipline                 │         │
│ │ Effective: April 1, 2026            │         │
│ │ Rules: 4 structured rules            │         │
│ │ AI Threshold: 85% (override)         │         │
│ │                                      │         │
│ │ "How AI will interpret this"         │         │
│ │ (Plain English summary):             │         │
│ │ "When an employee is reported for    │         │
│ │  tardiness, the AI will check their  │         │
│ │  history and escalate through:       │         │
│ │  verbal → written → PIP → terminate. │         │
│ │  A written warning requires at least │         │
│ │  one prior incident."                │         │
│ └──────────────────────────────────────┘         │
│                                                  │
│ Status: ○ Draft (not fed to AI)                  │
│         ● Active (AI uses for future incidents)  │
│                                                  │
│ [Save as Draft]           [✅ Activate Policy]   │
└─────────────────────────────────────────────────┘
  │
  ▼ Activate
  → Policy stored as structured JSONB
  → If Active: fed to AI evaluation engine for future incidents
  → Admin sees policy in list with "Active" badge
  → Audit log records: created_by, activation_date, policy_version
```

---

## 4. Wireframe Descriptions for Key Screens

### Screen 1: Landing Page (Marketing)

```
┌───────────────────────────────────────────────────────────────┐
│ NAVBAR: [Logo: "AI HR Platform"]  [Features] [Pricing]       │
│         [About]                     [Login] [Get Started ★]  │
│ (sticky, transparent bg, blur on scroll)                       │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│                    HERO SECTION                                │
│                                                                │
│           "An HR ERP that's AI-Based."                        │
│    "Let computers talk to computers.                          │
│     Let humans manage the human interactions."                │
│                                                                │
│         [Get Started — Free Trial →]                          │
│         (Vanilla Custard button, glow animation)              │
│                                                                │
│    ┌──────────────────────────────────────┐                   │
│    │  [Animated dashboard preview/mockup]  │                   │
│    │  Aceternity UI: floating card effect  │                   │
│    │  showing dark UI with AI elements     │                   │
│    └──────────────────────────────────────┘                   │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│ FEATURES GRID (3 columns, 2 rows)                             │
│                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ 🤖       │ │ 📋       │ │ ✍️       │                      │
│ │ AI-Powered│ │ Policy   │ │ E-Sign   │                      │
│ │ Discipline│ │ Engine   │ │ Built-In │                      │
│ │           │ │          │ │          │                      │
│ │ Autonomous│ │ Configure│ │ Custom   │                      │
│ │ agents    │ │ rules    │ │ signature│                      │
│ │ handle    │ │ that     │ │ engine   │                      │
│ │ end-to-end│ │ feed AI  │ │ with full│                      │
│ │ workflows │ │ agents   │ │ audit    │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ 📊       │ │ 🔒       │ │ 🌙       │                      │
│ │ Analytics│ │ Compliant│ │ Premium  │                      │
│ │          │ │          │ │ Design   │                      │
│ │ Real-time│ │ SOC 2,   │ │          │                      │
│ │ HR       │ │ HIPAA,   │ │ Dark,    │                      │
│ │ dashboard│ │ GDPR     │ │ premium  │                      │
│ │ with AI  │ │ ready    │ │ interface│                      │
│ │ insights │ │          │ │          │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│ CTA SECTION                                                   │
│                                                                │
│    "Ready to transform your HR operations?"                   │
│    [Start Free Trial →]  [Book a Demo →]                      │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│ FOOTER                                                        │
│ Links | Privacy | Terms | © 2026                              │
└───────────────────────────────────────────────────────────────┘
```

**Component States:**
- CTA buttons: Vanilla Custard (#ffd900) bg, Dark Slate Grey text, border-radius: 8px
- Hover: glow effect (box-shadow with Vanilla Custard), slight scale(1.02)
- Active: scale(0.98), darker bg
- Feature cards: Slate Grey (#223d44) bg, subtle border, hover: border Vanilla Custard, slight lift

**Responsive:**
- Desktop: 3-column feature grid
- Tablet: 2-column grid
- Mobile: single column, stacked cards

---

### Screen 2: Login / Signup

```
┌───────────────────────────────────────────────────┐
│                (centered card, max-width: 420px)   │
│                                                    │
│              [AI HR Platform Logo]                 │
│                                                    │
│            "Welcome Back" / "Get Started"          │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │ Continue with Google                     │      │
│  └──────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────┐      │
│  │ Continue with Microsoft                  │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ──────── or ────────                             │
│                                                    │
│  Email:                                           │
│  ┌──────────────────────────────────────────┐      │
│  │ name@company.com                          │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  Password:                                        │
│  ┌──────────────────────────────────────────┐      │
│  │ ••••••••••                         [👁]   │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ☐ Remember me            Forgot password?         │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │          [Sign In / Create Account]       │      │
│  │          (Vanilla Custard CTA)            │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  Don't have an account? Sign up                   │
│  Already have an account? Log in                  │
│                                                    │
└───────────────────────────────────────────────────┘
```

**States:**
- Input focus: Vanilla Custard border, subtle glow
- Input error: Brown Red border, error message below
- SSO buttons: Slate Grey bg, provider icon, hover: slight border highlight
- Loading: Button spinner + "Signing in..."
- Error: Inline toast "Invalid email or password" in Brown Red

---

### Screen 3: Dashboard Home (Role-Adaptive)

**HR Agent Dashboard:**
```
┌──────┬───────────────────────────────────────────┐
│      │ 🏠 Dashboard                    🔔 (3) 👤 │
│      ├───────────────────────────────────────────┤
│ SIDE │                                            │
│ BAR  │ STAT CARDS (4 across):                     │
│      │ ┌────────┐┌────────┐┌────────┐┌────────┐ │
│ 🏠   │ │ Pending││Meetings││Awaiting││Resolved│ │
│ 📨   │ │ Review ││This Wk ││Signing ││This Mo │ │
│ 📅   │ │   3    ││   2    ││   5    ││   12   │ │
│ 👥   │ │ +2 new ││ Next:  ││ 2 over ││ ↑18%   │ │
│ 📋   │ │ today  ││ 2pm    ││ due    ││ vs last│ │
│ 📊   │ └────────┘└────────┘└────────┘└────────┘ │
│ 👤   │                                            │
│      │ PENDING REVIEWS                    [View All]│
│      │ ┌──────────────────────────────────────┐   │
│      │ │ 🔵 INC-0042 | Written Warning | 94%  │   │
│      │ │ 🔵 INC-0041 | Manual Review | 88%    │   │
│      │ │ 🔵 INC-0040 | PIP | 96%             │   │
│      │ └──────────────────────────────────────┘   │
│      │                                            │
│      │ UPCOMING MEETINGS                  [View All]│
│      │ ┌──────────────────────────────────────┐   │
│      │ │ 📅 Today 2:00pm — John Smith (WR)    │   │
│      │ │ 📅 Tomorrow 10am — Maria Garcia (PIP)│   │
│      │ └──────────────────────────────────────┘   │
│      │                                            │
│      │ RECENT ACTIVITY                            │
│      │ • Lisa Park submitted INC-0042 — 2h ago    │
│      │ • John Smith signed DOC-0138 — 4h ago     │
│      │ • AI generated summary for MTG-0015 — 1d   │
└──────┴───────────────────────────────────────────┘
```

**Manager Dashboard:**
```
┌──────┬───────────────────────────────────────────┐
│      │ 🏠 Dashboard                    🔔 (1) 👤 │
│      ├───────────────────────────────────────────┤
│ SIDE │                                            │
│ BAR  │ QUICK ACTION                               │
│      │ ┌──────────────────────────────────────┐   │
│ 🏠   │ │ [+ Report an Issue]                  │   │
│ 📨   │ │ (Vanilla Custard, prominent)          │   │
│ 📋   │ └──────────────────────────────────────┘   │
│ 👥   │                                            │
│ 📅   │ MY TEAM (direct reports)                   │
│ 👤   │ ┌──────────────────────────────────────┐   │
│      │ │ John Smith — 1 active issue           │   │
│      │ │ Sarah Jones — No issues               │   │
│      │ │ Mike Chen — No issues                 │   │
│      │ └──────────────────────────────────────┘   │
│      │                                            │
│      │ MY RECENT REPORTS                  [View All]│
│      │ ┌──────────────────────────────────────┐   │
│      │ │ INC-0042 | Tardiness | AI Reviewing  │   │
│      │ │ INC-0039 | Performance | Resolved ✓  │   │
│      │ └──────────────────────────────────────┘   │
│      │                                            │
│      │ UPCOMING MEETINGS                          │
│      │ 📅 Today 2:00pm — John Smith meeting      │
└──────┴───────────────────────────────────────────┘
```

**Employee Dashboard:**
```
┌──────┬───────────────────────────────────────────┐
│      │ 🏠 My Documents                  🔔 (1) 👤 │
│      ├───────────────────────────────────────────┤
│ SIDE │                                            │
│ BAR  │ PENDING ACTION                             │
│      │ ┌──────────────────────────────────────┐   │
│ 🏠   │ │ ⏳ Written Warning — Tardiness       │   │
│ 📅   │ │ Awaiting your signature              │   │
│ 👤   │ │ Submitted: March 30                   │   │
│      │ │ [Review & Sign →]                     │   │
│      │ └──────────────────────────────────────┘   │
│      │                                            │
│      │ SIGNED DOCUMENTS                           │
│      │ ┌──────────────────────────────────────┐   │
│      │ │ ✓ Verbal Warning — Jan 15, 2026      │   │
│      │ │ ✓ Performance Review — Oct 2025      │   │
│      │ └──────────────────────────────────────┘   │
└──────┴───────────────────────────────────────────┘
```

---

### Screen 4: Policy Builder (Company Admin)

See Flow 5 above for the full 4-step wizard wireframe.

**Layout Details:**
- Full-width content area (no three-panel here)
- Step indicator at top: `[1 Basic Info] → [2 Rules] → [3 AI Settings] → [4 Review]`
- Current step highlighted in Vanilla Custard, completed steps have ✓, future steps dimmed
- "Save as Draft" always available (not just on final step)
- Rule builder: drag-and-drop with visual handles, reorderable escalation ladder
- Conflict detection: real-time warning banner when rules overlap

---

### Screen 5: Report Issue Form (Manager, Multi-Step)

See Flow 1 above for the full 4-step form wireframe.

**Layout Details:**
- Centered form, max-width 640px, generous vertical spacing
- Step indicator: same pattern as Policy Builder
- Form auto-saves to localStorage every 30s
- Evidence upload area: drag-and-drop zone with dashed border, visual feedback on drag-over
- Severity selector: radio buttons with descriptions, not just labels
- Review step: summary in a Slate Grey card with edit links per section

---

### Screens 6-11: Key Layout Patterns

**Incident Queue (HR Agent):**
- Tab-based layout: [AI Review] [Manual] [Approved] [All]
- List items: Slate Grey cards with status badges (color-coded)
- Filter bar: by severity, date range, employee, manager
- Sort: by date, severity, AI confidence
- Pagination: cursor-based, "Load More" button pattern

**AI Document Review (HR Agent, Three-Panel):**
- Desktop: 3-column layout (40/30/30 split)
- Laptop: left panel 45%, center+right collapsed to tabs
- Tablet: stacked — document on top, tabs for history/reasoning
- Mobile: full-width tabs with swipe navigation

**Meeting Scheduler:**
- Single-column form, max-width 640px
- AI agenda in a Slate Grey card with edit-in-place
- Date picker: calendar widget, available times highlighted
- Participants: avatar chips with ✕ to remove

**Meeting Summary:**
- Two-column layout: left (AI summary, editable rich text), right (original notes, reference only)
- Edit mode: inline editing with markdown-like formatting
- Finalize: prominent CTA at bottom

**Employee Portal — Pending Documents:**
- Card-based list (not table — more humane for personal documents)
- Pending items: larger cards with CTA button
- Signed items: smaller cards with ✓ icon and date
- Empty state: "No pending documents. You're all caught up."

**Document Signing:**
- Single document view, centered, max-width 800px
- Document rendered in readable format (not raw text)
- Signature area at bottom: canvas or type selector
- Dispute button (if enabled): secondary style, less prominent than Sign
- Acknowledgment checkbox: required before signing, clear language

---

## 5. Interaction Design Specifications

### Form Validation Patterns

| Trigger | Pattern | Visual |
|---------|---------|--------|
| On blur (field exit) | Validate field if dirty | Green checkmark (valid) or Brown Red border + message (invalid) |
| On submit | Validate all fields | Scroll to first error, focus invalid field, summary of errors at top |
| Inline (typing) | Character count, format hints | Live character count, format preview (e.g., date preview) |
| Async (server) | Duplicate check, existence check | Spinner in field, result appears inline |

**Error Messages:** Always specific and actionable. Not "Invalid input" but "Description must be at least 10 characters. Current: 7."

### AI Processing States

| Duration | Indicator | Message |
|----------|-----------|---------|
| 0-2s | Skeleton loader in content area | No message needed (feels instant) |
| 2-10s | Animated AI indicator (subtle pulse) + progress text | "AI is analyzing the incident..." |
| 10-30s | Progress bar with estimated time | "AI analysis in progress (~20s remaining)" |
| >30s | Background notification | "AI analysis is taking longer than usual. We'll notify you when it's ready." |

**AI Indicator Design:** A subtle, animated dot (Vanilla Custard, 8px, pulse animation) with a small "AI" label. Never dramatic — conveys quiet confidence.

### Notification System

**Toast Types:**
| Type | Color | Duration | Example |
|------|-------|----------|---------|
| Success | Success (#22c55e) accent | 4s auto-dismiss | "Document signed successfully" |
| Info | Vanilla Custard accent | 4s auto-dismiss | "AI evaluation complete" |
| Warning | Honey Bronze accent | 6s auto-dismiss | "AI budget at 80% for this month" |
| Error | Brown Red accent | Manual dismiss | "Failed to upload file. Please retry." |

**In-App Bell:** Top-right corner. Badge shows unread count (max "99+"). Dropdown panel shows recent notifications with entity links.

### Modal & Drawer Patterns

- **Modals:** Centered, dark overlay (80% opacity). For confirmations, rejections, and focused tasks.
- **Drawers:** Slide from right (desktop) or bottom (mobile). For side panels (policy reference, employee details).
- **Size:** Small (400px), Medium (560px), Large (720px). Never full-screen.

### Drag-and-Drop Interactions

- **Policy rule reorder:** Grab handle (6 dots icon) on left. Drag shadow: Slate Grey elevated card. Drop zone: subtle Vanilla Custard line indicator.
- **File upload:** Dashed border zone. Drag-over: border becomes Vanilla Custard, bg slightly lighter. Drop: files appear as chips with upload progress.

### Signature Capture Interaction

**Draw Mode:**
- Canvas area: 400×150px (desktop), full-width (mobile)
- Stroke: Vanilla Custard color, 2px width
- Pressure-sensitive on touch devices (thicker = more pressure)
- Clear button: resets canvas
- Undo: last stroke removed (not full clear)

**Type Mode:**
- Font selector: 3 script fonts
- Preview updates in real-time
- User can adjust size

### Confirmation Patterns for Destructive Actions

| Action | Confirmation | Message |
|--------|-------------|---------|
| Reject AI document | Modal with required reason | "Rejecting this AI recommendation requires a reason. This action will be logged." |
| Close incident without action | Modal with warning | "This will close the incident without any disciplinary action. The manager will be notified." |
| Delete draft policy | Modal | "Delete 'Attendance Policy v2 (Draft)'? This cannot be undone." |
| Remove team member | Modal with consequence list | "Removing [Name] will revoke their access immediately." |
| Sign document | Modal with legal text | "Your electronic signature is legally binding under ESIGN/UETA." |

---

## 6. Error Handling & Edge Case UX

### Empty States

| View | Empty State Design |
|------|-------------------|
| Incident Queue (no pending) | 🎉 illustration + "All clear! No pending reviews." + "Recent resolved: 12 this month" |
| My Reports (manager, new user) | 📋 illustration + "You haven't submitted any reports yet." + CTA: "Report your first issue" |
| My Documents (employee, nothing pending) | ✓ illustration + "No pending documents. You're all caught up." |
| Policies (no policies) | ⚠️ warning + "No active policies. AI cannot evaluate incidents without policies." + CTA: "Create your first policy" |
| Team (no employees) | 👥 illustration + "No team members yet." + CTA: "Invite your team" |
| Employee Timeline (no history) | "No disciplinary history. This is the employee's first incident." |

### Error Recovery Flows

**Network Failure Mid-Form:**
1. Form data auto-saved to localStorage
2. Toast: "Connection lost. Your progress is saved."
3. On reconnect: Toast: "Back online." Form data restored.
4. If submit failed: Draft appears in relevant list with retry button

**AI Service Down:**
1. Manager submits issue → sees normal success screen
2. Status shows "Pending Manual Review" instead of "AI Evaluating"
3. HR sees "AI Unavailable" badge on incident
4. Platform banner (dismissible): "AI analysis is temporarily unavailable. All incidents will be handled manually."

**Permission Change Mid-Session:**
1. If user's role changes while logged in: next API call returns 403
2. Frontend refreshes user session data
3. UI re-renders with new role permissions
4. If user is mid-action they no longer have access to: redirect to dashboard with toast "Your permissions have been updated."

### Session Expiry Handling

1. 5 minutes before expiry: toast "Your session will expire in 5 minutes. [Extend Session]"
2. On expiry: current state auto-saved, redirect to login
3. After re-login: redirect to previous page with saved state restored
4. Form data: localStorage backup (survives session expiry)
5. Mid-signature: signature canvas data preserved in sessionStorage

### Conflict Resolution

**Simultaneous Document Edits:**
- Only one HR Agent can review a document at a time (optimistic locking)
- If another Agent opens it: "This document is currently being reviewed by [Name]."
- After they finish: document appears available again

**Policy Changes During Active Incident:**
- Active incidents retain the policy version from when they were created
- No conflict — versioned policy reference prevents this

---

## 7. Accessibility UX

### Focus Management Strategy

- **Route changes:** Focus moves to page title (h1), announces via `aria-live="polite"`
- **Modal opens:** Focus trapped in modal, first interactive element focused
- **Modal closes:** Focus returns to trigger element
- **Tab changes:** Focus on tab panel content
- **Form step changes:** Focus on step title
- **AI result appears:** Focus not stolen; result announced via `aria-live="polite"`

### Screen Reader Announcements

| Event | Announcement Pattern |
|-------|---------------------|
| AI evaluation complete | "AI analysis complete for incident INC-2026-0042. Confidence: 94%. Recommendation: Written Warning." |
| Document status change | "Document status updated to: Awaiting your signature." |
| Form submission | "Report submitted successfully. Reference number: INC-2026-0042." |
| Error | "Error: [specific message]. [Recovery suggestion.]" |
| Loading state | "Loading. Please wait." (announced once, not repeatedly) |

### Color Contrast (Dark Theme)

| Element | BG | Text | Contrast Ratio | WCAG Level |
|---------|-----|------|---------------|------------|
| Page bg | #111e22 | #e2e8f0 (body) | 11.2:1 | AAA |
| Card bg | #223d44 | #e2e8f0 (body) | 9.8:1 | AAA |
| Primary CTA | #ffd900 | #111e22 | 9.4:1 | AAA |
| Secondary text | #111e22 | #94a3b8 | 5.2:1 | AA |
| Error message | #111e22 | #c93638 | 5.6:1 | AA |
| Success text | #111e22 | #22c55e | 5.8:1 | AA |
| Disabled text | #223d44 | #64748b | 3.1:1 | Not compliant (by design — disabled elements exempt per WCAG 1.4.3) |

### Keyboard Navigation

| Component | Key Pattern |
|-----------|------------|
| Sidebar nav | Tab to sidebar, Arrow keys between items, Enter to navigate |
| Three-panel review | F6 to cycle panels, Tab within panel, Escape to exit |
| Multi-step form | Tab between fields, Enter to advance (when valid) |
| Incident queue | Tab to list, Arrow keys between items, Enter to open |
| Signature canvas | Tab to canvas, Space to activate draw mode, Escape to exit |
| Modal | Tab trapped, Escape to close, Enter on primary action |
| Toast | Tab to focus, Escape to dismiss |

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- All animations replaced with instant state changes
- AI processing indicator: static "Analyzing..." text instead of pulse
- Aceternity UI animations: disabled, replaced with simple fade-in
- Page transitions: no animation
- Signature canvas: still functional (drawing is user-initiated, not animation)

### Touch Target Sizes

- All interactive elements: minimum 44×44px touch target
- Buttons: 48px height minimum
- Sidebar nav items: 48px height
- Form inputs: 48px height
- Icon buttons: 44×44px with visual padding

---

## 8. Responsive Design Strategy

### Breakpoint Behaviors

#### Desktop (≥1280px) — Primary
- Sidebar: expanded 240px, icons + labels
- Three-panel review: 40/30/30 column layout
- Dashboard: 4 stat cards across
- Tables: full column display
- Forms: centered, max-width 640px

#### Laptop (1024-1279px)
- Sidebar: collapsed 64px, icons only, expand on hover (overlay)
- Three-panel review: document 50%, tabs for history/reasoning
- Dashboard: 2×2 stat card grid
- Tables: hide less important columns
- Forms: full-width within content area

#### Tablet (768-1023px)
- Sidebar: hidden, accessible via hamburger menu (left drawer)
- Three-panel review: stacked — document on top, tabs for history/reasoning
- Dashboard: 2×2 stat cards
- Lists: card-based instead of tables
- Forms: full-width

#### Mobile (<768px)
- Sidebar: hidden, bottom navigation bar (5 items max)
- Three-panel review: full-width tabs with swipe
- Dashboard: single column, stat cards stacked
- Multi-step form: full-width, larger touch targets
- E-signature canvas: full-width, touch-optimized

### Critical Component Responsive Behavior

**E-Signature Canvas:**
- Desktop: 400×150px
- Tablet: full-width × 120px
- Mobile: full-width × 100px, touch-optimized stroke
- Orientation change: canvas clears with warning "Canvas cleared due to rotation"

**Three-Panel Review:**
- Desktop: side-by-side
- Laptop: document + tabs
- Tablet: document on top, swipeable panels below
- Mobile: full-width tab navigation

**Multi-Step Form:**
- Desktop: centered 640px
- Mobile: full-width with bottom-fixed "Continue" button
- Step indicator: horizontal on desktop, compact dots on mobile

**Incident Queue:**
- Desktop: table with all columns
- Laptop: table with fewer columns
- Tablet: card list
- Mobile: card list with swipe actions

---

## 9. Onboarding UX

### First-Time Experience by Role

**Company Admin (Setup Wizard):**
1. **Welcome:** "Welcome to AI HR Platform. Let's set up your workspace." + animated illustration
2. **Company Info:** Single form (name, industry, size, country, region) — auto-detect country from IP
3. **Invite Team:** Email invitation form with role selector. "Invite at least 1 HR Agent to get started."
4. **Configure Policies:** "Choose a template to get started" → 3 AI-generated templates → customize → activate
5. **AI Settings:** Confidence threshold slider with explanation. "90% means AI handles routine cases autonomously."
6. **Complete:** "Your workspace is ready!" + dashboard walkthrough tooltips

**Progressive Disclosure:**
- First visit: 4-5 contextual tooltips appear on dashboard, pointing to key features
- Tooltips: "Click here to review AI documents" → dismissed after interaction
- "Don't show tips again" option in profile settings

**HR Agent First Visit:**
1. Welcome modal: "Your admin has set up the workspace. Here's your queue."
2. Empty state: "No incidents yet. When managers submit issues, they'll appear here."
3. Quick guide: "How AI Document Review Works" — 3-step visual explainer

**Manager First Visit:**
1. Welcome modal: "Report employee issues and track their progress."
2. Prominent CTA: "Report your first issue"
3. Team list showing direct reports (pre-populated by Admin)

**Employee First Visit:**
1. Welcome modal: "View and sign HR documents securely."
2. Empty state: "No pending documents."
3. Privacy note: "Your documents are confidential and encrypted."

### Tooltip / Tour Strategy

- **Trigger:** First login only (tracked via `users.last_login_at`)
- **Style:** Dark tooltip with Vanilla Custard arrow, pointing to feature
- **Content:** Short sentence + optional "Learn more" link to docs
- **Navigation:** "Next tip" / "Skip tour" / "Don't show again"
- **Dismissal:** After all tips shown or user clicks "Skip tour"

---

## 10. Notification & Communication Design

### In-App Notification Design

**Bell Icon (Header):**
- Position: top-right, always visible
- Badge: Vanilla Custard circle with count (red for urgent: Night Bordeaux)
- Badge hidden when count = 0
- Click: opens dropdown panel

**Notification Panel:**
```
┌─────────────────────────────────────┐
│ Notifications              [Mark All Read] │
│                                      │
│ 🔵 New AI document for review       │
│    INC-0042 — Written Warning       │
│    2 minutes ago                    │
│                                      │
│ 🔵 John Smith signed DOC-0138       │
│    1 hour ago                       │
│                                      │
│ ⚪ Meeting in 30 minutes            │
│    MTG-0015 — Maria Garcia          │
│    30 minutes ago            [Mark] │
│                                      │
│ [View All Notifications →]           │
└─────────────────────────────────────┘
```

- Unread: left accent bar (Vanilla Custard), bold text
- Read: no accent, regular text
- Hover: Slate Grey bg highlight
- Click: navigates to related entity

### Email Notification Templates

| Event | Recipient | Subject Line | Body Summary |
|-------|-----------|-------------|--------------|
| New incident submitted | HR Agent | "New Issue Reported: [Type] — [Employee]" | Incident details, AI confidence preview, CTA: "Review Now" |
| AI document ready | HR Agent | "AI Document Ready: [Type] — [Employee]" | Document preview, AI recommendation, CTA: "Review Document" |
| Document approved | Manager | "Your Report [Ref] Has Been Approved" | Status update, next steps |
| Meeting scheduled | All participants | "Meeting Scheduled: [Type] — [Employee]" | Date, time, link, agenda summary |
| Document awaiting signature | Employee | "Document Requiring Your Signature" | Document type, due date, CTA: "Review & Sign" |
| Signature reminder (24h) | Employee | "Reminder: Document Awaiting Your Signature" | Urgent but professional tone |
| Signature reminder (72h) | Employee + Manager | "Action Required: Document Still Unsigned" | Escalated tone |
| Signature reminder (7d) | Employee + Manager + HR | "URGENT: Document Overdue for Signature" | Night Bordeaux accent in email |
| Document signed | HR Agent + Manager | "[Employee] Signed [Document Type]" | Confirmation, timestamp |
| Dispute submitted | HR Agent | "Dispute Submitted: [Employee] — [Document]" | Dispute text, original document reference |
| AI service degraded | Super Admin | "AI Service Alert: [Status]" | Impact description, affected tenants, ETA if known |

### Frequency & Batching Rules

| Notification Type | Frequency | Batching |
|-------------------|-----------|----------|
| New incident submitted | Immediate | No batching |
| AI document ready | Immediate | No batching |
| Document signed | Immediate | No batching |
| Signature reminders | Scheduled (24h, 72h, 7d) | Per document |
| Meeting reminders | 30 min before | Per meeting |
| AI budget alerts | At threshold (80%, 100%) | Per tenant |
| System alerts | Immediate | No batching |
| Weekly summary | Weekly (Monday 9am) | All activity batched |

### Urgency Levels

| Level | Visual | Behavior |
|-------|--------|----------|
| **Critical** (system down, security event) | Night Bordeaux badge + pulsing | Toast + bell badge + email + SMS (if configured) |
| **High** (unsigned 7d, dispute) | Brown Red badge | Toast + bell badge + email |
| **Medium** (new review, meeting reminder) | Honey Bronze badge | Bell badge + email |
| **Low** (document signed, weekly summary) | No badge color | Bell count only + digest email |

---

*End of UX Specification*
