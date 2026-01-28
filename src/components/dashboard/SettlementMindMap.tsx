
import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    ChevronRight,
    Circle,
    Gavel,
    Users,
    Landmark,
    Activity,
    Scale,
    CreditCard,
    ClipboardCheck,
    AlertTriangle,
    FileText,
    Clock,
    Briefcase,
    Zap
} from "lucide-react";

interface NodeData {
    id: string;
    label: string;
    color?: string;
    icon?: any;
    children?: NodeData[];
}

const SETTLEMENT_MASTER_TREE: NodeData = {
    id: "root",
    label: "Estate Settlement & Execution",
    icon: Shield,
    children: [
        {
            id: "entry",
            label: "Entry Conditions (Death Event)",
            color: "#D946EF", // Fuchsia
            icon: zap => <Zap className="w-4 h-4" />,
            children: [
                { id: "e1", label: "Death Certificate" },
                { id: "e2", label: "Will exists?" },
                { id: "e3", label: "Trust exists?" },
                { id: "e4", label: "Surviving spouse?" },
                { id: "e5", label: "Minor beneficiaries?" },
                { id: "e6", label: "State-specific rules" }
            ]
        },
        {
            id: "roles",
            label: "Role Identification",
            color: "#0EA5E9", // Sky
            icon: users => <Users className="w-4 h-4" />,
            children: [
                { id: "r1", label: "Executor (Will)" },
                { id: "r2", label: "Administrator (No Will / Intestate)" },
                { id: "r3", label: "Trustee (Living Trust)" },
                { id: "r4", label: "Surviving Spouse" },
                { id: "r5", label: "Guardian (if minors)" }
            ]
        },
        {
            id: "classification",
            label: "Asset Classification (Critical Fork)",
            color: "#06B6D4", // Cyan
            icon: landmark => <Landmark className="w-4 h-4" />,
            children: [
                {
                    id: "probate_assets",
                    label: "Probate Assets",
                    children: [
                        { id: "p1", label: "Sole-owned real estate" },
                        { id: "p2", label: "Sole bank accounts" },
                        { id: "p3", label: "Personal property" },
                        { id: "p4", label: "Business interests" },
                        { id: "p5", label: "Assets without beneficiary designation" }
                    ]
                },
                {
                    id: "non_probate_assets",
                    label: "Non-Probate Assets",
                    children: [
                        { id: "n1", label: "Joint tenancy property" },
                        { id: "n2", label: "Community property (state-specific)" },
                        { id: "n3", label: "Trust-held assets" },
                        { id: "n4", label: "POD / TOD accounts" },
                        { id: "n5", label: "Life insurance" },
                        { id: "n6", label: "Retirement accounts (IRA, 401k)" }
                    ]
                }
            ]
        },
        {
            id: "paths",
            label: "Process Paths",
            color: "#F97316", // Orange
            icon: gav => <Gavel className="w-4 h-4" />,
            children: [
                {
                    id: "probate_path",
                    label: "Probate Path",
                    children: [
                        { id: "pp1", label: "Petition to open probate" },
                        { id: "pp2", label: "Court appointment" },
                        { id: "pp3", label: "Notice to heirs & creditors" },
                        { id: "pp4", label: "Inventory & Appraisal" },
                        { id: "pp5", label: "Claims period" },
                        { id: "pp6", label: "Court approvals" },
                        { id: "pp7", label: "Final accounting" },
                        { id: "pp8", label: "Distribution" },
                        { id: "pp9", label: "Closing / Order" }
                    ]
                },
                {
                    id: "non_probate_path",
                    label: "Non-Probate Path",
                    children: [
                        { id: "np1", label: "Death affidavit" },
                        { id: "np2", label: "Direct beneficiary claims" },
                        { id: "np3", label: "Title transfer" },
                        { id: "np4", label: "Trust administration" },
                        { id: "np5", label: "Account nodalment (mostly)" }
                    ]
                }
            ]
        },
        {
            id: "special",
            label: "Special Procedures (Conditional Branches)",
            color: "#EAB308", // Yellow
            icon: star => <Zap className="w-4 h-4" />,
            children: [
                { id: "s1", label: "Small Estate Affidavit" },
                { id: "s2", label: "Spousal Petition" },
                { id: "s3", label: "Community Property Shortcut" },
                { id: "s4", label: "Out-of-state property (ancillary probate)" },
                { id: "s5", label: "Trust winding-up" },
                { id: "s6", label: "AB / Bypass trust" },
                { id: "s7", label: "Minor trust / child trust" }
            ]
        },
        {
            id: "ledger",
            label: "Financial Ledger (Always-On Track)",
            color: "#EF4444", // Red
            icon: dol => <CreditCard className="w-4 h-4" />,
            children: [
                {
                    id: "asset_ledger",
                    label: "Assets Ledger",
                    children: [
                        { id: "al1", label: "Cash" },
                        { id: "al2", label: "Investments" },
                        { id: "al3", label: "Real estate" },
                        { id: "al4", label: "Business" },
                        { id: "al5", label: "Personal property" }
                    ]
                },
                {
                    id: "liability_ledger",
                    label: "Liabilities Ledger",
                    children: [
                        { id: "ll1", label: "Creditors" },
                        { id: "ll2", label: "Mortgages" },
                        { id: "ll3", label: "Taxes" },
                        { id: "ll4", label: "Final expenses" },
                        { id: "ll5", label: "Legal & professional fees" }
                    ]
                }
            ]
        },
        {
            id: "taxes",
            label: "Tax Traps",
            color: "#8B5CF6", // Violet
            icon: tax => <FileText className="w-4 h-4" />,
            children: [
                { id: "t1", label: "Final 1040 (decedent)" },
                { id: "t2", label: "Estate 1041" },
                { id: "t3", label: "Trust tax returns" },
                { id: "t4", label: "Estate tax (large / high impact)" },
                { id: "t5", label: "State inheritance tax (if applicable)" }
            ]
        },
        {
            id: "distribution",
            label: "Distribution Logic",
            color: "#6366F1", // Indigo
            icon: log => <Scale className="w-4 h-4" />,
            children: [
                { id: "dl1", label: "Will-based distribution" },
                { id: "dl2", label: "Intestate succession rules" },
                { id: "dl3", label: "Trust instructions" },
                { id: "dl4", label: "Court-approved distribution" },
                { id: "dl5", label: "Receipts & releases" }
            ]
        },
        {
            id: "closures",
            label: "Closures",
            color: "#10B981", // Emerald
            icon: check => <ClipboardCheck className="w-4 h-4" />,
            children: [
                { id: "c1", label: "Final accounting" },
                { id: "c2", label: "Court discharge (if probate)" },
                { id: "c3", label: "Trust termination" },
                { id: "c4", label: "Record retention" },
                { id: "c5", label: "Executor/Trustee release" }
            ]
        },
        {
            id: "risks",
            label: "Exception & Risk Branches",
            color: "#78350F", // Brown
            icon: warn => <AlertTriangle className="w-4 h-4" />,
            children: [
                { id: "rk1", label: "Will contests" },
                { id: "rk2", label: "Creditor disputes" },
                { id: "rk3", label: "Family conflict" },
                { id: "rk4", label: "Missing assets" },
                { id: "rk5", label: "Executor liability" },
                { id: "rk6", label: "Fiduciary breach risk" }
            ]
        }
    ]
};

export function SettlementMindMap() {
    const [expandedBranches, setExpandedBranches] = useState<string[]>(["entry", "classification", "paths", "ledger"]); // Default expanded
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const toggleBranch = (id: string) => {
        setExpandedBranches(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const estateName = estate ? `${estate.deceasedFirstName}'s Estate` : "Estate Settlement";

    return (
        <div className="relative w-full bg-slate-50/20 rounded-[80px] p-8 lg:p-24 border border-slate-200 overflow-hidden shadow-2xl min-h-[1000px] transition-all duration-1000">

            {/* Dynamic Background Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-visible opacity-20">
                <AnimatePresence>
                    {SETTLEMENT_MASTER_TREE.children?.map((branch, i) => {
                        if (!expandedBranches.includes(branch.id)) return null;

                        const startY = 500;
                        const branchY = 100 + (i * 180);

                        return (
                            <motion.g
                                key={branch.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.path
                                    d={`M 180 ${startY} C 300 ${startY}, 300 ${branchY}, 450 ${branchY}`}
                                    stroke={branch.color}
                                    strokeWidth="3"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                />
                            </motion.g>
                        );
                    })}
                </AnimatePresence>
            </svg>

            <div className="flex items-start gap-48 relative z-10 min-w-max h-full">

                {/* Neural Center Hub */}
                <div className="sticky top-0 flex flex-col items-center justify-center min-h-[800px] shrink-0">
                    <motion.div
                        layout
                        className="flex flex-col items-center text-center space-y-10"
                    >
                        <div className="relative group cursor-pointer" onClick={() => setExpandedBranches(SETTLEMENT_MASTER_TREE.children?.map(c => c.id) || [])}>
                            <div className="absolute inset-0 bg-indigo-500/10 blur-[140px] rounded-full scale-150 group-hover:bg-indigo-500/20 transition-all duration-1000" />
                            <div className="w-56 h-56 rounded-[72px] bg-slate-950 border border-slate-800 shadow-[32px_64px_100px_-20px_rgba(0,0,0,0.7)] flex items-center justify-center relative overflow-hidden transition-all duration-700 hover:scale-105 active:scale-95">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-transparent to-transparent opacity-40 shrink-0" />
                                <Shield className="w-24 h-24 text-white relative z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-2xl shadow-xl border border-slate-200 z-20 group-hover:-translate-y-2 transition-transform">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">Neural Hub</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <motion.h2 layout className="text-4xl font-black tracking-tight text-slate-950 max-w-[320px] leading-[1.05]">{estateName}</motion.h2>
                            <div className="flex flex-col items-center gap-2">
                                <Badge variant="secondary" className="bg-slate-950 text-white border-none py-2 px-8 rounded-full text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl">Settlement Nexus</Badge>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{expandedBranches.length} Domains Explored</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Hierarchical Tracks */}
                <div className="flex flex-col gap-24 py-20 justify-center relative">
                    {SETTLEMENT_MASTER_TREE.children?.map((branch, branchIdx) => {
                        const isExpanded = expandedBranches.includes(branch.id);

                        return (
                            <motion.div
                                layout
                                key={branch.id}
                                className="flex items-start gap-12 group/branch relative"
                            >
                                {/* Branch Anchor Node */}
                                <motion.div
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: branchIdx * 0.03 }}
                                    className="flex flex-col items-center gap-4 shrink-0 transition-all duration-500"
                                >
                                    <div
                                        onClick={() => toggleBranch(branch.id)}
                                        className={cn(
                                            "w-28 h-28 rounded-[40px] flex items-center justify-center text-white shadow-3xl border border-white/20 transition-all duration-700 cursor-pointer relative z-40 group-hover:scale-110",
                                            !isExpanded && "grayscale-50 brightness-75 scale-90"
                                        )}
                                        style={{
                                            backgroundColor: branch.color,
                                            boxShadow: isExpanded ? `0 32px 64px -12px ${branch.color}66` : 'none'
                                        }}
                                    >
                                        {branch.icon && branch.icon()}
                                        {!isExpanded && (
                                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-black shadow-xl border border-slate-100">
                                                {branch.children?.length}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center w-48 transition-opacity duration-500">
                                        <h3 className={cn("text-[13px] font-black uppercase tracking-[0.15em] leading-tight transition-colors", isExpanded ? "text-slate-950" : "text-slate-400")}>{branch.label}</h3>
                                        {isExpanded && <div className="h-1.5 w-16 rounded-full mx-auto mt-3 opacity-30 shadow-sm" style={{ backgroundColor: branch.color }} />}
                                    </div>
                                </motion.div>

                                {/* Collapsible Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            key={`${branch.id}-content`}
                                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="flex flex-col gap-8 pr-12"
                                        >
                                            {branch.children?.map((child, childIdx) => (
                                                <div key={child.id} className="flex items-start gap-12 group/child relative">
                                                    {/* Sub-Branch Connector to Anchor */}
                                                    <div className="absolute -left-12 top-1/2 w-12 h-[2.5px] bg-slate-100/80 -z-10" />

                                                    {/* Level 2 Card */}
                                                    <motion.div
                                                        layout
                                                        className="bg-white/95 backdrop-blur-sm border border-slate-200 p-8 rounded-[48px] shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.12)] hover:border-slate-800 transition-all duration-700 min-w-[380px] relative z-30"
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-4 h-4 rounded-full border-4 border-white shadow-md ring-1 ring-slate-100" style={{ backgroundColor: branch.color }} />
                                                            <span className="text-[16px] font-black text-slate-900 uppercase tracking-tight leading-none">{child.label}</span>
                                                            <ChevronRight className="w-6 h-6 text-slate-200 ml-auto" />
                                                        </div>

                                                        {/* Leaf Nodes (Level 3) - Only if expanded? Let's keep these always visible for now if L2 is open */}
                                                        {child.children && (
                                                            <div className="mt-8 flex flex-col gap-3 relative pl-6 border-l-2 border-slate-50">
                                                                {child.children.map((leaf, leafIdx) => (
                                                                    <motion.div
                                                                        key={leaf.id}
                                                                        initial={{ opacity: 0, y: 5 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: childIdx * 0.05 + leafIdx * 0.02 }}
                                                                        className="group/leaf flex items-center gap-4 py-4 px-6 bg-slate-50/50 rounded-3xl hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative cursor-pointer group"
                                                                    >
                                                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-900 transition-colors" />
                                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter group-hover:text-slate-900">{leaf.label}</span>
                                                                        <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100" />
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Decorative Neural Grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05]">
                <pattern id="neuralPattern" width="120" height="120" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#0f172a" />
                    <path d="M 2 2 L 120 120" stroke="#0f172a" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#neuralPattern)" />
            </svg>
        </div>
    );
}
