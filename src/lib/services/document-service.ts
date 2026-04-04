/**
 * Document service — CRUD for HR documents.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface DocumentResponse {
  id: string;
  company_id: string;
  type: string;
  title: string;
  content: string | null;
  content_hash: string | null;
  file_url: string | null;
  created_by: string | null;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export async function createDocument(
  companyId: string,
  userId: string,
  type: string,
  title: string,
  content: string,
): Promise<DocumentResponse> {
  const supabase = createAdminClient();
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");

  const { data, error } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      type,
      title,
      content,
      content_hash: contentHash,
      created_by: userId,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function getDocument(
  companyId: string,
  documentId: string,
): Promise<DocumentResponse | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get document: ${error.message}`);
  }

  return mapToResponse(data);
}

export async function updateDocumentContent(
  companyId: string,
  documentId: string,
  content: string,
): Promise<DocumentResponse> {
  const supabase = createAdminClient();
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");

  const { data, error } = await supabase
    .from("documents")
    .update({ content, content_hash: contentHash })
    .eq("id", documentId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return mapToResponse(data);
}

function mapToResponse(data: Record<string, unknown>): DocumentResponse {
  return {
    id: data.id as string,
    company_id: data.company_id as string,
    type: data.type as string,
    title: data.title as string,
    content: (data.content as string) ?? null,
    content_hash: (data.content_hash as string) ?? null,
    file_url: (data.file_url as string) ?? null,
    created_by: (data.created_by as string) ?? null,
    status: data.status as string,
    version: data.version as number,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
