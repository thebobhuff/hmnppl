/**
 * AI Performance — Super Admin AI service monitoring.
 */

"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Activity,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function AIPerformancePage() {
  usePageBreadcrumbs([{ label: "AI Performance" }]);

  return (
    <PageContainer
      title="AI Performance"
      description="Monitor AI service usage and performance."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                <Brain className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Total Requests</p>
                <p className="text-2xl font-semibold text-text-primary">45.2K</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                <Activity className="h-5 w-5 text-brand-success" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Success Rate</p>
                <p className="text-2xl font-semibold text-text-primary">99.7%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                <Clock className="h-5 w-5 text-brand-warning" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Avg Latency</p>
                <p className="text-2xl font-semibold text-text-primary">1.2s</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                <DollarSign className="h-5 w-5 text-brand-error" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Est. Cost</p>
                <p className="text-2xl font-semibold text-text-primary">$124</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">Requests by Agent</h3>
            <div className="space-y-3">
              {[
                { agent: "Risk Classifier", requests: "12.4K", latency: "0.8s" },
                { agent: "Escalation Router", requests: "8.2K", latency: "1.1s" },
                { agent: "Disciplinary Interview", requests: "6.1K", latency: "1.4s" },
                { agent: "Manager Coach", requests: "5.3K", latency: "1.2s" },
                { agent: "Language Checker", requests: "3.2K", latency: "0.9s" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-text-primary">{item.agent}</span>
                  <div className="flex gap-4">
                    <Badge variant="outline">{item.requests}</Badge>
                    <span className="text-xs text-text-tertiary">{item.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">Error Breakdown</h3>
            <div className="space-y-3">
              {[
                { error: "Rate limited", count: 12 },
                { error: "Timeout", count: 8 },
                { error: "Invalid response", count: 5 },
                { error: "Circuit breaker", count: 2 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-brand-warning" />
                    <span className="text-sm text-text-primary">{item.error}</span>
                  </div>
                  <Badge variant="warning">{item.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
