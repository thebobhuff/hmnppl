"use client";

/**
 * SignupForm — create a new account with company workspace.
 *
 * Validates input client-side with Zod, calls the signup API, then
 * auto-logs the user in and redirects to /onboarding on success.
 */
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";

// ---------------------------------------------------------------------------
// Google SVG icon (shared with LoginForm)
// ---------------------------------------------------------------------------

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helper — map server validation field errors to form fields
// ---------------------------------------------------------------------------

type SignupField = keyof SignupFormData;

function getServerFieldErrors(
  details: Array<{ field: string; message: string }>,
): Partial<Record<SignupField, string>> {
  const fieldMap: Partial<Record<string, SignupField>> = {
    email: "email",
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    companyName: "companyName",
  };
  const mapped: Partial<Record<SignupField, string>> = {};
  for (const detail of details) {
    const formField = fieldMap[detail.field];
    if (formField && !mapped[formField]) {
      mapped[formField] = detail.message;
    }
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// SignupForm
// ---------------------------------------------------------------------------

export function SignupForm() {
  const router = useRouter();

  // --- State ---
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: "",
    agreeToTerms: false as boolean,
  });
  const [errors, setErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // --- Handlers ---
  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field as SignupField]) return prev;
      const next = { ...prev };
      delete next[field as SignupField];
      return next;
    });
    setServerError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      // Validate with Zod
      const input = {
        ...formData,
        agreeToTerms: formData.agreeToTerms as true | false,
      };
      const result = signupSchema.safeParse(input);
      if (!result.success) {
        const fieldErrors: Partial<Record<SignupField, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as SignupField;
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      try {
        // 1. Create the account
        const signupResponse = await fetch("/api/v1/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName,
          }),
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          if (signupResponse.status === 409) {
            setServerError("An account with this email already exists");
          } else if (signupData.details) {
            // Server field-level validation errors
            setErrors(getServerFieldErrors(signupData.details));
          } else if (signupData.error) {
            setServerError(signupData.error);
          } else {
            setServerError("An unexpected error occurred. Please try again.");
          }
          return;
        }

        // 2. Auto-login after signup
        const loginResponse = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!loginResponse.ok) {
          // Account was created but auto-login failed — redirect to login
          router.push("/login?message=Account created. Please sign in.");
          return;
        }

        // 3. Success — redirect to onboarding
        router.push("/onboarding");
        router.refresh();
      } catch {
        setServerError("Network error. Please check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, router],
  );

  const handleGoogleSSO = useCallback(async () => {
    setIsGoogleLoading(true);
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message || "Google sign-in failed. Please try again.");
        setIsGoogleLoading(false);
      }
    } catch {
      setServerError("Failed to initiate Google sign-in. Please try again.");
      setIsGoogleLoading(false);
    }
  }, []);

  // --- Render ---
  return (
    <div className="card rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-8">
      {/* Logo / Title */}
      <div className="mb-6 text-center sm:mb-8">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="HMN/PPL"
            width={64}
            height={64}
            className="h-14 w-auto sm:h-16"
          />
        </div>
        <p className="mt-2 text-sm text-text-tertiary">Create your workspace</p>
      </div>

      {/* Google SSO */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-3"
        onClick={handleGoogleSSO}
        disabled={isGoogleLoading || isSubmitting}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
      </Button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3 sm:my-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-tertiary">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Server error */}
        {serverError && (
          <div
            className="rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
            role="alert"
          >
            {serverError}
          </div>
        )}

        {/* Name row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            label="First name"
            required
            htmlFor="signup-firstName"
            error={errors.firstName}
          >
            <Input
              id="signup-firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              variant={errors.firstName ? "error" : "default"}
              disabled={isSubmitting}
              aria-invalid={!!errors.firstName}
            />
          </FormField>
          <FormField
            label="Last name"
            required
            htmlFor="signup-lastName"
            error={errors.lastName}
          >
            <Input
              id="signup-lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Smith"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              variant={errors.lastName ? "error" : "default"}
              disabled={isSubmitting}
              aria-invalid={!!errors.lastName}
            />
          </FormField>
        </div>

        {/* Email */}
        <FormField
          label="Work email"
          required
          htmlFor="signup-email"
          error={errors.email}
        >
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            variant={errors.email ? "error" : "default"}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
          />
        </FormField>

        {/* Company name */}
        <FormField
          label="Company name"
          required
          htmlFor="signup-companyName"
          error={errors.companyName}
        >
          <Input
            id="signup-companyName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc."
            value={formData.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            variant={errors.companyName ? "error" : "default"}
            disabled={isSubmitting}
            aria-invalid={!!errors.companyName}
          />
        </FormField>

        {/* Password */}
        <FormField
          label="Password"
          required
          htmlFor="signup-password"
          error={errors.password}
          hint="At least 8 characters"
        >
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              variant={errors.password ? "error" : "default"}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-slate"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </FormField>

        {/* Confirm password */}
        <FormField
          label="Confirm password"
          required
          htmlFor="signup-confirmPassword"
          error={errors.confirmPassword}
        >
          <div className="relative">
            <Input
              id="signup-confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              variant={errors.confirmPassword ? "error" : "default"}
              disabled={isSubmitting}
              aria-invalid={!!errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-slate"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </FormField>

        {/* Terms checkbox */}
        <div>
          <Checkbox
            id="signup-terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => handleChange("agreeToTerms", checked === true)}
            disabled={isSubmitting}
            label={
              <span className="text-sm text-text-secondary">
                I agree to the{" "}
                <Link
                  href="#"
                  className="rounded text-brand-primary transition-colors hover:text-brand-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="rounded text-brand-primary transition-colors hover:text-brand-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Privacy Policy
                </Link>
              </span>
            }
          />
          {errors.agreeToTerms && (
            <p className="mt-1.5 text-xs text-brand-error" role="alert">
              {errors.agreeToTerms}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full font-bold"
          disabled={isSubmitting || isGoogleLoading}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating workspace...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-text-tertiary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded font-medium text-brand-primary transition-colors hover:text-brand-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          Sign in →
        </Link>
      </p>
    </div>
  );
}
