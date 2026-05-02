"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Search,
  ShieldAlert,
  UserCircle,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  usersAPI,
  type APIError,
  type MyTeamEmployeeResponse,
  type TeamRiskLevel,
} from "@/lib/api/client";

type RiskFilter = TeamRiskLevel | "all";
type RelationshipFilter = "all" | "direct_report" | "department_scope";
type SortKey = "risk" | "name" | "open" | "recent";

const RISK_RANK: Record<TeamRiskLevel, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  none: 1,
};

const RISK_BADGE: Record<
  TeamRiskLevel,
  { label: string; variant: "critical" | "error" | "warning" | "success" | "outline" }
> = {
  critical: { label: "Critical", variant: "critical" },
  high: { label: "High", variant: "error" },
  medium: { label: "Medium", variant: "warning" },
  low: { label: "Watch", variant: "outline" },
  none: { label: "Clear", variant: "success" },
};

export default function MyTeamPage() {
  const [employees, setEmployees] = useState<MyTeamEmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | Error | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("risk");

  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Team" }]);

  useEffect(() => {
    let active = true;

    async function loadTeam() {
      try {
        setLoading(true);
        setError(null);
        const response = await usersAPI.myEmployees();
        if (active) {
          setEmployees(response.employees);
        }
      } catch (err) {
        if (active) {
          setError(err as APIError | Error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTeam();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const directReports = employees.filter(
      (employee) => employee.relationship === "direct_report",
    );
    const elevatedRisk = employees.filter((employee) =>
      ["critical", "high"].includes(employee.incidentStats.riskLevel),
    );

    return {
      total: employees.length,
      directReports: directReports.length,
      openIncidents: employees.reduce(
        (total, employee) => total + employee.incidentStats.open,
        0,
      ),
      elevatedRisk: elevatedRisk.length,
      clear: employees.filter((employee) => employee.incidentStats.riskLevel === "none")
        .length,
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = employees.filter((employee) => {
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch) ||
        (employee.job_title ?? "").toLowerCase().includes(normalizedSearch);

      const matchesRisk =
        riskFilter === "all" || employee.incidentStats.riskLevel === riskFilter;
      const matchesRelationship =
        relationshipFilter === "all" || employee.relationship === relationshipFilter;

      return matchesSearch && matchesRisk && matchesRelationship;
    });

    return filtered.sort((left, right) => {
      if (sortKey === "name") {
        return `${left.last_name} ${left.first_name}`.localeCompare(
          `${right.last_name} ${right.first_name}`,
        );
      }

      if (sortKey === "open") {
        return right.incidentStats.open - left.incidentStats.open;
      }

      if (sortKey === "recent") {
        return (
          dateValue(right.incidentStats.lastIncidentAt) -
          dateValue(left.incidentStats.lastIncidentAt)
        );
      }

      return (
        RISK_RANK[right.incidentStats.riskLevel] -
          RISK_RANK[left.incidentStats.riskLevel] ||
        right.incidentStats.open - left.incidentStats.open ||
        `${left.last_name} ${left.first_name}`.localeCompare(
          `${right.last_name} ${right.first_name}`,
        )
      );
    });
  }, [employees, relationshipFilter, riskFilter, search, sortKey]);

  const attentionQueue = useMemo(
    () =>
      employees
        .filter((employee) =>
          ["critical", "high"].includes(employee.incidentStats.riskLevel),
        )
        .sort(
          (left, right) =>
            RISK_RANK[right.incidentStats.riskLevel] -
              RISK_RANK[left.incidentStats.riskLevel] ||
            right.incidentStats.open - left.incidentStats.open,
        )
        .slice(0, 4),
    [employees],
  );

  if (loading) {
    return (
      <PageContainer title="My Team" description="Your employees and active case status.">
        <LoadingState />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="My Team" description="Your employees and active case status.">
        <Card className="p-8">
          <EmptyState
            title="Team data unavailable"
            description={error.message || "The team list could not be loaded."}
            icon={<AlertTriangle className="h-8 w-8" />}
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="My Team"
      description="Review direct reports, spot active issues, and start manager follow-up."
      actions={
        <Button asChild size="sm">
          <Link href="/report-issue">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Issue
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Team Scope"
            value={summary.total}
          />
          <StatCard
            icon={<UserCircle className="h-5 w-5" />}
            label="Direct Reports"
            value={summary.directReports}
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Open Incidents"
            value={summary.openIncidents}
            tone={summary.openIncidents > 0 ? "warning" : "neutral"}
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5" />}
            label="Elevated Risk"
            value={summary.elevatedRisk}
            tone={summary.elevatedRisk > 0 ? "danger" : "neutral"}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Clear Records"
            value={summary.clear}
            tone="success"
          />
        </div>

        {attentionQueue.length > 0 && (
          <Card className="border-brand-error/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-text-primary">
                  Attention Queue
                </h2>
                <p className="text-sm text-text-secondary">
                  Employees with high-priority open risk signals.
                </p>
              </div>
              <Badge variant="warning">{attentionQueue.length} needs review</Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {attentionQueue.map((employee) => (
                <TeamAlertCard key={employee.id} employee={employee} />
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or title..."
                className="pl-9"
              />
            </div>

            <SegmentedFilter
              label="Risk"
              value={riskFilter}
              onChange={(value) => setRiskFilter(value as RiskFilter)}
              options={[
                { value: "all", label: "All" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "none", label: "Clear" },
              ]}
            />

            <SegmentedFilter
              label="Scope"
              value={relationshipFilter}
              onChange={(value) => setRelationshipFilter(value as RelationshipFilter)}
              options={[
                { value: "all", label: "All" },
                { value: "direct_report", label: "Direct" },
                { value: "department_scope", label: "Dept" },
              ]}
            />

            <SegmentedFilter
              label="Sort"
              value={sortKey}
              onChange={(value) => setSortKey(value as SortKey)}
              options={[
                { value: "risk", label: "Risk" },
                { value: "open", label: "Open" },
                { value: "recent", label: "Recent" },
                { value: "name", label: "Name" },
              ]}
            />
          </div>
        </Card>

        {filteredEmployees.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title={
                employees.length === 0 ? "No employees in scope" : "No matching employees"
              }
              description={
                employees.length === 0
                  ? "No active employees are assigned to your manager scope yet."
                  : "Adjust the search or filters to widen the team list."
              }
              icon={<Users className="h-8 w-8" />}
            />
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredEmployees.map((employee) => (
              <TeamMemberRow key={employee.id} employee={employee} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <Card key={item} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-14" />
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <Skeleton className="h-10 w-full" />
      </Card>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card key={item} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    neutral: "text-text-secondary",
    warning: "text-brand-warning",
    danger: "text-brand-error",
    success: "text-brand-success",
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light ${toneClass}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-text-tertiary">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function TeamAlertCard({ employee }: { employee: MyTeamEmployeeResponse }) {
  const risk = RISK_BADGE[employee.incidentStats.riskLevel];

  return (
    <Link href={`/employees/${employee.id}`}>
      <div className="rounded-lg border border-border p-3 transition-colors hover:bg-card-hover">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {employee.first_name} {employee.last_name}
            </p>
            <p className="text-xs text-text-tertiary">
              {employee.incidentStats.open} open ·{" "}
              {formatCaseLabel(employee.incidentStats.lastIncidentType)}
            </p>
          </div>
          <Badge variant={risk.variant}>{risk.label}</Badge>
        </div>
      </div>
    </Link>
  );
}

function TeamMemberRow({ employee }: { employee: MyTeamEmployeeResponse }) {
  const risk = RISK_BADGE[employee.incidentStats.riskLevel];
  const isDirectReport = employee.relationship === "direct_report";

  return (
    <Card className="p-4 transition-colors hover:border-brand-primary/50 hover:bg-card-hover">
      <div className="grid gap-4 xl:grid-cols-[minmax(260px,1.15fr)_minmax(220px,0.8fr)_minmax(220px,0.8fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-slate-light text-sm font-semibold text-text-primary">
            {initials(employee)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-text-primary">
                {employee.first_name} {employee.last_name}
              </p>
              <Badge variant={isDirectReport ? "outline" : "default"}>
                {isDirectReport ? "Direct" : "Department"}
              </Badge>
            </div>
            <p className="truncate text-xs text-text-tertiary">
              {employee.job_title || formatRole(employee.role)} · {employee.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm xl:grid-cols-3">
          <MiniMetric label="Total" value={employee.incidentStats.total} />
          <MiniMetric label="Open" value={employee.incidentStats.open} />
          <MiniMetric label="Closed" value={employee.incidentStats.closed} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={risk.variant}>{risk.label}</Badge>
          {employee.incidentStats.maxSeverity && (
            <Badge variant="outline">
              Max {formatCaseLabel(employee.incidentStats.maxSeverity)}
            </Badge>
          )}
          <span className="text-xs text-text-tertiary">
            Last case {formatDate(employee.incidentStats.lastIncidentAt)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button asChild size="sm" variant="outline">
            <Link href={`/employees/${employee.id}`}>
              Profile
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/report-issue?employee=${employee.id}`}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Report
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-[11px] font-medium uppercase text-text-tertiary">{label}</p>
      <p className="text-base font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function SegmentedFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
        <Filter className="h-3 w-3" />
        {label}
      </div>
      <div className="flex rounded-lg border border-border bg-brand-slate-light p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              value === option.value
                ? "bg-brand-primary text-text-inverse"
                : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function initials(employee: MyTeamEmployeeResponse) {
  const fallback = employee.email?.[0] ?? "U";
  return (
    `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`
      .trim()
      .toUpperCase() || fallback.toUpperCase()
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCaseLabel(value: string | null | undefined) {
  if (!value) return "No cases";
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "never";
  return new Date(value).toLocaleDateString();
}

function dateValue(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
