/**
 * User Timeline API — GET /api/v1/users/[id]/timeline
 *
 * Returns chronological disciplinary history for an employee.
 * Aggregates incidents, documents, meetings, and signatures.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserTimeline } from "@/lib/services/user-service";

export const GET = withAuth({ roles: roleGuards.hrAgent }, async (_request, context) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const timeline = await getUserTimeline(user.companyId, params.id);
    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("[users:timeline] Failed:", error);
    return NextResponse.json({ error: "Failed to get user timeline" }, { status: 500 });
  }
});
