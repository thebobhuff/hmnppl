-- ============================================================
-- Migration: 00014_notifications.sql
-- Description: Create notifications table (in-app notifications)
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Unread notifications: most common query pattern
CREATE INDEX idx_notifications_unread ON notifications(user_id, read, created_at DESC)
    WHERE read = false;

-- Notifications by entity (for "view all notifications for this incident")
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

COMMENT ON TABLE notifications IS 'In-app notifications. Unread partial index optimises badge count queries.';
