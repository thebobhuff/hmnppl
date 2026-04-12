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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden border-r border-border bg-brand-slate px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <Badge variant="outline" className="border-brand-primary/40 text-brand-primary">
            Start Your Workspace
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-bold text-text-primary">
            Put policy, incidents, meetings, and employee workflows in one place.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-text-secondary">
            Create your HMN/PPL workspace and move from manual HR coordination to a
            structured, auditable operating system for employee relations.
          </p>

          <div className="mt-10 grid gap-4">
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
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
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
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-text-primary">
            Included in every workspace
          </p>
          <ul className="mt-4 grid gap-3">
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
                <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-text-tertiary">
            Need plan details first?{" "}
            <Link href="/pricing" className="text-brand-primary hover:underline">
              View pricing
            </Link>
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-brand-dark-slate px-4 py-12 sm:px-6">
        <div className="w-full max-w-[460px]">
          <div className="mb-6 text-center lg:hidden">
            <Badge
              variant="outline"
              className="border-brand-primary/40 text-brand-primary"
            >
              Start Your Workspace
            </Badge>
            <h1 className="mt-4 font-display text-3xl font-bold text-text-primary">
              Create your HR operations workspace
            </h1>
            <p className="mt-3 text-sm text-text-secondary">
              Launch policy, incident, employee, and document workflows in one place.
            </p>
          </div>

          <SignupForm />
        </div>
      </section>
    </div>
  );
}
