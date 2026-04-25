/**
 * Incident Detail — View incident details and take actions.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { incidentsAPI, type IncidentDetail } from "@/lib/api/client";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<IncidentDetail | null>(null);

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Incident Queue", href: "/incident-queue" },
    { label: id ? `Incident ${id.slice(0, 8)}` : "Incident" },
  ]);

  useEffect(() => {
    let active = true;
    async function loadIncident() {
      try {
        const res = await incidentsAPI.get(id);
        if (active) setIncident(res.incident);
      } catch (error) {
        console.error("Failed to load incident", error);
        if (active) setIncident(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) loadIncident();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Incident Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (!incident) {
    return (
      <PageContainer title="Incident Not Found">
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-brand-warning" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            Incident Not Found
          </h2>
          <p className="mt-2 text-text-secondary">
            The requested incident does not exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/incident-queue">Back to Queue</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const severityColors: Record<string, string> = {
    low: "border-l-brand-primary",
    medium: "border-l-brand-warning",
    high: "border-l-brand-error",
    critical: "border-l-brand-error-dim",
  };
  const confidence = incident.ai_confidence_score ?? 0;
  const employeeName = incident.employee
    ? `${incident.employee.first_name ?? ""} ${incident.employee.last_name ?? ""}`.trim()
    : incident.employee_id;
  const reporterName = incident.reporter
    ? `${incident.reporter.first_name} ${incident.reporter.last_name}`.trim()
    : incident.reported_by;

  return (
    <PageContainer
      title={`Incident ${incident.reference_number}`}
      description="View and manage this incident."
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/incident-queue">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Queue
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card
              className={`border-l-4 ${severityColors[incident.severity] || "border-l-border"} p-6`}
            >
              <div className="mb-4 flex items-center gap-2">
                <Badge
                  variant={
                    incident.severity === "critical"
                      ? "error"
                      : incident.severity === "high"
                        ? "error"
                        : incident.severity === "medium"
                          ? "warning"
                          : "default"
                  }
                >
                  {incident.severity}
                </Badge>
                <Badge variant="default">{incident.type.replace(/_/g, " ")}</Badge>
                <Badge
                  variant={
                    incident.status === "pending_hr_review" ? "warning" : "success"
                  }
                >
                  {incident.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                Description
              </h3>
              <p className="text-text-secondary">{incident.description}</p>

              <div className="mt-6 flex gap-3">
                {incident.status === "pending_hr_review" && (
                  <Button asChild>
                    <Link href={`/incident-queue/${incident.id}/review`}>
                      <Shield className="mr-2 h-4 w-4" />
                      Review & Approve
                    </Link>
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-text-primary">AI Analysis</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text-tertiary">Confidence Score</span>
                    <span className="font-medium text-text-primary">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-slate-light">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Employee:</span>
                  <span className="text-text-primary">{employeeName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Reported by:</span>
                  <span className="text-text-primary">{reporterName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Incident date:</span>
                  <span className="text-text-primary">{incident.incident_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Created:</span>
                  <span className="text-text-primary">
                    {new Date(incident.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
