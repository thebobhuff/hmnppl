/**
 * Tenants — Super Admin tenant management.
 */

"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building, Users, MoreVertical, Plus } from "lucide-react";

export default function TenantsPage() {
  usePageBreadcrumbs([{ label: "Tenants" }]);
  const [search, setSearch] = useState("");

  const tenants = [
    { id: "1", name: "Acme Corp", status: "active", users: 248, plan: "enterprise" },
    { id: "2", name: "TechStart Inc", status: "active", users: 56, plan: "professional" },
    {
      id: "3",
      name: "Enterprise LLC",
      status: "active",
      users: 1240,
      plan: "enterprise",
    },
    { id: "4", name: "SmallBiz Co", status: "trial", users: 12, plan: "starter" },
  ];

  return (
    <PageContainer title="Tenants" description="Manage organizations on the platform.">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                    <Building className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{tenant.name}</p>
                    <p className="text-xs text-text-tertiary">{tenant.plan}</p>
                  </div>
                </div>
                <button className="text-text-tertiary hover:text-text-primary">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Users className="h-3 w-3 text-text-tertiary" />
                <span className="text-xs text-text-tertiary">{tenant.users} users</span>
              </div>
              <div className="mt-3">
                <Badge variant={tenant.status === "active" ? "success" : "warning"}>
                  {tenant.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
