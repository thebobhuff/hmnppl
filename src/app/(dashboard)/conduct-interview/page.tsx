/**
 * Conduct Interview — AI Agent-Guided Disciplinary Conversation.
 *
 * Per Lijo Joseph's requirements:
 * - Manager clicks button to start discipline interview
 * - Agent guides through the entire conversation
 * - Collects all information systematically
 * - Documents everything automatically
 * - Verbal warnings: agent handles without HR review
 * - Written+: requires HR review before delivery
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
const PYTHON_AI_SERVICE_URL =
  typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000";
const AI_SERVICE_API_KEY = typeof window !== "undefined" ? "demo-key" : "";
import {
  MessageSquare,
  Send,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Loader2,
  Play,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface DirectReport {
  id: string;
  name: string;
  email: string;
}

interface InterviewStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

interface InterviewSession {
  id: string;
  employee_name: string;
  incident_type: string;
  incident_description: string;
  manager_name: string;
  current_step: string;
  steps_completed: string[];
  agent_messages: AgentMessage[];
  manager_responses: ManagerResponse[];
  status: "in_progress" | "completed" | "requires_hr_review";
  escalation_level: string;
  session_started: string;
}

interface AgentMessage {
  step: string;
  message: string;
  question: string;
  coaching: string | null;
}

interface ManagerResponse {
  step: string;
  response: string;
}

const INTERVIEW_STEPS: InterviewStep[] = [
  {
    id: "introduction",
    name: "Introduction",
    description: "Set context and establish professional tone",
    completed: false,
  },
  {
    id: "incident_description",
    name: "Incident Details",
    description: "Gather detailed facts about what happened",
    completed: false,
  },
  {
    id: "employee_response",
    name: "Employee's View",
    description: "Document the employee's perspective",
    completed: false,
  },
  {
    id: "prior_context",
    name: "Prior History",
    description: "Review any prior incidents or patterns",
    completed: false,
  },
  {
    id: "training_review",
    name: "Training Check",
    description: "Check what training employee has received",
    completed: false,
  },
  {
    id: "resolution",
    name: "Resolution",
    description: "Summarize findings and outline next steps",
    completed: false,
  },
];

const INCIDENT_TYPES = [
  { id: "tardiness", label: "Tardiness" },
  { id: "absence", label: "Absence" },
  { id: "insubordination", label: "Insubordination" },
  { id: "performance", label: "Performance" },
  { id: "misconduct", label: "Misconduct" },
  { id: "quality_of_work", label: "Quality of Work" },
  { id: "other", label: "Other" },
];

export default function ConductInterviewPage() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [sending, setSending] = useState(false);
  const [managerResponse, setManagerResponse] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Conduct Interview" },
  ]);

  useEffect(() => {
    fetchDirectReports();
  }, []);

  const fetchDirectReports = async () => {
    try {
      const res = await fetch("/api/v1/users/me/direct-reports", {
        credentials: "include",
      });
      const data = await res.json();
      setDirectReports(data.directReports || []);
    } catch (err) {
      console.error("Failed to fetch direct reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = useCallback(async () => {
    if (!selectedEmployee || !selectedType || !incidentDescription) return;

    setSending(true);
    try {
      const response = await fetch(`${PYTHON_AI_SERVICE_URL}/agents/interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": AI_SERVICE_API_KEY,
        },
        body: JSON.stringify({
          incident_type: selectedType,
          incident_description: incidentDescription,
          manager_name: user?.email || "Manager",
          employee_name:
            directReports.find((e) => e.id === selectedEmployee)?.name || "Employee",
          current_step: "introduction",
          session_id: `session-${Date.now()}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to start interview");

      const data = await response.json();

      setSession({
        id: data.session_id,
        employee_name:
          directReports.find((e) => e.id === selectedEmployee)?.name || "Employee",
        incident_type: selectedType,
        incident_description: incidentDescription,
        manager_name: user?.email || "Manager",
        current_step: data.current_step,
        steps_completed: [],
        agent_messages: [
          {
            step: data.current_step,
            message: data.agent_message,
            question: data.agent_question,
            coaching: data.coaching_for_manager,
          },
        ],
        manager_responses: [],
        status: data.requires_hr_review ? "requires_hr_review" : "in_progress",
        escalation_level: "verbal_warning",
        session_started: new Date().toISOString(),
      });

      setInterviewStarted(true);
    } catch (err) {
      console.error("Failed to start interview:", err);
    } finally {
      setSending(false);
    }
  }, [selectedEmployee, selectedType, incidentDescription, user, directReports]);

  const sendResponse = useCallback(async () => {
    if (!session || !managerResponse) return;

    setSending(true);
    try {
      const priorResponses: Record<string, string> = {};
      session.manager_responses.forEach((r) => {
        priorResponses[r.step] = r.response;
      });
      priorResponses[session.current_step] = managerResponse;

      const response = await fetch(`${PYTHON_AI_SERVICE_URL}/agents/interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": AI_SERVICE_API_KEY,
        },
        body: JSON.stringify({
          incident_type: session.incident_type,
          incident_description: session.incident_description,
          manager_name: session.manager_name,
          employee_name: session.employee_name,
          current_step: session.current_step,
          prior_responses: priorResponses,
          session_id: session.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to continue interview");

      const data = await response.json();

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_step: data.next_step || data.current_step,
          steps_completed: [...prev.steps_completed, data.current_step],
          agent_messages: [
            ...prev.agent_messages,
            {
              step: data.current_step,
              message: data.agent_message,
              question: data.agent_question,
              coaching: data.coaching_for_manager,
            },
          ],
          manager_responses: [
            ...prev.manager_responses,
            { step: prev.current_step, response: managerResponse },
          ],
          status: data.interview_complete
            ? data.requires_hr_review
              ? "requires_hr_review"
              : "completed"
            : prev.status,
        };
      });

      setManagerResponse("");
    } catch (err) {
      console.error("Failed to send response:", err);
    } finally {
      setSending(false);
    }
  }, [session, managerResponse]);

  const getStepIndex = (stepId: string) =>
    INTERVIEW_STEPS.findIndex((s) => s.id === stepId);

  if (loading) {
    return (
      <PageContainer title="Conduct Interview" description="">
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (!interviewStarted) {
    return (
      <PageContainer
        title="Conduct Interview"
        description="Start an AI-guided disciplinary conversation with your employee."
      >
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
                <Play className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Start Disciplinary Interview
                </h2>
                <p className="text-sm text-text-tertiary">
                  AI will guide you through the conversation
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Select Employee <span className="text-brand-error">*</span>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {directReports.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        selectedEmployee === emp.id
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-border hover:bg-card-hover"
                      }`}
                    >
                      <p className="text-sm font-medium text-text-primary">{emp.name}</p>
                      <p className="text-xs text-text-tertiary">{emp.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Issue Type <span className="text-brand-error">*</span>
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {INCIDENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`rounded-lg border p-2 text-center text-sm transition-colors ${
                        selectedType === type.id
                          ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                          : "border-border text-text-secondary hover:bg-card-hover"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Brief Description <span className="text-brand-error">*</span>
                </label>
                <Textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Describe the incident briefly..."
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={startInterview}
                disabled={
                  !selectedEmployee || !selectedType || !incidentDescription || sending
                }
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Interview
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-text-primary">
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-brand-success" />
                AI guides you through a structured conversation
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-brand-success" />
                Documents everything automatically
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-brand-success" />
                Coaches you on empathy while maintaining standards
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-brand-warning" />
                Written warnings and above require HR review
              </li>
            </ul>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const currentStepIndex = getStepIndex(session.current_step);
  const currentStep = INTERVIEW_STEPS[currentStepIndex];
  const lastMessage = session.agent_messages[session.agent_messages.length - 1];

  return (
    <PageContainer
      title={`Interview: ${session.employee_name}`}
      description={`Step ${currentStepIndex + 1} of ${INTERVIEW_STEPS.length}`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <MessageSquare className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">AI Interview Agent</h3>
                  <p className="text-xs text-text-tertiary">
                    Guiding you through the process
                  </p>
                </div>
              </div>
              <Badge variant={session.status === "completed" ? "success" : "warning"}>
                {session.status === "completed"
                  ? "Completed"
                  : session.status === "requires_hr_review"
                    ? "HR Review Required"
                    : "In Progress"}
              </Badge>
            </div>

            <div className="mb-6 space-y-4">
              {session.agent_messages.map((msg, idx) => (
                <div key={idx} className="rounded-lg bg-brand-slate-light p-4">
                  <p className="text-sm text-text-primary">{msg.message}</p>
                  {msg.question && (
                    <p className="mt-2 text-sm font-medium text-brand-primary">
                      {msg.question}
                    </p>
                  )}
                  {msg.coaching && (
                    <div className="mt-3 rounded border border-brand-warning/30 bg-brand-warning/10 p-3">
                      <p className="text-xs font-medium text-brand-warning">
                        Manager Coaching
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">{msg.coaching}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {session.status !== "completed" &&
              session.status !== "requires_hr_review" && (
                <div className="space-y-3">
                  <Textarea
                    value={managerResponse}
                    onChange={(e) => setManagerResponse(e.target.value)}
                    placeholder="Your response..."
                    className="min-h-[80px]"
                  />
                  <Button onClick={sendResponse} disabled={!managerResponse || sending}>
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Response
                  </Button>
                </div>
              )}

            {session.status === "completed" && (
              <div className="rounded-lg border border-brand-success/30 bg-brand-success/10 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-brand-success" />
                  <p className="font-medium text-brand-success">Interview Complete</p>
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  The conversation has been documented. A summary has been saved to the
                  employee's file.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/my-reports">View Reports</Link>
                  </Button>
                </div>
              </div>
            )}

            {session.status === "requires_hr_review" && (
              <div className="rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-warning" />
                  <p className="font-medium text-brand-warning">HR Review Required</p>
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  Based on the interview, this case requires HR review before proceeding.
                  The documentation has been saved and queued for HR approval.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/incident-queue">View HR Queue</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-text-primary">
              Interview Progress
            </h3>
            <div className="space-y-2">
              {INTERVIEW_STEPS.map((step, idx) => {
                const isCurrent = step.id === session.current_step;
                const isCompleted = session.steps_completed.includes(step.id);

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-lg p-2 ${
                      isCurrent
                        ? "bg-brand-primary/10"
                        : isCompleted
                          ? "bg-brand-success/10"
                          : ""
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isCompleted
                          ? "bg-brand-success text-white"
                          : isCurrent
                            ? "bg-brand-primary text-white"
                            : "bg-brand-slate-light text-text-tertiary"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${isCurrent ? "text-brand-primary" : "text-text-primary"}`}
                      >
                        {step.name}
                      </p>
                    </div>
                    {isCurrent && <ChevronRight className="h-4 w-4 text-brand-primary" />}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-text-primary">Case Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Employee</span>
                <span className="text-text-primary">{session.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Issue</span>
                <span className="capitalize text-text-primary">
                  {session.incident_type.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Session ID</span>
                <span className="font-mono text-xs text-text-secondary">
                  {session.id}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
