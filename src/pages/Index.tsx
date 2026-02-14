import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { SEO } from "@/components/SEO";
import { Check, ArrowRight, CheckCircle2, Shield, Zap, Globe, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PricingSection } from "@/components/landing/PricingSection";
import { ExitIntentPopup } from "@/components/landing/ExitIntentPopup";
import { StickyCTA } from "@/components/landing/StickyCTA";
import { LeadMagnetSection } from "@/components/landing/LeadMagnetSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { ContactForm } from "@/components/landing/ContactForm";
import { Mail } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <SEO
        title="Compassionate Estate Settlement & Probate Software"
        description="Simplify estate settlement and probate with clarity. ExpectedEstate helps executors navigate legal requirements, track assets, and automate paperwork."
        canonical="https://expectedestate.com/"
      />

      <Header />

      <main>
        <HeroSection />
        <TrustBar />

        <AboutSection />
        <ServicesSection />
        <LeadMagnetSection />
        <TestimonialsSection />
        <PricingSection />

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
                  <img src={item.img} alt={item.title} className="w-full h-auto rounded-3xl mb-6 border border-border/30" loading="lazy" />
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

        {/* SEO / Educational Resources Section */}
        <section id="knowledge-base" className="py-24 bg-slate-50 border-y border-slate-100 scroll-mt-20">
          <div className="section-container">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <Badge variant="outline" className="mb-6 uppercase tracking-widest font-black py-1.5 px-4 bg-white text-primary border-primary/20">Knowledge Base</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Navigating the Maze</h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                  Estate settlement shouldn't be a mystery. Explore our expert guides to understand your legal path and fiduciary responsibilities.
                </p>
              </div>
              <Button variant="ghost" className="font-bold text-primary group" onClick={() => navigate("/probate-process")}>
                View all guides <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "The Probate Process", path: "/probate-process", desc: "A 7-step guide to formal court proceedings." },
                { title: "Probate Timeline", path: "/probate-timeline", desc: "Realistic 12-month schedule & delays.", isNew: true },
                { title: "Executor Checklist", path: "/executor-checklist", desc: "The ultimate workflow for estate executors." },
                { title: "Small Estate Affidavit", path: "/small-estate-affidavit", desc: "Skip probate for smaller estates." },
                { title: "What to Do After Death", path: "/what-to-do-when-someone-dies", desc: "Immediate steps to take in the first 72 hours." },
                { title: "Probate Costs", path: "/probate-cost", desc: "A breakdown of attorney and court fees." },
                { title: "Died Without a Will", path: "/intestate-without-will", desc: "How intestacy laws divide assets." },
                { title: "Transfer Car Title", path: "/transfer-car-title-after-death", desc: "How to handle vehicle title transfers." },
                { title: "Life Insurance Claims", path: "/life-insurance-claim-process", desc: "Filing for non-probate benefits." },
                { title: "State Guide: Texas", path: "/probate-texas", desc: "Local rules for the Lone Star State." },
                { title: "State Guide: California", path: "/probate-california", desc: "Navigating CA statutory fees." },
                { title: "State Guide: Florida", path: "/probate-florida", desc: "Homestead laws and summary admin." },
                { title: "Settlement Workflow", path: "/estate-settlement-checklist", desc: "The complete master bridge checklist." }
              ].map((resource, i) => (
                <Link key={i} to={resource.path} className="p-6 rounded-3xl bg-secondary/30 border border-secondary/50 hover:border-primary/50 transition-all group">
                  <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{resource.title}</h3>
                  <p className="text-slate-400 font-medium mb-4">{resource.desc}</p>
                  <span className="text-primary font-black text-sm uppercase tracking-tighter flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Guide <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}  <div className="p-8 bg-primary rounded-[2rem] text-white flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2 text-white">Need a human?</h3>
                <p className="text-sm text-primary-foreground/90 mb-6 font-medium leading-relaxed">Consult with our verified estate advisors for 1-on-1 guidance.</p>
                <Button className="w-full bg-white text-primary hover:bg-slate-100 font-black rounded-xl" onClick={() => navigate("/marketplace")}>Find an Advisor</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="contact" className="py-32 bg-primary/5 scroll-mt-20">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Contact Support
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-black text-foreground mb-8 leading-tight"
              >
                Get clarity before the <br className="hidden md:block" />
                paperwork piles up.
              </motion.h2>
              <div className="flex flex-col items-center gap-8">
                <Button
                  size="lg"
                  className="h-20 px-16 text-2xl font-black rounded-full shadow-2xl hover:scale-105 transition-all bg-primary"
                  onClick={() => navigate("/start")}
                >
                  Get My Executor Roadmap
                  <span className="ml-3">→</span>
                </Button>

                <div className="pt-16 border-t border-border/50 w-full max-w-2xl">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ExitIntentPopup />
      <StickyCTA />
    </div>
  );
};

export default Index;
