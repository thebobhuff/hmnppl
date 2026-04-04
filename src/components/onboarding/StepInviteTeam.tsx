// ============================================
// HMN — Step 2: Invite Team
// Dynamic email + role list for inviting team members
// ============================================

"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2, Users, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useOnboardingStore } from "@/stores/onboarding-store";
import {
  teamInviteSchema,
  INVITE_ROLE_OPTIONS,
  type TeamInvite,
  type InviteRole,
} from "@/lib/validations/onboarding";

// ---------------------------------------------------------------------------
// Role options for the select dropdown
// ---------------------------------------------------------------------------

const roleOptions = [
  { value: "HR_AGENT", label: "HR Agent" },
  { value: "MANAGER", label: "Manager" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StepInviteTeamProps {
  onNext: () => void;
  onPrev: () => void;
}

export function StepInviteTeam({ onNext, onPrev }: StepInviteTeamProps) {
  const { invites, addInvite, removeInvite, updateInvite } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<number, { email?: string; role?: string }>>(
    {},
  );

  const handleAddRow = useCallback(() => {
    addInvite({ email: "", role: "HR_AGENT" });
  }, [addInvite]);

  const handleRemoveRow = useCallback(
    (index: number) => {
      removeInvite(index);
      // Clear errors for removed row
      setErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    },
    [removeInvite],
  );

  const handleEmailChange = useCallback(
    (index: number, email: string) => {
      updateInvite(index, { email });
      // Clear error for this field
      setErrors((prev) => {
        const rowErrors = prev[index];
        if (!rowErrors?.email) return prev;
        const next = { ...prev };
        next[index] = { ...rowErrors, email: undefined };
        return next;
      });
    },
    [updateInvite],
  );

  const handleRoleChange = useCallback(
    (index: number, role: string) => {
      updateInvite(index, { role: role as InviteRole });
      // Clear error for this field
      setErrors((prev) => {
        const rowErrors = prev[index];
        if (!rowErrors?.role) return prev;
        const next = { ...prev };
        next[index] = { ...rowErrors, role: undefined };
        return next;
      });
    },
    [updateInvite],
  );

  const handleContinue = useCallback(() => {
    // Validate all invite rows
    const newErrors: Record<number, { email?: string; role?: string }> = {};
    let hasErrors = false;

    invites.forEach((invite, index) => {
      const result = teamInviteSchema.safeParse(invite);
      if (!result.success) {
        const rowErrors: { email?: string; role?: string } = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof TeamInvite;
          if (!rowErrors[field]) {
            rowErrors[field] = issue.message;
          }
        }
        newErrors[index] = rowErrors;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  }, [invites, onNext]);

  const handleSkip = useCallback(() => {
    // Clear any invites and proceed
    setErrors({});
    onNext();
  }, [onNext]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
          <Users className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Invite Your Team
          </h2>
          <p className="text-sm text-text-secondary">
            Add HR agents and managers to your workspace. You can also do this later.
          </p>
        </div>
      </div>

      {/* Invite list */}
      {invites.length > 0 && (
        <div className="space-y-3">
          {invites.map((invite, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3"
            >
              {/* Email */}
              <div className="flex-1">
                <FormField htmlFor={`invite-email-${index}`} error={errors[index]?.email}>
                  <div className="relative">
                    <Input
                      id={`invite-email-${index}`}
                      type="email"
                      placeholder="colleague@company.com"
                      value={invite.email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      variant={errors[index]?.email ? "error" : "default"}
                      icon={<Mail className="h-4 w-4" />}
                      aria-invalid={!!errors[index]?.email}
                      aria-label={`Team member ${index + 1} email`}
                    />
                  </div>
                </FormField>
              </div>

              {/* Role */}
              <div className="w-40 shrink-0">
                <FormField htmlFor={`invite-role-${index}`} error={errors[index]?.role}>
                  <Select
                    id={`invite-role-${index}`}
                    options={roleOptions}
                    value={invite.role}
                    onValueChange={(value) => handleRoleChange(index, value)}
                    error={!!errors[index]?.role}
                    aria-label={`Team member ${index + 1} role`}
                  />
                </FormField>
              </div>

              {/* Remove */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveRow(index)}
                className="mt-0.5 shrink-0 text-text-tertiary hover:text-brand-error"
                aria-label={`Remove team member ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddRow}
        className="w-full border-dashed"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Team Member
      </Button>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onPrev}>
          Back
        </Button>
        <div className="flex gap-3">
          {invites.length === 0 && (
            <Button type="button" variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          )}
          <Button type="button" size="lg" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
