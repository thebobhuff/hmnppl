/**
 * My Reports — Manager's reported incidents list.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { incidentsAPI } from "@/lib/api/client";
import { Inbox, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface MyReport {
  id: string;
  reference_number: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  created_at: string;
}

export default function MyReportsPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Reports" }]);

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<MyReport[]>([]);

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setReports([
        {
          id: "1",
          reference_number: "INC-2026-0001",
          type: "tardiness",
          severity: "low",
          status: "approved",
          description: "Employee arrived 30 minutes late without prior notification",
          created_at: "2026-04-01T10:00:00Z",
        },
        {
          id: "2",
          reference_number: "INC-2026-0002",
          type: "performance",
          severity: "medium",
          status: "pending_hr_review",
          description: "Missed deadline for Q1 report delivery",
          created_at: "2026-04-05T14:30:00Z",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const severityColors: Record<string, string> = {
    low: "border-l-brand-primary",
    medium: "border-l-brand-warning",
    high: "border-l-brand-error",
    critical: "border-l-brand-error-dim",
  };

  const statusIcons = {
    pending_hr_review: <Clock className="h-4 w-4 text-brand-warning" />,
    ai_evaluating: <AlertTriangle className="h-4 w-4 text-brand-warning" />,
    approved: <CheckCircle className="h-4 w-4 text-brand-success" />,
    rejected: <AlertTriangle className="h-4 w-4 text-brand-error" />,
  };

  return (
    <PageContainer title="My Reports" description="View all incidents you've reported.">
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/report-issue">
              <Inbox className="mr-2 h-4 w-4" />
              Report New Issue
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="No reports yet"
            description="You haven't reported any incidents. Start by reporting an issue."
            actionLabel="Report an Issue"
            onAction={() => (window.location.href = "/report-issue")}
          />
        )}

        {!loading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className={`border-l-4 ${severityColors[report.severity] || "border-l-border"} p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-xs text-text-tertiary">
                        {report.reference_number}
                      </span>
                      <Badge variant="default" dot>
                        {report.type.replace(/_/g, " ")}
                      </Badge>
                      {statusIcons[report.status as keyof typeof statusIcons]}
                    </div>
                    <p className="mt-2 text-sm text-text-primary">{report.description}</p>
                    <p className="mt-2 text-xs text-text-tertiary">
                      Reported on {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
