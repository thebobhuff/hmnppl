/**
 * AITestPanel — Test how AI will interpret policy rules with a sample scenario.
 *
 * Shows a preview of AI interpretation, prediction, and confidence breakdown.
 */
"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, RefreshCw, Brain, CheckCircle, AlertCircle } from "lucide-react";

interface PolicyRule {
  id: string;
  name: string;
  triggerType: string;
  severity: string;
  actionType: string;
  escalationLevel: number;
  description: string;
}

interface TestResult {
  predicted_action: string;
  confidence: number;
  reasoning: string;
  matched_rule: string;
  alternative_actions: string[];
  needs_human_review: boolean;
  review_reason?: string;
}

interface AITestPanelProps {
  policyId?: string;
  rules: PolicyRule[];
  threshold: number;
  policyName?: string;
  onTestResult?: (result: TestResult) => void;
}

const SAMPLE_SCENARIOS = [
  {
    label: "First tardiness (3 days late)",
    value: `An employee arrived 3 days late to work without prior notice. The manager reported this as tardiness with medium severity. The employee has no prior incidents on record.`,
  },
  {
    label: "Second tardiness after verbal warning",
    value: `An employee who already received a verbal warning for tardiness was late again. This time the manager reported it as tardiness with high severity. The employee has 1 prior verbal warning for tardiness.`,
  },
  {
    label: "Insubordination refusal",
    value: `A manager gave an employee a direct instruction to complete a task. The employee refused without justification. The manager reported this as insubordination with medium severity. The employee has no prior incidents.`,
  },
  {
    label: "Performance PIP follow-up",
    value: `An employee currently on a Performance Improvement Plan missed a deadline again. The manager reported this as performance with critical severity. The employee has an active PIP and 2 prior written warnings.`,
  },
];

export function AITestPanel({ rules, threshold, policyName, onTestResult }: AITestPanelProps) {
  const [customScenario, setCustomScenario] = useState("");
  const [activeScenario, setActiveScenario] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(
    async (scenarioText: string) => {
      if (rules.length === 0) {
        setError("Add at least one rule before testing.");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/v1/ai/evaluate-incident", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: "test-employee-id",
            type: rules[0]?.triggerType ?? "tardiness",
            severity: rules[0]?.severity ?? "medium",
            description: scenarioText,
            incident_date: new Date().toISOString().split("T")[0],
            company_id: "test-company",
            policy_rules: rules,
            threshold,
            previous_incident_count: 0,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        const data = await res.json();
        setResult(data);
        onTestResult?.(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Test failed. AI service may be unavailable.");
      } finally {
        setLoading(false);
      }
    },
    [rules, threshold, onTestResult],
  );

  const handleScenarioClick = (index: number) => {
    setActiveScenario(index);
    setCustomScenario("");
    setResult(null);
  };

  const handleRunTest = () => {
    const scenarioText = customScenario || SAMPLE_SCENARIOS[activeScenario].value;
    void runTest(scenarioText);
  };

  const activeScenarioText = customScenario || SAMPLE_SCENARIOS[activeScenario]?.value || "";

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-semibold text-text-primary">AI Test Panel</h3>
        {policyName && (
          <Badge variant="outline" className="text-xs">
            {policyName}
          </Badge>
        )}
      </div>
      <p className="mb-4 text-xs text-text-tertiary">
        Test how AI will interpret these rules with sample scenarios. Results are
        non-binding and help validate your rule configuration.
      </p>

      {/* Scenario Selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {SAMPLE_SCENARIOS.map((scenario, i) => (
          <button
            key={i}
            onClick={() => handleScenarioClick(i)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeScenario === i && !customScenario
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border text-text-secondary hover:border-brand-primary/50"
            }`}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {/* Custom Scenario */}
      <Textarea
        value={customScenario}
        onChange={(e) => {
          setCustomScenario(e.target.value);
          setActiveScenario(-1);
          setResult(null);
        }}
        placeholder="Or describe your own scenario..."
        className="mb-3 min-h-[80px] text-xs"
      />

      <Button
        size="sm"
        onClick={handleRunTest}
        disabled={loading || rules.length === 0}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running AI Evaluation...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Test Scenario
          </>
        )}
      </Button>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-brand-error" />
          <p className="text-xs text-brand-error">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-tertiary">AI Prediction</span>
            <Badge
              variant={
                result.confidence >= threshold / 100
                  ? result.needs_human_review
                    ? "warning"
                    : "success"
                  : "error"
              }
            >
              {Math.round(result.confidence * 100)}% confidence
            </Badge>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-text-tertiary">Recommended Action</p>
            <p className="mt-1 font-display text-base font-semibold text-text-primary">
              {result.predicted_action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-text-tertiary">Matched Rule</p>
            <p className="mt-1 text-sm text-text-primary">
              {result.matched_rule || "Rule #1"}
            </p>
          </div>

          {result.reasoning && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-tertiary">AI Reasoning</p>
              <p className="mt-1 text-sm text-text-secondary">{result.reasoning}</p>
            </div>
          )}

          {result.alternative_actions && result.alternative_actions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-tertiary">Alternative Actions</p>
              <div className="flex flex-wrap gap-1">
                {result.alternative_actions.map((action, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {result.needs_human_review && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-warning/30 bg-brand-warning/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-warning" />
              <div>
                <p className="text-xs font-medium text-brand-warning">Human Review Required</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {result.review_reason ||
                    "This scenario falls below the confidence threshold and will be routed to HR for manual review."}
                </p>
              </div>
            </div>
          )}

          {result.confidence >= threshold / 100 && !result.needs_human_review && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-success/30 bg-brand-success/5 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-success" />
              <p className="text-xs text-brand-success">
                Above threshold — AI would auto-generate a document for this scenario.
              </p>
            </div>
          )}

          <div className="pt-2">
            <div className="mb-1 flex items-center justify-between text-xs text-text-tertiary">
              <span>Confidence Bar</span>
              <span>{Math.round(result.confidence * 100)}% / {threshold}% threshold</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-slate-light">
              <div
                className={`h-full transition-all ${
                  result.confidence >= threshold / 100
                    ? "bg-brand-success"
                    : "bg-brand-warning"
                }`}
                style={{ width: `${Math.min(result.confidence * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}