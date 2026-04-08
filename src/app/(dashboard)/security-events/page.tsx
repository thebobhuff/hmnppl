/**
 * Security Events — Super Admin security monitoring.
 */

"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";

export default function SecurityEventsPage() {
  usePageBreadcrumbs([{ label: "Security Events" }]);

  const events = [
    {
      id: "1",
      type: "Failed login",
      severity: "warning",
      user: "bob@acme.com",
      time: "10 min ago",
    },
    {
      id: "2",
      type: "API key rotated",
      severity: "info",
      user: "system",
      time: "2 hours ago",
    },
    {
      id: "3",
      type: "Unusual API activity",
      severity: "warning",
      user: "alice@acme.com",
      time: "5 hours ago",
    },
  ];

  const severityColors = {
    info: "default",
    warning: "warning",
    critical: "error",
  };

  return (
    <PageContainer
      title="Security Events"
      description="Monitor security-related events across the platform."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                <ShieldAlert className="h-5 w-5 text-brand-error" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Critical</p>
                <p className="text-2xl font-semibold text-text-primary">0</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                <AlertTriangle className="h-5 w-5 text-brand-warning" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Warnings</p>
                <p className="text-2xl font-semibold text-text-primary">3</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                <ShieldCheck className="h-5 w-5 text-brand-success" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Resolved</p>
                <p className="text-2xl font-semibold text-text-primary">156</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Recent Events</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b border-border py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-text-tertiary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{event.type}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <User className="h-3 w-3 text-text-tertiary" />
                      <span className="text-xs text-text-tertiary">{event.user}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      severityColors[event.severity as keyof typeof severityColors] as
                        | "default"
                        | "warning"
                        | "error"
                    }
                  >
                    {event.severity}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
