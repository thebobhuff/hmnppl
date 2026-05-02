/**
 * Org Chart API — GET /api/v1/hr/org-chart
 *
 * Returns the full org hierarchy as a tree structure for a given company.
 * Recursively fetches all users and builds a manager_id tree.
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OrgChartNode {
  id: string;
  name: string;
  email: string;
  job_title: string | null;
  role: string;
  status: string;
  manager_id: string | null;
  department_id: string | null;
  children: OrgChartNode[];
}

export const GET = withAuth(async (_request, _context, { user }) => {
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("users")
    .select(
      "id, first_name, last_name, email, job_title, role, status, manager_id, department_id",
    )
    .eq("company_id", user.companyId)
    .order("role", { ascending: false });

  if (error) {
    console.error("[hr:org-chart] Failed:", error);
    return NextResponse.json({ error: "Failed to load org chart" }, { status: 500 });
  }

  const rolePriority: Record<string, number> = {
    company_admin: 0,
    hr_agent: 1,
    manager: 2,
    employee: 3,
  };

  const nodes: OrgChartNode[] = (users ?? []).map((u) => ({
    id: u.id as string,
    name: `${(u.first_name as string) ?? ""} ${(u.last_name as string) ?? ""}`.trim() || (u.email as string),
    email: u.email as string,
    job_title: (u.job_title as string | null) ?? null,
    role: u.role as string,
    status: u.status as string,
    manager_id: (u.manager_id as string | null) ?? null,
    department_id: (u.department_id as string | null) ?? null,
    children: [],
  }));

  const nodeMap = new Map<string, OrgChartNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const roots: OrgChartNode[] = [];

  for (const node of nodes) {
    if (!node.manager_id || !nodeMap.has(node.manager_id)) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.manager_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  function sortNode(node: OrgChartNode): void {
    node.children.sort((a, b) => {
      const roleDiff = (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99);
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name);
    });
    for (const child of node.children) {
      sortNode(child);
    }
  }

  roots.sort((a, b) => {
    const roleDiff = (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    return a.name.localeCompare(b.name);
  });

  for (const root of roots) {
    sortNode(root);
  }

  const stats = {
    total: nodes.length,
    employees: nodes.filter((n) => n.role === "employee").length,
    managers: nodes.filter((n) => n.role === "manager").length,
    hrAgents: nodes.filter((n) => n.role === "hr_agent").length,
    companyAdmins: nodes.filter((n) => n.role === "company_admin").length,
    maxDepth: calcMaxDepth(roots),
  };

  return NextResponse.json({ tree: roots, stats });
});

function calcMaxDepth(nodes: OrgChartNode[]): number {
  if (nodes.length === 0) return 0;
  let max = 0;
  for (const node of nodes) {
    const childDepth = calcMaxDepth(node.children);
    if (childDepth > max) max = childDepth;
  }
  return max + 1;
}
