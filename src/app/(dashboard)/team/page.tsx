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
import { useToast } from "@/components/ui/toast";
import { APIErrorFallback } from "@/components/domain/ErrorBoundary";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  TrendingUp,
  Upload,
  Users,
  UserPlus,
  XCircle,
} from "lucide-react";
import {
  usersAPI,
  type APIError,
  type EmployeeImportResponse,
  type EmployeeImportRow,
  type UserResponse,
} from "@/lib/api/client";

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

const CSV_COLUMNS = [
  "email",
  "first_name",
  "last_name",
  "role",
  "job_title",
  "phone",
  "department",
  "manager_email",
  "hire_date",
];

const CSV_TEMPLATE = `${CSV_COLUMNS.join(",")}
alex.employee@example.com,Alex,Employee,employee,Sales Associate,555-0100,Sales,manager@example.com,2026-05-01`;

type CsvPreviewRow = EmployeeImportRow & {
  _row: number;
  _errors: string[];
};

export default function TeamPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<CsvPreviewRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<EmployeeImportResponse | null>(null);
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleImportFile = async (file: File | null) => {
    setImportResult(null);
    setImportRows([]);
    setImportError(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportError("Upload a .csv file.");
      return;
    }

    try {
      const text = await file.text();
      const rows = parseEmployeeCsv(text);
      setImportRows(rows);
      if (rows.length === 0) {
        setImportError("The CSV did not contain any employee rows.");
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to parse CSV.");
    }
  };

  const handleImport = async () => {
    const validRows = importRows.filter((row) => row._errors.length === 0);
    if (validRows.length === 0) {
      setImportError("Fix the CSV errors before importing.");
      return;
    }

    setImportLoading(true);
    setImportError(null);

    try {
      const response = await usersAPI.importEmployees({
        rows: validRows.map(({ _row, _errors, ...row }) => row),
      });
      setImportResult(response);
      await fetchUsers();
      toast({
        title: "CSV import complete",
        description: `${response.summary.invited} invited, ${response.summary.failed} failed, ${response.summary.skipped} skipped.`,
        variant: response.summary.failed > 0 ? "warning" : "success",
      });
    } catch (error) {
      console.error("[team] CSV import failed:", error);
      setImportError(error instanceof Error ? error.message : "CSV import failed.");
      toast({
        title: "CSV import failed",
        description: "The employee import could not be completed.",
        variant: "error",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportRows([]);
    setImportError(null);
    setImportResult(null);
  };

  return (
    <PageContainer
      title="Team"
      description="Manage employees, roles, and invitations."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
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

        {/* Filters */}
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

        {/* Error State */}
        {error && (
          <APIErrorFallback
            error={error}
            retry={fetchUsers}
            message="Failed to load team members."
          />
        )}

        {/* Loading State */}
        {loading && !error && (
          <Card className="p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </Card>
        )}

        {/* User Table */}
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
      </div>

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
        loading={inviteLoading}
      />
      <ImportCsvModal
        open={importModalOpen}
        onOpenChange={(open) => {
          setImportModalOpen(open);
          if (!open) resetImport();
        }}
        rows={importRows}
        error={importError}
        loading={importLoading}
        result={importResult}
        onFile={handleImportFile}
        onImport={handleImport}
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
// CSV Import Modal
// ---------------------------------------------------------------------------

function ImportCsvModal({
  open,
  onOpenChange,
  rows,
  error,
  loading,
  result,
  onFile,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: CsvPreviewRow[];
  error: string | null;
  loading: boolean;
  result: EmployeeImportResponse | null;
  onFile: (file: File | null) => void;
  onImport: () => Promise<void>;
}) {
  const invalidRows = rows.filter((row) => row._errors.length > 0).length;
  const validRows = rows.length - invalidRows;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" className="max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Import Team Members
            </h3>
            <p className="text-sm text-text-secondary">
              Upload a CSV to invite employees and attach manager, department, and job
              details.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={downloadCsvTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-brand-slate-light px-4 py-8 text-center transition-colors hover:bg-card-hover">
            <FileSpreadsheet className="h-8 w-8 text-text-tertiary" />
            <span className="text-sm font-medium text-text-primary">
              Choose a CSV file
            </span>
            <span className="text-xs text-text-tertiary">
              Required column: email. Optional: first_name, last_name, role, job_title,
              phone, department, department_id, manager_email, manager_id, hire_date.
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-brand-error/30 bg-brand-error/5 p-3 text-sm text-text-secondary">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-error" />
            <span>{error}</span>
          </div>
        )}

        {rows.length > 0 && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{validRows} ready</Badge>
              {invalidRows > 0 && <Badge variant="error">{invalidRows} invalid</Badge>}
              <span className="text-xs text-text-tertiary">
                Imports are capped at 100 rows per CSV.
              </span>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-brand-slate-dark border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-tertiary">
                      Row
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-tertiary">
                      Employee
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-tertiary">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-tertiary">
                      Department
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-tertiary">
                      Manager
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-tertiary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.slice(0, 25).map((row) => (
                    <tr key={`${row._row}-${row.email}`}>
                      <td className="px-3 py-2 text-sm text-text-tertiary">{row._row}</td>
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium text-text-primary">
                          {row.first_name || row.last_name
                            ? `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim()
                            : "Invited user"}
                        </p>
                        <p className="text-xs text-text-tertiary">{row.email}</p>
                      </td>
                      <td className="px-3 py-2 text-sm text-text-secondary">
                        {row.role ?? "employee"}
                      </td>
                      <td className="px-3 py-2 text-sm text-text-secondary">
                        {row.department || row.department_id || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-text-secondary">
                        {row.manager_email || row.manager_id || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row._errors.length === 0 ? (
                          <Badge variant="success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="error">
                            <XCircle className="mr-1 h-3 w-3" />
                            {row._errors[0]}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 25 && (
              <p className="text-xs text-text-tertiary">
                Showing first 25 rows of {rows.length}.
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="grid gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{result.summary.invited} invited</Badge>
              {result.summary.failed > 0 && (
                <Badge variant="error">{result.summary.failed} failed</Badge>
              )}
              {result.summary.skipped > 0 && (
                <Badge variant="warning">{result.summary.skipped} skipped</Badge>
              )}
            </div>
            {result.results.some((item) => item.status !== "invited") && (
              <div className="max-h-40 overflow-auto rounded-md border border-border">
                {result.results
                  .filter((item) => item.status !== "invited")
                  .map((item) => (
                    <div
                      key={`${item.row}-${item.email}`}
                      className="border-b border-border px-3 py-2 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-text-primary">
                        Row {item.row}: {item.email}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {item.errors?.join(" ") ?? item.status}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            onClick={onImport}
            disabled={loading || validRows === 0 || invalidRows > 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import and Invite
          </Button>
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

function parseEmployeeCsv(text: string): CsvPreviewRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];

  const headers = table[0].map((header) => normalizeHeader(header));
  const emailIndex = headers.indexOf("email");
  if (emailIndex === -1) {
    throw new Error("CSV must include an email column.");
  }

  return table
    .slice(1)
    .map((values, index) => {
      const raw = Object.fromEntries(
        headers.map((header, headerIndex) => [header, values[headerIndex]?.trim() ?? ""]),
      );
      const row: CsvPreviewRow = {
        _row: index + 2,
        _errors: [],
        email: raw.email ?? "",
        first_name: raw.first_name,
        last_name: raw.last_name,
        role: normalizeRole(raw.role),
        job_title: raw.job_title,
        phone: raw.phone,
        department: raw.department,
        department_id: raw.department_id,
        manager_email: raw.manager_email,
        manager_id: raw.manager_id,
        hire_date: raw.hire_date,
      };

      row._errors = validateCsvPreviewRow(row);
      return compactImportRow(row);
    })
    .filter((row) =>
      Object.entries(row).some(
        ([key, value]) =>
          !key.startsWith("_") && typeof value === "string" && value.trim() !== "",
      ),
    );
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);

  return rows.filter((csvRow) => csvRow.some((cell) => cell.trim().length > 0));
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replaceAll(" ", "_");
}

function normalizeRole(value: string | undefined): EmployeeImportRow["role"] {
  const role = value?.trim().toLowerCase();
  if (role === "manager" || role === "hr_agent" || role === "employee") {
    return role;
  }
  return role ? undefined : "employee";
}

function validateCsvPreviewRow(row: CsvPreviewRow) {
  const errors: string[] = [];
  if (!row.email) {
    errors.push("Missing email");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push("Invalid email");
  }
  if (!row.role) {
    errors.push("Invalid role");
  }
  if (row.hire_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.hire_date)) {
    errors.push("Invalid hire date");
  }
  return errors;
}

function compactImportRow(row: CsvPreviewRow): CsvPreviewRow {
  const compacted: CsvPreviewRow = {
    _row: row._row,
    _errors: row._errors,
    email: row.email.trim(),
  };

  for (const key of [
    "first_name",
    "last_name",
    "role",
    "job_title",
    "phone",
    "department",
    "department_id",
    "manager_email",
    "manager_id",
    "hire_date",
  ] as const) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      compacted[key] = value.trim() as never;
    }
  }

  return compacted;
}

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "team-import-template.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
