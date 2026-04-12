"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Loader2,
  UserCircle,
  ShieldAlert,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { usersAPI, incidentsAPI, type UserResponse, type IncidentResponse } from "@/lib/api/client";

type SortKey = "name" | "incidents" | "severity" | "recent";
type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

interface EmployeeRisk {
  user: UserResponse;
  incidentCount: number;
  openIncidents: number;
  maxSeverity: string;
  lastIncidentDate: string | null;
  riskLevel: RiskLevel;
}

export default function EmployeesPage() {
  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "Employees" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("severity");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetch() {
      try {
        const [usersRes, incRes] = await Promise.all([
          usersAPI.list({ limit: 200 }),
          incidentsAPI.list({ limit: "200" }),
        ]);
        if (active) {
          setUsers(usersRes.users);
          setIncidents(incRes.incidents);
        }
      } catch (err) {
        console.error("Failed to load employee data", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetch();
    return () => { active = false; };
  }, []);

  const employees = users.filter((u) => u.role === "EMPLOYEE" || u.role === "MANAGER");

  const riskMap = useMemo(() => {
    const map = new Map<string, EmployeeRisk>();
    for (const emp of employees) {
      const empIncidents = incidents.filter((i) => i.employee_id === emp.id);
      const open = empIncidents.filter(
        (i) => !["approved", "rejected", "resolved", "closed", "signed"].includes(i.status),
      );
      const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const maxSev = empIncidents.reduce<string>((max, i) => {
        if ((severityOrder[i.severity] ?? 0) > (severityOrder[max] ?? 0)) return i.severity;
        return max;
      }, "");
      const lastDate = empIncidents.length > 0
        ? empIncidents.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
        : null;

      let risk: RiskLevel = "none";
      if (open.length >= 3 || (severityOrder[maxSev] ?? 0) >= 4) risk = "critical";
      else if (open.length >= 2 || (severityOrder[maxSev] ?? 0) >= 3) risk = "high";
      else if (open.length >= 1 || (severityOrder[maxSev] ?? 0) >= 2) risk = "medium";
      else if (empIncidents.length > 0) risk = "low";

      map.set(emp.id, {
        user: emp,
        incidentCount: empIncidents.length,
        openIncidents: open.length,
        maxSeverity: maxSev,
        lastIncidentDate: lastDate,
        riskLevel: risk,
      });
    }
    return map;
  }, [employees, incidents]);

  const filtered = useMemo(() => {
    let list = Array.from(riskMap.values());

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.user.first_name.toLowerCase().includes(q) ||
          e.user.last_name.toLowerCase().includes(q) ||
          e.user.email.toLowerCase().includes(q) ||
          (e.user.job_title ?? "").toLowerCase().includes(q),
      );
    }

    if (filterRisk !== "all") {
      list = list.filter((e) => e.riskLevel === filterRisk);
    }

    const dir = sortAsc ? 1 : -1;
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return dir * `${a.user.last_name}, ${a.user.first_name}`.localeCompare(`${b.user.last_name}, ${b.user.first_name}`);
        case "incidents":
          return dir * (a.incidentCount - b.incidentCount);
        case "severity": {
          const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
          return dir * ((order[a.riskLevel] ?? 0) - (order[b.riskLevel] ?? 0));
        }
        case "recent":
          return dir * ((a.lastIncidentDate ?? "").localeCompare(b.lastIncidentDate ?? ""));
        default:
          return 0;
      }
    });

    return list;
  }, [riskMap, search, filterRisk, sortBy, sortAsc]);

  const counts = useMemo(() => ({
    all: riskMap.size,
    critical: Array.from(riskMap.values()).filter((e) => e.riskLevel === "critical").length,
    high: Array.from(riskMap.values()).filter((e) => e.riskLevel === "high").length,
    medium: Array.from(riskMap.values()).filter((e) => e.riskLevel === "medium").length,
  }), [riskMap]);

  if (loading) {
    return (
      <PageContainer title="Employees" description="Employee directory with issue tracking">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <div className="mt-6 grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Employees"
      description={`${employees.length} employees \u00B7 ${incidents.length} total incidents`}
    >
      <div className="grid gap-6">
        {/* Risk summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RiskStatCard label="Critical Risk" value={counts.critical} color="text-red-500" icon={<ShieldAlert className="h-5 w-5" />} />
          <RiskStatCard label="High Risk" value={counts.high} color="text-amber-500" icon={<AlertTriangle className="h-5 w-5" />} />
          <RiskStatCard label="Medium Risk" value={counts.medium} color="text-yellow-500" icon={<Clock className="h-5 w-5" />} />
          <RiskStatCard label="Total Employees" value={employees.length} color="text-text-secondary" icon={<Users className="h-5 w-5" />} />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search by name, email, or title..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "critical", "high", "medium"] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterRisk === risk
                    ? "bg-brand-primary text-brand-dark-slate"
                    : "bg-brand-slate-light text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {risk === "all" ? `All (${counts.all})` : `${risk.charAt(0).toUpperCase() + risk.slice(1)} (${counts[risk as keyof typeof counts]})`}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (sortBy === "severity") setSortAsc(!sortAsc);
              else { setSortBy("severity"); setSortAsc(false); }
            }}
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            {sortBy === "severity" ? (sortAsc ? "Risk \u2191" : "Risk \u2193") : "Sort"}
          </Button>
        </div>

        {/* Employee list */}
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <Card className="flex h-32 items-center justify-center">
              <p className="text-sm text-text-tertiary">No employees match your filters.</p>
            </Card>
          )}
          {filtered.map((emp) => (
            <Link key={emp.user.id} href={`/employees/${emp.user.id}`}>
              <Card className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-card-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-slate-light">
                  <UserCircle className="h-6 w-6 text-text-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">
                      {emp.user.first_name} {emp.user.last_name}
                    </p>
                    {emp.user.job_title && (
                      <span className="text-xs text-text-tertiary">\u00B7 {emp.user.job_title}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary">{emp.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{emp.incidentCount}</p>
                    <p className="text-xs text-text-tertiary">incidents</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{emp.openIncidents}</p>
                    <p className="text-xs text-text-tertiary">open</p>
                  </div>
                  <RiskBadge level={emp.riskLevel} />
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

function RiskStatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light ${color}`}>
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

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/30",
    high: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
    none: "bg-brand-slate-light text-text-tertiary border-border",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      {level === "none" ? "Clear" : level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}
