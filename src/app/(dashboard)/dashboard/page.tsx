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

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuthStore } from "@/stores/auth-store";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox,
  FileCheck,
  Calendar,
  Clock,
  PlusCircle,
  FileText,
  Building2,
  Users,
  Shield,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  dashboardAPI,
  type DashboardEmployeeDocumentItem,
  usersAPI,
  type DashboardMeetingItem,
  type DashboardReportItem,
  type DashboardReviewItem,
  type DashboardSummaryResponse,
  type UserResponse,
} from "@/lib/api/client";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadSummary() {
      try {
        const data = await dashboardAPI.getSummary();
        if (!cancelled) {
          setSummary(data.summary);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }

    setSummaryLoading(true);
    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
      description={`Welcome back, ${user?.firstName ?? "User"}. Here's your overview.`}
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
      {role === "HR_AGENT" && (
        <HRDashboard summary={summary} summaryLoading={summaryLoading} />
      )}
      {role === "MANAGER" && (
        <ManagerDashboard summary={summary} summaryLoading={summaryLoading} />
      )}
      {role === "EMPLOYEE" && (
        <EmployeeDashboard summary={summary} summaryLoading={summaryLoading} />
      )}
      {role === "COMPANY_ADMIN" && (
        <CompanyAdminDashboard summary={summary} summaryLoading={summaryLoading} />
      )}
      {role === "SUPER_ADMIN" && <SuperAdminDashboard />}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// HR Agent Dashboard
// ---------------------------------------------------------------------------

function HRDashboard({
  summary,
  summaryLoading,
}: {
  summary: DashboardSummaryResponse | null;
  summaryLoading: boolean;
}) {
  const stats = [
    {
      label: "Pending Reviews",
      value: formatSummaryValue(summary?.pendingReviewsCount, summaryLoading),
      icon: <Inbox className="h-5 w-5" />,
      color: "text-brand-primary",
      href: "/incident-queue?status=pending_hr_review",
    },
    {
      label: "AI Evaluating",
      value: formatSummaryValue(summary?.aiEvaluatingCount, summaryLoading),
      icon: <Clock className="h-5 w-5" />,
      color: "text-brand-warning",
      href: "/incident-queue?status=ai_evaluating",
    },
    {
      label: "Meetings Today",
      value: formatSummaryValue(summary?.meetingsTodayCount, summaryLoading),
      icon: <Calendar className="h-5 w-5" />,
      color: "text-text-secondary",
      href: "/meetings",
    },
    {
      label: "Awaiting Signature",
      value: formatSummaryValue(summary?.awaitingSignatureCount, summaryLoading),
      icon: <FileCheck className="h-5 w-5" />,
      color: "text-brand-success",
      href: "/incident-queue?status=pending_signature",
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer p-4 transition-colors hover:bg-card-hover">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light ${stat.color}`}
                >
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

      <Link href="/employees">
        <Card className="cursor-pointer border-brand-primary/20 p-4 transition-colors hover:bg-card-hover">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-text-primary">
                Manage Employees
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                View, invite, and manage employee records.
              </p>
            </div>
            <Users className="h-6 w-6 text-brand-primary" />
          </div>
        </Card>
      </Link>

      <YourEmployeesSection />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Pending Reviews
          </h3>
          <div className="space-y-2">
            <DashboardReviewsList
              items={summary?.pendingReviews ?? []}
              loading={summaryLoading}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Upcoming Meetings
          </h3>
          <div className="space-y-2">
            <DashboardMeetingsList
              items={summary?.upcomingMeetings ?? []}
              loading={summaryLoading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager Dashboard
// ---------------------------------------------------------------------------

function ManagerDashboard({
  summary,
  summaryLoading,
}: {
  summary: DashboardSummaryResponse | null;
  summaryLoading: boolean;
}) {
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

      <Link href="/employees">
        <Card className="cursor-pointer p-4 transition-colors hover:bg-card-hover">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-text-primary">
                My Team & Employees
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Jump into the employee management screen.
              </p>
            </div>
            <Users className="h-6 w-6 text-brand-primary" />
          </div>
        </Card>
      </Link>

      <YourEmployeesSection />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Team Members"
          value={formatSummaryValue(summary?.myEmployeesCount, summaryLoading)}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="My Reports"
          value={formatSummaryValue(summary?.myReportsCount, summaryLoading)}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open Issues"
          value={formatSummaryValue(summary?.myOpenReportsCount, summaryLoading)}
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
          Recent Reports
        </h3>
        <div className="space-y-2">
          <DashboardReportsList
            items={summary?.recentReports ?? []}
            loading={summaryLoading}
          />
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee Dashboard
// ---------------------------------------------------------------------------

function EmployeeDashboard({
  summary,
  summaryLoading,
}: {
  summary: DashboardSummaryResponse | null;
  summaryLoading: boolean;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Pending Documents"
          value={formatSummaryValue(
            summary?.employeePendingDocumentsCount,
            summaryLoading,
          )}
        />
        <StatCard
          icon={<FileCheck className="h-5 w-5" />}
          label="Signed Documents"
          value={formatSummaryValue(
            summary?.employeeSignedDocumentsCount,
            summaryLoading,
          )}
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
          Documents Awaiting Signature
        </h3>
        <EmployeePendingDocumentsList
          items={summary?.pendingDocuments ?? []}
          loading={summaryLoading}
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Company Admin Dashboard
// ---------------------------------------------------------------------------

function CompanyAdminDashboard({
  summary,
  summaryLoading,
}: {
  summary: DashboardSummaryResponse | null;
  summaryLoading: boolean;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Employees"
          value={formatSummaryValue(summary?.companyTotalEmployees, summaryLoading)}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Active Policies"
          value={formatSummaryValue(summary?.activePoliciesCount, summaryLoading)}
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="AI Confidence"
          value={formatSummaryPercent(summary?.aiConfidencePercent, summaryLoading)}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open Incidents"
          value={formatSummaryValue(summary?.openIncidentsCount, summaryLoading)}
        />
      </div>

      <Link href="/departments">
        <Card className="cursor-pointer p-4 transition-colors hover:bg-card-hover">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-text-primary">
                Manage Departments
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Create, rename, and organize company departments.
              </p>
            </div>
            <Building2 className="h-6 w-6 text-brand-primary" />
          </div>
        </Card>
      </Link>

      <YourEmployeesSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Super Admin Dashboard
// ---------------------------------------------------------------------------

function SuperAdminDashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Tenants" value="3" />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="Security Events"
          value="0"
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Platform Uptime"
          value="99.9%"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="AI Errors (24h)"
          value="0"
        />
      </div>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
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
}

function YourEmployeesSection() {
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        const data = await usersAPI.getMyEmployees();
        if (!cancelled) {
          setEmployees(data.employees);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setEmployees([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            Your Employees
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Active employees in your current department scope.
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/employees">View All</Link>
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && employees.length === 0 && (
        <EmptyState
          className="rounded-lg border border-dashed border-border px-4 py-8"
          icon={<Users className="h-8 w-8" />}
          title={failed ? "Could not load employees" : "No employees in your scope"}
          description={
            failed
              ? "This section could not be loaded right now."
              : "Assign employees to your department or reporting line to see them here."
          }
        />
      )}

      {!loading && employees.length > 0 && (
        <div className="space-y-2">
          {employees.slice(0, 6).map((employee) => {
            const fullName = `${employee.first_name} ${employee.last_name}`.trim();
            const initials = fullName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("");

            return (
              <div
                key={employee.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-slate-light text-sm font-medium text-text-primary">
                  {initials || "--"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {fullName || employee.email}
                  </p>
                  <p className="truncate text-xs text-text-tertiary">
                    {employee.job_title || employee.role} · {employee.email}
                  </p>
                </div>
                <Badge variant="outline">{employee.status}</Badge>
              </div>
            );
          })}

          {employees.length > 6 && (
            <p className="pt-1 text-xs text-text-tertiary">
              Showing 6 of {employees.length} employees.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function DashboardReportsList({
  items,
  loading,
}: {
  items: DashboardReportItem[];
  loading: boolean;
}) {
  if (loading) {
    return <DashboardListSkeleton />;
  }

  if (items.length === 0) {
    return <DashboardListEmpty message="No reports submitted yet." />;
  }

  return (
    <>
      {items.map((report) => (
        <div
          key={report.id}
          className="flex items-center gap-3 rounded-lg border border-border p-2.5"
        >
          <div
            className={`h-2 w-2 flex-shrink-0 rounded-full ${getStatusDotClass(report.status)}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{report.reference}</p>
            <p className="text-xs text-text-tertiary">
              {report.employeeName} · {formatRelativeTime(report.createdAt)}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(report.status)}>
            {formatStatusLabel(report.status)}
          </Badge>
        </div>
      ))}
    </>
  );
}

function DashboardReviewsList({
  items,
  loading,
}: {
  items: DashboardReviewItem[];
  loading: boolean;
}) {
  if (loading) {
    return <DashboardListSkeleton />;
  }

  if (items.length === 0) {
    return <DashboardListEmpty message="No pending reviews right now." />;
  }

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/incident-queue/${item.id}/review`}
          className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-card-hover"
        >
          <div
            className={`h-2 w-2 flex-shrink-0 rounded-full ${getSeverityDotClass(item.severity)}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{item.employeeName}</p>
            <p className="text-xs text-text-tertiary">
              {item.type} · {formatRelativeTime(item.createdAt)}
            </p>
          </div>
          <Badge variant={getConfidenceBadgeVariant(item.confidence)}>
            {formatConfidence(item.confidence)}
          </Badge>
        </Link>
      ))}
    </>
  );
}

function DashboardMeetingsList({
  items,
  loading,
}: {
  items: DashboardMeetingItem[];
  loading: boolean;
}) {
  if (loading) {
    return <DashboardListSkeleton />;
  }

  if (items.length === 0) {
    return <DashboardListEmpty message="No upcoming meetings scheduled today." />;
  }

  return (
    <>
      {items.map((meeting) => (
        <Link
          key={meeting.id}
          href={`/meetings/${meeting.id}`}
          className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-card-hover"
        >
          <Calendar className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{meeting.title}</p>
            <p className="text-xs text-text-tertiary">
              {formatMeetingTime(meeting.scheduledAt)} · {meeting.participantSummary}
            </p>
          </div>
          <Badge variant="outline">{meeting.type}</Badge>
        </Link>
      ))}
    </>
  );
}

function DashboardListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

function DashboardListEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-text-tertiary">
      {message}
    </p>
  );
}

function EmployeePendingDocumentsList({
  items,
  loading,
}: {
  items: DashboardEmployeeDocumentItem[];
  loading: boolean;
}) {
  if (loading) {
    return <DashboardListSkeleton />;
  }

  if (items.length === 0) {
    return <DashboardListEmpty message="No documents are awaiting your signature." />;
  }

  return (
    <div className="space-y-2">
      {items.map((doc) => (
        <Link
          key={doc.id}
          href={`/documents/${doc.id}/sign`}
          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-card-hover"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-brand-warning" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{doc.title}</p>
            <p className="text-xs text-text-tertiary">
              {doc.reference} · Issued {formatShortDate(doc.createdAt)}
            </p>
          </div>
          <Button size="sm">Sign</Button>
        </Link>
      ))}
    </div>
  );
}

function formatSummaryValue(value: number | null | undefined, loading: boolean): string {
  if (loading) return "--";
  return String(value ?? 0);
}

function formatSummaryPercent(
  value: number | null | undefined,
  loading: boolean,
): string {
  if (loading) return "--";
  return value === null || value === undefined ? "--" : `${value}%`;
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function getStatusBadgeVariant(status: string): "default" | "success" | "warning" {
  if (status === "approved") return "success";
  if (status === "pending_hr_review") return "warning";
  return "default";
}

function getStatusDotClass(status: string): string {
  if (status === "approved") return "bg-brand-success";
  if (status === "pending_hr_review") return "bg-brand-primary";
  return "bg-brand-warning";
}

function getSeverityDotClass(severity: string): string {
  if (severity === "high" || severity === "critical") return "bg-brand-error";
  if (severity === "medium") return "bg-brand-warning";
  return "bg-brand-primary";
}

function getConfidenceBadgeVariant(
  confidence: number | null,
): "default" | "success" | "warning" {
  if (confidence === null) return "default";
  return confidence >= 0.85 ? "success" : "warning";
}

function formatConfidence(confidence: number | null): string {
  if (confidence === null) return "N/A";
  return `${Math.round(confidence * 100)}%`;
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Unknown time";

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatMeetingTime(value: string | null): string {
  if (!value) return "Unscheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unscheduled";

  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Mock Data (replace with real API calls in T027)
// ---------------------------------------------------------------------------
