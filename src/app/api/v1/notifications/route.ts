/**
 * Notifications API — GET /api/v1/notifications
 * Lists notifications for the authenticated user.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAuth(async (request, _context, { user }) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const unreadOnly = searchParams.get("unread") === "true";

  const supabase = createAdminClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("company_id", user.companyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[notifications:list] Failed:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    notifications: data ?? [],
    total: count ?? 0,
  });
});