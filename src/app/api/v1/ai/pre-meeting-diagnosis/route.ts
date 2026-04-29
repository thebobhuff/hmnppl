/**
 * AI Pre-Meeting Diagnosis API — POST /api/v1/ai/pre-meeting-diagnosis
 *
 * Accepts a meeting ID and returns AI-powered diagnosis before the meeting:
 *   - Key risks and topics to address
 *   - Recommended talking points
 *   - Historical context about the employee
 *   - Suggested questions to ask
 *
 * Requires meeting to be linked to a disciplinary action with an incident.
 */
import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { getMeeting } from "@/lib/services/meeting-service";
import { getIncident } from "@/lib/services/incident-service";
import { getDisciplinaryAction } from "@/lib/services/disciplinary-action-service";
import { getUser } from "@/lib/services/user-service";

export const POST = withAuth(
  { roles: roleGuards.hrAgentOnly },
  async (request) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { meeting_id } = body as { meeting_id?: string };
    if (!meeting_id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "meeting_id is required" } },
        { status: 400 },
      );
    }

    try {
      const meeting = await getMeeting(user.companyId, meeting_id);
      if (!meeting) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      const disciplinaryAction = meeting.disciplinary_action_id
        ? await getDisciplinaryAction(user.companyId, meeting.disciplinary_action_id)
        : null;

      const incident = disciplinaryAction?.incident_id
        ? await getIncident(user.companyId, disciplinaryAction.incident_id)
        : null;

      const employee = incident
        ? await getUser(user.companyId, incident.employee_id)
        : null;

      const manager = incident
        ? await getUser(user.companyId, incident.reported_by)
        : null;

      const policy = incident?.policy_snapshot as Record<string, unknown> | null;
      const severity = incident?.severity ?? "medium";
      const incidentType = incident?.type ?? "unknown";
      const priorIncidentCount = incident?.previous_incident_count ?? 0;

      const diagnosis = buildDiagnosis({
        employee,
        manager,
        incident,
        disciplinaryAction,
        policy,
        severity,
        incidentType,
        priorIncidentCount,
        meetingType: meeting.type,
      });

      return NextResponse.json({ diagnosis });
    } catch (error) {
      console.error("[ai:pre-meeting-diagnosis] Failed:", error);
      return NextResponse.json(
        { error: "Failed to generate pre-meeting diagnosis" },
        { status: 500 },
      );
    }
  },
);

interface DiagnosisInput {
  employee: Awaited<ReturnType<typeof getUser>> | null;
  manager: Awaited<ReturnType<typeof getUser>> | null;
  incident: Awaited<ReturnType<typeof getIncident>> | null;
  disciplinaryAction: Awaited<ReturnType<typeof getDisciplinaryAction>> | null;
  policy: Record<string, unknown> | null;
  severity: string;
  incidentType: string;
  priorIncidentCount: number;
  meetingType: string;
}

function buildDiagnosis(input: DiagnosisInput) {
  const {
    employee,
    manager,
    incident,
    policy,
    severity,
    incidentType,
    priorIncidentCount,
    meetingType,
  } = input;

  const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : "Unknown Employee";
  const managerName = manager ? `${manager.first_name} ${manager.last_name}` : "Unknown Manager";

  const riskLevel = getRiskLevel(severity, priorIncidentCount);

  const keyTopics = buildKeyTopics(incidentType, severity, priorIncidentCount, policy);

  const talkingPoints = buildTalkingPoints(incidentType, policy, severity, priorIncidentCount);

  const suggestedQuestions = buildSuggestedQuestions(incidentType, severity);

  const historicalContext = buildHistoricalContext(priorIncidentCount, incidentType);

  const preparationChecklist = buildPreparationChecklist(meetingType, severity);

  return {
    summary: `Pre-meeting diagnosis for ${employeeName}. This ${incidentType} incident has a ${riskLevel} risk level and will be discussed in a ${meetingType} meeting.`,
    risk_level: riskLevel,
    key_topics: keyTopics,
    talking_points: talkingPoints,
    suggested_questions: suggestedQuestions,
    historical_context: historicalContext,
    preparation_checklist: preparationChecklist,
    employee_name: employeeName,
    manager_name: managerName,
    incident_reference: incident?.reference_number ?? null,
    severity,
    prior_incidents: priorIncidentCount,
    policy_aligned: policy !== null,
    policy_sections: policy
      ? extractPolicySections(policy)
      : [],
  };
}

function getRiskLevel(severity: string, priorCount: number): string {
  if (severity === "critical" || priorCount >= 3) return "critical";
  if (severity === "high" || priorCount >= 2) return "high";
  if (severity === "medium" || priorCount >= 1) return "medium";
  return "low";
}

function buildKeyTopics(
  incidentType: string,
  severity: string,
  priorCount: number,
  policy: Record<string, unknown> | null,
): string[] {
  const topics: string[] = [];

  const typeLabels: Record<string, string> = {
    tardiness: "Tardiness and attendance patterns",
    absence: "Unexcused absences and no-call/no-show",
    insubordination: "Insubordination and refusal to follow directives",
    performance: "Performance standards and expectations",
    misconduct: "Workplace conduct and behavioral expectations",
    policy_violation: "Policy compliance and company standards",
    safety_violation: "Safety protocol adherence",
    harassment: "Harassment prevention and workplace respect",
    violence: "Threats and workplace violence prevention",
  };

  topics.push(typeLabels[incidentType] ?? `Incident type: ${incidentType}`);

  if (severity === "critical" || severity === "high") {
    topics.push("Potential escalation consequences");
    topics.push("Documentation requirements for HR record");
  }

  if (priorCount > 0) {
    topics.push(`Prior incident history (${priorCount} prior ${priorCount === 1 ? "incident" : "incidents"})`);
    topics.push("Progressive discipline implications");
  }

  topics.push("Employee's opportunity to respond");
  topics.push("Clear expectations for improvement");

  return topics;
}

function buildTalkingPoints(
  incidentType: string,
  policy: Record<string, unknown> | null,
  severity: string,
  priorCount: number,
): string[] {
  const points: string[] = [];

  points.push("Review the specific incident details with the employee");
  points.push("Explain the company policy being applied");
  points.push("Allow the employee to provide their perspective");
  points.push("Discuss the expected conduct going forward");

  if (policy && typeof policy === "object") {
    const rules = policy.rules as Array<{ actions?: Array<{ action_type?: string }> }> | undefined;
    if (rules && rules.length > 0) {
      const firstRule = rules[0];
      if (firstRule?.actions && firstRule.actions.length > 0) {
        const actionType = firstRule.actions[0].action_type ?? "unknown";
        points.push(`The recommended action level is: ${actionType.replace(/_/g, " ")}`);
      }
    }
  }

  if (priorCount === 0) {
    points.push("This is a first offense — approach constructively");
    points.push("Set clear improvement expectations with timeline");
  } else if (priorCount === 1) {
    points.push("This is a second incident — formal warning level");
    points.push("Escalation path must be clearly communicated");
  } else {
    points.push("Multiple prior incidents — consistent enforcement critical");
    points.push("PIP or higher level action may be warranted");
  }

  return points;
}

function buildSuggestedQuestions(incidentType: string, severity: string): string[] {
  const questions: string[] = [];

  const typeQuestions: Record<string, string[]> = {
    tardiness: [
      "Can you explain what led to the late arrival on the incident date?",
      "Are there any ongoing circumstances affecting your attendance?",
      "What steps can you take to ensure punctuality going forward?",
    ],
    absence: [
      "We did not receive notification of your absence on that date. Can you explain what happened?",
      "Are there any personal circumstances we should be aware of?",
      "How can we work together to prevent future absences?",
    ],
    insubordination: [
      "Can you describe your understanding of the instruction that was given?",
      "What was your reasoning for not following the directive?",
      "How do you feel about working with your manager on this moving forward?",
    ],
    performance: [
      "What challenges have you encountered in meeting the performance expectations?",
      "What support or resources would help you improve?",
      "What does success look like to you in this role?",
    ],
    misconduct: [
      "Can you describe your perspective on the incident?",
      "Are you aware of how this behavior affects the workplace?",
      "What steps will you take to ensure this does not happen again?",
    ],
  };

  const q = typeQuestions[incidentType] ?? [
    "Can you provide your perspective on what happened?",
    "What is your understanding of the company policy involved?",
    "What would help you comply going forward?",
  ];
  questions.push(...q);

  if (severity === "critical") {
    questions.push("Do you understand the potential consequences of this incident?");
  }

  return questions;
}

function buildHistoricalContext(priorCount: number, incidentType: string): string {
  if (priorCount === 0) {
    return "This appears to be the employee's first incident on record. A constructive first-step approach is appropriate.";
  }
  if (priorCount === 1) {
    return "The employee has one prior incident of a different or similar type. This is the second step in the progressive discipline process.";
  }
  if (priorCount === 2) {
    return "The employee has two prior incidents. A stronger response is warranted. Consider whether a PIP is appropriate.";
  }
  return `The employee has ${priorCount} prior incidents on record. This indicates a pattern that requires decisive action. Termination review should be considered.`;
}

function buildPreparationChecklist(meetingType: string, severity: string): string[] {
  const checklist: string[] = [
    "Review the complete incident report and any evidence",
    "Confirm all participants have been notified",
    "Prepare printed copies of relevant documents",
    "Arrange for a witness or HR representative to attend",
  ];

  if (severity === "critical") {
    checklist.push("Ensure legal or compliance team has reviewed the case");
    checklist.push("Prepare termination paperwork as a contingency");
  }

  if (meetingType === "pip" || meetingType === "termination") {
    checklist.push("Confirm HR leadership approval for meeting type");
    checklist.push("Have witness present for documentation purposes");
  }

  checklist.push("Prepare room with adequate seating and privacy");
  checklist.push("Set aside sufficient time for employee response");

  return checklist;
}

function extractPolicySections(policy: Record<string, unknown>): string[] {
  const sections: string[] = [];
  if (policy.title) sections.push(`Policy: ${policy.title}`);
  if (policy.category) sections.push(`Category: ${policy.category}`);

  const rules = policy.rules as Array<{
    triggers?: Array<{ field?: string; value?: unknown }>;
    conditions?: Array<{ field?: string; value?: unknown }>;
  }> | undefined;

  if (rules && rules.length > 0) {
    for (const rule of rules.slice(0, 3)) {
      if (rule.triggers && rule.triggers.length > 0) {
        for (const trigger of rule.triggers) {
          if (trigger.field) sections.push(`Trigger: ${trigger.field}`);
        }
      }
    }
  }

  return sections.slice(0, 5);
}