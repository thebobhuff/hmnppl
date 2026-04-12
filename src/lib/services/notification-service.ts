import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/session";

export type NotificationType =
  | "incident_submitted"
  | "ai_evaluation_complete"
  | "document_approved"
  | "document_rejected"
  | "meeting_scheduled"
  | "document_awaiting_signature"
  | "document_signed"
  | "dispute_submitted"
  | "reminder_24h"
  | "reminder_72h"
  | "reminder_7d"
  | "ai_budget_alert";

interface CreateNotificationsInput {
  companyId: string;
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function getNotificationRecipientIds(
  companyId: string,
  roles: UserRole[],
  excludeUserIds: string[] = [],
): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .in("role", roles);

  if (error) {
    throw new Error(`Failed to load notification recipients: ${error.message}`);
  }

  return (data ?? [])
    .map((user) => user.id)
    .filter((id) => !excludeUserIds.includes(id));
}

export async function createNotificationsForUsers({
  companyId,
  userIds,
  type,
  title,
  message,
  entityType,
  entityId,
}: CreateNotificationsInput): Promise<void> {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const rows = uniqueUserIds.map((userId) => ({
    company_id: companyId,
    user_id: userId,
    type,
    title,
    message,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  }));

  const { error } = await supabase.from("notifications").insert(rows);

  if (error) {
    throw new Error(`Failed to create notifications: ${error.message}`);
  }
}