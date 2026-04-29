/**
 * User Management — List, invite, and manage employees.
 *
 * Connected to real API via usersAPI client.
 */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ModalContent } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { APIErrorFallback } from "@/components/domain/ErrorBoundary";
import { BulkUploadModal } from "@/components/domain/BulkUploadModal";
import { OrgChart, OrgChartSkeleton } from "@/components/domain/OrgChart";
import { usersAPI, hrAPI, type UserResponse, type APIError, type OrgChartNode, type OrgChartStats } from "@/lib/api/client";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Shield,
  TrendingUp,
  Clock,
  MoreHorizontal,
  Loader2,
  Upload,
  Network,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr_agent", label: "HR Agent" },
  { value: "company_admin", label: "Company Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "inactive", label: "Inactive" },
];

export default function TeamPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "org">("list");
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgChart, setOrgChart] = useState<{ tree: OrgChartNode[]; stats: OrgChartStats } | null>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { toast } = useToast();

  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Team" },
  ]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const result = await usersAPI.list(params);
      setUsers(result.users);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  const fetchOrgChart = useCallback(async () => {
    setOrgLoading(true);
    try {
      const result = await hrAPI.getOrgChart();
      setOrgChart(result);
    } catch (err) {
      console.error("Failed to load org chart:", err);
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === "org" && !orgChart) {
      void fetchOrgChart();
    }
  }, [activeTab, orgChart, fetchOrgChart]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const lower = search.toLowerCase();
    return users.filter(
      (u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    );
  }, [users, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      invited: users.filter((u) => u.status === "invited").length,
      withIncidents: 0, // Would require joining with incidents table
    }),
    [users],
  );

  const handleInvite = async (email: string, role: string) => {
    setInviteLoading(true);
    try {
      const result = await usersAPI.invite({ email, role });
      setInviteModalOpen(false);
      await fetchUsers();

      if (result.inviteLink) {
        try {
          await navigator.clipboard.writeText(result.inviteLink);
          toast({
            title: result.simulatedEmail ? "Invite link copied" : "Invitation sent",
            description: result.simulatedEmail
              ? "Email delivery is simulated in this environment. The invite link was copied to your clipboard so the tester can sign in immediately."
              : "Invitation created successfully. The invite link was copied to your clipboard.",
            variant: "success",
          });
        } catch {
          toast({
            title: result.simulatedEmail ? "Invite ready for testing" : "Invitation sent",
            description: result.inviteLink,
            variant: "info",
            duration: 10000,
          });
        }
      } else {
        toast({
          title: "Invitation sent",
          description: "The user was invited successfully.",
          variant: "success",
        });
      }
    } catch (err) {
      console.error("[team] Invite failed:", err);
      toast({
        title: "Invite failed",
        description: "The team member could not be invited.",
        variant: "error",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <PageContainer
      title="Team"
      description="Manage employees, roles, and invitations."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkUploadOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button size="sm" onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Members"
            value={stats.total}
            loading={loading}
          />
          <StatCard
            icon={<Shield className="h-5 w-5" />}
            label="Active"
            value={stats.active}
            loading={loading}
          />
          <StatCard
            icon={<Mail className="h-5 w-5" />}
            label="Pending Invites"
            value={stats.invited}
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="With Incidents"
            value={stats.withIncidents}
            loading={loading}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "org")}>
            <TabsList>
              <TabsTrigger value="list">
                <Users className="mr-2 h-4 w-4" />
                Team List
              </TabsTrigger>
              <TabsTrigger value="org">
                <Network className="mr-2 h-4 w-4" />
                Org Chart
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "org" && (
          <Card className="p-4">
            {orgLoading ? (
              <OrgChartSkeleton />
            ) : orgChart ? (
              <OrgChart tree={orgChart.tree} stats={orgChart.stats} />
            ) : (
              <OrgChartSkeleton />
            )}
          </Card>
        )}

        {activeTab === "list" && (
          <>
            <Card className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-9"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => setRoleFilter(v)}
                  placeholder="Filter by role..."
                  options={ROLE_OPTIONS}
                  className="w-full sm:w-40"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                  placeholder="Filter by status..."
                  options={STATUS_OPTIONS}
                  className="w-full sm:w-40"
                />
              </div>
            </Card>

            {error && (
              <APIErrorFallback
                error={error}
                retry={fetchUsers}
                message="Failed to load team members."
              />
            )}

            {loading && !error && (
              <Card className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              </Card>
            )}

            {!loading && !error && filteredUsers.length === 0 && (
              <Card className="p-6">
                <EmptyState
                  title="No team members found"
                  description="Try adjusting your filters or invite a new member."
                  icon={<Users className="h-8 w-8" />}
                />
              </Card>
            )}

            {!loading && !error && filteredUsers.length > 0 && (
              <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-brand-slate-dark border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Employee
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary sm:table-cell">
                      Role
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary md:table-cell">
                      Department
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary lg:table-cell">
                      Hire Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-slate-light text-xs font-semibold text-text-primary">
                            {user.first_name[0]}
                            {user.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="truncate text-xs text-text-tertiary">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="text-sm text-text-secondary">{user.role}</span>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="text-sm text-text-secondary">
                          {user.department_id ?? "—"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-sm text-text-tertiary">
                          {user.hire_date ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.status === "active"
                              ? "success"
                              : user.status === "invited"
                                ? "warning"
                                : "default"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="rounded p-1 text-text-tertiary hover:bg-brand-slate-light hover:text-text-primary">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        </>
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
        loading={inviteLoading}
      />

      <BulkUploadModal
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={fetchUsers}
      />
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Invite Modal
// ---------------------------------------------------------------------------

function InviteModal({
  open,
  onOpenChange,
  onInvite,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: string) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = async () => {
    if (!email || !role) return;
    await onInvite(email, role);
    setEmail("");
    setRole("");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <h3 className="text-lg font-semibold text-text-primary">Invite Team Member</h3>
        <p className="text-sm text-text-secondary">
          Send an invitation to join the HR platform.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@company.com"
              className="mt-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Role</label>
            <Select
              value={role}
              onValueChange={setRole}
              placeholder="Select role..."
              options={[
                { value: "employee", label: "Employee" },
                { value: "manager", label: "Manager" },
                { value: "hr_agent", label: "HR Agent" },
              ]}
              className="mt-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!email || !role || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light text-text-secondary">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-text-tertiary">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
