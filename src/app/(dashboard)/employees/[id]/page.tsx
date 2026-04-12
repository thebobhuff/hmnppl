"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  Bot,
  ChevronRight,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import {
  usersAPI,
  incidentsAPI,
  disciplinaryAPI,
  type UserResponse,
  type IncidentResponse,
  type DisciplinaryActionResponse,
  type TimelineEvent,
} from "@/lib/api/client";

type TabKey = "timeline" | "incidents" | "discipline" | "risk";

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [user, setUser] = useState<UserResponse | null>(null);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [actions, setActions] = useState<DisciplinaryActionResponse[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");

  const breadcrumbs = useMemo(
    () => [
      { label: "Home", href: "/dashboard" },
      { label: "Employees", href: "/employees" },
      { label: user ? `${user.first_name} ${user.last_name}` : "Loading..." },
    ],
    [user],
  );
  usePageBreadcrumbs(breadcrumbs);

  useEffect(() => {
    let active = true;
    async function fetch() {
      try {
        const [userRes, incRes] = await Promise.all([
          usersAPI.get(employeeId),
          incidentsAPI.list({ employee_id: employeeId, limit: "100" }),
        ]);
        if (!active) return;

        setUser(userRes.user);
        setIncidents(incRes.incidents);

        // Fetch disciplinary actions for this employee's incidents
        const actionPromises = incRes.incidents.map((inc) =>
          disciplinaryAPI.list(undefined, "", 50).then((res) =>
            res.actions.filter((a) => a.incident_id === inc.id),
          ),
        );
        const actionResults = await Promise.all(actionPromises);
        if (!active) return;
        const allActions = actionResults.flat();
        setActions(allActions);

        // Try to get timeline
        try {
          const tlRes = await usersAPI.timeline(employeeId);
          if (active) setTimeline(tlRes.timeline);
        } catch {
          // Timeline endpoint may not exist yet, build from incidents + actions
          const tl: TimelineEvent[] = [
            ...incRes.incidents.map((inc) => ({
              id: inc.id,
              type: "incident" as const,
              date: inc.created_at,
              title: `${inc.type} - ${inc.severity} severity`,
              description: inc.description.slice(0, 120),
              status: inc.status,
              entity_id: inc.id,
            })),
            ...allActions.map((act) => ({
              id: act.id,
              type: "document" as const,
              date: act.created_at,
              title: act.action_type || "Disciplinary Action",
              description: `Status: ${act.status.replace(/_/g, " ")}`,
              status: act.status,
              entity_id: act.id,
            })),
          ].sort((a, b) => b.date.localeCompare(a.date));
          if (active) setTimeline(tl);
        }
      } catch (err) {
        console.error("Failed to load employee detail", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetch();
    return () => { active = false; };
  }, [employeeId]);

  const stats = useMemo(() => {
    const open = incidents.filter(
      (i) => !["approved", "rejected", "resolved", "closed", "signed"].includes(i.status),
    );
    const maxSev = incidents.reduce<string>((max, i) => {
      if ((SEVERITY_ORDER[i.severity] ?? 0) > (SEVERITY_ORDER[max] ?? 0)) return i.severity;
      return max;
    }, "");
    const avgConfidence = incidents.length > 0
      ? incidents.filter((i) => i.ai_confidence_score !== null).reduce((sum, i) => sum + (i.ai_confidence_score ?? 0), 0) /
        Math.max(incidents.filter((i) => i.ai_confidence_score !== null).length, 1)
      : 0;

    // Progressive discipline tracking
    const actionTypes = new Set(actions.map((a) => a.action_type?.toLowerCase()));
    const hasVerbal = actionTypes.has("verbal_warning") || actionTypes.has("verbal");
    const hasWritten = actionTypes.has("written_warning") || actionTypes.has("written");
    const hasPip = actionTypes.has("pip") || actionTypes.has("performance_improvement_plan");
    const hasTermination = actionTypes.has("termination") || actions.some((a) => a.action_type?.toLowerCase().includes("termin"));

    return {
      total: incidents.length,
      open: open.length,
      closed: incidents.length - open.length,
      maxSeverity: maxSev,
      avgConfidence,
      totalActions: actions.length,
      hasVerbal,
      hasWritten,
      hasPip,
      hasTermination,
      escalationLevel: [hasVerbal, hasWritten, hasPip, hasTermination].filter(Boolean).length,
    };
  }, [incidents, actions]);

  if (loading) {
    return (
      <PageContainer title="Employee Profile">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Not Found">
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-text-tertiary">Employee not found.</p>
          <Button variant="outline" onClick={() => router.push("/employees")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employees
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${user.first_name} ${user.last_name}`}
      description={user.job_title || user.email}
      actions={
        <Button variant="outline" onClick={() => router.push("/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      }
    >
      <div className="grid gap-6">
        {/* Profile header */}
        <Card className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-slate-light">
                <UserCircle className="h-10 w-10 text-text-tertiary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-sm text-text-secondary">{user.job_title || "No title"}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                  {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                  <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {user.department_id || "No dept"}</span>
                  {user.hire_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Hired {new Date(user.hire_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Badge variant={user.status === "active" ? "success" : "warning"}>
                {user.status}
              </Badge>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </div>
        </Card>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Total Incidents" value={stats.total} />
          <StatCard icon={<Clock className="h-5 w-5" />} label="Open" value={stats.open} color="text-amber-500" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Disciplinary Actions" value={stats.totalActions} />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Escalation Level" value={`${stats.escalationLevel}/4`} />
          <StatCard icon={<Bot className="h-5 w-5" />} label="Avg AI Confidence" value={stats.avgConfidence > 0 ? `${Math.round(stats.avgConfidence * 100)}%` : "N/A"} />
        </div>

        {/* Progressive Discipline Tracker */}
        <Card className="p-6">
          <h3 className="mb-4 font-display text-base font-semibold text-text-primary">
            Progressive Discipline Path
          </h3>
          <div className="flex items-center gap-2">
            {[
              { label: "Verbal Warning", active: stats.hasVerbal },
              { label: "Written Warning", active: stats.hasWritten },
              { label: "PIP", active: stats.hasPip },
              { label: "Termination Review", active: stats.hasTermination },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-0.5 w-8 ${step.active ? "bg-red-500" : "bg-brand-slate-light"}`} />
                )}
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                    step.active
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : "border-border bg-brand-slate-light text-text-tertiary"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full ${step.active ? "bg-red-500" : "bg-brand-slate-light"}`} />
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {([
            { key: "timeline" as TabKey, label: "Timeline" },
            { key: "incidents" as TabKey, label: `Incidents (${incidents.length})` },
            { key: "discipline" as TabKey, label: `Discipline (${actions.length})` },
            { key: "risk" as TabKey, label: "Risk Analysis" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "timeline" && <TimelineView events={timeline} />}
        {activeTab === "incidents" && <IncidentsList incidents={incidents} />}
        {activeTab === "discipline" && <DisciplineList actions={actions} />}
        {activeTab === "risk" && <RiskAnalysis incidents={incidents} actions={actions} />}
      </div>
    </PageContainer>
  );
}

// --- Sub-components ---

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light ${color ?? "text-text-secondary"}`}>
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

function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <Card className="flex h-32 items-center justify-center">
        <p className="text-sm text-text-tertiary">No timeline events for this employee.</p>
      </Card>
    );
  }

  const typeIcons: Record<string, React.ReactNode> = {
    incident: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    document: <FileText className="h-4 w-4 text-brand-primary" />,
    meeting: <Calendar className="h-4 w-4 text-blue-400" />,
    signature: <FileText className="h-4 w-4 text-green-400" />,
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="flex items-start gap-4 p-4">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-slate-light">
            {typeIcons[event.type] ?? <Clock className="h-4 w-4 text-text-tertiary" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{event.title}</p>
              <Badge variant="outline" className="text-xs">{event.type}</Badge>
            </div>
            <p className="mt-1 text-xs text-text-secondary">{event.description}</p>
            <p className="mt-1 text-xs text-text-tertiary">{new Date(event.date).toLocaleString()}</p>
          </div>
          <Badge
            variant={
              ["approved", "resolved", "completed", "signed"].includes(event.status) ? "success" :
              ["pending_hr_review", "pending_signature"].includes(event.status) ? "warning" : "outline"
            }
          >
            {event.status.replace(/_/g, " ")}
          </Badge>
        </Card>
      ))}
    </div>
  );
}

function IncidentsList({ incidents }: { incidents: IncidentResponse[] }) {
  if (incidents.length === 0) {
    return (
      <Card className="flex h-32 items-center justify-center">
        <p className="text-sm text-text-tertiary">No incidents recorded.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((inc) => (
        <Link key={inc.id} href={`/incident-queue/${inc.id}`}>
          <Card className={`flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-card-hover border-l-4 ${
            inc.severity === "critical" ? "border-l-red-600" :
            inc.severity === "high" ? "border-l-red-500" :
            inc.severity === "medium" ? "border-l-amber-500" : "border-l-brand-primary"
          }`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-tertiary">{inc.reference_number}</span>
                <Badge
                  variant={
                    inc.severity === "critical" || inc.severity === "high" ? "error" :
                    inc.severity === "medium" ? "warning" : "default"
                  }
                  dot
                >
                  {inc.severity}
                </Badge>
                <Badge variant={
                  ["approved", "resolved"].includes(inc.status) ? "success" :
                  ["pending_hr_review"].includes(inc.status) ? "warning" : "outline"
                }>
                  {inc.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-text-primary">{inc.type}</p>
              <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">{inc.description}</p>
              <p className="mt-1 text-xs text-text-tertiary">{new Date(inc.created_at).toLocaleDateString()}</p>
            </div>
            {inc.ai_confidence_score !== null && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-text-tertiary">AI Confidence</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-slate-light">
                    <div
                      className={`h-full rounded-full ${
                        inc.ai_confidence_score >= 0.85 ? "bg-brand-success" :
                        inc.ai_confidence_score >= 0.7 ? "bg-brand-warning" : "bg-brand-error"
                      }`}
                      style={{ width: `${inc.ai_confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary">
                    {Math.round(inc.ai_confidence_score * 100)}%
                  </span>
                </div>
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function DisciplineList({ actions }: { actions: DisciplinaryActionResponse[] }) {
  if (actions.length === 0) {
    return (
      <Card className="flex h-32 items-center justify-center">
        <p className="text-sm text-text-tertiary">No disciplinary actions recorded.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((act) => (
        <Link key={act.id} href={`/documents`}>
          <Card className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-card-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
              <FileText className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">{act.action_type || "Disciplinary Action"}</p>
              <p className="text-xs text-text-tertiary">Created {new Date(act.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant={
              act.status === "signed" ? "success" :
              act.status === "pending_signature" ? "warning" : "outline"
            }>
              {act.status.replace(/_/g, " ")}
            </Badge>
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function RiskAnalysis({ incidents, actions }: { incidents: IncidentResponse[]; actions: DisciplinaryActionResponse[] }) {
  const typeCounts = incidents.reduce<Record<string, number>>((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + 1;
    return acc;
  }, {});
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const sevCounts = incidents.reduce<Record<string, number>>((acc, inc) => {
    acc[inc.severity] = (acc[inc.severity] || 0) + 1;
    return acc;
  }, {});

  const repeatOffenses = incidents.filter((i) => i.previous_incident_count > 0).length;
  const avgPrevious = incidents.length > 0
    ? (incidents.reduce((sum, i) => sum + i.previous_incident_count, 0) / incidents.length).toFixed(1)
    : "0";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Incident type breakdown */}
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-text-primary">Incident Type Breakdown</h4>
        <div className="space-y-2">
          {sortedTypes.map(([type, count]) => {
            const pct = Math.round((count / incidents.length) * 100);
            return (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{type}</span>
                  <span className="text-text-tertiary">{count} ({pct}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-slate-light">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {sortedTypes.length === 0 && <p className="text-xs text-text-tertiary">No incidents to analyze.</p>}
        </div>
      </Card>

      {/* Severity distribution */}
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-text-primary">Severity Distribution</h4>
        <div className="grid grid-cols-2 gap-3">
          {(["critical", "high", "medium", "low"] as const).map((sev) => {
            const count = sevCounts[sev] ?? 0;
            const colors: Record<string, string> = {
              critical: "text-red-500 bg-red-500/10",
              high: "text-amber-500 bg-amber-500/10",
              medium: "text-yellow-500 bg-yellow-500/10",
              low: "text-green-400 bg-green-400/10",
            };
            return (
              <div key={sev} className={`rounded-lg p-3 ${colors[sev]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium capitalize">{sev}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Repeat offense pattern */}
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-text-primary">Repeat Offense Pattern</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold text-text-primary">{repeatOffenses}</p>
            <p className="text-xs text-text-tertiary">Repeat incidents</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-text-primary">{avgPrevious}</p>
            <p className="text-xs text-text-tertiary">Avg prior incidents per case</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-brand-slate-light p-3">
          <p className="text-xs text-text-secondary">
            {repeatOffenses > incidents.length * 0.5
              ? "\u26A0\uFE0F High repeat rate suggests potential training gaps or systemic issues, not just individual behavior."
              : repeatOffenses > 0
                ? "Some repeat incidents detected. Monitor for patterns."
                : "No repeat offenses detected."}
          </p>
        </div>
      </Card>

      {/* Disciplinary action summary */}
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-text-primary">Discipline Escalation Summary</h4>
        <div className="space-y-2">
          {actions.length === 0 && <p className="text-xs text-text-tertiary">No disciplinary actions taken.</p>}
          {actions.map((act) => (
            <div key={act.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-sm font-medium text-text-primary">{act.action_type || "Action"}</p>
                <p className="text-xs text-text-tertiary">{new Date(act.created_at).toLocaleDateString()}</p>
              </div>
              <Badge variant={act.status === "signed" ? "success" : act.status === "pending_signature" ? "warning" : "outline"}>
                {act.status.replace(/_/g, " ")}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
