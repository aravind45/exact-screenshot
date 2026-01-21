import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { CTASection } from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <PainPointsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
