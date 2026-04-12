import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import SchemaMarkup from "@/components/landing/SchemaMarkup";

/**
 * Landing page with SEO-optimized sections.
 * Below-fold sections are lazy-loaded for aggressive code splitting.
 * Framer Motion is only included in chunks for this route.
 */
const ProblemSection = dynamic(() => import("@/components/landing/ProblemSection"), {
  loading: () => <SectionSkeleton />,
});

const FeatureGrid = dynamic(() => import("@/components/landing/FeatureGrid"), {
  loading: () => <SectionSkeleton />,
});

const ComparisonTable = dynamic(() => import("@/components/landing/ComparisonTable"), {
  loading: () => <SectionSkeleton />,
});

const FAQSection = dynamic(() => import("@/components/landing/FAQSection"), {
  loading: () => <SectionSkeleton />,
});

const CTASection = dynamic(() => import("@/components/landing/CTASection"), {
  loading: () => <SectionSkeleton />,
});

export default function LandingPage() {
  return (
    <>
      <SchemaMarkup />
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <FeatureGrid />
        <ComparisonTable />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

function SectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-72 animate-pulse rounded bg-brand-slate-light/30" />
        <div className="h-6 w-96 animate-pulse rounded bg-brand-slate-light/20" />
        <div className="mt-8 h-64 w-full animate-pulse rounded-2xl bg-brand-slate-light/10" />
      </div>
    </section>
  );
}
