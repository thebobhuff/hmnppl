/**
 * Policy document import API - POST /api/v1/policies/import
 *
 * Stores a policy/handbook source file, extracts readable text, and creates
 * an AI-visible policy context record for incident evaluation.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { roleGuards, withAuth } from "@/lib/auth/require-role";
import {
  importKnowledgeDocument,
  type KnowledgeDocumentType,
} from "@/lib/services/knowledge-document-service";

export const runtime = "nodejs";

const metadataSchema = z.object({
  title: z.string().trim().max(255).optional(),
  category: z.string().trim().max(100).optional(),
  documentType: z
    .enum(["policy", "handbook", "procedure", "other"])
    .optional()
    .default("policy"),
  activatePolicy: z
    .preprocess((value) => value === "true" || value === true, z.boolean())
    .optional()
    .default(true),
});

export const POST = withAuth(
  { roles: roleGuards.companyAdmin },
  async (request, _context, { user }) => {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A document file is required" }, { status: 400 });
    }

    const parsed = metadataSchema.safeParse({
      title: formData.get("title") || undefined,
      category: formData.get("category") || undefined,
      documentType: formData.get("documentType") || undefined,
      activatePolicy: formData.get("activatePolicy") ?? true,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    try {
      const result = await importKnowledgeDocument({
        companyId: user.companyId,
        userId: user.id,
        file,
        title: parsed.data.title,
        category: parsed.data.category,
        documentType: parsed.data.documentType as KnowledgeDocumentType,
        activatePolicy: parsed.data.activatePolicy,
      });

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error("[policies:import] Failed:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to import policy document",
        },
        { status: 500 },
      );
    }
  },
);
