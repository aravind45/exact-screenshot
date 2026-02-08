import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section id="contact" className="py-32 bg-white relative overflow-hidden">
      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tighter"
          >
            Schedule your settlement <br className="hidden md:block" />
            consultation today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium"
          >
            Whether you're just starting or facing a complex challenge, we're here to guide you through every fiduciary requirement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/auth">
              <Button size="lg" className="h-20 px-16 text-2xl font-black rounded-full shadow-[0_20px_60px_rgba(234,88,12,0.4)] hover:scale-105 transition-all">
                Connect with an Expert →
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.05] pointer-events-none select-none">
        <div className="w-full h-full bg-[radial-gradient(#ea580c_2px,transparent_2px)] [background-size:60px_60px]" />
      </div>
    </section>
  );
}
