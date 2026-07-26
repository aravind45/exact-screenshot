import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gavel, Scale, FileText, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SettlementTrack } from "@/config/settlementStages";
import { getLettersTerm, getStateRule } from "@/lib/stateRules";

interface AssetAuthorityBlockerProps {
    institutionName: string;
    hasLetters?: boolean;
    track?: SettlementTrack;
    authorityType?: string;
    stateCode?: string;
}

export function AssetAuthorityBlocker({ institutionName, hasLetters, track, authorityType, stateCode }: AssetAuthorityBlockerProps) {
    if (hasLetters) return null;

    const getTrackConfig = () => {
        // Priority 1: Explicit Authority Type
        if (authorityType) {
            switch (authorityType) {
                case 'AFFIDAVIT_SMALL':
                    const rule = getStateRule(stateCode || "");
                    return {
                        title: "Affidavit Required",
                        description: `Owned Individually. ${institutionName} requires a notarized ${rule.smallEstateTerm} to release funds.`,
                        docs: [rule.smallEstateTerm, "Death Certificate"],
                        link: "/vault",
                        linkText: "Prepare Affidavit",
                        icon: Zap,
                        color: "emerald"
                    };
                case 'TRUSTEE_DIRECT':
                    return {
                        title: "Trustee Authority",
                        description: `${institutionName} requires a Certificate of Trust and your signed Acceptance of Trusteeship.`,
                        docs: ["Cert of Trust", "Trustee Acceptance"],
                        link: "/vault",
                        linkText: "Upload Trust Docs",
                        icon: ShieldCheck,
                        color: "indigo"
                    };
                case 'BENEFICIARY_CONTRACT':
                case 'SURVIVORSHIP_TITLE':
                    return {
                        title: "Non-Probate Transfer",
                        description: `This asset bypasses court. ${institutionName} just needs a Death Certificate and Claim Form.`,
                        docs: ["Death Certificate", "Claim Form"],
                        link: "/assets",
                        linkText: "View Claim Status",
                        icon: Zap,
                        color: "amber"
                    };
                case 'LITIGATION_HOLD':
                    return {
                        title: "Litigation Hold",
                        description: `${institutionName} is currently blocked due to an active legal dispute or contest.`,
                        docs: ["Legal Counsel Required"],
                        link: "/help",
                        linkText: "Contact Support",
                        icon: AlertCircle,
                        color: "slate"
                    };
                case 'COURT_REQUIRED':
                    return {
                        title: "Court Authority Required",
                        description: `Owned Individually. ${institutionName} requires ${getLettersTerm(stateCode)} to grant access.`,
                        docs: [getLettersTerm(stateCode), "Death Certificate"],
                        link: "/probate",
                        linkText: "Resolve in Probate Hub",
                        icon: Gavel,
                        color: "amber"
                    };
            }
        }

        // Priority 2: Fallback to Track Config
        switch (track) {
            case "SMALL_ESTATE":
                return {
                    title: "Affidavit Required",
                    description: `Owned Individually. ${institutionName} requires a notarized Small Estate Affidavit to release funds.`,
                    docs: ["Notarized Prob. Code §13100 Affidavit", "Certified Death Certificate"],
                    link: "/vault",
                    linkText: "Prepare Affidavit",
                    icon: Zap,
                    color: "emerald"
                };
            case "SPOUSAL_PETITION":
                const sRule = getStateRule(stateCode || "");
                return {
                    title: "Spousal Order Required",
                    description: `${institutionName} needs a court-confirmed ${sRule.spousalSetAside?.term || 'Spousal Order'} to transfer title.`,
                    docs: [sRule.spousalSetAside?.term || "Spousal Petition", "Court Order"],
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
                    description: `Owned Individually. ${institutionName} requires ${getLettersTerm(stateCode)} to grant access.`,
                    docs: [getLettersTerm(stateCode), "Death Certificate"],
                    link: "/probate",
                    linkText: "Resolve in Probate Hub",
                    icon: Gavel,
                    color: "amber"
                };
        }
    };

    const config = getTrackConfig();

    // Safety check - if config is somehow undefined, return null
    if (!config || !config.icon) {
        console.error('AssetAuthorityBlocker: Invalid config', { track, config });
        return null;
    }

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
    }[config.color as keyof typeof textColorClass] || "text-slate-600";

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-4 p-4 border rounded-xl ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}
        >
            <div className={`p-2 rounded-lg flex-shrink-0 ${iconBgClass}`}>
                <Icon className={`w-4 h-4 ${textColorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {config.title}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                    {config.description}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {config.docs.map((doc, i) => (
                    <span key={i} className="text-[9px] font-bold text-slate-500 uppercase px-2 py-1 bg-white rounded border border-slate-200">
                        {doc}
                    </span>
                ))}
            </div>
            <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] uppercase h-8 px-4 rounded-lg"
                asChild
            >
                <Link to={config.link}>
                    {config.linkText}
                    <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
            </Button>
        </motion.div>
    );
}
