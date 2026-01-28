import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gavel, Scale, FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AssetAuthorityBlockerProps {
    institutionName: string;
    hasLetters?: boolean;
}

export function AssetAuthorityBlocker({ institutionName, hasLetters }: AssetAuthorityBlockerProps) {
    if (hasLetters) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-6 p-5 bg-amber-50 border border-amber-200 rounded-3xl shadow-sm overflow-hidden relative"
        >
            {/* Background Decorative Element */}
            <div className="absolute -left-4 -bottom-4 opacity-[0.03] pointer-events-none">
                <Gavel className="w-24 h-24 text-amber-900 rotate-12" />
            </div>

            {/* Left: Icon & Core Message */}
            <div className="flex flex-1 items-center gap-5 min-w-0 relative z-10">
                <div className="p-3.5 bg-amber-100 rounded-2xl flex-shrink-0">
                    <Gavel className="w-6 h-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                        Court Authority Required
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    </h2>
                    <p className="text-[13px] text-slate-600 font-medium leading-tight">
                        Owned <span className="text-slate-900 font-bold">Individually</span>. {institutionName} requires
                        <span className="text-slate-900 font-bold"> Letters (DE-150)</span> to grant access.
                    </p>
                </div>
            </div>

            {/* Middle: Key Requirements Tags */}
            <div className="flex flex-wrap items-center gap-3 relative z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <Scale className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Letters Testamentary</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Form DE-150</span>
                </div>
            </div>

            {/* Right: CTA */}
            <div className="flex-shrink-0 relative z-10">
                <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl gap-2 shadow-md shadow-slate-200"
                    asChild
                >
                    <Link to="/probate">
                        Resolve in Probate Hub
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </Button>
            </div>
        </motion.div>
    );
}
