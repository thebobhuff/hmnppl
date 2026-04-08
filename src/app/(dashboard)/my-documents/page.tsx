/**
 * My Documents — Employee's documents (disciplinary, PIP, signed docs).
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Download, Eye, Clock, CheckCircle, PenTool } from "lucide-react";
import Link from "next/link";
import { usersAPI, type EmployeeDocumentItem } from "@/lib/api/client";

export default function MyDocumentsPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Documents" }]);

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<EmployeeDocumentItem[]>([]);

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

  const statusIcons = {
    pending_signature: <Clock className="h-4 w-4 text-brand-warning" />,
    signed: <CheckCircle className="h-4 w-4 text-brand-success" />,
    disputed: <Clock className="h-4 w-4 text-brand-error" />,
  };

  return (
    <PageContainer title="My Documents" description="View and sign your documents.">
      <div className="space-y-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No documents"
            description="You don't have any documents to review."
          />
        )}

        {!loading && documents.length > 0 && (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-slate-light">
                      <FileText className="h-5 w-5 text-text-tertiary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-text-primary">{doc.title}</h3>
                        {statusIcons[doc.status]}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">{doc.type}</Badge>
                        <span className="text-xs text-text-tertiary">
                          Created {formatShortDate(doc.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-text-tertiary">
                        {doc.reference}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/documents/${doc.id}/sign`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    {doc.status === "pending_signature" && (
                      <Button size="sm" asChild>
                        <Link href={`/documents/${doc.id}/sign`}>
                          <PenTool className="mr-1 h-4 w-4" />
                          Sign
                        </Link>
                      </Button>
                    )}
                    {doc.status === "signed" && (
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
                {doc.status === "pending_signature" && (
                  <p className="mt-3 text-xs text-brand-warning">
                    Issued on {formatShortDate(doc.createdAt)}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
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
