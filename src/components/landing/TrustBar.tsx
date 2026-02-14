import { ShieldCheck, Lock, FileCheck, Scale } from "lucide-react";

export function TrustBar() {
    return (
        <section className="py-8 border-b border-border/50 bg-white">
            <div className="section-container">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-90 transition-all duration-500">

                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <Lock className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security</p>
                            <p className="text-sm font-bold text-slate-700">Bank-Level AES-256</p>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-slate-100" />

                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance</p>
                            <p className="text-sm font-bold text-slate-700">Court-Approved Forms</p>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-slate-100" />

                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Scale className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expert Review</p>
                            <p className="text-sm font-bold text-slate-700">Attorney-Verified</p>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-slate-100" />

                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                            <ShieldCheck className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guaranteed</p>
                            <p className="text-sm font-bold text-slate-700">Money-Back Promise</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
