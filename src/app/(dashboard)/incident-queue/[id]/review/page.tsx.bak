"use client";

/**
 * AI Document Review — Three-Panel Layout for HR Agents.
 *
 * LEFT: AI-generated document (editable, track changes)
 * CENTER: Employee history timeline + profile
 * RIGHT: AI reasoning (confidence breakdown, matched rule, alternatives)
 * Bottom: Sticky action bar (Approve / Reject)
 *
 * Now uses REAL AI data from the pipeline.
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

// ---------------------------------------------------------------------------
// Types for real AI evaluation data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
    { label: data ? `Review ${data.incident.reference_number}` : "Reviewing..."},
  ]);

  // Fetch real evaluation data
  useEffect(() => {
    let active = true;
    async function fetch() {
      try {
        const res = await fetch(`/api/v1/incidents/${incidentId}/evaluation`);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const json = await res.json();
        if (active) {
          setData(json);
          if (json.generatedDocument) {
            setDocumentContent(json.generatedDocument);
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load evaluation");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetch();
    return () => { active = false; };
  }, [incidentId]);

  // Auto-refresh if AI is still evaluating
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
      await incidentsAPI.updateStatus(incidentId, {
        status: "rejected",
        reason: rejectReason,
      });
      setRejectModalOpen(false);
      router.push("/incident-queue");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer title="Loading Review...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      </PageContainer>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
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

  // ── Still evaluating ───────────────────────────────────────────────────
  if (data.incident.status === "ai_evaluating") {
    return (
      <PageContainer
        title={`Evaluating: ${data.incident.reference_number}`}
        description="AI is analyzing this incident..."
      >
        <Card className="mx-auto max-w-lg p-8 text-center">
          <Brain className="mx-auto h-12 w-12 animate-pulse text-brand-primary" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">AI Evaluation In Progress</h2>
          <p className="mt-2 text-sm text-text-secondary">
            The AI pipeline is running risk classification, policy matching, escalation routing, and document generation.
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

  return (
    <PageContainer
      title={`Review: ${incident.reference_number}`}
      description={`${employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"} \u2014 ${incident.type}`}
    >
      {/* Confidence Banner */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-brand-slate-dark p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand-primary" />
          <span className="text-sm font-medium text-text-primary">AI Confidence</span>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-slate-light">
            <div
              className={`h-full rounded-full transition-all ${
                confidence >= 0.85 ? "bg-brand-success" : confidence >= 0.7 ? "bg-brand-warning" : "bg-brand-error"
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
        <span className={`text-lg font-bold ${
          confidence >= 0.85 ? "text-brand-success" : confidence >= 0.7 ? "text-brand-warning" : "text-brand-error"
        }`}>
          {Math.round(confidence * 100)}%
        </span>
        <Badge variant="outline">Level {escalationLevel}</Badge>
        {incident.union_involved && <Badge variant="warning">Union</Badge>}
      </div>

      {/* Three-Panel Layout */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        {/* LEFT: Document */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
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
              {reviewMode === "view" ? "Edit" : "Done Editing"}
            </Button>
          </div>
          {documentContent ? (
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border bg-brand-slate-dark p-4">
              {reviewMode === "edit" ? (
                <Textarea
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-text-secondary">
                  {documentContent}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-border">
              <div className="text-center">
                <Sparkles className="mx-auto h-8 w-8 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-tertiary">No document generated yet</p>
              </div>
            </div>
          )}
        </Card>

        {/* CENTER: Employee Timeline */}
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <User className="h-4 w-4" />
            Employee History
          </h3>

          {/* Profile */}
          {employee && (
            <div className="mb-4 rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-text-primary">
                {employee.first_name} {employee.last_name}
              </p>
              <p className="text-xs text-text-tertiary">{employee.job_title ?? "No title"}</p>
              {employee.hire_date && (
                <div className="mt-2 flex items-center gap-1 text-xs text-text-tertiary">
                  <Calendar className="h-3 w-3" /> Hired: {new Date(employee.hire_date).toLocaleDateString()}
                </div>
              )}
              <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
                <TrendingUp className="h-3 w-3" />
                {incident.previous_incident_count} prior incident{incident.previous_incident_count !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-tertiary">Incident History</p>
            {/* Current incident */}
            <div className="rounded-lg border-l-2 border-l-brand-primary bg-brand-primary/5 p-2.5">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                <span className="text-xs text-text-tertiary">{new Date(incident.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-text-primary">{incident.type} \u2014 {incident.severity}</p>
              <Badge variant="warning" className="mt-1 text-[10px]">Current</Badge>
            </div>
            {/* Previous */}
            {previousIncidents.map((prev) => (
              <div key={prev.id} className="rounded-lg border border-border p-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                  <span className="text-xs text-text-tertiary">{new Date(prev.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-text-primary">{prev.type} \u2014 {prev.severity}</p>
                <Badge
                  variant={["approved", "resolved", "closed"].includes(prev.status) ? "success" : "outline"}
                  className="mt-1 text-[10px]"
                >
                  {prev.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
            {previousIncidents.length === 0 && (
              <p className="text-xs text-text-tertiary">No prior incidents.</p>
            )}
          </div>
        </Card>

        {/* RIGHT: AI Reasoning */}
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Brain className="h-4 w-4" />
            AI Reasoning
          </h3>

          <div className="space-y-4">
            {/* Matched Policy */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-text-tertiary">Matched Policy</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                {(recommendation.matched_policy as string) ?? "No policy matched"}
              </p>
              {(recommendation.matched_rule as string) && (
                <p className="text-xs text-text-secondary">{recommendation.matched_rule as string}</p>
              )}
            </div>

            {/* Escalation Ladder */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-text-tertiary">Escalation Ladder</p>
              <div className="mt-2 space-y-1.5">
                {[
                  { level: 1, action: "Verbal Warning" },
                  { level: 2, action: "Written Warning" },
                  { level: 3, action: "PIP" },
                  { level: 4, action: "Termination Review" },
                ].map((step) => (
                  <div key={step.level} className="flex items-center gap-2">
                    <ChevronRight
                      className={`h-3 w-3 ${
                        step.level < escalationLevel ? "text-brand-success" :
                        step.level === escalationLevel ? "text-brand-primary" : "text-text-tertiary"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        step.level < escalationLevel ? "text-brand-success" :
                        step.level === escalationLevel ? "font-medium text-brand-primary" : "text-text-tertiary"
                      }`}
                    >
                      Level {step.level}: {step.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            {data.riskFactors.length > 0 && (
              <div className="rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-brand-error">
                  <AlertTriangle className="h-3.5 w-3.5" /> Risk Factors
                </p>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  {data.riskFactors.map((factor, i) => (
                    <li key={i}>\u2022 {factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coaching Topics */}
            {data.coachingTopics.length > 0 && (
              <div className="rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-brand-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Manager Coaching Needed
                </p>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  {data.coachingTopics.map((topic, i) => (
                    <li key={i}>\u2022 {topic}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Training Gaps */}
            {data.trainingGaps.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                  <TrendingUp className="h-3.5 w-3.5" /> Training Gaps Detected
                </p>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  {data.trainingGaps.map((gap, i) => (
                    <li key={i}>\u2022 {gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Reasoning */}
            {recommendation.reasoning && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-text-tertiary">AI Reasoning</p>
                <p className="mt-1 text-xs text-text-secondary">{recommendation.reasoning as string}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-brand-slate-dark/95 backdrop-blur-sm lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="text-xs text-text-tertiary">
            {reviewMode === "edit"
              ? "Editing mode \u2014 changes will be logged in audit trail"
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
          <p className={`text-xs ${rejectReason.length < 20 && rejectReason.length > 0 ? "text-brand-error" : "text-text-tertiary"}`}>
            {rejectReason.length}/1000 (min 20)
          </p>
          <div className="space-y-2">
            {([
              { value: "regenerate" as const, label: "Regenerate with Feedback", desc: "AI will regenerate with your feedback" },
              { value: "escalate_legal" as const, label: "Escalate to Legal", desc: "Flag for legal review" },
              { value: "close" as const, label: "Close Without Action", desc: "Close the incident" },
            ]).map((opt) => (
              <label key={opt.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                rejectNextStep === opt.value ? "border-brand-primary bg-brand-primary/5" : "border-border hover:bg-card-hover"
              }`}>
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
