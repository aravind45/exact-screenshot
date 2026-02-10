import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden bg-white">
      {/* High-quality background image with refined overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          alt="Professional Office"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/70 to-white" />
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-8"
          >
            Fiduciary Guidance & Protection
          </motion.h3>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-foreground mb-10 tracking-tighter leading-[0.9]"
          >
            Estate settlement, <br className="hidden md:block" />
            step by step — <span className="text-primary text-5xl md:text-7xl">without legal guesswork.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl md:text-3xl text-muted-foreground font-medium mb-14 tracking-tight max-w-2xl mx-auto leading-relaxed"
          >
            ExpectedEstate helps families organize probate, trust, and beneficiary tasks in one guided workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-6 items-center"
          >
            <Link to="/dashboard">
              <Button size="lg" className="h-20 px-14 text-xl font-black rounded-full bg-primary hover:bg-primary/90 shadow-[0_25px_60px_rgba(37,99,235,0.35)] transition-all hover:scale-105 active:scale-95 group">
                Start guided intake
                <span className="ml-3 group-hover:translate-x-2 transition-transform">→</span>
              </Button>
            </Link>
            <a href="#how-it-works" className="text-lg font-bold text-muted-foreground hover:text-primary transition-colors">
              See how it works
            </a>
          </motion.div>
        </div>
      </div>

      {/* Soft aesthetic accents */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-success/10 rounded-full blur-[130px] pointer-events-none" />
    </section>
  );
}
