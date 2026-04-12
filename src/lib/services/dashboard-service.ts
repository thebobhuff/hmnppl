/**
 * Dashboard service — role-aware summary metrics for the home dashboard.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { UserProfile } from "@/lib/auth/session";
import { listMyEmployees } from "@/lib/services/user-service";
import { getCompanySettings } from "@/lib/services/company-service";
import {
  listEmployeeDocuments,
  type EmployeeDocumentItem,
} from "@/lib/services/employee-document-service";

export interface DashboardSummaryResponse {
  myEmployeesCount: number;
  myReportsCount: number;
  myOpenReportsCount: number;
  employeePendingDocumentsCount: number;
  employeeSignedDocumentsCount: number;
  companyTotalEmployees: number;
  activePoliciesCount: number;
  openIncidentsCount: number;
  aiConfidencePercent: number | null;
  pendingReviewsCount: number;
  aiEvaluatingCount: number;
  meetingsTodayCount: number;
  awaitingSignatureCount: number;
  recentReports: DashboardReportItem[];
  pendingReviews: DashboardReviewItem[];
  upcomingMeetings: DashboardMeetingItem[];
  pendingDocuments: DashboardEmployeeDocumentItem[];
}

export interface DashboardReportItem {
  id: string;
  reference: string;
  employeeName: string;
  status: string;
  createdAt: string;
}

export interface DashboardReviewItem {
  id: string;
  employeeName: string;
  type: string;
  severity: string;
  confidence: number | null;
  createdAt: string;
}

export interface DashboardMeetingItem {
  id: string;
  title: string;
  type: string;
  scheduledAt: string | null;
  participantSummary: string;
}

export type DashboardEmployeeDocumentItem = EmployeeDocumentItem;

type DashboardIncidentRow = {
  id: string;
  employee_id: string | null;
  reference_number?: string | null;
  status: string;
  created_at: string;
  type?: string;
  severity?: string;
  ai_confidence_score?: number | null;
};

type DashboardMeetingRow = {
  id: string;
  disciplinary_action_id: string | null;
  type: string;
  scheduled_at: string | null;
};

const OPEN_INCIDENT_STATUS_FILTER = "(closed,signed)";

export async function getDashboardSummary(
  user: Pick<UserProfile, "id" | "companyId" | "departmentId">,
): Promise<DashboardSummaryResponse> {
  const supabase = createAdminClient();

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [
    myEmployees,
    employeeDocuments,
    companySettings,
    totalEmployeesResult,
    activePoliciesResult,
    openIncidentsResult,
    myReportsResult,
    myOpenReportsResult,
    pendingReviewsResult,
    aiEvaluatingResult,
    meetingsTodayResult,
    awaitingSignatureResult,
    recentReportsResult,
    pendingReviewsDataResult,
    upcomingMeetingsResult,
  ] = await Promise.all([
    listMyEmployees(user.companyId, user.id, user.departmentId),
    listEmployeeDocuments(user.companyId, user.id),
    getCompanySettings(user.companyId),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId),
    supabase
      .from("policies")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("is_active", true),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .not("status", "in", OPEN_INCIDENT_STATUS_FILTER),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("reported_by", user.id),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("reported_by", user.id)
      .not("status", "in", OPEN_INCIDENT_STATUS_FILTER),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("status", "pending_hr_review"),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("status", "ai_evaluating"),
    supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", endOfDay.toISOString()),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("status", "pending_signature"),
    supabase
      .from("incidents")
      .select("id, employee_id, reference_number, status, created_at")
      .eq("company_id", user.companyId)
      .eq("reported_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("incidents")
      .select("id, employee_id, type, severity, ai_confidence_score, created_at")
      .eq("company_id", user.companyId)
      .eq("status", "pending_hr_review")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("meetings")
      .select("id, disciplinary_action_id, type, scheduled_at")
      .eq("company_id", user.companyId)
      .gte("scheduled_at", startOfDay.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  const queryErrors = [
    totalEmployeesResult.error,
    activePoliciesResult.error,
    openIncidentsResult.error,
    myReportsResult.error,
    myOpenReportsResult.error,
    pendingReviewsResult.error,
    aiEvaluatingResult.error,
    meetingsTodayResult.error,
    awaitingSignatureResult.error,
    recentReportsResult.error,
    pendingReviewsDataResult.error,
    upcomingMeetingsResult.error,
  ].filter(Boolean);

  if (queryErrors.length > 0) {
    throw new Error(queryErrors[0]?.message ?? "Failed to load dashboard summary");
  }

  const reportEmployeeIds = new Set<string>();
  const reviewEmployeeIds = new Set<string>();
  const meetingActionIds = new Set<string>();

  for (const report of recentReportsResult.data ?? []) {
    if (report.employee_id) {
      reportEmployeeIds.add(report.employee_id as string);
    }
  }

  for (const review of pendingReviewsDataResult.data ?? []) {
    if (review.employee_id) {
      reviewEmployeeIds.add(review.employee_id as string);
    }
  }

  for (const meeting of upcomingMeetingsResult.data ?? []) {
    if (meeting.disciplinary_action_id) {
      meetingActionIds.add(meeting.disciplinary_action_id as string);
    }
  }

  const [reportEmployeesResult, reviewEmployeesResult, meetingActionsResult] =
    await Promise.all([
      reportEmployeeIds.size > 0
        ? supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", Array.from(reportEmployeeIds))
        : Promise.resolve({ data: [], error: null }),
      reviewEmployeeIds.size > 0
        ? supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", Array.from(reviewEmployeeIds))
        : Promise.resolve({ data: [], error: null }),
      meetingActionIds.size > 0
        ? supabase
            .from("disciplinary_actions")
            .select("id, employee_id")
            .in("id", Array.from(meetingActionIds))
        : Promise.resolve({ data: [], error: null }),
    ]);

  const secondaryErrors = [
    reportEmployeesResult.error,
    reviewEmployeesResult.error,
    meetingActionsResult.error,
  ].filter(Boolean);

  if (secondaryErrors.length > 0) {
    throw new Error(secondaryErrors[0]?.message ?? "Failed to load dashboard details");
  }

  const meetingEmployeeIds = new Set<string>();
  for (const action of meetingActionsResult.data ?? []) {
    if (action.employee_id) {
      meetingEmployeeIds.add(action.employee_id as string);
    }
  }

  const meetingEmployeesResult =
    meetingEmployeeIds.size > 0
      ? await supabase
          .from("users")
          .select("id, first_name, last_name")
          .in("id", Array.from(meetingEmployeeIds))
      : { data: [], error: null };

  if (meetingEmployeesResult.error) {
    throw new Error(meetingEmployeesResult.error.message);
  }

  const reportEmployeeNames = new Map(
    (reportEmployeesResult.data ?? []).map((employee) => [
      employee.id as string,
      formatUserName(
        employee.first_name as string | null,
        employee.last_name as string | null,
      ),
    ]),
  );
  const reviewEmployeeNames = new Map(
    (reviewEmployeesResult.data ?? []).map((employee) => [
      employee.id as string,
      formatUserName(
        employee.first_name as string | null,
        employee.last_name as string | null,
      ),
    ]),
  );
  const meetingEmployeeNames = new Map(
    (meetingEmployeesResult.data ?? []).map((employee) => [
      employee.id as string,
      formatUserName(
        employee.first_name as string | null,
        employee.last_name as string | null,
      ),
    ]),
  );
  const actionEmployeeIds = new Map(
    (meetingActionsResult.data ?? []).map((action) => [
      action.id as string,
      (action.employee_id as string | null) ?? null,
    ]),
  );
  const pendingDocuments = employeeDocuments.filter(
    (document: EmployeeDocumentItem) => document.status === "pending_signature",
  );
  const signedDocuments = employeeDocuments.filter(
    (document: EmployeeDocumentItem) => document.status === "signed",
  );

  return {
    myEmployeesCount: myEmployees.length,
    myReportsCount: myReportsResult.count ?? 0,
    myOpenReportsCount: myOpenReportsResult.count ?? 0,
    employeePendingDocumentsCount: pendingDocuments.length,
    employeeSignedDocumentsCount: signedDocuments.length,
    companyTotalEmployees: totalEmployeesResult.count ?? 0,
    activePoliciesCount: activePoliciesResult.count ?? 0,
    openIncidentsCount: openIncidentsResult.count ?? 0,
    aiConfidencePercent:
      companySettings?.ai_confidence_threshold !== undefined
        ? Math.round(companySettings.ai_confidence_threshold * 100)
        : null,
    pendingReviewsCount: pendingReviewsResult.count ?? 0,
    aiEvaluatingCount: aiEvaluatingResult.count ?? 0,
    meetingsTodayCount: meetingsTodayResult.count ?? 0,
    awaitingSignatureCount: awaitingSignatureResult.count ?? 0,
    recentReports: ((recentReportsResult.data ?? []) as DashboardIncidentRow[]).map((report) => ({
      id: report.id as string,
      reference: (report.reference_number as string) ?? "Incident",
      employeeName:
        reportEmployeeNames.get((report.employee_id as string) ?? "") ??
        "Unknown employee",
      status: report.status as string,
      createdAt: report.created_at as string,
    })),
    pendingReviews: ((pendingReviewsDataResult.data ?? []) as DashboardIncidentRow[]).map((review) => ({
      id: review.id as string,
      employeeName:
        reviewEmployeeNames.get((review.employee_id as string) ?? "") ??
        "Unknown employee",
      type: review.type as string,
      severity: review.severity as string,
      confidence:
        review.ai_confidence_score === null || review.ai_confidence_score === undefined
          ? null
          : Number(review.ai_confidence_score),
      createdAt: review.created_at as string,
    })),
    upcomingMeetings: ((upcomingMeetingsResult.data ?? []) as DashboardMeetingRow[]).map((meeting) => {
      const employeeId = actionEmployeeIds.get(
        (meeting.disciplinary_action_id as string) ?? "",
      );
      const employeeName = employeeId
        ? (meetingEmployeeNames.get(employeeId) ?? "Employee")
        : "Employee";

      return {
        id: meeting.id as string,
        title: `${formatMeetingType(meeting.type as string)} - ${employeeName}`,
        type: formatMeetingType(meeting.type as string),
        scheduledAt: (meeting.scheduled_at as string) ?? null,
        participantSummary: `HR and ${employeeName}`,
      };
    }),
    pendingDocuments: pendingDocuments.slice(0, 5),
  };
}

function formatUserName(firstName: string | null, lastName: string | null): string {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return fullName || "Unknown employee";
}

function formatMeetingType(type: string): string {
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
