import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiabilityStatsWidget } from "@/components/liabilities/LiabilityStatsWidget";
import { LiabilityList } from "@/components/liabilities/LiabilityList";
import { AddLiabilityDialog } from "@/components/liabilities/AddLiabilityDialog";

export default function Liabilities() {
    const navigate = useNavigate();
    const [showAddDialog, setShowAddDialog] = useState(false);

    const { data: stats } = useQuery({
        queryKey: ["liabilityStations"],
        queryFn: api.getLiabilityStats
    });

    const { data: liabilities = [], isLoading } = useQuery({
        queryKey: ["liabilities"],
        queryFn: api.getLiabilities
    });

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Liabilities & Creditors</h1>
                                <p className="text-slate-500 mt-1">Track estate debts, manage creditor claims, and record payments.</p>
                            </div>
                            <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">
                                <Plus className="w-5 h-5 mr-2" /> Add Liability
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && <LiabilityStatsWidget stats={stats} />}

                    {/* List */}
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm font-medium text-slate-400 mt-4">Loading liabilities...</p>
                        </div>
                    ) : (
                        <LiabilityList liabilities={liabilities} />
                    )}
                </div>
            </main>

            <AddLiabilityDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />
        </div>
    );
}
