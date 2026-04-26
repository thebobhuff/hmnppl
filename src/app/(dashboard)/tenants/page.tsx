"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  Loader2,
  Plus,
  Users,
  CreditCard,
  Pause,
  Play,
  Settings,
  ChevronRight,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: "trial" | "basic" | "pro" | "enterprise";
  status: "active" | "suspended" | "pending";
  userCount: number;
  monthlySpend: number;
  createdAt: string;
  lastActive: string;
}

const planColors: Record<string, "default" | "primary" | "warning" | "success"> = {
  trial: "default",
  basic: "primary",
  pro: "warning",
  enterprise: "success",
};

const planLabels: Record<string, string> = {
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function TenantsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Tenants" },
  ]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  useEffect(() => {
    setTimeout(() => {
      setTenants([
        { id: "1", name: "TechCorp Inc", email: "admin@techcorp.com", plan: "enterprise", status: "active", userCount: 245, monthlySpend: 2999, createdAt: "2025-06-15", lastActive: "2026-04-25" },
        { id: "2", name: "ScaleUp Solutions", email: "hello@scaleup.io", plan: "pro", status: "active", userCount: 89, monthlySpend: 599, createdAt: "2025-09-22", lastActive: "2026-04-26" },
        { id: "3", name: "Global Dynamics", email: "it@globaldyn.com", plan: "enterprise", status: "active", userCount: 412, monthlySpend: 2999, createdAt: "2025-03-10", lastActive: "2026-04-25" },
        { id: "4", name: "StartNow LLC", email: "founder@startnow.co", plan: "trial", status: "active", userCount: 12, monthlySpend: 0, createdAt: "2026-04-01", lastActive: "2026-04-24" },
        { id: "5", name: "Apex Industries", email: "hr@apexind.com", plan: "basic", status: "active", userCount: 34, monthlySpend: 199, createdAt: "2025-11-05", lastActive: "2026-04-23" },
        { id: "6", name: "DataFlow Systems", email: "admin@dataflow.dev", plan: "pro", status: "suspended", userCount: 67, monthlySpend: 599, createdAt: "2025-08-18", lastActive: "2026-03-15" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === "all" || tenant.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [tenants, searchQuery, planFilter]);

  const stats = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    totalMRR: tenants.reduce((sum, t) => sum + t.monthlySpend, 0),
    enterpriseCount: tenants.filter((t) => t.plan === "enterprise").length,
  }), [tenants]);

  return (
    <PageContainer
      title="Tenants"
      description="Multi-tenant SaaS management."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Building2 className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  <p className="text-xs text-text-tertiary">Total Tenants</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <Play className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
                  <p className="text-xs text-text-tertiary">Active</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <CreditCard className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">${stats.totalMRR.toLocaleString()}</p>
                  <p className="text-xs text-text-tertiary">Total MRR</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                  <Building2 className="h-5 w-5 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.enterpriseCount}</p>
                  <p className="text-xs text-text-tertiary">Enterprise</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Plans</option>
                <option value="trial">Trial</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </div>

          {/* Tenants Table */}
          {filteredTenants.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-text-tertiary" />
              <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                No Tenants Found
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {tenants.length === 0 ? "Add your first tenant to get started." : "No results match your search."}
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-brand-slate-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">Users</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">MRR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">Last Active</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                            <Building2 className="h-5 w-5 text-text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{tenant.name}</p>
                            <p className="text-xs text-text-tertiary">{tenant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={planColors[tenant.plan]}>{planLabels[tenant.plan]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tenant.status === "active" ? "success" : tenant.status === "suspended" ? "error" : "warning"}>
                          {tenant.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-text-secondary">
                          <Users className="h-3 w-3" />
                          {tenant.userCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary">
                          {tenant.monthlySpend > 0 ? `$${tenant.monthlySpend}` : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-tertiary">{new Date(tenant.lastActive).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            {tenant.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}