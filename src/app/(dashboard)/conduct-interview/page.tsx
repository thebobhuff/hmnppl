"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Mic,
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Save,
  Play,
  Upload,
  Loader2,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: "text" | "yes_no" | "scale";
  required: boolean;
}

const interviewTemplates: Record<string, Question[]> = {
  tardiness: [
    { id: "1", text: "Can you describe what happened on the morning of the incident?", type: "text", required: true },
    { id: "2", text: "Did you notify your supervisor before your scheduled start time?", type: "yes_no", required: true },
    { id: "3", text: "How many times has this type of issue occurred in the past 30 days?", type: "text", required: true },
    { id: "4", text: "On a scale of 1-10, how would you rate your commitment to being on time?", type: "scale", required: true },
    { id: "5", text: "What steps will you take to ensure punctuality going forward?", type: "text", required: true },
  ],
  misconduct: [
    { id: "1", text: "Please describe the incident in your own words.", type: "text", required: true },
    { id: "2", text: "Do you understand why this behavior is considered a violation?", type: "yes_no", required: true },
    { id: "3", text: "Were there any circumstances that contributed to this incident?", type: "text", required: false },
    { id: "4", text: "How do you plan to prevent this from happening again?", type: "text", required: true },
  ],
  performance: [
    { id: "1", text: "Are you aware of the performance expectations for your role?", type: "yes_no", required: true },
    { id: "2", text: "Can you identify the areas where you have struggled to meet expectations?", type: "text", required: true },
    { id: "3", text: "What support do you need from management to improve?", type: "text", required: true },
    { id: "4", text: "On a scale of 1-10, how confident are you in meeting expectations within 60 days?", type: "scale", required: true },
  ],
};

type Step = "prepare" | "questions" | "evidence" | "outcome" | "summary";

export default function ConductInterviewPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Conduct Interview" },
  ]);

  const [step, setStep] = useState<Step>("prepare");
  const [incidentType, setIncidentType] = useState<string>("tardiness");
  const [employeeName, setEmployeeName] = useState("");
  const [incidentRef, setIncidentRef] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [newWitness, setNewWitness] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<string>("");
  const [actionPlan, setActionPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "prepare", label: "Preparation", icon: CheckCircle },
    { id: "questions", label: "Questions", icon: Mic },
    { id: "evidence", label: "Evidence", icon: FileText },
    { id: "outcome", label: "Outcome", icon: AlertTriangle },
    { id: "summary", label: "Summary", icon: FileText },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1].id);
    }
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setStep(steps[idx - 1].id);
    }
  };

  const addWitness = () => {
    if (newWitness.trim()) {
      setWitnesses([...witnesses, newWitness.trim()]);
      setNewWitness("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
    setStep("summary");
  };

  const questions = interviewTemplates[incidentType] || interviewTemplates.tardiness;

  const renderPrepare = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Pre-Interview Checklist</h3>
        <p className="text-sm text-text-secondary">Ensure all documents are prepared before starting.</p>
      </div>

      <div className="space-y-4">
        {[
          { label: "Incident report reviewed", done: true },
          { label: "Employee file accessed", done: true },
          { label: "Policy document prepared", done: false },
          { label: "Witness statements collected", done: false },
          { label: "HR representative confirmed", done: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {item.done ? (
                <CheckCircle className="h-5 w-5 text-brand-success" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-border" />
              )}
              <span className={item.done ? "text-text-secondary" : "text-text-primary"}>{item.label}</span>
            </div>
            {item.done ? (
              <Badge variant="success">Complete</Badge>
            ) : (
              <Badge variant="warning">Pending</Badge>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary">Employee Name</label>
          <Input
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Enter employee name"
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary">Incident Reference</label>
          <Input
            value={incidentRef}
            onChange={(e) => setIncidentRef(e.target.value)}
            placeholder="INC-XXXX-XXXX"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-text-primary">Interview Type</label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option value="tardiness">Tardiness</option>
            <option value="misconduct">Misconduct</option>
            <option value="performance">Performance Issue</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Interview Questions</h3>
        <p className="text-sm text-text-secondary">Ask each question and record the response.</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-4">
            <div className="mb-3 flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-text-inverse">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium text-text-primary">{q.text}</p>
              {q.required && <span className="text-brand-error">*</span>}
            </div>

            {q.type === "text" && (
              <Textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="Record response..."
                className="min-h-[80px]"
              />
            )}

            {q.type === "yes_no" && (
              <div className="flex gap-4">
                <button
                  onClick={() => setAnswers({ ...answers, [q.id]: "yes" })}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                    answers[q.id] === "yes"
                      ? "bg-brand-success text-text-inverse"
                      : "bg-brand-slate-light text-text-secondary hover:bg-card-hover"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" /> Yes
                </button>
                <button
                  onClick={() => setAnswers({ ...answers, [q.id]: "no" })}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                    answers[q.id] === "no"
                      ? "bg-brand-error text-text-inverse"
                      : "bg-brand-slate-light text-text-secondary hover:bg-card-hover"
                  }`}
                >
                  <XCircle className="h-4 w-4" /> No
                </button>
              </div>
            )}

            {q.type === "scale" && (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAnswers({ ...answers, [q.id]: String(n) })}
                    className={`h-8 w-8 rounded-full text-sm font-medium ${
                      answers[q.id] === String(n)
                        ? "bg-brand-primary text-text-inverse"
                        : "bg-brand-slate-light text-text-secondary hover:bg-card-hover"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">Additional Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations..."
          className="mt-1"
        />
      </div>
    </div>
  );

  const renderEvidence = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Evidence & Witnesses</h3>
        <p className="text-sm text-text-secondary">Upload supporting documents and record witnesses.</p>
      </div>

      <Card className="p-4 border-dashed border-2">
        <div className="flex flex-col items-center justify-center py-8">
          <Upload className="h-12 w-12 text-text-tertiary" />
          <p className="mt-2 text-sm text-text-secondary">Drop files here or click to upload</p>
          <p className="text-xs text-text-tertiary">PDF, PNG, JPG up to 10MB</p>
          <Button variant="outline" className="mt-4">
            Choose Files
          </Button>
        </div>
      </Card>

      <div>
        <label className="block text-sm font-medium text-text-primary">Witnesses</label>
        <div className="mt-2 flex gap-2">
          <Input
            value={newWitness}
            onChange={(e) => setNewWitness(e.target.value)}
            placeholder="Witness name"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWitness())}
          />
          <Button onClick={addWitness} variant="outline">
            Add
          </Button>
        </div>
        {witnesses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {witnesses.map((w, i) => (
              <Badge key={i} variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {w}
                <button onClick={() => setWitnesses(witnesses.filter((_, idx) => idx !== i))} className="ml-1">
                  ├ù
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderOutcome = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Interview Outcome</h3>
        <p className="text-sm text-text-secondary">Select the appropriate action based on the interview.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { value: "verbal_warning", label: "Verbal Warning", description: "Coach employee with verbal warning" },
          { value: "written_warning", label: "Written Warning", description: "Issue formal written warning" },
          { value: "pip", label: "Performance Improvement Plan", description: "Initiate 60-day PIP" },
          { value: "termination_review", label: "Termination Review", description: "Escalate to legal for termination" },
          { value: "no_action", label: "No Action Needed", description: "Close with no disciplinary action" },
          { value: "further_investigation", label: "Further Investigation", description: "Requires additional review" },
        ].map((option) => (
          <Card
            key={option.value}
            className={`cursor-pointer p-4 transition-colors ${
              outcome === option.value
                ? "border-brand-primary bg-brand-primary/5"
                : "hover:bg-card-hover"
            }`}
            onClick={() => setOutcome(option.value)}
          >
            <p className="font-medium text-text-primary">{option.label}</p>
            <p className="mt-1 text-xs text-text-tertiary">{option.description}</p>
          </Card>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">Action Plan (required)</label>
        <Textarea
          value={actionPlan}
          onChange={(e) => setActionPlan(e.target.value)}
          placeholder="Detail the specific actions, timeline, and follow-up steps..."
          className="mt-1 min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-success/10">
          <CheckCircle className="h-8 w-8 text-brand-success" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary">Interview Complete</h2>
        <p className="mt-2 text-text-secondary">The interview has been recorded and saved.</p>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-tertiary">Employee</span>
            <span className="font-medium text-text-primary">{employeeName || "Not specified"}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-tertiary">Incident</span>
            <span className="font-medium text-text-primary">{incidentRef || "Not specified"}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-tertiary">Type</span>
            <span className="font-medium text-text-primary capitalize">{incidentType}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-tertiary">Outcome</span>
            <span className="font-medium text-text-primary capitalize">{outcome.replace(/_/g, " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Witnesses</span>
            <span className="font-medium text-text-primary">{witnesses.length > 0 ? witnesses.join(", ") : "None"}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => window.print()}>
          Print Summary
        </Button>
        <Button asChild>
          <a href="/incident-queue">Back to Queue</a>
        </Button>
      </div>
    </div>
  );

  return (
    <PageContainer
      title="Conduct Interview"
      description="HR-guided disciplinary interview workflow."
    >
      {step === "summary" ? (
        renderSummary()
      ) : (
        <>
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const isActive = s.id === step;
                const isCompleted = i < currentStepIndex;
                return (
                  <div key={s.id} className="flex items-center">
                    <div className={`flex items-center gap-2 ${isActive ? "text-brand-primary" : isCompleted ? "text-brand-success" : "text-text-tertiary"}`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted ? "bg-brand-success text-text-inverse" : isActive ? "bg-brand-primary text-text-inverse" : "bg-brand-slate-light"
                      }`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className="hidden text-sm font-medium sm:block">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`mx-2 h-0.5 w-8 sm:w-16 ${isCompleted ? "bg-brand-success" : "bg-brand-slate-light"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card className="p-6">
            {step === "prepare" && renderPrepare()}
            {step === "questions" && renderQuestions()}
            {step === "evidence" && renderEvidence()}
            {step === "outcome" && renderOutcome()}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                {step === "outcome" ? (
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save & Complete
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
