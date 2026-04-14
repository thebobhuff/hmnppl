"use client";

/**
 * AI Document Review - Clean two-column layout for HR Agents.
 *
 * LEFT: AI-generated document (formatted, editable)
 * RIGHT: Employee profile + AI analysis sidebar
 * Bottom: Sticky action bar (Approve / Reject)
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { incidentsAPI, type APIError } from "@/lib/api/client";
import {
  AlertTriangle,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Loader2,
  TrendingUp,
  User,
  XCircle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface EvaluationData {
  incident: {
    id: string;
    reference_number: string;
    type: string;
    severity: string;
    description: string;
    incident_date: string;
    status: string;
    ai_confidence_score: number | null;
    ai_evaluation_status: string | null;
    escalation_level: number | null;
    previous_incident_count: number;
    union_involved: boolean;
    created_at: string;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string | null;
    hire_date: string | null;
    department_id: string | null;
  } | null;
  reporter: { id: string; first_name: string; last_name: string; email: string } | null;
  previousIncidents: Array<{
    id: string;
    type: string;
    severity: string;
    created_at: string;
    status: string;
    description: string;
  }>;
  disciplinaryAction: {
    id: string;
    action_type: string;
    status: string;
  } | null;
  generatedDocument: string | null;
  aiRecommendation: Record<string, unknown> | null;
  matchedPolicy: Record<string, unknown> | null;
  riskFactors: string[];
  coachingTopics: string[];
  trainingGaps: string[];
}

export default function DocumentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<"view" | "edit">("view");
  const [documentContent, setDocumentContent] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNextStep, setRejectNextStep] = useState<"regenerate" | "escalate_legal" | "close">("regenerate");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Incident Queue", href: "/incident-queue" },
    { label: data ? `Review ${data.incident.reference_number}` : "Reviewing..." },
  ]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/v1/incidents/${incidentId}/evaluation`);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const json = await res.json();
        if (active) {
          setData(json);
          if (json.generatedDocument) setDocumentContent(json.generatedDocument);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load evaluation");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [incidentId]);

  useEffect(() => {
    if (!data || data.incident.status !== "ai_evaluating") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/incidents/${incidentId}/evaluation`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.generatedDocument) setDocumentContent(json.generatedDocument);
          if (json.incident.status !== "ai_evaluating") clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [data?.incident.status, incidentId]);

  const handleApproveConfirm = async () => {
    setSubmitting(true);
    try {
      await incidentsAPI.updateStatus(incidentId, { status: "approved" });
      setApproveModalOpen(false);
      router.push("/incident-queue");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.length < 20) return;
    setSubmitting(true);
    try {
      await incidentsAPI.updateStatus(incidentId, { status: "rejected", reason: rejectReason });
      setRejectModalOpen(false);
      router.push("/incident-queue");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading Review...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer title="Error">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-brand-error" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">Failed to Load</h2>
          <p className="mt-2 text-sm text-text-secondary">{error ?? "Unknown error"}</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/incident-queue")}>
            Back to Queue
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (data.incident.status === "ai_evaluating") {
    return (
      <PageContainer title={`Evaluating: ${data.incident.reference_number}`} description="AI is analyzing this incident...">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <Brain className="mx-auto h-12 w-12 animate-pulse text-brand-primary" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">AI Evaluation In Progress</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Running risk classification, policy matching, escalation routing, and document generation.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-tertiary">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Auto-refreshing every 5 seconds...
          </div>
        </Card>
      </PageContainer>
    );
  }

  const { incident, employee, previousIncidents } = data;
  const confidence = incident.ai_confidence_score ?? 0;
  const recommendation = data.aiRecommendation ?? {};
  const escalationLevel = incident.escalation_level ?? 1;

  const confidenceColor = confidence >= 0.85 ? "text-green-400" : confidence >= 0.7 ? "text-amber-400" : "text-red-400";
  const confidenceBg = confidence >= 0.85 ? "bg-green-500/20" : confidence >= 0.7 ? "bg-amber-500/20" : "bg-red-500/20";
  const confidenceLabel = confidence >= 0.85 ? "High confidence" : confidence >= 0.7 ? "Moderate - review recommended" : "Low - manual review required";
  const severityColor: Record<string, string> = { critical: "text-red-400", high: "text-orange-400", medium: "text-amber-400", low: "text-blue-400" };

  return (
    <PageContainer
      title={`Review: ${incident.reference_number}`}
      description={`${employee ? employee.first_name + " " + employee.last_name : "Unknown"} - ${incident.type}`}
    >
      {/* Summary Banner */}
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-brand-slate-dark to-brand-dark-slate p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={"flex h-10 w-10 items-center justify-center rounded-full " + confidenceBg}>
              <Brain className={"h-5 w-5 " + confidenceColor} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">AI Assessment</p>
              <p className="text-xs text-text-tertiary">{confidenceLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={"text-3xl font-bold " + confidenceColor}>{Math.round(confidence * 100)}%</p>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-brand-slate-light">
                <div
                  className={"h-full rounded-full transition-all " + confidenceColor.replace("text-", "bg-")}
                  style={{ width: confidence * 100 + "%" }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Badge variant="outline">Level {escalationLevel}</Badge>
              <Badge className={severityColor[incident.severity] ?? "text-text-secondary"} variant="outline">
                {incident.severity.toUpperCase()}
              </Badge>
              {incident.union_involved && <Badge variant="warning">Union</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Document + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT: Document */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FileText className="h-4 w-4" />
              Generated Document
            </h3>
            <Button
              variant={reviewMode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setReviewMode(reviewMode === "view" ? "edit" : "view")}
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              {reviewMode === "view" ? "Edit" : "Done"}
            </Button>
          </div>
          {documentContent ? (
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border bg-brand-slate-dark p-5">
              {reviewMode === "edit" ? (
                <Textarea
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              ) : (
                <div className="space-y-1 text-sm leading-relaxed text-text-secondary">
                  {documentContent.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("Subject:") || trimmed.startsWith("RE:") || trimmed.startsWith("MEMORANDUM") || trimmed.startsWith("NOTICE")) {
                      return <p key={i} className="pt-2 text-base font-bold text-text-primary">{trimmed}</p>;
                    }
                    if (trimmed.startsWith("---") || trimmed.startsWith("===") || trimmed.startsWith("***")) {
                      return <hr key={i} className="my-4 border-border" />;
                    }
                    if (trimmed === "") return <div key={i} className="h-3" />;
                    if (trimmed.startsWith("Date:") || trimmed.startsWith("To:") || trimmed.startsWith("From:") || trimmed.startsWith("CC:")) {
                      return <p key={i} className="font-medium text-text-primary">{trimmed}</p>;
                    }
                    return <p key={i}>{trimmed}</p>;
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <Sparkles className="mx-auto h-8 w-8 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-tertiary">No document generated</p>
              </div>
            </div>
          )}
        </Card>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4">
          {/* Employee Profile */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <User className="h-4 w-4" />
              Employee Profile
            </h3>
            {employee && (
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium text-text-primary">
                  {employee.first_name} {employee.last_name}
                </p>
                <p className="text-xs text-text-tertiary">{employee.job_title ?? "No title on file"}</p>
                {employee.hire_date && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-text-tertiary">
                    <Calendar className="h-3 w-3" />
                    Hired {new Date(employee.hire_date).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                  <TrendingUp className="h-3 w-3" />
                  {incident.previous_incident_count} prior incident{incident.previous_incident_count !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {/* Incident Timeline */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Incident Timeline</p>
              <div className="rounded-lg border-l-2 border-l-brand-primary bg-brand-primary/5 p-2.5">
                <p className="text-xs text-text-tertiary">{new Date(incident.created_at).toLocaleDateString()}</p>
                <p className="text-xs font-medium text-text-primary">{incident.type} - {incident.severity}</p>
                <Badge variant="warning" className="mt-1 text-[10px]">Current</Badge>
              </div>
              {previousIncidents.map((prev) => (
                <div key={prev.id} className="rounded-lg border border-border p-2.5">
                  <p className="text-xs text-text-tertiary">{new Date(prev.created_at).toLocaleDateString()}</p>
                  <p className="text-xs font-medium text-text-primary">{prev.type} - {prev.severity}</p>
                  <Badge
                    variant={["approved", "resolved", "closed"].includes(prev.status) ? "success" : "outline"}
                    className="mt-1 text-[10px]"
                  >
                    {prev.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
              {previousIncidents.length === 0 && (
                <p className="py-2 text-center text-xs text-text-tertiary">No prior incidents</p>
              )}
            </div>
          </Card>

          {/* AI Analysis */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Brain className="h-4 w-4" />
              AI Analysis
            </h3>
            <div className="space-y-3">
              {/* Matched Policy */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-text-tertiary">Matched Policy</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {(recommendation.matched_policy as string) ?? "No policy matched"}
                </p>
                {(recommendation.matched_rule as string) && (
                  <p className="mt-0.5 text-xs text-text-secondary">{recommendation.matched_rule as string}</p>
                )}
              </div>

              {/* Escalation Ladder */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-text-tertiary">Recommended Action</p>
                <div className="mt-2 space-y-1.5">
                  {[
                    { level: 1, action: "Verbal Warning" },
                    { level: 2, action: "Written Warning" },
                    { level: 3, action: "Performance Improvement Plan" },
                    { level: 4, action: "Termination Review" },
                  ].map((step) => (
                    <div key={step.level} className="flex items-center gap-2">
                      <div className={
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                        (step.level < escalationLevel ? "bg-green-500/20 text-green-400" :
                         step.level === escalationLevel ? "bg-brand-primary/20 text-brand-primary" :
                         "bg-surface-secondary text-text-tertiary")
                      }>
                        {step.level}
                      </div>
                      <span className={
                        "text-xs " +
                        (step.level < escalationLevel ? "text-green-400 line-through" :
                         step.level === escalationLevel ? "font-semibold text-brand-primary" :
                         "text-text-tertiary")
                      }>
                        {step.action}
                      </span>
                      {step.level === escalationLevel && (
                        <ChevronRight className="h-3 w-3 text-brand-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {data.riskFactors.length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Risk Factors
                  </p>
                  <ul className="mt-2 space-y-1">
                    {data.riskFactors.map((factor, i) => (
                      <li key={i} className="text-xs text-text-secondary">- {factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coaching */}
              {data.coachingTopics.length > 0 && (
                <div className="rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Coaching Recommended
                  </p>
                  <ul className="mt-2 space-y-1">
                    {data.coachingTopics.map((topic, i) => (
                      <li key={i} className="text-xs text-text-secondary">- {topic}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Training Gaps */}
              {data.trainingGaps.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <TrendingUp className="h-3.5 w-3.5" /> Training Gaps
                  </p>
                  <ul className="mt-2 space-y-1">
                    {data.trainingGaps.map((gap, i) => (
                      <li key={i} className="text-xs text-text-secondary">- {gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Reasoning */}
              {recommendation.reasoning && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold text-text-tertiary">AI Reasoning</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{recommendation.reasoning as string}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-brand-slate-dark/95 backdrop-blur-sm lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="text-xs text-text-tertiary">
            {reviewMode === "edit"
              ? "Editing mode - changes saved to document"
              : "Reviewing AI-generated document"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(true)}>
              <XCircle className="mr-1.5 h-4 w-4" /> Reject
            </Button>
            <Button onClick={() => setApproveModalOpen(true)}>
              <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Reject Document</h3>
          <p className="text-sm text-text-secondary">Provide a reason and choose the next step.</p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this document is being rejected..."
            className="min-h-[80px]"
            maxLength={1000}
          />
          <p className={"text-xs " + (rejectReason.length < 20 && rejectReason.length > 0 ? "text-brand-error" : "text-text-tertiary")}>
            {rejectReason.length}/1000 (min 20)
          </p>
          <div className="space-y-2">
            {([
              { value: "regenerate" as const, label: "Regenerate with Feedback", desc: "AI will try again with your notes" },
              { value: "escalate_legal" as const, label: "Escalate to Legal", desc: "Flag for legal team review" },
              { value: "close" as const, label: "Close Without Action", desc: "Dismiss this incident" },
            ]).map((opt) => (
              <label key={opt.value} className={"flex cursor-pointer items-start gap-3 rounded-lg border p-3 " + (
                rejectNextStep === opt.value ? "border-brand-primary bg-brand-primary/5" : "border-border hover:bg-card-hover"
              )}>
                <input type="radio" checked={rejectNextStep === opt.value} onChange={() => setRejectNextStep(opt.value)} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  <p className="text-xs text-text-tertiary">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReject} disabled={rejectReason.length < 20 || submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Approve Document</h3>
          <p className="text-sm text-text-secondary">
            This will approve the disciplinary document and prompt meeting scheduling.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleApproveConfirm} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
              Approve & Schedule Meeting
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}