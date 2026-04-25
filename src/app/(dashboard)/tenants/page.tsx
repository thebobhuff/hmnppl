import Link from "next/link";
import { Building2, Settings, ShieldCheck, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const tenantReadiness = [
  {
    label: "Company workspaces",
    value: "Configured",
    description: "Signup and onboarding create tenant-scoped company records.",
    icon: Building2,
  },
  {
    label: "Tenant RBAC",
    value: "Active",
    description: "Routes and APIs enforce role-specific access checks.",
    icon: ShieldCheck,
  },
  {
    label: "Team management",
    value: "Connected",
    description: "Company admins can invite and manage users from Team.",
    icon: Users,
  },
];

export default function TenantsPage() {
  return (
    <PageContainer
      title="Tenants"
      description="Operational overview for company workspaces and tenant readiness."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {tenantReadiness.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="success">{item.value}</Badge>
              </div>
              <h2 className="mt-4 text-sm font-semibold text-text-primary">{item.label}</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{item.description}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Manage tenant configuration
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Use Team and Settings for the current tenant until the global super-admin console is expanded.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/team">
                <Users className="mr-2 h-4 w-4" />
                Team
              </Link>
            </Button>
            <Button asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
