-- ============================================================
-- Migration: 00024_knowledge_documents.sql
-- Description: Store imported policy/handbook source files for AI context.
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(40) NOT NULL DEFAULT 'policy',
    source_file_name TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'documents',
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT NOT NULL,
    extracted_text TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'indexed',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_company_id
    ON knowledge_documents(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_policy_id
    ON knowledge_documents(policy_id);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read knowledge documents for their company"
    ON knowledge_documents
    FOR SELECT
    USING (company_id = (SELECT company_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Admins and HR can insert knowledge documents"
    ON knowledge_documents
    FOR INSERT
    WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE users.id = auth.uid())
        AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent')
    );

CREATE POLICY "Admins and HR can update knowledge documents"
    ON knowledge_documents
    FOR UPDATE
    USING (
        company_id = (SELECT company_id FROM users WHERE users.id = auth.uid())
        AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent')
    );

CREATE POLICY "Admins and HR can delete knowledge documents"
    ON knowledge_documents
    FOR DELETE
    USING (
        company_id = (SELECT company_id FROM users WHERE users.id = auth.uid())
        AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent')
    );

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json'
]
WHERE id = 'documents';

COMMENT ON TABLE knowledge_documents IS 'Source files imported for policy and handbook AI context.';
COMMENT ON COLUMN knowledge_documents.extracted_text IS 'Readable text extracted from the stored source file.';
