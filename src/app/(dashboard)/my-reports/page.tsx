"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { incidentsAPI } from "@/lib/api/client";

interface Report {
  id: string;
  reference_number: string;
  type: string;
  severity: string;
  status: string;
  incident_date: string;
  created_at: string;
  employee_id: string;
  employee_name?: string;
  description: string;
}

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "error" | "default" }> = {
  pending_hr_review: { label: "Under Review", variant: "warning" },
  ai_evaluation: { label: "AI Evaluating", variant: "warning" },
  action_taken: { label: "Action Taken", variant: "success" },
  closed: { label: "Closed", variant: "default" },
  open: { label: "Open", variant: "warning" },
};

export default function MyReportsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Reports" },
  ]);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    async function loadReports() {
      try {
        const res = await incidentsAPI.list();
        if (active && res.incidents) {
          setReports(res.incidents.map((i: any) => ({
            id: i.id,
            reference_number: i.reference_number || `INC-${i.id.slice(0, 4)}`,
            type: i.type || "unknown",
            severity: i.severity || "low",
            status: i.status || "open",
            incident_date: i.incident_date || i.created_at,
            created_at: i.created_at,
            employee_id: i.employee_id || "",
            employee_name: i.employee_name || i.employee_id || "Unknown",
            description: i.description || "",
          })));
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReports();
    return () => { active = false; };
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending_hr_review" || r.status === "ai_evaluation").length,
    actionTaken: reports.filter((r) => r.status === "action_taken").length,
    closed: reports.filter((r) => r.status === "closed").length,
  }), [reports]);

  const severityColors: Record<string, string> = {
    low: "border-l-brand-primary",
    medium: "border-l-brand-warning",
    high: "border-l-brand-error",
    critical: "border-l-brand-error-dim",
  };

  return (
    <PageContainer
      title="My Reports"
      description="Track the incidents you have submitted."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                  <FileText className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  <p className="text-xs text-text-tertiary">Total Reports</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Clock className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.pending}</p>
                  <p className="text-xs text-text-tertiary">Under Review</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <CheckCircle className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.actionTaken}</p>
                  <p className="text-xs text-text-tertiary">Action Taken</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                  <CheckCircle className="h-5 w-5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.closed}</p>
                  <p className="text-xs text-text-tertiary">Closed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search by reference, employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Status</option>
                <option value="pending_hr_review">Under Review</option>
                <option value="ai_evaluation">AI Evaluating</option>
                <option value="action_taken">Action Taken</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <Button asChild>
              <Link href="/report-issue">
                Report New Issue
              </Link>
            </Button>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            reports.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Reports Yet
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  You haven&apos;t submitted any incident reports yet.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/report-issue">Report Your First Issue</Link>
                </Button>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Results Found
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Try adjusting your search or filters.
                </p>
              </Card>
            )
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const status = statusConfig[report.status] || { label: report.status, variant: "default" as const };
                return (
                  <Card
                    key={report.id}
                    className={`border-l-4 ${severityColors[report.severity] || "border-l-border"} p-4 transition-colors hover:bg-card-hover`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-brand-primary">
                            {report.reference_number}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge variant="outline">{report.type.replace(/_/g, " ")}</Badge>
                          <Badge
                            variant={
                              report.severity === "critical" || report.severity === "high"
                                ? "error"
                                : report.severity === "medium"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {report.severity}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                          {report.description || "No description provided."}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-text-tertiary">
                          <span>Employee: {report.employee_name || "Unknown"}</span>
                          <span>•</span>
                          <span>Filed: {new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/incident-queue/${report.id}`}>
                          View Details
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}