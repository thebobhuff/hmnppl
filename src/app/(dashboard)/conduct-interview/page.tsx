"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  HeartHandshake,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";

type InterviewStepId =
  | "facts"
  | "employee_response"
  | "prior_context"
  | "training_review"
  | "resolution";

interface InterviewStep {
  id: InterviewStepId;
  title: string;
  prompt: string;
  coaching: string;
  documentation: string[];
}

const STEPS: InterviewStep[] = [
  {
    id: "facts",
    title: "Incident facts",
    prompt:
      "Document only observable facts: what happened, when it happened, where it happened, and who was present.",
    coaching:
      "Keep your tone neutral. Use language like \"I want to understand what happened and align on expectations\" instead of blame or frustration.",
    documentation: [
      "Date, time, and location",
      "Specific policy or expectation involved",
      "Witnesses or evidence",
    ],
  },
  {
    id: "employee_response",
    title: "Employee response",
    prompt:
      "Capture the employee's explanation or any context they shared. Note whether they accepted, clarified, or disputed the concern.",
    coaching:
      "Leave room for context. Try: \"Help me understand what was happening from your perspective.\"",
    documentation: [
      "Employee explanation",
      "Any barriers they identified",
      "Any dispute or correction to the facts",
    ],
  },
  {
    id: "prior_context",
    title: "Prior context",
    prompt:
      "Identify whether this is a repeat of the same issue, a related pattern, or a new type of concern.",
    coaching:
      "Separate patterns from assumptions. A repeat issue should be tied to prior dates and records, not general impressions.",
    documentation: [
      "Prior verbal conversations",
      "Prior written warnings or PIPs",
      "Whether this is same issue, same category, or new issue",
    ],
  },
  {
    id: "training_review",
    title: "Training review",
    prompt:
      "List training, coaching, job aids, or process guidance already provided. If none exists, document the gap before escalating.",
    coaching:
      "The goal is correction before punishment. If training was missing or unclear, acknowledge it and set a support plan.",
    documentation: [
      "Training already completed",
      "Training still needed",
      "Manager follow-up commitments",
    ],
  },
  {
    id: "resolution",
    title: "Resolution and next steps",
    prompt:
      "Write the expectation, employee action items, support offered, and follow-up date. Keep consequences factual and proportional.",
    coaching:
      "Close with clarity and respect. Try: \"I want you to be successful, and this is the standard we need you to meet.\"",
    documentation: [
      "Clear expectation",
      "Correction date or follow-up date",
      "Training or support assigned",
    ],
  },
];

const HIGH_RISK_TERMS = [
  "safety",
  "violence",
  "threat",
  "harassment",
  "fraud",
  "embezzle",
  "protected class",
  "discrimination",
];

function detectRisk(notes: Record<InterviewStepId, string>) {
  const text = Object.values(notes).join(" ").toLowerCase();
  return HIGH_RISK_TERMS.filter((term) => text.includes(term));
}

function buildSummary(notes: Record<InterviewStepId, string>) {
  return STEPS.map((step) => ({
    label: step.title,
    value: notes[step.id].trim() || "Not documented yet",
  }));
}

export default function ConductInterviewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState<Record<InterviewStepId, string>>({
    facts: "",
    employee_response: "",
    prior_context: "",
    training_review: "",
    resolution: "",
  });

  const currentStep = STEPS[currentIndex];
  const riskTerms = useMemo(() => detectRisk(notes), [notes]);
  const summary = useMemo(() => buildSummary(notes), [notes]);
  const completeCount = STEPS.filter((step) => notes[step.id].trim().length > 0).length;
  const isComplete = completeCount === STEPS.length;

  return (
    <PageContainer
      title="Coach Interview"
      description="Guide a manager through a verbal-warning interview with empathy, documentation, and escalation safeguards."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="border-blue-400/20 bg-gradient-to-br from-blue-950/30 via-slate-900 to-violet-950/20 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">
                  <MessagesSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Manager coaching session
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                    This path is for lower-risk verbal warnings. Any high-risk terms route the case to HR before delivery.
                  </p>
                </div>
              </div>
              <Badge variant={riskTerms.length > 0 ? "warning" : "success"}>
                {riskTerms.length > 0 ? "HR review required" : "Verbal path"}
              </Badge>
            </div>
          </Card>

          <div className="grid gap-2 sm:grid-cols-5">
            {STEPS.map((step, index) => {
              const active = index === currentIndex;
              const done = notes[step.id].trim().length > 0;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentIndex(index)}
                  className={
                    "min-h-[70px] rounded-lg border p-3 text-left transition-colors " +
                    (active
                      ? "border-blue-300 bg-blue-400/10"
                      : done
                        ? "border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/10"
                        : "border-border hover:bg-card-hover")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-text-tertiary">
                      Step {index + 1}
                    </span>
                    {done && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{step.title}</p>
                </button>
              );
            })}
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-200">
                  Step {currentIndex + 1} of {STEPS.length}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-text-primary">
                  {currentStep.title}
                </h3>
              </div>
              <Badge variant="outline">{completeCount}/{STEPS.length} documented</Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div>
                <p className="mb-2 text-sm text-text-secondary">{currentStep.prompt}</p>
                <Textarea
                  value={notes[currentStep.id]}
                  onChange={(event) =>
                    setNotes((prev) => ({ ...prev, [currentStep.id]: event.target.value }))
                  }
                  placeholder="Capture the manager's notes here..."
                  className="min-h-[250px]"
                  maxLength={2500}
                />
                <p className="mt-2 text-right text-xs text-text-tertiary">
                  {notes[currentStep.id].length}/2500
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <HeartHandshake className="h-4 w-4" />
                    Coaching
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {currentStep.coaching}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <BookOpenCheck className="h-4 w-4 text-violet-200" />
                    Document
                  </div>
                  <ul className="mt-2 space-y-1">
                    {currentStep.documentation.map((item) => (
                      <li key={item} className="text-xs text-text-secondary">
                        - {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() =>
                  setCurrentIndex((index) => Math.min(STEPS.length - 1, index + 1))
                }
                disabled={currentIndex === STEPS.length - 1}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-200" />
              <h3 className="text-sm font-semibold text-text-primary">Routing guardrails</h3>
            </div>
            {riskTerms.length > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Escalate to HR
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Detected: {riskTerms.join(", ")}. This should leave the verbal-warning path.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">
                No high-risk terms detected. This can remain a manager coaching record unless new facts change the risk level.
              </p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-200" />
              <h3 className="text-sm font-semibold text-text-primary">Documentation summary</h3>
            </div>
            <div className="mt-3 space-y-3">
              {summary.map((item) => (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold text-text-tertiary">{item.label}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text-primary">Suggested outcome</h3>
            <p className="mt-2 text-sm text-text-secondary">
              {riskTerms.length > 0
                ? "Pause manager delivery and send this record to HR for review."
                : isComplete
                  ? "Ready to save as verbal-warning coaching documentation."
                  : "Complete each interview step before saving the coaching record."}
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
