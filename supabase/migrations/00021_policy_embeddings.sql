-- ============================================================
-- Migration: 00021_policy_embeddings.sql
-- Description: Create pgvector extension, table and match RPC
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Table to store policy embeddings
CREATE TABLE policy_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX idx_policy_embeddings_vector 
ON policy_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE policy_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read policy embeddings for their company"
    ON policy_embeddings
    FOR SELECT
    USING (company_id = (SELECT company_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Admins/HR can insert embeddings"
    ON policy_embeddings
    FOR INSERT
    WITH CHECK (company_id = (SELECT company_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Admins/HR can update embeddings"
    ON policy_embeddings
    FOR UPDATE
    USING (company_id = (SELECT company_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Admins/HR can delete embeddings"
    ON policy_embeddings
    FOR DELETE
    USING (company_id = (SELECT company_id FROM users WHERE users.id = auth.uid()));

-- RPC for similarity search
CREATE OR REPLACE FUNCTION match_policies(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    company_id_filter uuid
)
RETURNS TABLE (
    policy_id uuid,
    policy_title text,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $function
BEGIN
    RETURN QUERY
    SELECT
        p.id AS policy_id,
        p.title AS policy_title,
        pe.content,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM policy_embeddings pe
    JOIN policies p ON p.id = pe.policy_id
    WHERE pe.company_id = company_id_filter
      AND p.is_active = true
      AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$function;
