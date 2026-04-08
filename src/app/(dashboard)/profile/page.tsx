/**
 * Profile Page — User profile view and edit.
 */

"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { User, Mail, Building, Shield, Camera, Save } from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "My Profile" }]);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  const roleDisplay =
    user?.role
      ?.split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ") || "User";

  return (
    <PageContainer
      title="My Profile"
      description="View and update your personal information."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-slate-light">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-text-tertiary" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-text-secondary">{user?.email}</p>
              <Badge variant="default" className="mt-2">
                {roleDisplay}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">
            Personal Information
          </h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  First Name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Last Name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">
            Account Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border py-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Email Notifications
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Receive updates about incidents and meetings
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between border-b border-border py-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Add an extra layer of security
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Company</p>
                  <p className="text-xs text-text-tertiary">Acme Corporation</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                View
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
