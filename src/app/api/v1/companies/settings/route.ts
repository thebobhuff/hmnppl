/**
 * Company Settings API — GET and PATCH company settings.
 */

import { NextResponse } from "next/server";
import { withAuth, roleGuards } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCompanySettings,
  updateCompanySettings,
} from "@/lib/services/company-service";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().min(2).max(255),
  industry: z.string().max(100).nullable(),
  size: z.string().max(50).nullable(),
  country: z.string().max(2).nullable(),
  region: z.string().max(100).nullable(),
  ai_confidence_threshold: z.number().min(0).max(1),
  dispute_enabled: z.boolean(),
  settings: z.object({
    notification_prefs: z.record(z.string(), z.unknown()).optional(),
    feature_flags: z.record(z.string(), z.boolean()).optional(),
    ai_monthly_budget_usd: z.number().nonnegative().optional(),
    contacts: z
      .object({
        hr_email: z.string().email().optional().or(z.literal("")),
        legal_email: z.string().email().optional().or(z.literal("")),
      })
      .optional(),
    location: z
      .object({
        primary_location: z.string().optional(),
        state_jurisdiction: z.string().optional(),
      })
      .optional(),
  }),
});

export const GET = withAuth({ roles: roleGuards.companyAdmin }, async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const company = await getCompanySettings(user.companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ company });
  } catch (error) {
    console.error("[company-settings:get] Failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch company settings" },
      { status: 500 },
    );
  }
});

export const PATCH = withAuth({ roles: roleGuards.companyAdmin }, async (request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
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
    const company = await updateCompanySettings(user.companyId, parsed.data);
    return NextResponse.json({ company });
  } catch (error) {
    console.error("[company-settings:update] Failed:", error);
    return NextResponse.json(
      { error: "Failed to update company settings" },
      { status: 500 },
    );
  }
});
