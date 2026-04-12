/** Training Gap Analysis - L-003 + L-007
 * Per Lijo Joseph: "5 designers with onboarding issues - maybe my training sucks."
 */
"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { incidentsAPI, type IncidentResponse } from "@/lib/api/client";
import {
  AlertTriangle, BookOpen, Brain, CheckCircle2, Loader2, Users, Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface GapItem {
  area: string;
  types: string[];
  count: number;
  priority: string;
  suggestion: string;
}

export default function TrainingGapsPage() {
  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "Training Gaps" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await incidentsAPI.list({ limit: "200" });
        if (active) setIncidents(res.incidents);
      } catch (err) {
        console.error("Failed to load training gap data", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const gaps = useMemo(() => {
    const catMap: Record<string, { types: Set<string>; count: number }> = {};
    incidents.forEach((i) => {
      const cat = i.type || "general";
      if (!catMap[cat]) catMap[cat] = { types: new Set(), count: 0 };
      catMap[cat].types.add(i.type || "unknown");
      catMap[cat].count++;
    });
    const results: GapItem[] = [];
    Object.entries(catMap).forEach(([area, data]) => {
      if (data.count >= 2) {
        results.push({
          area: area.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          types: Array.from(data.types),
          count: data.count,
          priority: data.count >= 5 ? "high" : "medium",
          suggestion: "Review and update " + area.replace(/_/g, " ") + " training program",
        });
      }
    });
    return results.sort((a, b) => b.count - a.count);
  }, [incidents]);

  const highPriorityGaps = gaps.filter((g) => g.priority === "high");
  const totalAffected = useMemo(() => {
    const employees = new Set<string>();
    incidents.forEach((i) => {
      if (i.employee_id) employees.add(i.employee_id);
    });
    return employees.size;
  }, [incidents]);

  if (loading) {
    return (
      <PageContainer title="Training Gap Analysis" description="Loading...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Training Gap Analysis"
      description="AI-powered identification of training deficiencies"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-tertiary">Gaps Identified</p>
              <p className="text-2xl font-bold text-text-primary">{gaps.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-tertiary">High Priority</p>
              <p className="text-2xl font-bold text-text-primary">{highPriorityGaps.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-tertiary">Employees Affected</p>
              <p className="text-2xl font-bold text-text-primary">{totalAffected}</p>
            </div>
          </div>
        </Card>
      </div>

      {gaps.length === 0 ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-success" />
          <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
            No Training Gaps Detected
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Your organization does not have enough recurring incidents to identify training gaps.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {gaps.map((gap) => (
            <Card key={gap.area} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-text-primary">
                  {gap.area}
                </h3>
                <Badge variant={gap.priority === "high" ? "warning" : "outline"}>
                  {gap.priority}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand-warning" />
                  <p className="text-sm text-text-secondary">{gap.count} related incidents</p>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-primary" />
                  <p className="text-sm text-text-secondary">{gap.suggestion}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gap.types.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-brand-primary/20 bg-brand-slate-light/30 p-4">
        <div className="flex items-start gap-3">
          <Brain className="mt-0.5 h-5 w-5 text-brand-primary" />
          <div>
            <p className="text-sm font-semibold text-text-primary">AI-Powered Analysis</p>
            <p className="mt-1 text-xs text-text-secondary">
              This page shows client-side pattern detection. For deeper AI analysis with training
              catalog cross-referencing, use the Training Gap API at
              /api/v1/agents/wave6/training-gaps.
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}