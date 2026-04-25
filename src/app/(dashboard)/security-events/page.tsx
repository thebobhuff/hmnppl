import Link from "next/link";
import { AlertTriangle, LockKeyhole, ShieldCheck, ShieldQuestion } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const checks = [
  {
    label: "Authentication",
    status: "Guarded",
    description: "Dashboard routes require an authenticated Supabase session.",
    icon: LockKeyhole,
  },
  {
    label: "RBAC",
    status: "Layered",
    description: "Middleware, API guards, and database policies share the enforcement model.",
    icon: ShieldCheck,
  },
  {
    label: "High-risk routing",
    status: "Active",
    description: "Sensitive incidents bypass agent delivery and route to HR review.",
    icon: AlertTriangle,
  },
];

export default function SecurityEventsPage() {
  return (
    <PageContainer
      title="Security Events"
      description="Security posture and review queue for sensitive HR workflows."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <Card key={check.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10 text-blue-200">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline">{check.status}</Badge>
              </div>
              <h2 className="mt-4 text-sm font-semibold text-text-primary">{check.label}</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{check.description}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 border-amber-400/20 bg-amber-400/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <ShieldQuestion className="mt-1 h-5 w-5 text-amber-200" />
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Review operational security signals
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Full audit-log browsing is not built yet, but active HR security work is visible through the incident queue and org health dashboards.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/incident-queue">Incident Queue</Link>
            </Button>
            <Button asChild>
              <Link href="/org-health">Org Health</Link>
            </Button>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
