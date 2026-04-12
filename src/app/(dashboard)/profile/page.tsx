"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { APIError, usersAPI } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, Save, Trash2, Upload, UserCircle } from "lucide-react";

interface MeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: import("@/types").UserRole;
  avatarUrl?: string;
  tenantId?: string;
  tenantName?: string;
  phone?: string | null;
  jobTitle?: string | null;
  status?: string;
  hireDate?: string | null;
  lastLoginAt?: string | null;
}

export default function ProfilePage() {
  const setAuthUser = useAuthStore((s) => s.setUser);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    avatarUrl: "",
  });

  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "My Profile" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await usersAPI.me();
        if (!cancelled) {
          setUser(data.user);
          setForm({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            phone: data.user.phone ?? "",
            jobTitle: data.user.jobTitle ?? "",
            avatarUrl: data.user.avatarUrl ?? "",
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof APIError ? loadError.message : "Failed to load profile",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function syncAuthUser(nextUser: MeUser) {
    setUser(nextUser);
    setAuthUser({
      id: nextUser.id,
      email: nextUser.email,
      firstName: nextUser.firstName,
      lastName: nextUser.lastName,
      role: nextUser.role,
      avatarUrl: nextUser.avatarUrl,
      tenantId: nextUser.tenantId,
      tenantName: nextUser.tenantName,
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await usersAPI.updateMe(form);
      syncAuthUser(data.user);
      setSuccess("Profile updated");
    } catch (saveError) {
      setError(
        saveError instanceof APIError ? saveError.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
      const filePath = `${user.id}/${Date.now()}.${extension}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const nextAvatarUrl = publicUrlData.publicUrl;
      const data = await usersAPI.updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        jobTitle: form.jobTitle,
        avatarUrl: nextAvatarUrl,
      });

      syncAuthUser(data.user);
      setForm((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      setSuccess("Avatar updated");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Failed to upload avatar",
      );
    } finally {
      event.target.value = "";
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      if (form.avatarUrl) {
        const url = new URL(form.avatarUrl);
        const marker = "/storage/v1/object/public/avatars/";
        const index = url.pathname.indexOf(marker);

        if (index >= 0) {
          const path = decodeURIComponent(url.pathname.slice(index + marker.length));
          await supabase.storage.from("avatars").remove([path]);
        }
      }

      const data = await usersAPI.updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        jobTitle: form.jobTitle,
        avatarUrl: "",
      });

      syncAuthUser(data.user);
      setForm((current) => ({ ...current, avatarUrl: "" }));
      setSuccess("Avatar removed");
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Failed to remove avatar",
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSecuritySuccess(null);

    if (!user) {
      setError("Profile is not loaded");
      return;
    }

    if (!passwordForm.currentPassword) {
      setError("Current password is required");
      return;
    }

    if (passwordForm.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect");
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: passwordForm.password,
      });

      if (passwordError) {
        throw new Error(passwordError.message);
      }

      setPasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
      setSecuritySuccess("Password updated");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Failed to update password",
      );
    }
  }

  if (loading) {
    return (
      <PageContainer title="My Profile" description="Manage your account details.">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="My Profile" description="Manage your account details.">
        <Card className="p-6">
          <EmptyState
            icon={<UserCircle className="h-8 w-8" />}
            title="Profile unavailable"
            description={error ?? "We couldn't load your profile right now."}
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Profile" description="Manage your account details.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <form className="grid gap-4" onSubmit={handleSave}>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Personal Details
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                These details appear across your workspace profile and activity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First Name" htmlFor="first-name" required>
                <Input
                  id="first-name"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  disabled={saving}
                />
              </FormField>

              <FormField label="Last Name" htmlFor="last-name" required>
                <Input
                  id="last-name"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  disabled={saving}
                />
              </FormField>
            </div>

            <FormField label="Email" htmlFor="email">
              <Input id="email" value={user.email} disabled />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  disabled={saving}
                />
              </FormField>

              <FormField label="Job Title" htmlFor="job-title">
                <Input
                  id="job-title"
                  value={form.jobTitle}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, jobTitle: event.target.value }))
                  }
                  disabled={saving}
                />
              </FormField>
            </div>

            {error && <p className="text-sm text-brand-error">{error}</p>}
            {success && <p className="text-sm text-brand-success">{success}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            {form.avatarUrl ? (
              <Image
                src={form.avatarUrl}
                alt="Profile avatar"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-slate-light text-lg font-semibold text-text-primary">
                {`${user.firstName[0] ?? "U"}${user.lastName[0] ?? ""}`}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-primary hover:underline">
                <Upload className="h-4 w-4" />
                {avatarUploading ? "Uploading..." : "Upload Avatar"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>

              {form.avatarUrl && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm text-brand-error hover:underline"
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Avatar
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <ProfileMeta
              label="Role"
              value={<Badge variant="outline">{formatRole(user.role)}</Badge>}
            />
            <ProfileMeta
              label="Status"
              value={
                <Badge variant={user.status === "active" ? "success" : "warning"}>
                  {user.status ?? "unknown"}
                </Badge>
              }
            />
            <ProfileMeta
              label="Company"
              value={user.tenantName ?? user.tenantId ?? "-"}
            />
            <ProfileMeta label="Hire Date" value={formatDate(user.hireDate)} />
            <ProfileMeta label="Last Login" value={formatDateTime(user.lastLoginAt)} />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <form className="grid gap-4 sm:max-w-xl" onSubmit={handlePasswordUpdate}>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <KeyRound className="h-5 w-5" />
                Security
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Change your password for this account.
              </p>
            </div>

            <FormField label="Current Password" htmlFor="current-password" required>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="New Password" htmlFor="new-password" required>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Confirm Password" htmlFor="confirm-password" required>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </FormField>

            {securitySuccess && (
              <p className="text-sm text-brand-success">{securitySuccess}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit">Update Password</Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}

function ProfileMeta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
