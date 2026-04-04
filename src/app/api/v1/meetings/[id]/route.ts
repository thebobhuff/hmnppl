/**
 * Single Meeting API — GET, PATCH
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getMeeting, updateMeeting } from "@/lib/services/meeting-service";
import { summarizeMeeting } from "@/lib/services/ai-proxy-service";

export const GET = withAuth({ roles: roleGuards.hrAgent }, async (_request, context) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;
  try {
    const meeting = await getMeeting(user.companyId, params.id);
    if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("[meetings:get] Failed:", error);
    return NextResponse.json({ error: "Failed to get meeting" }, { status: 500 });
  }
});

export const PATCH = withAuth(
  { roles: roleGuards.hrAgentOnly },
  async (request, context) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { notes, generate_summary, status, outcome, action_items } = body as Record<
      string,
      unknown
    >;

    try {
      const updates: Record<string, unknown> = {};
      if (notes) updates.notes = notes;
      if (status) updates.status = status;
      if (outcome) updates.outcome = outcome;
      if (action_items) updates.action_items = action_items;

      if (generate_summary && notes) {
        const summaryResult = await summarizeMeeting({
          meeting_type: "disciplinary",
          action_type: "verbal_warning",
          participants: ["HR Agent", "Manager", "Employee"],
          notes: notes as string,
        });

        if (summaryResult.success && summaryResult.data) {
          updates.ai_summary = summaryResult.data;
        }
      }

      const meeting = await updateMeeting(user.companyId, params.id, updates);
      return NextResponse.json({ meeting });
    } catch (error) {
      console.error("[meetings:update] Failed:", error);
      return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
    }
  },
);
