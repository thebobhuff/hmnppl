/**
 * Employee Portal — Pending & Signed Documents
 *
 * Card-based list of pending documents (with CTA to sign)
 * and signed documents (with checkmarks).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usersAPI, type EmployeeDocumentItem } from "@/lib/api/client";

export default function DocumentsPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Documents" }]);

  const [documents, setDocuments] = useState<EmployeeDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const pendingDocs = useMemo(
    () => documents.filter((d) => d.status === "pending_signature"),
    [documents],
  );
  const signedDocs = useMemo(
    () => documents.filter((d) => d.status === "signed"),
    [documents],
  );
  const disputedDocs = useMemo(
    () => documents.filter((d) => d.status === "disputed"),
    [documents],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const data = await usersAPI.getMyDocuments();
        if (!cancelled) {
          setDocuments(data.documents);
        }
      } catch {
        if (!cancelled) {
          setDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer
      title="My Documents"
      description="Review and sign your disciplinary documents."
    >
      <div className="grid gap-6">
        {/* Pending Documents */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
            <Clock className="h-5 w-5 text-brand-warning" />
            Pending Signature
            {pendingDocs.length > 0 && (
              <Badge variant="warning">{pendingDocs.length}</Badge>
            )}
          </h2>

          {loading && (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          )}

          {!loading && pendingDocs.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="All caught up!"
                description="No documents are awaiting your signature."
                icon={<CheckCircle className="h-8 w-8 text-brand-success" />}
              />
            </Card>
          ) : !loading ? (
            <div className="grid gap-3">
              {pendingDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Disputed Documents */}
        {!loading && disputedDocs.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
              <AlertTriangle className="h-5 w-5 text-brand-error" />
              Disputed
              <Badge variant="error">{disputedDocs.length}</Badge>
            </h2>
            <div className="grid gap-3">
              {disputedDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        )}

        {/* Signed Documents */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
            <CheckCircle className="h-5 w-5 text-brand-success" />
            Signed Documents
          </h2>

          {loading && (
            <div className="grid gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          )}

          {!loading && signedDocs.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No signed documents"
                description="Once you sign documents, they will appear here."
                icon={<FileText className="h-8 w-8" />}
              />
            </Card>
          ) : !loading ? (
            <div className="grid gap-3">
              {signedDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Document Card
// ---------------------------------------------------------------------------

function DocumentCard({ doc }: { doc: EmployeeDocumentItem }) {
  const statusConfig = {
    pending_signature: {
      badge: "warning" as const,
      label: "Awaiting Signature",
      icon: <Clock className="h-4 w-4 text-brand-warning" />,
      action: (
        <Button asChild size="sm">
          <Link href={`/documents/${doc.id}/sign`}>
            Review & Sign
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
    signed: {
      badge: "success" as const,
      label: `Signed ${formatShortDate(doc.signedAt ?? doc.createdAt)}`,
      icon: <CheckCircle className="h-4 w-4 text-brand-success" />,
      action: null,
    },
    disputed: {
      badge: "error" as const,
      label: "Disputed — Under Review",
      icon: <AlertTriangle className="h-4 w-4 text-brand-error" />,
      action: null,
    },
  };

  const config = statusConfig[doc.status];

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-slate-light">
          {config.icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{doc.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">{doc.reference}</span>
            <Badge variant={config.badge}>{config.label}</Badge>
          </div>
          {doc.status === "pending_signature" && (
            <p className="mt-1 text-xs text-brand-warning">
              Issued: {formatShortDate(doc.createdAt)}
            </p>
          )}
        </div>
      </div>
      {config.action}
    </Card>
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
