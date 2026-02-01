import {
  FileText,
  MessageSquare,
  Bell,
  Send,
  BarChart3,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Documented Discovery",
    description: "Go beyond simple tracking. Use individual workflows for each asset to document every search, finding, and negative discovery for the court.",
  },
  {
    icon: MessageSquare,
    title: "Fiduciary Accountability",
    description: "Document every call, email, and fax with institutions. Maintain a bulletproof audit trail that proves you've met your legal obligations.",
  },
  {
    icon: Bell,
    title: "Gap Analysis & Escalation",
    description: "Automatic monitoring identifies 'Diligence Gaps' and provides escalation triggers for institutions that are slow to respond.",
  },
  {
    icon: Send,
    title: "Professional Filings",
    description: "Generate institution-specific notices and fax directly from the platform. Keep delivery confirmations as permanent evidence.",
  },
  {
    icon: BarChart3,
    title: "Executive Overview",
    description: "Surface critical road blockers, unsettled assets, and pending milestones at a glance. Eliminate the cognitive load of estate management.",
  },
  {
    icon: Lock,
    title: "Attorney-Safe Vault",
    description: "Organize records in a way that allows attorneys to review and defend your decisions with minimal overhead.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to settle an estate
          </h2>
          <p className="text-lg text-muted-foreground">
            Purpose-built tools designed with empathy for executors managing
            dozens of accounts across multiple institutions.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
