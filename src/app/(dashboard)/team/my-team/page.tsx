"use client";

import { useState, useEffect, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  usersAPI,
  incidentsAPI,
  type UserResponse,
  type IncidentResponse,
  type APIError,
} from "@/lib/api/client";
import {
  Users,
  AlertTriangle,
  ChevronRight,
  UserCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

interface TeamMember {
  user: UserResponse;
  incidentCount: number;
  openIncidents: number;
  maxSeverity: string;
  lastIncidentDate: string | null;
  riskLevel: RiskLevel;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "border-l-brand-error border-l-4 bg-red-50/50",
  high: "border-l-orange-500 border-l-4 bg-orange-50/30",
  medium: "border-l-yellow-500 border-l-4 bg-yellow-50/30",
  low: "border-l-blue-400 border-l-4 bg-blue-50/30",
  none: "border-border",
};

const RISK_BADGE: Record<RiskLevel, { variant: "critical" | "warning" | "outline"; label: string }> = {
  critical: { variant: "critical", label: "Critical" },
  high: { variant: "warning", label: "High" },
  medium: { variant: "warning", label: "Medium" },
  low: { variant: "outline", label: "Low" },
  none: { variant: "outline", label: "None" },
};

export default function MyTeamPage() {
  const [directReports, setDirectReports] = useState<UserResponse[]>([]);
  const [allIncidents, setAllIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Team" },
  ]);

  useEffect(() => {
    let active = true;
    async function fetch() {
      try {
        const [reportsRes, incRes] = await Promise.all([
          usersAPI.list({ limit: 100 }),
          incidentsAPI.list({ limit: "200" }),
        ]);
        if (!active) return;

        const reports = reportsRes.users.filter(
          (u) => u.manager_id && u.role !== "COMPANY_ADMIN" && u.role !== "HR_AGENT",
        );
        setDirectReports(reports);
        setAllIncidents(incRes.incidents);
      } catch (err) {
        if (active) setError(err as APIError);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetch();
    return () => { active = false; };
  }, []);

  const teamMap = useMemo((): Map<string, TeamMember> => {
    const map = new Map<string, TeamMember>();
    for (const user of directReports) {
      const userIncidents = allIncidents.filter((i) => i.employee_id === user.id);
      const open = userIncidents.filter(
        (i) => !["approved", "rejected", "resolved", "closed", "signed"].includes(i.status),
      );
      const maxSev = userIncidents.reduce<string>((max, i) => {
        if ((SEVERITY_ORDER[i.severity] ?? 0) > (SEVERITY_ORDER[max] ?? 0)) return i.severity;
        return max;
      }, "none");
      const lastDate = userIncidents.length > 0
        ? userIncidents.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
        : null;

      let risk: RiskLevel = "none";
      if (open.length >= 3 || (SEVERITY_ORDER[maxSev] ?? 0) >= 4) risk = "critical";
      else if (open.length >= 2 || (SEVERITY_ORDER[maxSev] ?? 0) >= 3) risk = "high";
      else if (open.length >= 1 || (SEVERITY_ORDER[maxSev] ?? 0) >= 2) risk = "medium";
      else if (userIncidents.length > 0) risk = "low";

      map.set(user.id, {
        user,
        incidentCount: userIncidents.length,
        openIncidents: open.length,
        maxSeverity: maxSev,
        lastIncidentDate: lastDate,
        riskLevel: risk,
      });
    }
    return map;
  }, [directReports, allIncidents]);

  const riskCounts = useMemo(() => ({
    critical: Array.from(teamMap.values()).filter((m) => m.riskLevel === "critical").length,
    high: Array.from(teamMap.values()).filter((m) => m.riskLevel === "high").length,
    medium: Array.from(teamMap.values()).filter((m) => m.riskLevel === "medium").length,
    low: Array.from(teamMap.values()).filter((m) => m.riskLevel === "low").length,
    none: Array.from(teamMap.values()).filter((m) => m.riskLevel === "none").length,
  }), [teamMap]);

  const criticalMembers = useMemo(
    () => Array.from(teamMap.values()).filter((m) => m.riskLevel === "critical"),
    [teamMap],
  );

  if (loading) {
    return (
      <PageContainer title="My Team" description="Your direct reports and their status">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-10" />
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="My Team" description="Your direct reports and their status">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load team data"
          description={error.message}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="My Team"
      description={`${directReports.length} direct report${directReports.length !== 1 ? "s" : ""}`}
      actions={
        <Button asChild size="sm">
          <Link href="/report-issue">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Issue
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Risk Overview */}
        <div className="grid gap-4 sm:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs font-medium text-text-tertiary">Critical Risk</p>
            <p className="mt-1 text-2xl font-bold text-brand-error">{riskCounts.critical}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-text-tertiary">High Risk</p>
            <p className="mt-1 text-2xl font-bold text-orange-500">{riskCounts.high}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-text-tertiary">Medium Risk</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{riskCounts.medium}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-text-tertiary">Low Risk</p>
            <p className="mt-1 text-2xl font-bold text-blue-500">{riskCounts.low}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-text-tertiary">No Incidents</p>
            <p className="mt-1 text-2xl font-bold text-text-tertiary">{riskCounts.none}</p>
          </Card>
        </div>

        {/* Critical Alerts */}
        {criticalMembers.length > 0 && (
          <Card className="border border-brand-error/30 bg-red-50/30 p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand-error" />
              <h3 className="text-sm font-semibold text-brand-error">
                {criticalMembers.length} Critical Alert{criticalMembers.length > 1 ? "s" : ""}
              </h3>
            </div>
            <div className="mt-3 space-y-2">
              {criticalMembers.map((member) => (
                <Link
                  key={member.user.id}
                  href={`/employees/${member.user.id}`}
                  className="flex items-center justify-between rounded border border-border bg-white/60 p-2 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-text-tertiary" />
                    <span className="text-sm font-medium text-text-primary">
                      {member.user.first_name} {member.user.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary">
                      {member.openIncidents} open · Last {member.lastIncidentDate ? new Date(member.lastIncidentDate).toLocaleDateString() : "never"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-tertiary" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Team List */}
        <div className="space-y-3">
          {teamMap.size === 0 && (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No direct reports"
              description="You have no employees assigned as direct reports."
            />
          )}
          {Array.from(teamMap.values()).map((member) => {
            const badge = RISK_BADGE[member.riskLevel];
            return (
              <Link key={member.user.id} href={`/employees/${member.user.id}`}>
                <Card className={`p-4 transition-colors hover:border-brand-primary/50 ${RISK_COLORS[member.riskLevel]}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                        <UserCircle className="h-6 w-6 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {member.user.first_name} {member.user.last_name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {member.user.job_title ?? member.user.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs text-text-tertiary">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{member.incidentCount} incidents</span>
                      </div>
                      {member.openIncidents > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-500">
                          <Clock className="h-3 w-3" />
                          <span>{member.openIncidents} open</span>
                        </div>
                      )}
                      {member.lastIncidentDate && (
                        <span className="text-xs text-text-tertiary">
                          Last {new Date(member.lastIncidentDate).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <ChevronRight className="h-4 w-4 text-text-tertiary" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}