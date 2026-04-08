/**
 * Edit Policy — Edit an existing policy.
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, FileText, Shield } from "lucide-react";
import Link from "next/link";

interface PolicyDetail {
  id: string;
  title: string;
  category: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export default function EditPolicyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Policies", href: "/policies" },
    { label: id ? `Edit Policy ${id}` : "Edit Policy" },
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
      });
      setFormData({
        title: "Attendance & Punctuality Policy",
        category: "attendance",
        content: policy?.content || "",
      });
      setLoading(false);
    }, 300);
  }, [id]);

  useEffect(() => {
    if (policy) {
      setFormData({
        title: policy.title,
        category: policy.category,
        content: policy.content,
      });
    }
  }, [policy]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  const categoryOptions = [
    { value: "attendance", label: "Attendance" },
    { value: "conduct", label: "Conduct" },
    { value: "performance", label: "Performance" },
    { value: "safety", label: "Safety" },
    { value: "benefits", label: "Benefits" },
    { value: "other", label: "Other" },
  ];

  if (loading) {
    return (
      <PageContainer title="Edit Policy">
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
      title="Edit Policy"
      description={`Version ${policy.version} • ${policy.is_active ? "Active" : "Inactive"}`}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/policies">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Policies
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Policy Title <span className="text-brand-error">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter policy title"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Category
                  </label>
                  <Select
                    options={categoryOptions}
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                    placeholder="Select category"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Policy Content <span className="text-brand-error">*</span>
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Enter policy content..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Status</h3>
              <Badge variant={policy.is_active ? "success" : "default"}>
                {policy.is_active ? "Active" : "Inactive"}
              </Badge>
              <p className="mt-2 text-xs text-text-tertiary">
                Last updated: {new Date(policy.created_at).toLocaleDateString()}
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-medium text-text-primary">Version History</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Current Version</span>
                  <span className="font-medium text-text-primary">v{policy.version}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Version History
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
