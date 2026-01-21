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
    title: "Asset Tracking",
    description: "Track bank accounts, retirement funds, insurance policies, and property all in one place with individual workflows for each asset.",
  },
  {
    icon: MessageSquare,
    title: "Communication Logs",
    description: "Document every call, email, and fax with institutions. Keep a complete audit trail that's always accessible.",
  },
  {
    icon: Bell,
    title: "Smart Follow-ups",
    description: "Automatic reminders at 7, 14, 21, and 30 days ensure no institution goes unresponded. Escalate with confidence.",
  },
  {
    icon: Send,
    title: "Fax Integration",
    description: "Fill out institution-specific forms and fax directly from the platform. Track delivery confirmations.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description: "See total asset values, settlement status, and what needs attention at a glance. Stay organized effortlessly.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Bank-level encryption protects sensitive information. Your data stays private and secure.",
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
