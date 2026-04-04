/**
 * Incident state machine.
 *
 * Defines valid status transitions for the incident lifecycle.
 * Each transition is validated before allowing status changes.
 */

export type IncidentStatus =
  | "ai_evaluating"
  | "ai_evaluated"
  | "pending_hr_review"
  | "approved"
  | "rejected"
  | "meeting_scheduled"
  | "document_delivered"
  | "pending_signature"
  | "signed"
  | "disputed"
  | "closed"
  | "escalated_legal";

export interface StateTransition {
  from: IncidentStatus;
  to: IncidentStatus;
  description: string;
}

/**
 * Valid state transitions for incidents.
 *
 * The incident lifecycle:
 *   ai_evaluating → ai_evaluated → pending_hr_review → approved → meeting_scheduled
 *     → document_delivered → pending_signature → signed/closed
 *
 * Branch paths:
 *   - pending_hr_review → rejected → closed
 *   - pending_hr_review → escalated_legal
 *   - pending_signature → disputed → pending_hr_review
 */
export const VALID_TRANSITIONS: StateTransition[] = [
  { from: "ai_evaluating", to: "ai_evaluated", description: "AI evaluation completed" },
  {
    from: "ai_evaluating",
    to: "pending_hr_review",
    description: "AI evaluation failed or below threshold",
  },
  { from: "ai_evaluated", to: "pending_hr_review", description: "Ready for HR review" },
  { from: "pending_hr_review", to: "approved", description: "HR approved the document" },
  { from: "pending_hr_review", to: "rejected", description: "HR rejected the document" },
  {
    from: "pending_hr_review",
    to: "escalated_legal",
    description: "Escalated to legal review",
  },
  { from: "rejected", to: "ai_evaluating", description: "Regenerate with HR feedback" },
  { from: "rejected", to: "closed", description: "Close without action" },
  { from: "approved", to: "meeting_scheduled", description: "Meeting scheduled" },
  {
    from: "meeting_scheduled",
    to: "document_delivered",
    description: "Meeting completed, document delivered to employee",
  },
  {
    from: "document_delivered",
    to: "pending_signature",
    description: "Employee acknowledged document",
  },
  {
    from: "pending_signature",
    to: "signed",
    description: "Employee signed the document",
  },
  {
    from: "pending_signature",
    to: "disputed",
    description: "Employee disputed the document",
  },
  { from: "disputed", to: "pending_hr_review", description: "Dispute sent to HR review" },
  { from: "disputed", to: "closed", description: "Dispute resolved, case closed" },
  {
    from: "approved",
    to: "closed",
    description: "Action completed without meeting (verbal warning)",
  },
  {
    from: "escalated_legal",
    to: "closed",
    description: "Legal review completed, case closed",
  },
  {
    from: "escalated_legal",
    to: "pending_hr_review",
    description: "Legal returned to HR review",
  },
];

/**
 * Gets the allowed next states from a given status.
 */
export function getAllowedTransitions(from: IncidentStatus): IncidentStatus[] {
  return VALID_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
}

/**
 * Validates a state transition.
 *
 * @returns true if the transition is valid, false otherwise
 */
export function isValidTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/**
 * Gets the description for a valid transition, or null if invalid.
 */
export function getTransitionDescription(
  from: IncidentStatus,
  to: IncidentStatus,
): string | null {
  const transition = VALID_TRANSITIONS.find((t) => t.from === from && t.to === to);
  return transition?.description ?? null;
}
