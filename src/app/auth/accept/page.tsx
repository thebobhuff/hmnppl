"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AcceptState = "working" | "error";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AcceptState>("working");
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    let cancelled = false;

    async function acceptInvite() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const error = hashParams.get("error_description") ?? hashParams.get("error");
      const nextPath = searchParams.get("next") ?? "/dashboard";

      if (error) {
        if (!cancelled) {
          setState("error");
          setMessage(error);
        }
        return;
      }

      if (!accessToken || !refreshToken) {
        if (!cancelled) {
          setState("error");
          setMessage("Invite link is missing session tokens.");
        }
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        if (!cancelled) {
          setState("error");
          setMessage(sessionError.message);
        }
        return;
      }

      window.history.replaceState({}, "", `/auth/accept?next=${encodeURIComponent(nextPath)}`);
      window.location.replace(nextPath);
    }

    void acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-dark-slate px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl shadow-brand-dark-slate/30">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Accepting invite
        </h1>
        <p className="mt-3 text-sm text-text-secondary">{message}</p>
        {state === "error" ? (
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-primary-dim"
          >
            Return to sign in
          </button>
        ) : null}
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteContent />
    </Suspense>
  );
}