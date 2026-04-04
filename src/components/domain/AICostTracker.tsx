/**
 * AI Cost Tracker — monitors and enforces AI spending limits.
 *
 * Tracks:
 *   - Daily/monthly token usage
 *   - Cost per request
 *   - Budget thresholds (50%, 80%, 100%)
 *   - Per-company quotas
 *
 * When budget is exceeded, AI calls are blocked and incidents
 * route to manual review queue.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostMetrics {
  dailyTokens: number;
  monthlyTokens: number;
  dailyCost: number;
  monthlyCost: number;
  monthlyBudget: number;
  requestCount: number;
  averageCostPerRequest: number;
}

interface CostAlert {
  threshold: number;
  triggered: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Mock Data (replace with API calls)
// ---------------------------------------------------------------------------

const MOCK_METRICS: CostMetrics = {
  dailyTokens: 45230,
  monthlyTokens: 892450,
  dailyCost: 0.72,
  monthlyCost: 14.28,
  monthlyBudget: 50.0,
  requestCount: 187,
  averageCostPerRequest: 0.076,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AICostTracker() {
  const [metrics, setMetrics] = useState<CostMetrics>(MOCK_METRICS);

  const budgetUsed =
    metrics.monthlyBudget > 0 ? (metrics.monthlyCost / metrics.monthlyBudget) * 100 : 0;

  const alerts: CostAlert[] = [
    { threshold: 50, triggered: budgetUsed >= 50, message: "AI budget 50% used" },
    {
      threshold: 80,
      triggered: budgetUsed >= 80,
      message: "AI budget 80% used — approaching limit",
    },
    {
      threshold: 100,
      triggered: budgetUsed >= 100,
      message: "AI budget exceeded — AI calls blocked",
    },
  ];

  const activeAlerts = alerts.filter((a) => a.triggered);
  const isOverBudget = budgetUsed >= 100;

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <DollarSign className="h-4 w-4 text-brand-primary" />
          AI Cost Tracker
        </h3>
        {isOverBudget && <Badge variant="error">Over Budget</Badge>}
      </div>

      {/* Budget Bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Monthly Budget</span>
          <span
            className={`font-medium ${
              budgetUsed >= 100
                ? "text-brand-error"
                : budgetUsed >= 80
                  ? "text-brand-warning"
                  : "text-brand-success"
            }`}
          >
            ${metrics.monthlyCost.toFixed(2)} / ${metrics.monthlyBudget.toFixed(2)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-brand-slate-light">
          <div
            className={`h-full rounded-full transition-all ${
              budgetUsed >= 100
                ? "bg-brand-error"
                : budgetUsed >= 80
                  ? "bg-brand-warning"
                  : "bg-brand-success"
            }`}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-text-tertiary">
          {budgetUsed.toFixed(1)}% used · $
          {Math.max(0, metrics.monthlyBudget - metrics.monthlyCost).toFixed(2)} remaining
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="Daily Tokens"
          value={metrics.dailyTokens.toLocaleString()}
        />
        <StatItem
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Requests Today"
          value={metrics.requestCount.toString()}
        />
        <StatItem
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Daily Cost"
          value={`$${metrics.dailyCost.toFixed(2)}`}
        />
        <StatItem
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Avg/Request"
          value={`$${metrics.averageCostPerRequest.toFixed(3)}`}
        />
      </div>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {activeAlerts.map((alert) => (
            <div
              key={alert.threshold}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs ${
                alert.threshold >= 100
                  ? "bg-brand-error/10 text-brand-error"
                  : "bg-brand-warning/10 text-brand-warning"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Over Budget Warning */}
      {isOverBudget && (
        <div className="mt-4 rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
          <p className="text-xs font-medium text-brand-error">AI Service Blocked</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Monthly budget exceeded. All AI calls are being routed to manual review queue.
            Contact your administrator to increase the budget.
          </p>
        </div>
      )}
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="flex items-center gap-1.5 text-text-tertiary">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
