# Spike T006: E-Signature Canvas Legal Feasibility

## Summary

This spike investigated the legal and technical feasibility of implementing electronic signatures for HR documents (offer letters, employment contracts, policy acknowledgments, benefit elections) in the AI HR Platform.

### Key Findings

1. **ESIGN Act and UETA provide a clear framework** for legally enforceable electronic signatures. The requirements are well-defined and technically implementable — 8 core requirements must be satisfied (see [COMPLIANCE_CHECKLIST.md](./COMPLIANCE_CHECKLIST.md)).

2. **A custom signature engine is technically feasible** but carries significant compliance risk. The engineering effort (~120–160 hours) is manageable, but the ongoing legal defensibility burden is substantial. Each signature challenge would require expert testimony to validate the system's integrity.

3. **DocuSign embedded signing (API) is the lower-risk path.** It satisfies all 8 requirements out-of-the-box, has established court precedent, and can be integrated in ~40–60 engineering hours. The trade-off is subscription cost ($200–500/month at typical HR volume).

4. **Six items require legal counsel review** before either path proceeds — most critically the consent disclosure language (the #1 compliance failure point for e-signature implementations).

---

## Recommendation

> **Use DocuSign embedded signing via API.**

The compliance risk of a custom engine is disproportionate to the cost savings for an HR platform handling employment documents. DocuSign provides legal defensibility, certified audit trails, and a path to production that is 2x faster.

### Why Not Custom

| Factor | Reasoning |
|--------|-----------|
| Legal exposure | HR documents are high-stakes. A single compliance gap could invalidate hundreds of employment contracts. |
| Court precedent | Custom engine = zero precedent. DocuSign = upheld in numerous cases. |
| Engineering opportunity cost | 120–160 hours building a signature engine is 120–160 hours not building core HR features. |
| Audit requirements | SOC 2 certification for the signature sub-system would need to be self-managed. DocuSign is already certified. |

### When to Build Custom

Revisit if any of these thresholds are hit:
- Monthly envelope volume > 5,000
- Annual DocuSign spend > $15,000
- DocuSign API uptime < 99.5%
- Jurisdictional coverage gaps for international employees

The [COMPLIANCE_CHECKLIST.md](./COMPLIANCE_CHECKLIST.md) serves as the complete implementation blueprint should we build a custom engine in the future.

---

## Timeline Impact

### If DocuSign Is Chosen (Recommended)

| Phase | Duration | Description |
|-------|----------|-------------|
| Legal review | 1 week | Consent language, escalation cadence, retention policy sign-off |
| DocuSign setup | 2 days | Account provisioning, API key generation, sandbox environment |
| API integration | 1 week | Embedded signing flow, webhook handlers, document routing |
| Testing + UAT | 3 days | Integration tests, manual UAT with HR team |
| **Total** | **~2.5 weeks** | From legal sign-off to production-ready |

### If Custom Engine Is Chosen (Not Recommended)

| Phase | Duration | Description |
|-------|----------|-------------|
| Legal review | 1 week | Same as above, plus additional scrutiny on attribution and tamper evidence |
| Core implementation | 2 weeks | Signature capture, hashing, audit trail, API endpoints |
| Email + escalation | 1 week | Automated email delivery, escalation workflow, opt-out path |
| Security review | 3 days | Pen test on signature verification, hash integrity checks |
| Testing + UAT | 1 week | Full test coverage, manual UAT with HR team |
| **Total** | **~5.5 weeks** | From legal sign-off to production-ready |

**Delta: ~3 weeks** saved by choosing DocuSign.

---

## Items Requiring Stakeholder Decision

| # | Decision Needed | Decision Maker | Blocking? | Deadline |
|---|----------------|---------------|:---------:|----------|
| D1 | **Approve DocuSign subscription** ($200–500/month) | CFO / Finance | **Yes** | Before integration sprint |
| D2 | **Confirm record retention period** (7 years default, 10+ for certain doc types) | Legal + HR | Yes | Before any implementation |
| D3 | **Approve consent disclosure language** | Legal | Yes | Before any implementation |
| D4 | **Define escalation cadence** for non-signers (24h / 72h / 7d proposed) | HR + Legal | No (configurable later) | Before go-live |
| D5 | **Decide on cross-border support** (eIDAS, PIPEDA) for Phase 1 or defer to Phase 2 | Product + Legal | No | Before international rollout |
| D6 | **Approve intent-to-sign modal language** | Legal | Yes | Before any implementation |
| D7 | **Choose embedded vs. redirect signing experience** | Product + UX | No | Before integration sprint |

### Embedded vs. Redirect Signing

| Option | UX | Complexity | Recommendation |
|--------|:--:|:----------:|:--------------:|
| **Embedded** (iframe in our app) | Seamless — user stays in platform | Medium (iframe handling, CORS) | **Recommended** — better employee experience |
| **Redirect** (link to DocuSign) | User leaves platform briefly | Low (generate link, handle callback) | Acceptable fallback if embedded causes issues |

---

## Technical Architecture (DocuSign Path)

```
┌─────────────────────────────────────────────────────────┐
│                    AI HR Platform                        │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Document │───▶│  DocuSign    │───▶│  Signature    │  │
│  │ Service  │    │  Integration │    │  Callback     │  │
│  └──────────┘    │  Service     │    │  Handler      │  │
│       │          └──────┬───────┘    └───────┬───────┘  │
│       │                 │                     │          │
│       ▼                 ▼                     ▼          │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Supabase │    │  DocuSign    │    │  Audit Log    │  │
│  │ Storage  │    │  API         │    │  (append-only)│  │
│  └──────────┘    └──────────────┘    └───────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Flow:
1. HR creates document → stored in Supabase Storage
2. Document Service creates DocuSign envelope via API
3. Employee opens embedded signing view (iframe)
4. DocuSign captures signature, applies tamper-seal
5. Callback handler receives completion webhook
6. Signed PDF stored in Supabase Storage
7. Audit log records full chain of custody
8. Signed copy emailed to employee
```

---

## Next Steps

1. **Schedule legal review meeting** — Present this spike's findings to legal counsel. Walk through the 6 sign-off items in [COMPLIANCE_CHECKLIST.md](./COMPLIANCE_CHECKLIST.md).
2. **Get stakeholder decisions** — D1 (budget) and D2–D3 (legal) must be resolved before the integration sprint begins.
3. **Provision DocuSign sandbox** — Once D1 is approved, set up a developer sandbox for the integration spike.
4. **Create integration tasks** — Break down the DocuSign integration into implementation tasks (T007+) in the build plan.

---

## Files in This Spike

| File | Purpose |
|------|---------|
| `README.md` | This file — decision document and stakeholder guide |
| `COMPLIANCE_CHECKLIST.md` | Full ESIGN/UETA requirements mapping, risk assessment, and legal sign-off tracker |

---

*Spike completed: 2026-03-29*
*Author: Engineering — Task T006*
*Status: COMPLETE — awaiting stakeholder decisions*
