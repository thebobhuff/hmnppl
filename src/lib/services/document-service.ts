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

export interface EmployeeDocumentDetail extends DocumentResponse {
  reference: string;
  action_id: string;
  action_type: string;
  incident_id: string;
  incident_status: string;
  signed_at: string | null;
  disputed: boolean;
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

export async function getEmployeeDocument(
  companyId: string,
  userId: string,
  documentId: string,
): Promise<EmployeeDocumentDetail | null> {
  const supabase = createAdminClient();

  const { data: action, error: actionError } = await supabase
    .from("disciplinary_actions")
    .select("id, incident_id, document_id, action_type")
    .eq("company_id", companyId)
    .eq("employee_id", userId)
    .eq("document_id", documentId)
    .maybeSingle();

  if (actionError) {
    throw new Error(`Failed to validate document access: ${actionError.message}`);
  }
  if (!action) return null;

  const [documentResult, incidentResult, signatureResult] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("company_id", companyId)
      .single(),
    supabase
      .from("incidents")
      .select("id, reference_number, status")
      .eq("id", action.incident_id)
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("signatures")
      .select("signed_at, dispute")
      .eq("document_id", documentId)
      .eq("signer_id", userId)
      .order("signed_at", { ascending: false })
      .limit(1),
  ]);

  if (documentResult.error) {
    if (documentResult.error.code === "PGRST116") return null;
    throw new Error(`Failed to get document: ${documentResult.error.message}`);
  }
  if (incidentResult.error) {
    throw new Error(`Failed to get incident reference: ${incidentResult.error.message}`);
  }
  if (signatureResult.error) {
    throw new Error(`Failed to get signature status: ${signatureResult.error.message}`);
  }

  const signature = signatureResult.data?.[0];
  const document = mapToResponse(documentResult.data);

  return {
    ...document,
    reference: (incidentResult.data?.reference_number as string | undefined) ?? "Document",
    action_id: action.id as string,
    action_type: action.action_type as string,
    incident_id: action.incident_id as string,
    incident_status: (incidentResult.data?.status as string | undefined) ?? "pending_signature",
    signed_at: (signature?.signed_at as string | null | undefined) ?? null,
    disputed: Boolean(signature?.dispute),
  };
}

export async function signEmployeeDocument(
  companyId: string,
  userId: string,
  userRole: string,
  documentId: string,
  input: {
    signatureType: "drawn" | "typed";
    signatureData: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
): Promise<{ signedAt: string; contentHash: string }> {
  const supabase = createAdminClient();
  const document = await getEmployeeDocument(companyId, userId, documentId);
  if (!document) throw new Error("Document not found");

  const contentHash =
    document.content_hash ??
    crypto.createHash("sha256").update(document.content ?? document.file_url ?? "").digest("hex");

  const { data, error } = await supabase
    .from("signatures")
    .insert({
      document_id: documentId,
      signer_id: userId,
      signer_role: userRole.toLowerCase(),
      signature_type: input.signatureType,
      signature_data: input.signatureData,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      content_hash: contentHash,
      dispute: false,
    })
    .select("signed_at")
    .single();

  if (error) {
    throw new Error(`Failed to sign document: ${error.message}`);
  }

  await updateDocumentAndIncidentStatus(companyId, documentId, document.incident_id, "signed");

  return {
    signedAt: data.signed_at as string,
    contentHash,
  };
}

export async function disputeEmployeeDocument(
  companyId: string,
  userId: string,
  userRole: string,
  documentId: string,
  input: {
    reason: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
): Promise<{ disputedAt: string }> {
  const supabase = createAdminClient();
  const document = await getEmployeeDocument(companyId, userId, documentId);
  if (!document) throw new Error("Document not found");

  const contentHash =
    document.content_hash ??
    crypto.createHash("sha256").update(document.content ?? document.file_url ?? "").digest("hex");

  const { data, error } = await supabase
    .from("signatures")
    .insert({
      document_id: documentId,
      signer_id: userId,
      signer_role: userRole.toLowerCase(),
      signature_type: "typed",
      signature_data: "DISPUTED",
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      content_hash: contentHash,
      dispute: true,
      dispute_reason: input.reason,
    })
    .select("signed_at")
    .single();

  if (error) {
    throw new Error(`Failed to dispute document: ${error.message}`);
  }

  await updateDocumentAndIncidentStatus(companyId, documentId, document.incident_id, "disputed");

  return { disputedAt: data.signed_at as string };
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

async function updateDocumentAndIncidentStatus(
  companyId: string,
  documentId: string,
  incidentId: string,
  status: "signed" | "disputed",
) {
  const supabase = createAdminClient();
  const [documentResult, incidentResult] = await Promise.all([
    supabase
      .from("documents")
      .update({ status })
      .eq("id", documentId)
      .eq("company_id", companyId),
    supabase
      .from("incidents")
      .update({ status })
      .eq("id", incidentId)
      .eq("company_id", companyId),
  ]);

  if (documentResult.error) {
    throw new Error(`Failed to update document status: ${documentResult.error.message}`);
  }
  if (incidentResult.error) {
    throw new Error(`Failed to update incident status: ${incidentResult.error.message}`);
  }
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
