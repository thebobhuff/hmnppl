/**
 * Bulk user import API - POST /api/v1/users/import
 *
 * Imports CSV-parsed team members as Supabase invitations scoped to the
 * authenticated company.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { inviteUser } from "@/lib/services/user-service";
import { createAdminClient } from "@/lib/supabase/admin";

const EMPTY_TO_UNDEFINED = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(EMPTY_TO_UNDEFINED, z.string().trim().optional());

const importRowSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  first_name: optionalString,
  last_name: optionalString,
  role: z
    .preprocess(
      EMPTY_TO_UNDEFINED,
      z.enum(["employee", "manager", "hr_agent"]).optional(),
    )
    .default("employee"),
  job_title: optionalString,
  phone: optionalString,
  department: optionalString,
  department_id: optionalString,
  manager_email: optionalString,
  manager_id: optionalString,
  hire_date: optionalString,
});

const importSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(100),
});

type ImportRow = z.infer<typeof importRowSchema>;

interface ImportResult {
  row: number;
  email: string;
  status: "invited" | "failed" | "skipped";
  errors?: string[];
  inviteLink?: string;
  simulatedEmail?: boolean;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const POST = withAuth(
  { roles: roleGuards.companyAdminOnly },
  async (request, _context, { user }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = importSchema.safeParse(body);
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
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        request.headers.get("origin") ||
        "http://localhost:3000";
      const supabase = createAdminClient();

      const [departmentsResult, usersResult] = await Promise.all([
        supabase.from("departments").select("id, name").eq("company_id", user.companyId),
        supabase.from("users").select("id, email, role").eq("company_id", user.companyId),
      ]);

      if (departmentsResult.error) {
        throw new Error(`Failed to load departments: ${departmentsResult.error.message}`);
      }
      if (usersResult.error) {
        throw new Error(`Failed to load managers: ${usersResult.error.message}`);
      }

      const departmentById = new Map(
        (departmentsResult.data ?? []).map((department) => [
          String(department.id),
          String(department.id),
        ]),
      );
      const departmentByName = new Map(
        (departmentsResult.data ?? []).map((department) => [
          normalize(String(department.name)),
          String(department.id),
        ]),
      );
      const userById = new Map(
        (usersResult.data ?? []).map((existingUser) => [
          String(existingUser.id),
          {
            id: String(existingUser.id),
            email: String(existingUser.email),
          },
        ]),
      );
      const userByEmail = new Map(
        (usersResult.data ?? []).map((existingUser) => [
          normalize(String(existingUser.email)),
          {
            id: String(existingUser.id),
            email: String(existingUser.email),
          },
        ]),
      );

      const seenEmails = new Set<string>();
      const results: ImportResult[] = [];

      for (const [index, row] of parsed.data.rows.entries()) {
        const rowNumber = index + 2;
        const errors = validateImportRow(
          row,
          departmentById,
          departmentByName,
          userById,
          userByEmail,
        );
        const emailKey = normalize(row.email);

        if (seenEmails.has(emailKey)) {
          results.push({
            row: rowNumber,
            email: row.email,
            status: "skipped",
            errors: ["Duplicate email in this CSV."],
          });
          continue;
        }
        seenEmails.add(emailKey);

        if (errors.length > 0) {
          results.push({
            row: rowNumber,
            email: row.email,
            status: "failed",
            errors,
          });
          continue;
        }

        const departmentId = resolveDepartmentId(row, departmentById, departmentByName);
        const managerId = resolveManagerId(row, userById, userByEmail);

        try {
          const invite = await inviteUser(
            user.companyId,
            row.email,
            row.role,
            siteUrl,
            departmentId,
            managerId,
            {
              firstName: row.first_name,
              lastName: row.last_name,
              phone: row.phone,
              jobTitle: row.job_title,
              hireDate: row.hire_date,
            },
          );

          results.push({
            row: rowNumber,
            email: row.email,
            status: "invited",
            inviteLink: invite.inviteLink,
            simulatedEmail: invite.simulatedEmail,
          });
        } catch (error) {
          results.push({
            row: rowNumber,
            email: row.email,
            status: "failed",
            errors: [error instanceof Error ? error.message : "Invite failed."],
          });
        }
      }

      const summary = {
        total: results.length,
        invited: results.filter((result) => result.status === "invited").length,
        failed: results.filter((result) => result.status === "failed").length,
        skipped: results.filter((result) => result.status === "skipped").length,
      };

      return NextResponse.json({ results, summary }, { status: 200 });
    } catch (error) {
      console.error("[users:import] Failed:", error);
      return NextResponse.json({ error: "Failed to import users" }, { status: 500 });
    }
  },
);

function validateImportRow(
  row: ImportRow,
  departmentById: Map<string, string>,
  departmentByName: Map<string, string>,
  userById: Map<string, { id: string; email: string }>,
  userByEmail: Map<string, { id: string; email: string }>,
) {
  const errors: string[] = [];

  if (row.department_id && !departmentById.has(row.department_id)) {
    errors.push("Department ID was not found for this company.");
  }
  if (row.department && !departmentByName.has(normalize(row.department))) {
    errors.push("Department name was not found for this company.");
  }
  if (row.manager_id && !userById.has(row.manager_id)) {
    errors.push("Manager ID was not found for this company.");
  }
  if (row.manager_email && !userByEmail.has(normalize(row.manager_email))) {
    errors.push("Manager email was not found for this company.");
  }
  if (
    row.hire_date &&
    (!DATE_PATTERN.test(row.hire_date) || !isValidDate(row.hire_date))
  ) {
    errors.push("Hire date must be a valid YYYY-MM-DD date.");
  }

  return errors;
}

function resolveDepartmentId(
  row: ImportRow,
  departmentById: Map<string, string>,
  departmentByName: Map<string, string>,
) {
  if (row.department_id && departmentById.has(row.department_id)) {
    return row.department_id;
  }
  if (row.department) {
    return departmentByName.get(normalize(row.department)) ?? null;
  }
  return null;
}

function resolveManagerId(
  row: ImportRow,
  userById: Map<string, { id: string; email: string }>,
  userByEmail: Map<string, { id: string; email: string }>,
) {
  if (row.manager_id && userById.has(row.manager_id)) {
    return row.manager_id;
  }
  if (row.manager_email) {
    return userByEmail.get(normalize(row.manager_email))?.id ?? null;
  }
  return null;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isValidDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
