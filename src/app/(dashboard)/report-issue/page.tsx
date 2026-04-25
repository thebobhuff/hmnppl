/**
 * Report Issue Form — 4-Step Multi-Step Wizard for Managers.
 *
 * Step 1: Select Employee + Issue Type
 * Step 2: Incident Details (date, severity, description)
 * Step 3: Evidence & Context (file upload, witnesses, union toggle)
 * Step 4: Review & Submit
 *
 * Auto-saves to localStorage every 30s.
 */
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { FormStepIndicator } from "@/components/domain/FormStepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthStore } from "@/stores/auth-store";
import { incidentsAPI, type APIError } from "@/lib/api/client";
import { APIErrorFallback } from "@/components/domain/ErrorBoundary";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  UserPlus,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportFormData {
  employeeId: string;
  issueType: string;
  incidentDate: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: File[];
  witnessIds: string[];
  unionInvolved: boolean;
}

const STORAGE_KEY = "report-issue-draft";

const ISSUE_TYPES = [
  {
    id: "tardiness",
    label: "Tardiness",
    icon: Clock,
    description: "Late arrival, early departure",
  },
  {
    id: "absence",
    label: "Absence",
    icon: Calendar,
    description: "Unexcused absence, no-call/no-show",
  },
  {
    id: "insubordination",
    label: "Insubordination",
    icon: AlertTriangle,
    description: "Refusal to follow instructions",
  },
  {
    id: "performance",
    label: "Performance",
    icon: FileText,
    description: "Poor work quality, missed deadlines",
  },
  {
    id: "misconduct",
    label: "Misconduct",
    icon: Users,
    description: "Inappropriate behavior, harassment",
  },
  {
    id: "violation_of_policy",
    label: "Policy Violation",
    icon: AlertTriangle,
    description: "Breach of company policy",
  },
  {
    id: "safety_violation",
    label: "Safety",
    icon: AlertTriangle,
    description: "Workplace safety risk",
  },
  {
    id: "violence",
    label: "Violence",
    icon: AlertTriangle,
    description: "Threats or physical harm",
  },
  {
    id: "harassment",
    label: "Harassment",
    icon: AlertTriangle,
    description: "Harassment or protected-class concern",
  },
  {
    id: "financial_impropriety",
    label: "Financial",
    icon: AlertTriangle,
    description: "Fraud, theft, embezzlement",
  },
  {
    id: "protected_class_concern",
    label: "Protected Class",
    icon: AlertTriangle,
    description: "Potential protected-class issue",
  },
  {
    id: "theft",
    label: "Theft",
    icon: AlertTriangle,
    description: "Theft or unauthorized use of property",
  },
  { id: "other", label: "Other", icon: FileText, description: "Other incident type" },
];

const SEVERITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    description: "Minor issue, first occurrence",
    color: "text-brand-primary",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Repeated behavior or moderate impact",
    color: "text-brand-warning",
  },
  {
    value: "high",
    label: "High",
    description: "Serious violation, significant impact",
    color: "text-brand-error",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Immediate action required, legal/safety risk",
    color: "text-brand-error-dim",
  },
];

interface DirectReport {
  id: string;
  name: string;
  email: string;
}

interface EvidenceAttachmentPayload {
  name: string;
  url: string;
  size_bytes: number;
  content_type?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportIssuePage() {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<APIError | null>(null);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [formData, setFormData] = useState<ReportFormData>({
    employeeId: "",
    issueType: "",
    incidentDate: new Date().toISOString().split("T")[0],
    severity: "low",
    description: "",
    evidence: [],
    witnessIds: [],
    unionInvolved: false,
  });

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Report Issue" },
  ]);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // Ignore storage errors
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData]);

  // Fetch direct reports
  useEffect(() => {
    incidentsAPI
      .getDirectReports()
      .then((res) => {
        setDirectReports(
          res.directReports.map((r) => ({
            id: r.id,
            name: `${r.first_name} ${r.last_name}`,
            email: r.email,
          })),
        );
      })
      .catch((err) =>
        console.error("[report-issue] Failed to fetch direct reports:", err),
      )
      .finally(() => setLoadingReports(false));
  }, []);

  const updateField = useCallback(
    <K extends keyof ReportFormData>(field: K, value: ReportFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return formData.employeeId && formData.issueType;
      case 2:
        return (
          formData.incidentDate && formData.severity && formData.description.length >= 10
        );
      case 3:
        return true; // All optional
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, formData]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const evidenceAttachments = await uploadEvidenceFiles(
        user?.tenantId,
        formData.evidence,
      );

      const result = await incidentsAPI.create({
        employee_id: formData.employeeId,
        type: formData.issueType,
        incident_date: formData.incidentDate,
        severity: formData.severity,
        description: formData.description,
        evidence_attachments: evidenceAttachments,
        witness_ids: formData.witnessIds,
        union_involved: formData.unionInvolved,
      });
      setReferenceNumber(result.incident.reference_number);
      setSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setSubmitError(err as APIError);
    } finally {
      setSubmitting(false);
    }
  }, [formData, user?.tenantId]);

  if (submitted) {
    return (
      <PageContainer title="Issue Submitted" description="">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-brand-success" />
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Issue Reported Successfully
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your report has been submitted and is being evaluated by AI.
          </p>
          <div className="mt-4 rounded-lg bg-brand-slate-light p-3">
            <p className="text-xs text-text-tertiary">Reference Number</p>
            <p className="font-mono text-lg font-bold text-brand-primary">
              {referenceNumber}
            </p>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/my-reports">View My Reports</Link>
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Report Issue"
      description="Submit an employee incident for AI evaluation."
    >
      <div className="mx-auto max-w-3xl">
        <FormStepIndicator
          currentStep={step}
          steps={[
            { number: 1, label: "Employee & Type" },
            { number: 2, label: "Details" },
            { number: 3, label: "Evidence" },
            { number: 4, label: "Review" },
          ]}
          completedSteps={Array.from({ length: step - 1 }, (_, i) => i + 1)}
        />

        <Card className="mt-6 p-6">
          {step === 1 && (
            <Step1EmployeeAndType
              employeeId={formData.employeeId}
              issueType={formData.issueType}
              directReports={directReports}
              loadingReports={loadingReports}
              onSelectEmployee={(id) => updateField("employeeId", id)}
              onSelectIssueType={(type) => updateField("issueType", type)}
            />
          )}
          {step === 2 && (
            <Step2IncidentDetails
              incidentDate={formData.incidentDate}
              severity={formData.severity}
              description={formData.description}
              onDateChange={(date) => updateField("incidentDate", date)}
              onSeverityChange={(sev) => updateField("severity", sev)}
              onDescriptionChange={(desc) => updateField("description", desc)}
            />
          )}
          {step === 3 && (
            <Step3Evidence
              evidence={formData.evidence}
              witnessIds={formData.witnessIds}
              unionInvolved={formData.unionInvolved}
              directReports={directReports}
              onEvidenceChange={(files) => updateField("evidence", files)}
              onWitnessesChange={(ids) => updateField("witnessIds", ids)}
              onUnionToggle={(val) => updateField("unionInvolved", val)}
            />
          )}
          {step === 4 && (
            <Step4Review formData={formData} directReports={directReports} />
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canProceed}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button onClick={handleSubmit} disabled={!canProceed || submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {submitting ? "Submitting..." : "Submit Report"}
                </Button>
                {submitError && (
                  <p className="text-sm text-brand-error">{submitError.message}</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Employee & Issue Type
// ---------------------------------------------------------------------------

function Step1EmployeeAndType({
  employeeId,
  issueType,
  directReports,
  loadingReports,
  onSelectEmployee,
  onSelectIssueType,
}: {
  employeeId: string;
  issueType: string;
  directReports: DirectReport[];
  loadingReports: boolean;
  onSelectEmployee: (id: string) => void;
  onSelectIssueType: (type: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-text-primary">Select Employee</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Choose a direct report to file this issue against.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {directReports.map((emp) => (
            <button
              key={emp.id}
              onClick={() => onSelectEmployee(emp.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                employeeId === emp.id
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-border hover:bg-card-hover"
              }`}
            >
              <p className="text-sm font-medium text-text-primary">{emp.name}</p>
              <p className="text-xs text-text-tertiary">{emp.email}</p>
            </button>
          ))}
        </div>
        {directReports.length === 0 && !loadingReports && (
          <EmptyState
            title="No direct reports"
            description="You don't have any direct reports to select."
            icon={<Users className="h-8 w-8" />}
          />
        )}
        {loadingReports && (
          <div className="grid gap-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-border bg-brand-slate-light"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-primary">Issue Type</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Select the category that best describes this incident.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ISSUE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => onSelectIssueType(type.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  issueType === type.id
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-border hover:bg-card-hover"
                }`}
              >
                <Icon className="mb-2 h-5 w-5 text-text-secondary" />
                <p className="text-sm font-medium text-text-primary">{type.label}</p>
                <p className="text-xs text-text-tertiary">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Incident Details
// ---------------------------------------------------------------------------

function Step2IncidentDetails({
  incidentDate,
  severity,
  description,
  onDateChange,
  onSeverityChange,
  onDescriptionChange,
}: {
  incidentDate: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  onDateChange: (date: string) => void;
  onSeverityChange: (sev: "low" | "medium" | "high" | "critical") => void;
  onDescriptionChange: (desc: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary">
          Incident Date <span className="text-brand-error">*</span>
        </label>
        <Input
          type="date"
          value={incidentDate}
          onChange={(e) => onDateChange(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="mt-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">
          Severity <span className="text-brand-error">*</span>
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSeverityChange(opt.value as typeof severity)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                severity === opt.value
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-border hover:bg-card-hover"
              }`}
            >
              <p className={`text-sm font-semibold ${opt.color}`}>{opt.label}</p>
              <p className="text-xs text-text-tertiary">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">
          Description <span className="text-brand-error">*</span>
        </label>
        <p className="text-xs text-text-tertiary">
          Provide specific details: what happened, when, where, and who was involved. (min
          10 characters)
        </p>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the incident in detail..."
          className="mt-2 min-h-[120px]"
          maxLength={2000}
        />
        <p className="mt-1 text-right text-xs text-text-tertiary">
          {description.length}/2000
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Evidence & Context
// ---------------------------------------------------------------------------

function Step3Evidence({
  evidence,
  witnessIds,
  unionInvolved,
  directReports,
  onEvidenceChange,
  onWitnessesChange,
  onUnionToggle,
}: {
  evidence: File[];
  witnessIds: string[];
  unionInvolved: boolean;
  directReports: DirectReport[];
  onEvidenceChange: (files: File[]) => void;
  onWitnessesChange: (ids: string[]) => void;
  onUnionToggle: (val: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary">
          Evidence Attachments
        </label>
        <p className="text-xs text-text-tertiary">
          Upload screenshots, emails, or other supporting documents. Max 10MB each.
        </p>
        <div className="mt-2">
          <FileUpload
            maxSize={10 * 1024 * 1024}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            multiple
            maxFiles={5}
            onFilesChange={onEvidenceChange}
          />
          {evidence.length > 0 && (
            <p className="mt-2 text-xs text-text-tertiary">
              {evidence.length} attachment{evidence.length === 1 ? "" : "s"} ready to upload on submission.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">Witnesses</label>
        <p className="text-xs text-text-tertiary">
          Select team members who witnessed the incident.
        </p>
        <div className="mt-2">
          <MultiSelect
            options={directReports.map((emp) => ({
              value: emp.id,
              label: emp.name,
            }))}
            value={witnessIds}
            onValueChange={onWitnessesChange}
            placeholder="Select witnesses..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Union Involvement</p>
          <p className="text-xs text-text-tertiary">
            Does this incident involve a union representative or require union
            notification?
          </p>
        </div>
        <Switch checked={unionInvolved} onCheckedChange={onUnionToggle} />
      </div>
    </div>
  );
}

async function uploadEvidenceFiles(
  companyId: string | undefined,
  files: File[],
): Promise<EvidenceAttachmentPayload[]> {
  if (!files.length) {
    return [];
  }

  if (!companyId) {
    throw new Error("Company context is missing for evidence upload.");
  }

  const supabase = createClient();
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${companyId}/drafts/${Date.now()}-${crypto.randomUUID()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("evidence")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error(signedUrlError?.message || "Failed to generate access URL");
      }

      return {
        name: file.name,
        url: signedUrlData.signedUrl,
        size_bytes: file.size,
        content_type: file.type || undefined,
      };
    }),
  );

  return uploadedFiles;
}

// ---------------------------------------------------------------------------
// Step 4: Review & Submit
// ---------------------------------------------------------------------------

function Step4Review({
  formData,
  directReports,
}: {
  formData: ReportFormData;
  directReports: DirectReport[];
}) {
  const selectedEmployee = directReports.find((e) => e.id === formData.employeeId);
  const selectedIssueType = ISSUE_TYPES.find((t) => t.id === formData.issueType);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-text-primary">Employee</h4>
        <p className="mt-1 text-sm text-text-secondary">
          {selectedEmployee?.name ?? "Not selected"}
        </p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-text-primary">Issue Type</h4>
        <Badge variant="warning" className="mt-1">
          {selectedIssueType?.label ?? "Not selected"}
        </Badge>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-text-primary">Incident Details</h4>
        <div className="mt-2 space-y-1 text-sm text-text-secondary">
          <p>
            <span className="text-text-tertiary">Date:</span> {formData.incidentDate}
          </p>
          <p>
            <span className="text-text-tertiary">Severity:</span> {formData.severity}
          </p>
          <p>
            <span className="text-text-tertiary">Description:</span>
          </p>
          <p className="pl-2 text-text-secondary">{formData.description}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-text-primary">Additional Context</h4>
        <div className="mt-2 space-y-1 text-sm text-text-secondary">
          <p>
            <span className="text-text-tertiary">Witnesses:</span>{" "}
            {formData.witnessIds.length > 0
              ? `${formData.witnessIds.length} selected`
              : "None"}
          </p>
          <p>
            <span className="text-text-tertiary">Union involved:</span>{" "}
            {formData.unionInvolved ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">
            I attest this report is truthful and accurate to the best of my knowledge.
          </p>
          <p className="text-xs text-text-tertiary">
            False reports may result in disciplinary action.
          </p>
        </div>
      </label>
    </div>
  );
}
