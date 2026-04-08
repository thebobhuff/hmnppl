/**
 * Platform Analytics — Super Admin analytics.
 */

"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Download, Calendar } from "lucide-react";

export default function PlatformAnalyticsPage() {
  usePageBreadcrumbs([{ label: "Platform Analytics" }]);

  const periodOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
  ];

  return (
    <PageContainer
      title="Platform Analytics"
      description="Platform-wide usage and performance metrics."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Select
            options={periodOptions}
            value="30"
            onValueChange={() => {}}
            placeholder="Select period..."
          />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Total Companies</p>
            <p className="text-2xl font-semibold text-text-primary">24</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-brand-success">
              <TrendingUp className="h-3 w-3" /> +4 this month
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Total Users</p>
            <p className="text-2xl font-semibold text-text-primary">2,847</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-brand-success">
              <TrendingUp className="h-3 w-3" /> +156 this month
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Incidents Processed</p>
            <p className="text-2xl font-semibold text-text-primary">1,234</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">AI API Calls</p>
            <p className="text-2xl font-semibold text-text-primary">45.2K</p>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">Usage by Plan</h3>
            <div className="flex h-48 items-center justify-center text-text-tertiary">
              [Chart Placeholder]
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">
              Top Companies by Usage
            </h3>
            <div className="space-y-3">
              {[
                { name: "Enterprise LLC", requests: "12.4K" },
                { name: "Acme Corp", requests: "8.2K" },
                { name: "TechStart Inc", requests: "3.1K" },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-text-primary">{c.name}</span>
                  <Badge variant="outline">{c.requests}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
