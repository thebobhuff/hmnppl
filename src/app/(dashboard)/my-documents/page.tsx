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
  FileText,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { disciplinaryAPI } from "@/lib/api/client";

interface Document {
  id: string;
  action_type: string;
  status: string;
  incident_id?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

export default function MyDocumentsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Documents" },
  ]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    async function loadDocuments() {
      try {
        const res = await disciplinaryAPI.list(undefined, undefined, 50);
        if (active && res.actions) {
          setDocuments(res.actions.map((a: any) => ({
            id: a.id,
            action_type: a.action_type || "Document",
            status: a.status || "unknown",
            incident_id: a.incident_id,
            created_at: a.created_at,
            updated_at: a.updated_at,
            description: a.description,
          })));
        }
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDocuments();
    return () => { active = false; };
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.incident_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  const { pending, signed, disputed } = useMemo(() => ({
    pending: documents.filter((d) => d.status === "pending_signature"),
    signed: documents.filter((d) => d.status === "completed" || d.status === "signed"),
    disputed: documents.filter((d) => d.status === "disputed"),
  }), [documents]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_signature":
        return <Badge variant="warning">Awaiting Signature</Badge>;
      case "completed":
      case "signed":
        return <Badge variant="success">Signed</Badge>;
      case "disputed":
        return <Badge variant="error">Disputed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <PageContainer
      title="My Documents"
      description="Review and sign your disciplinary documents."
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
                  <FileText className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{documents.length}</p>
                  <p className="text-xs text-text-tertiary">Total Documents</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10">
                  <Clock className="h-5 w-5 text-brand-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{pending.length}</p>
                  <p className="text-xs text-text-tertiary">Awaiting Signature</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success/10">
                  <CheckCircle className="h-5 w-5 text-brand-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{signed.length}</p>
                  <p className="text-xs text-text-tertiary">Signed</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-error/10">
                  <AlertTriangle className="h-5 w-5 text-brand-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{disputed.length}</p>
                  <p className="text-xs text-text-tertiary">Disputed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-border bg-brand-slate-dark px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Status</option>
                <option value="pending_signature">Awaiting Signature</option>
                <option value="completed">Signed</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          {/* Document List */}
          {filteredDocuments.length === 0 ? (
            documents.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Documents
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  You have no documents assigned to you yet.
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  No Results Found
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Try adjusting your search or filters.
                </p>
              </Card>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredDocuments.map((doc) => {
                const isSigned = doc.status === "completed" || doc.status === "signed";
                const isDisputed = doc.status === "disputed";
                const isPending = doc.status === "pending_signature";

                return (
                  <Card key={doc.id} className="p-4 transition-colors hover:bg-card-hover">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                          <FileText className="h-5 w-5 text-text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-text-primary">
                            {doc.action_type}
                          </h3>
                          <p className="text-xs text-text-tertiary">
                            {doc.incident_id ? `INC-${doc.incident_id.slice(0, 4)}` : "Unreferenced"}
                          </p>
                          <p className="mt-1 text-xs text-text-tertiary">
                            Created: {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {isSigned && (
                      <div className="mt-3 rounded-lg border border-brand-success/30 bg-brand-success/10 p-2">
                        <p className="text-xs text-brand-success flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed: {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {isDisputed && (
                      <div className="mt-3 rounded-lg border border-brand-error/30 bg-brand-error/10 p-2">
                        <p className="text-xs text-brand-error flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Under review by HR
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {isPending ? (
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/documents/${doc.id}/sign`}>
                            Sign Document
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/documents/${doc.id}/view`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}