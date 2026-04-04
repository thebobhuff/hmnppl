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

import { useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuthStore } from "@/stores/auth-store";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox,
  FileCheck,
  Calendar,
  Clock,
  PlusCircle,
  FileText,
  Users,
  Shield,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

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
  const stats = [
    {
      label: "Pending Reviews",
      value: "7",
      icon: <Inbox className="h-5 w-5" />,
      color: "text-brand-primary",
      href: "/incident-queue?status=pending_hr_review",
    },
    {
      label: "AI Evaluating",
      value: "3",
      icon: <Clock className="h-5 w-5" />,
      color: "text-brand-warning",
      href: "/incident-queue?status=ai_evaluating",
    },
    {
      label: "Meetings Today",
      value: "2",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-text-secondary",
      href: "/meetings",
    },
    {
      label: "Awaiting Signature",
      value: "4",
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Pending Reviews
          </h3>
          <div className="space-y-2">
            {PENDING_REVIEWS.map((item) => (
              <Link
                key={item.id}
                href={`/incident-queue/${item.id}/review`}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-card-hover"
              >
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    item.severity === "high"
                      ? "bg-brand-error"
                      : item.severity === "medium"
                        ? "bg-brand-warning"
                        : "bg-brand-primary"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">{item.employee}</p>
                  <p className="text-xs text-text-tertiary">
                    {item.type} · {item.time}
                  </p>
                </div>
                <Badge variant={item.confidence >= 0.85 ? "success" : "warning"}>
                  {Math.round(item.confidence * 100)}%
                </Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
            Upcoming Meetings
          </h3>
          <div className="space-y-2">
            {UPCOMING_MEETINGS.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5"
              >
                <Calendar className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">{meeting.title}</p>
                  <p className="text-xs text-text-tertiary">
                    {meeting.time} · {meeting.participants}
                  </p>
                </div>
                <Badge variant="outline">{meeting.type}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager Dashboard
// ---------------------------------------------------------------------------

function ManagerDashboard() {
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
        <StatCard icon={<Users className="h-5 w-5" />} label="Team Members" value="12" />
        <StatCard icon={<FileText className="h-5 w-5" />} label="My Reports" value="5" />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open Issues"
          value="2"
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
          Recent Reports
        </h3>
        <div className="space-y-2">
          {MY_REPORTS.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5"
            >
              <div
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  report.status === "approved"
                    ? "bg-brand-success"
                    : report.status === "pending_hr_review"
                      ? "bg-brand-primary"
                      : "bg-brand-warning"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-primary">{report.reference}</p>
                <p className="text-xs text-text-tertiary">
                  {report.employee} · {report.time}
                </p>
              </div>
              <Badge
                variant={
                  report.status === "approved"
                    ? "success"
                    : report.status === "pending_hr_review"
                      ? "warning"
                      : "default"
                }
              >
                {report.status.replace(/_/g, " ")}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee Dashboard
// ---------------------------------------------------------------------------

function EmployeeDashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Pending Documents"
          value="1"
        />
        <StatCard
          icon={<FileCheck className="h-5 w-5" />}
          label="Signed Documents"
          value="3"
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-display text-base font-semibold text-text-primary">
          Documents Awaiting Signature
        </h3>
        {PENDING_DOCS.map((doc) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}/sign`}
            className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-card-hover"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-brand-warning" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">{doc.title}</p>
              <p className="text-xs text-text-tertiary">Due: {doc.dueDate}</p>
            </div>
            <Button size="sm">Sign</Button>
          </Link>
        ))}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Company Admin Dashboard
// ---------------------------------------------------------------------------

function CompanyAdminDashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Employees"
          value="48"
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Active Policies"
          value="5"
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="AI Confidence"
          value="87%"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open Incidents"
          value="7"
        />
      </div>
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

// ---------------------------------------------------------------------------
// Mock Data (replace with real API calls in T027)
// ---------------------------------------------------------------------------

const PENDING_REVIEWS = [
  {
    id: "1",
    employee: "John Smith",
    type: "Tardiness",
    severity: "medium" as const,
    confidence: 0.92,
    time: "2h ago",
  },
  {
    id: "2",
    employee: "Jane Doe",
    type: "Insubordination",
    severity: "high" as const,
    confidence: 0.78,
    time: "4h ago",
  },
  {
    id: "3",
    employee: "Bob Johnson",
    type: "Absence",
    severity: "low" as const,
    confidence: 0.95,
    time: "6h ago",
  },
];

const UPCOMING_MEETINGS = [
  {
    id: "1",
    title: "Disciplinary Review — J. Smith",
    time: "2:00 PM",
    participants: "HR + Manager + Employee",
    type: "Written Warning",
  },
  {
    id: "2",
    title: "PIP Follow-up — A. Williams",
    time: "4:30 PM",
    participants: "HR + Employee",
    type: "PIP",
  },
];

const MY_REPORTS = [
  {
    id: "1",
    reference: "INC-2026-0042",
    employee: "John Smith",
    status: "pending_hr_review",
    time: "2h ago",
  },
  {
    id: "2",
    reference: "INC-2026-0038",
    employee: "Jane Doe",
    status: "approved",
    time: "1d ago",
  },
  {
    id: "3",
    reference: "INC-2026-0035",
    employee: "Bob Johnson",
    status: "ai_evaluating",
    time: "3d ago",
  },
];

const PENDING_DOCS = [
  { id: "1", title: "Written Warning — Attendance Policy", dueDate: "Apr 7, 2026" },
];
