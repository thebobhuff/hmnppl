/** HR KPI Dashboard - Churn, Retention, Departmental Health
 * Shows turnover rate, retention, new-hire churn, tenure distribution,
 * department health scores, and operational KPIs.
 */
"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { incidentsAPI, disciplinaryAPI, usersAPI, type IncidentResponse } from "@/lib/api/client";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, Clock,
  Download, Loader2, TrendingDown, TrendingUp, Users, UserMinus, UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function HRKPIsPage() {
  const breadcrumbs = useMemo(() => [{ label: "Home", href: "/dashboard" }, { label: "HR KPIs" }], []);
  usePageBreadcrumbs(breadcrumbs);

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [incRes, usrRes] = await Promise.all([
          incidentsAPI.list({ limit: "500" }),
          usersAPI.list({ limit: 500 }),
        ]);
        if (active) { setIncidents(incRes.incidents); setUsers(usrRes.users); }
      } catch (err) { console.error(err); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  // Derived KPIs
  const totalEmployees = users.filter(u => u.role === "employee").length || users.length;
  const totalIncidents = incidents.length;
  const openCases = incidents.filter(i => !["approved", "rejected", "resolved", "closed", "signed"].includes(i.status || "")).length;

  const verbal = incidents.filter(i => i.action_type === "verbal_warning").length;
  const written = incidents.filter(i => i.action_type === "written_warning").length;
  const pip = incidents.filter(i => i.action_type === "pip").length;
  const term = incidents.filter(i => i.action_type === "termination_review" || i.action_type === "termination").length;

  // Severity-weighted incident rate
  const severityWeight = verbal * 1 + written * 3 + pip * 5 + term * 10;
  const incidentRate = totalEmployees > 0 ? (totalIncidents / totalEmployees * 100).toFixed(1) : "0";

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    const depts: Record<string, { count: number; employees: Set<string>; severity: number }> = {};
    incidents.forEach(i => {
      const d = i.department || "Unassigned";
      if (!depts[d]) depts[d] = { count: 0, employees: new Set(), severity: 0 };
      depts[d].count++;
      if (i.employee_id) depts[d].employees.add(i.employee_id);
      const w = i.action_type === "verbal_warning" ? 1 : i.action_type === "written_warning" ? 3
        : i.action_type === "pip" ? 5 : i.action_type === "termination_review" ? 10 : 1;
      depts[d].severity += w;
    });
    return Object.entries(depts).sort((a, b) => b[1].severity - a[1].severity).map(([name, d]) => ({
      name, count: d.count, employees: d.employees.size, severity: d.severity,
      healthScore: Math.max(0, 100 - d.severity * 3),
    }));
  }, [incidents]);

  // Tenure distribution (if hire_date available)
  const tenureData = useMemo(() => {
    const buckets = { "< 90d": 0, "91d-6m": 0, "6m-1y": 0, "1-3y": 0, "3-5y": 0, "5-10y": 0, "10y+": 0 };
    users.forEach(u => {
      const h = u.hire_date || u.created_at;
      if (!h) { buckets["< 90d"]++; return; }
      try {
        const days = (Date.now() - new Date(h).getTime()) / 86400000;
        if (days <= 90) buckets["< 90d"]++;
        else if (days <= 180) buckets["91d-6m"]++;
        else if (days <= 365) buckets["6m-1y"]++;
        else if (days <= 1095) buckets["1-3y"]++;
        else if (days <= 1825) buckets["3-5y"]++;
        else if (days <= 3650) buckets["5-10y"]++;
        else buckets["10y+"]++;
      } catch { buckets["< 90d"]++; }
    });
    return buckets;
  }, [users]);

  // Monthly incident trend (last 12 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: Array<{ month: string; incidents: number; high: number; critical: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const monthIncidents = incidents.filter((inc) => {
        const created = inc.created_at ?? "";
        return created >= start && created < end;
      });
      months.push({
        month: label,
        incidents: monthIncidents.length,
        high: monthIncidents.filter((i) => i.severity === "high").length,
        critical: monthIncidents.filter((i) => i.severity === "critical").length,
      });
    }
    return months;
  }, [incidents]);

  const maxTenure = Math.max(...Object.values(tenureData), 1);

  if (loading) return <PageContainer title="HR KPIs" description="Loading..."><div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div></PageContainer>;

  return (
    <PageContainer title="HR KPIs" description="Employee churn, retention, and departmental health metrics">
      {/* Top-level KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={<Users className="h-5 w-5" />} label="Total Employees" value={totalEmployees} />
        <KPICard icon={<AlertTriangle className="h-5 w-5" />} label="Open Cases" value={openCases} />
        <KPICard icon={<Activity className="h-5 w-5" />} label="Incident Rate" value={`${incidentRate}%`} subtitle="incidents per employee" />
        <KPICard icon={<Clock className="h-5 w-5" />} label="Severity Weight" value={severityWeight} subtitle="verbal=1, written=3, PIP=5, term=10" />
      </div>

      {/* Discipline breakdown */}
      <Card className="p-4">
        <h3 className="mb-3 font-display text-base font-semibold text-text-primary">Discipline Action Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard label="Verbal Warnings" count={verbal} color="bg-green-500" />
          <ActionCard label="Written Warnings" count={written} color="bg-amber-500" />
          <ActionCard label="PIPs" count={pip} color="bg-orange-500" />
          <ActionCard label="Terminations" count={term} color="bg-red-500" />
        </div>
      </Card>

      {/* Department Health + Tenure */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-text-primary">Department Health</h3>
            <Badge variant="outline">Worst first</Badge>
          </div>
          <div className="space-y-2">
            {deptBreakdown.length === 0 && <p className="text-sm text-text-tertiary">No department data.</p>}
            {deptBreakdown.slice(0, 8).map(d => (
              <div key={d.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{d.name}</p>
                  <p className="text-xs text-text-tertiary">{d.count} incidents, {d.employees} employees</p>
                </div>
                <div className="w-20">
                  <div className="h-2 rounded-full bg-brand-slate-light">
                    <div className={`h-2 rounded-full ${d.healthScore >= 70 ? "bg-green-500" : d.healthScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: d.healthScore + "%" }} />
                  </div>
                  <p className="mt-1 text-center text-xs text-text-tertiary">{d.healthScore}</p>
                </div>
                <Badge variant={d.healthScore >= 70 ? "success" : d.healthScore >= 50 ? "warning" : "warning"}>
                  {d.healthScore >= 70 ? "Good" : d.healthScore >= 50 ? "Fair" : "Poor"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">Tenure Distribution</h3>
          <div className="space-y-3">
            {Object.entries(tenureData).map(([label, count]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-16 text-xs text-text-tertiary">{label}</span>
                <div className="h-4 flex-1 rounded-full bg-brand-slate-light">
                  <div className="h-4 rounded-full bg-brand-primary transition-all" style={{ width: (count / maxTenure * 100) + "%" }} />
                </div>
                <span className="w-8 text-right text-sm font-medium text-text-primary">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Time-series incident trend */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-text-primary">Incident Trend (Last 12 Months)</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = [["Month", "Incidents", "High Severity", "Critical Severity"]];
              monthlyTrend.forEach(m => {
                rows.push([m.month, String(m.incidents), String(m.high), String(m.critical)]);
              });
              const csv = rows.map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `incident-trend-${new Date().toISOString().slice(0,10)}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-text-tertiary)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-tertiary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="incidents" stroke="#2563eb" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="high" stroke="#ea580c" strokeWidth={2} dot={false} name="High" />
              <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} dot={false} name="Critical" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="h-2 w-2 rounded-full bg-blue-600" />Total</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="h-2 w-2 rounded-full bg-orange-500" />High</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="h-2 w-2 rounded-full bg-red-600" />Critical</span>
        </div>
      </Card>
      {severityWeight > 30 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-text-primary">High Severity Alert</p>
              <p className="mt-1 text-xs text-text-secondary">
                Combined severity weight of {severityWeight} suggests elevated organizational risk.
                {term > 2 && " Multiple terminations warrant review."}
                {pip > 3 && " High PIP count may indicate training gaps."}
              </p>
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

function KPICard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: number | string; subtitle?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">{icon}</div>
        <div>
          <p className="text-xs font-medium text-text-tertiary">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

function ActionCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <p className="text-sm font-medium text-text-primary">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold text-text-primary">{count}</p>
    </div>
  );
}
