/**
 * Employee Portal — Pending & Signed Documents
 *
 * Card-based list of pending documents (with CTA to sign)
 * and signed documents (with checkmarks).
 */
"use client";

import { useMemo, useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface EmployeeDocument {
  id: string;
  title: string;
  type: string;
  status: "pending_signature" | "signed" | "disputed";
  reference: string;
  createdAt: string;
  signedAt: string | null;
}

export default function EmployeeDocumentsPage() {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Documents" },
  ]);

  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDocs() {
      try {
        const res = await fetch("/api/v1/users/me/documents");
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        const json = (await res.json()) as { documents: EmployeeDocument[] };
        if (active) setDocs(json.documents);
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDocs();
    return () => { active = false };
  }, []);

  const pendingDocs = useMemo(
    () => docs.filter((d) => d.status === "pending_signature"),
    [docs],
  );
  const signedDocs = useMemo(
    () => docs.filter((d) => d.status === "signed"),
    [docs],
  );
  const disputedDocs = useMemo(
    () => docs.filter((d) => d.status === "disputed"),
    [docs],
  );

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

            {pendingDocs.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="All caught up"
                  description="You have no pending documents."
                  icon={<FileText className="h-8 w-8" />}
                />
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pendingDocs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </div>

          {/* Disputed Documents */}
          {disputedDocs.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
                <AlertTriangle className="h-5 w-5 text-brand-error" />
                Disputed Documents
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {disputedDocs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} isDisputed />
                ))}
              </div>
            </div>
          )}

          {/* Signed Documents */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
              <CheckCircle className="h-5 w-5 text-brand-success" />
              Completed & Signed
            </h2>
            {signedDocs.length === 0 ? (
              <p className="text-sm text-text-tertiary">No completed documents yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {signedDocs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} isSigned />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function DocumentCard({
  doc,
  isSigned,
  isDisputed,
}: {
  doc: EmployeeDocument;
  isSigned?: boolean;
  isDisputed?: boolean;
}) {
  return (
    <Card className="p-4 transition-colors hover:bg-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{doc.title}</h3>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {doc.reference} • {doc.type}
          </p>
        </div>
        {!isSigned && !isDisputed ? (
          <Badge variant="warning">Awaiting Signature</Badge>
        ) : isDisputed ? (
          <Badge variant="error">Disputed</Badge>
        ) : (
          <Badge variant="success">Signed</Badge>
        )}
      </div>

      <div className="mt-3 text-xs text-text-secondary">
        {isSigned ? (
          <span className="flex items-center gap-1 text-brand-success">
            <CheckCircle className="h-3 w-3" />
            Completed: {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : "Signed"}
          </span>
        ) : isDisputed ? (
          <span className="flex items-center gap-1 text-brand-error">
            <AlertTriangle className="h-3 w-3" />
            Under review by HR
          </span>
        ) : (
          <span className="flex items-center gap-1 text-brand-warning">
            <Clock className="h-3 w-3" />
            Created: {new Date(doc.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button asChild size="sm" variant={isSigned || isDisputed ? "outline" : "default"}>
          <Link href={`/documents/${doc.id}/sign`}>
            {isSigned || isDisputed ? "View Details" : "Sign Document"}
            {(!isSigned && !isDisputed) && <ArrowRight className="ml-2 h-4 w-4" />}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
