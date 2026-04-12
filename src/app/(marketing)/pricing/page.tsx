import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import type {{ Metadata }} from "next";

export const metadata: Metadata = {{
  title: "Pricing - AI HR Platform for Employee Discipline | HMN/PPL",
  description: "Transparent pricing for AI-powered HR management. Starter at $149/mo, Growth at $399/mo, Enterprise custom pricing. No per-employee fees for Starter.",
  alternates: {{ canonical: "https://hmnppl.ai/pricing" }},
}};

import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$149",
    cadence: "/month",
    audience: "Small teams replacing spreadsheets and shared folders.",
    cta: "Start Starter",
    href: "/signup?plan=starter",
    features: [
      "Up to 50 employees",
      "Incident intake and policy management",
      "Document generation and e-signature workflows",
      "Basic HR dashboard and reporting",
    ],
  },
  {
    name: "Growth",
    price: "$399",
    cadence: "/month",
    audience: "HR teams standardizing employee relations across departments.",
    cta: "Start Growth",
    href: "/signup?plan=growth",
    featured: true,
    features: [
      "Up to 250 employees",
      "AI policy creation and assistant workflows",
      "Department, employee, and company settings management",
      "Global search, meeting workflows, and dashboard analytics",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    audience: "Multi-site organizations with stricter compliance and rollout needs.",
    cta: "Talk to Sales",
    href: "/signup?plan=enterprise",
    features: [
      "Unlimited employees",
      "Advanced rollout and implementation support",
      "Security and compliance review support",
      "Custom onboarding and executive reporting",
      "Dedicated success partner",
    ],
  },
];

export const metadata = {
  title: "Pricing — HMN/PPL",
  description:
    "Pricing for AI-powered HR operations, policy workflows, and employee relations management.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark-slate pt-28 text-text-primary">
        <section className="mx-auto max-w-7xl px-6 pb-10 pt-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="border-brand-primary/40 text-brand-primary"
            >
              Pricing
            </Badge>
            <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
              Pricing Built for Real HR Operations
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-secondary">
              Replace scattered policy files, manual incident follow-up, and disconnected
              employee workflows with one operating system for HR teams.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-8 shadow-xl ${
                plan.featured
                  ? "border-brand-primary bg-brand-slate shadow-[0_0_40px_rgba(255,217,0,0.12)]"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary">{plan.audience}</p>
                </div>
                {plan.featured && <Badge variant="warning">Most Popular</Badge>}
              </div>

              <div className="mt-8 flex items-end gap-1">
                <span className="font-display text-4xl font-bold text-text-primary">
                  {plan.price}
                </span>
                {plan.cadence && (
                  <span className="pb-1 text-sm text-text-tertiary">{plan.cadence}</span>
                )}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-text-secondary"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="mt-8 block">
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </article>
          ))}
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-text-primary">
              Every plan includes
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Secure Supabase-backed workspace data",
                "Role-based dashboards and navigation",
                "Policy, incident, and meeting workflows",
                "Employee documents and signatures",
                "Top-bar feedback capture into GitHub",
                "Modern responsive UI for desktop and mobile",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-brand-slate/30 p-4 text-sm text-text-secondary"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-brand-slate p-8">
            <h2 className="text-2xl font-semibold text-text-primary">
              Need a rollout plan?
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-secondary">
              If you are migrating active HR operations, we can help structure onboarding,
              role rollout, policy imports, and team enablement.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?plan=growth" className="sm:flex-1">
                <Button className="w-full">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?plan=enterprise" className="sm:flex-1">
                <Button variant="outline" className="w-full">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
