import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";
import type { UserRole } from "@/types";
import { getUser, updateOwnUser } from "@/lib/services/user-service";

function mapRole(role: string): UserRole {
  return role.toUpperCase() as UserRole;
}

export const GET = withAuth(async (_request, _context, { user }) => {
  const fullUser = await getUser(user.companyId, user.id);

  if (!fullUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: fullUser.id,
      email: fullUser.email,
      firstName: fullUser.first_name,
      lastName: fullUser.last_name,
      role: mapRole(user.role),
      avatarUrl: fullUser.avatar_url ?? undefined,
      tenantId: fullUser.company_id,
      tenantName: fullUser.company_name ?? undefined,
      phone: fullUser.phone,
      jobTitle: fullUser.job_title,
      status: fullUser.status,
      hireDate: fullUser.hire_date,
      lastLoginAt: fullUser.last_login_at,
    },
  });
});

export const PATCH = withAuth(async (request, _context, { user }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const jobTitle = String(body.jobTitle ?? "").trim();
    const avatarUrl = String(body.avatarUrl ?? "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 },
      );
    }

    const updatedUser = await updateOwnUser(user.companyId, user.id, {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      job_title: jobTitle || null,
      avatar_url: avatarUrl || null,
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: mapRole(updatedUser.role),
        avatarUrl: updatedUser.avatar_url ?? undefined,
        tenantId: updatedUser.company_id,
        tenantName: updatedUser.company_name ?? undefined,
        phone: updatedUser.phone,
        jobTitle: updatedUser.job_title,
        status: updatedUser.status,
        hireDate: updatedUser.hire_date,
        lastLoginAt: updatedUser.last_login_at,
      },
    });
  } catch (error) {
    console.error("[users:me:update] Failed:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
});
