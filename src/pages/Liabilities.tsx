import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiabilityStatsWidget } from "@/components/liabilities/LiabilityStatsWidget";
import { LiabilityList } from "@/components/liabilities/LiabilityList";
import { SolvencyTracker } from "@/components/liabilities/SolvencyTracker";
import { ClaimsPriorityEngine } from "@/components/liabilities/ClaimsPriorityEngine";
import { SEO } from "@/components/SEO";

export default function Liabilities() {
    const navigate = useNavigate();

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const isViewer = (estate as any)?.userRole === 'VIEWER';

    const { data: stats } = useQuery({
        queryKey: ["liabilityStations"],
        queryFn: api.getLiabilityStats
    });

    const { data: liabilities = [], isLoading } = useQuery({
        queryKey: ["liabilities"],
        queryFn: api.getLiabilities
    });

    const { data: solvency, isLoading: solvencyLoading } = useQuery({
        queryKey: ["solvency"],
        queryFn: api.getSolvency
    });

    const { data: priorityOptions } = useQuery({
        queryKey: ["priorityOptions"],
        queryFn: api.getPriorityOptions
    });

    // Derived stats from real data (no hardcoded values)
    const liabilitiesArray = Array.isArray(liabilities) ? liabilities as any[] : [];
    const paidCount = liabilitiesArray.filter((l: any) => l.status === 'PAID').length;
    const pendingCount = liabilitiesArray.filter((l: any) => l.status !== 'PAID').length;
    const overdueCount = liabilitiesArray.filter((l: any) => {
        if (!l.dueDate || l.status === 'PAID') return false;
        return new Date(l.dueDate) < new Date();
    }).length;

    return (
        <DashboardLayout maxWidth="max-w-[1200px]">
            <SEO
                title="Liabilities & Creditors"
                description="Manage estate debts and creditor claims. Ensure legal payment priority and track solvency to prevent executor liability."
            />

            {/* ── Compact Sticky Header ──────────────────────────────── */}
            <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-12 flex items-center justify-between sticky top-0 z-10 -mx-6 -mt-6 mb-6 pt-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Liabilities & Creditors</h1>
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:block">Debt Ledger</p>

                    {/* Dynamic summary chips — derived from real data */}
                    {liabilitiesArray.length > 0 && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-600 border border-slate-200">
                                <span>{liabilitiesArray.length} total</span>
                            </div>
                            {pendingCount > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[10px] font-black text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    <span>{pendingCount} pending</span>
                                </div>
                            )}
                            {overdueCount > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-[10px] font-black text-rose-700 border border-rose-200">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{overdueCount} overdue</span>
                                </div>
                            )}
                            {paidCount > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{paidCount} paid</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {!isViewer && (
                    <Button
                        onClick={() => navigate("/add-liability")}
                        className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl px-5 text-[11px] gap-1.5 shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Liability
                    </Button>
                )}
            </header>

            <div className="space-y-6">
                {/* Stats Widget */}
                {stats && <LiabilityStatsWidget stats={stats} />}

                {/* Solvency + Priority — side-by-side, space-conscious */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {solvency && (
                        <SolvencyTracker solvency={solvency} isLoading={solvencyLoading} />
                    )}
                    {stats && (
                        <ClaimsPriorityEngine
                            stats={stats}
                            solvency={solvency}
                            isLoading={isLoading}
                            priorityOptions={priorityOptions?.options}
                        />
                    )}
                </div>

                {/* Liability List */}
                {isLoading ? (
                    <div className="space-y-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-16 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <LiabilityList
                        liabilities={liabilities}
                        priorityOptions={priorityOptions?.options}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}


