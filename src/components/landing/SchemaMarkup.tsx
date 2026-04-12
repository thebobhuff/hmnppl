/** JSON-LD Schema.org markup for the landing page. */

export default function SchemaMarkup() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "HMN/PPL",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-powered HR platform for employee discipline, compliance, and workforce management with autonomous agents.",
    "url": "https://hmnppl.ai",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "149.00",
      "highPrice": "399.00",
      "priceCurrency": "USD",
      "offerCount": 3,
    },
    "featureList": [
      "AI Progressive Discipline Tracking",
      "Manager Coaching AI",
      "Multi-Layer Compliance Engine",
      "State-Specific Termination Paperwork",
      "E-Signature Engine",
      "Organization Health Dashboard",
      "Training Gap Detection",
      "Employee Turnover Analytics",
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HMN/PPL",
    "url": "https://hmnppl.ai",
    "logo": "https://hmnppl.ai/logo.png",
    "sameAs": [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </>
  );
}
