import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProcessTimeline } from "@/components/landing/ProcessTimeline";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEO } from "@/components/SEO";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  const [billingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plan = {
    name: "ExpectedEstate",
    monthlyPrice: "$49",
    period: "/month",
    description: "Complete estate settlement platform with all features included",
    features: [
      "All 11 Settlement Roadmap Types",
      "Unlimited Asset Tracking",
      "Communication Log & Audit Trail",
      "Complete PDF Form Suite (6 CA forms)",
      "Claims Priority Engine",
      "AI-Powered Discovery",
      "Fee Calculator",
      "Professional Forms Hub",
      "Liability Management",
      "Email Integration",
      "Document Vault (50GB)",
      "Task Management & Tracking",
      "Dashboard & Analytics",
      "Priority Support (24hr)",
      "20+ Email Templates",
    ],
    highlight: "Everything you need to settle an estate with confidence",
  };

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

        {/* Pricing Section - Inline */}
        <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">
                Pricing
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Complete estate settlement for a predictable monthly fee. All plans include a 7-day free trial.
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-12">
              <Card className="relative flex flex-col border-primary shadow-2xl">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-6 py-2 text-base">
                    All Features Included
                  </Badge>
                </div>

                <CardHeader className="text-center pb-8 pt-12">
                  <CardTitle className="text-3xl mb-3">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-6">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6 flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-bold">{plan.monthlyPrice}</span>
                      <span className="text-xl text-gray-600">{plan.period}</span>
                    </div>
                  </div>
                  <div className="mt-8 text-base font-semibold text-primary">
                    {plan.highlight}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow px-8">
                  <ul className="space-y-4 grid md:grid-cols-2 gap-x-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-base text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-8 pb-8 px-8 flex flex-col gap-4">
                  <Button
                    className="w-full h-14 text-lg bg-primary hover:bg-primary/90 shadow-lg"
                    onClick={() => navigate("/auth")}
                  >
                    Start 7-Day Free Trial →
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base border-primary/20 hover:bg-primary/5"
                    onClick={() => navigate("/auth?mode=buy")}
                  >
                    Skip Trial & Buy Now
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-2 w-full">
                    No credit card required for trial • Cancel anytime
                  </p>
                </CardFooter>
              </Card>
            </div>

            <div className="max-w-4xl mx-auto mt-16 p-8 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <h3 className="font-bold text-2xl text-amber-900 mb-4 text-center">
                Why $49/month is Worth It
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-amber-900">
                <div>
                  <h4 className="font-semibold mb-2">💰 ROI: 30x-50x</h4>
                  <ul className="text-sm space-y-1 text-amber-800">
                    <li>• Claims Priority Engine: Prevents $10,000+ liability</li>
                    <li>• Form Generation: Saves $3,000-$12,000</li>
                    <li>• AI Discovery: Saves 10+ hours ($500 value)</li>
                    <li>• Total Value: $15,500-$24,500</li>
                    <li>• Cost for 6 months: Only $294</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚖️ vs. Alternatives</h4>
                  <ul className="text-sm space-y-1 text-amber-800">
                    <li>• 95% cheaper than attorneys ($5K-$15K)</li>
                    <li>• 97% cheaper than LegalZoom ($1.5K-$3K)</li>
                    <li>• 10x more features than EstateExec</li>
                    <li>• Only software with Claims Priority Engine</li>
                    <li>• All features included - no upsells</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto mt-16">
              <h3 className="text-2xl font-bold text-center mb-8">Common Questions</h3>
              <div className="space-y-4">
                <details className="p-4 bg-white rounded-lg border border-gray-200">
                  <summary className="font-semibold cursor-pointer">
                    Can I switch plans later?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600">
                    Yes! You can upgrade or downgrade anytime. Upgrades are immediate, downgrades take effect at the end of your billing period.
                  </p>
                </details>
                <details className="p-4 bg-white rounded-lg border border-gray-200">
                  <summary className="font-semibold cursor-pointer">
                    What if I only need this for 6 months?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600">
                    Most estates settle in 6-12 months. At $49/month × 6 = $294 total. Compare that to attorneys ($5K-$15K) or mistakes ($10K+ in liability). You'll save thousands even for a short estate.
                  </p>
                </details>
                <details className="p-4 bg-white rounded-lg border border-gray-200">
                  <summary className="font-semibold cursor-pointer">
                    Do you offer refunds?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600">
                    We offer a 7-day free trial so you can try before you buy. After that, you can cancel anytime. For refund queries, please contact us at <a href="mailto:expected.estate@gmail.com" className="text-primary hover:underline font-medium">expected.estate@gmail.com</a>.
                  </p>
                </details>
                <div className="text-center mt-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-600">
                    Still have questions? We're here to help.
                  </p>
                  <a
                    href="mailto:expected.estate@gmail.com"
                    className="text-primary font-bold text-lg hover:underline mt-2 inline-block"
                  >
                    expected.estate@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
