import { motion } from "framer-motion";

const painPoints = [
  { problem: "Personal liability fears", solution: "Instant Fiduciary Audit Trail" },
  { problem: "Missing hidden assets", solution: "Exhaustive Discovery Logs" },
  { problem: "Institutions ignoring you", solution: "Watchdog-enforced Escalation" },
  { problem: "Manual status tracking", solution: "Automated Evidence Collection" },
];

export function PainPointsSection() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stop wondering: <span className="text-destructive italic">"Did I miss something?"</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            The fear of missing a deadline or being blamed for a mistake is real.
            We provide the documented proof you need to settle with confidence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {painPoints.map((item, index) => (
            <motion.div
              key={item.problem}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
            >
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-sm text-muted-foreground line-through decoration-destructive/40">
                  {item.problem}
                </span>
                <span className="font-medium text-success">
                  {item.solution}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
