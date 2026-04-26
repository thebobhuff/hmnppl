"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Command,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  XCircle,
  Loader2,
  Zap,
  Shield,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface QueueItem {
  id: string;
  reference_number: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  age: number; // minutes
  assigned_to?: string;
  status: string;
  employee_name: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-brand-error-dim border-brand-error",
  high: "bg-brand-error/10 border-brand-error",
  medium: "bg-brand-warning/10 border-brand-warning",
  low: "bg-brand-primary/10 border-brand-primary",
};

const severityBadge: Record<string, "error" | "warning" | "default"> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "default",
};

export default function CommandCenterPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Command Center" },
  ]);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setQueue([
        { id: "1", reference_number: "INC-2026-0089", type: "misconduct", severity: "critical", age: 12, assigned_to: "Maria Garcia", status: "pending_hr_review", employee_name: "John D." },
        { id: "2", reference_number: "INC-2026-0091", type: "theft", severity: "high", age: 28, status: "ai_evaluation", employee_name: "Sarah K." },
        { id: "3", reference_number: "INC-2026-0092", type: "tardiness", severity: "medium", age: 45, assigned_to: "David P.", status: "pending_hr_review", employee_name: "Mike R." },
        { id: "4", reference_number: "INC-2026-0093", type: "performance", severity: "low", age: 120, status: "pending_hr_review", employee_name: "Lisa M." },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const stats = useMemo(() => ({
    critical: queue.filter((i) => i.severity === "critical").length,
    high: queue.filter((i) => i.severity === "high").length,
    medium: queue.filter((i) => i.severity === "medium").length,
    low: queue.filter((i) => i.severity === "low").length,
    unassigned: queue.filter((i) => !i.assigned_to).length,
    avgWaitTime: queue.length > 0 ? Math.round(queue.reduce((sum, i) => sum + i.age, 0) / queue.length) : 0,
  }), [queue]);

  const sortedQueue = useMemo(() => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...queue].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [queue]);

  return (
    <PageContainer
      title="Command Center"
      description="Real-time operations monitoring and incident queue."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <>
          {/* Priority Alerts */}
          {stats.critical > 0 && (
            <Card className="mb-6 border-2 border-brand-error bg-brand-error-dim/20 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-brand-error" />
                <div className="flex-1">
                  <p className="font-display font-semibold text-brand-error">
                    {stats.critical} CRITICAL CASE{stats.critical > 1 ? "S" : ""} REQUIRING IMMEDIATE ATTENTION
                  </p>
                  <p className="text-sm text-text-secondary">
                    Critical incidents must be resolved within 30 minutes per SLA.
                  </p>
                </div>
                <Button variant="destructive">
                  <Shield className="mr-2 h-4 w-4" />
                  Assign Now
                </Button>
              </div>
            </Card>
          )}

          {/* Stats Overview */}
          <div className="mb-6 grid gap-4 sm:grid-cols-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                  <XCircle className="h-5 w-5 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.critical}</p>
                  <p className="text-xs text-text-tertiary">Critical</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                  <AlertTriangle className="h-5 w-5 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.high}</p>
                  <p className="text-xs text-text-tertiary">High</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Clock className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.medium}</p>
                  <p className="text-xs text-text-tertiary">Medium</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                  <CheckCircle className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.low}</p>
                  <p className="text-xs text-text-tertiary">Low</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                  <Users className="h-5 w-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.unassigned}</p>
                  <p className="text-xs text-text-tertiary">Unassigned</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <Activity className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.avgWaitTime}m</p>
                  <p className="text-xs text-text-tertiary">Avg Wait</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Queue List */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2">
                <Zap className="h-5 w-5 text-brand-warning" />
                Priority Queue
              </h2>
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Auto-refreshes every 30s
                </span>
              </div>
            </div>

            {sortedQueue.length === 0 ? (
              <EmptyState
                title="Queue Empty"
                description="All incidents are resolved. Great job!"
                icon={<CheckCircle className="h-12 w-12 text-brand-success" />}
              />
            ) : (
              <div className="space-y-3">
                {sortedQueue.map((item) => (
                  <Card
                    key={item.id}
                    className={`border-l-4 ${severityColors[item.severity]} p-4 transition-colors hover:bg-card-hover`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-slate-light">
                        <span className="text-lg font-bold text-text-primary">
                          {item.age < 60 ? item.age : Math.floor(item.age / 60)}
                        </span>
                        <span className="text-xs text-text-tertiary">{item.age < 60 ? "m" : "h"}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-brand-primary">
                            {item.reference_number}
                          </span>
                          <Badge variant={severityBadge[item.severity]}>{item.severity}</Badge>
                          <Badge variant="outline">{item.type.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">
                          Employee: {item.employee_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.assigned_to ? (
                          <div className="text-right">
                            <p className="text-sm text-text-primary">{item.assigned_to}</p>
                            <p className="text-xs text-text-tertiary">Assigned</p>
                          </div>
                        ) : (
                          <Badge variant="warning">Unassigned</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/incident-queue/${item.id}/review`}>
                            <Shield className="mr-1 h-3 w-3" />
                            Review
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" title="Escalate">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Dismiss">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Team Workload */}
          <Card className="mt-6 p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Team Workload</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { name: "Maria Garcia", active: 3, capacity: 8 },
                { name: "David Park", active: 2, capacity: 8 },
                { name: "Sarah Johnson", active: 5, capacity: 8 },
                { name: "Bob Smith", active: 1, capacity: 8 },
              ].map((member) => (
                <div key={member.name} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">{member.name}</p>
                    <Badge variant={member.active >= member.capacity ? "error" : member.active > 4 ? "warning" : "default"}>
                      {member.active}/{member.capacity}
                    </Badge>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-slate-light">
                    <div
                      className={`h-full rounded-full ${member.active >= member.capacity ? "bg-brand-error" : member.active > 4 ? "bg-brand-warning" : "bg-brand-success"}`}
                      style={{ width: `${(member.active / member.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}