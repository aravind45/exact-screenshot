
import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Gavel,
    Landmark,
    Search,
    ShieldCheck,
    ChevronRight,
    TrendingUp,
    FileText,
    CreditCard,
    Shield
} from "lucide-react";

interface MindMapNode {
    name: string;
    id?: string;
    icon?: any;
    status?: 'pending' | 'completed' | 'active';
    children?: MindMapNode[];
    color?: string;
}

export function SettlementMindMap() {
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const estateName = estate ? `${estate.deceasedFirstName}'s Estate` : "Estate Settlement";

    const branches: MindMapNode[] = [
        {
            name: "Legal Process",
            color: "#A855F7", // Purple
            icon: Gavel,
            children: [
                { name: "Petition Wizard" },
                { name: estate?.estateType === "SMALL_ESTATE" ? "Small Estate Affidavit" : "Petition for Probate" },
                { name: "Spousal Petition" },
            ]
        },
        {
            name: "Finances",
            color: "#3B82F6", // Blue
            icon: Landmark,
            children: [
                { name: "Assets Ledger" },
                { name: "Liabilities" },
                { name: "Valuations" },
            ]
        },
        {
            name: "Discovery",
            color: "#10B981", // Green
            icon: Search,
            children: [
                { name: "Asset Detective" },
                { name: "Document Vault" },
            ]
        },
        {
            name: "Closing",
            color: "#F59E0B", // Orange
            icon: ShieldCheck,
            children: [
                { name: "Distribution" },
                { name: "Final Accounting" },
            ]
        }
    ];

    return (
        <div className="relative w-full bg-slate-50/50 rounded-[40px] p-8 lg:p-12 border border-slate-200 overflow-hidden shadow-sm">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10">

                {/* Hub (Left) */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center space-y-4 shrink-0"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                        <div className="w-28 h-28 rounded-[36px] bg-slate-900 shadow-2xl flex items-center justify-center relative border border-slate-800">
                            <Shield className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black tracking-tight text-slate-900">{estateName}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Map</p>
                    </div>
                </motion.div>

                {/* Branches (Right) */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {branches.map((branch, idx) => (
                        <motion.div
                            key={branch.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="space-y-6"
                        >
                            {/* Branch Header */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/10"
                                    style={{ backgroundColor: branch.color }}
                                >
                                    <branch.icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{branch.name}</h3>
                                    <div className="h-0.5 w-8 rounded-full mt-1" style={{ backgroundColor: branch.color }} />
                                </div>
                            </div>

                            {/* Branch Children */}
                            <div className="space-y-3">
                                {branch.children?.map((child) => (
                                    <motion.div
                                        key={child.name}
                                        whileHover={{ x: 5 }}
                                        className="group flex flex-col p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{child.name}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                        {/* Tiny animated dot for "live" feel */}
                                        <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Connection SVG (Background Decor) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block overflow-visible opacity-5">
                <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                </defs>
                <path d="M 120,50% C 250,50% 250,20% 400,20%" stroke="url(#curveGrad)" strokeWidth="2" fill="none" />
                <path d="M 120,50% C 250,50% 250,40% 400,40%" stroke="url(#curveGrad)" strokeWidth="2" fill="none" />
                <path d="M 120,50% C 250,50% 250,60% 400,60%" stroke="url(#curveGrad)" strokeWidth="2" fill="none" />
                <path d="M 120,50% C 250,50% 250,80% 400,80%" stroke="url(#curveGrad)" strokeWidth="2" fill="none" />
            </svg>
        </div>
    );
}
