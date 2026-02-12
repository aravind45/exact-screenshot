import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Sarah M.",
        role: "Executor",
        content: "ExpectedEstate was a lifeline after my father passed. It turned a mountain of confusing paperwork into clear, manageable steps. I finally felt in control.",
        rating: 5,
    },
    {
        name: "David L.",
        role: "Co-Executor",
        content: "The shared workspace kept my siblings and me on the same page. No more arguments about what had been done or what was missing. Truly compassionate design.",
        rating: 5,
    },
    {
        name: "Elena R.",
        role: "Heir & Administrator",
        content: "I didn't know where to start. The settlement roadmap gave me the clarity I needed to handle the estate without constant legal guesswork. Highly recommend.",
        rating: 5,
    }
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
                        Social Proof
                    </motion.h3>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-foreground mb-6"
                    >
                        Trusted by families <br className="hidden md:block" /> during their hardest moments.
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] shadow-sm border border-border/50 flex flex-col relative"
                        >
                            <Quote className="absolute top-6 right-8 w-10 h-10 text-primary/5" />
                            <div className="flex gap-1 mb-6">
                                {[...Array(t.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                ))}
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
