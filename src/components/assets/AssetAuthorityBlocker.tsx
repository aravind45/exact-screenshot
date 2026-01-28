import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gavel, Scale, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface AssetAuthorityBlockerProps {
    institutionName: string;
}

export function AssetAuthorityBlocker({ institutionName }: AssetAuthorityBlockerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-8 bg-amber-50/50 border border-amber-200 rounded-3xl text-center space-y-6 shadow-sm"
        >
            <div className="p-4 bg-amber-100 rounded-2xl ring-4 ring-amber-50">
                <Gavel className="w-8 h-8 text-amber-600" />
            </div>
            <div className="max-w-xl space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Court Authority Required</h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    This account was owned <span className="text-slate-900 font-bold">Individually</span>.
                    <span className="font-bold text-slate-800"> {institutionName}</span> will not allow you to settle this asset until the court issues your <strong>Letters (DE-150)</strong>.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg pt-2">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-left hover:border-violet-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-4 h-4 text-violet-600" />
                        <span className="text-[10px] font-bold uppercase text-slate-500">Legal Step</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">Obtain Letters Testamentary</p>
                    <p className="text-[10px] text-slate-500 mt-1">Proof of your legal power to move this asset.</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-left hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-bold uppercase text-slate-500">Document Needed</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">Form DE-150</p>
                    <p className="text-[10px] text-slate-500 mt-1">Must be sealed/certified by the clerk.</p>
                </div>
            </div>

            <Button
                size="lg"
                className="px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all"
                asChild
            >
                <Link to="/probate">
                    Go to Probate Hub
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </Button>
        </motion.div>
    );
}
