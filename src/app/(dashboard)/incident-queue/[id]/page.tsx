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
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Shield,
  Bot,
  CheckCircle,
  Video,
  PenSquare,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { incidentsAPI, disciplinaryAPI, meetingsAPI, type IncidentDetail } from "@/lib/api/client";

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [disciplinaryAction, setDisciplinaryAction] = useState<any>(null);
  const [relatedMeeting, setRelatedMeeting] = useState<any>(null);
  const [timeline, setTimeline] = useState<Array<{ id: string; date: string; title: string; description: string; icon: React.ReactNode; color: string }>>([]);
  const [error, setError] = useState<string | null>(null);

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
        if (!active) return;

        setIncident(res.incident);

        // Fetch disciplinary action if it exists
        if (res.incident.disciplinary_action) {
          try {
            const actionRes = await disciplinaryAPI.get(res.incident.disciplinary_action.id);
            if (active) setDisciplinaryAction(actionRes.action);
          } catch { /* not critical */ }
        }

        // Fetch related meeting if disciplinary action exists
        if (res.incident.disciplinary_action) {
          try {
            const meetingsRes = await meetingsAPI.list(undefined, undefined, 50);
            if (!active) return;
            const related = meetingsRes.meetings.find(
              (m) => m.disciplinary_action_id === res.incident.disciplinary_action!.id,
            );
            if (active && related) setRelatedMeeting(related);
          } catch { /* not critical */ }
        }

        // Build timeline
        const events: Array<{ id: string; date: string; title: string; description: string; icon: React.ReactNode; color: string }> = [];

        events.push({
          id: res.incident.id,
          date: res.incident.created_at,
          title: "Incident Reported",
          description: `${res.incident.type} · ${res.incident.severity} severity`,
          icon: <AlertTriangle className="h-4 w-4" />,
          color: "text-brand-error",
        });

        if (res.incident.ai_confidence_score !== null) {
          events.push({
            id: res.incident.id + "-ai",
            date: res.incident.created_at,
            title: "AI Evaluation Complete",
            description: `${Math.round(res.incident.ai_confidence_score * 100)}% confidence · ${res.incident.ai_evaluation_status ?? "completed"}`,
            icon: <Bot className="h-4 w-4" />,
            color: "text-brand-primary",
          });
        }

        if (active) setTimeline(events);
      } catch (err) {
        if (active) setError("Failed to load incident");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadIncident();
    return () => { active = false; };
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

  if (error || !incident) {
    return (
      <PageContainer title="Incident Not Found">
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-brand-warning" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            {error || "Incident Not Found"}
          </h2>
          <p className="mt-2 text-text-secondary">
            The incident you are looking for does not exist.
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

  const statusSteps = [
    { key: "reported", label: "Reported", icon: AlertTriangle },
    { key: "ai_review", label: "AI Review", icon: Bot },
    { key: "hr_review", label: "HR Review", icon: Shield },
    { key: "meeting", label: "Meeting", icon: Video },
    { key: "document", label: "Document", icon: FileText },
    { key: "signed", label: "Signed", icon: PenSquare },
  ];

  const currentStep = (() => {
    if (incident.status === "pending_hr_review") return 2;
    if (incident.status === "ai_evaluating" || incident.status === "ai_evaluation") return 1;
    if (incident.status === "action_taken" || incident.status === "closed" || incident.status === "signed") return 5;
    if (disciplinaryAction) return 4;
    if (relatedMeeting) return 3;
    return 0;
  })();

  const employeeName = incident.employee
    ? `${incident.employee.first_name} ${incident.employee.last_name}`
    : incident.employee_id;

  return (
    <PageContainer
      title={`Incident ${incident.reference_number || id.slice(0, 8)}`}
      description={employeeName ? `Employee: ${employeeName}` : "View and manage this incident"}
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

        {/* Lifecycle Progress */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Lifecycle Progress</h3>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-brand-success bg-brand-success/10 text-brand-success"
                          : active
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                            : "border-border text-text-tertiary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`mt-1.5 text-xs ${
                        active ? "font-medium text-text-primary" : "text-text-tertiary"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 w-8 ${
                        i < currentStep ? "bg-brand-success" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Incident Card */}
            <Card
              className={`border-l-4 ${severityColors[incident.severity] || "border-l-border"} p-6`}
            >
              <div className="mb-4 flex items-center gap-2">
                <Badge
                  variant={
                    incident.severity === "critical" || incident.severity === "high"
                      ? "error"
                      : incident.severity === "medium"
                        ? "warning"
                        : "outline"
                  }
                >
                  {incident.severity}
                </Badge>
                <Badge variant="outline">{String(incident.type || "incident").replace(/_/g, " ")}</Badge>
                <Badge variant={incident.status === "pending_hr_review" ? "warning" : "success"}>
                  {String(incident.status || "").replace(/_/g, " ")}
                </Badge>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-text-primary">Description</h3>
              <p className="text-text-secondary">{incident.description || "No description provided."}</p>

              <div className="mt-6 flex gap-3">
                {incident.status === "pending_hr_review" && (
                  <Button asChild>
                    <Link href={`/incident-queue/${incident.id}/review`}>
                      <Shield className="mr-2 h-4 w-4" />
                      Review & Approve
                    </Link>
                  </Button>
                )}
                {incident.status === "resolved" && !relatedMeeting && (
                  <Button asChild variant="outline">
                    <Link href="/meetings">
                      <Video className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Link>
                  </Button>
                )}
              </div>
            </Card>

            {/* AI Analysis Card */}
            {incident.ai_confidence_score !== null && (
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-text-primary">AI Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-text-tertiary">Confidence Score</span>
                      <span className="font-medium text-text-primary">
                        {Math.round((incident.ai_confidence_score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-brand-slate-light">
                      <div
                        className={`h-full rounded-full ${
                          (incident.ai_confidence_score || 0) >= 0.85
                            ? "bg-brand-success"
                            : (incident.ai_confidence_score || 0) >= 0.6
                              ? "bg-brand-warning"
                              : "bg-brand-error"
                        }`}
                        style={{ width: `${(incident.ai_confidence_score || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  {incident.ai_evaluation_status && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{incident.ai_evaluation_status}</Badge>
                      <span className="text-text-tertiary">AI evaluation status</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Timeline Card */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-text-primary">Activity Timeline</h3>
              <div className="relative space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-slate-light ${event.color}`}>
                      {event.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{event.title}</p>
                      <p className="text-xs text-text-tertiary">{event.description}</p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {new Date(event.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {disciplinaryAction && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-slate-light text-brand-success">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">Disciplinary Action Created</p>
                      <p className="text-xs text-text-tertiary">
                        {disciplinaryAction.action_type?.replace(/_/g, " ")} · {disciplinaryAction.status?.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {new Date(disciplinaryAction.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {relatedMeeting && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-slate-light text-brand-primary">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">Meeting Scheduled</p>
                      <p className="text-xs text-text-tertiary">
                        {relatedMeeting.type} · {relatedMeeting.status}
                      </p>
                      {relatedMeeting.scheduled_at && (
                        <p className="mt-0.5 text-xs text-text-tertiary">
                          {new Date(relatedMeeting.scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Employee Info */}
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Employee</h3>
              <div className="space-y-2">
                {incident.employee ? (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-text-tertiary" />
                      <span className="text-sm font-medium text-text-primary">
                        {incident.employee.first_name} {incident.employee.last_name}
                      </span>
                    </div>
                    {incident.employee.job_title && (
                      <p className="text-xs text-text-tertiary">{incident.employee.job_title}</p>
                    )}
                    {incident.employee.email && (
                      <p className="text-xs text-text-tertiary">{incident.employee.email}</p>
                    )}
                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                      <Link href={`/employees/${incident.employee.id}`}>
                        View Profile
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-text-tertiary">Employee ID: {incident.employee_id}</p>
                )}
              </div>
            </Card>

            {/* Incident Details */}
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Details</h3>
              <div className="space-y-3 text-sm">
                {incident.incident_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-tertiary">Incident date:</span>
                    <span className="text-text-primary">{new Date(incident.incident_date).toLocaleDateString()}</span>
                  </div>
                )}
                {incident.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-tertiary">Created:</span>
                    <span className="text-text-primary">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {incident.reporter && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-tertiary">Reported by:</span>
                    <span className="text-text-primary">
                      {incident.reporter.first_name} {incident.reporter.last_name}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Disciplinary Action Status */}
            {disciplinaryAction && (
              <Card className="p-4">
                <h3 className="mb-3 font-medium text-text-primary">Disciplinary Action</h3>
                <div className="space-y-2">
                  <Badge variant={disciplinaryAction.status === "pending_signature" ? "warning" : "success"}>
                    {disciplinaryAction.action_type?.replace(/_/g, " ")}
                  </Badge>
                  <p className="text-xs text-text-tertiary">Status: {disciplinaryAction.status?.replace(/_/g, " ")}</p>
                  <Button asChild variant="outline" size="sm" className="mt-1 w-full">
                    <Link href={`/documents/${disciplinaryAction.id}`}>
                      View Document
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Meeting Status */}
            {relatedMeeting && (
              <Card className="p-4">
                <h3 className="mb-3 font-medium text-text-primary">Related Meeting</h3>
                <div className="space-y-2">
                  <Badge variant={relatedMeeting.status === "scheduled" ? "warning" : "success"}>
                    {relatedMeeting.type}
                  </Badge>
                  {relatedMeeting.scheduled_at && (
                    <p className="text-xs text-text-tertiary">
                      {new Date(relatedMeeting.scheduled_at).toLocaleString()}
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-1 w-full">
                    <Link href={`/meetings/${relatedMeeting.id}`}>
                      View Meeting
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
