/**
 * Policies List — View and manage company policies.
 */
"use client";

import { APIErrorFallback } from "@/components/domain/ErrorBoundary";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { policiesAPI, type APIError, type PolicyResponse } from "@/lib/api/client";
import { FileText, Loader2, Plus, Shield, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function PoliciesPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Policies" },
  ]);

  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Load policies
  useEffect(() => {
    let active = true;

    async function loadPolicies() {
      if (!active) return;
      try {
        setLoading(true);
        setError(null);
        // We'll load all policies without pagination for now (assuming total is low per company)
        const response = await policiesAPI.list({ limit: 100 });
        if (active) {
          setPolicies(response.policies);
        }
      } catch (err: any) {
        if (active) {
          setError(err.body || { error: "Failed to load policies" });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPolicies();

    return () => {
      active = false;
    };
  }, []);

  const activePolicies = useMemo(() => policies.filter((p) => p.is_active), [policies]);
  const draftPolicies = useMemo(() => policies.filter((p) => !p.is_active), [policies]);

  return (
    <PageContainer
      title="Policies"
      description="Manage disciplinary policies and AI evaluation rules."
      actions={
        <Button asChild size="sm">
          <Link href="/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Link>
        </Button>
      }
    >
      {error ? (
        <APIErrorFallback error={error} retry={() => window.location.reload()} />
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Active Policies */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
              <Shield className="h-5 w-5 text-brand-success" />
              Active Policies
              <Badge variant="success">{activePolicies.length}</Badge>
            </h2>
            {activePolicies.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="No active policies"
                  description="Create your first policy to enable AI evaluation."
                  icon={<FileText className="h-8 w-8" />}
                />
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <Link href="/policies/new">Create Policy</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activePolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </div>
            )}
          </div>

          {/* Draft Policies */}
          {draftPolicies.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <ShieldOff className="h-5 w-5 text-text-tertiary" />
                Draft Policies
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {draftPolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function PolicyCard({ policy }: { policy: PolicyResponse }) {
  const ruleCount = Array.isArray(policy.rules) ? policy.rules.length : 0;

  return (
    <Card className="p-4 transition-colors hover:bg-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{policy.title}</h3>
          <p className="mt-1 text-xs text-text-tertiary">
            {policy.category || "General"}
          </p>
        </div>
        <Badge variant={policy.is_active ? "success" : "default"}>
          {policy.is_active ? "active" : "draft"}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
        <span>v{policy.version}</span>
        <span>{ruleCount} rules</span>
        {policy.effective_date && (
          <span>Effective: {new Date(policy.effective_date).toLocaleDateString()}</span>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/policies/${policy.id}/edit`}>Edit</Link>
        </Button>
      </div>
    </Card>
  );
}
