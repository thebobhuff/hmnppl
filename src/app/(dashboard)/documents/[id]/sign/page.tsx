/**
 * Document Signing — Employee signs disciplinary documents.
 *
 * Features:
 * - Full document render in readable format
 * - "View referenced policy" side panel
 * - Acknowledgment checkbox (required)
 * - E-Signature Canvas (draw + type modes)
 * - Dispute button (if company enables it)
 * - Confirmation modal with legal language
 * - Signature captures: IP, timestamp, user agent, SHA-256 hash
 */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Pen,
  Type,
  Undo2,
  Eraser,
  CheckCircle,
  AlertTriangle,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_DOCUMENT = {
  id: "1",
  reference: "INC-2026-0042",
  title: "Written Warning — Attendance Policy",
  type: "Written Warning",
  content: `WRITTEN WARNING — ATTENDANCE POLICY VIOLATION

Employee: John Smith
Position: Software Engineer
Department: Engineering
Date: March 15, 2026
Reference: INC-2026-0042

INCIDENT SUMMARY

On March 15, 2026, the above-named employee arrived 45 minutes late to work without providing prior notice to their supervisor. This marks the third documented occurrence of tardiness within the current calendar month.

POLICY VIOLATION

This incident constitutes a violation of the Attendance & Punctuality Policy, Section 3.2: "Repeated Tardiness." The policy states that three or more unexcused late arrivals within a 30-day period warrant a written warning.

PREVIOUS INCIDENTS

1. INC-2026-0028 (Feb 12, 2026) — 20 minutes late, verbal warning issued
2. INC-2026-0035 (Mar 1, 2026) — 30 minutes late, verbal warning issued

REQUIRED ACTIONS

1. Employee must arrive on time for all scheduled shifts for the next 60 days
2. Employee must notify supervisor at least 1 hour before scheduled start time if unable to arrive on time
3. Employee must attend the scheduled meeting with HR representative

CONSEQUENCES OF NON-COMPLIANCE

Failure to comply with the above requirements may result in further disciplinary action, up to and including a Performance Improvement Plan (PIP) or termination of employment.

EMPLOYEE ACKNOWLEDGMENT

I acknowledge receipt of this written warning. I understand the required actions and consequences of non-compliance.

HR Representative: Maria Garcia
Date: ___________`,
  policyReference: {
    title: "Attendance & Punctuality Policy",
    section: "Section 3.2 — Repeated Tardiness",
    content:
      "Three or more unexcused late arrivals within a 30-day period shall result in progressive disciplinary action: (1) Verbal Warning, (2) Written Warning, (3) Performance Improvement Plan, (4) Termination Review.",
  },
};

const SIGNATURE_FONTS = [
  { name: "Script", value: "'Dancing Script', cursive" },
  { name: "Handwriting", value: "'Caveat', cursive" },
  { name: "Formal", value: "'Playfair Display', serif" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentSigningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const breadcrumbs = usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "My Documents", href: "/documents" },
    { label: `Sign: ${MOCK_DOCUMENT.title}` },
  ]);

  const [showPolicy, setShowPolicy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [signed, setSigned] = useState(false);
  const [disputed, setDisputed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ffd900";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

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
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
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

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleSign = () => {
    if (!acknowledged) return;
    setConfirmModalOpen(true);
  };

  const handleConfirmSign = () => {
    // Capture signature data
    let signatureData = "";
    if (signatureMode === "draw" && canvasRef.current) {
      signatureData = canvasRef.current.toDataURL();
    } else {
      signatureData = typedSignature;
    }

    // Compute SHA-256 hash
    const contentToHash =
      MOCK_DOCUMENT.content + signatureData + new Date().toISOString();
    // In production: crypto.subtle.digest("SHA-256", new TextEncoder().encode(contentToHash))
    const mockHash = btoa(contentToHash).substring(0, 64);

    // Submit to API
    console.log("Signing document:", {
      documentId: MOCK_DOCUMENT.id,
      signatureType: signatureMode,
      signatureData: signatureData.substring(0, 50) + "...",
      ip: "192.168.1.1", // Would come from server
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      contentHash: mockHash,
    });

    setConfirmModalOpen(false);
    setSigned(true);
  };

  const handleDispute = () => {
    if (disputeReason.length < 50) return;
    console.log("Disputing document:", {
      documentId: MOCK_DOCUMENT.id,
      reason: disputeReason,
      timestamp: new Date().toISOString(),
    });
    setDisputeModalOpen(false);
    setDisputed(true);
  };

  if (signed) {
    return (
      <PageContainer title="Document Signed" description="">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-brand-success" />
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Document Signed Successfully
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your signature has been recorded. A copy has been emailed to you.
          </p>
          <div className="mt-4 rounded-lg bg-brand-slate-light p-3 text-left">
            <p className="text-xs text-text-tertiary">Document</p>
            <p className="text-sm font-medium text-text-primary">{MOCK_DOCUMENT.title}</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Reference: {MOCK_DOCUMENT.reference}
            </p>
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
      <PageContainer title="Document Disputed" description="">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-brand-error" />
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Dispute Submitted
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your dispute has been sent to HR for review. You will be notified of the
            outcome.
          </p>
          <Button asChild className="mt-6">
            <Link href="/documents">Back to Documents</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Sign Document" description={MOCK_DOCUMENT.title}>
      <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
        {/* Document Content */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-text-secondary" />
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {MOCK_DOCUMENT.title}
              </h2>
            </div>
            <Badge variant="warning">{MOCK_DOCUMENT.type}</Badge>
          </div>

          <div className="bg-brand-slate-dark max-h-[500px] overflow-y-auto rounded-lg border border-border p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-secondary">
              {MOCK_DOCUMENT.content}
            </pre>
          </div>
        </Card>

        {/* Right Panel */}
        <div className="grid gap-4">
          {/* Policy Reference */}
          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Shield className="h-4 w-4" />
              Referenced Policy
            </h3>
            <p className="text-sm font-medium text-text-primary">
              {MOCK_DOCUMENT.policyReference.title}
            </p>
            <p className="text-xs text-text-secondary">
              {MOCK_DOCUMENT.policyReference.section}
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              {MOCK_DOCUMENT.policyReference.content}
            </p>
          </Card>

          {/* Acknowledgment */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Acknowledgment
            </h3>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
              />
              <p className="text-sm text-text-secondary">
                I acknowledge receipt and understanding of this document. I understand the
                required actions and consequences of non-compliance.
              </p>
            </label>
          </Card>

          {/* Signature */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Your Signature
            </h3>

            {/* Mode Selector */}
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

            {/* Draw Mode */}
            {signatureMode === "draw" && (
              <div>
                <div className="relative rounded-lg border border-border bg-white">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={120}
                    className="w-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearCanvas}>
                    <Eraser className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Type Mode */}
            {signatureMode === "type" && (
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

          {/* Actions */}
          <div className="grid gap-2">
            <Button onClick={handleSign} disabled={!acknowledged} size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              Sign Document
            </Button>

            {/* Dispute (if enabled) */}
            <Button variant="outline" onClick={() => setDisputeModalOpen(true)} size="sm">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Dispute This Document
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Sign Modal */}
      <Modal open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Confirm Signature</h3>
          <p className="text-sm text-text-secondary">
            This signature is legally binding under the ESIGN Act and UETA. By confirming,
            you acknowledge that:
          </p>
          <ul className="list-inside space-y-1 text-sm text-text-secondary">
            <li>• You have read and understood this document</li>
            <li>• You consent to electronic signature</li>
            <li>
              • Your signature will be recorded with timestamp, IP address, and device
              information
            </li>
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSign}>
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Confirm & Sign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary">Dispute Document</h3>
          <p className="text-sm text-text-secondary">
            If you disagree with the contents of this document, you may submit a dispute.
            HR will review your dispute and respond within 5 business days.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary">
                Reason for Dispute <span className="text-brand-error">*</span>
              </label>
              <Textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why you are disputing this document..."
                className="mt-2 min-h-[100px]"
                maxLength={2000}
              />
              <p
                className={`mt-1 text-xs ${disputeReason.length < 50 && disputeReason.length > 0 ? "text-brand-error" : "text-text-tertiary"}`}
              >
                {disputeReason.length}/2000 (minimum 50 characters)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleDispute}
                disabled={disputeReason.length < 50}
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
