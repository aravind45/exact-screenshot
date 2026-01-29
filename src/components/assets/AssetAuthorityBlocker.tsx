import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gavel, Scale, FileText, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SettlementTrack } from "@/config/settlementStages";

interface AssetAuthorityBlockerProps {
    institutionName: string;
    hasLetters?: boolean;
    track?: SettlementTrack;
}

export function AssetAuthorityBlocker({ institutionName, hasLetters, track }: AssetAuthorityBlockerProps) {
    if (hasLetters) return null;

    const getTrackConfig = () => {
        switch (track) {
            case "SMALL_ESTATE":
                return {
                    title: "Affidavit Required",
                    description: `Owned Individually. ${institutionName} requires a notarized Small Estate Affidavit to release funds.`,
                    docs: ["DE-310 Affidavit", "Death Certificate"],
                    link: "/vault",
                    linkText: "Prepare Affidavit",
                    icon: Zap,
                    color: "emerald"
                };
            case "SPOUSAL_PETITION":
                return {
                    title: "Spousal Order Required",
                    description: `${institutionName} needs a court-confirmed Spousal Property Order to transfer title.`,
                    docs: ["DE-221 Petition", "Court Order"],
                    link: "/probate",
                    linkText: "Check Petition Status",
                    icon: Scale,
                    color: "violet"
                };
            case "TRUST_ADMIN":
                return {
                    title: "Trustee Authority",
                    description: `${institutionName} requires a Certificate of Trust and your signed Acceptance of Trusteeship.`,
                    docs: ["Cert of Trust", "Trustee Acceptance"],
                    link: "/vault",
                    linkText: "Upload Trust Docs",
                    icon: ShieldCheck,
                    color: "indigo"
                };
            case "JOINT_TRANSFER":
            case "POD_TOD_TRANSFER":
                return {
                    title: "Beneficiary Claim",
                    description: `This asset bypasses court. ${institutionName} just needs a Death Certificate and Claim Form.`,
                    docs: ["Death Certificate", "Claim Form"],
                    link: "/assets",
                    linkText: "View Claim Status",
                    icon: Zap,
                    color: "amber"
                };
            default:
                return {
                    title: "Court Authority Required",
                    description: `Owned Individually. ${institutionName} requires Letters Testamentary (DE-150) to grant access.`,
                    docs: ["DE-150 Letters", "DE-111 Petition"],
                    link: "/probate",
                    linkText: "Resolve in Probate Hub",
                    icon: Gavel,
                    color: "amber"
                };
        }
    };

    const config = getTrackConfig();
    const Icon = config.icon;
    const colorClass = {
        amber: "bg-amber-50 border-amber-200 text-amber-600",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
        violet: "bg-violet-50 border-violet-200 text-violet-600",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
    }[config.color as keyof typeof colorClass] || "bg-slate-50 border-slate-200 text-slate-600";

    const iconBgClass = {
        amber: "bg-amber-100",
        emerald: "bg-emerald-100",
        violet: "bg-violet-100",
        indigo: "bg-indigo-100",
    }[config.color as keyof typeof iconBgClass] || "bg-slate-100";

    const textColorClass = {
        amber: "text-amber-600",
        emerald: "text-emerald-600",
        violet: "text-violet-600",
        indigo: "text-indigo-600",
    }[config.color as keyof typeof textColorClass];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col md:flex-row items-center gap-6 p-5 border rounded-3xl shadow-sm overflow-hidden relative ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}
        >
            {/* Background Decorative Element */}
            <div className="absolute -left-4 -bottom-4 opacity-[0.03] pointer-events-none text-slate-900">
                <Icon className="w-24 h-24 rotate-12" />
            </div>

            {/* Left: Icon & Core Message */}
            <div className="flex flex-1 items-center gap-5 min-w-0 relative z-10">
                <div className={`p-3.5 rounded-2xl flex-shrink-0 ${iconBgClass}`}>
                    <Icon className={`w-6 h-6 ${textColorClass}`} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                        {config.title}
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse bg-${config.color}-500`} />
                    </h2>
                    <p className="text-[13px] text-slate-600 font-medium leading-tight">
                        {config.description}
                    </p>
                </div>
            </div>

            {/* Middle: Key Requirements Tags */}
            <div className="flex flex-wrap items-center gap-3 relative z-10">
                {config.docs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{doc}</span>
                    </div>
                ))}
            </div>

            {/* Right: CTA */}
            <div className="flex-shrink-0 relative z-10">
                <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl gap-2 shadow-md shadow-slate-200"
                    asChild
                >
                    <Link to={config.link}>
                        {config.linkText}
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </Button>
            </div>
        </motion.div>
    );
}
