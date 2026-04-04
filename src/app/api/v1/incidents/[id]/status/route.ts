/**
 * Incident Status Update API — PATCH /api/v1/incidents/[id]/status
 *
 * Updates the incident status through the state machine.
 * Validates that the transition is allowed from the current status.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { updateIncidentStatus } from "@/lib/services/incident-service";
import { incidentStatusUpdateSchema } from "@/lib/validations/incident";

export const PATCH = withAuth(
  { roles: roleGuards.hrAgentOnly },
  async (request, context) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const incidentId = params.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parsed = incidentStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    try {
      const incident = await updateIncidentStatus(
        user.companyId,
        incidentId,
        parsed.data.status,
        parsed.data.reason,
      );

      return NextResponse.json({ incident });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if (message.startsWith("INVALID_TRANSITION")) {
        const allowed = message.split("Allowed: ")[1]?.split(", ") ?? [];
        return NextResponse.json(
          {
            error: "Invalid status transition",
            detail: message,
            allowed_next_states: allowed,
          },
          { status: 409 },
        );
      }

      if (message.includes("not found")) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      }

      console.error("[incidents:status] Failed:", error);
      return NextResponse.json(
        { error: "Failed to update incident status" },
        { status: 500 },
      );
    }
  },
);
