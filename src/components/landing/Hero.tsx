"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Users, Zap } from "lucide-react";

/* ── Animation variants ─────────────────────────────────────────────────── */

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/* ── Floating dashboard accent elements ──────────────────────────────────── */

const floatingElements = [
  { x: "10%", y: "18%", width: "7rem", height: "1.5rem", delay: 0 },
  { x: "58%", y: "12%", width: "5rem", height: "1.25rem", delay: 0.6 },
  { x: "72%", y: "55%", width: "4rem", height: "4rem", delay: 1.2 },
  { x: "12%", y: "62%", width: "6rem", height: "1.25rem", delay: 1.8 },
  { x: "42%", y: "72%", width: "3rem", height: "3rem", delay: 2.4 },
];

/* ── Component ───────────────────────────────────────────────────────────── */

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-brand-warning/5 blur-3xl" />
      </div>

      {/* Text content */}
      <motion.div
        className="relative z-10 mx-auto max-w-5xl text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-1.5 text-sm font-medium text-brand-primary">
            <Zap className="h-3.5 w-3.5" /> The Only AI-Powered Discipline Platform
          </span>
        </motion.div>

        {/* H1 - SEO targeted */}
        <motion.h1
          variants={itemVariants}
          className="font-display text-4xl font-extrabold leading-tight text-text-primary sm:text-5xl lg:text-7xl"
        >
          AI-Powered{" "}
          <span className="text-brand-primary">Employee Discipline</span>{" "}
          and Compliance Software
        </motion.h1>

        {/* Subtitle - problem statement */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-2xl font-body text-lg font-medium text-text-secondary sm:text-xl"
        >
          Stop drowning in manual discipline tracking. Our autonomous AI agents handle
          progressive discipline, manager coaching, state-specific paperwork, and compliance
          across every jurisdiction you operate in.
        </motion.p>

        {/* Social proof metrics */}
        <motion.div
          variants={itemVariants}
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-6 text-sm text-text-tertiary"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-brand-success" /> SOC 2 Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-primary" /> 99.9% Uptime
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-brand-warning" /> AI-Powered
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/signup">
            <Button size="lg" className="px-8 py-4 text-lg">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="lg" className="gap-2 px-8 py-4 text-lg">
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Animated dashboard preview */}
      <motion.div
        className="relative mx-auto mt-12 w-full max-w-4xl"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: easeOut }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-brand-slate-light bg-brand-slate p-1 shadow-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 rounded-t-xl bg-brand-dark-slate px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-brand-error/60" />
            <div className="h-3 w-3 rounded-full bg-brand-warning/60" />
            <div className="h-3 w-3 rounded-full bg-brand-success/60" />
            <div className="ml-4 h-5 w-48 rounded-md bg-brand-slate-light/50" />
          </div>

          {/* Dashboard mockup */}
          <div className="relative flex min-h-[280px] flex-col gap-4 p-6 sm:min-h-[400px]">
            {/* Sidebar */}
            <div className="absolute bottom-6 left-6 top-6 hidden w-20 rounded-lg bg-brand-dark-slate/50 sm:block" />

            {/* Main content skeleton */}
            <div className="flex flex-col gap-3 sm:ml-24">
              <div className="h-6 w-40 rounded bg-brand-slate-lighter/30" />
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-brand-slate-light/40 p-3">
                  <div className="text-xs text-text-tertiary">Health Score</div>
                  <div className="mt-1 text-2xl font-bold text-green-400">94</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-brand-slate-light/40 p-3">
                  <div className="text-xs text-text-tertiary">Open Cases</div>
                  <div className="mt-1 text-2xl font-bold text-amber-400">7</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-brand-primary/30 bg-brand-primary/20 p-3">
                  <div className="text-xs text-brand-primary">Turnover</div>
                  <div className="mt-1 text-2xl font-bold text-brand-primary">12%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-32 rounded-lg bg-brand-dark-slate/50" />
                <div className="h-32 rounded-lg bg-brand-dark-slate/50" />
              </div>
            </div>

            {/* Floating accent elements */}
            {floatingElements.map((el, i) => (
              <motion.div
                key={i}
                className="absolute rounded-md border border-brand-primary/20 bg-brand-primary/10"
                style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                animate={{ y: [0, -10, 0], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, delay: el.delay, ease: "easeInOut" }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Glow beneath dashboard */}
        <div
          className="absolute -bottom-8 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl"
          aria-hidden="true"
        />
      </motion.div>
    </section>
  );
}
