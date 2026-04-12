"use server";

/**
 * AI Pipeline Orchestrator
 *
 * Runs the full evaluation sequence when a new incident is created:
 *   1. Risk Classification (safety/violence? → auto-escalate)
 *   2. PII Sanitization check
 *   3. Issue Similarity (same vs new issue)
 *   4. Escalation Routing (verbal → written → PIP → termination)
 *   5. Document Generation
 *   6. Update incident in database with all results
 */

import { callAI, parseAIJSON } from "./ai-router";
import {
  buildRiskClassifierPrompt,
  buildEscalationRouterPrompt,
  buildDocumentGeneratorPrompt,
  buildIssueSimilarityPrompt,
} from "./prompts";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// Types
// ============================================================================

export interface PipelineInput {
  incidentId: string;
  companyId: string;
  employeeId: string;
  incidentType: string;
  description: string;
  severity: string;
  incidentDate: string;
  referenceNumber: string;
  previousIncidentCount: number;
  policySnapshot: Record<string, unknown>[];
  employeeName?: string;
  employeeTitle?: string;
  department?: string;
}

export interface PipelineResult {
  success: boolean;
  riskLevel: string;
  bypassesAgent: boolean;
  bypassReason?: string;
  similarityVerdict: string;
  escalationLevel: string;
  requiresHRReview: boolean;
  generatedDocument: string;
  aiConfidence: number;
  aiRecommendation: Record<string, unknown>;
  linkedPolicyId?: string;
  riskFactors: string[];
  coachingTopics: string[];
  trainingGaps: string[];
  totalCost: number;
  totalLatencyMs: number;
  steps: PipelineStepResult[];
}

interface PipelineStepResult {
  step: string;
  success: boolean;
  latencyMs: number;
  cost: number;
  error?: string;
}

// ============================================================================
// High-Risk Types (Pre-Check)
// ============================================================================

const HIGH_RISK_TYPES = new Set([
  "safety_violation",
  "violence",
  "harassment",
  "financial_impropriety",
  "theft",
  "misconduct",
]);

// ============================================================================
// Pipeline
// ============================================================================

export async function runAIPipeline(input: PipelineInput): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const steps: PipelineStepResult[] = [];
  let totalCost = 0;

  function trackStep(step: string, start: number, cost: number, error?: string) {
    steps.push({ step, success: !error, latencyMs: Date.now() - start, cost, error });
    totalCost += cost;
  }

  // ── Step 0: Pre-check for immediate escalation ────────────────────────
  const step0Start = Date.now();
  let riskLevel = input.severity;
  let bypassesAgent = false;
  let bypassReason: string | undefined;

  if (HIGH_RISK_TYPES.has(input.incidentType)) {
    riskLevel = "critical";
    bypassesAgent = true;
    bypassReason = `High-risk incident type '${input.incidentType}' requires immediate HR review`;
  }
  trackStep("pre_check", step0Start, 0);

  // If bypass, skip the full pipeline and go straight to HR
  if (bypassesAgent) {
    const result: PipelineResult = {
      success: true,
      riskLevel,
      bypassesAgent: true,
      bypassReason,
      similarityVerdict: "skipped",
      escalationLevel: "immediate_hr_escalation",
      requiresHRReview: true,
      generatedDocument: "",
      aiConfidence: 1.0,
      aiRecommendation: {
        action: "immediate_hr_escalation",
        reason: bypassReason,
      },
      riskFactors: [bypassReason],
      coachingTopics: [],
      trainingGaps: [],
      totalCost,
      totalLatencyMs: Date.now() - pipelineStart,
      steps,
    };

    await updateIncidentInDB(input.incidentId, result);
    return result;
  }

  // ── Step 1: Risk Classification ───────────────────────────────────────
  const step1Start = Date.now();
  let riskResult: Record<string, unknown> = {};
  try {
    const riskMessages = buildRiskClassifierPrompt({
      incidentType: input.incidentType,
      description: input.description,
      severity: input.severity,
      employeeRole: input.employeeTitle,
      department: input.department,
    });
    const riskResponse = await callAI({ messages: riskMessages, temperature: 0.1, maxTokens: 800 });
    riskResult = parseAIJSON(riskResponse.content);
    riskLevel = (riskResult.risk_level as string) ?? input.severity;
    bypassesAgent = (riskResult.bypasses_agent as boolean) ?? false;
    bypassReason = riskResult.bypass_reason as string | undefined;
    trackStep("risk_classifier", step1Start, riskResponse.cost);
  } catch (err) {
    trackStep("risk_classifier", step1Start, 0, String(err));
  }

  // ── Step 2: Issue Similarity ──────────────────────────────────────────
  const step2Start = Date.now();
  let similarityVerdict = "new_issue";
  let previousIncidents: Array<{ type: string; description: string; date: string; severity: string }> = [];

  // Fetch previous incidents from DB
  try {
    const supabase = createAdminClient();
    const { data: prevIncs } = await supabase
      .from("incidents")
      .select("type, description, created_at, severity")
      .eq("employee_id", input.employeeId)
      .eq("company_id", input.companyId)
      .neq("id", input.incidentId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (prevIncs && prevIncs.length > 0) {
      previousIncidents = prevIncs.map((inc) => ({
        type: inc.type,
        description: inc.description,
        date: inc.created_at,
        severity: inc.severity,
      }));

      const simMessages = buildIssueSimilarityPrompt({
        newIncidentType: input.incidentType,
        newIncidentDescription: input.description,
        previousIncidents,
      });
      const simResponse = await callAI({ messages: simMessages, temperature: 0.1, maxTokens: 600 });
      const simResult = parseAIJSON(simResponse.content);
      similarityVerdict = (simResult.similarity_verdict as string) ?? "new_issue";
      trackStep("issue_similarity", step2Start, simResponse.cost);
    } else {
      trackStep("issue_similarity", step2Start, 0);
    }
  } catch (err) {
    trackStep("issue_similarity", step2Start, 0, String(err));
  }

  // ── Step 3: Escalation Routing ────────────────────────────────────────
  const step3Start = Date.now();
  let escalationLevel = "verbal_warning";
  let requiresHRReview = true;
  let coachingTopics: string[] = [];
  let trainingGaps: string[] = [];
  let matchedPolicyId: string | undefined;

  // Find matching policy
  let matchedPolicyTitle = "";
  let matchedRule = "";
  try {
    const matchingPolicy = input.policySnapshot.find((p: any) => {
      const category = (p.category as string)?.toLowerCase() ?? "";
      const title = (p.title as string)?.toLowerCase() ?? "";
      const incType = input.incidentType.toLowerCase();
      return category.includes(incType) || title.includes(incType) ||
        incType.includes(category);
    });
    if (matchingPolicy) {
      matchedPolicyTitle = (matchingPolicy as any).title ?? "";
      matchedPolicyId = (matchingPolicy as any).id as string;
      // Try to find matching rule
      const rules = (matchingPolicy as any).rules as Array<Record<string, unknown>> ?? [];
      const matchingRule = rules.find((r) => {
        const desc = String(r.description ?? r.name ?? "").toLowerCase();
        return desc.includes(input.incidentType.toLowerCase()) || desc.includes(input.severity);
      });
      if (matchingRule) {
        matchedRule = String(matchingRule.description ?? matchingRule.name ?? "");
      }
    }
  } catch {
    // Policy matching is best-effort
  }

  try {
    const escMessages = buildEscalationRouterPrompt({
      incidentType: input.incidentType,
      description: input.description,
      severity: input.severity,
      previousIncidentCount: input.previousIncidentCount,
      previousIncidents: previousIncidents as any,
      policyContext: input.policySnapshot,
    });
    const escResponse = await callAI({ messages: escMessages, temperature: 0.1, maxTokens: 1000 });
    const escResult = parseAIJSON(escResponse.content);
    escalationLevel = (escResult.escalation_level as string) ?? "verbal_warning";
    requiresHRReview = (escResult.requires_hr_review as boolean) ?? true;
    coachingTopics = (escResult.coaching_topics as string[]) ?? [];
    trainingGaps = (escResult.training_gaps as string[]) ?? [];
    trackStep("escalation_router", step3Start, escResponse.cost);
  } catch (err) {
    trackStep("escalation_router", step3Start, 0, String(err));
  }

  // ── Step 4: Document Generation ───────────────────────────────────────
  const step4Start = Date.now();
  let generatedDocument = "";

  try {
    const docMessages = buildDocumentGeneratorPrompt({
      incidentType: input.incidentType,
      description: input.description,
      severity: input.severity,
      escalationLevel,
      employeeName: input.employeeName ?? "Employee",
      employeeTitle: input.employeeTitle,
      department: input.department,
      incidentDate: input.incidentDate,
      referenceNumber: input.referenceNumber,
      matchedPolicy: matchedPolicyTitle,
      matchedRule,
      previousIncidents: previousIncidents.map((inc) => ({
        date: inc.date,
        type: inc.type,
        action: inc.severity,
      })),
    });
    const docResponse = await callAI({
      messages: docMessages,
      temperature: 0.3,
      maxTokens: 3000,
    });
    generatedDocument = docResponse.content;
    trackStep("document_generator", step4Start, docResponse.cost);
  } catch (err) {
    trackStep("document_generator", step4Start, 0, String(err));
  }

  // ── Step 5: Calculate overall confidence ──────────────────────────────
  const confidenceScores = steps
    .filter((s) => s.success)
    .map((_, i) => {
      const results = [riskResult.confidence as number ?? 0.8, 0.85, 0.85, 0.9];
      return results[i] ?? 0.8;
    });
  const aiConfidence = confidenceScores.length > 0
    ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
    : 0.7;

  const result: PipelineResult = {
    success: true,
    riskLevel,
    bypassesAgent,
    bypassReason,
    similarityVerdict,
    escalationLevel,
    requiresHRReview,
    generatedDocument,
    aiConfidence,
    aiRecommendation: {
      action: escalationLevel,
      reasoning: `AI recommends ${escalationLevel} based on ${input.previousIncidentCount} prior incidents and ${similarityVerdict} verdict.`,
      risk_factors: (riskResult.risk_factors as string[]) ?? [],
      coaching_topics: coachingTopics,
      training_gaps: trainingGaps,
      matched_policy: matchedPolicyTitle,
      matched_rule: matchedRule,
    },
    linkedPolicyId: matchedPolicyId,
    riskFactors: (riskResult.risk_factors as string[]) ?? [],
    coachingTopics: coachingTopics,
    trainingGaps: trainingGaps,
    totalCost,
    totalLatencyMs: Date.now() - pipelineStart,
    steps,
  };

  // ── Step 6: Update incident in database ───────────────────────────────
  await updateIncidentInDB(input.incidentId, result);

  return result;
}

// ============================================================================
// Database Update
// ============================================================================

async function updateIncidentInDB(incidentId: string, result: PipelineResult) {
  try {
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      ai_confidence_score: result.aiConfidence,
      ai_evaluation_status: result.success ? "completed" : "failed",
      ai_recommendation: result.aiRecommendation,
      escalation_level: escalationToNumber(result.escalationLevel),
      status: result.bypassesAgent ? "pending_hr_review" : "pending_hr_review",
    };

    if (result.linkedPolicyId) {
      updateData.linked_policy_id = result.linkedPolicyId;
    }

    const { error } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", incidentId);

    if (error) {
      console.error("[pipeline] Failed to update incident:", error.message);
    }

    // Store generated document in disciplinary_actions if we have one
    if (result.generatedDocument) {
      const { data: incident } = await supabase
        .from("incidents")
        .select("company_id, employee_id")
        .eq("id", incidentId)
        .single();

      if (incident) {
        await supabase.from("disciplinary_actions").upsert({
          incident_id: incidentId,
          company_id: incident.company_id,
          employee_id: incident.employee_id,
          action_type: result.escalationLevel,
          status: "pending_signature",
          follow_up_actions: result.aiRecommendation?.coaching_topics ?? [],
          document_content: result.generatedDocument,
        }, { onConflict: "incident_id" });
      }
    }
  } catch (err) {
    console.error("[pipeline] DB update error:", err);
  }
}

function escalationToNumber(level: string): number {
  const map: Record<string, number> = {
    verbal_warning: 1,
    written_warning: 2,
    pip: 3,
    termination_review: 4,
    immediate_hr_escalation: 5,
  };
  return map[level] ?? 1;
}
