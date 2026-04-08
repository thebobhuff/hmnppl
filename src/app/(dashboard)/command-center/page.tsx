/**
 * Command Center — Super Admin dashboard.
 */

"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Building, Shield, Activity, TrendingUp } from "lucide-react";

export default function CommandCenterPage() {
  usePageBreadcrumbs([{ label: "Command Center" }]);

  return (
    <PageContainer
      title="Command Center"
      description="Platform-wide monitoring and controls."
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                <Building className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Active Companies</p>
                <p className="text-2xl font-semibold text-text-primary">24</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                <Users className="h-5 w-5 text-brand-success" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Total Users</p>
                <p className="text-2xl font-semibold text-text-primary">2,847</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                <Activity className="h-5 w-5 text-brand-warning" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">API Requests</p>
                <p className="text-2xl font-semibold text-text-primary">124K</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                <Shield className="h-5 w-5 text-brand-error" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Security Events</p>
                <p className="text-2xl font-semibold text-text-primary">3</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">Recent Companies</h3>
            <div className="space-y-3">
              {[
                { name: "TechCorp Inc", status: "active", users: 156 },
                { name: "StartUpXYZ", status: "active", users: 23 },
                { name: "Enterprise Co", status: "pending", users: 0 },
              ].map((company, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {company.name}
                    </p>
                    <p className="text-xs text-text-tertiary">{company.users} users</p>
                  </div>
                  <Badge variant={company.status === "active" ? "success" : "warning"}>
                    {company.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-text-primary">System Health</h3>
            <div className="space-y-4">
              {[
                { service: "API Gateway", status: "healthy", uptime: "99.9%" },
                { service: "AI Service", status: "healthy", uptime: "99.5%" },
                { service: "Database", status: "healthy", uptime: "99.99%" },
                { service: "Background Jobs", status: "degraded", uptime: "98.2%" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-text-tertiary" />
                    <span className="text-sm text-text-primary">{item.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">{item.uptime}</span>
                    <Badge variant={item.status === "healthy" ? "success" : "warning"}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
