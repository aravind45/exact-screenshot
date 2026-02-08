import { motion } from "framer-motion";
import { Shield, Map, Files, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ServicesSection() {
    const services = [
        {
            icon: Map,
            title: "Estate Roadmaps",
            description: "Step-by-step guidance tailored to your specific state and estate type. Never guess your next step."
        },
        {
            icon: Files,
            title: "Smart Ledger",
            description: "Automatically track assets, liabilities, and disbursements with accountant-ready precision."
        },
        {
            icon: Shield,
            title: "Audit Trail",
            description: "Build a robust record of diligence that protects you from personal liability and heir scrutiny."
        }
    ];

    return (
        <section id="services" className="py-24 bg-white">
            <div className="section-container">
                <div className="text-center mb-16">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
                    >
                        Capabilities
                    </motion.h3>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-foreground mb-6"
                    >
                        Everything you need <br className="hidden md:block" />
                        in one place
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        From the first day of settlement to the final distribution, ExpectedEstate provides the tools and security professional fiduciaries trust.
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
                            className="text-center group"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-8 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <service.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
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
                    <Link to="/auth">
                        <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-full group">
                            Explore All Features
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
