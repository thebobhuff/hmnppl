import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";

/**
 * Below-fold sections are lazy-loaded for aggressive code splitting.
 * Framer Motion is only included in chunks for this route.
 */
const FeatureGrid = dynamic(() => import("@/components/landing/FeatureGrid"), {
  loading: () => <FeatureGridSkeleton />,
});

const CTASection = dynamic(() => import("@/components/landing/CTASection"), {
  loading: () => <CTASectionSkeleton />,
});

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeatureGrid />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

/* ── Skeleton placeholders ─────────────────────────────────────────────── */

function FeatureGridSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-16 text-center">
        <div className="mx-auto h-10 w-72 animate-pulse rounded bg-brand-slate-light/30" />
        <div className="mx-auto mt-4 h-6 w-96 animate-pulse rounded bg-brand-slate-light/20" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-brand-slate-light bg-brand-slate p-8"
          >
            <div className="mb-4 h-12 w-12 rounded-xl bg-brand-slate-light/30" />
            <div className="mb-2 h-6 w-40 rounded bg-brand-slate-light/30" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-brand-slate-light/20" />
              <div className="h-4 w-3/4 rounded bg-brand-slate-light/20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASectionSkeleton() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto h-72 max-w-3xl animate-pulse rounded-2xl border border-brand-slate-light bg-brand-slate" />
    </section>
  );
}
