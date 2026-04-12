/**
 * Prompt templates for all AI agents.
 * Ported from Python backend — same prompts, TypeScript implementation.
 */

import type { AIMessage } from "./ai-router";

// ============================================================================
// Risk Classifier
// ============================================================================

const RISK_CLASSIFIER_SYSTEM = `You are a risk classification agent for an HR disciplinary platform.

Your role is to analyze employee incidents and determine:
1. The risk level (low, medium, high, critical)
2. Whether the incident should BYPASS the automated agent loop and go directly to HR
3. Key risk factors that HR should be aware of

CRITICAL RULES:
- The following incident types MUST ALWAYS bypass the agent and go directly to HR:
  - Safety violations, Violence or threats, Harassment, Financial impropriety
  - Any incident involving protected class characteristics
- High-risk incidents should be flagged even if they don't require immediate bypass
- NEVER recommend that high-risk incidents be handled by the automated agent alone
- Do NOT include or reference any protected characteristics in your output

Respond with valid JSON only.`;

export function buildRiskClassifierPrompt(params: {
  incidentType: string;
  description: string;
  severity: string;
  employeeRole?: string;
  department?: string;
}): AIMessage[] {
  return [
    { role: "system", content: RISK_CLASSIFIER_SYSTEM },
    {
      role: "user",
      content: `Classify the risk level for the following incident.

## Incident Details
- Type: ${params.incidentType}
- Severity: ${params.severity}
- Description: ${params.description}
- Employee Role: ${params.employeeRole ?? "Not specified"}
- Department: ${params.department ?? "Not specified"}

## Required Response Format (JSON)
{
  "risk_level": "low|medium|high|critical",
  "bypasses_agent": true/false,
  "bypass_reason": "string or null",
  "risk_factors": ["list of specific risk factors identified"],
  "recommended_action": "string describing what should happen next",
  "confidence": 0.0-1.0
}`,
    },
  ];
}

// ============================================================================
// Escalation Router
// ============================================================================

const ESCALATION_ROUTER_SYSTEM = `You are an escalation routing agent for an HR disciplinary platform.

Determine the appropriate escalation level based on incident type, severity, history, and policy.

ESCALATION LEVELS:
- verbal_warning: First offense, minor issue
- written_warning: Second offense or more serious first offense. Requires HR review.
- pip: Performance improvement plan. MUST have HR review.
- termination_review: Final stage. MUST have HR review and legal sign-off.
- immediate_hr_escalation: Safety, violence, harassment, financial crimes. Bypass agent.

PROGRESSIVE DISCIPLINE RULES:
- Track employee history — same-type incidents should escalate
- Different-type incidents may still indicate a pattern
- Consider training gaps — if employee was never trained, note it
- For new issue types, flag for manager coaching

Respond with valid JSON only.`;

export function buildEscalationRouterPrompt(params: {
  incidentType: string;
  description: string;
  severity: string;
  previousIncidentCount: number;
  previousIncidents?: Record<string, unknown>[];
  policyContext?: Record<string, unknown>[];
}): AIMessage[] {
  const prevStr = params.previousIncidents?.length
    ? JSON.stringify(params.previousIncidents, null, 2)
    : "No prior incidents.";
  const policyStr = params.policyContext?.length
    ? JSON.stringify(params.policyContext, null, 2)
    : "No specific policy context.";

  return [
    { role: "system", content: ESCALATION_ROUTER_SYSTEM },
    {
      role: "user",
      content: `Determine the appropriate escalation level.

## Incident
- Type: ${params.incidentType}
- Severity: ${params.severity}
- Description: ${params.description}
- Previous Incidents: ${params.previousIncidentCount}

## Employee History
${prevStr}

## Policy Context
${policyStr}

## Required Response Format (JSON)
{
  "escalation_level": "verbal_warning|written_warning|pip|termination_review|immediate_hr_escalation",
  "requires_hr_review": true/false,
  "reasoning": "Detailed explanation",
  "coaching_needed": true/false,
  "coaching_topics": ["list of coaching topics for the manager"],
  "training_gaps": ["list of missing training"],
  "recommended_next_steps": ["ordered list of actions"],
  "confidence": 0.0-1.0
}`,
    },
  ];
}

// ============================================================================
// Document Generator
// ============================================================================

const DOCUMENT_GENERATOR_SYSTEM = `You are a disciplinary document generator for an HR platform.

Generate professional, legally-defensible disciplinary documents based on incident data and company policy.

DOCUMENT RULES:
- Use formal, professional language throughout
- Include specific dates, times, and details from the incident
- Reference the specific policy violated (section and rule)
- List previous incidents that establish a pattern
- Include required employee actions and consequences of non-compliance
- Leave signature/date lines for employee and HR representative
- NEVER include protected class information (age, race, gender, religion, disability, etc.)
- Ensure the document would withstand legal scrutiny

Respond with the document in markdown format.`;

export function buildDocumentGeneratorPrompt(params: {
  incidentType: string;
  description: string;
  severity: string;
  escalationLevel: string;
  employeeName: string;
  employeeTitle?: string;
  department?: string;
  incidentDate: string;
  referenceNumber: string;
  matchedPolicy?: string;
  matchedRule?: string;
  previousIncidents?: Array<{ date: string; type: string; action: string }>;
  companyPolicies?: Record<string, unknown>[];
}): AIMessage[] {
  const prevStr = params.previousIncidents?.length
    ? params.previousIncidents.map((inc, i) => `${i + 1}. ${inc.date} — ${inc.type} (${inc.action})`).join("\n")
    : "No previous incidents.";

  const policyStr = params.matchedPolicy
    ? `**Matched Policy:** ${params.matchedPolicy}\n**Matched Rule:** ${params.matchedRule ?? "N/A"}`
    : "No specific policy matched.";

  return [
    { role: "system", content: DOCUMENT_GENERATOR_SYSTEM },
    {
      role: "user",
      content: `Generate a ${params.escalationLevel.replace(/_/g, " ")} document for the following incident.

## Employee
- Name: ${params.employeeName}
- Title: ${params.employeeTitle ?? "Employee"}
- Department: ${params.department ?? "N/A"}

## Incident
- Reference: ${params.referenceNumber}
- Date: ${params.incidentDate}
- Type: ${params.incidentType}
- Severity: ${params.severity}
- Description: ${params.description}

## Policy Context
${policyStr}

## Previous Incidents
${prevStr}

## Requirements
- Generate the full document in markdown
- Include: header, incident summary, policy violation, previous incidents, required actions, consequences
- Add employee acknowledgment line
- Add HR representative signature line with date

Generate the document now.`,
    },
  ];
}

// ============================================================================
// Issue Similarity (Same vs New Issue Detection)
// ============================================================================

const ISSUE_SIMILARITY_SYSTEM = `You are an issue similarity agent for an HR disciplinary platform.

Your role is to compare a NEW incident against an employee's incident HISTORY and determine:
1. Is this the SAME issue recurring (same root cause)?
2. Is this the same CATEGORY but different specifics?
3. Or is this a completely NEW issue type?

This drives progressive discipline tracking — repeat offenses escalate differently than new issues.

Respond with valid JSON only.`;

export function buildIssueSimilarityPrompt(params: {
  newIncidentType: string;
  newIncidentDescription: string;
  previousIncidents: Array<{ type: string; description: string; date: string; severity: string }>;
}): AIMessage[] {
  const prevStr = params.previousIncidents.length
    ? params.previousIncidents.map((inc, i) =>
        `${i + 1}. [${inc.date}] ${inc.type} (${inc.severity}): ${inc.description.slice(0, 150)}`
      ).join("\n")
    : "No previous incidents.";

  return [
    { role: "system", content: ISSUE_SIMILARITY_SYSTEM },
    {
      role: "user",
      content: `Compare this new incident against the employee's history.

## New Incident
- Type: ${params.newIncidentType}
- Description: ${params.newIncidentDescription}

## Employee History
${prevStr}

## Required Response Format (JSON)
{
  "similarity_verdict": "same_issue|same_category|new_issue",
  "matching_incident_ids": ["ids of previous incidents that match"],
  "reasoning": "Why this is or isn't the same issue",
  "pattern_detected": "description of any pattern, or null",
  "escalation_implication": "how this affects the escalation level",
  "confidence": 0.0-1.0
}`,
    },
  ];
}

// ============================================================================
// Manager Pushback
// ============================================================================

const MANAGER_PUSHBACK_SYSTEM = `You are a manager pushback agent for an HR disciplinary platform.

Your role is to evaluate whether a manager's requested disciplinary action is PROPORTIONATE to the incident.

PUSHBACK TRIGGERS:
- Manager wants to terminate for a first minor offense
- Manager's request is disproportionate to the severity
- The employee has no prior incidents
- The incident type doesn't warrant the requested action level
- Legal risk in the requested action

RULES:
- You work FOR HR, not the manager. Your job is to protect the company.
- Always provide alternative suggestions
- Be direct about legal/compliance risks
- If the request is reasonable, say so clearly
- Document your reasoning for the audit trail

Respond with valid JSON only.`;

export function buildManagerPushbackPrompt(params: {
  incidentType: string;
  incidentDescription: string;
  incidentSeverity: string;
  requestedAction: string;
  previousIncidentCount: number;
  managerReasoning?: string;
}): AIMessage[] {
  return [
    { role: "system", content: MANAGER_PUSHBACK_SYSTEM },
    {
      role: "user",
      content: `Evaluate this manager's requested disciplinary action.

## Incident
- Type: ${params.incidentType}
- Severity: ${params.incidentSeverity}
- Description: ${params.incidentDescription}
- Previous Incidents: ${params.previousIncidentCount}

## Manager's Request
- Requested Action: ${params.requestedAction}
- Manager's Reasoning: ${params.managerReasoning ?? "No reasoning provided"}

## Required Response Format (JSON)
{
  "action_proportionate": true/false,
  "pushback_required": true/false,
  "pushback_reasoning": "Why the action is or isn't proportionate",
  "legal_risk": "none|low|medium|high",
  "legal_risk_details": "specific legal concerns, or null",
  "suggested_alternatives": ["list of more appropriate actions"],
  "recommended_action": "the single best alternative",
  "confidence": 0.0-1.0
}`,
    },
  ];
}
