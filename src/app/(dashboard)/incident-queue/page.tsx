/**
 * Incident Queue — HR Agent view of all incidents.
 *
 * Tab-based filtering: AI Review / Manual / Approved / All
 * Card list with severity-colored left borders, AI confidence bars.
 * Cursor-based pagination with "Load More".
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { APIErrorFallback } from "@/components/domain/ErrorBoundary";
import { incidentsAPI, type IncidentResponse, type APIError } from "@/lib/api/client";
import {
  Inbox,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type TabKey = "all" | "ai_review" | "manual" | "approved";

interface IncidentCard extends IncidentResponse {
  // Extended for UI display
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Inbox className="h-4 w-4" /> },
  { key: "ai_review", label: "AI Review", icon: <Clock className="h-4 w-4" /> },
  { key: "manual", label: "Manual", icon: <AlertTriangle className="h-4 w-4" /> },
  { key: "approved", label: "Approved", icon: <CheckCircle className="h-4 w-4" /> },
];

export default function IncidentQueuePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [incidents, setIncidents] = useState<IncidentCard[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [error, setError] = useState<APIError | null>(null);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    ai_review: 0,
    manual: 0,
    approved: 0,
  });

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Incident Queue" },
  ]);

  const fetchIncidents = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setIncidents([]);
        setCursor(undefined);
        setError(null);
      } else {
        setFetchingMore(true);
      }

      try {
        const params: Record<string, string> = { limit: "20" };
        if (activeTab === "ai_review") {
          params.status = "pending_hr_review";
        } else if (activeTab === "approved") {
          params.status = "approved";
        }
        if (!reset && cursor) {
          params.cursor = cursor;
        }

        const result = await incidentsAPI.list(params);
        setIncidents((prev) =>
          reset ? result.incidents : [...prev, ...result.incidents],
        );
        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
        setTabCounts((prev) => ({
          ...prev,
          all: result.total,
          [activeTab]: result.total,
        }));
        setError(null);
      } catch (err) {
        setError(err as APIError);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [activeTab, cursor],
  );

  useEffect(() => {
    fetchIncidents(true);
  }, [fetchIncidents]);

  const handleLoadMore = useCallback(() => {
    fetchIncidents(false);
  }, [fetchIncidents]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  return (
    <PageContainer
      title="Incident Queue"
      description="Manage and review disciplinary incidents."
    >
      <div className="grid gap-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.key
                    ? "bg-brand-primary/20 text-brand-primary"
                    : "bg-brand-slate-light text-text-tertiary"
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <APIErrorFallback
            error={error}
            retry={() => fetchIncidents(true)}
            message="Failed to load incidents. Please try again."
          />
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        )}

        {/* Incident Cards */}
        {!loading && !error && incidents.length === 0 && (
          <EmptyState
            title="No incidents found"
            description={`No incidents match the "${activeTab}" filter.`}
          />
        )}

        {!loading && !error && incidents.length > 0 && (
          <div className="grid gap-3">
            {incidents.map((incident) => (
              <IncidentCardItem key={incident.id} incident={incident} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !error && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleLoadMore} disabled={fetchingMore}>
              {fetchingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Incident Card Component
// ---------------------------------------------------------------------------

function IncidentCardItem({ incident }: { incident: IncidentCard }) {
  const severityColors = {
    low: "border-l-brand-primary",
    medium: "border-l-brand-warning",
    high: "border-l-brand-error",
    critical: "border-l-brand-error-dim",
  } as const;

  const severityBadgeColors = {
    low: "default" as const,
    medium: "warning" as const,
    high: "error" as const,
    critical: "critical" as const,
  };

  const statusBadgeVariant =
    incident.status === "approved"
      ? ("success" as const)
      : incident.status === "pending_hr_review"
        ? ("warning" as const)
        : ("default" as const);

  const confidence = incident.ai_confidence_score;

  return (
    <Card
      className={`border-l-4 ${severityColors[incident.severity as keyof typeof severityColors] ?? "border-l-border"} p-4 transition-colors hover:bg-card-hover`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">
              {incident.reference_number}
            </span>
            <Badge
              variant={
                severityBadgeColors[
                  incident.severity as keyof typeof severityBadgeColors
                ] ?? "default"
              }
              dot
            >
              {incident.severity}
            </Badge>
            <Badge variant={statusBadgeVariant}>
              {incident.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <h3 className="mt-1.5 text-sm font-medium text-text-primary">
            {incident.employee_id}
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">{incident.type}</p>
          <p className="mt-1 line-clamp-2 text-sm text-text-tertiary">
            {incident.description}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <span className="text-xs text-text-tertiary">
            {new Date(incident.created_at).toLocaleDateString()}
          </span>

          {confidence !== null && (
            <div className="w-24">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text-tertiary">AI</span>
                <span
                  className={
                    confidence >= 0.85
                      ? "text-brand-success"
                      : confidence >= 0.7
                        ? "text-brand-warning"
                        : "text-brand-error"
                  }
                >
                  {Math.round(confidence * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-slate-light">
                <div
                  className={`h-full rounded-full transition-all ${
                    confidence >= 0.85
                      ? "bg-brand-success"
                      : confidence >= 0.7
                        ? "bg-brand-warning"
                        : "bg-brand-error"
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {(incident.status === "pending_hr_review" ||
            incident.status === "ai_evaluating") && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/incident-queue/${incident.id}/review`}>
                Review
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
