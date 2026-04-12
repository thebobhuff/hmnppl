/**
 * Role-adaptive Dashboard Home
 *
 * Displays different content based on user role:
 * - HR Agent: Incident queue stats, pending reviews, upcoming meetings
 * - Manager: Report CTA, team overview, my reports status
 * - Employee: Pending documents, signed documents
 * - Company Admin: HR operations overview, policy coverage
 */
"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { AICostTracker } from "@/components/domain/AICostTracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  aiAPI,
  disciplinaryAPI,
  incidentsAPI,
  meetingsAPI,
  policiesAPI,
  settingsAPI,
  usersAPI,
  type DisciplinaryActionResponse,
  type IncidentResponse,
  type MeetingResponse,
  type PolicyResponse,
  type UserResponse,
} from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Inbox,
  Loader2,
  PlusCircle,
  Settings2,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  if (!user) {
    return (
      <PageContainer title="Dashboard" description="Loading...">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const role = user?.role ?? "EMPLOYEE";

  return (
    <PageContainer
      title="Dashboard"
      description={`Welcome back, ${user?.firstName || "User"}. Here's your overview.`}
      actions={
        role === "MANAGER" && (
          <Button asChild size="sm">
            <Link href="/report-issue">
              <PlusCircle className="mr-2 h-4 w-4" />
              Report Issue
            </Link>
          </Button>
        )
      }
    >
      {role === "HR_AGENT" && <HRDashboard />}
      {role === "MANAGER" && <ManagerDashboard />}
      {role === "EMPLOYEE" && <EmployeeDashboard />}
      {role === "COMPANY_ADMIN" && <CompanyAdminDashboard />}
      {role === "SUPER_ADMIN" && <SuperAdminDashboard />}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// HR Agent Dashboard
// ---------------------------------------------------------------------------

function HRDashboard() {
  const [pendingReviews, setPendingReviews] = useState<IncidentResponse[]>([]);
  const [aiAttention, setAiAttention] = useState<IncidentResponse[]>([]);
  const [signatureQueue, setSignatureQueue] = useState<DisciplinaryActionResponse[]>([]);
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [reviewRes, aiRes, signatureRes, meetRes] = await Promise.all([
          incidentsAPI.list({ status: "pending_hr_review", limit: "8" }),
          incidentsAPI.list({ status: "ai_evaluating", limit: "8" }),
          disciplinaryAPI.list("pending_signature", "", 8),
          meetingsAPI.list("scheduled", "", 8),
        ]);
        if (active) {
          setPendingReviews(reviewRes.incidents);
          setAiAttention(aiRes.incidents);
          setSignatureQueue(signatureRes.actions);
          setMeetings(meetRes.meetings);
        }
      } catch (err) {
        console.error("Failed to load HR dashboard data", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const meetingFollowUps = meetings.filter((meeting) => !meeting.ai_summary).slice(0, 4);
  const lowConfidenceReviews = [...pendingReviews, ...aiAttention]
    .filter((item) => (item.ai_confidence_score ?? 1) < 0.85)
    .slice(0, 4);

  const stats = [
    {
      label: "Pending Reviews",
      value: pendingReviews.length.toString(),
      icon: <Inbox className="h-5 w-5" />,
      color: "text-brand-primary",
      href: "/incident-queue?status=pending_hr_review",
    },
    {
      label: "AI Evaluating",
      value: aiAttention.length.toString(),
      icon: <Bot className="h-5 w-5" />,
      color: "text-brand-warning",
      href: "/incident-queue?status=ai_evaluating",
    },
    {
      label: "Meetings Today",
      value: meetings.length.toString(),
      icon: <Calendar className="h-5 w-5" />,
      color: "text-text-secondary",
      href: "/meetings",
    },
    {
      label: "Awaiting Signature",
      value: signatureQueue.length.toString(),
      icon: <FileCheck className="h-5 w-5" />,
      color: "text-brand-success",
      href: "/documents",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer p-4 transition-colors hover:bg-card-hover">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-tertiary">{stat.label}</p>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Pending Reviews
          </h3>
          <div className="space-y-2">
            {pendingReviews.length === 0 && (
              <p className="text-sm text-text-tertiary">No pending reviews.</p>
            )}
            {pendingReviews.map((item) => (
              <Link
                key={item.id}
                href={`/incident-queue/${item.id}/review`}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-card-hover"
              >
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${item.severity === "high" || item.severity === "critical" ? "bg-red-500" : item.severity === "medium" ? "bg-amber-500" : "bg-green-500"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    {item.reference_number || "INC-" + item.id.slice(0, 4)}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {item.type} · {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                {item.ai_confidence_score ? (
                  <Badge
                    variant={
                      (item.ai_confidence_score ?? 0) >= 0.85 ? "success" : "warning"
                    }
                  >
                    {Math.round(item.ai_confidence_score * 100)}%
                  </Badge>
                ) : null}
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            AI Attention Queue
          </h3>
          <div className="space-y-2">
            {aiAttention.length === 0 && lowConfidenceReviews.length === 0 && (
              <p className="text-sm text-text-tertiary">No AI items need review right now.</p>
            )}
            {lowConfidenceReviews.map((item) => (
              <Link
                key={item.id}
                href={`/incident-queue/${item.id}/review`}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-card-hover"
              >
                <Bot className="h-4 w-4 flex-shrink-0 text-brand-warning" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    {item.reference_number || item.type}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Confidence {Math.round((item.ai_confidence_score ?? 0) * 100)}% · {item.type}
                  </p>
                </div>
                <Badge variant="warning">Needs human check</Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-text-primary">
              Follow Up Today
            </h3>
            <Button asChild size="sm" variant="outline">
              <Link href="/meetings">View Meetings</Link>
            </Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <TaskListCard
              title="Meeting summaries pending"
              empty="No scheduled meetings need notes or summaries."
              items={meetingFollowUps.map((meeting) => ({
                id: meeting.id,
                href: "/meetings",
                title: meeting.type || "Meeting",
                subtitle: meeting.scheduled_at
                  ? new Date(meeting.scheduled_at).toLocaleString()
                  : "Schedule still being finalized",
                badge: formatStatusLabel(meeting.status),
                badgeVariant: meeting.status === "scheduled" ? "warning" : "outline",
              }))}
            />
            <TaskListCard
              title="Signature bottlenecks"
              empty="No documents are waiting on signatures."
              items={signatureQueue.slice(0, 4).map((action) => ({
                id: action.id,
                href: "/documents",
                title: action.action_type || "Disciplinary document",
                subtitle: `Created ${formatRelativeDate(action.created_at)}`,
                badge: formatStatusLabel(action.status),
                badgeVariant: "success",
              }))}
            />
          </div>
        </Card>

        <QuickActionsPanel
          title="HR Quick Actions"
          actions={[
            {
              href: "/incident-queue?status=pending_hr_review",
              label: "Triage incident queue",
              description: "Review the oldest incidents first.",
              icon: <Inbox className="h-4 w-4" />,
            },
            {
              href: "/meetings",
              label: "Prepare meetings",
              description: "Check upcoming schedules and summaries.",
              icon: <Calendar className="h-4 w-4" />,
            },
            {
              href: "/policies",
              label: "Review policy source",
              description: "Confirm the policy backing each recommendation.",
              icon: <FileText className="h-4 w-4" />,
            },
            {
              href: "/feedback",
              label: "Report workflow friction",
              description: "Capture product issues from the queue.",
              icon: <Sparkles className="h-4 w-4" />,
            },
          ]}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager Dashboard
// ---------------------------------------------------------------------------

function ManagerDashboard() {
  const [myReports, setMyReports] = useState<IncidentResponse[]>([]);
  const [directReports, setDirectReports] = useState<
    Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      job_title: string | null;
    }>
  >([]);
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [reportRes, reportsRes, meetingsRes] = await Promise.all([
          incidentsAPI.getDirectReports(),
          incidentsAPI.list({ limit: "12" }),
          meetingsAPI.list("scheduled", "", 6),
        ]);
        if (active) {
          setDirectReports(reportRes.directReports);
          setMyReports(reportsRes.incidents);
          setMeetings(meetingsRes.meetings);
        }
      } catch (err) {
        console.error("Failed to load Manager dashboard data", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const openReports = myReports.filter((report) => isOpenIncident(report.status));
  const urgentReports = openReports.filter(
    (report) => report.severity === "high" || report.severity === "critical",
  );
  const reportStages = [
    { label: "AI Review", count: myReports.filter((r) => r.status === "ai_evaluating").length },
    {
      label: "HR Review",
      count: myReports.filter((r) => r.status === "pending_hr_review").length,
    },
    {
      label: "Awaiting signature",
      count: myReports.filter((r) => r.status === "pending_signature").length,
    },
    {
      label: "Resolved",
      count: myReports.filter((r) => !isOpenIncident(r.status)).length,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="from-brand-slate-dark border-brand-primary/30 bg-gradient-to-br to-brand-slate-light p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Need to report an issue?
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Submit an employee incident and let AI handle the evaluation.
            </p>
          </div>
          <Button asChild size="lg" className="flex-shrink-0">
            <Link href="/report-issue">
              <PlusCircle className="mr-2 h-5 w-5" />
              Report Issue
            </Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Direct Reports"
          value={directReports.length}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="My Reports"
          value={myReports.length.toString()}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Urgent Issues"
          value={urgentReports.length.toString()}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-text-primary">
              Report Pipeline
            </h3>
            <Badge variant="outline">Live status</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {reportStages.map((stage) => (
              <div key={stage.label} className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-text-tertiary">{stage.label}</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {stage.count}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <TaskListCard
          title="Upcoming meetings"
          empty="No meetings scheduled right now."
          items={meetings.slice(0, 4).map((meeting) => ({
            id: meeting.id,
            href: "/meetings",
            title: meeting.type || "Meeting",
            subtitle: meeting.scheduled_at
              ? new Date(meeting.scheduled_at).toLocaleString()
              : "Scheduling in progress",
            badge: formatStatusLabel(meeting.status),
            badgeVariant: "outline",
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TaskListCard
          title="Team Watchlist"
          empty="No direct reports are linked to your account yet."
          items={directReports.slice(0, 5).map((report) => ({
            id: report.id,
            title: `${report.first_name} ${report.last_name}`,
            subtitle: report.job_title || report.email,
            badge: report.job_title ? "Direct report" : "Profile incomplete",
            badgeVariant: "outline",
          }))}
        />

        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Recent Reports
          </h3>
          <div className="space-y-2">
            {myReports.length === 0 && (
              <p className="text-sm text-text-tertiary">
                You have not submitted any reports yet.
              </p>
            )}
            {myReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5"
              >
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${severityDotClass(report.severity)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    {report.reference_number || report.type}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusVariant(report.status)}>
                  {formatStatusLabel(report.status)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <QuickActionsPanel
        title="Manager Quick Actions"
        actions={[
          {
            href: "/report-issue",
            label: "Start a new report",
            description: "Capture the incident while details are fresh.",
            icon: <PlusCircle className="h-4 w-4" />,
          },
          {
            href: "/meetings",
            label: "Prepare for meetings",
            description: "Check who is scheduled and what is next.",
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            href: "/profile",
            label: "Update your profile",
            description: "Keep role and contact details current.",
            icon: <Settings2 className="h-4 w-4" />,
          },
          {
            href: "/feedback",
            label: "Request product help",
            description: "Send issues or feature requests to the team.",
            icon: <Sparkles className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee Dashboard
// ---------------------------------------------------------------------------

function EmployeeDashboard() {
  const [docs, setDocs] = useState<DisciplinaryActionResponse[]>([]);
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [actionsRes, meetingsRes] = await Promise.all([
          disciplinaryAPI.list(undefined, "", 12),
          meetingsAPI.list("scheduled", "", 6),
        ]);
        if (active && actionsRes.actions) {
          setDocs(actionsRes.actions);
          setMeetings(meetingsRes.meetings);
        }
      } catch (err) {
        console.error("Failed to load Employee dashboard data", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const pendingDocs = docs.filter((doc) => doc.status === "pending_signature");
  const completedDocs = docs.filter((doc) => doc.status !== "pending_signature");
  const recentActivity = [...docs]
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Pending Documents"
          value={pendingDocs.length.toString()}
        />
        <StatCard
          icon={<FileCheck className="h-5 w-5" />}
          label="Signed Documents"
          value={completedDocs.length.toString()}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Upcoming Meetings"
          value={meetings.length.toString()}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Needs Attention"
          value={pendingDocs.length > 0 ? pendingDocs.length.toString() : "0"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Documents Awaiting Signature
          </h3>
          {pendingDocs.length === 0 && (
            <p className="text-sm text-text-tertiary">
              You have no documents pending signature.
            </p>
          )}
          <div className="space-y-2">
            {pendingDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}/sign`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-card-hover"
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-brand-warning" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    {doc.action_type || "Document"}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Created {formatRelativeDate(doc.created_at)}
                  </p>
                </div>
                <Button size="sm">Sign</Button>
              </Link>
            ))}
          </div>
        </Card>

        <TaskListCard
          title="Upcoming meetings"
          empty="No meetings are scheduled for you right now."
          items={meetings.slice(0, 4).map((meeting) => ({
            id: meeting.id,
            href: "/meetings",
            title: meeting.type || "Meeting",
            subtitle: meeting.scheduled_at
              ? new Date(meeting.scheduled_at).toLocaleString()
              : "Invite pending",
            badge: formatStatusLabel(meeting.status),
            badgeVariant: "outline",
          }))}
        />
      </div>

      <TaskListCard
        title="Recent document activity"
        empty="No recent document activity yet."
        items={recentActivity.map((doc) => ({
          id: doc.id,
          href: doc.status === "pending_signature" ? `/documents/${doc.id}/sign` : "/documents",
          title: doc.action_type || "Document",
          subtitle: `Updated ${formatRelativeDate(doc.updated_at)}`,
          badge: formatStatusLabel(doc.status),
          badgeVariant: doc.status === "pending_signature" ? "warning" : "success",
        }))}
      />

      <QuickActionsPanel
        title="Employee Quick Actions"
        actions={[
          {
            href: "/documents",
            label: "Review all documents",
            description: "See signed, pending, and historical documents.",
            icon: <FileText className="h-4 w-4" />,
          },
          {
            href: "/profile",
            label: "Update profile details",
            description: "Keep your contact information accurate.",
            icon: <Settings2 className="h-4 w-4" />,
          },
          {
            href: "/feedback",
            label: "Ask for help",
            description: "Send a product or workflow issue to the team.",
            icon: <Sparkles className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Company Admin Dashboard
// ---------------------------------------------------------------------------

function CompanyAdminDashboard() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [actions, setActions] = useState<DisciplinaryActionResponse[]>([]);
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof settingsAPI.get>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [usersRes, policiesRes, incidentsRes, actionsRes, settingsRes] =
          await Promise.all([
            usersAPI.list({ limit: 100 }),
            policiesAPI.list({ limit: 100 }),
            incidentsAPI.list({ limit: "100" }),
            disciplinaryAPI.list(undefined, "", 100),
            settingsAPI.get(),
          ]);

        if (!active) {
          return;
        }

        setUsers(usersRes.users);
        setPolicies(policiesRes.policies);
        setIncidents(incidentsRes.incidents);
        setActions(actionsRes.actions);
        setSettings(settingsRes);
      } catch (err) {
        console.error("Failed to load Company Admin dashboard data", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const totalEmployees = users.filter((user) => user.role === "EMPLOYEE").length;
  const activePolicies = policies.filter((policy) => policy.is_active);
  const openIncidents = incidents.filter((incident) => isOpenIncident(incident.status));
  const pendingSignatures = actions.filter((action) => action.status === "pending_signature");
  const stalePolicies = policies.filter(
    (policy) => !policy.is_active || Boolean(policy.expiry_date && Date.parse(policy.expiry_date) < Date.now()),
  );
  const dormantUsers = users
    .filter((user) => !user.last_login_at || Date.parse(user.last_login_at) < Date.now() - 1000 * 60 * 60 * 24 * 14)
    .slice(0, 4);
  const highRiskIncidents = openIncidents
    .filter((incident) => incident.severity === "high" || incident.severity === "critical")
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Employees"
          value={totalEmployees}
          href="/team"
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Active Policies"
          value={activePolicies.length}
          href="/policies"
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="AI Threshold"
          value={`${Math.round((settings?.ai.confidenceThreshold ?? 0.85) * 100)}%`}
          href="/settings"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open Incidents"
          value={openIncidents.length}
          href="/incident-queue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TaskListCard
          title="Compliance Hotspots"
          empty="No high-risk incidents are open right now."
          items={highRiskIncidents.map((incident) => ({
            id: incident.id,
            href: `/incident-queue/${incident.id}/review`,
            title: incident.reference_number || incident.type,
            subtitle: `${incident.type} · ${formatRelativeDate(incident.created_at)}`,
            badge: incident.severity,
            badgeVariant: "warning",
          }))}
        />

        <TaskListCard
          title="Workforce Follow Up"
          empty="No dormant users or pending invites need attention."
          items={dormantUsers.map((user) => ({
            id: user.id,
            href: "/team",
            title: `${user.first_name} ${user.last_name}`,
            subtitle: user.last_login_at
              ? `Last login ${formatRelativeDate(user.last_login_at)}`
              : "Has never logged in",
            badge: formatStatusLabel(user.status),
            badgeVariant: user.status === "active" ? "outline" : "warning",
          }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-text-primary">
              Policy Coverage
            </h3>
            <Button asChild size="sm" variant="outline">
              <Link href="/policies">Manage Policies</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Active" value={activePolicies.length} />
            <MiniMetric label="Needs review" value={stalePolicies.length} />
            <MiniMetric label="Pending signatures" value={pendingSignatures.length} />
          </div>
          <div className="mt-4 space-y-2">
            {stalePolicies.slice(0, 4).map((policy) => (
              <Link
                key={policy.id}
                href="/policies"
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-card-hover"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{policy.title}</p>
                  <p className="text-xs text-text-tertiary">
                    {policy.is_active ? "Check effective dates and expiry windows" : "Policy is currently inactive"}
                  </p>
                </div>
                <Badge variant={policy.is_active ? "outline" : "warning"}>
                  {policy.is_active ? "Review" : "Inactive"}
                </Badge>
              </Link>
            ))}
            {stalePolicies.length === 0 && (
              <p className="text-sm text-text-tertiary">
                All active policies look current.
              </p>
            )}
          </div>
        </Card>

        <AICostTracker monthlyBudget={settings?.ai.monthlyBudgetUsd} />
      </div>

      <QuickActionsPanel
        title="Admin Quick Actions"
        actions={[
          {
            href: "/team",
            label: "Review team access",
            description: "Inspect invitations, roles, and dormant users.",
            icon: <Users className="h-4 w-4" />,
          },
          {
            href: "/policies/import",
            label: "Import handbook updates",
            description: "Refresh policies from source documents.",
            icon: <FileText className="h-4 w-4" />,
          },
          {
            href: "/settings",
            label: "Tune AI configuration",
            description: "Adjust confidence, disputes, and monthly budget.",
            icon: <Settings2 className="h-4 w-4" />,
          },
          {
            href: "/ai-performance",
            label: "Inspect AI performance",
            description: "See model quality, drift, and cost snapshots.",
            icon: <Bot className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Super Admin Dashboard
// ---------------------------------------------------------------------------

function SuperAdminDashboard() {
  const [healthReady, setHealthReady] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [health, usersRes, policiesRes, incidentsRes] = await Promise.all([
          aiAPI.checkHealth(),
          usersAPI.list({ limit: 100 }),
          policiesAPI.list({ limit: 100 }),
          incidentsAPI.list({ limit: "100" }),
        ]);

        if (!active) {
          return;
        }

        setHealthReady(health);
        setUsers(usersRes.users);
        setPolicies(policiesRes.policies);
        setIncidents(incidentsRes.incidents);
      } catch (err) {
        console.error("Failed to load Super Admin dashboard data", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const openIncidents = incidents.filter((incident) => isOpenIncident(incident.status));
  const recentlyActiveUsers = users
    .filter((user) => user.last_login_at)
    .sort((left, right) => (right.last_login_at ?? "").localeCompare(left.last_login_at ?? ""))
    .slice(0, 4);
  const policyCoverage = policies.filter((policy) => policy.is_active).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Active Workspace Users"
          value={users.length}
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="AI Proxy"
          value={healthReady ? "Healthy" : "Check"}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Active Policies"
          value={policyCoverage}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open Incidents"
          value={openIncidents.length}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Operator workspace overview
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              This view uses the live control surfaces available in the current workspace while platform-wide tenant aggregation is still being wired.
            </p>
          </div>
          <Badge variant={healthReady ? "success" : "warning"}>
            {healthReady ? "AI routing healthy" : "AI routing degraded"}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TaskListCard
          title="Watchlist"
          empty="No open incidents need attention."
          items={openIncidents.slice(0, 4).map((incident) => ({
            id: incident.id,
            href: incident.status === "pending_hr_review" ? `/incident-queue/${incident.id}/review` : "/incident-queue",
            title: incident.reference_number || incident.type,
            subtitle: `${incident.type} · ${formatRelativeDate(incident.created_at)}`,
            badge: formatStatusLabel(incident.status),
            badgeVariant: statusVariant(incident.status),
          }))}
        />
        <TaskListCard
          title="Recently active users"
          empty="No recent user activity is available."
          items={recentlyActiveUsers.map((user) => ({
            id: user.id,
            href: "/team",
            title: `${user.first_name} ${user.last_name}`,
            subtitle: `Last login ${formatRelativeDate(user.last_login_at ?? new Date().toISOString())}`,
            badge: user.role.replaceAll("_", " "),
            badgeVariant: "outline",
          }))}
        />
      </div>

      <QuickActionsPanel
        title="Operator Quick Actions"
        actions={[
          {
            href: "/ai-performance",
            label: "Review AI performance",
            description: "Check model output and cost snapshots.",
            icon: <Bot className="h-4 w-4" />,
          },
          {
            href: "/team",
            label: "Inspect active workspace",
            description: "Review users and tenant-level activity.",
            icon: <Users className="h-4 w-4" />,
          },
          {
            href: "/policies",
            label: "Audit policy coverage",
            description: "Confirm the workspace has current policy content.",
            icon: <FileText className="h-4 w-4" />,
          },
          {
            href: "/feedback",
            label: "Capture platform issues",
            description: "Log issues discovered during operations review.",
            icon: <Sparkles className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light text-text-secondary">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-text-tertiary">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function TaskListCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    badgeVariant: "default" | "success" | "warning" | "outline";
    href?: string;
  }>;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-base font-semibold text-text-primary">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-text-tertiary">{empty}</p>}
        {items.map((item) => {
          const content = (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-card-hover">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                <p className="text-xs text-text-tertiary">{item.subtitle}</p>
              </div>
              <Badge variant={item.badgeVariant}>{item.badge}</Badge>
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.id} href={item.href}>
                {content}
              </Link>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </Card>
  );
}

function QuickActionsPanel({
  title,
  actions,
}: {
  title: string;
  actions: Array<{
    href: string;
    label: string;
    description: string;
    icon: ReactNode;
  }>;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-base font-semibold text-text-primary">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="rounded-lg border border-border p-4 transition-colors hover:bg-card-hover"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-slate-light text-text-secondary">
                {action.icon}
              </div>
              <ArrowRight className="h-4 w-4 text-text-tertiary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-text-primary">{action.label}</p>
            <p className="mt-1 text-xs text-text-tertiary">{action.description}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function formatStatusLabel(status: string | null | undefined) {
  return (status || "unknown").replaceAll("_", " ");
}

function statusVariant(status: string | null | undefined): "default" | "success" | "warning" | "outline" {
  if (!status) {
    return "outline";
  }

  if (["approved", "resolved", "completed", "signed"].includes(status)) {
    return "success";
  }

  if (["pending_hr_review", "pending_signature", "ai_evaluating"].includes(status)) {
    return "warning";
  }

  return "outline";
}

function isOpenIncident(status: string | null | undefined) {
  return !["approved", "rejected", "resolved", "closed", "signed"].includes(
    status || "",
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffHours) < 24) {
    return diffHours >= 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  }

  return diffDays >= 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
}

function severityDotClass(severity: string | null | undefined) {
  if (severity === "high" || severity === "critical") {
    return "bg-red-500";
  }

  if (severity === "medium") {
    return "bg-amber-500";
  }

  return "bg-green-500";
}
