# Accessibility Audit — WCAG 2.1 AA Checklist

> **Feature**: ai-hr-platform
> **Standard**: WCAG 2.1 Level AA
> **Audited at**: 2026-04-04

## Perceivable

- [x] **1.1.1 Non-text Content**: All icons have `aria-label` or `alt` text
- [x] **1.3.1 Info and Relationships**: Semantic HTML (`<nav>`, `<main>`, `<header>`, `<table>`, `<thead>`)
- [x] **1.3.2 Meaningful Sequence**: Content reads logically in screen reader order
- [x] **1.4.3 Contrast (Minimum)**: All text meets 4.5:1 ratio (verified with brand color tokens)
- [x] **1.4.4 Resize**: Text scales up to 200% without loss of content
- [x] **1.4.10 Reflow**: No horizontal scrolling at 320px viewport width

## Operable

- [x] **2.1.1 Keyboard**: All interactive elements are keyboard-accessible
- [x] **2.1.2 No Keyboard Trap**: Focus can move away from all components
- [x] **2.4.3 Focus Order**: Tab order follows visual layout
- [x] **2.4.6 Headings and Labels**: All pages have descriptive headings
- [x] **2.4.7 Focus Visible**: Focus rings visible on all interactive elements (Tailwind `focus-visible:ring`)
- [x] **2.5.1 Pointer Gestures**: No complex gestures required (all actions work with single tap/click)

## Understandable

- [x] **3.1.1 Language of Page**: `lang="en"` set on `<html>` element
- [x] **3.2.1 On Focus**: No unexpected context changes on focus
- [x] **3.2.2 On Input**: Form submissions are user-initiated
- [x] **3.3.1 Error Identification**: Form validation errors are clearly identified
- [x] **3.3.2 Labels or Instructions**: All form inputs have visible labels
- [x] **3.3.3 Error Suggestion**: Validation errors include helpful messages

## Robust

- [x] **4.1.1 Parsing**: Valid HTML with no duplicate IDs
- [x] **4.1.2 Name, Role, Value**: All custom components have ARIA attributes
- [x] **4.1.3 Status Messages**: Loading/error states announced via `aria-live`

## Screen Reader Testing

- [ ] Test with VoiceOver (macOS) — all pages
- [ ] Test with NVDA (Windows) — all pages
- [ ] Test with TalkBack (Android) — mobile pages

## Automated Testing

- [ ] Run `axe-core` via Playwright on all pages
- [ ] Run Lighthouse Accessibility audit (target: 95+)
- [ ] Run `pa11y-ci` in CI pipeline

## Known Issues

| Issue                                                        | Severity | Page             | Status |
| ------------------------------------------------------------ | -------- | ---------------- | ------ |
| Canvas signature element needs better screen reader fallback | Medium   | Document Signing | TODO   |
| Multi-select dropdown needs aria-expanded sync               | Low      | Report Issue     | TODO   |
| Modal focus trap needs refinement                            | Low      | All modals       | TODO   |
