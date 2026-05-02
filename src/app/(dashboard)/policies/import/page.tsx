"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  policiesAPI,
  type KnowledgeDocumentImportResponse,
  type KnowledgeDocumentType,
} from "@/lib/api/client";

const DOCUMENT_TYPES: Array<{ value: KnowledgeDocumentType; label: string }> = [
  { value: "policy", label: "Policy" },
  { value: "handbook", label: "Handbook" },
  { value: "procedure", label: "Procedure" },
  { value: "other", label: "Other" },
];

const CATEGORY_OPTIONS = [
  { value: "attendance", label: "Attendance" },
  { value: "conduct", label: "Conduct" },
  { value: "performance", label: "Performance" },
  { value: "safety", label: "Safety" },
  { value: "handbook", label: "Handbook" },
  { value: "general", label: "General" },
];

export default function PolicyImportPage() {
  usePageBreadcrumbs([
    { label: "Home", href: "/dashboard" },
    { label: "Policies", href: "/policies" },
    { label: "Import" },
  ]);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("handbook");
  const [documentType, setDocumentType] = useState<KnowledgeDocumentType>("handbook");
  const [activatePolicy, setActivatePolicy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KnowledgeDocumentImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const inferredTitle = useMemo(() => {
    if (title.trim()) return title.trim();
    return file?.name.replace(/\.[^.]+$/, "") ?? "";
  }, [file, title]);

  const handleFilesChange = (files: File[]) => {
    const selected = files[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
    if (selected && !title.trim()) {
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Choose a document to import.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await policiesAPI.importDocument({
        file,
        title: inferredTitle,
        category,
        documentType,
        activatePolicy,
      });
      setResult(response);
      toast({
        title: "Document imported",
        description: `${response.extractedCharacters.toLocaleString()} characters were stored for AI context.`,
        variant: "success",
      });
    } catch (importError) {
      const message =
        importError instanceof Error ? importError.message : "Document import failed.";
      setError(message);
      toast({
        title: "Import failed",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Import Policy Document"
      description="Store handbooks, policies, and procedures as AI-readable company context."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-text-primary">
                  Source File
                </h2>
                <p className="text-sm text-text-secondary">
                  Supported formats: PDF, DOCX, TXT, Markdown, CSV, and JSON.
                </p>
              </div>
            </div>
            <FileUpload
              accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json"
              maxFiles={1}
              maxSize={25 * 1024 * 1024}
              disabled={loading}
              hint="Max 25 MB. The original file is stored privately and extracted text is indexed for the AI agent."
              onFilesChange={handleFilesChange}
            />
          </Card>

          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Employee Handbook 2026"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Document Type
                </label>
                <Select
                  value={documentType}
                  onValueChange={(value) =>
                    setDocumentType(value as KnowledgeDocumentType)
                  }
                  options={DOCUMENT_TYPES}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  AI Category
                </label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  options={CATEGORY_OPTIONS}
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Switch
                  checked={activatePolicy}
                  onCheckedChange={setActivatePolicy}
                  disabled={loading}
                  label="Use in AI evaluations"
                  description="Creates an active policy context record from this document."
                />
              </div>
            </div>
          </Card>

          {error && (
            <Card className="border-brand-error/30 bg-brand-error/5 p-4">
              <p className="text-sm text-text-primary">{error}</p>
            </Card>
          )}

          {result && (
            <Card className="border-brand-success/30 bg-brand-success/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-success" />
                  <div>
                    <h2 className="font-display text-base font-semibold text-text-primary">
                      Import Complete
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {result.document.source_file_name} was stored and linked to an AI
                      policy context record.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="success">{result.document.status}</Badge>
                      <Badge variant={result.policy.is_active ? "success" : "default"}>
                        {result.policy.is_active ? "AI active" : "draft"}
                      </Badge>
                      <Badge variant="outline">
                        {result.extractedCharacters.toLocaleString()} chars
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/policies/${result.policy.id}/edit`}>
                    Review Policy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="grid gap-4 self-start">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="h-5 w-5 text-brand-primary" />
              <h2 className="font-display text-base font-semibold text-text-primary">
                AI Context
              </h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary">
              <p>
                The uploaded file is stored in the private Supabase documents bucket under
                your company folder.
              </p>
              <p>
                Extracted text is copied into an active policy context record so new
                incidents can include the handbook or policy text in AI evaluation.
              </p>
              <p>
                The importer does not infer structured disciplinary rules yet; review the
                created policy if you need rule-based escalation logic.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-text-secondary" />
              <h2 className="font-display text-base font-semibold text-text-primary">
                Import Summary
              </h2>
            </div>
            <Textarea
              readOnly
              value={
                file
                  ? `File: ${file.name}\nSize: ${formatFileSize(file.size)}\nTitle: ${
                      inferredTitle || "Not set"
                    }\nCategory: ${category}\nAI active: ${activatePolicy ? "yes" : "no"}`
                  : "No file selected."
              }
              className="min-h-[150px] resize-none font-mono text-xs"
            />
          </Card>

          <div className="flex justify-end gap-2">
            <Button asChild variant="outline" disabled={loading}>
              <Link href="/policies">Cancel</Link>
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Import Document
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
