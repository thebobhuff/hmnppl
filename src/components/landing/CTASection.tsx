"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative px-6 py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/5 blur-3xl" />
      </div>

      <motion.div
        className="relative mx-auto max-w-3xl rounded-2xl border border-brand-slate-light bg-brand-slate p-12 text-center shadow-2xl sm:p-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          Ready to Transform Your{" "}
          <span className="text-brand-primary">HR Operations</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
          Join hundreds of companies already using HMN/PPL to save time, reduce errors,
          and create better employee experiences.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="px-8 py-4 text-lg">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              variant="outline"
              size="lg"
              className="border-brand-primary px-8 py-4 text-lg text-brand-primary hover:bg-brand-primary/10"
            >
              Book a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
