-- ============================================================
-- Migration: 00022_realtime_notifications.sql
-- Description: Enable Realtime for notifications updates
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

ALTER TABLE notifications REPLICA IDENTITY FULL;