import { motion } from "framer-motion";
import { Star, Quote, TrendingUp, Users, FileCheck } from "lucide-react";

const testimonials = [
    {
        name: "Sarah M.",
        role: "Executor",
        content: "The probate lawyer quoted us $15,000. We settled the estate for under $500 using ExpectedEstate and it was accepted by the court on the first try.",
        rating: 5,
        highlight: "Saved ~$14,500 in fees"
    },
    {
        name: "David L.",
        role: "Co-Executor",
        content: "My brother and I were arguing about the bank accounts. The Asset Ledger gave us a single source of truth and stopped the fighting immediately.",
        rating: 5,
        highlight: "Resolved family conflict"
    },
    {
        name: "Elena R.",
        role: "Administrator",
        content: "I spent 3 weeks trying to find the right forms. This platform generated my entire Petition for Probate in 10 minutes.",
        rating: 5,
        highlight: "3 weeks of work → 10 mins"
    }
];

const metrics = [
    { icon: Users, value: "500+", label: "Executors Helped" },
    { icon: TrendingUp, value: "$50M+", label: "Estate Assets Tracked" },
    { icon: FileCheck, value: "1,000+", label: "Court Forms Generated" },
];

export function TestimonialsSection() {
    return (
        <section className="py-24 bg-gray-50/50 border-y border-border/30">
            <div className="section-container">
                <div className="text-center mb-16">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6"
                    >
                        Proven Results
                    </motion.h3>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-foreground mb-12"
                    >
                        Trusted by families <br className="hidden md:block" /> during their hardest moments.
                    </motion.h2>

                    {/* Quantified Proof Banner */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-border/50 shadow-xl mb-16 flex flex-wrap justify-between items-center gap-8"
                    >
                        {metrics.map((m, i) => (
                            <div key={i} className="flex items-center gap-4 flex-1 justify-center min-w-[200px]">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <m.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <div className="text-3xl font-black text-foreground">{m.value}</div>
                                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{m.label}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] shadow-sm border border-border/50 flex flex-col relative group hover:border-primary/30 transition-all hover:shadow-lg"
                        >
                            <Quote className="absolute top-6 right-8 w-10 h-10 text-primary/5 group-hover:text-primary/10 transition-colors" />

                            <div className="mb-6">
                                <span className="inline-block py-1 px-3 rounded-full bg-green-50 text-green-700 text-xs font-black uppercase tracking-widest mb-4 border border-green-100">
                                    {t.highlight}
                                </span>
                                <div className="flex gap-1">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>
                            </div>

                            <p className="text-lg text-foreground/80 font-medium italic mb-8 flex-1 leading-relaxed">
                                "{t.content}"
                            </p>
                            <div>
                                <h4 className="font-black text-foreground">{t.name}</h4>
                                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{t.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
