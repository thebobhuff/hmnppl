/**
 * Knowledge document service - source file storage and policy context import.
 */
import mammoth from "mammoth";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PolicyResponse, PolicyRule } from "@/lib/validations/policy";

const DOCUMENTS_BUCKET = "documents";
const MIN_EXTRACTED_TEXT_LENGTH = 50;

export type KnowledgeDocumentType = "policy" | "handbook" | "procedure" | "other";

export interface KnowledgeDocumentResponse {
  id: string;
  company_id: string;
  policy_id: string | null;
  title: string;
  document_type: KnowledgeDocumentType;
  source_file_name: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number;
  extracted_text: string;
  status: string;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportKnowledgeDocumentInput {
  companyId: string;
  userId: string;
  file: File;
  title?: string;
  category?: string;
  documentType?: KnowledgeDocumentType;
  activatePolicy?: boolean;
}

export interface ImportKnowledgeDocumentResult {
  document: KnowledgeDocumentResponse;
  policy: PolicyResponse;
  extractedCharacters: number;
}

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "md",
  "markdown",
  "json",
  "csv",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function importKnowledgeDocument(
  input: ImportKnowledgeDocumentInput,
): Promise<ImportKnowledgeDocumentResult> {
  validateFile(input.file);

  const documentType = input.documentType ?? "policy";
  const title = cleanTitle(input.title || nameWithoutExtension(input.file.name));
  const category = cleanTitle(input.category || documentType);
  const extractedText = normalizeExtractedText(await extractText(input.file));

  if (extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new Error(
      "The uploaded document did not contain enough readable text for AI context.",
    );
  }

  const supabase = createAdminClient();
  const documentId = crypto.randomUUID();
  const storagePath = `${input.companyId}/knowledge/${documentId}/${safeFileName(
    input.file.name,
  )}`;
  const fileBytes = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: input.file.type || mimeTypeForFile(input.file.name),
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to store source file: ${uploadError.message}`);
  }

  try {
    const { data: policyData, error: policyError } = await supabase
      .from("policies")
      .insert({
        company_id: input.companyId,
        category,
        title,
        summary: summarizeText(extractedText),
        content: extractedText,
        rules: [],
        severity_levels: null,
        is_active: input.activatePolicy ?? true,
        version: 1,
        effective_date: null,
        expiry_date: null,
        created_by: input.userId,
      })
      .select()
      .single();

    if (policyError) {
      throw new Error(`Failed to create AI policy context: ${policyError.message}`);
    }

    const { data: documentData, error: documentError } = await supabase
      .from("knowledge_documents")
      .insert({
        id: documentId,
        company_id: input.companyId,
        policy_id: policyData.id,
        title,
        document_type: documentType,
        source_file_name: input.file.name,
        storage_bucket: DOCUMENTS_BUCKET,
        storage_path: storagePath,
        mime_type: input.file.type || mimeTypeForFile(input.file.name),
        file_size: input.file.size,
        extracted_text: extractedText,
        status: "indexed",
        metadata: {
          category,
          imported_as_active_policy: input.activatePolicy ?? true,
        },
        uploaded_by: input.userId,
      })
      .select()
      .single();

    if (documentError) {
      throw new Error(`Failed to record imported document: ${documentError.message}`);
    }

    return {
      document: mapKnowledgeDocument(documentData),
      policy: mapPolicy(policyData),
      extractedCharacters: extractedText.length,
    };
  } catch (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    throw error;
  }
}

function validateFile(file: File) {
  if (file.size === 0) {
    throw new Error("Upload a non-empty document.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Documents must be 25 MB or smaller.");
  }

  const extension = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Supported formats are PDF, DOCX, TXT, Markdown, CSV, and JSON.");
  }
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = fileExtension(file.name);

  if (extension === "pdf" || file.type === "application/pdf") {
    return extractPdfText(buffer);
  }

  if (
    extension === "docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join("\n\n");
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarizeText(value: string) {
  const firstParagraph = value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find(Boolean);
  const summary = firstParagraph ?? value.slice(0, 500);
  return summary.length > 700 ? `${summary.slice(0, 697).trim()}...` : summary;
}

function cleanTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 255) || "Imported document";
}

function safeFileName(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "source-document";
}

function nameWithoutExtension(value: string) {
  return value.replace(/\.[^.]+$/, "");
}

function fileExtension(value: string) {
  return value.split(".").pop()?.toLowerCase() ?? "";
}

function mimeTypeForFile(value: string) {
  const extension = fileExtension(value);
  if (extension === "pdf") return "application/pdf";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "json") return "application/json";
  if (extension === "md" || extension === "markdown") return "text/markdown";
  if (extension === "csv") return "text/csv";
  return "text/plain";
}

function mapKnowledgeDocument(data: Record<string, unknown>): KnowledgeDocumentResponse {
  return {
    id: data.id as string,
    company_id: data.company_id as string,
    policy_id: (data.policy_id as string) ?? null,
    title: data.title as string,
    document_type: data.document_type as KnowledgeDocumentType,
    source_file_name: data.source_file_name as string,
    storage_bucket: data.storage_bucket as string,
    storage_path: data.storage_path as string,
    mime_type: (data.mime_type as string) ?? null,
    file_size: Number(data.file_size ?? 0),
    extracted_text: data.extracted_text as string,
    status: data.status as string,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
    uploaded_by: (data.uploaded_by as string) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

function mapPolicy(data: Record<string, unknown>): PolicyResponse {
  return {
    id: data.id as string,
    company_id: data.company_id as string,
    category: data.category as string,
    title: data.title as string,
    summary: (data.summary as string) ?? null,
    content: data.content as string,
    rules: (data.rules as PolicyRule[]) ?? [],
    severity_levels: (data.severity_levels as Record<string, unknown>) ?? null,
    is_active: data.is_active as boolean,
    version: data.version as number,
    effective_date: (data.effective_date as string) ?? null,
    expiry_date: (data.expiry_date as string) ?? null,
    created_by: (data.created_by as string) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
