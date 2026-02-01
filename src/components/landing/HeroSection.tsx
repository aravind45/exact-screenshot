import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, FileCheck, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-primary/5 pt-20 pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
      </div>

      <div className="section-container relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Landmark className="w-4 h-4" />
              Compassionate estate management
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
          >
            Settle estates with{" "}
            <span className="text-primary">clarity and peace of mind</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ExpectedEstate helps executors document every action, eliminate diligence gaps,
            and build a robust fiduciary record that stands up to institutional and legal scrutiny.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth">
              <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-soft-lg">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works
            </Button>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <FeatureHighlight
            icon={Shield}
            title="Document Every Discovery"
            description="Exhaustive discovery workflows that prove reasonable care for every asset search."
          />
          <FeatureHighlight
            icon={Clock}
            title="Eliminate Fiduciary Gaps"
            description="Automatic escalation triggers ensure no milestone or institutional deadline is missed."
          />
          <FeatureHighlight
            icon={FileCheck}
            title="Evidence of Reasonable Care"
            description="Export court-ready audit trails designed to protect executors from personal liability."
          />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureHighlight({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50 hover-lift">
      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
