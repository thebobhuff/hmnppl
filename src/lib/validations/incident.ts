/**
 * Zod validation schemas for incident management.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Evidence attachment
// ---------------------------------------------------------------------------

export const evidenceAttachmentSchema = z.object({
  name: z.string().min(1, "File name is required").max(255),
  url: z.string().url("Invalid file URL"),
  size_bytes: z.number().int().positive("File size must be positive"),
  content_type: z.string().optional(),
});

export type EvidenceAttachment = z.infer<typeof evidenceAttachmentSchema>;

// ---------------------------------------------------------------------------
// Incident creation
// ---------------------------------------------------------------------------

export const incidentCreateSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
  type: z.enum([
    "tardiness",
    "absence",
    "insubordination",
    "performance",
    "misconduct",
    "violation_of_policy",
    "safety_violation",
    "violence",
    "harassment",
    "financial_impropriety",
    "protected_class_concern",
    "theft",
    "other",
  ]),
  incident_date: z
    .string()
    .date("Invalid date format (YYYY-MM-DD)")
    .refine((date) => new Date(date) <= new Date(), {
      message: "Incident date cannot be in the future",
    }),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  evidence_attachments: z.array(evidenceAttachmentSchema).optional().default([]),
  witness_ids: z.array(z.string().uuid()).optional().default([]),
  union_involved: z.boolean().default(false),
});

export type IncidentCreateInput = z.infer<typeof incidentCreateSchema>;

// ---------------------------------------------------------------------------
// Incident status update
// ---------------------------------------------------------------------------

export const incidentStatusUpdateSchema = z.object({
  status: z.enum([
    "ai_evaluating",
    "ai_evaluated",
    "pending_hr_review",
    "approved",
    "rejected",
    "meeting_scheduled",
    "document_delivered",
    "pending_signature",
    "signed",
    "disputed",
    "closed",
    "escalated_legal",
  ]),
  reason: z.string().min(10).max(1000).optional(),
});

export type IncidentStatusUpdate = z.infer<typeof incidentStatusUpdateSchema>;

// ---------------------------------------------------------------------------
// Incident list filters
// ---------------------------------------------------------------------------

export const incidentListFiltersSchema = z.object({
  status: z
    .enum([
      "ai_evaluating",
      "ai_evaluated",
      "pending_hr_review",
      "approved",
      "rejected",
      "meeting_scheduled",
      "document_delivered",
      "pending_signature",
      "signed",
      "disputed",
      "closed",
      "escalated_legal",
    ])
    .optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  type: z
    .enum([
      "tardiness",
      "absence",
      "insubordination",
      "performance",
      "misconduct",
      "violation_of_policy",
      "safety_violation",
      "violence",
      "harassment",
      "financial_impropriety",
      "protected_class_concern",
      "theft",
      "other",
    ])
    .optional(),
  employee_id: z.string().uuid().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  search: z.string().max(255).optional(),
});

export type IncidentListFilters = z.infer<typeof incidentListFiltersSchema>;

// ---------------------------------------------------------------------------
// Incident response
// ---------------------------------------------------------------------------

export const incidentResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  reported_by: z.string().uuid(),
  reference_number: z.string(),
  type: z.string(),
  description: z.string(),
  incident_date: z.string(),
  severity: z.string(),
  evidence_attachments: z.array(evidenceAttachmentSchema).nullable(),
  union_involved: z.boolean(),
  status: z.string(),
  ai_confidence_score: z.number().nullable(),
  ai_evaluation_status: z.string().nullable(),
  ai_recommendation: z.unknown().nullable(),
  linked_policy_id: z.string().uuid().nullable(),
  policy_snapshot: z.unknown().nullable(),
  policy_version: z.number().nullable(),
  previous_incident_count: z.number(),
  escalation_level: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  witnesses: z.array(z.string().uuid()).optional(),
});

export type IncidentResponse = z.infer<typeof incidentResponseSchema>;
