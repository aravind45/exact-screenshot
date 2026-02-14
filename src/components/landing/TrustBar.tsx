import { Shield, Lock, UserCheck, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export function TrustBar() {
    return (
        <section className="py-8 border-b border-border/50 bg-white">
            <div className="section-container">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Lock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Security</p>
                            <p className="text-sm font-bold text-slate-700">Bank-Level Encryption</p>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-slate-100" />

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Privacy</p>
                            <p className="text-sm font-bold text-slate-700">Private & Confidential</p>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-slate-100" />

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Trusted</p>
                            <p className="text-sm font-bold text-slate-700">Attorneys & Advisors</p>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-slate-100" />

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Guidance</p>
                            <p className="text-sm font-bold text-slate-700">Expert-Verified Resources</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
