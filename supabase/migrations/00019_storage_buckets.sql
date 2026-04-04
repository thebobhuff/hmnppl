-- ============================================================
-- Migration: 00019_storage_buckets.sql
-- Description: Create Supabase storage buckets for file uploads
-- ============================================================

-- Insert storage buckets into Supabase storage system table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('evidence', 'evidence', false, 52428800, -- 50MB
     ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'audio/mpeg', 'audio/wav']),
    ('documents', 'documents', false, 26214400, -- 25MB
     ARRAY['application/pdf']),
    ('avatars', 'avatars', true, 5242880, -- 5MB
     ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- Storage policies for evidence bucket
-- ════════════════════════════════════════════════════════════
CREATE POLICY evidence_upload ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'evidence'
                AND auth.uid() IS NOT NULL
                AND (storage.foldername(name))[1] = public.company_id()::TEXT);

CREATE POLICY evidence_select ON storage.objects
    FOR SELECT
    USING (bucket_id = 'evidence'
           AND auth.uid() IS NOT NULL
           AND (storage.foldername(name))[1] = public.company_id()::TEXT);

CREATE POLICY evidence_delete ON storage.objects
    FOR DELETE
    USING (bucket_id = 'evidence'
           AND auth.uid() IS NOT NULL
           AND (storage.foldername(name))[1] = public.company_id()::TEXT
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'));

-- ════════════════════════════════════════════════════════════
-- Storage policies for documents bucket
-- ════════════════════════════════════════════════════════════
CREATE POLICY documents_upload ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'documents'
                AND auth.uid() IS NOT NULL
                AND (storage.foldername(name))[1] = public.company_id()::TEXT);

CREATE POLICY documents_select ON storage.objects
    FOR SELECT
    USING (bucket_id = 'documents'
           AND auth.uid() IS NOT NULL
           AND (storage.foldername(name))[1] = public.company_id()::TEXT);

CREATE POLICY documents_delete ON storage.objects
    FOR DELETE
    USING (bucket_id = 'documents'
           AND auth.uid() IS NOT NULL
           AND (storage.foldername(name))[1] = public.company_id()::TEXT
           AND public.user_role() IN ('super_admin', 'company_admin', 'hr_agent'));

-- ════════════════════════════════════════════════════════════
-- Storage policies for avatars bucket (public read, auth upload)
-- ════════════════════════════════════════════════════════════
CREATE POLICY avatars_upload ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'avatars'
                AND auth.uid() IS NOT NULL
                AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY avatars_select ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars'); -- public read

CREATE POLICY avatars_update ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'avatars'
           AND auth.uid() IS NOT NULL
           AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY avatars_delete ON storage.objects
    FOR DELETE
    USING (bucket_id = 'avatars'
           AND auth.uid() IS NOT NULL
           AND (storage.foldername(name))[1] = auth.uid()::TEXT);
