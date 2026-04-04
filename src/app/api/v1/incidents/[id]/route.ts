/**
 * Single Incident API — GET detail
 *
 * GET /api/v1/incidents/[id] — Get incident details with employee, reporter, and action info
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getIncident } from "@/lib/services/incident-service";

export const GET = withAuth({ roles: roleGuards.hrAgent }, async (_request, context) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const incidentId = params.id;

  try {
    const incident = await getIncident(user.companyId, incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }
    return NextResponse.json({ incident });
  } catch (error) {
    console.error("[incidents:get] Failed:", error);
    return NextResponse.json({ error: "Failed to get incident" }, { status: 500 });
  }
});
