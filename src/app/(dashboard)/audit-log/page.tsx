/**
 * Audit Log Page — Searchable, filterable event history for HR agents and admins.
 */
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { auditLogAPI, type AuditLogEntry } from "@/lib/api/client";
import {
  Activity,
  Search,
  Loader2,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Shield,
  AlertTriangle,
  Settings,
  LogIn,
  GitBranch,
} from "lucide-react";

const ENTITY_FILTERS = [
  { value: "", label: "All Entities" },
  { value: "incidents", label: "Incidents" },
  { value: "disciplinary_actions", label: "Disciplinary Actions" },
  { value: "documents", label: "Documents" },
  { value: "signatures", label: "Signatures" },
  { value: "policies", label: "Policies" },
  { value: "users", label: "Users" },
  { value: "meetings", label: "Meetings" },
];

const ACTION_FILTERS = [
  { value: "", label: "All Actions" },
  { value: "insert", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
];

const ACTION_ICONS: Record<string, React.ReactNode> = {
  insert: <FileText className="h-4 w-4 text-brand-primary" />,
  update: <Settings className="h-4 w-4 text-brand-warning" />,
  delete: <AlertTriangle className="h-4 w-4 text-brand-error" />,
};

const ENTITY_COLORS: Record<string, string> = {
  incidents: "bg-red-50 text-red-700 border-red-200",
  disciplinary_actions: "bg-orange-50 text-orange-700 border-orange-200",
  documents: "bg-blue-50 text-blue-700 border-blue-200",
  signatures: "bg-purple-50 text-purple-700 border-purple-200",
  policies: "bg-green-50 text-green-700 border-green-200",
  users: "bg-slate-50 text-slate-700 border-slate-200",
  meetings: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDetail(details: Record<string, unknown> | null): string {
  if (!details) return "";
  if (details.changed_fields) {
    const changed = details.changed_fields as Record<string, unknown>;
    const keys = Object.keys(changed);
    if (keys.length === 0) return "No fields changed";
    if (keys.length <= 3) return keys.map((k) => String(k)).join(", ");
    return `${keys.slice(0, 3).map((k) => String(k)).join(", ")} +${keys.length - 3} more`;
  }
  return JSON.stringify(details).slice(0, 80);
}

export default function AuditLogPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Audit Log" },
  ]);

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const LIMIT = 50;

  async function loadEntries(resetCursor = true) {
    setLoading(true);
    try {
      const params = {
        entity_type: entityFilter || undefined,
        action: actionFilter || undefined,
        limit: LIMIT,
        ...(resetCursor ? {} : { cursor }),
      };
      const res = await auditLogAPI.list(params);
      setEntries(res.entries);
      setTotal(res.total);
      setHasMore(res.hasMore);
      if (!resetCursor && !res.hasMore) {
        setCursor(undefined);
      }
    } catch (err) {
      console.error("[audit-log] Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries(true);
  }, [entityFilter, actionFilter]);

  function handlePrev() {
    if (entries.length > 0) {
      const prev = entries[0].created_at;
      setCursor(prev);
      loadEntries(false);
    }
  }

  function handleNext() {
    if (hasMore && entries.length > 0) {
      const next = entries[entries.length - 1].created_at;
      setCursor(next);
      loadEntries(false);
    }
  }

  async function handleExport() {
    setDownloading(true);
    try {
      const allEntries: AuditLogEntry[] = [];
      let c: string | undefined;
      let hasMoreExport = true;
      while (hasMoreExport) {
        const res = await auditLogAPI.list({ entity_type: entityFilter || undefined, action: actionFilter || undefined, limit: 200, cursor: c });
        allEntries.push(...res.entries);
        hasMoreExport = res.hasMore;
        c = res.nextCursor;
      }
      const csv = [
        "Date,Time,User,Action,Entity Type,Entity ID,Details",
        ...allEntries.map((e) =>
          [
            formatDate(e.created_at),
            formatTime(e.created_at),
            e.user?.name ?? "System",
            e.action,
            e.entity_type,
            e.entity_id ?? "",
            formatDetail(e.details)?.replace(/"/g, '""'),
          ]
            .map((v) => `"${v}"`)
            .join(","),
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[audit-log] Export failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.user?.name?.toLowerCase().includes(q) ||
        e.user?.email?.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.entity_type.toLowerCase().includes(q) ||
        e.entity_id?.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const ENTITY_ICONS: Record<string, React.ReactNode> = {
    incidents: <AlertTriangle className="h-4 w-4" />,
    disciplinary_actions: <Activity className="h-4 w-4" />,
    documents: <FileText className="h-4 w-4" />,
    signatures: <GitBranch className="h-4 w-4" />,
    policies: <Shield className="h-4 w-4" />,
    users: <User className="h-4 w-4" />,
    meetings: <Activity className="h-4 w-4" />,
  };

  return (
    <PageContainer
      title="Audit Log"
      description="Immutable record of all system changes and actions."
    >
      <div className="flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search by user, entity, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={entityFilter}
            onValueChange={setEntityFilter}
            options={ENTITY_FILTERS}
            className="w-48"
            placeholder="All Entities"
          />
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
            options={ACTION_FILTERS}
            className="w-40"
            placeholder="All Actions"
          />
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={downloading || loading}
          >
            {downloading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            Export CSV
          </Button>
          <span className="ml-auto text-sm text-text-secondary">
            {total.toLocaleString()} {total === 1 ? "entry" : "entries"}
          </span>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-brand-slate-light/40">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">When</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">User</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Action</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Changes</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <EmptyState
                      title="No audit entries found"
                      description="Try adjusting your filters or search query."
                      icon={<Activity className="h-8 w-8 text-text-tertiary" />}
                    />
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-brand-slate-light/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-text-primary font-medium">{formatDate(entry.created_at)}</span>
                        <span className="text-xs text-text-tertiary">{formatTime(entry.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-text-primary">{entry.user?.name ?? "System"}</span>
                        <span className="text-xs text-text-tertiary">{entry.user?.email ?? ""}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {ACTION_ICONS[entry.action] ?? null}
                        <Badge variant="outline" className="capitalize">{entry.action}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium ${ENTITY_COLORS[entry.entity_type] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                        {ENTITY_ICONS[entry.entity_type] ?? <FileText className="h-3 w-3" />}
                        {entry.entity_type.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <span className="text-text-secondary text-xs truncate block" title={formatDetail(entry.details) ?? ""}>
                        {formatDetail(entry.details) || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {entry.entity_id ? (
                        <span className="font-mono text-xs text-text-tertiary">{entry.entity_id.slice(0, 8)}…</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-text-secondary">
              {loading ? "Loading..." : `${filteredEntries.length} of ${total.toLocaleString()} entries`}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={loading || !entries.length}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={loading || !hasMore}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}