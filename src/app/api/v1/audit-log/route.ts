/**
 * Audit Log API — GET audit log entries for the company.
 * Supports filtering by entity_type, action, user_id, and date range.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const getSchema = z.object({
  entity_type: z.string().optional(),
  action: z.string().optional(),
  user_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.string().uuid().optional(),
});

export const GET = withAuth(
  { roles: roleGuards.hrAgent },
  async (request, _context, { user }) => {
    const { searchParams } = new URL(request.url);

    const parsed = getSchema.safeParse({
      entity_type: searchParams.get("entity_type") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      user_id: searchParams.get("user_id") ?? undefined,
      from_date: searchParams.get("from_date") ?? undefined,
      to_date: searchParams.get("to_date") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
        { status: 400 },
      );
    }

    try {
      const admin = createAdminClient();

      let query = admin
        .from("audit_log")
        .select(
          "id, company_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at",
          { count: "exact" },
        )
        .eq("company_id", user.companyId)
        .order("created_at", { ascending: false })
        .limit(parsed.data.limit + 1);

      if (parsed.data.entity_type) {
        query = query.eq("entity_type", parsed.data.entity_type);
      }
      if (parsed.data.action) {
        query = query.eq("action", parsed.data.action);
      }
      if (parsed.data.user_id) {
        query = query.eq("user_id", parsed.data.user_id);
      }
      if (parsed.data.from_date) {
        query = query.gte("created_at", parsed.data.from_date);
      }
      if (parsed.data.to_date) {
        query = query.lte("created_at", parsed.data.to_date);
      }
      if (parsed.data.cursor) {
        query = query.lt("created_at", parsed.data.cursor);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("[audit-log:get] Failed:", error);
        return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
      }

      const hasMore = (data ?? []).length > parsed.data.limit;
      const entries = hasMore ? (data ?? []).slice(0, parsed.data.limit) : data ?? [];
      const nextCursor = hasMore && entries.length > 0 ? entries[entries.length - 1].created_at : undefined;

      const { data: userRecords } = await admin
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("company_id", user.companyId)
        .in(
          "id",
          [...new Set(entries.map((e) => e.user_id).filter(Boolean))],
        );

      const userMap = Object.fromEntries(
        (userRecords ?? []).map((u) => [
          u.id,
          { name: `${u.first_name} ${u.last_name}`, email: u.email },
        ]),
      );

      const formattedEntries = entries.map((entry) => ({
        ...entry,
        user: entry.user_id ? userMap[entry.user_id] ?? null : null,
      }));

      return NextResponse.json({
        entries: formattedEntries,
        total: count ?? 0,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      console.error("[audit-log:get] Failed:", error);
      return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
    }
  },
);