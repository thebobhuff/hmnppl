/**
 * HR Bulk Upload API — POST /api/v1/hr/upload-data
 *
 * Accepts a CSV data dump and bulk-creates/updates users with manager_id relations.
 *
 * Expected CSV columns:
 *   email, first_name, last_name, role, job_title, department_id, manager_email
 *
 * Role enum: employee | manager | hr_agent | company_admin
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const UploadRowSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  role: z.enum(["employee", "manager", "hr_agent", "company_admin"]),
  job_title: z.string().optional(),
  department_id: z.string().uuid().optional().nullable(),
  manager_email: z.string().email().optional().nullable(),
});

type UploadRow = z.infer<typeof UploadRowSchema>;

interface ParseResult {
  line: number;
  email: string;
  success: boolean;
  message: string;
  user_id?: string;
}

function parseCSV(body: string): { headers: string[]; rows: string[][] } {
  const lines = body.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));
  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function mapRowToObject(headers: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    obj[headers[i].toLowerCase().trim()] = row[i] ?? "";
  }
  return obj;
}

export const POST = withAuth(
  { roles: ["company_admin", "hr_agent"] },
  async (request, _context, { user }) => {
    const supabase = createAdminClient();

    let body: string;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      body = await file.text();
    } else {
      body = await request.text();
    }

    const { headers, rows } = parseCSV(body);

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json(
        { error: "CSV must have headers and at least one data row" },
        { status: 400 },
      );
    }

    const headerMap: Record<string, number> = {};
    for (let i = 0; i < headers.length; i++) {
      headerMap[headers[i].toLowerCase().trim()] = i;
    }

    const required = ["email", "first_name", "last_name", "role"];
    for (const col of required) {
      if (!(col in headerMap)) {
        return NextResponse.json(
          { error: `Missing required column: ${col}` },
          { status: 400 },
        );
      }
    }

    const parsedRows: Array<{ line: number; data: UploadRow; raw: Record<string, string> }> = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = mapRowToObject(headers, rows[i]);
      const result = UploadRowSchema.safeParse(raw);
      if (!result.success) {
        errors.push(`Row ${i + 2}: ${result.error.issues.map((j) => j.message).join("; ")}`);
        continue;
      }
      parsedRows.push({ line: i + 2, data: result.data, raw });
    }

    if (errors.length > 0 && parsedRows.length === 0) {
      return NextResponse.json({ error: "All rows failed validation", details: errors }, { status: 400 });
    }

    // Build email -> user_id lookup for manager resolution
    const allEmails = parsedRows.map((r) => r.data.email).filter(Boolean);
    const managerEmails = parsedRows
      .map((r) => r.data.manager_email)
      .filter(Boolean) as string[];

    const { data: existingUsers } = await supabase
      .from("users")
      .select("id, email")
      .eq("company_id", user.companyId)
      .in("email", [...new Set([...allEmails, ...managerEmails])]);

    const emailToId = new Map<string, string>();
    for (const u of existingUsers ?? []) {
      emailToId.set(u.email.toLowerCase(), u.id);
    }

    const results: ParseResult[] = [];
    const usersToUpsert: Array<{
      email: string;
      company_id: string;
      first_name: string;
      last_name: string;
      role: string;
      job_title: string | null;
      department_id: string | null;
      manager_id: string | null;
      status: string;
    }> = [];

    for (const { line, data, raw } of parsedRows) {
      const existingId = emailToId.get(data.email.toLowerCase());
      const managerId = data.manager_email
        ? emailToId.get(data.manager_email.toLowerCase()) ?? null
        : null;

      if (data.manager_email && !managerId) {
        results.push({
          line,
          email: data.email,
          success: false,
          message: `Manager email "${data.manager_email}" not found in company`,
        });
        continue;
      }

      if (data.manager_email && !emailToId.has(data.manager_email.toLowerCase())) {
        results.push({
          line,
          email: data.email,
          success: false,
          message: `Manager email "${data.manager_email}" not found`,
        });
        continue;
      }

      usersToUpsert.push({
        email: data.email,
        company_id: user.companyId,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        job_title: raw["job_title"] ?? null,
        department_id: (raw["department_id"] as string | null) ?? null,
        manager_id: managerId,
        status: existingId ? "active" : "invited",
      });

      results.push({
        line,
        email: data.email,
        success: true,
        message: existingId ? "Updated existing user" : "Created new user",
        user_id: existingId ?? "pending",
      });
    }

    if (usersToUpsert.length > 0) {
      const { error: upsertError } = await supabase.from("users").upsert(usersToUpsert, {
        onConflict: "company_id,email",
      });

      if (upsertError) {
        console.error("[hr:upload-data] Upsert failed:", upsertError);
        return NextResponse.json(
          { error: "Failed to save users", details: [upsertError.message] },
          { status: 500 },
        );
      }

      // Re-fetch to get IDs for newly created users
      const upsertedEmails = usersToUpsert.map((u) => u.email.toLowerCase());
      const { data: updatedUsers } = await supabase
        .from("users")
        .select("id, email")
        .eq("company_id", user.companyId)
        .in("email", upsertedEmails);

      for (const u of updatedUsers ?? []) {
        emailToId.set(u.email.toLowerCase(), u.id);
      }

      for (const result of results) {
        if (result.success && result.user_id === "pending") {
          result.user_id = emailToId.get(result.email.toLowerCase()) ?? result.user_id;
        }
      }
    }

    return NextResponse.json({
      total: rows.length,
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  },
);
