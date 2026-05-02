/**
 * PreMeetingDiagnosisPanel — AI-powered diagnosis shown before disciplinary meetings.
 *
 * Displays key risks, talking points, suggested questions, and historical context
 * for HR Agents preparing for disciplinary meetings.
 */
"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  ClipboardList,
  HelpCircle,
  History,
  Loader2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { aiAPI } from "@/lib/api/client";

interface DiagnosisData {
  summary: string;
  risk_level: string;
  key_topics: string[];
  talking_points: string[];
  suggested_questions: string[];
  historical_context: string;
  preparation_checklist: string[];
  employee_name: string;
  manager_name: string;
  incident_reference: string | null;
  severity: string;
  prior_incidents: number;
  policy_aligned: boolean;
  policy_sections: string[];
}

interface PreMeetingDiagnosisPanelProps {
  meetingId: string;
}

const RISK_ICONS: Record<string, React.ReactNode> = {
  critical: <XCircle className="h-5 w-5 text-red-500" />,
  high: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  medium: <AlertCircle className="h-5 w-5 text-amber-500" />,
  low: <CheckCircle className="h-5 w-5 text-green-500" />,
};

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/30",
  high: "bg-orange-500/10 border-orange-500/30",
  medium: "bg-amber-500/10 border-amber-500/30",
  low: "bg-green-500/10 border-green-500/30",
};

export function PreMeetingDiagnosisPanel({ meetingId }: PreMeetingDiagnosisPanelProps) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("key_topics");

  const generateDiagnosis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiAPI.preMeetingDiagnosis(meetingId);
      setDiagnosis(res.diagnosis);
    } catch (err) {
      setError("Failed to generate diagnosis. The AI service may be unavailable.");
      console.error("[PreMeetingDiagnosis] Failed:", err);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  if (!diagnosis && !loading) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-slate-light">
          <Stethoscope className="h-7 w-7 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-text-primary">
            Pre-Meeting AI Diagnosis
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Get AI-powered insights before your disciplinary meeting.
            Includes key risks, talking points, and suggested questions.
          </p>
        </div>
        <Button onClick={generateDiagnosis} size="sm">
          <Brain className="mr-2 h-4 w-4" />
          Generate Diagnosis
        </Button>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand-primary" />
          <h3 className="font-display text-base font-semibold text-text-primary">
            Pre-Meeting AI Diagnosis
          </h3>
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          <span className="ml-2 text-sm text-text-secondary">
            Analyzing incident and building recommendations...
          </span>
        </div>
      </Card>
    );
  }

  if (!diagnosis) return null;

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand-primary" />
          <h3 className="font-display text-base font-semibold text-text-primary">
            Pre-Meeting AI Diagnosis
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {diagnosis.incident_reference && (
            <Badge variant="outline">{diagnosis.incident_reference}</Badge>
          )}
          <Badge
            variant={
              diagnosis.risk_level === "critical"
                ? "error"
                : diagnosis.risk_level === "high"
                  ? "warning"
                  : "default"
            }
          >
            {diagnosis.risk_level.toUpperCase()} RISK
          </Badge>
        </div>
      </div>

      <div
        className={`rounded-lg border p-4 ${RISK_COLORS[diagnosis.risk_level] ?? RISK_COLORS.low}`}
      >
        <div className="flex items-start gap-3">
          {RISK_ICONS[diagnosis.risk_level] ?? RISK_ICONS.low}
          <div>
            <p className="text-sm font-medium text-text-primary">{diagnosis.summary}</p>
            {diagnosis.severity && (
              <p className="mt-1 text-xs text-text-tertiary">
                Severity: {diagnosis.severity} · Prior incidents: {diagnosis.prior_incidents}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {diagnosis.policy_sections.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {diagnosis.policy_sections.map((section, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {section}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionToggle
          icon={<ClipboardList className="h-4 w-4" />}
          label="Key Topics"
          count={diagnosis.key_topics.length}
          expanded={expandedSection === "key_topics"}
          onClick={() => toggleSection("key_topics")}
        />
        {expandedSection === "key_topics" && (
          <div className="ml-7 space-y-1.5">
            {diagnosis.key_topics.map((topic, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                <span className="text-sm text-text-secondary">{topic}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionToggle
          icon={<Sparkles className="h-4 w-4" />}
          label="Talking Points"
          count={diagnosis.talking_points.length}
          expanded={expandedSection === "talking_points"}
          onClick={() => toggleSection("talking_points")}
        />
        {expandedSection === "talking_points" && (
          <div className="ml-7 space-y-1.5">
            {diagnosis.talking_points.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-warning" />
                <span className="text-sm text-text-secondary">{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionToggle
          icon={<HelpCircle className="h-4 w-4" />}
          label="Suggested Questions"
          count={diagnosis.suggested_questions.length}
          expanded={expandedSection === "suggested_questions"}
          onClick={() => toggleSection("suggested_questions")}
        />
        {expandedSection === "suggested_questions" && (
          <div className="ml-7 space-y-1.5">
            {diagnosis.suggested_questions.map((question, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-slate-light text-[10px] font-medium text-text-tertiary">
                  {i + 1}
                </span>
                <span className="text-sm italic text-text-secondary">{question}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionToggle
          icon={<History className="h-4 w-4" />}
          label="Historical Context"
          expanded={expandedSection === "historical_context"}
          onClick={() => toggleSection("historical_context")}
        />
        {expandedSection === "historical_context" && (
          <div className="ml-7">
            <p className="text-sm text-text-secondary">{diagnosis.historical_context}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionToggle
          icon={<CheckCircle className="h-4 w-4" />}
          label="Preparation Checklist"
          count={diagnosis.preparation_checklist.length}
          expanded={expandedSection === "preparation_checklist"}
          onClick={() => toggleSection("preparation_checklist")}
        />
        {expandedSection === "preparation_checklist" && (
          <div className="ml-7 space-y-1.5">
            {diagnosis.preparation_checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-success" />
                <span className="text-sm text-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-text-tertiary">
          Employee: {diagnosis.employee_name} · Manager: {diagnosis.manager_name}
        </p>
        <Button variant="ghost" size="sm" onClick={generateDiagnosis}>
          Refresh
        </Button>
      </div>
    </Card>
  );
}

function SectionToggle({
  icon,
  label,
  count,
  expanded,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-card-hover"
    >
      <div className="flex items-center gap-2">
        <span className="text-text-secondary">{icon}</span>
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {count !== undefined && (
          <Badge variant="outline" className="text-xs">
            {count}
          </Badge>
        )}
      </div>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-text-tertiary" />
      ) : (
        <ChevronDown className="h-4 w-4 text-text-tertiary" />
      )}
    </button>
  );
}