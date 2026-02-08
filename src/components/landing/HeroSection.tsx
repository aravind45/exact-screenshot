import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-white">
      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
          >
            Efficiency Meets Peace of Mind
          </motion.h3>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-foreground mb-8 tracking-tight"
          >
            Estate settlement <br className="hidden md:block" />
            made <span className="text-primary">simple</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl md:text-3xl text-muted-foreground font-medium mb-12 tracking-wide max-w-2xl mx-auto"
          >
            Discover the clear path to a stress-free and legally sound estate settlement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            <Link to="/auth">
              <Button size="lg" className="h-16 px-12 text-lg font-black rounded-full bg-primary hover:bg-primary/90 shadow-[0_20px_50px_rgba(234,88,12,0.3)] transition-all hover:scale-105 active:scale-95 group">
                Start Your Journey
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Aesthetic background accent */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-success/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle geometric patterns */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none select-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
    </section>
  );
}
