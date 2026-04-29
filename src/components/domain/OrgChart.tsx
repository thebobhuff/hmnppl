/**
 * OrgChart — Hierarchical organization chart visualization.
 *
 * Renders a tree from the org chart API response with expand/collapse
 * and node details on hover/click.
 */
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronDown, ChevronRight, Users, UserCircle, Loader2 } from "lucide-react";
import type { OrgChartNode, OrgChartStats } from "@/lib/api/client";

interface OrgChartProps {
  tree: OrgChartNode[];
  stats: OrgChartStats;
}

const ROLE_COLORS: Record<string, string> = {
  company_admin: "bg-purple-100 text-purple-700 border-purple-200",
  hr_agent: "bg-blue-100 text-blue-700 border-blue-200",
  manager: "bg-green-100 text-green-700 border-green-200",
  employee: "bg-gray-100 text-gray-600 border-gray-200",
};

const ROLE_LABEL: Record<string, string> = {
  company_admin: "Admin",
  hr_agent: "HR",
  manager: "Manager",
  employee: "Employee",
};

export function OrgChart({ tree, stats }: OrgChartProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Total" value={stats.total} />
        <Metric label="Employees" value={stats.employees} />
        <Metric label="Managers" value={stats.managers} />
        <Metric label="HR Agents" value={stats.hrAgents} />
        <Metric label="Max Depth" value={stats.maxDepth} />
      </div>

      {tree.length === 0 ? (
        <EmptyState
          title="No organization data"
          description="Upload employee data to build the org chart."
          icon={<Users className="h-8 w-8" />}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border p-4">
          <div className="min-w-[600px] space-y-1">
            {tree.map((node) => (
              <OrgChartTreeNode key={node.id} node={node} level={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </Card>
  );
}

function OrgChartTreeNode({ node, level }: { node: OrgChartNode; level: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-card-hover"
        style={{ marginLeft: level * 24 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded hover:bg-brand-slate-light"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-text-secondary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            )}
          </button>
        ) : (
          <div className="h-6 w-6 flex-shrink-0" />
        )}

        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-slate-light">
          <UserCircle className="h-5 w-5 text-text-secondary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">{node.name}</p>
            <Badge className={`text-[10px] ${ROLE_COLORS[node.role] ?? ""}`}>
              {ROLE_LABEL[node.role] ?? node.role}
            </Badge>
            {node.status === "invited" && (
              <Badge variant="warning" className="text-[10px]">Invited</Badge>
            )}
            {node.status === "inactive" && (
              <Badge variant="outline" className="text-[10px]">Inactive</Badge>
            )}
          </div>
          <p className="truncate text-xs text-text-tertiary">
            {node.job_title ?? node.email}
          </p>
        </div>

        {hasChildren && (
          <span className="flex-shrink-0 text-xs text-text-tertiary">
            {node.children.length} report{node.children.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <OrgChartTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    </div>
  );
}
