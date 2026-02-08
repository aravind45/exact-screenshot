import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AboutSection() {
    return (
        <section id="about" className="py-24 bg-gray-50/50">
            <div className="section-container">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
                    >
                        About Us
                    </motion.h3>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-foreground mb-10 leading-tight"
                    >
                        Redefining the standard <br className="hidden md:block" />
                        for estate settlement
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground leading-relaxed space-y-6 mb-12"
                    >
                        <p>
                            ExpectedEstate was founded on a simple premise: settling a loved one's estate shouldn't be a source of trauma. In an industry dominated by opaque legal processes and exorbitant attorney fees, we've built a platform that puts the power back in your hands.
                        </p>
                        <p>
                            By combining specialized legal expertise with state-of-the-art technology, we've created a system that guides you through every step of the fiduciary journey. From the first notice to the final distribution, we ensure you have the tools, the knowledge, and the confidence to succeed.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button variant="outline" size="lg" className="rounded-full border-primary text-primary font-semibold hover:bg-primary/5 px-10" asChild>
                            <Link to="/auth">Read Our Full Story</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
