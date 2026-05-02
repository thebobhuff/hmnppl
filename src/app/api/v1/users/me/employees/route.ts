/**
 * My Employees API - GET /api/v1/users/me/employees
 *
 * Returns active employees in the authenticated manager's scope with
 * incident rollups for the My Team page.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { listMyEmployees, type UserResponse } from "@/lib/services/user-service";

type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

interface IncidentRollup {
  total: number;
  open: number;
  closed: number;
  lastIncidentAt: string | null;
  lastIncidentType: string | null;
  maxSeverity: string | null;
  riskLevel: RiskLevel;
}

const CLOSED_STATUSES = new Set(["rejected", "closed", "signed"]);
const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function buildRollup(incidents: Array<Record<string, unknown>>): IncidentRollup {
  const sorted = [...incidents].sort((left, right) =>
    String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")),
  );
  const open = incidents.filter(
    (incident) => !CLOSED_STATUSES.has(String(incident.status)),
  );
  const maxSeverity = incidents.reduce<string | null>((current, incident) => {
    const nextSeverity = String(incident.severity ?? "");
    if (!nextSeverity) return current;
    if (!current) return nextSeverity;
    return (SEVERITY_RANK[nextSeverity] ?? 0) > (SEVERITY_RANK[current] ?? 0)
      ? nextSeverity
      : current;
  }, null);

  let riskLevel: RiskLevel = "none";
  const maxSeverityRank = maxSeverity ? (SEVERITY_RANK[maxSeverity] ?? 0) : 0;

  if (open.length >= 3 || maxSeverityRank >= SEVERITY_RANK.critical) {
    riskLevel = "critical";
  } else if (open.length >= 2 || maxSeverityRank >= SEVERITY_RANK.high) {
    riskLevel = "high";
  } else if (open.length >= 1 || maxSeverityRank >= SEVERITY_RANK.medium) {
    riskLevel = "medium";
  } else if (incidents.length > 0) {
    riskLevel = "low";
  }

  return {
    total: incidents.length,
    open: open.length,
    closed: incidents.length - open.length,
    lastIncidentAt: sorted[0]?.created_at ? String(sorted[0].created_at) : null,
    lastIncidentType: sorted[0]?.type ? String(sorted[0].type) : null,
    maxSeverity,
    riskLevel,
  };
}

export const GET = withAuth(
  { roles: roleGuards.manager },
  async (_request, _context, { user }) => {
    try {
      const employees = await listMyEmployees(user.companyId, user.id, user.departmentId);
      const employeeIds = employees.map((employee) => employee.id);

      const incidentsByEmployee = new Map<string, Array<Record<string, unknown>>>();

      if (employeeIds.length > 0) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("incidents")
          .select("id, employee_id, type, severity, status, created_at")
          .eq("company_id", user.companyId)
          .in("employee_id", employeeIds)
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) {
          throw new Error(`Failed to load employee incident rollups: ${error.message}`);
        }

        for (const incident of data ?? []) {
          const employeeId = incident.employee_id as string;
          const existing = incidentsByEmployee.get(employeeId) ?? [];
          existing.push(incident);
          incidentsByEmployee.set(employeeId, existing);
        }
      }

      const enrichedEmployees = employees.map((employee: UserResponse) => ({
        ...employee,
        relationship:
          employee.manager_id === user.id ? "direct_report" : "department_scope",
        incidentStats: buildRollup(incidentsByEmployee.get(employee.id) ?? []),
      }));

      const summary = enrichedEmployees.reduce(
        (current, employee) => ({
          total: current.total + 1,
          directReports:
            current.directReports + (employee.relationship === "direct_report" ? 1 : 0),
          openIncidents: current.openIncidents + employee.incidentStats.open,
          criticalRisk:
            current.criticalRisk +
            (employee.incidentStats.riskLevel === "critical" ? 1 : 0),
          highRisk:
            current.highRisk + (employee.incidentStats.riskLevel === "high" ? 1 : 0),
          noIncidents:
            current.noIncidents + (employee.incidentStats.riskLevel === "none" ? 1 : 0),
        }),
        {
          total: 0,
          directReports: 0,
          openIncidents: 0,
          criticalRisk: 0,
          highRisk: 0,
          noIncidents: 0,
        },
      );

      return NextResponse.json({ employees: enrichedEmployees, summary });
    } catch (error) {
      console.error("[users:my-employees] Failed:", error);
      return NextResponse.json(
        { error: "Failed to fetch your employees" },
        { status: 500 },
      );
    }
  },
);
