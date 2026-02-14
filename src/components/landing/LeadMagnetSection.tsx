import { LeadMagnetForm } from "./LeadMagnetForm";
import { Check, ShieldCheck } from "lucide-react";

export function LeadMagnetSection() {
    return (
        <section className="py-24 bg-slate-900 overflow-hidden relative">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="section-container relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div className="space-y-8">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10">
                                <ShieldCheck className="w-3 h-3 text-primary" />
                                Free Resource
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                                Don't know where to start? <span className="text-primary">Get the plan.</span>
                            </h2>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                                The first 30 days after a death are critical. Download our step-by-step action plan to secure assets, notify authorities, and avoid costly mistakes.
                            </p>
                        </div>

                        <ul className="space-y-4">
                            {[
                                "Immediate steps for the first 72 hours",
                                "How to secure the property and assets",
                                "Who to notify (and who to wait on)",
                                "Checklist of documents to locate"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300 font-bold">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10 relative">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent rounded-full flex items-center justify-center rotate-12 shadow-xl animate-pulse">
                            <span className="text-accent-foreground font-black text-sm uppercase text-center leading-tight">
                                Free<br />Download
                            </span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">
                                Get the "First 30 Days" Action Plan
                            </h3>
                            <p className="text-slate-500 font-medium text-sm">
                                Enter your email and we'll send the PDF checklist instantly.
                            </p>
                        </div>

                        <LeadMagnetForm
                            source="inline_section"
                            buttonText="Send Me The Action Plan"
                        />

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholder for trust badges if needed */}
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                                ))}
                            </div>
                            <p className="text-xs font-bold text-slate-400">Trusted by 500+ Executors</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
