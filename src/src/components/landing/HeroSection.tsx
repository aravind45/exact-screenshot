import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden bg-white">
      {/* High-quality background image with refined overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          alt="Professional Office"
          className="w-full h-full object-cover opacity-15"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/70 to-white" />
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-primary font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs mb-8"
          >
            Compassionate Guidance for Families
          </motion.h3>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-8xl font-black text-foreground mb-10 tracking-tighter leading-[0.95]"
          >
            Your step-by-step <br className="hidden md:block" />
            <span className="text-primary">executor roadmap.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground font-medium mb-14 tracking-tight max-w-2xl mx-auto leading-relaxed"
          >
            Stop guessing what to do next. Get a personalized, state-specific plan to settle the estate in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-6 items-center"
          >
            <div className="flex flex-col gap-4">
              <Link to="/start">
                <Button size="lg" className="h-20 px-14 text-xl font-bold rounded-full bg-primary hover:bg-primary/90 shadow-[0_25px_60px_rgba(37,99,235,0.35)] transition-all hover:scale-105 active:scale-95 group">
                  Get My Free Roadmap
                  <span className="ml-3 group-hover:translate-x-2 transition-transform">→</span>
                </Button>
              </Link>
              <p className="text-xs font-bold text-primary flex items-center justify-center gap-1.5 bg-primary/5 py-2 px-4 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Free roadmap — no account, no credit card
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-1">
              <a href="#services" className="text-lg font-bold text-muted-foreground hover:text-primary transition-colors">
                How it works
              </a>
              <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> AES-256 encrypted · Self-help software, not a law firm
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Soft aesthetic accents */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-success/10 rounded-full blur-[130px] pointer-events-none" />
    </section>
  );
}
