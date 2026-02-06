import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProcessTimeline } from "@/components/landing/ProcessTimeline";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEO } from "@/components/SEO";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "$39",
      period: "/month",
      annualPrice: "$390/year",
      description: "Perfect for simple estates and first-time executors",
      features: [
        "Settlement Roadmap (11 types)",
        "Asset Tracking (unlimited)",
        "Communication Log",
        "Document Vault (10GB)",
        "Task Management",
        "Progress Tracking",
        "Dashboard & Analytics",
        "Email Support (48hr)",
      ],
      notIncluded: [
        "Form Generation",
        "Claims Priority Engine",
        "Email Integration",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$69",
      period: "/month",
      annualPrice: "$690/year",
      description: "Complete automation with legal compliance",
      features: [
        "Everything in Starter",
        "Complete PDF Suite (6 CA forms)",
        "Claims Priority Engine",
        "Fee Calculator",
        "Professional Forms Hub",
        "Liability Management",
        "Email Integration",
        "Document Vault (50GB)",
        "Priority Support (24hr)",
        "All 11 Settlement Workflows",
        "20 Email Templates",
      ],
      notIncluded: [],
      cta: "Start Free Trial",
      popular: true,
      badge: "Most Popular",
      highlight: "Prevents $10,000+ in executor liability",
    },
    {
      name: "Premium",
      price: "$129",
      period: "/month",
      annualPrice: "$1,290/year",
      description: "White-glove service for complex estates",
      features: [
        "Everything in Professional",
        "Concierge Support",
        "Weekly Check-in Calls (30 min)",
        "Document Review Service",
        "Attorney Network Access",
        "Tax Management Tools",
        "Accounting Hub",
        "Distribution Planning",
        "Unlimited Storage",
        "White-glove Support (4hr)",
        "Priority Feature Requests",
      ],
      notIncluded: [],
      cta: "Contact Sales",
      popular: false,
    },
  ];

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
                Choose the plan that fits your estate's needs. All plans include a 14-day free trial.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                💰 Save 15% with annual billing
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.popular
                      ? "border-primary shadow-xl scale-105 z-10"
                      : "border-gray-200"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white px-4 py-1">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-8">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm mb-4 min-h-[40px]">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      or {plan.annualPrice}
                    </div>
                    {plan.highlight && (
                      <div className="mt-4 text-sm font-semibold text-primary">
                        {plan.highlight}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature, index) => (
                        <li key={`not-${index}`} className="flex items-start gap-2 opacity-50">
                          <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-500 line-through">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                      onClick={() => navigate("/auth")}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="max-w-4xl mx-auto mt-16 p-8 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <h3 className="font-bold text-2xl text-amber-900 mb-4 text-center">
                Why Professional at $69/month is Worth It
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-amber-900">
                <div>
                  <h4 className="font-semibold mb-2">💰 ROI: 18x-35x</h4>
                  <ul className="text-sm space-y-1 text-amber-800">
                    <li>• Claims Priority Engine: Prevents $10,000+ liability</li>
                    <li>• Form Generation: Saves $3,000-$12,000</li>
                    <li>• AI Discovery: Saves 10+ hours ($500 value)</li>
                    <li>• Total Value: $15,500-$24,500</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚖️ vs. Alternatives</h4>
                  <ul className="text-sm space-y-1 text-amber-800">
                    <li>• 90% cheaper than attorneys ($5K-$15K)</li>
                    <li>• 95% cheaper than LegalZoom ($1.5K-$3K)</li>
                    <li>• 10x more features than EstateExec</li>
                    <li>• Only software with Claims Priority Engine</li>
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
                    Most estates settle in 6-12 months. Professional at $69/month × 6 = $414 total. Compare that to attorneys ($5K-$15K) or mistakes ($10K+ in liability). You'll save thousands even for a short estate.
                  </p>
                </details>
                <details className="p-4 bg-white rounded-lg border border-gray-200">
                  <summary className="font-semibold cursor-pointer">
                    Do you offer refunds?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600">
                    We offer a 14-day free trial so you can try before you buy. After that, you can cancel anytime but we don't offer refunds for partial months.
                  </p>
                </details>
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
