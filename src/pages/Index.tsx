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

        {/* Visual Proof Section */}
        <section className="py-24 bg-gray-50/50">
          <div className="section-container">
            <div className="text-center mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-foreground mb-6"
              >
                Built for how estates actually work
              </motion.h2>
              <p className="text-lg text-muted-foreground font-medium">
                Not generic to-do lists. Professional-grade tools for real settlement tasks.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: "Settlement Roadmap", img: "/modern_roadmap_banner.png", caption: "Clear steps for your specific legal path." },
                { title: "Asset Ledger", img: "/settlement_trail_compact.png", caption: "Track everything with accountant-ready precision." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-border/50"
                >
                  <img src={item.img} alt={item.title} className="w-full h-auto rounded-3xl mb-6 border border-border/30" />
                  <div className="px-6 pb-4">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{item.caption}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance + Safety */}
        <section className="py-16 bg-white border-y border-border/50">
          <div className="section-container">
            <div className="max-w-3xl mx-auto text-center p-10 bg-primary/5 rounded-[2rem] border border-primary/10">
              <Badge variant="outline" className="mb-6 uppercase tracking-widest font-black py-1.5 px-4 bg-white">Educational Guidance Only</Badge>
              <p className="text-xl text-foreground font-medium leading-relaxed mb-4">
                ExpectedEstate does not provide legal advice or replace an attorney.
              </p>
              <p className="text-muted-foreground font-medium italic">
                It helps families stay organized and prepared, making professional consultations more efficient.
              </p>
            </div>
          </div>
        </section>

        {/* Who This Is For / Not For */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div className="p-10 bg-success/5 rounded-[3rem] border border-success/10">
                <h3 className="text-2xl font-black text-foreground mb-8 text-success flex items-center gap-3">
                  <Check className="w-6 h-6 stroke-[4]" /> This is for:
                </h3>
                <ul className="space-y-6">
                  {[
                    "Executors or administrators",
                    "Trustees",
                    "Family members helping from another state or country"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-4 text-lg font-bold text-foreground/80">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-10 bg-destructive/5 rounded-[3rem] border border-destructive/10">
                <h3 className="text-2xl font-black text-foreground mb-8 text-destructive flex items-center gap-3">
                  <span className="text-3xl">×</span> This is not for:
                </h3>
                <ul className="space-y-6">
                  {[
                    "DIY legal advice",
                    "Filing documents for you",
                    "Avoiding required court processes"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-4 text-lg font-bold text-foreground/80">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="contact" className="py-32 bg-primary/5">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-black text-foreground mb-8 leading-tight"
              >
                Get clarity before the <br className="hidden md:block" />
                paperwork piles up.
              </motion.h2>
              <div className="flex flex-col items-center gap-6">
                <Button
                  size="lg"
                  className="h-20 px-16 text-2xl font-black rounded-full shadow-2xl hover:scale-105 transition-all bg-primary"
                  onClick={() => navigate("/dashboard")}
                >
                  Start guided intake
                  <span className="ml-3">→</span>
                </Button>
                <div className="space-y-2">
                  <p className="text-lg text-muted-foreground font-bold italic">
                    Takes ~5 minutes. No payment required to begin.
                  </p>
                </div>
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
