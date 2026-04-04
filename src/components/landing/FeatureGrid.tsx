"use client";

import { motion, type Variants } from "framer-motion";
import {
  Bot,
  Shield,
  FileSignature,
  BarChart3,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/* ── Data ────────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Bot,
    title: "AI Autonomous Agents",
    description:
      "Deploy intelligent agents that automate recruitment screening, onboarding workflows, and employee support around the clock.",
  },
  {
    icon: Shield,
    title: "Policy Engine",
    description:
      "Centralized policy management with automated enforcement, version control, and real-time compliance monitoring.",
  },
  {
    icon: FileSignature,
    title: "E-Signatures",
    description:
      "Legally binding electronic signatures for contracts, offer letters, and policy acknowledgments with full audit trails.",
  },
  {
    icon: BarChart3,
    title: "HR Analytics",
    description:
      "Real-time dashboards and predictive insights on attrition risk, hiring velocity, diversity metrics, and workforce costs.",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Ready",
    description:
      "Built-in compliance frameworks for GDPR, EEOC, SOX, and more with automated audit trails and reporting.",
  },
  {
    icon: Sparkles,
    title: "Premium Dark Design",
    description:
      "Beautiful, accessible dark-mode interface designed for modern HR teams who spend hours in the platform daily.",
  },
] as const;

/* ── Animation variants ─────────────────────────────────────────────────── */

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/* ── Component ───────────────────────────────────────────────────────────── */

export default function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      {/* ── Section heading ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
          Everything You Need to <span className="text-brand-primary">Manage HR</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
          A complete suite of AI-powered tools to transform your human resources
          operations from reactive to proactive.
        </p>
      </motion.div>

      {/* ── Feature cards ──────────────────────────────────────────────── */}
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
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary/20">
                <Icon className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-xl font-bold text-text-primary">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                {feature.description}
              </p>

              {/* Learn more link */}
              <Link
                href="#features"
                className="inline-flex items-center text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary-dim"
              >
                Learn more
                <span
                  className="ml-1 inline-block transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
