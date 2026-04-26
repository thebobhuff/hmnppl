import Link from "next/link";
import { ArrowRight, Bot, FileCheck2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Manager coaching",
    description: "The agent walks a manager through facts, empathy, prior context, training, and next steps.",
    icon: HeartHandshake,
  },
  {
    title: "Risk routing",
    description: "Safety, violence, financial impropriety, harassment, and protected-class concerns route to HR.",
    icon: ShieldCheck,
  },
  {
    title: "AI documentation",
    description: "Lower-risk issues can produce verbal-warning coaching records while higher actions wait for HR.",
    icon: Bot,
  },
  {
    title: "Human review",
    description: "Written warnings, PIPs, and termination reviews stay in the HR approval path.",
    icon: FileCheck2,
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-brand-dark-slate text-text-primary">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <Link href="/" className="mb-8 text-sm text-text-tertiary hover:text-brand-primary">
          Back to home
        </Link>
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
              Prototype walkthrough
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight md:text-6xl">
              See the disciplinary agent loop without the legal guesswork.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">
              This demo mirrors the prototype path: managers get coached, the system preserves documentation, and HR keeps control of serious outcomes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start testing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/conduct-interview">Open coach interview</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-tertiary">Step {index + 1}</p>
                      <h2 className="mt-1 text-sm font-semibold text-text-primary">
                        {step.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
