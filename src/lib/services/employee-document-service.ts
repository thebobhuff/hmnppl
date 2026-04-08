/**
 * Employee document service — employee-scoped document listings derived from
 * disciplinary actions, documents, incidents, and signatures.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface EmployeeDocumentItem {
  id: string;
  title: string;
  type: string;
  status: "pending_signature" | "signed" | "disputed";
  reference: string;
  createdAt: string;
  signedAt: string | null;
}

export async function listEmployeeDocuments(
  companyId: string,
  userId: string,
): Promise<EmployeeDocumentItem[]> {
  const supabase = createAdminClient();

  const { data: actions, error: actionsError } = await supabase
    .from("disciplinary_actions")
    .select("id, incident_id, document_id, action_type, created_at")
    .eq("company_id", companyId)
    .eq("employee_id", userId)
    .not("document_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (actionsError) {
    throw new Error(`Failed to list employee documents: ${actionsError.message}`);
  }

  const documentIds = new Set<string>();
  const incidentIds = new Set<string>();

  for (const action of actions ?? []) {
    if (action.document_id) {
      documentIds.add(action.document_id as string);
    }
    if (action.incident_id) {
      incidentIds.add(action.incident_id as string);
    }
  }

  const [documentsResult, incidentsResult, signaturesResult] = await Promise.all([
    documentIds.size > 0
      ? supabase
          .from("documents")
          .select("id, title, type, status, created_at")
          .in("id", Array.from(documentIds))
      : Promise.resolve({ data: [], error: null }),
    incidentIds.size > 0
      ? supabase
          .from("incidents")
          .select("id, reference_number, status")
          .in("id", Array.from(incidentIds))
      : Promise.resolve({ data: [], error: null }),
    documentIds.size > 0
      ? supabase
          .from("signatures")
          .select("document_id, signed_at, dispute")
          .eq("signer_id", userId)
          .in("document_id", Array.from(documentIds))
          .order("signed_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const secondaryErrors = [
    documentsResult.error,
    incidentsResult.error,
    signaturesResult.error,
  ].filter(Boolean);

  if (secondaryErrors.length > 0) {
    throw new Error(
      secondaryErrors[0]?.message ?? "Failed to load employee document details",
    );
  }

  const documents = new Map(
    (documentsResult.data ?? []).map((document) => [document.id as string, document]),
  );
  const incidents = new Map(
    (incidentsResult.data ?? []).map((incident) => [incident.id as string, incident]),
  );
  const signatures = new Map<string, { signed_at: string | null; dispute: boolean }>();

  for (const signature of signaturesResult.data ?? []) {
    const documentId = signature.document_id as string;
    if (!signatures.has(documentId)) {
      signatures.set(documentId, {
        signed_at: (signature.signed_at as string | null) ?? null,
        dispute: Boolean(signature.dispute),
      });
    }
  }

  return (actions ?? [])
    .map((action) => {
      const documentId = action.document_id as string | null;
      if (!documentId) return null;

      const document = documents.get(documentId);
      if (!document) return null;

      const incident = incidents.get((action.incident_id as string) ?? "");
      const signature = signatures.get(documentId);

      return {
        id: documentId,
        title: (document.title as string) ?? "Document",
        type: formatDocumentType(
          ((document.type as string | undefined) ??
            (action.action_type as string | undefined) ??
            "document") as string,
        ),
        status: getEmployeeDocumentStatus(
          signature?.dispute ?? false,
          signature?.signed_at ?? null,
          (incident?.status as string | undefined) ?? null,
          (document.status as string | undefined) ?? null,
        ),
        reference: (incident?.reference_number as string | undefined) ?? "Document",
        createdAt: ((document.created_at as string | undefined) ??
          (action.created_at as string | undefined) ??
          new Date().toISOString()) as string,
        signedAt: signature?.signed_at ?? null,
      } satisfies EmployeeDocumentItem;
    })
    .filter((item): item is EmployeeDocumentItem => item !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getEmployeeDocumentStatus(
  disputed: boolean,
  signedAt: string | null,
  incidentStatus: string | null,
  documentStatus: string | null,
): "pending_signature" | "signed" | "disputed" {
  if (disputed || incidentStatus === "disputed" || documentStatus === "disputed") {
    return "disputed";
  }

  if (signedAt || incidentStatus === "signed" || documentStatus === "signed") {
    return "signed";
  }

  return "pending_signature";
}

function formatDocumentType(type: string): string {
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
