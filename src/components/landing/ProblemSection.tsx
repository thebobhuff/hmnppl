"use client";

import { motion } from "framer-motion";
import { Clock, AlertTriangle, FileX, DollarSign } from "lucide-react";

const painPoints = [
  {
    icon: Clock,
    stat: "67%",
    label: "of HR time spent on admin tasks",
    description: "Manual discipline tracking, document generation, and compliance checks consume your day.",
  },
  {
    icon: AlertTriangle,
    stat: "14 days",
    label: "avg discipline case resolution",
    description: "Without automation, each case drags through email chains, missing documentation, and approvals.",
  },
  {
    icon: FileX,
    stat: "43%",
    label: "lack consistent discipline tracking",
    description: "Most companies have no structured progressive discipline process, creating legal risk.",
  },
  {
    icon: DollarSign,
    stat: "$200K",
    label: "avg cost per compliance violation",
    description: "Inconsistent discipline documentation is a liability in wrongful termination lawsuits.",
  },
];

export default function ProblemSection() {
  return (
    <section className="border-t border-border bg-brand-dark-slate/30 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
            HR Teams Are <span className="text-brand-warning">Drowning</span> in Manual Processes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            The discipline and compliance gap in HR is massive. Most platforms manage benefits and payroll
            but leave the hardest part \u2014 employee relations \u2014 entirely manual.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.stat}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-brand-slate p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning/10 text-brand-warning">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold text-text-primary">{point.stat}</p>
                <p className="mt-1 text-sm font-semibold text-brand-warning">{point.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{point.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Solution bridge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-8 text-center"
        >
          <p className="text-lg font-medium text-text-primary">
            HMN/PPL automates the entire discipline lifecycle with AI agents that never skip a step.
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Report \u2192 AI evaluates risk \u2192 Agent coaches manager \u2192 Documents generated \u2192 HR reviews \u2192 Compliant resolution
          </p>
        </motion.div>
      </div>
    </section>
  );
}
