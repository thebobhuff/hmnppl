"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardFooter, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/csrf-client";
import { Bot, FileText, CheckCircle2, Loader2, ArrowRight, UploadCloud } from "lucide-react";
import Link from "next/link";

type DecomposeResult = {
  policies_count?: number;
  policies?: Array<{ title?: string; category?: string; summary?: string }>;
};

type ExtractionStatusReporter = (message: string) => void;

const MIN_HANDBOOK_TEXT_LENGTH = 50;

async function extractTextFromFile(file: File, reportStatus?: ExtractionStatusReporter) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return extractPdfText(file, reportStatus);
  }

  if (extension === "docx") {
    return extractDocxText(file);
  }

  throw new Error("Supported formats are PDF and Word (.docx).");
}

async function extractPdfText(file: File, reportStatus?: ExtractionStatusReporter) {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }

  const buffer = await file.arrayBuffer();
  const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  reportStatus?.(`Reading ${file.name} (${pdfDocument.numPages} pages)...`);

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  const extractedText = pages.join("\n\n");
  if (normalizeHandbookText(extractedText).length >= MIN_HANDBOOK_TEXT_LENGTH) {
    return extractedText;
  }

  reportStatus?.("No embedded text found. Running OCR on scanned PDF...");
  return extractPdfTextWithOcr(pdfDocument, reportStatus);
}

async function extractPdfTextWithOcr(
  pdfDocument: any,
  reportStatus?: ExtractionStatusReporter,
) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      reportStatus?.(`Running OCR on page ${pageNumber} of ${pdfDocument.numPages}...`);

      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.75 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create a canvas for OCR.");
      }

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      const pageText = result.data.text.trim();

      if (pageText) {
        pages.push(pageText);
      }
    }
  } finally {
    await worker.terminate();
  }

  return pages.join("\n\n");
}

async function extractDocxText(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

function normalizeHandbookText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export default function HandbookImportPage() {
  const [handbookText, setHandbookText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileStatusMessage, setFileStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [result, setResult] = useState<DecomposeResult | null>(null);
  const { toast } = useToast();
  const normalizedHandbookText = normalizeHandbookText(handbookText);
  const canRunDecomposition =
    !isProcessing &&
    !isExtractingFile &&
    normalizedHandbookText.length >= MIN_HANDBOOK_TEXT_LENGTH;

  const handleFilesChange = async (files: File[]) => {
    const file = files[0];

    if (!file) {
      setSelectedFileName(null);
      setFileStatusMessage(null);
      return;
    }

    setIsExtractingFile(true);
    setResult(null);
    setFileStatusMessage(`Reading ${file.name}...`);

    try {
      const extractedText = normalizeHandbookText(
        await extractTextFromFile(file, setFileStatusMessage),
      );

      if (extractedText.length < MIN_HANDBOOK_TEXT_LENGTH) {
        throw new Error(
          "We could not extract enough readable text from that document, even after OCR.",
        );
      }

      setSelectedFileName(file.name);
      setHandbookText(extractedText);
      setFileStatusMessage(
        `${file.name} is ready. ${extractedText.length.toLocaleString()} characters extracted.`,
      );
      toast({
        title: "Document ready",
        description: `${file.name} was parsed successfully. Review the extracted text below before importing.`,
        variant: "default",
      });
    } catch (e: any) {
      setSelectedFileName(file.name);
      setHandbookText("");
      setFileStatusMessage(
        e.message || "We could not extract readable text from that document.",
      );
      toast({
        title: "File parsing failed",
        description: e.message || "We could not read that document.",
        variant: "error",
      });
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleDecompose = async () => {
    if (!normalizedHandbookText || normalizedHandbookText.length < MIN_HANDBOOK_TEXT_LENGTH) {
      toast({
        title: "Error",
        description: "Upload a PDF or Word document, or paste at least 50 characters of handbook text.",
        variant: "error",
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const res = await csrfFetch("/api/v1/agents/handbook-decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handbook_text: normalizedHandbookText }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setResult(data);
      toast({
        title: "Success!",
        description: `Successfully decomposed into ${data.policies_count || 0} modular policies.`,
        variant: "default",
      });
    } catch (e: any) {
      toast({
        title: "AI Processing Failed",
        description: e.message || "An error occurred during decomposition.",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageContainer title="Magic Handbook Import">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4 bg-muted/30 p-6 rounded-xl border border-border mt-4">
          <div className="bg-brand-primary/10 p-3 rounded-full">
            <Bot className="h-8 w-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Transform static PDF handbooks into an intelligent context engine.</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mt-1">
              Upload a PDF or Word (.docx) handbook, or paste the raw text manually. The AI will decompose it into distinct compliance policies and inject the results directly into your Vector DB.
            </p>
          </div>
        </div>

        {result ? (
          <Card className="border-green-500/50 bg-green-500/5 mt-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <CardTitle>Decomposition Complete!</CardTitle>
              </div>
              <CardSubtitle>
                The AI successfully saved and embedded {result.policies_count} specific policies.
              </CardSubtitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.policies?.map((pol: any, idx: number) => (
                  <div key={idx} className="flex flex-col space-y-1 p-4 rounded-md border border-border bg-background">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{pol.title}</h4>
                      <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{pol.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{pol.summary}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/policies">
                  View Policies in Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Upload Handbook or Paste Text</CardTitle>
              <CardSubtitle>Use a PDF or Word (.docx) document, then review the extracted text before running decomposition.</CardSubtitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
                    <UploadCloud className="h-4 w-4 text-brand-primary" />
                    Upload source document
                  </div>
                  <FileUpload
                    accept=".pdf,.docx"
                    maxFiles={1}
                    maxSize={20 * 1024 * 1024}
                    disabled={isProcessing || isExtractingFile}
                    hint="Supported formats: PDF, Word (.docx). Max 20 MB."
                    onFilesChange={handleFilesChange}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isExtractingFile
                      ? "Extracting text from the uploaded document..."
                      : fileStatusMessage
                        ? fileStatusMessage
                        : selectedFileName
                          ? `Loaded ${selectedFileName}. You can edit the extracted text below before import.`
                        : "No file selected yet. You can also paste text directly into the editor below."}
                  </p>
                  {!isExtractingFile && selectedFileName && normalizedHandbookText.length < MIN_HANDBOOK_TEXT_LENGTH && (
                    <p className="mt-2 text-xs text-brand-warning">
                      This file still does not contain enough extracted text for AI decomposition. If OCR could not recover the contents cleanly, try a clearer scan or a Word export.
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">Extracted handbook text</p>
                    <p className="text-xs text-muted-foreground">{normalizedHandbookText.length} characters</p>
                  </div>
                  <Textarea 
                    placeholder="Welcome to Acme Corp! \n\n1. PTO Policy: Full-time employees receive 15 days of PTO..."
                    className="min-h-[400px] font-mono text-sm leading-relaxed"
                    value={handbookText}
                    onChange={(e) => setHandbookText(e.target.value)}
                    disabled={isProcessing || isExtractingFile}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                {canRunDecomposition
                  ? "Document is ready for AI decomposition."
                  : `AI decomposition becomes available at ${MIN_HANDBOOK_TEXT_LENGTH} readable characters.`}
              </p>
              <Button onClick={handleDecompose} disabled={!canRunDecomposition}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting & Embedding...
                  </>
                ) : isExtractingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reading Document...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Run AI Decomposition
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
