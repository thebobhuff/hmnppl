"use client";

/**
 * LoginForm — email/password login with Google SSO.
 *
 * Validates input client-side with Zod, calls the login API, and
 * redirects to /dashboard on success.
 */
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

// ---------------------------------------------------------------------------
// Google SVG icon
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
// LoginForm
// ---------------------------------------------------------------------------

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- State ---
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Check for error from OAuth callback redirect
  const oauthError = searchParams.get("error");
  const redirectPath = searchParams.get("redirect") ?? "/dashboard";

  // --- Handlers ---
  const handleChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      // Validate with Zod
      const result = loginSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof LoginFormData;
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
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setServerError("Invalid email or password");
          } else if (data.error) {
            setServerError(data.error);
          } else {
            setServerError("An unexpected error occurred. Please try again.");
          }
          return;
        }

        // Success — redirect
        router.push(redirectPath);
        router.refresh();
      } catch {
        setServerError("Network error. Please check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, redirectPath, router],
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
      // If no error, the browser will redirect to Google
    } catch {
      setServerError("Failed to initiate Google sign-in. Please try again.");
      setIsGoogleLoading(false);
    }
  }, []);

  // --- Render ---
  return (
    <div className="card rounded-2xl border border-border bg-card p-8 shadow-lg">
      {/* Logo / Title */}
      <div className="mb-8 text-center">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="HMN/PPL"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
        </div>
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
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-tertiary">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* OAuth callback error */}
        {oauthError && (
          <div
            className="rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
            role="alert"
          >
            {decodeURIComponent(oauthError)}
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div
            className="rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
            role="alert"
          >
            {serverError}
          </div>
        )}

        {/* Email */}
        <FormField label="Email" required htmlFor="login-email" error={errors.email}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            variant={errors.email ? "error" : "default"}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
        </FormField>

        {/* Password */}
        <FormField
          label="Password"
          required
          htmlFor="login-password"
          error={errors.password}
        >
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              variant={errors.password ? "error" : "default"}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
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

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="#"
            className="rounded text-sm text-text-tertiary transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            tabIndex={0}
          >
            Forgot password?
          </Link>
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
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm text-text-tertiary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="rounded font-medium text-brand-primary transition-colors hover:text-brand-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          Sign up →
        </Link>
      </p>
    </div>
  );
}
