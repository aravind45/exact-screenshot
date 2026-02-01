
import { Button } from "@/components/ui/button";
import { MessageSquare, FileSearch, Plus, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import { SettlementPhase } from "@/components/SettlementPhaseChevron";

export function QuickActions({ currentPhase }: { currentPhase?: SettlementPhase }) {
    const navigate = useNavigate();

    const isDiscovery = currentPhase === 'asset_discovery';
    const isCourt = currentPhase === 'court_filing';
    const isSettlement = currentPhase === 'asset_liquidation' || currentPhase === 'creditor_claims';

    const actions = [
        {
            title: "Log Diligence Note",
            desc: "Add to Settlement Trail",
            icon: MessageSquare,
            color: "bg-indigo-50 text-indigo-600",
            hover: "hover:bg-indigo-100/50 hover:border-indigo-200",
            onClick: () => navigate("/settlement-trail")
        },
        {
            title: isDiscovery ? "Run Discovery Scan" : "Find Assets",
            desc: isDiscovery ? "Search for hidden accounts" : "Identify estate holdings",
            icon: FileSearch,
            color: "bg-amber-50 text-amber-600",
            hover: "hover:bg-amber-100/50 hover:border-amber-200",
            onClick: () => navigate("/discovery")
        },
        {
            title: isSettlement ? "Update Asset Status" : "Add New Asset",
            desc: isSettlement ? "Track liquidation progress" : "Register account or property",
            icon: Plus,
            color: "bg-emerald-50 text-emerald-600",
            hover: "hover:bg-emerald-100/50 hover:border-emerald-200",
            onClick: () => navigate("/assets")
        },
        {
            title: isCourt ? "Prepare Petition" : "Generate forms",
            desc: isCourt ? "Submit DE-111 / DE-150" : "Court-compliant documents",
            icon: FileText,
            color: "bg-violet-50 text-violet-600",
            hover: "hover:bg-violet-100/50 hover:border-violet-200",
            onClick: () => navigate("/forms")
        }
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        className={cn(
                            "flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-3xl text-left transition-all duration-200",
                            action.hover
                        )}
                    >
                        <div className={cn("p-3 rounded-2xl", action.color)}>
                            <action.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{action.title}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{action.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>
        </div>
    );
}
