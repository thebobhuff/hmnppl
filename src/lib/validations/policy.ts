/**
 * Zod validation schemas for policy management.
 *
 * Used for policy creation, updates, and rule validation.
 * Ensures structured JSONB rules conform to expected schema.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Rule schema — structured rules for AI evaluation
// ---------------------------------------------------------------------------

const triggerSchema = z.object({
  type: z.string().min(1, "Trigger type is required"),
  field: z.string().min(1, "Trigger field is required"),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "in",
  ]),
  value: z.unknown(),
});

const conditionSchema = z.object({
  field: z.string().min(1, "Condition field is required"),
  operator: z.enum([
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "in",
    "between",
  ]),
  value: z.unknown(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
});

const actionSchema = z.object({
  type: z.enum(["verbal_warning", "written_warning", "pip", "termination_review"]),
  escalation_level: z.number().int().min(1).max(10),
  document_template: z.string().min(1, "Document template is required"),
  required_actions: z.array(z.string()).optional(),
  deadline_days: z.number().int().min(1).optional(),
});

const escalationLadderStepSchema = z.object({
  level: z.number().int().min(1),
  action_type: z.enum(["verbal_warning", "written_warning", "pip", "termination_review"]),
  description: z.string().max(500).optional(),
  auto_escalate: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Policy rule schema
// ---------------------------------------------------------------------------

export const policyRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Rule name is required").max(255),
  description: z.string().max(1000).optional(),
  triggers: z.array(triggerSchema).min(1, "At least one trigger is required"),
  conditions: z.array(conditionSchema).optional().default([]),
  actions: z.array(actionSchema).min(1, "At least one action is required"),
  escalation_ladder: z
    .array(escalationLadderStepSchema)
    .min(1, "At least one escalation level is required"),
});

export type PolicyRule = z.infer<typeof policyRuleSchema>;

// ---------------------------------------------------------------------------
// Policy create schema
// ---------------------------------------------------------------------------

export const policyCreateSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  title: z.string().min(1, "Title is required").max(255),
  summary: z.string().max(2000).optional(),
  content: z.string().min(10, "Policy content must be at least 10 characters"),
  rules: z.array(policyRuleSchema).min(1, "At least one rule is required"),
  severity_levels: z.record(z.string(), z.unknown()).optional(),
  effective_date: z.string().date().optional(),
  expiry_date: z.string().date().optional(),
});

export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;

// ---------------------------------------------------------------------------
// Policy update schema
// ---------------------------------------------------------------------------

export const policyUpdateSchema = policyCreateSchema.extend({
  id: z.string().uuid().optional(),
});

export type PolicyUpdateInput = z.infer<typeof policyUpdateSchema>;

// ---------------------------------------------------------------------------
// Policy response schema
// ---------------------------------------------------------------------------

export const policyResponseSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  category: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string(),
  rules: z.array(policyRuleSchema),
  severity_levels: z.record(z.string(), z.unknown()).nullable(),
  is_active: z.boolean(),
  version: z.number(),
  effective_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PolicyResponse = z.infer<typeof policyResponseSchema>;

// ---------------------------------------------------------------------------
// Conflict detection schema
// ---------------------------------------------------------------------------

export const policyConflictSchema = z.object({
  rule_id_1: z.string(),
  rule_id_2: z.string(),
  rule_name_1: z.string(),
  rule_name_2: z.string(),
  conflict_type: z.enum([
    "overlapping_trigger",
    "contradictory_action",
    "duplicate_condition",
  ]),
  description: z.string(),
  severity: z.enum(["warning", "error"]),
});

export type PolicyConflict = z.infer<typeof policyConflictSchema>;
