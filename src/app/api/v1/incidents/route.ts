/**
 * Incidents API — GET list, POST create
 *
 * GET /api/v1/incidents — List incidents (filtered by role)
 * POST /api/v1/incidents — Create a new incident (manager only)
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createIncident,
  listIncidents,
  getDirectReports,
} from "@/lib/services/incident-service";
import { runAIPipeline } from "@/lib/agents/pipeline";
import {
  incidentCreateSchema,
  incidentListFiltersSchema,
} from "@/lib/validations/incident";

// ---------------------------------------------------------------------------
// GET — List incidents
// ---------------------------------------------------------------------------

export const GET = withAuth({ roles: roleGuards.manager }, async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filtersRaw: Record<string, string | null> = {
    status: url.searchParams.get("status"),
    severity: url.searchParams.get("severity"),
    type: url.searchParams.get("type"),
    employee_id: url.searchParams.get("employee_id"),
    date_from: url.searchParams.get("date_from"),
    date_to: url.searchParams.get("date_to"),
    search: url.searchParams.get("search"),
  };

  const filtersParsed = incidentListFiltersSchema.safeParse(filtersRaw);
  const filters = filtersParsed.success ? filtersParsed.data : {};

  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  try {
    const result = await listIncidents(
      user.companyId,
      filters,
      cursor,
      Math.min(limit, 100),
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[incidents:list] Failed:", error);
    return NextResponse.json({ error: "Failed to list incidents" }, { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// POST — Create incident
// ---------------------------------------------------------------------------

export const POST = withAuth({ roles: roleGuards.manager }, async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = incidentCreateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
  }

  try {
    const { incident, referenceNumber } = await createIncident(
      user.companyId,
      user.id,
      parsed.data.employee_id,
      parsed.data,
    );

    // Fire AI pipeline asynchronously (non-blocking)
  // The pipeline updates the incident in DB when complete
  runAIPipeline({
    incidentId: incident.id,
    companyId,
    employeeId,
    incidentType: parsed.data.type,
    description: parsed.data.description,
    severity: parsed.data.severity,
    incidentDate: parsed.data.incident_date,
    referenceNumber,
    previousIncidentCount: incident.previous_incident_count ?? 0,
    policySnapshot: (incident.policy_snapshot as Record<string, unknown>[]) ?? [],
    employeeName: undefined, // Will be fetched by pipeline if needed
  }).catch((pipelineErr) => {
    console.error("[incidents:create] AI pipeline failed (non-fatal):", pipelineErr);
    // Pipeline failure doesn't affect incident creation — it stays in ai_evaluating
  });

  return NextResponse.json(
      {
        incident: {
          id: incident.id,
          status: incident.status,
          reference_number: referenceNumber,
          created_at: incident.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_DIRECT_REPORT") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_DIRECT_REPORT",
            message: "You can only report issues for your direct reports.",
          },
        },
        { status: 403 },
      );
    }

    if (message.includes("not found") || message.includes("inactive")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[incidents:create] Failed:", error);
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
  }
});
