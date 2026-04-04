-- ============================================================
-- Migration: 00012_signatures.sql
-- Description: Create signatures table (e-signatures with dispute
--              tracking and tamper detection)
-- ============================================================

CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    signer_id UUID NOT NULL REFERENCES users(id),
    signer_role user_role NOT NULL,
    signature_type signature_type NOT NULL,
    signature_data TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_hash VARCHAR(64) NOT NULL,
    dispute BOOLEAN NOT NULL DEFAULT false,
    dispute_reason TEXT,
    CONSTRAINT chk_dispute_reason CHECK (dispute = false OR dispute_reason IS NOT NULL)
);

CREATE INDEX idx_signatures_document_id ON signatures(document_id);
CREATE INDEX idx_signatures_signer_id ON signatures(signer_id);
CREATE INDEX idx_signatures_disputed ON signatures(document_id) WHERE dispute = true;

COMMENT ON TABLE signatures IS 'E-signatures on documents. Includes content_hash for tamper detection.';
COMMENT ON COLUMN signatures.content_hash IS 'SHA-256 hash of document content at signing time.';
COMMENT ON COLUMN signatures.dispute_reason IS 'Required when dispute = true. CHECK constraint enforces this.';
