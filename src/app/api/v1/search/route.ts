/**
 * Global Search API — searches employees, policies, meetings, and incidents.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAuth(async (request, _context, auth) => {
  const user = auth.user;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createAdminClient();
  const like = `%${q}%`;
  const canSearchUsers = user.role !== "employee";
  const qLower = q.toLowerCase();

  function score(title: string, subtitle: string) {
    const t = title.toLowerCase();
    const s = subtitle.toLowerCase();
    if (t === qLower) return 100;
    if (t.startsWith(qLower)) return 80;
    if (t.includes(qLower)) return 60;
    if (s.includes(qLower)) return 40;
    return 10;
  }

  const [users, policies, meetings, incidents] = await Promise.all([
    canSearchUsers
      ? supabase
          .from("users")
          .select("id, first_name, last_name, email, job_title, role, status")
          .eq("company_id", user.companyId)
          .or(
            `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},job_title.ilike.${like}`,
          )
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("policies")
      .select("id, title, category, is_active, updated_at")
      .eq("company_id", user.companyId)
      .or(`title.ilike.${like},content.ilike.${like}`)
      .limit(5),
    supabase
      .from("meetings")
      .select("id, type, status, scheduled_at, agenda")
      .eq("company_id", user.companyId)
      .or(`type.ilike.${like},agenda.ilike.${like}`)
      .limit(5),
    supabase
      .from("incidents")
      .select("id, reference_number, type, severity, status, description, created_at")
      .eq("company_id", user.companyId)
      .or(`reference_number.ilike.${like},type.ilike.${like},description.ilike.${like}`)
      .limit(5),
  ]);

  const results = [
    ...(users.data ?? []).map((item) => ({
      type: "user",
      id: item.id,
      title: `${item.first_name} ${item.last_name}`,
      subtitle: item.job_title || item.email,
      href: user.role === "employee" ? "/profile" : `/employees/${item.id}`,
    })),
    ...(policies.data ?? []).map((item) => ({
      type: "policy",
      id: item.id,
      title: item.title,
      subtitle: item.category,
      href: `/policies/${item.id}`,
    })),
    ...(meetings.data ?? []).map((item) => ({
      type: "meeting",
      id: item.id,
      title: item.type,
      subtitle: item.scheduled_at || item.agenda || item.status,
      href: `/meetings/${item.id}`,
    })),
    ...(incidents.data ?? []).map((item) => ({
      type: "incident",
      id: item.id,
      title: item.reference_number,
      subtitle: `${item.type} • ${item.status}`,
      href: `/incident-queue/${item.id}`,
    })),
  ];

  return NextResponse.json({
    results: results
      .map((item) => ({ ...item, score: score(item.title, item.subtitle) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15),
  });
});
