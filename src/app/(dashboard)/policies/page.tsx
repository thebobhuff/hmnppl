/**
 * Policies List — View and manage company policies.
 */
"use client";

import { useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus, Shield, ShieldOff } from "lucide-react";
import Link from "next/link";

const MOCK_POLICIES = [
  {
    id: "1",
    title: "Attendance & Punctuality Policy",
    category: "Attendance & Punctuality",
    status: "active" as const,
    version: 2,
    rules: 3,
    effectiveDate: "2026-01-15",
  },
  {
    id: "2",
    title: "Workplace Conduct Policy",
    category: "Workplace Conduct",
    status: "active" as const,
    version: 1,
    rules: 5,
    effectiveDate: "2026-02-01",
  },
  {
    id: "3",
    title: "Performance Management Policy",
    category: "Performance Management",
    status: "draft" as const,
    version: 1,
    rules: 2,
    effectiveDate: null,
  },
];

export default function PoliciesPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Policies" },
  ]);

  const activePolicies = useMemo(
    () => MOCK_POLICIES.filter((p) => p.status === "active"),
    [],
  );
  const draftPolicies = useMemo(
    () => MOCK_POLICIES.filter((p) => p.status === "draft"),
    [],
  );

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
    </PageContainer>
  );
}

function PolicyCard({
  policy,
}: {
  policy: {
    id: string;
    title: string;
    category: string;
    status: "active" | "draft";
    version: number;
    rules: number;
    effectiveDate: string | null;
  };
}) {
  return (
    <Card className="p-4 transition-colors hover:bg-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{policy.title}</h3>
          <p className="mt-1 text-xs text-text-tertiary">{policy.category}</p>
        </div>
        <Badge variant={policy.status === "active" ? "success" : "default"}>
          {policy.status}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
        <span>v{policy.version}</span>
        <span>{policy.rules} rules</span>
        {policy.effectiveDate && <span>Effective: {policy.effectiveDate}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/policies/${policy.id}/edit`}>Edit</Link>
        </Button>
      </div>
    </Card>
  );
}
