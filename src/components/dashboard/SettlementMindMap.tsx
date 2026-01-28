
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    Shield,
    Gavel,
    Landmark,
    Search,
    FileText,
    Users,
    AlertCircle,
    TrendingUp,
    Scale,
    CreditCard,
    Briefcase
} from "lucide-react";

interface Node {
    id: string;
    label: string;
    icon?: any;
    color?: string;
    children?: Node[];
    description?: string;
}

export function SettlementMindMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const estateName = estate ? `${estate.deceasedFirstName}'s Estate` : "Estate Settlement";

    // Detailed Tree Data following User Reference
    const treeData: Node = {
        id: "root",
        label: "Estate Settlement & Execution",
        icon: Shield,
        children: [
            {
                id: "immediate",
                label: "Immediate Actions",
                icon: FileText,
                color: "#E879F9", // Pink/Purple
                children: [
                    { id: "cert", label: "Death Certificates" },
                    { id: "funeral", label: "Funeral & Obituary" },
                    { id: "ein", label: "IRS Tax ID (EIN)" },
                    { id: "notice", label: "Notice to Heirs" }
                ]
            },
            {
                id: "roles",
                label: "Role Identification",
                icon: Users,
                color: "#38BDF8", // Sky Blue
                children: [
                    { id: "executor", label: "Executor / Admin" },
                    { id: "beneficiary", label: "Beneficiaries" },
                    { id: "trustee", label: "Successor Trustee" }
                ]
            },
            {
                id: "legal",
                label: "Legal Procedure Paths",
                icon: Gavel,
                color: "#FB923C", // Orange
                children: [
                    {
                        id: "full_probate",
                        label: "Full Probate (>$184k)",
                        children: [
                            { id: "de111", label: "Petition (DE-111)" },
                            { id: "de150", label: "Letters (DE-150)" },
                            { id: "inventory", label: "Inventory (DE-160)" }
                        ]
                    },
                    {
                        id: "small_estate",
                        label: "Small Estate Paths",
                        children: [
                            { id: "affidavit", label: "§13100 Affidavit" },
                            { id: "spousal", label: "Spousal Petition" }
                        ]
                    }
                ]
            },
            {
                id: "assets",
                label: "Financial Ledger",
                icon: Landmark,
                color: "#F87171", // Red/Coral
                children: [
                    {
                        id: "asset_list",
                        label: "Asset Inventory",
                        children: [
                            { id: "bank", label: "Bank Accounts" },
                            { id: "real_estate", label: "Real Estate" },
                            { id: "digital", label: "Digital Assets" }
                        ]
                    },
                    {
                        id: "debt_list",
                        label: "Liabilities & Claims",
                        children: [
                            { id: "taxes", label: "Final Tax Returns" },
                            { id: "creditors", label: "Creditor Claims" }
                        ]
                    }
                ]
            },
            {
                id: "closing",
                label: "Final Distribution",
                icon: Shield,
                color: "#4ADE80", // Emerald
                children: [
                    { id: "accounting", label: "Final Accounting" },
                    { id: "dist_order", label: "Distribution Order" },
                    { id: "discharge", label: "Final Discharge" }
                ]
            }
        ]
    };

    return (
        <div className="relative w-full bg-white/40 backdrop-blur-sm rounded-[64px] p-12 lg:p-24 border border-slate-200 overflow-hidden shadow-2xl min-h-[1000px]">

            {/* Dynamic Background SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* Connection Paths from Center to Branches */}
                {treeData.children?.map((branch, i) => {
                    const startX = 180;
                    const startY = 500; // Better center
                    const endX = 450;
                    const endY = 150 + (i * 180);
                    const branchColor = branch.color || "#cbd5e1";

                    return (
                        <g key={branch.id}>
                            <motion.path
                                d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                                stroke={branchColor}
                                strokeWidth="3"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.2 }}
                                transition={{ duration: 1.5, delay: i * 0.1, ease: "easeInOut" }}
                            />
                            {/* Inner glow path */}
                            <motion.path
                                d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                                stroke={branchColor}
                                strokeWidth="8"
                                fill="none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.03 }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                            />
                        </g>
                    );
                })}
            </svg>

            <div className="flex items-center gap-48 relative z-10 min-w-max h-full">

                {/* Central Hub */}
                <div className="flex flex-col items-center justify-center min-h-[800px] shrink-0">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-20 flex flex-col items-center text-center space-y-8"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full scale-150" />
                            <div className="w-44 h-44 rounded-[56px] bg-slate-900 border border-slate-700 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:scale-105 group-hover:shadow-[0_40px_80px_-10px_rgba(0,0,0,0.7)]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-transparent to-transparent opacity-50" />
                                <Shield className="w-18 h-18 text-white relative z-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 max-w-[200px] leading-[1.1]">{estateName}</h2>
                            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm px-4 py-1.5 border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm">Settlement Neural Map</Badge>
                        </div>
                    </motion.div>
                </div>

                {/* The Vertical Tree Structure */}
                <div className="flex flex-col gap-24 py-12 justify-center">
                    {treeData.children?.map((branch, branchIdx) => (
                        <div key={branch.id} className="flex items-start gap-16 group/branch relative">

                            {/* Branch Node */}
                            <motion.div
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: branchIdx * 0.1, duration: 0.8 }}
                                className="relative flex flex-col items-center gap-5 z-20"
                            >
                                <div
                                    className="w-20 h-20 rounded-[28px] flex items-center justify-center text-white shadow-2xl relative z-20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 cursor-pointer border border-white/20"
                                    style={{
                                        backgroundColor: branch.color,
                                        boxShadow: `0 20px 40px -10px ${branch.color}55`
                                    }}
                                >
                                    {branch.icon && <branch.icon className="w-8 h-8" />}
                                </div>
                                <div className="text-center w-40">
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-900 block leading-tight">{branch.label}</h3>
                                    <div className="h-1 w-12 rounded-full mx-auto mt-2 opacity-30" style={{ backgroundColor: branch.color }} />
                                </div>
                            </motion.div>

                            {/* Branch Children (Vertical Stack) */}
                            <div className="flex flex-col gap-8 pt-2">
                                {branch.children?.map((child, childIdx) => (
                                    <div key={child.id} className="flex items-center gap-12 group/child relative">
                                        {/* Level 2 Node */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: branchIdx * 0.1 + childIdx * 0.05 }}
                                            className="group/node flex items-center gap-5 p-6 bg-white/80 backdrop-blur-md border border-slate-200 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-900 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 min-w-[300px] relative z-20"
                                        >
                                            {/* Level 2 Connector Line */}
                                            <div className="absolute -left-16 top-1/2 w-16 h-[2px] bg-slate-100" />

                                            <div className="w-3.5 h-3.5 rounded-full shadow-inner border-2 border-white" style={{ backgroundColor: branch.color }} />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-800 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{child.label}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-slate-900 group-hover:translate-x-1.5 transition-all duration-500" />
                                        </motion.div>

                                        {/* Level 3 Vertical Stack (Leaves) */}
                                        {child.children && (
                                            <div className="flex flex-col gap-3 relative">
                                                <div className="absolute -left-12 top-0 bottom-0 w-[2px] bg-slate-50" />
                                                {child.children.map((leaf, leafIdx) => (
                                                    <motion.div
                                                        key={leaf.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: branchIdx * 0.1 + childIdx * 0.05 + leafIdx * 0.03 }}
                                                        className="p-4 bg-white/40 border border-slate-100 rounded-2xl flex items-center gap-3 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 cursor-pointer group/leaf min-w-[200px] relative"
                                                    >
                                                        <div className="absolute -left-12 top-1/2 w-12 h-[1.5px] bg-slate-50" />
                                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover/leaf:bg-slate-400 transition-colors" />
                                                        <span className="text-[11px] font-bold text-slate-400 group-hover/leaf:text-slate-900 tracking-tight leading-none">{leaf.label}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
