import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background to-primary/5">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Defend yourself with proof of diligence
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start documenting your estate settlement today. Build the fiduciary record
            that shields you from liability and ensures nothing is missed.
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-soft-lg">
              Build My Fiduciary Defense
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4 font-medium italic">
            "The best defense isn't just doing the work—it's proving you did it with reasonable care."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
