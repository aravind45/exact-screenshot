import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProcessTimeline } from "@/components/landing/ProcessTimeline";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Best Estate Settlement & Probate Software"
        description="Simplify estate settlement and probate with ExpectedEstate. The all-in-one platform for executors to navigate legal requirements, track assets, and manage beneficiary communication."
        canonical="https://expectedestate.com/"
        ogTitle="ExpectedEstate | Advanced Estate Settlement & Probate Software"
        ogDescription="Navigate probate with confidence. Automated roadmaps, asset tracking, and legal form generation for executors and fiduciaries."
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ExpectedEstate",
          "operatingSystem": "Web",
          "applicationCategory": "LegalSoftware",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "description": "Simplify estate settlement and probate with ExpectedEstate. The all-in-one platform for executors to navigate legal requirements, track assets, and manage paperwork."
        }}
      />
      <Header />
      <main className="pt-16">
        <HeroSection />
        <ProcessTimeline />
        <FeaturesSection />
        <PainPointsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
