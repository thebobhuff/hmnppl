-- ============================================================
-- Migration: 00009_documents.sql
-- Description: Create documents table (disciplinary letters, PIPs, etc.)
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_hash VARCHAR(64),
    file_url TEXT,
    created_by UUID REFERENCES users(id),
    status document_status NOT NULL DEFAULT 'draft',
    version INT NOT NULL DEFAULT 1,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_document_content CHECK (content IS NOT NULL OR file_url IS NOT NULL)
);

CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_status ON documents(company_id, status);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_type ON documents(company_id, type);

COMMENT ON TABLE documents IS 'Generated documents (written warnings, PIPs, termination letters).';
COMMENT ON COLUMN documents.content_hash IS 'SHA-256 hash of content at time of signature for tamper detection.';
