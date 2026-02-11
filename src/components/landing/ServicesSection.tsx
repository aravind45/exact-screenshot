import { motion } from "framer-motion";
import { Shield, Map, Files, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ServicesSection() {
    const services = [
        {
            icon: Users,
            title: "Guided Intake",
            description: "Answer a few questions about the state, trust, will, assets, and beneficiaries."
        },
        {
            icon: Map,
            title: "Settlement Roadmap",
            description: "See the likely path — probate, trust administration, small estate, or beneficiary transfer — explained in plain language."
        },
        {
            icon: Shield,
            title: "One Shared Workspace",
            description: "Track assets, debts, documents, and progress so co-executors and family stay aligned."
        }
    ];

    return (
        <section id="services" className="py-24 bg-white scroll-mt-20">
            <div className="section-container">
                <div className="text-center mb-16">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
                    >
                        How it works
                    </motion.h3>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-foreground mb-6"
                    >
                        What ExpectedEstate Actually Does
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
                    >
                        Concrete tools built for families navigating the complexities of estate settlement.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            className="bg-muted/30 p-10 rounded-[2.5rem] border border-border/50 hover:border-primary/20 transition-all hover:shadow-xl group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8">
                                <service.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                            <p className="text-muted-foreground leading-relaxed font-medium">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-20"
                >
                    <Link to="/dashboard">
                        <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-full group bg-primary">
                            Start guided intake
                            <span className="ml-3 group-hover:translate-x-1 transition-transform">→</span>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
