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
    title: "Self-Tracking Trail",
    description: "Keep a real-time record of your own actions. Never wonder what you did last Tuesday or waste time repeating a search you already completed.",
  },
  {
    icon: MessageSquare,
    title: "Proof of Diligence",
    description: "Document every call, email, and fax. Our system helps you document your reasonable care as you work, helping build a record of your actions.",
  },
  {
    icon: Bell,
    title: "Gap Identification",
    description: "Automatic monitoring flags 'Diligence Gaps'—the quiet areas where silence from an institution could be mistaken for negligence later.",
  },
  {
    icon: Send,
    title: "Escalation Tools",
    description: "Generate institution-specific notices and fax directly from the platform. Keep delivery confirmations as permanent evidence of your reasonable care.",
  },
  {
    icon: BarChart3,
    title: "Cognitive Load Relief",
    description: "Surface critical road blockers and settled assets at a glance. We remember the details so your brain doesn't have to.",
  },
  {
    icon: Lock,
    title: "Institutional Scrutiny",
    description: "Our audit trails are structured to meet the high standards of banks, courts, and insurance companies, helping mitigate personal liability risks.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background">
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
            A comprehensive fiduciary defense system
          </h2>
          <p className="text-lg text-muted-foreground">
            Tools designed to simplify estate administration while simultaneously building
            your documented evidence of reasonable care.
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
