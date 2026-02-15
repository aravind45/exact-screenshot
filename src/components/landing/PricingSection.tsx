import { motion } from "framer-motion";
import { Check, Gem, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function PricingSection() {
    const navigate = useNavigate();

    const plan = {
        name: "Complete Estate Access",
        monthlyPrice: "$49",
        period: "/month",
        description: "Every feature you need for a stress-free settlement",
        features: [
            "All 11 Settlement Roadmap Types",
            "Unlimited Asset Tracking",
            "Fiduciary Communications Log",
            "Complete CA PDF Form Suite",
            "Claims Priority Engine",
            "AI-Powered Discovery Assistant",
            "Secure Document Vault (50GB)",
        ],
        highlight: "All inclusive, no hidden costs.",
    };

    return (
        <section id="pricing" className="py-24 bg-primary/5 scroll-mt-20">
            <div className="section-container">
                <div className="text-center mb-16">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
                    >
                        Pricing
                    </motion.h3>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-foreground mb-6"
                    >
                        One Simple Plan for Your Peace of Mind
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
                    >
                        No tiers, no hidden fees. Just everything you need to settle an estate with confidence.
                    </motion.p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl rounded-[3rem] bg-white">
                            <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-3 font-bold">
                                <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </Badge>
                                <div className="flex items-center gap-1.5 text-[10px] text-primary bg-primary/5 py-1.5 px-3 rounded-full border border-primary/10">
                                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Money-Back Promise
                                </div>
                            </div>

                            <div className="grid md:grid-cols-5 gap-0">
                                {/* Left Side: Pricing */}
                                <div className="md:col-span-2 p-12 bg-primary/5 flex flex-col justify-center items-center text-center border-r border-border/50">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase mb-4">
                                        <Gem className="w-5 h-5" />
                                        {plan.name}
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-7xl font-black text-foreground">{plan.monthlyPrice}</span>
                                        <span className="text-muted-foreground font-bold">{plan.period}</span>
                                    </div>
                                    <p className="text-muted-foreground font-medium mb-8">
                                        All inclusive, no hidden costs. <br />
                                        <span className="text-primary font-bold">100% Satisfaction Guaranteed.</span>
                                    </p>
                                    <Button
                                        size="lg"
                                        className="w-full h-16 text-xl font-black rounded-full shadow-xl bg-primary hover:scale-105 transition-all"
                                        onClick={() => navigate("/pricing")}
                                    >
                                        Get Started Now
                                    </Button>
                                </div>

                                {/* Right Side: Features */}
                                <CardContent className="md:col-span-3 p-12">
                                    <CardTitle className="text-2xl font-black mb-8">What's included:</CardTitle>
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-4 text-lg font-bold text-foreground/80">
                                                <div className="mt-1 w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-4 h-4 stroke-[3]" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-12 text-sm text-muted-foreground font-medium italic">
                                        * Deductible as a legitimate estate administration expense in most jurisdictions.
                                    </p>
                                </CardContent>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
