/**
 * Policy Detail — View a specific policy.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Shield, Calendar, Edit3 } from "lucide-react";
import Link from "next/link";

interface PolicyDetail {
  id: string;
  title: string;
  category: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
  rules: number;
}

export default function PolicyDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<PolicyDetail | null>(null);

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Policies", href: "/policies" },
    { label: id ? `Policy ${id}` : "Policy" },
  ]);

  useEffect(() => {
    setTimeout(() => {
      setPolicy({
        id: id || "1",
        title: "Attendance & Punctuality Policy",
        category: "attendance",
        content: `SECTION 3.2 — REPEATED TARDINESS

Three or more unexcused late arrivals within a 30-day period shall result in progressive disciplinary action:

1. First Occurrence: Verbal warning
2. Second Occurrence: Written warning
3. Third Occurrence: Performance Improvement Plan (PIP)
4. Fourth Occurrence: Termination review

DEFINITIONS:
- "Late arrival" means arriving more than 10 minutes after scheduled start time without prior approval.
- "Unexcused" means without supervisor approval or documented emergency.

NOTIFICATION:
Employees must notify their supervisor at least 1 hour before scheduled start time if unable to arrive on time.`,
        version: 2,
        is_active: true,
        created_at: "2026-01-15T10:00:00Z",
        rules: 4,
      });
      setLoading(false);
    }, 300);
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Policy Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (!policy) {
    return (
      <PageContainer title="Policy Not Found">
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-brand-warning" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            Policy Not Found
          </h2>
          <p className="mt-2 text-text-secondary">
            The policy you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/policies">Back to Policies</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={policy.title}
      description={`Version ${policy.version} • ${policy.category}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/policies">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Policies
              </Link>
            </Button>
          </div>
          <Button asChild>
            <Link href={`/policies/${policy.id}/edit`}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Policy
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge variant={policy.is_active ? "success" : "default"}>
                  {policy.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">v{policy.version}</Badge>
              </div>

              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap bg-transparent font-sans text-sm text-text-secondary">
                  {policy.content}
                </pre>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Category:</span>
                  <span className="capitalize text-text-primary">{policy.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Rules:</span>
                  <span className="text-text-primary">{policy.rules}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-tertiary" />
                  <span className="text-text-tertiary">Created:</span>
                  <span className="text-text-primary">
                    {new Date(policy.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
