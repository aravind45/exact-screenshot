
import React from "react";
import { Relationship, calculateIntestacyDistribution } from "@/lib/intestacyEngine";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heir {
    id: string;
    name: string;
    relationship: string;
}

interface IntestacyDistributionPreviewProps {
    state: string;
    heirs: Heir[];
    className?: string;
}

export const IntestacyDistributionPreview: React.FC<IntestacyDistributionPreviewProps> = ({
    state,
    heirs,
    className
}) => {
    const heirInputs = heirs.map(h => ({
        id: h.id,
        name: h.name,
        relationship: h.relationship.toUpperCase() as Relationship
    }));

    const distributions = calculateIntestacyDistribution(state, heirInputs);

    if (distributions.length === 0) return null;

    return (
        <div className={cn("p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Legal Distribution (Intestacy)</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-white text-indigo-600 border-indigo-100">
                    {state} Rules
                </Badge>
            </div>

            <div className="space-y-2">
                {distributions.map((dist, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                                {heirs.find(h => h.id === dist.heirId)?.name || "Unnamed Heir"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium uppercase truncate max-w-[180px]">
                                {dist.reason}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${dist.percentage}%` }}
                                />
                            </div>
                            <span className="text-xs font-black text-indigo-600 w-8 text-right">
                                {dist.percentage === 33.33 ? "1/3" : dist.percentage === 66.67 ? "2/3" : `${Math.round(dist.percentage)}%`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[9px] text-slate-400 italic mt-2 leading-tight">
                * Based on {state} Probate Code succession rules for separate property. This is an estimate for guidance.
            </p>
        </div>
    );
};
