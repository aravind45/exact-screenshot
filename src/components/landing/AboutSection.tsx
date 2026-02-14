import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AboutSection() {
    return (
        <section id="about" className="py-24 bg-white overflow-hidden scroll-mt-20">
            <div className="section-container">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6">
                            About Us
                        </h3>
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
                            Redefining the standard <br />
                            for estate settlement
                        </h2>
                        <div className="text-lg text-muted-foreground leading-relaxed space-y-6 mb-10">
                            <p>
                                ExpectedEstate was founded on a simple premise: settling a loved one's estate shouldn't be a source of trauma. In an industry dominated by opaque legal processes and exorbitant attorney fees, we've built a platform that puts the power back in your hands.
                            </p>
                            <p>
                                By combining specialized legal expertise with state-of-the-art technology, we've created a system that guides you through every step of the fiduciary journey.
                            </p>
                        </div>
                        <Button variant="outline" size="lg" className="rounded-full border-primary text-primary font-semibold hover:bg-primary/5 px-10" asChild>
                            <Link to="/start">Get Your Free Roadmap</Link>
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
                            <img
                                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1200"
                                alt="Expert Team"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        {/* Decorative element */}
                        <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-primary/20 rounded-[2rem] -z-10" />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
