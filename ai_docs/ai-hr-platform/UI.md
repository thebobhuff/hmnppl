# AI HR Platform — UI Specification & Wireframes

> **Status**: Approved
> **Author**: @product-ui-designer (synthesized by Senior PM)
> **Date**: 2026-03-29
> **Sources**: PRD.md (approved), UX.md (Phase 3)

---

## 1. Design System Foundation

### Color Tokens (Tailwind Config)

```javascript
// tailwind.config.ts
colors: {
  brand: {
    'dark-slate':     '#111e22',  // page bg, sidebar
    'slate':          '#223d44',  // card bg, elevated surfaces
    'slate-light':    '#2a4f58',  // hover states, borders
    'slate-lighter':  '#34616c',  // active states
    'vanilla':        '#ffd900',  // primary CTA, accent, links
    'vanilla-dim':    '#ccb200',  // hover CTA
    'honey':          '#db9224',  // secondary accent, badges, pending
    'brown-red':      '#c93638',  // alerts, medium severity
    'bordeaux':       '#e21d24',  // danger, critical, destructive
    'success':        '#22c55e',  // completed, signed
    'success-dim':    '#16a34a',  // hover success
  },
  text: {
    'primary':        '#e2e8f0',  // body text
    'secondary':      '#94a3b8',  // labels, captions
    'tertiary':       '#64748b',  // placeholders, disabled
    'inverse':        '#111e22',  // text on Vanilla Custard
  },
  border: {
    'default':        '#223d44',
    'hover':          '#2a4f58',
    'active':         '#ffd900',
    'error':          '#c93638',
    'success':        '#22c55e',
  },
  overlay: {
    'default':        'rgba(0,0,0,0.6)',
    'light':          'rgba(0,0,0,0.3)',
  },
}
```

### Typography Tokens

```javascript
fontFamily: {
  'display': ['"Playfair Display"', 'Georgia', 'serif'],
  'body':    ['system-ui', '-apple-system', 'sans-serif'],
  'mono':    ['"JetBrains Mono"', 'monospace'],
}

fontSize: {
  'xs':    ['0.75rem',  { lineHeight: '1rem' }],     // 12px — captions
  'sm':    ['0.875rem', { lineHeight: '1.25rem' }],   // 14px — labels
  'base':  ['1rem',     { lineHeight: '1.5rem' }],    // 16px — body
  'lg':    ['1.125rem', { lineHeight: '1.75rem' }],   // 18px — subheadings
  'xl':    ['1.25rem',  { lineHeight: '1.75rem' }],   // 20px — section titles
  '2xl':   ['1.5rem',   { lineHeight: '2rem' }],      // 24px — page titles
  '3xl':   ['1.875rem', { lineHeight: '2.25rem' }],   // 30px — hero
  '4xl':   ['2.25rem',  { lineHeight: '2.5rem' }],    // 36px — landing hero
  '5xl':   ['3rem',     { lineHeight: '1' }],         // 48px — display
}

fontWeight: {
  'normal':    '400',  // body
  'medium':    '500',  // labels, nav items
  'semibold':  '600',  // card titles, form labels
  'bold':      '700',  // page titles, CTAs
  'extrabold': '800',  // landing page hero
}
```

### Spacing Scale

```
4px  → space-1  (tight: inline gaps)
8px  → space-2  (compact: icon-to-text)
12px → space-3  (default: form field gaps)
16px → space-4  (standard: card padding)
24px → space-6  (comfortable: section gaps)
32px → space-8  (generous: page sections)
48px → space-12 (breathing: major sections)
64px → space-16 (page padding)
```

### Border Radius

```
sm:  4px   — badges, tags
md:  6px   — inputs, small cards
lg:  8px   — buttons, modals
xl:  12px  — large cards, panels
2xl: 16px  — feature cards (landing)
full: 9999px — pills, avatars
```

### Shadow Scale

```
sm:   0 1px 2px rgba(0,0,0,0.3)           — subtle elevation
md:   0 4px 6px rgba(0,0,0,0.4)           — cards
lg:   0 10px 15px rgba(0,0,0,0.5)         — modals, dropdowns
xl:   0 20px 25px rgba(0,0,0,0.6)         — landing page features
glow: 0 0 20px rgba(255,217,0,0.15)       — CTA focus
```

---

## 2. Component Inventory (52 Components)

### Layout Components (5)

| Component | Props | States | Notes |
|-----------|-------|--------|-------|
| **Shell** | role, sidebarCollapsed | expanded, collapsed | Top-level layout wrapper |
| **Sidebar** | items, collapsed, activeItem | expanded (240px), collapsed (64px), mobile (drawer) | Dark Slate Grey bg, Vanilla Custard active indicator |
| **Header** | title, breadcrumbs, notifications, user | default, scrolled (sticky + shadow) | Contains breadcrumb, bell, profile dropdown |
| **Footer** | links | — | Landing page only |
| **PageContainer** | title, maxWidth, actions | — | Wraps page content with standard padding |

### Navigation Components (4)

| Component | Props | States |
|-----------|-------|--------|
| **SidebarNavItem** | icon, label, badge, active, href | default, hover (Slate-light bg), active (Vanilla bg-text_inverse), collapsed (icon only) |
| **Breadcrumb** | items: [{label, href}] | — |
| **Tabs** | items, activeTab, onChange | default, active (bottom border Vanilla), hover |
| **Pagination** | currentPage, totalPages, onChange | default, active, disabled |

### Form Components (11)

| Component | Props | States |
|-----------|-------|--------|
| **TextInput** | label, placeholder, error, icon, required | default, focus (Vanilla border), error (Brown Red border + msg), disabled (50% opacity), with icon |
| **Textarea** | label, placeholder, rows, maxLength, error | same as TextInput + character count |
| **Select** | label, options, searchable, error | default, focus, open (dropdown), selected, disabled |
| **MultiSelect** | label, options, selected | default, focus, open, selected chips |
| **DatePicker** | label, value, min, max | default, focus, open (calendar), selected date |
| **TimePicker** | label, value | default, focus, open, selected time |
| **FileUpload** | accept, maxSize, multiple | default (dashed border), drag-over (Vanilla border), uploaded (file chip), error |
| **Toggle** | checked, onChange, label | on (Vanilla), off (Slate), disabled |
| **Radio** | name, options, value | default, selected (Vanilla dot), hover, disabled |
| **Checkbox** | checked, onChange, label | unchecked, checked (Vanilla bg), indeterminate, disabled |
| **FormField** | label, required, error, hint | wraps any input with label + error message |

### Data Display Components (8)

| Component | Props | States |
|-----------|-------|--------|
| **Table** | columns, data, sortable, onSort | default, sorted asc, sorted desc, empty |
| **Card** | title, subtitle, actions, children | default, hover (border highlight) |
| **List** | items, renderItem, emptyMessage | default, empty |
| **Timeline** | events: [{date, type, title, description}] | default, empty |
| **Badge** | label, variant: default/success/warning/error/critical | color by variant |
| **Avatar** | src, name, size: sm/md/lg | image, initials fallback |
| **StatCard** | label, value, change, trend, icon | default, positive (success), negative (error), neutral |
| **DocumentPreview** | content, type | loading, rendered, error |

### Feedback Components (9)

| Component | Props | States |
|-----------|-------|--------|
| **Toast** | message, type: success/info/warning/error, duration | entering, visible, exiting |
| **Alert** | title, message, variant, actions | info, warning, error, success |
| **Modal** | title, isOpen, onClose, size: sm/md/lg | closed, opening, open, closing |
| **Drawer** | title, isOpen, onClose, side: right/bottom | closed, opening, open, closing |
| **Skeleton** | variant: text/circle/rect/card | pulsing animation |
| **EmptyState** | icon, title, description, action | — |
| **ErrorState** | title, message, retry | — |
| **ProgressBar** | value, max, variant: default/success/warning | — |
| **AIIndicator** | status: thinking/done/error, message | thinking (pulse), done (checkmark), error (X) |

### Action Components (4)

| Component | Props | States |
|-----------|-------|--------|
| **Button** | variant: primary/secondary/ghost/danger, size: sm/md/lg, loading, disabled | default, hover, active (pressed), focus (glow), loading (spinner), disabled |
| **DropdownMenu** | trigger, items | closed, open |
| **ContextMenu** | items, x, y | — |
| **LinkButton** | href, icon | default, hover (Vanilla underline) |

### Domain-Specific Components (11)

| Component | Props | States |
|-----------|-------|--------|
| **ESignatureCanvas** | width, height, mode: draw/type, onChange | draw (canvas), type (font selector), empty, signed, error |
| **DocumentViewer** | document, showPolicyRef | loading, rendered, error, with policy sidebar |
| **AIConfidenceIndicator** | score, threshold, size: sm/md/lg | above threshold (success), below (honey), critical (error) |
| **PolicyRuleEditor** | rules, onChange, onConflict | default, editing, drag-over, conflict (warning) |
| **IncidentSeverityBadge** | severity: low/medium/high/critical | low (honey), medium (brown-red), high (bordeaux), critical (bordeaux + pulse) |
| **MeetingParticipantList** | participants, onAdd, onRemove | default, adding, overflow (+N more) |
| **MeetingAgenda** | items, editable | view mode, edit mode |
| **EmployeeDisciplinarySummary** | employee, incidents, stats | with history, no history |
| **NotificationBell** | count, onClick, urgentCount | no notifications, some (Vanilla badge), urgent (Bordeaux badge) |
| **PolicyReferenceLink** | policy, section | default, hover, expanded (drawer) |
| **FormStepIndicator** | steps, currentStep, completed | pending, current (Vanilla), completed (checkmark) |

---

## 3. ASCII Wireframes — All 11 Screens

### Screen 1: Landing Page

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ┌─────────────────────────────────────────────────────────────┐    ║
║   │  ◆ AI HR Platform        Features  Pricing  About          │    ║
║   │                                      [Login] [★ Get Started]│    ║
║   └─────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║                                                                      ║
║                   ██████████████████████████                          ║
║                   █                    █                              ║
║                   █   AI HR Platform   █                              ║
║                   █                    █    ← Playfair Display        ║
║                   ██████████████████████████     5xl extrabold        ║
║                                                                      ║
║              "An HR ERP that's AI-Based."                            ║
║       "Let computers talk to computers.                             ║
║        Let humans manage the human interactions."                    ║
║                                             ← system-ui 2xl medium   ║
║                                                                      ║
║          ┌──────────────────────────────────┐                        ║
║          │    ★ Get Started — Free Trial →  │ ← Vanilla bg,         ║
║          │    (Vanilla Custard, lg, bold)    │   text-inverse         ║
║          └──────────────────────────────────┘                        ║
║                                                                      ║
║       ┌───────────────────────────────────────────┐                  ║
║       │                                           │                  ║
║       │   ┌─────────────────────────────────────┐ │                  ║
║       │   │                                     │ │                  ║
║       │   │   [Aceternity UI Floating Cards]    │ │                  ║
║       │   │   Dark dashboard preview with       │ │                  ║
║       │   │   AI elements and data visualizations│ │                  ║
║       │   │                                     │ │                  ║
║       │   └─────────────────────────────────────┘ │                  ║
║       │                                           │                  ║
║       └───────────────────────────────────────────┘                  ║
║                                                                      ║
║   ──────────────────── FEATURES ────────────────────                  ║
║                                                                      ║
║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              ║
║   │ Slate bg     │  │ Slate bg     │  │ Slate bg     │              ║
║   │ xl border-r  │  │ xl border-r  │  │ xl border-r  │              ║
║   │              │  │              │  │              │              ║
║   │ 🤖 AI        │  │ 📋 Policy    │  │ ✍️ E-Sign    │              ║
║   │   Autonomous │  │   Configure  │  │   Custom     │              ║
║   │   discipline │  │   rules that │  │   signature  │              ║
║   │   agents     │  │   feed AI    │  │   engine     │              ║
║   │              │  │              │  │              │              ║
║   │ [Learn more→]│  │ [Learn more→]│  │ [Learn more→]│              ║
║   └──────────────┘  └──────────────┘  └──────────────┘              ║
║                                                                      ║
║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              ║
║   │ 📊 Analytics │  │ 🔒 Compliant│  │ 🌙 Premium   │              ║
║   │   Real-time  │  │   SOC 2,     │  │   Dark,      │              ║
║   │   HR metrics │  │   HIPAA,     │  │   premium    │              ║
║   │   with AI    │  │   GDPR ready │  │   design     │              ║
║   └──────────────┘  └──────────────┘  └──────────────┘              ║
║                                                                      ║
║   ─────────────────────────────────────────────────                  ║
║                                                                      ║
║         "Ready to transform your HR operations?"                     ║
║                                                                      ║
║     [★ Start Free Trial →]         [Book a Demo →]                  ║
║      Vanilla Custard              Ghost button, Vanilla border        ║
║                                                                      ║
║   ─────────────────────────────────────────────────                  ║
║                                                                      ║
║   Footer: Links | Privacy | Terms | © 2026 AI HR Platform           ║
║           text-secondary, text-xs                                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Token Usage:**
- Page bg: `bg-brand-dark-slate` (#111e22)
- Feature cards: `bg-brand-slate` (#223d44), `border-brand-slate-light`, `rounded-2xl`, `shadow-xl`
- Feature cards hover: `border-brand-vanilla`, `shadow-glow`, `translate-y(-2px)`
- Hero text: `font-display text-5xl font-extrabold text-text-primary`
- Subtitle: `font-body text-2xl font-medium text-text-secondary`
- CTA: `bg-brand-vanilla text-text-inverse font-bold rounded-lg px-8 py-4 text-lg`
- CTA hover: `bg-brand-vanilla-dim shadow-glow`
- Footer: `text-text-tertiary text-xs`

---

### Screen 2: Login / Signup

```
╔══════════════════════════════════════════════════╗
║              bg-brand-dark-slate (full page)      ║
║                                                    ║
║              ┌──────────────────────┐              ║
║              │                      │              ║
║              │  ◆ AI HR Platform    │  ← display   ║
║              │                      │    font, 2xl  ║
║              │  "Welcome Back"      │  ← display   ║
║              │                      │    font, xl   ║
║              │                      │              ║
║              │ ┌──────────────────┐ │              ║
║              │ │ G Continue w/   │ │  Slate bg     ║
║              │ │   Google         │ │  rounded-lg   ║
║              │ └──────────────────┘ │              ║
║              │ ┌──────────────────┐ │              ║
║              │ │ M Continue w/   │ │              ║
║              │ │   Microsoft     │ │              ║
║              │ └──────────────────┘ │              ║
║              │                      │              ║
║              │ ──── or ────        │  text-tertiary║
║              │                      │              ║
║              │ Email                │  text-sm,     ║
║              │ ┌──────────────────┐ │  font-medium  ║
║              │ │ name@company.com │ │  Slate bg     ║
║              │ └──────────────────┘ │  border       ║
║              │                      │              ║
║              │ Password       [👁]  │              ║
║              │ ┌──────────────────┐ │              ║
║              │ │ ••••••••••       │ │              ║
║              │ └──────────────────┘ │              ║
║              │                      │              ║
║              │ ☐ Remember   Forgot?│  checkbox +   ║
║              │                      │  Vanilla link ║
║              │ ┌──────────────────┐ │              ║
║              │ │   Sign In        │ │  Vanilla bg   ║
║              │ │   Vanilla bg     │ │  text-inverse ║
║              │ └──────────────────┘ │  rounded-lg   ║
║              │                      │  font-bold    ║
║              │ No account? Sign up │  text-sm       ║
║              │                      │  Vanilla link ║
║              └──────────────────────┘              ║
║              max-w-[420px] center                    ║
╚══════════════════════════════════════════════════╝
```

**Focus States:**
- Input focus: `ring-2 ring-brand-vanilla ring-offset-2 ring-offset-brand-dark-slate`
- Button focus: `ring-2 ring-brand-vanilla ring-offset-2`

**Error State:**
- Input error: `border-brand-brown-red`, error text below: `text-brand-brown-red text-xs mt-1`

---

### Screen 3: Dashboard Home — HR Agent

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │        │  🏠 Dashboard                    🔔(3)  [👤 Sarah ▾]│    ║
║  │ ◆ AIHR │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-16│    ║
║  │        │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│    ║
║  │ ▸ 🏠   │  │Pending   │ │Meetings  │ │Awaiting  │ │Resolved││    ║
║  │   Dash │  │Review    │ │This Week │ │Signature │ │This Mo ││    ║
║  │ 📨 Inc │  │          │ │          │ │          │ │        ││    ║
║  │ 📅 Meet│  │   3      │ │   2      │ │   5      │ │   12   ││    ║
║  │ 👥 Empl│  │ +2 new   │ │ Next:   │ │ 2 over-  │ │ ↑18%   ││    ║
║  │ 📋 Poli│  │ today    │ │ 2pm     │ │ due      │ │ vs last││    ║
║  │ 📊 Repo│  └──────────┘ └──────────┘ └──────────┘ └────────┘│    ║
║  │        │   Slate bg        Slate bg      Slate bg    Slate  │    ║
║  │        │   rounded-xl      rounded-xl    rounded-xl  rounded │    ║
║  │ ────── │   p-6             p-6           p-6         p-6     │    ║
║  │        │                                                   space-8│
║  │        │  PENDING REVIEWS                       [View All →] │    ║
║  │        │  text-xl font-display font-semibold      text-sm     │    ║
║  │        │                                          Vanilla link║
║  │        │  ┌─────────────────────────────────────────────────┐│    ║
║  │        │  │ 🔵 INC-2026-0042  Tardiness  Medium            ││    ║
║  │        │  │    Written Warning  │  AI: 94% ████████░░       ││    ║
║  │        │  │    John Smith  │  2h ago  │  [Review Now →]    ││    ║
║  │        │  ├─────────────────────────────────────────────────┤│    ║
║  │        │  │ 🔵 INC-2026-0041  Performance  High            ││    ║
║  │        │  │    Manual Review  │  AI: 88% ████████░░        ││    ║
║  │        │  │    Maria Garcia  │  4h ago  │  [Review Now →]  ││    ║
║  │        │  └─────────────────────────────────────────────────┘│    ║
║  │        │   Slate bg, rounded-xl, p-4, divide-y               │    ║
║  │        │                                                   space-8│
║  │        │  UPCOMING MEETINGS                    [View All →]  │    ║
║  │        │  ┌─────────────────────────────────────────────────┐│    ║
║  │        │  │ 📅 Today 2:00pm  │  John Smith  │  Written Warn││    ║
║  │        │  │ 📅 Tomorrow 10am │  Maria Garcia │  PIP         ││    ║
║  │        │  └─────────────────────────────────────────────────┘│    ║
║  │        │                                                   space-8│
║  │        │  RECENT ACTIVITY                                   text-xl│
║  │        │  ┌─────────────────────────────────────────────────┐│    ║
║  │        │  │ • Lisa Park submitted INC-0042         — 2h ago ││    ║
║  │        │  │ • John Smith signed DOC-0138           — 4h ago ││    ║
║  │        │  │ • AI generated summary for MTG-0015    — 1d ago ││    ║
║  │        │  └─────────────────────────────────────────────────┘│    ║
║  │        │                                                          │
║  └────────┴──────────────────────────────────────────────────────┘    ║
║                                                                      ║
║  Sidebar: bg-brand-dark-slate, w-[240px]                             ║
║  Active item: bg-brand-vanilla/10, text-brand-vanilla, left border   ║
║  Content: bg-brand-dark-slate, p-16                                  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Screen 4: Policy Builder (Company Admin)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  📋 Policies > Create New Policy                    │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-8 │    ║
║  │        │  STEP INDICATOR:                               center │    ║
║  │        │  ┌────────┐  ──→  ┌────────┐  ──→  ┌────────┐   ──→  ┌────────┐
║  │        │  │✓ Basic │       │2 Rules │       │3 AI Set│       │4 Review│
║  │        │  │  Info  │       │        │       │  tings │       │        │
║  │        │  └────────┘       └────────┘       └────────┘       └────────┘
║  │        │   Vanilla bg       Slate bg         Slate bg         Slate bg
║  │        │   ✓ icon           2 Vanilla         3 dimmed        4 dimmed
║  │        │                                              space-8 │    ║
║  │        │  ┌───────────────────────────────────────────────┐    ║
║  │        │  │  STRUCTURED RULES                             │    ║
║  │        │  │                                               │    ║
║  │        │  │  ┌─────────────────────────────────────────┐ │    ║
║  │        │  │  │ RULE 1                          [⋮] [×] │ │    ║
║  │        │  │  │                                         │ │    ║
║  │        │  │  │ Trigger:   [Tardiness ▼]                │ │    ║
║  │        │  │  │ Condition: [Severity ≥ Medium ▼]        │ │    ║
║  │        │  │  │            AND [Prior incidents ≥ 1]     │ │    ║
║  │        │  │  │ Action:    [Written Warning ▼]           │ │    ║
║  │        │  │  │                                         │ │    ║
║  │        │  │  │ ─── ESCALATION LADDER ───               │ │    ║
║  │        │  │  │ ⋮⋮  Level 1: Verbal Warning             │ │    ║
║  │        │  │  │ ⋮⋮  Level 2: Written Warning   ← drag  │ │    ║
║  │        │  │  │ ⋮⋮  Level 3: PIP                       │ │    ║
║  │        │  │  │ ⋮⋮  Level 4: Termination Review        │ │    ║
║  │        │  │  │ [+ Add Level]                            │ │    ║
║  │        │  │  └─────────────────────────────────────────┘ │    ║
║  │        │  │   Slate bg, rounded-xl, border-slate-light    │    ║
║  │        │  │                                               │    ║
║  │        │  │  ┌─────────────────────────────────────────┐ │    ║
║  │        │  │  │ RULE 2                          [⋮] [×] │ │    ║
║  │        │  │  │ Trigger:   [Absence ▼]                  │ │    ║
║  │        │  │  │ Condition: [Unexcused ▼]                 │ │    ║
║  │        │  │  │ Action:    [Written Warning ▼]           │ │    ║
║  │        │  │  └─────────────────────────────────────────┘ │    ║
║  │        │  │                                               │    ║
║  │        │  │  [+ Add Rule]   Vanilla ghost button          │    ║
║  │        │  │                                               │    ║
║  │        │  │  ⚠️ Conflict Detected: Rule 1 & 2 overlap     │    ║
║  │        │  │     on "unexcused tardiness + absence combo"  │    ║
║  │        │  │     [Resolve Conflict →]                      │    ║
║  │        │  │     Honey bg/10, Honey text, rounded-md       │    ║
║  │        │  └───────────────────────────────────────────────┘    ║
║  │        │                                              space-8 │    ║
║  │        │  [← Back]                              [Continue →]   │    ║
║  │        │   ghost btn                               primary btn  │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Token Usage:**
- Rule card: `bg-brand-slate rounded-xl border border-brand-slate-light p-6`
- Rule card hover: `border-brand-slate-lighter`
- Drag handle: `⋮⋮ text-text-tertiary hover:text-text-primary cursor-grab`
- Conflict banner: `bg-brand-honey/10 text-brand-honey rounded-md p-4`
- Step indicator current: `bg-brand-vanilla text-text-inverse rounded-lg`
- Step indicator future: `bg-brand-slate text-text-tertiary rounded-lg`
- Step indicator done: `bg-brand-success/20 text-brand-success rounded-lg`

---

### Screen 5: Report Issue Form (Manager, Multi-Step)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  📨 Report an Issue                                 │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-8 │    ║
║  │        │  STEP:  [✓1 Employee] → [✓2 Details] → [3 Evidence]→[4 Review]  │
║  │        │                                              center  │    ║
║  │        │  max-w-[640px]                                        │    ║
║  │        │                                              space-8 │    ║
║  │        │  ┌───────────────────────────────────────────────┐    ║
║  │        │  │  STEP 3: Evidence & Context                   │    ║
║  │        │  │                                     text-xl    │    ║
║  │        │  │                                     font-display│
║  │        │  │                                              space-6│
║  │        │  │  Evidence Files (optional)                    │    ║
║  │        │  │  ┌─────────────────────────────────────┐      │    ║
║  │        │  │  │                                      │      │    ║
║  │        │  │  │   📎 Drag & drop or click to upload  │      │    ║
║  │        │  │  │   Max 10MB each                      │      │    ║
║  │        │  │  │   PDF, JPG, PNG, DOCX                │      │    ║
║  │        │  │  │                                      │      │    ║
║  │        │  │  └─────────────────────────────────────┘      │    ║
║  │        │  │   dashed border-brand-slate-light              │    ║
║  │        │  │   border-dashed rounded-xl p-8                 │    ║
║  │        │  │   drag-over: border-brand-vanilla bg-honey/5   │    ║
║  │        │  │                                              space-4│
║  │        │  │  [📎 email_proof.pdf  ×]  2.3 MB ✓            │    ║
║  │        │  │  [📎 attendance_log.xlsx  ×] 156 KB ✓         │    ║
║  │        │  │   Slate bg chips, rounded-md, text-sm          │    ║
║  │        │  │                                              space-6│
║  │        │  │  Witnesses (optional)                         │    ║
║  │        │  │  ┌─────────────────────────────────────┐      │    ║
║  │        │  │  │ Search employees...            [🔍]  │      │    ║
║  │        │  │  └─────────────────────────────────────┘      │    ║
║  │        │  │  [👤 Sarah Jones ×]  [👤 Alex Rivera ×]      │    ║
║  │        │  │   Vanilla/20 bg chips with avatar             │    ║
║  │        │  │                                              space-6│
║  │        │  │  Union Involvement                           │    ║
║  │        │  │  [●──○ OFF]                                  │    ║
║  │        │  │   Toggle: off=Slate, on=Vanilla               │    ║
║  │        │  └───────────────────────────────────────────────┘    ║
║  │        │                                              space-8 │    ║
║  │        │  [← Back]                              [Continue →]   │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Screen 6: Incident Queue (HR Agent)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  📨 Incident Queue                                  │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-4 │    ║
║  │        │  [AI Review (3)] [Manual (1)] [Approved (12)] [All] │    ║
║  │        │   Tabs: Vanilla bottom-border on active             │    ║
║  │        │                                              space-4 │    ║
║  │        │  ┌─────────────────────────────────────────────┐    │    ║
║  │        │  │ 🔍 Search...  [Severity ▼] [Date ▼] [+Filter]│   │    ║
║  │        │  └─────────────────────────────────────────────┘    │    ║
║  │        │   Filter bar: Slate bg, rounded-lg, p-3             │    ║
║  │        │                                              space-4 │    ║
║  │        │  ┌─────────────────────────────────────────────┐    │    ║
║  │        │  │ ┌─────────────────────────────────────────┐ │    │    ║
║  │        │  │ │ 🔵 INC-2026-0042                        │ │    │    ║
║  │        │  │ │                                          │ │    │    ║
║  │        │  │ │ Tardiness │ ⬤ Medium                    │ │    │    ║
║  │        │  │ │            │  Honey badge                 │ │    │    ║
║  │        │  │ │ John Smith │ Submitted 2h ago            │ │    │    ║
║  │        │  │ │            │ by Lisa Park                │ │    │    ║
║  │        │  │ │                                          │ │    │    ║
║  │        │  │ │ AI Confidence: 94% ████████░░           │ │    │    ║
║  │        │  │ │ Recommendation: Written Warning          │ │    │    ║
║  │        │  │ │ Policy: Attendance Policy v2             │ │    │    ║
║  │        │  │ │                                          │ │    │    ║
║  │        │  │ │                    [Review Now →]        │ │    │    ║
║  │        │  │ │                     Vanilla ghost btn    │ │    │    ║
║  │        │  │ └─────────────────────────────────────────┘ │    │    ║
║  │        │  │  Slate bg, rounded-xl, p-6, left border     │    │    ║
║  │        │  │  border-l-4 border-brand-vanilla             │    │    ║
║  │        │  │                                              │    │    ║
║  │        │  │ ┌─────────────────────────────────────────┐ │    │    ║
║  │        │  │ │ 🔵 INC-2026-0041                        │ │    │    ║
║  │        │  │ │ Performance │ ⬤ High                    │ │    │    ║
║  │        │  │ │             │  Brown Red badge           │ │    │    ║
║  │        │  │ │ Maria Garcia│ Submitted 4h ago           │ │    │    ║
║  │        │  │ │ AI: 88% (below 90% threshold)           │ │    │    ║
║  │        │  │ │ Manual Review Required                   │ │    │    ║
║  │        │  │ │                    [Review Now →]        │ │    │    ║
║  │        │  │ └─────────────────────────────────────────┘ │    │    ║
║  │        │  │  border-l-4 border-brand-honey               │    │    ║
║  │        │  │                                              │    │    ║
║  │        │  │ ┌─────────────────────────────────────────┐ │    │    ║
║  │        │  │ │ 🔵 INC-2026-0040                        │ │    │    ║
║  │        │  │ │ Misconduct │ ⬤ Critical                 │ │    │    ║
║  │        │  │ │            │  Bordeaux badge             │ │    │    ║
║  │        │  │ │ Tom Wilson │ Submitted 1d ago            │ │    │    ║
║  │        │  │ │ AI Confidence: 96%                      │ │    │    ║
║  │        │  │ │ Recommendation: Termination Review       │ │    │    ║
║  │        │  │ │                    [Review Now →]        │ │    │    ║
║  │        │  │ └─────────────────────────────────────────┘ │    │    ║
║  │        │  │  border-l-4 border-brand-bordeaux            │    │    ║
║  │        │  └─────────────────────────────────────────────┘    │    ║
║  │        │                                              space-4 │    ║
║  │        │  [Load More]   ghost button, centered                    │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Severity Badge Colors:**
- Low: `bg-brand-honey/20 text-brand-honey`
- Medium: `bg-brand-honey/20 text-brand-honey`
- High: `bg-brand-brown-red/20 text-brand-brown-red`
- Critical: `bg-brand-bordeaux/20 text-brand-bordeaux` + pulse animation

---

### Screen 7: AI Document Review (Three-Panel)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  INC-2026-0042 > Review                             │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │  (no page padding — panels fill space)              │    ║
║  │        │                                                      │    ║
║  │        │  ┌──────────────────┬─────────────┬──────────────┐  │    ║
║  │        │  │ LEFT PANEL       │ CENTER      │ RIGHT PANEL  │  │    ║
║  │        │  │ (flex-2)         │ (flex-1.5)  │ (flex-1.5)   │  │    ║
║  │        │  │ 40%              │ 30%         │ 30%          │  │    ║
║  │        │  │                  │             │              │  │    ║
║  │        │  │ ┌──────────────┐ │ ┌─────────┐│ ┌──────────┐ │  │    ║
║  │        │  │ │ DOCUMENT     │ │ │ EMPLOYEE││ │ AI       │ │  │    ║
║  │        │  │ │              │ │ │ PROFILE ││ │ REASONING│ │  │    ║
║  │        │  │ │ RE: Written  │ │ │         ││ │          │ │  │    ║
║  │        │  │ │ Warning —    │ │ │ John    ││ │ Matched: │ │  │    ║
║  │        │  │ │ Tardiness    │ │ │ Smith   ││ │ Attend.  │ │  │    ║
║  │        │  │ │              │ │ │ Dev.    ││ │ Policy v2│ │  │    ║
║  │        │  │ │ Dear John,   │ │ │         ││ │ §3.2     │ │  │    ║
║  │        │  │ │              │ │ │ ─────── ││ │          │ │  │    ║
║  │        │  │ │ This letter  │ │ │ TIMELINE││ │ Conf:    │ │  │    ║
║  │        │  │ │ serves as a  │ │ │         ││ │ 94%      │ │  │    ║
║  │        │  │ │ formal       │ │ │ '24-06  ││ │ ██████░░ │ │  │    ║
║  │        │  │ │ written      │ │ │  Hire   ││ │          │ │  │    ║
║  │        │  │ │ warning...   │ │ │ '25-03  ││ │ Breakdown│ │  │    ║
║  │        │  │ │              │ │ │  Verbal ││ │ Policy:97│ │  │    ║
║  │        │  │ │              │ │ │  Warning││ │ History:91│ │  │    ║
║  │        │  │ │              │ │ │ '25-08  ││ │ Severity:│ │  │    ║
║  │        │  │ │              │ │ │  Perf.  ││ │ 95       │ │  │    ║
║  │        │  │ │              │ │ │  Review ││ │          │ │  │    ║
║  │        │  │ │              │ │ │ '26-03  ││ │ ──────── │ │  │    ║
║  │        │  │ │              │ │ │ ← NOW   ││ │ Alts:    │ │  │    ║
║  │        │  │ │              │ │ │         ││ │ Verbal   │ │  │    ║
║  │        │  │ │              │ │ │         ││ │ (78%)    │ │  │    ║
║  │        │  │ │              │ │ │         ││ │ PIP      │ │  │    ║
║  │        │  │ │              │ │ │         ││ │ (62%)    │ │  │    ║
║  │        │  │ └──────────────┘ │ └─────────┘│ └──────────┘ │  │    ║
║  │        │  │ Slate bg         │ Slate bg   │ Slate bg     │  │    ║
║  │        │  │ p-6 overflow-y   │ p-4        │ p-4          │  │    ║
║  │        │  │ editable cursor  │            │              │  │    ║
║  │        │  └──────────────────┴─────────────┴──────────────┘  │    ║
║  │        │                                                      │    ║
║  │        │  ┌──────────────────────────────────────────────┐    │    ║
║  │        │  │ [✅ Approve] [✏️ Approve w/Edits] [❌ Reject] │    │    ║
║  │        │  │                                               │    │    ║
║  │        │  │  primary        secondary          danger     │    │    ║
║  │        │  │  Vanilla bg     Slate bg           Bordeaux   │    │    ║
║  │        │  └──────────────────────────────────────────────┘    │    ║
║  │        │  Sticky bottom action bar, Slate bg, p-4            │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Three-Panel Responsive Behavior:**
- **Desktop (≥1280px):** 3 columns side by side
- **Laptop (1024-1279px):** Left panel 50% + tabbed center/right
- **Tablet (768-1023px):** Document on top, swipeable tabs below
- **Mobile (<768px):** Full-width tabs: [Document] [History] [AI Reasoning]

---

### Screen 8: Meeting Scheduler

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  📅 Schedule Meeting                                │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-8 │    ║
║  │        │  max-w-[640px] center                                │    ║
║  │        │                                              space-6 │    ║
║  │        │  Meeting Type                                         │    ║
║  │        │  ┌──────────────────────────────────────────┐       │    ║
║  │        │  │ Written Warning Discussion                │       │    ║
║  │        │  └──────────────────────────────────────────┘       │    ║
║  │        │  (auto-populated, readonly)                         │    ║
║  │        │                                              space-6 │    ║
║  │        │  Participants                                         │    ║
║  │        │  ┌──────────────────────────────────────────────┐   │    ║
║  │        │  │ ✅ [👤 John Smith]  Employee                 │   │    ║
║  │        │  │ ✅ [👤 Lisa Park]   Manager                  │   │    ║
║  │        │  │ ✅ [👤 You]         HR Agent                 │   │    ║
║  │        │  │ [+ Add Participant]                          │   │    ║
║  │        │  └──────────────────────────────────────────────┘   │    ║
║  │        │  Avatar chips with role labels                       │    ║
║  │        │                                              space-6 │    ║
║  │        │  AI-Generated Agenda                               │    ║
║  │        │  ┌──────────────────────────────────────────────┐   │    ║
║  │        │  │ 🤖 AI Agenda (editable)                     │   │    ║
║  │        │  │                                               │   │    ║
║  │        │  │ 1. Review of incident details       [✏️] [×] │   │    ║
║  │        │  │ 2. Policy ref: Attendance §3.2     [✏️] [×] │   │    ║
║  │        │  │ 3. Discussion of improvement plan   [✏️] [×] │   │    ║
║  │        │  │ 4. Next steps and follow-up         [✏️] [×] │   │    ║
║  │        │  │ [+ Add Item]                                  │   │    ║
║  │        │  └──────────────────────────────────────────────┘   │    ║
║  │        │  Slate bg, rounded-xl, p-4                           │    ║
║  │        │  AI items have Vanilla left border                   │    ║
║  │        │                                              space-6 │    ║
║  │        │  ┌──────────────┐  ┌──────────────┐                 │    ║
║  │        │  │ Date         │  │ Time         │                 │    ║
║  │        │  │ [📅 Apr 2  ] │  │ [🕐 10:00 ] │                 │    ║
║  │        │  └──────────────┘  └──────────────┘                 │    ║
║  │        │                                              space-4 │    ║
║  │        │  Duration  [30 min ▼]                                │    ║
║  │        │                                              space-4 │    ║
║  │        │  Meeting Link                                         │    ║
║  │        │  ┌──────────────────────────────────────────┐       │    ║
║  │        │  │ Paste Zoom/Teams/Meet URL...              │       │    ║
║  │        │  └──────────────────────────────────────────┘       │    ║
║  │        │                                              space-8 │    ║
║  │        │  [Cancel]                                [Schedule]  │    ║
║  │        │   ghost btn                               primary    │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Screen 9: Meeting Summary (AI-Generated, Editable)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  MTG-2026-0015 > Summary                            │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-4 │    ║
║  │        │  ┌──────────────────────────┐ ┌────────────────┐   │    ║
║  │        │  │ AI MEETING SUMMARY       │ │ ORIGINAL NOTES │   │    ║
║  │        │  │ (flex-3, 60%)            │ │ (flex-2, 40%)  │   │    ║
║  │        │  │                          │ │                │   │    ║
║  │        │  │ 🤖 AI Generated          │ │ 📝 HR Notes    │   │    ║
║  │        │  │ Editable — click to edit │ │ (reference)    │   │    ║
║  │        │  │                          │ │                │   │    ║
║  │        │  │ Meeting Summary:         │ │ Discussed      │   │    ║
║  │        │  │ Written Warning          │ │ tardiness      │   │    ║
║  │        │  │ Date: April 2, 2026      │ │ pattern. John  │   │    ║
║  │        │  │                          │ │ acknowledged   │   │    ║
║  │        │  │ ── Key Discussion ──     │ │ the issue.     │   │    ║
║  │        │  │ 1. Employee acknowledged │ │ Agreed to      │   │    ║
║  │        │  │    pattern of tardiness  │ │ improve        │   │    ║
║  │        │  │ 2. Manager confirmed     │ │ punctuality.   │   │    ║
║  │        │  │    impact on scheduling  │ │ Lisa will      │   │    ║
║  │        │  │ 3. Employee expressed    │ │ track weekly... │   │    ║
║  │        │  │    commitment to improve │ │                │   │    ║
║  │        │  │                          │ │                │   │    ║
║  │        │  │ ── Action Items ──       │ │                │   │    ║
║  │        │  │ • John: Arrive on time   │ │                │   │    ║
║  │        │  │   By: Apr 30  [✏️]       │ │                │   │    ║
║  │        │  │ • Lisa: Weekly check-in  │ │                │   │    ║
║  │        │  │   By: Apr 30  [✏️]       │ │                │   │    ║
║  │        │  │                          │ │                │   │    ║
║  │        │  │ ── Follow-Up ──          │ │                │   │    ║
║  │        │  │ Next check-in: Apr 30    │ │                │   │    ║
║  │        │  │                          │ │                │   │    ║
║  │        │  │ [+ Add Section]          │ │                │   │    ║
║  │        │  └──────────────────────────┘ └────────────────┘   │    ║
║  │        │  Slate bg, p-6              Slate bg, p-4          │    ║
║  │        │  left border Vanilla        text-secondary          │    ║
║  │        │  editable sections          read-only               │    ║
║  │        │                                              space-4 │    ║
║  │        │  [Edit Summary]  [Finalize & Send to Employee]     │    ║
║  │        │   secondary btn    Vanilla primary CTA              │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Screen 10: Employee Portal — Pending Documents

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  🏠 My Documents                                    │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-6 │    ║
║  │        │  PENDING SIGNATURE (1)                             │    ║
║  │        │  text-xl font-display Vanilla text                  │    ║
║  │        │                                              space-4 │    ║
║  │        │  ┌─────────────────────────────────────────────┐    │    ║
║  │        │  │                                              │    │    ║
║  │        │  │  ⏳ Written Warning — Tardiness              │    │    ║
║  │        │  │     text-lg font-semibold                    │    │    ║
║  │        │  │                                              │    │    ║
║  │        │  │  Reference: INC-2026-0042                   │    │    ║
║  │        │  │  Date: March 30, 2026                       │    │    ║
║  │        │  │  Status: Awaiting your signature             │    │    ║
║  │        │  │  Honey badge                                  │    │    ║
║  │        │  │                                              │    │    ║
║  │        │  │  ┌──────────────────────────────────┐        │    │    ║
║  │        │  │  │     Review & Sign →               │        │    │    ║
║  │        │  │  │     Vanilla primary CTA            │        │    │    ║
║  │        │  │  └──────────────────────────────────┘        │    │    ║
║  │        │  │                                              │    │    ║
║  │        │  └─────────────────────────────────────────────┘    │    ║
║  │        │  Slate bg, rounded-xl, p-6, border-l-4 Honey       │    ║
║  │        │                                              space-8 │    ║
║  │        │  SIGNED DOCUMENTS (3)                             │    ║
║  │        │  text-lg text-secondary                            │    ║
║  │        │                                              space-4 │    ║
║  │        │  ┌─────────────────────────────────────────────┐    │    ║
║  │        │  │ ✓ Verbal Warning — Tardiness    Jan 15, 26  │    │    ║
║  │        │  ├─────────────────────────────────────────────┤    │    ║
║  │        │  │ ✓ Performance Review — Annual   Oct 2025    │    │    ║
║  │        │  ├─────────────────────────────────────────────┤    │    ║
║  │        │  │ ✓ Offer Letter                  Jun 2024    │    │    ║
║  │        │  └─────────────────────────────────────────────┘    │    ║
║  │        │  Slate bg, rounded-xl, divide-y, text-secondary     │    ║
║  │        │  Success icon, click to view document                │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Screen 11: Document Signing (with E-Signature Canvas)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ┌────────┬─────────────────────────────────────────────────────┐    ║
║  │ SIDE   │  Sign Document: Written Warning                     │    ║
║  │ BAR    │─────────────────────────────────────────────────────│    ║
║  │        │                                              space-6 │    ║
║  │        │  max-w-[800px] center                                │    ║
║  │        │                                              space-4 │    ║
║  │        │  ┌──────────────────────────────────────────────┐   │    ║
║  │        │  │                                              │   │    ║
║  │        │  │  DOCUMENT PREVIEW                            │   │    ║
║  │        │  │                                              │   │    ║
║  │        │  │  RE: Written Warning — Tardiness             │   │    ║
║  │        │  │  Reference: INC-2026-0042                    │   │    ║
║  │        │  │                                              │   │    ║
║  │        │  │  Dear John,                                  │   │    ║
║  │        │  │                                              │   │    ║
║  │        │  │  This letter serves as a formal written       │   │    ║
║  │        │  │  warning for repeated tardiness...            │   │    ║
║  │        │  │                                              │   │    ║
║  │        │  │  [Full document text rendered with            │   │    ║
║  │        │  │   proper formatting, paragraphs, lists]       │   │    ║
║  │        │  │                                              │   │    ║
║  │        │  │  Policy Reference:                           │   │    ║
║  │        │  │  [📎 Attendance Policy v2, Section 3.2]      │   │    ║
║  │        │  │   Vanilla link, opens side drawer             │   │    ║
║  │        │  │                                              │   │    ║
║  │        │  └──────────────────────────────────────────────┘   │    ║
║  │        │  Slate bg, rounded-xl, p-8                          │    ║
║  │        │  Document text: text-primary, text-base, leading-7  │    ║
║  │        │                                              space-6 │    ║
║  │        │  ─── ACKNOWLEDGMENT ────────────────────────────    │    ║
║  │        │                                              space-3 │    ║
║  │        │  ☐ I acknowledge receipt and understanding of       │    ║
║  │        │    this document. I understand this constitutes     │    ║
║  │        │    a formal written warning.                        │    ║
║  │        │  text-sm text-primary                               │    ║
║  │        │  Unchecked: border-slate-light                      │    ║
║  │        │  Checked: bg-vanilla border-vanilla ✓                │    ║
║  │        │                                              space-6 │    ║
║  │        │  ─── SIGNATURE ────────────────────────────────    │    ║
║  │        │                                              space-3 │    ║
║  │        │  Signature Method:                                   │    ║
║  │        │  [✏️ Draw]  [⌨️ Type]                                │    ║
║  │        │   active: Vanilla bg    inactive: Slate bg           │    ║
║  │        │                                              space-3 │    ║
║  │        │  ┌──────────────────────────────────────────┐       │    ║
║  │        │  │                                          │       │    ║
║  │        │  │                                          │       │    ║
║  │        │  │          [Canvas Drawing Area]            │       │    ║
║  │        │  │     400×150px desktop                    │       │    ║
║  │        │  │     Vanilla stroke, 2px                  │       │    ║
║  │        │  │     bg: slightly lighter Slate            │       │    ║
║  │        │  │                                          │       │    ║
║  │        │  │                          [Clear]         │       │    ║
║  │        │  └──────────────────────────────────────────┘       │    ║
║  │        │  Slate-lighter bg, rounded-lg, border-dashed        │    ║
║  │        │  Canvas has crosshair cursor in draw mode           │    ║
║  │        │                                              space-6 │    ║
║  │        │  ┌──────────────┐  ┌──────────────────────────┐    │    ║
║  │        │  │ Dispute      │  │ ✍️ Sign Document          │    │    ║
║  │        │  │ (if enabled) │  │    Vanilla primary CTA    │    │    ║
║  │        │  │ danger ghost │  │    disabled until:        │    │    ║
║  │        │  │ Bordeaux text│  │    ☑ acknowledged +       │    │    ║
║  │        │  └──────────────┘  │    signature not empty    │    │    ║
║  │        │                    └──────────────────────────┘    │    ║
║  └────────┴─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 4. Animation & Motion Philosophy

### Motion Principles

1. **Purposeful:** Every animation serves a function (feedback, guidance, or transition). No decorative motion.
2. **Subtle:** Animations are 150-300ms. Nothing flashy. The product feels responsive, not flashy.
3. **Respectful:** No motion that could cause discomfort. `prefers-reduced-motion` always supported.

### Animation Inventory

| Element | Animation | Duration | Easing | Reduced Motion |
|---------|-----------|----------|--------|----------------|
| Page transition | Fade in | 150ms | ease-out | Instant |
| Modal open | Scale (0.95→1) + fade | 200ms | ease-out | Instant |
| Modal close | Scale (1→0.95) + fade | 150ms | ease-in | Instant |
| Drawer slide | Translate X | 200ms | ease-out | Instant |
| Toast enter | Slide down + fade | 200ms | ease-out | Instant |
| Toast exit | Slide up + fade | 150ms | ease-in | Instant |
| Skeleton pulse | Opacity 0.4→0.7 | 1500ms | ease-in-out | Static opacity |
| AI processing | Dot pulse | 1500ms | ease-in-out | Static dot |
| Card hover | translateY(-2px) | 150ms | ease-out | No movement |
| Button hover | Scale(1.02) | 100ms | ease-out | No movement |
| Button active | Scale(0.98) | 50ms | ease-out | No movement |
| Severity badge (critical) | Pulse glow | 2000ms | ease-in-out | Static |
| Landing page hero text | Typewriter (Aceternity) | Custom | Custom | Fade-in only |
| Landing page cards | Float (Aceternity) | Custom | Custom | Static |

### Easing Curves

```css
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);    /* standard deceleration */
--ease-in:     cubic-bezier(0.4, 0.0, 1, 1);       /* standard acceleration */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);     /* standard ease */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* bouncy (modals only) */
```

---

## 5. Dark Theme Implementation Notes

### Surface Elevation System

```
Level 0: #111e22  — Page background, sidebar
Level 1: #162a30  — Subtle raised areas (slightly lighter than page)
Level 2: #223d44  — Cards, panels, elevated surfaces
Level 3: #2a4f58  — Hover states, active surfaces
Level 4: #34616c  — Tooltips, popovers, highest elevation
```

### Focus Ring System

All focusable elements use the same focus ring for consistency:
```css
focus-visible: ring-2 ring-brand-vanilla ring-offset-2 ring-offset-brand-dark-slate
```

### Selection Colors

```css
::selection {
  background: rgba(255, 217, 0, 0.3);  /* Vanilla Custard at 30% */
  color: #e2e8f0;                       /* text-primary */
}
```

### Scrollbar Styling

```css
/* Custom dark scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #111e22; }
::-webkit-scrollbar-thumb { background: #223d44; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #2a4f58; }
```

---

*End of UI Specification & Wireframes*
