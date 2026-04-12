/** Org Health Dashboard - L-005 + L-004
 * Per Lijo Joseph: "I can see the health of my organization in one shot."
 */
"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { incidentsAPI, type IncidentResponse } from "@/lib/api/client";
import {
  Activity, AlertTriangle, ArrowRight, Brain, Clock,
  FileText, Loader2, Shield, Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function OrgHealthPage() {
  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "Organization Health" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await incidentsAPI.list({ limit: "200" });
        if (active) setIncidents(res.incidents);
      } catch (err) {
        console.error("Failed to load org health data", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = incidents.length;
  const verbal = incidents.filter((i) => i.action_type === "verbal_warning").length;
  const written = incidents.filter((i) => i.action_type === "written_warning").length;
  const pip = incidents.filter((i) => i.action_type === "pip").length;
  const term = incidents.filter(
    (i) => i.action_type === "termination_review" || i.action_type === "termination",
  ).length;
  const openCount = incidents.filter(
    (i) => !["approved", "rejected", "resolved", "closed", "signed"].includes(i.status || ""),
  ).length;

  const score = useMemo(() => {
    if (total === 0) return 100;
    return Math.max(0, Math.round(100 - ((written * 2 + pip * 3 + term * 5) / total) * 20));
  }, [total, written, pip, term]);

  const status = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Poor";
  const color = score >= 85 ? "text-green-400" : score >= 70 ? "text-blue-400" : score >= 50 ? "text-amber-400" : "text-red-400";

  if (loading) {
    return (
      <PageContainer title="Organization Health" description="Loading...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      </PageContainer>
    );
  }

  const breakdown = (() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i) => {
      const t = i.type || "unknown";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ type, count }));
  })();

  const alerts = (() => {
    const result: Array<{ title: string; description: string; severity: string }> = [];
    const typeCounts: Record<string, number> = {};
    incidents.forEach((i) => {
      typeCounts[i.type || "unknown"] = (typeCounts[i.type || "unknown"] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count >= 5) {
        result.push({
          title: `High "${type.replace(/_/g, " ")}" volume`,
          description: `${count} incidents. Consider reviewing training or policies.`,
          severity: count >= 10 ? "high" : "medium",
        });
      }
    });
    const hs = incidents.filter((i) => i.severity === "high" || i.severity === "critical");
    if (hs.length >= 3) {
      result.push({
        title: "High severity concentration",
        description: `${hs.length} high/critical incidents. Review for systemic issues.`,
        severity: "high",
      });
    }
    return result.slice(0, 5);
  })();

  return (
    <PageContainer
      title="Organization Health"
      description="Discipline health dashboard with pattern recognition"
    >
      <Card className="border-brand-primary/30 bg-gradient-to-br from-brand-slate-dark to-brand-slate-light p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-current ${color}`}>
              <span className={`text-3xl font-bold ${color}`}>{score}</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-text-primary">{status}</h2>
              <p className="text-sm text-text-secondary">Organization Discipline Health Score</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{verbal}</p>
              <p className="text-xs text-text-tertiary">Verbal</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{written}</p>
              <p className="text-xs text-text-tertiary">Written</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{pip}</p>
              <p className="text-xs text-text-tertiary">PIP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{term}</p>
              <p className="text-xs text-text-tertiary">Termination</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Activity className="h-5 w-5" />} label="Total Incidents" value={total} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Open Cases" value={openCount} />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="High/Critical"
          value={incidents.filter((i) => i.severity === "high" || i.severity === "critical").length}
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="Resolution Rate"
          value={total > 0 ? Math.round(((total - openCount) / total) * 100) + "%" : "N/A"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-text-primary">
              Incident Type Breakdown
            </h3>
            <Badge variant="outline">All time</Badge>
          </div>
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div
                key={item.type}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {item.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-text-tertiary">{item.count} incidents</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-brand-slate-light">
                  <div
                    className="h-2 rounded-full bg-brand-primary"
                    style={{
                      width:
                        Math.min(100, (item.count / Math.max(total, 1)) * 100 * 3) + "%",
                    }}
                  />
                </div>
                <Badge variant={item.count > 5 ? "warning" : "outline"}>{item.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Pattern Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-warning" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                  <p className="text-xs text-text-tertiary">{alert.description}</p>
                </div>
                <Badge variant={alert.severity === "high" ? "warning" : "outline"}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-text-tertiary">No pattern alerts. Things look stable.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
          Insight Actions
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            href="/training-gaps"
            className="rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
          >
            <div className="flex items-center justify-between">
              <Brain className="h-5 w-5 text-brand-primary" />
              <ArrowRight className="h-4 w-4 text-text-tertiary" />
            </div>
            <p className="mt-2 text-sm font-semibold text-text-primary">
              Training Gap Analysis
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              AI-powered training recommendations
            </p>
          </Link>
          <Link
            href="/incident-queue"
            className="rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
          >
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-brand-primary" />
              <ArrowRight className="h-4 w-4 text-text-tertiary" />
            </div>
            <p className="mt-2 text-sm font-semibold text-text-primary">Incident Queue</p>
            <p className="mt-1 text-xs text-text-tertiary">Review and triage incidents</p>
          </Link>
          <Link
            href="/policies"
            className="rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
          >
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-brand-primary" />
              <ArrowRight className="h-4 w-4 text-text-tertiary" />
            </div>
            <p className="mt-2 text-sm font-semibold text-text-primary">Policy Review</p>
            <p className="mt-1 text-xs text-text-tertiary">Audit and update policies</p>
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
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