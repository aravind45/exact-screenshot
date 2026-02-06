import { cn } from "@/lib/utils";
import {
    Gavel,
    UserRound,
    FileCheck,
    Handshake,
    Users,
    ShieldAlert,
    Clock
} from "lucide-react";

export type AuthorityType =
    | 'COURT_REQUIRED'
    | 'TRUSTEE_DIRECT'
    | 'AFFIDAVIT_SMALL'
    | 'BENEFICIARY_CONTRACT'
    | 'SURVIVORSHIP_TITLE'
    | 'LITIGATION_HOLD';

interface AuthorityConfig {
    label: string;
    icon: any;
    className: string;
    description: string;
}

const authorityConfig: Record<AuthorityType, AuthorityConfig> = {
    COURT_REQUIRED: {
        label: "Court Authority Required",
        icon: Gavel,
        className: "bg-amber-500/10 text-amber-600 border-amber-200",
        description: "Requires Letters Testamentary or Letters of Administration"
    },
    TRUSTEE_DIRECT: {
        label: "Trustee Direct",
        icon: UserRound,
        className: "bg-violet-500/10 text-violet-600 border-violet-200",
        description: "Successor Trustee has direct authority under the Trust instrument"
    },
    AFFIDAVIT_SMALL: {
        label: "Small Estate Affidavit",
        icon: FileCheck,
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        description: "Transfer via standard affidavit without court opening"
    },
    BENEFICIARY_CONTRACT: {
        label: "Beneficiary Contract",
        icon: Handshake,
        className: "bg-success/10 text-success border-success/20",
        description: "Transfer via POD/TOD or named beneficiary contract"
    },
    SURVIVORSHIP_TITLE: {
        label: "Survivorship Title",
        icon: Users,
        className: "bg-blue-500/10 text-blue-600 border-blue-200",
        description: "Automatic transfer to surviving joint tenant"
    },
    LITIGATION_HOLD: {
        label: "Litigation Hold",
        icon: ShieldAlert,
        className: "bg-slate-900/10 text-slate-900 border-slate-900/20",
        description: "Asset is currently blocked due to active legal dispute"
    }
};

interface AuthorityBadgeProps {
    type?: string | AuthorityType;
    className?: string;
    showIcon?: boolean;
}

export function AuthorityBadge({ type, className, showIcon = true }: AuthorityBadgeProps) {
    if (!type) return null;

    const normalizedType = type as AuthorityType;
    const config = authorityConfig[normalizedType];

    if (!config) {
        // Default fallback for unknown authority types
        return (
            <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200",
                className
            )}>
                {showIcon && <Clock className="w-3 h-3" />}
                <span>Authority Pending</span>
            </div>
        );
    }

    const Icon = config.icon;

    return (
        <div
            title={config.description}
            className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all",
                config.className,
                className
            )}
        >
            {showIcon && <Icon className="w-3 h-3" />}
            <span>{config.label}</span>
        </div>
    );
}
