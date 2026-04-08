/**
 * Reports — Company Admin analytics and reporting dashboard.
 */

"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  Download,
  Calendar,
} from "lucide-react";

export default function ReportsPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "Reports" }]);

  const [period, setPeriod] = useState("30");

  const periodOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
    { value: "365", label: "Last year" },
  ];

  return (
    <PageContainer
      title="Reports"
      description="Analytics and insights for your organization."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Select
              options={periodOptions}
              value={period}
              onValueChange={setPeriod}
              placeholder="Select period..."
            />
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Total Employees</p>
                <p className="text-2xl font-semibold text-text-primary">248</p>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-brand-success">
              <TrendingUp className="h-3 w-3" /> +12 this month
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                <AlertTriangle className="h-5 w-5 text-brand-warning" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Open Incidents</p>
                <p className="text-2xl font-semibold text-text-primary">7</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-text-tertiary">3 pending HR review</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                <BarChart3 className="h-5 w-5 text-brand-error" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Disciplinary Actions</p>
                <p className="text-2xl font-semibold text-text-primary">15</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-text-tertiary">8 verbal, 5 written, 2 PIP</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                <TrendingUp className="h-5 w-5 text-brand-success" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Resolution Rate</p>
                <p className="text-2xl font-semibold text-text-primary">94%</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-brand-success">Above target (90%)</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">Incidents by Type</h3>
            <div className="flex h-48 items-center justify-center text-text-tertiary">
              [Chart Placeholder]
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">
              Department Distribution
            </h3>
            <div className="flex h-48 items-center justify-center text-text-tertiary">
              [Chart Placeholder]
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Recent Activity</h3>
          <div className="space-y-3">
            {[
              {
                action: "Verbal warning issued",
                employee: "Alice Johnson",
                manager: "Bob Smith",
                date: "Today",
              },
              {
                action: "Incident reported",
                employee: "Carol Williams",
                manager: "David Brown",
                date: "Yesterday",
              },
              {
                action: "PIP signed",
                employee: "Eve Davis",
                manager: "Frank Miller",
                date: "Apr 5",
              },
              {
                action: "Incident resolved",
                employee: "George Wilson",
                manager: "Alice Johnson",
                date: "Apr 3",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.action}</p>
                  <p className="text-xs text-text-tertiary">
                    {item.employee} • {item.manager}
                  </p>
                </div>
                <Badge variant="outline">{item.date}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
