"use client";

import { motion, type Variants } from "framer-motion";
import {
  Bot,
  Shield,
  FileSignature,
  BarChart3,
  Brain,
  Scale,
  AlertTriangle,
  Users,
  TrendingUp,
  FileCheck,
  MessageSquare,
  MapPin,
} from "lucide-react";
import Link from "next/link";

/* ── Data ────────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Bot,
    title: "AI Progressive Discipline",
    description:
      "Autonomous agents track verbal warnings through PIPs, ensuring consistent escalation. No skipped steps, no legal gaps.",
    href: "/features/discipline-tracking",
  },
  {
    icon: Brain,
    title: "Manager Coaching AI",
    description:
      "Real-time coaching for difficult conversations. Suggested language, tone guidance, and empathy training before every meeting.",
    href: "/features/manager-coaching",
  },
  {
    icon: Scale,
    title: "Multi-Layer Compliance",
    description:
      "Country, state, county, and city labor laws merged automatically. Termination paperwork generated for every jurisdiction you operate in.",
    href: "/features/compliance-engine",
  },
  {
    icon: FileSignature,
    title: "AI Document Generation",
    description:
      "Generate legally reviewed discipline documents, warnings, PIPs, and termination packages. E-signature built in with full audit trails.",
    href: "#features",
  },
  {
    icon: BarChart3,
    title: "HR KPIs and Churn Analytics",
    description:
      "Turnover rate, retention metrics, department health scores, tenure distribution, and new-hire churn. See org health in one dashboard.",
    href: "/features/analytics",
  },
  {
    icon: AlertTriangle,
    title: "Auto-Escalation Guardrails",
    description:
      "Safety violations, harassment, and protected class incidents bypass the agent loop and escalate directly to HR. No delays.",
    href: "#features",
  },
  {
    icon: MessageSquare,
    title: "Agent Pushback Logic",
    description:
      "The AI challenges disproportionate requests. If a manager wants to terminate for a first offense, the agent pushes back with alternatives.",
    href: "#features",
  },
  {
    icon: Users,
    title: "Training Gap Detection",
    description:
      "AI identifies patterns across incidents. Five employees with the same issue? The system flags a training gap, not a people problem.",
    href: "/features/training-gaps",
  },
  {
    icon: TrendingUp,
    title: "Organization Health Score",
    description:
      "A single number reflecting your disciplinary health. Pattern recognition, department comparisons, and proactive recommendations.",
    href: "/features/org-health",
  },
] as const;

/* ── Animation variants ─────────────────────────────────────────────────── */

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

/* ── Component ───────────────────────────────────────────────────────────── */

export default function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
          Everything You Need for{" "}
          <span className="text-brand-primary">Employee Discipline</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
          The only platform with autonomous AI agents that handle discipline workflows end-to-end,
          from incident intake to document generation to compliance enforcement.
        </p>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.title}
              variants={cardVariants}
              className="group relative rounded-2xl border border-brand-slate-light bg-brand-slate p-8 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-[0_0_30px_rgba(255,217,0,0.15)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-text-primary">{feature.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
              <Link
                href={feature.href}
                className="inline-flex items-center text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary-dim"
              >
                Learn more
                <span className="ml-1 inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
