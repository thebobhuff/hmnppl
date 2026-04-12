"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const competitors = [
  { name: "HMN/PPL", highlight: true },
  { name: "UKG" },
  { name: "BambooHR" },
  { name: "Workday" },
];

const features = [
  { name: "AI Discipline Tracking", values: [true, false, false, false] },
  { name: "Autonomous AI Agents", values: [true, false, false, false] },
  { name: "Manager Coaching AI", values: [true, false, false, false] },
  { name: "Multi-Layer Compliance", values: [true, false, false, false] },
  { name: "State Termination Paperwork", values: [true, false, false, false] },
  { name: "Training Gap Detection", values: [true, false, false, false] },
  { name: "Org Health Dashboard", values: [true, true, false, true] },
  { name: "E-Signature Engine", values: [true, false, false, false] },
  { name: "Progressive Discipline", values: [true, false, false, false] },
  { name: "Transparent Pricing", values: [true, false, false, false] },
  { name: "HR Document Generation", values: [true, true, false, true] },
  { name: "Setup Time", values: ["5 min", "3-6 mo", "2-4 wk", "6-12 mo"] as unknown as boolean[] },
  { name: "Starting Price", values: ["$149/mo", "$45/emp/mo", "$6/emp/mo", "Custom"] as unknown as boolean[] },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string")
    return <span className="text-sm font-medium text-text-primary">{value}</span>;
  if (value === true) return <Check className="mx-auto h-5 w-5 text-brand-success" />;
  if (value === false) return <X className="mx-auto h-5 w-5 text-text-tertiary/40" />;
  return <Minus className="mx-auto h-5 w-5 text-text-tertiary/40" />;
}

export default function ComparisonTable() {
  return (
    <section id="compare" className="mx-auto max-w-5xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          How We <span className="text-brand-primary">Compare</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
          HMN/PPL is the only platform with AI-powered discipline workflows. See how we stack up.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="overflow-x-auto rounded-2xl border border-border bg-brand-slate"
      >
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-sm font-medium text-text-tertiary">Feature</th>
              {competitors.map((c) => (
                <th key={c.name} className="px-6 py-4 text-center">
                  <span className={`text-sm font-bold ${c.highlight ? "text-brand-primary" : "text-text-primary"}`}>
                    {c.name}
                  </span>
                  {c.highlight && (
                    <Badge variant="success" className="ml-2 text-xs">Best</Badge>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, i) => (
              <tr
                key={feature.name}
                className={`border-b border-border/50 ${i % 2 === 0 ? "bg-brand-dark-slate/20" : ""}`}
              >
                <td className="px-6 py-3 text-sm font-medium text-text-secondary">{feature.name}</td>
                {feature.values.map((value, j) => (
                  <td
                    key={j}
                    className={`px-6 py-3 ${competitors[j]?.highlight ? "bg-brand-primary/5" : ""}`}
                  >
                    <CellValue value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
}
