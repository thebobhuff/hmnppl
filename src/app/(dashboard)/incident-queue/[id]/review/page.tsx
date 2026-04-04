/**
 * AI Document Review — Three-Panel Layout for HR Agents.
 *
 * LEFT: AI-generated document (editable, track changes)
 * CENTER: Employee history timeline + profile
 * RIGHT: AI reasoning (confidence breakdown, matched rule, alternatives)
 * Bottom: Sticky action bar (Approve / Approve with Edits / Reject)
 */
"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CheckCircle,
  XCircle,
  Edit3,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Brain,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INCIDENT = {
  id: "1",
  reference: "INC-2026-0042",
  employee: {
    name: "John Smith",
    email: "john@acme.com",
    title: "Software Engineer",
    department: "Engineering",
    hireDate: "2023-06-15",
  },
  type: "Tardiness",
  severity: "medium",
  description:
    "Employee arrived 45 minutes late without prior notice. Third occurrence this month.",
  incidentDate: "2026-03-15",
  reportedBy: "David Park",
  aiConfidence: 0.92,
  matchedPolicy: "Attendance & Punctuality Policy",
  matchedRule: "Repeated Tardiness — Level 2",
  escalationLevel: 2,
  previousIncidents: 2,
};

const MOCK_DOCUMENT = `# Written Warning — Attendance Policy Violation

**Employee:** John Smith  
**Position:** Software Engineer  
**Department:** Engineering  
**Date:** March 15, 2026  
**Reference:** INC-2026-0042

---

## Incident Summary

On March 15, 2026, the above-named employee arrived 45 minutes late to work without providing prior notice to their supervisor. This marks the third documented occurrence of tardiness within the current calendar month.

## Policy Violation

This incident constitutes a violation of the **Attendance & Punctuality Policy**, Section 3.2: "Repeated Tardiness." The policy states that three or more unexcused late arrivals within a 30-day period warrant a written warning.

## Previous Incidents

1. **INC-2026-0028** (Feb 12, 2026) — 20 minutes late, verbal warning issued
2. **INC-2026-0035** (Mar 1, 2026) — 30 minutes late, verbal warning issued

## Required Actions

1. Employee must arrive on time for all scheduled shifts for the next 60 days
2. Employee must notify supervisor at least 1 hour before scheduled start time if unable to arrive on time
3. Employee must attend the scheduled meeting with HR representative

## Consequences of Non-Compliance

Failure to comply with the above requirements may result in further disciplinary action, up to and including a Performance Improvement Plan (PIP) or termination of employment.

---

**Employee Acknowledgment:** I acknowledge receipt of this written warning.

**HR Representative:** Maria Garcia  
**Date:** ___________`;

const MOCK_TIMELINE = [
  {
    id: "1",
    date: "2026-03-15",
    type: "incident",
    title: "Tardiness — 45 min late",
    severity: "medium" as const,
    status: "pending_hr_review",
  },
  {
    id: "2",
    date: "2026-03-01",
    type: "incident",
    title: "Tardiness — 30 min late",
    severity: "low" as const,
    status: "approved",
  },
  {
    id: "3",
    date: "2026-02-12",
    type: "incident",
    title: "Tardiness — 20 min late",
    severity: "low" as const,
    status: "approved",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = params as unknown as { id: string };
  const [reviewMode, setReviewMode] = useState<"view" | "edit">("view");
  const [documentContent, setDocumentContent] = useState(MOCK_DOCUMENT);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNextStep, setRejectNextStep] = useState<
    "regenerate" | "escalate_legal" | "close"
  >("regenerate");
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Incident Queue", href: "/incident-queue" },
    { label: `Review ${MOCK_INCIDENT.reference}` },
  ]);

  const handleApprove = () => {
    setApproveModalOpen(true);
  };

  const handleApproveConfirm = () => {
    // TODO: Call API to approve
    setApproveModalOpen(false);
  };

  const handleReject = () => {
    if (rejectReason.length < 20) return;
    // TODO: Call API to reject
    setRejectModalOpen(false);
  };

  return (
    <PageContainer
      title={`Review: ${MOCK_INCIDENT.reference}`}
      description={`${MOCK_INCIDENT.employee.name} — ${MOCK_INCIDENT.type}`}
    >
      {/* Confidence Banner */}
      <div className="bg-brand-slate-dark mb-4 flex items-center gap-4 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand-primary" />
          <span className="text-sm font-medium text-text-primary">AI Confidence</span>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-slate-light">
            <div
              className="h-full rounded-full bg-brand-success transition-all"
              style={{ width: `${MOCK_INCIDENT.aiConfidence * 100}%` }}
            />
          </div>
        </div>
        <span className="text-lg font-bold text-brand-success">
          {Math.round(MOCK_INCIDENT.aiConfidence * 100)}%
        </span>
        <Badge variant="warning">Level {MOCK_INCIDENT.escalationLevel}</Badge>
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
          <div className="bg-brand-slate-dark max-h-[600px] overflow-y-auto rounded-lg border border-border p-4">
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
        </Card>

        {/* CENTER: Employee Timeline */}
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <User className="h-4 w-4" />
            Employee History
          </h3>

          {/* Profile */}
          <div className="mb-4 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-text-primary">
              {MOCK_INCIDENT.employee.name}
            </p>
            <p className="text-xs text-text-tertiary">{MOCK_INCIDENT.employee.title}</p>
            <p className="text-xs text-text-tertiary">
              {MOCK_INCIDENT.employee.department}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-text-tertiary">
              <Calendar className="h-3 w-3" />
              Hired: {MOCK_INCIDENT.employee.hireDate}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
              <TrendingUp className="h-3 w-3" />
              {MOCK_INCIDENT.previousIncidents} prior incidents
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-tertiary">Incident History</p>
            {MOCK_TIMELINE.map((item, i) => (
              <div
                key={item.id}
                className={`relative rounded-lg border border-border p-2.5 ${
                  i === 0 ? "border-l-2 border-l-brand-primary bg-brand-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                  <span className="text-xs text-text-tertiary">{item.date}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-text-primary">{item.title}</p>
                <Badge
                  variant={item.status === "approved" ? "success" : "warning"}
                  className="mt-1 text-[10px]"
                >
                  {item.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT: AI Reasoning */}
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Brain className="h-4 w-4" />
            AI Reasoning
          </h3>

          <div className="space-y-4">
            {/* Matched Rule */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-text-tertiary">Matched Policy</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                {MOCK_INCIDENT.matchedPolicy}
              </p>
              <p className="text-xs text-text-secondary">{MOCK_INCIDENT.matchedRule}</p>
            </div>

            {/* Confidence Breakdown */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-text-tertiary">
                Confidence Breakdown
              </p>
              <div className="mt-2 space-y-2">
                <ConfidenceBar label="Policy Match" value={0.96} />
                <ConfidenceBar label="Severity Assessment" value={0.88} />
                <ConfidenceBar label="Escalation Level" value={0.95} />
                <ConfidenceBar label="Document Quality" value={0.9} />
              </div>
            </div>

            {/* Escalation Ladder */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-text-tertiary">Escalation Ladder</p>
              <div className="mt-2 space-y-1.5">
                {[
                  { level: 1, action: "Verbal Warning", status: "completed" as const },
                  { level: 2, action: "Written Warning", status: "current" as const },
                  { level: 3, action: "PIP", status: "pending" as const },
                  { level: 4, action: "Termination Review", status: "pending" as const },
                ].map((step) => (
                  <div key={step.level} className="flex items-center gap-2">
                    <ChevronRight
                      className={`h-3 w-3 ${
                        step.status === "completed"
                          ? "text-brand-success"
                          : step.status === "current"
                            ? "text-brand-primary"
                            : "text-text-tertiary"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        step.status === "completed"
                          ? "text-brand-success"
                          : step.status === "current"
                            ? "font-medium text-brand-primary"
                            : "text-text-tertiary"
                      }`}
                    >
                      Level {step.level}: {step.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-brand-error">
                <AlertTriangle className="h-3.5 w-3.5" />
                Risk Factors
              </p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                <li>• Third occurrence in 30 days</li>
                <li>• Pattern of increasing lateness</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky Action Bar */}
      <div className="bg-brand-slate-dark/95 fixed bottom-0 left-0 right-0 border-t border-border backdrop-blur-sm lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="text-xs text-text-tertiary">
            {reviewMode === "edit"
              ? "Editing mode — changes will be logged in audit trail"
              : "Reviewing document"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(true)}>
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
            <Button variant="default" onClick={handleApprove}>
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Reject Document</h3>
          <p className="text-sm text-text-secondary">
            Provide a reason for rejection and choose the next step.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary">
                Reason <span className="text-brand-error">*</span>
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this document is being rejected..."
                className="mt-2 min-h-[80px]"
                maxLength={1000}
              />
              <p
                className={`mt-1 text-xs ${rejectReason.length < 20 && rejectReason.length > 0 ? "text-brand-error" : "text-text-tertiary"}`}
              >
                {rejectReason.length}/1000 (minimum 20 characters)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">
                Next Step
              </label>
              <div className="mt-2 space-y-2">
                {[
                  {
                    value: "regenerate" as const,
                    label: "Regenerate with Feedback",
                    desc: "AI will regenerate the document with your feedback",
                  },
                  {
                    value: "escalate_legal" as const,
                    label: "Escalate to Legal",
                    desc: "Flag for legal review (Legal Hold)",
                  },
                  {
                    value: "close" as const,
                    label: "Close Without Action",
                    desc: "Close the incident and notify the manager",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      rejectNextStep === option.value
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectNextStep"
                      checked={rejectNextStep === option.value}
                      onChange={() => setRejectNextStep(option.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {option.label}
                      </p>
                      <p className="text-xs text-text-tertiary">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleReject}
                disabled={rejectReason.length < 20}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Approve Document</h3>
          <p className="text-sm text-text-secondary">
            This will approve the disciplinary document and prompt meeting scheduling.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to approve this document? Once approved, the system
              will prompt you to schedule a meeting with the employee.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApproveConfirm}>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Approve & Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Approve Document</h3>
          <p className="text-sm text-text-secondary">
            This will approve the disciplinary document and prompt meeting scheduling.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to approve this document? Once approved, the system
              will prompt you to schedule a meeting with the employee.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApproveConfirm}>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Approve & Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Confidence Bar
// ---------------------------------------------------------------------------

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text-tertiary">{label}</span>
        <span
          className={
            value >= 0.85
              ? "text-brand-success"
              : value >= 0.7
                ? "text-brand-warning"
                : "text-brand-error"
          }
        >
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-slate-light">
        <div
          className={`h-full rounded-full transition-all ${
            value >= 0.85
              ? "bg-brand-success"
              : value >= 0.7
                ? "bg-brand-warning"
                : "bg-brand-error"
          }`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
