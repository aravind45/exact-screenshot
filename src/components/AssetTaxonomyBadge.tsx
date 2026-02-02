import React from 'react';
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Clock,
    Lock,
    Eye,
    FileText,
    CheckCircle2
} from "lucide-react";
import { AssetTaxonomyState, TAXONOMY_CONFIG } from "@/lib/taxonomy";

const stateIcons: Record<AssetTaxonomyState, React.ElementType> = {
    action_required: AlertCircle,
    waiting: Clock,
    blocked: Lock,
    monitoring: Eye,
    ready: FileText,
    resolved: CheckCircle2
};

const stateStyles: Record<AssetTaxonomyState, string> = {
    action_required: "bg-red-50 border-red-200 text-red-700",
    waiting: "bg-amber-50 border-amber-200 text-amber-700",
    blocked: "bg-purple-50 border-purple-200 text-purple-700",
    monitoring: "bg-yellow-50 border-yellow-200 text-yellow-700",
    ready: "bg-blue-50 border-blue-200 text-blue-700",
    resolved: "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
};

interface AssetTaxonomyBadgeProps {
    state: AssetTaxonomyState;
    className?: string;
    showIcon?: boolean;
}

export function AssetTaxonomyBadge({ state, className, showIcon = true }: AssetTaxonomyBadgeProps) {
    const info = TAXONOMY_CONFIG[state];
    const Icon = stateIcons[state];

    return (
        <div className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] uppercase font-bold tracking-tight",
            stateStyles[state],
            className
        )}>
            {showIcon && <Icon className="w-3 h-3" />}
            {info.label}
        </div>
    );
}
