/**
 * Document Signing — Employee signs or disputes disciplinary documents.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { csrfFetch } from "@/lib/csrf-client";
import {
  AlertTriangle,
  CheckCircle,
  Eraser,
  FileText,
  Loader2,
  Pen,
  Shield,
  Type,
} from "lucide-react";
import Link from "next/link";

interface EmployeeDocumentDetail {
  id: string;
  reference: string;
  title: string;
  type: string;
  content: string | null;
  status: string;
  action_type: string;
  signed_at: string | null;
  disputed: boolean;
}

const SIGNATURE_FONTS = [
  { name: "Script", value: "'Dancing Script', cursive" },
  { name: "Handwriting", value: "'Caveat', cursive" },
  { name: "Formal", value: "'Playfair Display', serif" },
];

export default function DocumentSigningPage() {
  const params = useParams();
  const documentId = params?.id as string;

  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Documents", href: "/documents" },
    { label: "Sign Document" },
  ]);

  const [document, setDocument] = useState<EmployeeDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [signed, setSigned] = useState(false);
  const [disputed, setDisputed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    async function loadDocument() {
      try {
        const res = await fetch(`/api/v1/documents/${documentId}`);
        if (!res.ok) throw new Error(`Failed to load document: ${res.status}`);
        const json = (await res.json()) as { document: EmployeeDocumentDetail };
        if (active) {
          setDocument(json.document);
          setSigned(Boolean(json.document.signed_at) || json.document.status === "signed");
          setDisputed(json.document.disputed || json.document.status === "disputed");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load document");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (documentId) loadDocument();
    return () => {
      active = false;
    };
  }, [documentId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ffd900";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [signatureMode]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCanvasPoint(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    },
    [getCanvasPoint],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCanvasPoint(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, getCanvasPoint],
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getSignatureData = () => {
    if (signatureMode === "type") return typedSignature.trim();
    return canvasRef.current?.toDataURL() ?? "";
  };

  const handleConfirmSign = async () => {
    if (!document) return;
    const signatureData = getSignatureData();
    if (!signatureData) return;

    setSubmitting(true);
    try {
      const res = await csrfFetch(`/api/v1/documents/${document.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureType: signatureMode === "draw" ? "drawn" : "typed",
          signatureData,
        }),
      });
      if (!res.ok) throw new Error(`Failed to sign document: ${res.status}`);
      setConfirmModalOpen(false);
      setSigned(true);
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : "Failed to sign document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!document || disputeReason.length < 50) return;

    setSubmitting(true);
    try {
      const res = await csrfFetch(`/api/v1/documents/${document.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason }),
      });
      if (!res.ok) throw new Error(`Failed to dispute document: ${res.status}`);
      setDisputeModalOpen(false);
      setDisputed(true);
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Failed to dispute document");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Sign Document">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !document) {
    return (
      <PageContainer title="Document Unavailable">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-brand-error" />
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Document Unavailable
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {error ?? "This document could not be found."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/documents">Back to Documents</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (signed) {
    return (
      <PageContainer title="Document Signed">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-brand-success" />
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Document Signed Successfully
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your signature has been recorded.
          </p>
          <div className="mt-4 rounded-lg bg-brand-slate-light p-3 text-left">
            <p className="text-xs text-text-tertiary">Document</p>
            <p className="text-sm font-medium text-text-primary">{document.title}</p>
            <p className="mt-1 text-xs text-text-tertiary">Reference: {document.reference}</p>
            <p className="text-xs text-text-tertiary">
              Signed: {new Date().toLocaleString()}
            </p>
          </div>
          <Button asChild className="mt-6">
            <Link href="/documents">Back to Documents</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (disputed) {
    return (
      <PageContainer title="Document Disputed">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-brand-error" />
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Dispute Submitted
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your dispute has been sent to HR for review.
          </p>
          <Button asChild className="mt-6">
            <Link href="/documents">Back to Documents</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Sign Document" description={document.title}>
      <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-text-secondary" />
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {document.title}
              </h2>
            </div>
            <Badge variant="warning">{formatLabel(document.type)}</Badge>
          </div>

          <div className="bg-brand-slate-dark max-h-[500px] overflow-y-auto rounded-lg border border-border p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-secondary">
              {document.content ?? "No inline document content is available."}
            </pre>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Shield className="h-4 w-4" />
              Document Context
            </h3>
            <p className="text-sm font-medium text-text-primary">
              {formatLabel(document.action_type)}
            </p>
            <p className="text-xs text-text-secondary">Reference {document.reference}</p>
            <p className="mt-2 text-xs text-text-tertiary">
              This document was generated from the approved disciplinary action and company policy snapshot.
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Acknowledgment</h3>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
              />
              <p className="text-sm text-text-secondary">
                I acknowledge receipt and understanding of this document. I understand the required actions and consequences of non-compliance.
              </p>
            </label>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Your Signature</h3>
            <div className="mb-3 flex gap-1 rounded-lg bg-brand-slate-light p-1">
              <button
                onClick={() => setSignatureMode("draw")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  signatureMode === "draw"
                    ? "bg-brand-primary text-text-inverse"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <Pen className="h-3.5 w-3.5" />
                Draw
              </button>
              <button
                onClick={() => setSignatureMode("type")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  signatureMode === "type"
                    ? "bg-brand-primary text-text-inverse"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                Type
              </button>
            </div>

            {signatureMode === "draw" ? (
              <div>
                <div className="relative rounded-lg border border-border bg-white">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={120}
                    className="w-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={() => setIsDrawing(false)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearCanvas} className="mt-2">
                  <Eraser className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full name"
                  className="bg-brand-slate-dark w-full rounded-md border border-border px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  style={{
                    fontFamily: SIGNATURE_FONTS[selectedFont].value,
                    fontSize: "1.25rem",
                  }}
                />
                <div className="mt-2 flex gap-1">
                  {SIGNATURE_FONTS.map((font, i) => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(i)}
                      className={`rounded px-2 py-1 text-xs transition-colors ${
                        selectedFont === i
                          ? "bg-brand-primary text-text-inverse"
                          : "bg-brand-slate-light text-text-tertiary hover:text-text-secondary"
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="grid gap-2">
            <Button onClick={() => setConfirmModalOpen(true)} disabled={!acknowledged} size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              Sign Document
            </Button>
            <Button variant="outline" onClick={() => setDisputeModalOpen(true)} size="sm">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Dispute This Document
            </Button>
          </div>
        </div>
      </div>

      <Modal open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Confirm Signature</ModalTitle>
            <ModalDescription>
              This signature is legally binding under the ESIGN Act and UETA.
            </ModalDescription>
          </ModalHeader>
          <ul className="list-inside space-y-1 py-2 text-sm text-text-secondary">
            <li>- You have read and understood this document</li>
            <li>- You consent to electronic signature</li>
            <li>- Your signature will be recorded with timestamp and device information</li>
          </ul>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSign} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-1.5 h-4 w-4" />
              )}
              Confirm & Sign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Dispute Document</ModalTitle>
            <ModalDescription>
              If you disagree with the contents of this document, submit a dispute for HR review.
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-3 py-2">
            <label className="block text-sm font-medium text-text-primary">
              Reason for Dispute <span className="text-brand-error">*</span>
            </label>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain why you are disputing this document..."
              className="min-h-[100px]"
              maxLength={2000}
            />
            <p
              className={`text-xs ${
                disputeReason.length < 50 && disputeReason.length > 0
                  ? "text-brand-error"
                  : "text-text-tertiary"
              }`}
            >
              {disputeReason.length}/2000 (minimum 50 characters)
            </p>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDispute} disabled={disputeReason.length < 50 || submitting}>
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Submit Dispute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
