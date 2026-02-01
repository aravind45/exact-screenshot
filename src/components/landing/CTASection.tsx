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
            Protect yourself with professional diligence
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start documenting your estate settlement with the same precision
            used by probate professionals. Build your fiduciary defense today.
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-soft-lg">
              Generate My Fiduciary Record
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4 font-medium italic">
            "The best defense is a documented trail of reasonable care."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
