/**
 * Auth layout — shared wrapper for /login and /signup pages.
 *
 * Renders a vertically and horizontally centered card on the dark slate
 * background. No sidebar, no shell — just the auth form.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HMN/PPL — Sign In",
  description: "Sign in or create your HMN/PPL account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark-slate px-4 py-12">
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
}
