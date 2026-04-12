"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What makes HMN/PPL different from UKG or BambooHR?",
    answer: "HMN/PPL is the only HR platform with autonomous AI agents specifically built for employee discipline workflows. UKG and BambooHR are HRIS platforms with basic HR management. We offer AI progressive discipline tracking, manager coaching, multi-layer compliance across jurisdictions, and auto-generated termination paperwork \u2014 features no competitor has.",
  },
  {
    question: "Does the AI make termination decisions?",
    answer: "No. The AI agent never terminates an employee on its own. Every termination requires HR review and approval. The agent handles the workflow \u2014 tracking incidents, coaching managers, generating documents \u2014 but humans make all final decisions. We believe in human-in-the-loop for all consequential actions.",
  },
  {
    question: "How does multi-layer compliance work?",
    answer: "Our compliance engine merges rules from country, state, county, and city jurisdictions. When you process a termination in San Francisco, it automatically applies federal US law, California state law, and San Francisco city ordinances \u2014 all merged together with the most specific rule winning any conflicts.",
  },
  {
    question: "What states do you support for termination paperwork?",
    answer: "We currently support California, Texas, New York, Florida, Washington, Illinois, Massachusetts, Pennsylvania, Ohio, and Georgia with state-specific termination documents. This includes COBRA notices, separation notices, Cal/OSHA forms, and final paycheck calculations. We add new states regularly.",
  },
  {
    question: "How does the manager coaching AI work?",
    answer: "When a manager needs to have a discipline conversation, our AI provides real-time coaching: suggested language to use, language to avoid, empathy guidance, and a step-by-step conversation structure. It also pushes back if a manager requests disproportionate discipline \u2014 like terminating for a first minor offense.",
  },
  {
    question: "Is employee data secure?",
    answer: "Yes. All PII (SSN, salary, address, phone) is stripped before any AI call. We use SOC 2 compliant infrastructure, row-level security in the database, and full audit trails on every action. Protected class information is automatically detected and excluded from documentation.",
  },
  {
    question: "How does progressive discipline tracking work?",
    answer: "The AI automatically tracks the escalation path for each employee: verbal warning \u2192 written warning \u2192 PIP \u2192 termination review. It detects repeat offenses vs. new issues, identifies whether incidents are the same root cause, and ensures no steps are skipped in the discipline process.",
  },
  {
    question: "Can I import my existing HR policies?",
    answer: "Yes. Our policy engine can import your existing employee handbook and automatically decompose it into individual policies. The AI then uses these policies as context when evaluating incidents and generating recommendations, ensuring all actions align with your specific company rules.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          Frequently Asked <span className="text-brand-primary">Questions</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
          Everything you need to know about our AI-powered HR platform.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-brand-slate transition-colors hover:border-brand-slate-light"
          >
            <button
              className="flex w-full items-center justify-between px-6 py-4 text-left"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              <span className="pr-4 text-sm font-semibold text-text-primary sm:text-base">{faq.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 flex-shrink-0 text-text-tertiary transition-transform duration-200",
                  openIndex === i && "rotate-180",
                )}
              />
            </button>
            {openIndex === i && (
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* JSON-LD FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
