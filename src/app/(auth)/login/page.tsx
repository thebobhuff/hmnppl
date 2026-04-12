import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In — HMN/PPL",
};

/**
 * Login page — renders the LoginForm inside a Suspense boundary.
 *
 * Suspense is required because LoginForm uses `useSearchParams()`, which
 * can cause a client-side hydration mismatch if not wrapped.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark-slate px-4 py-12">
      <div className="w-full max-w-[420px]">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
