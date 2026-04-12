import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Sparkles, Users } from "lucide-react";

export const metadata = {
  title: "Create Account — HMN/PPL",
};

/**
 * Signup page — renders the SignupForm.
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-brand-dark-slate px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top,_rgba(29,180,226,0.16),_transparent_32%),linear-gradient(180deg,rgba(9,28,42,0.98),rgba(6,19,30,0.98))] shadow-[0_24px_80px_rgba(2,10,18,0.45)]">
          <div className="grid gap-10 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 xl:grid-cols-[minmax(0,1.1fr)_500px] xl:gap-12 xl:px-12 xl:py-12">
            <section className="flex min-w-0 flex-col justify-between">
              <div>
                <Badge variant="outline" className="border-brand-primary/40 text-brand-primary">
                  Start Your Workspace
                </Badge>
                <h1 className="mt-5 max-w-2xl font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl xl:text-5xl">
                  Put policy, incidents, meetings, and employee workflows in one place.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base xl:text-lg">
                  Create your HMN/PPL workspace and move from manual HR coordination
                  to a structured, auditable operating system for employee relations.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  {
                    icon: Shield,
                    title: "Policy and compliance workflows",
                    description:
                      "Create, version, review, and distribute policies with auditability built in.",
                  },
                  {
                    icon: Users,
                    title: "Employee and department management",
                    description:
                      "Manage teams, reporting structures, and settings from a shared tenant workspace.",
                  },
                  {
                    icon: Sparkles,
                    title: "AI-powered HR assistance",
                    description:
                      "Use guided assistants for policy creation, research, and operational follow-through.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-text-primary">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-text-secondary">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-text-primary">
                  Included in every workspace
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {[
                    "Role-based dashboards",
                    "Document and signature workflows",
                    "Feedback capture into GitHub",
                    "Real-time employee and department management",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-text-secondary"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-text-tertiary">
                  Need plan details first?{" "}
                  <Link href="/pricing" className="text-brand-primary hover:underline">
                    View pricing
                  </Link>
                </p>
              </div>
            </section>

            <section className="flex items-start justify-center xl:items-center">
              <div className="w-full max-w-[500px]">
                <SignupForm />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
