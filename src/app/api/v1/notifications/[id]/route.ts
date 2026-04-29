/**
 * Notifications API — PATCH /api/v1/notifications/:id
 * Marks a notification as read.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAuth(async (_request, context, { user }) => {
  const params = await context.params;
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("company_id", user.companyId);

  if (error) {
    console.error("[notifications:patch] Failed:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});