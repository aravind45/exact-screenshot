import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { SEO } from "@/components/SEO";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  const plan = {
    name: "Complete Estate Access",
    monthlyPrice: "$49",
    period: "/month",
    description: "Every feature you need for a stress-free settlement",
    features: [
      "All 11 Settlement Roadmap Types",
      "Unlimited Asset Tracking",
      "Fiduciary Communications Log",
      "Complete CA PDF Form Suite",
      "Claims Priority Engine",
      "AI-Powered Discovery Assistant",
      "Secure Document Vault (50GB)",
    ],
    highlight: "All inclusive, no hidden costs.",
  };

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <SEO
        title="Best Estate Settlement & Probate Software"
        description="Simplify estate settlement and probate with ExpectedEstate. The all-in-one platform for executors to navigate legal requirements, track assets, and manage beneficiary communication."
        canonical="https://expectedestate.com/"
      />

      <Header />

      <main>
        <HeroSection />

        <AboutSection />

        <ServicesSection />

        {/* Pricing section (The 'Pricelist' in template) */}
        <section id="pricing" className="py-24 bg-gray-50/50">
          <div className="section-container">
            <div className="text-center mb-16">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
              >
                Pricing
              </motion.h3>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-extrabold text-foreground mb-6"
              >
                One Simple Pricelist
              </motion.h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No complex tiers or hidden fees. Just one comprehensive plan for ultimate peace of mind.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-white overflow-hidden rounded-3xl">
                  <div className="bg-primary px-8 py-3 text-center">
                    <span className="text-primary-foreground font-black text-xs uppercase tracking-widest">Most Recommended</span>
                  </div>
                  <CardHeader className="text-center pt-10 pb-6">
                    <CardTitle className="text-2xl font-black mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base italic">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-10 pb-10">
                    <div className="flex items-baseline justify-center gap-1 mb-10">
                      <span className="text-7xl font-black tracking-tighter text-foreground">{plan.monthlyPrice}</span>
                      <span className="text-xl text-muted-foreground font-bold">{plan.period}</span>
                    </div>

                    <div className="space-y-4 mb-10 border-t border-b border-gray-100 py-10">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-primary stroke-[4]" />
                          </div>
                          <span className="text-lg font-medium text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full h-16 text-xl font-black rounded-full shadow-lg hover:scale-[1.02] transition-all"
                      onClick={() => navigate("/auth")}
                    >
                      Start 7-Day Free Trial
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="max-w-3xl mx-auto mt-20 text-center">
              <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <h4 className="font-bold text-xl mb-4">Why $49/month?</h4>
                <div className="flex flex-col md:flex-row gap-8 text-left justify-center items-center">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">💰 ROI: 30x-50x</p>
                    <p className="text-xs text-muted-foreground">Saves thousands in legal fees and prevents costly fiduciaries mistakes.</p>
                  </div>
                  <div className="w-px h-12 bg-gray-100 hidden md:block" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">⚖️ vs. Attorneys</p>
                    <p className="text-xs text-muted-foreground">95% cheaper than traditional probate lawyers while providing the same structural rigor.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Contact section */}
        <section id="contact" className="py-24 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto bg-primary/5 rounded-[3rem] p-12 md:p-16 text-center border border-primary/10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-black text-foreground mb-6"
              >
                Still have questions?
              </motion.h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto font-medium">
                Our team is here to help you navigate every step of the probate and settlement process.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-full shadow-lg transition-all hover:scale-[1.02]">
                  Chat with Support
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-full border-primary text-primary hover:bg-primary/5 transition-all hover:scale-[1.02]">
                  Email Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
