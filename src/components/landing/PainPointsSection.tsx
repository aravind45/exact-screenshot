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
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6">
            When someone passes away, families are left to figure everything out alone.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-10">
            {[
              "“Do we need probate or not?”",
              "“Which forms apply to us?”",
              "“Who is tracking assets, debts, and deadlines?”",
              "“Why is everyone asking for different documents?”"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-border/50 shadow-sm">
                <span className="text-xl font-medium text-foreground">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-lg text-muted-foreground font-medium italic">
            ExpectedEstate doesn’t replace professionals — it keeps families organized until they bring one in.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
