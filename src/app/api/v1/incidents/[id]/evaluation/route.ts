/**
 * GET /api/v1/incidents/[id]/evaluation
 *
 * Returns the AI evaluation results for a specific incident.
 * Used by the HR review page to show real AI data instead of mock.
 */

import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAuth(
  { roles: roleGuards.hrAgent },
  async (request, context) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = createAdminClient();

    // Fetch incident with AI evaluation data
    const { data: incident, error: incError } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .eq("company_id", user.companyId)
      .single();

    if (incError || !incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Fetch employee info
    const { data: employee } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, job_title, hire_date, department_id")
      .eq("id", incident.employee_id)
      .single();

    // Fetch reporter info
    const { data: reporter } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("id", incident.reported_by)
      .single();

    // Fetch previous incidents for this employee
    const { data: previousIncidents } = await supabase
      .from("incidents")
      .select("id, type, severity, created_at, status, description")
      .eq("employee_id", incident.employee_id)
      .eq("company_id", user.companyId)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch disciplinary action (generated document)
    const { data: disciplinaryAction } = await supabase
      .from("disciplinary_actions")
      .select("*")
      .eq("incident_id", id)
      .maybeSingle();

    // Fetch matched policy
    let matchedPolicy = null;
    if (incident.linked_policy_id) {
      const { data: policy } = await supabase
        .from("policies")
        .select("id, title, category, rules, severity_levels")
        .eq("id", incident.linked_policy_id)
        .single();
      matchedPolicy = policy;
    }

    // Find matching policy from snapshot if not linked
    if (!matchedPolicy && incident.policy_snapshot) {
      const snapshot = incident.policy_snapshot as Record<string, unknown>[];
      const match = snapshot?.find((p: any) => {
        const cat = (p.category as string)?.toLowerCase() ?? "";
        return cat.includes(incident.type.toLowerCase());
      });
      if (match) {
        matchedPolicy = match;
      }
    }

    const recommendation = incident.ai_recommendation as Record<string, unknown> | null;

    return NextResponse.json({
      incident: {
        id: incident.id,
        reference_number: incident.reference_number,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        incident_date: incident.incident_date,
        status: incident.status,
        ai_confidence_score: incident.ai_confidence_score,
        ai_evaluation_status: incident.ai_evaluation_status,
        escalation_level: incident.escalation_level,
        previous_incident_count: incident.previous_incident_count,
        union_involved: incident.union_involved,
        created_at: incident.created_at,
      },
      employee: employee ?? null,
      reporter: reporter ?? null,
      previousIncidents: previousIncidents ?? [],
      disciplinaryAction: disciplinaryAction ?? null,
      generatedDocument: (disciplinaryAction?.document_content as string) ?? null,
      aiRecommendation: recommendation ?? null,
      matchedPolicy: matchedPolicy ?? null,
      riskFactors: (recommendation?.risk_factors as string[]) ?? [],
      coachingTopics: (recommendation?.coaching_topics as string[]) ?? [],
      trainingGaps: (recommendation?.training_gaps as string[]) ?? [],
    });
  },
);
