import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProcessStep {
    title: string;
    subtitle: string;
    timeline: string;
    color: string;
}

const steps: ProcessStep[] = [
    {
        title: 'Immediate',
        subtitle: 'Actions',
        timeline: 'Week 1-2',
        color: 'bg-red-500',
    },
    {
        title: 'Court',
        subtitle: 'Filing',
        timeline: 'Week 2-8',
        color: 'bg-orange-500',
    },
    {
        title: 'Asset',
        subtitle: 'Discovery',
        timeline: 'Month 2-4',
        color: 'bg-yellow-500',
    },
    {
        title: 'Creditor',
        subtitle: 'Claims',
        timeline: 'Month 4-8',
        color: 'bg-blue-500',
    },
    {
        title: 'Asset',
        subtitle: 'Liquidation',
        timeline: 'Month 6-12',
        color: 'bg-purple-500',
    },
    {
        title: 'Final',
        subtitle: 'Distribution',
        timeline: 'Month 12-18',
        color: 'bg-green-500',
    },
];

export function ProcessTimeline() {
    return (
        <section id="process-timeline" className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="section-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="bg-card rounded-2xl shadow-soft-xl border border-border/50 p-8 md:p-12">
                        <div className="overflow-x-auto">
                            <div className="flex items-center justify-start md:justify-center gap-0 pb-4 min-w-max px-4">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="relative flex-shrink-0"
                                    >
                                        <div
                                            className={`${step.color} text-white px-10 py-6 min-w-[160px] text-center relative transition-transform hover:scale-105`}
                                            style={{
                                                clipPath: index === steps.length - 1
                                                    ? 'polygon(15% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 50%)'
                                                    : index === 0
                                                        ? 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)'
                                                        : 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
                                                marginLeft: index === 0 ? '0' : '-15px',
                                            }}
                                        >
                                            <div className="font-bold text-base leading-tight">{step.title}</div>
                                            <div className="font-bold text-base leading-tight">{step.subtitle}</div>
                                            <div className="text-xs mt-2 opacity-95 font-medium">{step.timeline}</div>
                                        </div>
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.6 }}
                                    className="flex-shrink-0 ml-2"
                                >
                                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-9 h-9 text-white stroke-[3]" />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
