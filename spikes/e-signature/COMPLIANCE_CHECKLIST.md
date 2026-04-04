# E-Signature Compliance Checklist

## ESIGN Act & UETA Requirements — Technical Mapping

This document maps each federal (ESIGN Act, 15 U.S.C. §§ 7001–7031) and model state law (UETA, U.C. § 7) requirement for legally enforceable electronic signatures to a concrete technical implementation in the AI HR Platform.

> **Audience**: Engineering team, legal counsel (for sign-off items), product stakeholders.
> **Status**: Draft — requires legal review before implementation.

---

## Requirements Matrix

| # | ESIGN/UETA Requirement | Legal Basis | Technical Implementation | Verification Method |
|---|------------------------|-------------|--------------------------|---------------------|
| 1 | **Intent to sign** | ESIGN § 7001(c); UETA § 9(a)(1) | User clicks "Sign Document" button, triggering a confirmation modal with explicit legal language (e.g., "By clicking 'I Agree,' I am signing this document electronically and intend to be bound by its terms"). Modal requires a second affirmative click to proceed. | **Audit log** records: `user_id`, `document_id`, `action: SIGN_INTENT_SHOWN`, `action: SIGN_INTENT_CONFIRMED`, `ip_address`, `user_agent`, `timestamp` (UTC). Audit entries are append-only in `signature_audit_events` table. |
| 2 | **Consent to do business electronically** | ESIGN § 7001(c)(1); UETA § 5–6 | Mandatory acknowledgment checkbox before the signature canvas is enabled: _"I consent to conduct business electronically and understand that my electronic signature has the same legal effect as a handwritten signature."_ Checkbox must be checked; unchecked = signature pad disabled via UI + API guard. | `e_signature_records.consent_given` boolean column, set server-side only when the consent checkbox value is POSTed. `consent_given_at` timestamp recorded. API rejects signature submission if `consent_given !== true`. |
| 3 | **Attribution (who signed)** | UETA § 9(a)(2); ESIGN § 7001(b) | Signature is bound to the authenticated Supabase Auth session. The `signer_id` is extracted from the server-side JWT verification — **never** accepted from the client request body. Session token is validated on every write. | `e_signature_records.signer_id` populated from `supabase.auth.getUser(jwt).data.user.id` on the server. `signer_email` and `signer_name` are also recorded from the auth session. Audit log cross-references `signer_id` with the auth session `session_id`. |
| 4 | **Record retention** | ESIGN § 7001(c)(2); UETA § 12 | Signed documents and signature metadata stored in Supabase Storage + `e_signature_records` table with a minimum 7-year retention policy. **Append-only enforcement**: no `DELETE` permissions on the `e_signature_records` table or the `signature_audit_events` table. RLS policies and database triggers prevent row deletion. | Database RLS policy: `USING (true)` for SELECT, `WITH CHECK (true)` for INSERT, no UPDATE/DELETE grants to any role except `service_role` (used only for compliance operations). Cron job validates no rows have been removed by comparing periodic row-count hashes. |
| 5 | **Tamper evidence** | UETA § 12; ESIGN § 7001(a) | At signing time, compute a **SHA-256 hash** of: (a) the document content bytes, (b) the signature image data, (c) the signer metadata, (d) the timestamp. Store `document_hash`, `signature_hash`, and `composite_hash` in the signature record. On every document read/retrieval, recompute and compare. | API endpoint `/api/v1/documents/{id}/verify` recomputes the SHA-256 hash of the stored document + signature and compares against the persisted `composite_hash`. Returns `{ tampered: false }` or `{ tampered: true, detected_at }`. Any mismatch triggers a security alert and creates an incident record. |
| 6 | **Copy retention / signer access** | ESIGN § 7001(c)(3); UETA § 12(b) | Upon successful signature, the system automatically emails a copy of the signed document (PDF with embedded signature image and metadata) to the signer's email address on file. The signed document is also permanently accessible via the employee's self-service portal. | `email_dispatches` table logs every sent email with `document_id`, `recipient`, `sent_at`, `provider_message_id`. Email includes a unique download link valid for 30 days; document remains available indefinitely in the portal. Integration test verifies email dispatch on every signature event. |
| 7 | **Opt-out right** | ESIGN § 7001(b)(2) | Employee can refuse to sign. The "Decline to Sign" button is presented alongside the signature option. Declining records a `SIGNATURE_DECLINED` audit event and triggers an escalation workflow: notification to HR at 24h, manager at 72h, HR director at 7 days. **No UI path forces a signature** — the employee always has the option to decline or request a paper copy. | Escalation workflow enforced by a `signature_escalations` table and a Supabase Edge Function cron. Each escalation step is logged. KPI: time-to-signature tracked without penalizing decliners. Paper-copy request path generates a `PAPER_COPY_REQUESTED` event. |
| 8 | **Accurate reproduction** | ESIGN § 7001(c)(3); UETA § 12(a) | The signed document is rendered from the same source content that was hashed at signing time. A content versioning system ensures the document shown post-signature is byte-identical to the one signed. The `document_content_version_id` is locked at signature time. | Content hash comparison on every retrieval: the stored `document_hash` is compared against a live hash of the rendered document. If they differ, the retrieval is blocked and an integrity alert is raised. The PDF generation pipeline is deterministic — same content + same template = same output bytes. |

---

## Detailed Implementation Notes

### 1. Intent to Sign

```
User Flow:
  View Document → [Sign Document] button → Modal: "By signing, I agree..." 
  → [Cancel] / [I Agree and Sign] → Signature canvas enabled → Draw signature → Submit
```

**Legal sign-off needed**: Confirm the modal language satisfies "clear and conspicuous" disclosure requirements under ESIGN.

### 2. Consent to Do Business Electronically

The consent checkbox text must disclose:
- What transactions will be conducted electronically
- The right to withdraw consent and any consequences
- How to request a paper copy
- Hardware/software requirements (minimum)

**Legal sign-off needed**: Consent disclosure language must be reviewed by counsel. This is the highest-risk item for compliance gaps.

### 3. Attribution

```
Server-side flow (pseudo-code):
  const jwt = extractBearerToken(request)
  const { data: { user } } = await supabase.auth.getUser(jwt)
  // user.id is the authoritative signer_id — NEVER trust client-sent signer_id
  
  await db.insert('e_signature_records', {
    signer_id: user.id,                    // from auth, not request body
    signer_email: user.email,              // from auth
    signer_name: user.user_metadata.name,  // from auth
    document_id: validatedDocumentId,
    ...
  })
```

### 4. Record Retention

**Append-only enforcement layers:**
1. **RLS Policy**: No DELETE grants on `e_signature_records` or `signature_audit_events`
2. **Database Trigger**: `BEFORE DELETE` trigger raises exception
3. **Application Layer**: ORM/repository has no `deleteSignature()` method
4. **Monitoring**: Weekly row-count integrity check via pg_cron

**Legal sign-off needed**: Confirm 7-year minimum is sufficient for employment records (some jurisdictions require longer for benefits/tax documents — may need 10+ years for certain document types).

### 5. Tamper Evidence

```
Hash computation:
  documentHash = sha256(documentContentBytes)
  signatureHash = sha256(signatureImageBase64)
  compositeHash = sha256(documentHash + signatureHash + signerId + signedAt + documentVersionId)
```

All three hashes are stored in `e_signature_records`. The `compositeHash` is the primary integrity check.

### 6. Copy Retention

Email template includes:
- Signed document as PDF attachment
- Summary: document title, signer name, signature timestamp (UTC)
- Link to permanent portal copy
- Support contact for questions

### 7. Opt-out Right

```
Escalation Timeline:
  t=0h   : Signature requested → notification to employee
  t=24h  : No response → email reminder to employee, notify HR
  t=72h  : No response → notify direct manager
  t=7d   : No response → escalate to HR director
  Any time: Employee can sign, decline, or request paper copy
```

**Legal sign-off needed**: Confirm escalation cadence is reasonable and does not constitute coercion.

### 8. Accurate Reproduction

The document rendering pipeline:
1. Document content is authored in a structured format (Markdown + metadata)
2. At signature time, the content is rendered to PDF deterministically
3. The PDF bytes are hashed and stored
4. Future retrievals serve the exact same PDF (not re-rendered from source)

---

## Items Requiring Legal Sign-Off

| # | Item | Risk Level | Notes |
|---|------|-----------|-------|
| L1 | Consent disclosure language | **High** | Most common compliance failure point. Must meet "clear and conspicuous" standard. |
| L2 | Intent-to-sign modal language | **Medium** | Must be unambiguous. "I agree" language reviewed per jurisdiction. |
| L3 | Record retention duration | **Medium** | 7 years is baseline; certain document types (benefits, tax) may require 10+ years. |
| L4 | Escalation cadence for non-signers | **Medium** | Must not be coercive. Frequency and tone need legal review. |
| L5 | State-by-state UETA adoption variations | **Low** | 49 states have adopted UETA; NY has its own ESIGN-equivalent law. IL, WA have minor variations. |
| L6 | Cross-border considerations | **High** | If platform handles non-US employees, eIDAS (EU), PIPEDA (Canada), and other regional laws apply. |

---

## Risk Assessment: Custom Engine vs. DocuSign

### Custom Signature Engine (Built-In)

| Dimension | Assessment |
|-----------|-----------|
| **Compliance risk** | **Medium-High** — Team must independently satisfy all 8 ESIGN/UETA requirements. Any gap creates legal exposure. No third-party audit or certification to point to. |
| **Development cost** | **~120–160 engineering hours** (signature capture, hashing, audit trail, email delivery, escalation workflow, verification API, testing) |
| **Ongoing maintenance** | **~8–12 hrs/month** — Hash algorithm updates, audit log storage growth, email deliverability monitoring |
| **Legal defensibility** | **Lower** — If a signature is challenged in court, the burden is on us to prove all requirements were met. No established legal precedent for our custom system. |
| **Cost** | **Low marginal cost** — Uses existing Supabase infrastructure. No per-signature fees. |
| **Flexibility** | **High** — Full control over UX, flow, and integration. |
| **Tamper evidence** | **Self-managed** — SHA-256 hashes are cryptographically sound, but the surrounding process has not been independently audited. |
| **Timeline** | **3–4 weeks** to production-ready with full audit trail and tests. |

### DocuSign / Third-Party E-Signature Provider

| Dimension | Assessment |
|-----------|-----------|
| **Compliance risk** | **Low** — DocuSign is ESIGN, UETA, eIDAS, and 21 CFR Part 11 compliant. SOC 2 Type II certified. Has been upheld in court precedent. |
| **Development cost** | **~40–60 engineering hours** (API integration, webhook handling, document routing) |
| **Ongoing maintenance** | **~2–4 hrs/month** — Primarily API version updates and monitoring |
| **Legal defensibility** | **High** — DocuSign signatures have been upheld in numerous court cases. Comprehensive audit trail is generated automatically. |
| **Cost** | **$10–25/month per user** (Business Pro plan) or per-envelope pricing. Estimated $200–500/month for typical HR volume. |
| **Flexibility** | **Medium** — Embedded signing via DocuSign API provides good UX, but flow customization is bounded by DocuSign's capabilities. |
| **Tamper evidence** | **Audited and certified** — DocuSign provides a Certificate of Completion with tamper-evident sealed documents. |
| **Timeline** | **1–2 weeks** to production-ready integration. |

### Risk Comparison Summary

| Risk Factor | Custom Engine | DocuSign |
|-------------|:------------:|:--------:|
| Legal compliance gap | ████████░░ | ██░░░░░░░░ |
| Implementation effort | █████████░ | ███░░░░░░░ |
| Long-term maintenance | ██████░░░░ | ██░░░░░░░░ |
| Ongoing cost | █░░░░░░░░░ | █████░░░░░ |
| Audit/legal defense | █████████░ | ██░░░░░░░░ |
| Vendor lock-in | ░░░░░░░░░░ | ██████░░░░ |

---

## Recommendation

> **Recommendation: Proceed with DocuSign embedded signing via API.**

### Rationale

1. **Compliance is non-negotiable for HR documents.** Employment contracts, offer letters, policy acknowledgments, and benefit elections are high-stakes legal documents. A compliance gap in a custom engine exposes the company to significant legal risk.

2. **Court precedent matters.** DocuSign signatures have been tested and upheld in courts. A custom engine would require expert testimony to establish reliability — an expensive and uncertain path.

3. **Total cost of ownership favors DocuSign at this scale.** The engineering time saved (~80–100 hours at blended rate) offsets 12–18 months of DocuSign subscription fees. At typical HR document volumes (50–200 envelopes/month), the per-envelope cost is negligible.

4. **Speed to market.** DocuSign integration can ship in 1–2 weeks vs. 3–4 weeks for a custom engine. This unblocks dependent features (offer letter workflow, policy acknowledgment tracking).

5. **The exit strategy is clean.** If DocuSign becomes untenable (cost, vendor issues), documents signed during the DocuSign period remain legally valid. A custom engine can be built later and new documents migrated.

### When to Revisit

Re-evaluate building a custom engine if:
- Monthly envelope volume exceeds 5,000 (cost threshold)
- DocuSign API reliability drops below 99.5% uptime
- The company needs signing capabilities in jurisdictions where DocuSign has limited coverage
- Total DocuSign spend exceeds $15,000/year

At that point, the compliance checklist and technical mappings in this document serve as the implementation blueprint for a custom engine.

---

## References

- **ESIGN Act**: Electronic Signatures in Global and National Commerce Act, 15 U.S.C. §§ 7001–7031
- **UETA**: Uniform Electronic Transactions Act, U.C. § 7 (adopted by 49 states)
- **NIST SP 800-102**: Recommendation for Digital Signature Timeliness
- **DocuSign API Documentation**: https://developers.docusign.com/
- **Supabase Auth**: https://supabase.com/docs/guides/auth

---

*Document created: 2026-03-29*
*Last updated: 2026-03-29*
*Author: Engineering — Spike T006*
*Review status: DRAFT — awaiting legal review*
