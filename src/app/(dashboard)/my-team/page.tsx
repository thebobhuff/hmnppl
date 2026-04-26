"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { incidentsAPI } from "@/lib/api/client";

interface DirectReport {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  avatarUrl?: string;
  riskLevel?: "low" | "medium" | "high";
  pendingIncidents?: number;
}

export default function MyTeamPage() {
  const user = useAuthStore((s) => s.user);
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Team" },
  ]);

  const [team, setTeam] = useState<DirectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTeam() {
      try {
        const res = await incidentsAPI.getDirectReports();
        if (active) {
          const reportsWithRisk = res.directReports.map((r: any) => ({
            ...r,
            riskLevel: "low" as const,
            pendingIncidents: 0,
          }));
          setTeam(reportsWithRisk);
        }
      } catch (err) {
        console.error("Failed to load team", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTeam();
    return () => { active = false; };
  }, []);

  const filteredTeam = team.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const email = member.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge variant="error">High Risk</Badge>;
      case "medium":
        return <Badge variant="warning">Medium Risk</Badge>;
      default:
        return <Badge variant="success">Good Standing</Badge>;
    }
  };

  const stats = {
    total: team.length,
    goodStanding: team.filter((m) => m.riskLevel === "low").length,
    mediumRisk: team.filter((m) => m.riskLevel === "medium").length,
    highRisk: team.filter((m) => m.riskLevel === "high").length,
  };

  return (
    <PageContainer
      title="My Team"
      description="Manage your direct reports and track their status."
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
                  <Users className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  <p className="text-xs text-text-tertiary">Total Reports</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <CheckCircle className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.goodStanding}</p>
                  <p className="text-xs text-text-tertiary">Good Standing</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Clock className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.mediumRisk}</p>
                  <p className="text-xs text-text-tertiary">Medium Risk</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                  <AlertTriangle className="h-5 w-5 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.highRisk}</p>
                  <p className="text-xs text-text-tertiary">High Risk</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button asChild>
              <Link href="/report-issue">
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </Button>
          </div>

          {/* Team Grid */}
          {filteredTeam.length === 0 ? (
            team.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Direct Reports
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  You don&apos;t have any direct reports assigned yet.
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Results Found
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Try adjusting your search query.
                </p>
              </Card>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeam.map((member) => (
                <Card key={member.id} className="p-4 transition-colors hover:bg-card-hover">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-slate-light text-lg font-semibold text-text-primary">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-sm font-medium text-text-primary">
                        {member.first_name} {member.last_name}
                      </h3>
                      <p className="truncate text-xs text-text-tertiary">{member.job_title || "Employee"}</p>
                      <p className="truncate text-xs text-text-tertiary">{member.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {getRiskBadge(member.riskLevel || "low")}
                    {member.pendingIncidents && member.pendingIncidents > 0 ? (
                      <Badge variant="warning">
                        <FileText className="mr-1 h-3 w-3" />
                        {member.pendingIncidents} pending
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/employees/${member.id}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="default">
                      <Link href={`/report-issue?employee=${member.id}`}>
                        Report Issue
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
