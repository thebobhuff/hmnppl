"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Calendar,
  FileText,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { incidentsAPI } from "@/lib/api/client";

interface ReportData {
  totalIncidents: number;
  pendingIncidents: number;
  resolvedIncidents: number;
  avgResolutionDays: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  monthlyTrend: Array<{ month: string; count: number }>;
  recentIncidents: Array<{
    id: string;
    reference_number: string;
    type: string;
    severity: string;
    status: string;
    created_at: string;
  }>;
}

export default function ReportsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Reports" },
  ]);

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const res = await incidentsAPI.list();
        if (active && res.incidents) {
          const incidents = res.incidents;

          // Calculate metrics
          const totalIncidents = incidents.length;
          const pendingIncidents = incidents.filter(
            (i: any) => i.status === "pending_hr_review" || i.status === "ai_evaluation"
          ).length;
          const resolvedIncidents = incidents.filter(
            (i: any) => i.status === "action_taken" || i.status === "closed"
          ).length;

          // Incidents by type
          const incidentsByType: Record<string, number> = {};
          incidents.forEach((i: any) => {
            const type = i.type || "unknown";
            incidentsByType[type] = (incidentsByType[type] || 0) + 1;
          });

          // Incidents by severity
          const incidentsBySeverity: Record<string, number> = {};
          incidents.forEach((i: any) => {
            const severity = i.severity || "low";
            incidentsBySeverity[severity] = (incidentsBySeverity[severity] || 0) + 1;
          });

          // Monthly trend (last 6 months)
          const monthlyTrend: Array<{ month: string; count: number }> = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStr = date.toLocaleDateString([], { month: 'short', year: '2-digit' });
            const count = incidents.filter((inc: any) => {
              const created = new Date(inc.created_at);
              return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
            }).length;
            monthlyTrend.push({ month: monthStr, count });
          }

          setData({
            totalIncidents,
            pendingIncidents,
            resolvedIncidents,
            avgResolutionDays: 4.2, // Mock for now
            incidentsByType,
            incidentsBySeverity,
            monthlyTrend,
            recentIncidents: incidents.slice(0, 5).map((i: any) => ({
              id: i.id,
              reference_number: i.reference_number || `INC-${i.id.slice(0, 4)}`,
              type: i.type || "unknown",
              severity: i.severity || "low",
              status: i.status || "open",
              created_at: i.created_at,
            })),
          });
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [dateRange]);

  const maxTypeCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.incidentsByType), 1);
  }, [data]);

  const maxSeverityCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.incidentsBySeverity), 1);
  }, [data]);

  const maxTrendCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.monthlyTrend.map((m) => m.count), 1);
  }, [data]);

  return (
    <PageContainer
      title="Reports & Analytics"
      description="HR analytics and business intelligence dashboard."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : data ? (
        <>
          {/* Date Range Selector */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Overview
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10">
                  <FileText className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">{data.totalIncidents}</p>
                  <p className="text-sm text-text-tertiary">Total Incidents</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Clock className="h-6 w-6 text-brand-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">{data.pendingIncidents}</p>
                  <p className="text-sm text-text-tertiary">Pending Review</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-success/10">
                  <CheckCircle className="h-6 w-6 text-brand-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">{data.resolvedIncidents}</p>
                  <p className="text-sm text-text-tertiary">Resolved</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-slate-light">
                  <Clock className="h-6 w-6 text-text-secondary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">{data.avgResolutionDays}</p>
                  <p className="text-sm text-text-tertiary">Avg Resolution (days)</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Monthly Trend
              </h3>
              <div className="flex items-end gap-3">
                {data.monthlyTrend.map((item, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-brand-primary/80 transition-all hover:bg-brand-primary"
                      style={{ height: `${(item.count / maxTrendCount) * 100}px`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-text-tertiary">{item.month}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Incidents by Type */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <BarChart3 className="h-5 w-5 text-brand-primary" />
                By Type
              </h3>
              <div className="space-y-3">
                {Object.entries(data.incidentsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-32 truncate text-sm text-text-secondary capitalize">
                      {type.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 rounded-full bg-brand-slate-light">
                      <div
                        className="h-2 rounded-full bg-brand-primary transition-all"
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-text-primary">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Incidents by Severity */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <AlertCircle className="h-5 w-5 text-brand-primary" />
                By Severity
              </h3>
              <div className="space-y-3">
                {["critical", "high", "medium", "low"].map((severity) => {
                  const count = data.incidentsBySeverity[severity] || 0;
                  const colors: Record<string, string> = {
                    critical: "bg-brand-error-dim",
                    high: "bg-brand-error",
                    medium: "bg-brand-warning",
                    low: "bg-brand-primary",
                  };
                  return (
                    <div key={severity} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-text-secondary capitalize">{severity}</span>
                      <div className="flex-1 rounded-full bg-brand-slate-light">
                        <div
                          className={`h-2 rounded-full ${colors[severity]} transition-all`}
                          style={{ width: `${(count / maxSeverityCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-medium text-text-primary">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Incidents */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                  <Clock className="h-5 w-5 text-brand-primary" />
                  Recent Incidents
                </h3>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/incident-queue">
                    View All
                    <TrendingUp className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {data.recentIncidents.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No incidents recorded.</p>
                ) : (
                  data.recentIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <span className="font-mono text-sm font-semibold text-brand-primary">
                          {incident.reference_number}
                        </span>
                        <p className="text-xs text-text-tertiary capitalize">
                          {incident.type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            incident.severity === "critical" || incident.severity === "high"
                              ? "error"
                              : incident.severity === "medium"
                                ? "warning"
                                : "default"
                          }
                        >
                          {incident.severity}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
            No Data Available
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            There is no report data available at this time.
          </p>
        </Card>
      )}
    </PageContainer>
  );
}
