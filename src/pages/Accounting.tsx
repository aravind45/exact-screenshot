import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
    FileText,
    ArrowLeft,
    Plus,
    CheckCircle2,
    AlertCircle,
    Info,
    History,
    PieChart,
    ChevronRight,
    Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Accounting() {
    const navigate = useNavigate();
    const [isWaiverEnabled, setIsWaiverEnabled] = useState(false);

    const { data: assetsData } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];
    const inventoryTotal = assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);

    // Mock data for Phase 3 logic demonstration
    const receipts = [
        { id: 1, date: "2024-01-15", desc: "Dividends - Apple Inc.", amount: 450.25, type: "Income" },
        { id: 2, date: "2024-02-01", desc: "Interest on Chase Savings", amount: 12.80, type: "Income" },
    ];

    const disbursements = [
        { id: 101, date: "2024-01-10", desc: "Court Filing Fee - Petition", amount: 435.00, type: "Court" },
        { id: 102, date: "2024-01-20", desc: "Legal Notice - Daily Journal", amount: 250.00, type: "Required" },
    ];

    const receiptsTotal = receipts.reduce((sum, r) => sum + r.amount, 0);
    const disbursementsTotal = disbursements.reduce((sum, d) => sum + d.amount, 0);

    // PC 1060 Logic: Charges must equal Credits
    const totalCharges = inventoryTotal + receiptsTotal; // Simplification (missing gains)
    const totalCredits = disbursementsTotal; // Simplification (missing losses/distributions/on hand)
    const propertyOnHand = totalCharges - disbursementsTotal;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-emerald-600 rounded-md">
                                    <Calculator className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estate Accounting</h1>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-bold">
                                    PC 1060 Compliant
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-sm max-w-2xl">
                                Detailed tracking of all inventory, receipts, and disbursements required for the
                                final petition of distribution.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant={isWaiverEnabled ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-10 text-[10px] font-black uppercase tracking-widest px-4 transition-all",
                                    isWaiverEnabled ? "bg-amber-500 hover:bg-amber-600 border-none" : "border-slate-200 bg-white"
                                )}
                                onClick={() => setIsWaiverEnabled(!isWaiverEnabled)}
                            >
                                {isWaiverEnabled ? "Waiver Active" : "Waiver of Accounting"}
                            </Button>
                            <Button className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-lg shadow-slate-200">
                                <Plus className="w-4 h-4 mr-2" /> Add Entry
                            </Button>
                        </div>
                    </header>

                    {isWaiverEnabled && (
                        <Card className="border-none shadow-md bg-amber-50 border-l-4 border-l-amber-500">
                            <CardContent className="p-4 flex gap-4">
                                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-amber-900">Accounting Waived</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        All beneficiaries have agreed to waive the formal accounting. You still need
                                        to report the *summary* of assets and disbursements, but detailed schedules
                                        are not required for the court filing.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary of Account PC 1060 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-white overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ArrowUpRight className="w-12 h-12 text-slate-900" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Charges</CardTitle>
                                <div className="text-2xl font-black text-slate-900">${totalCharges.toLocaleString()}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">Inventory Value</span>
                                        <span className="font-bold text-slate-700">${inventoryTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">Receipts</span>
                                        <span className="font-bold text-emerald-600">+${receiptsTotal.toLocaleString()}</span>
                                    </div>
                                    <Progress value={95} className="h-1 mt-4" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ArrowDownRight className="w-12 h-12 text-slate-900" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Credits</CardTitle>
                                <div className="text-2xl font-black text-slate-900">${disbursementsTotal.toLocaleString()}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">Disbursements</span>
                                        <span className="font-bold text-rose-600">-${disbursementsTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">Losses on Sale</span>
                                        <span className="font-bold text-slate-700">$0</span>
                                    </div>
                                    <Progress value={10} className="h-1 mt-4 bg-rose-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-emerald-100 bg-slate-900 text-white overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Property On Hand</CardTitle>
                                <div className="text-2xl font-black">${propertyOnHand.toLocaleString()}</div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[10px] text-slate-500 leading-relaxed italic mb-4">
                                    This is the amount remaining for final distribution to beneficiaries.
                                </p>
                                <Button variant="secondary" size="sm" className="w-full text-[10px] font-bold uppercase h-8" onClick={() => navigate("/probate/closing-statement")}>
                                    Ready to Close <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Schedules */}
                    <Tabs defaultValue="receipts" className="space-y-4">
                        <TabsList className="bg-slate-200/50 p-1 border-none rounded-lg h-auto">
                            <TabsTrigger value="receipts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md">
                                Receipts (Income)
                            </TabsTrigger>
                            <TabsTrigger value="disbursements" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md">
                                Disbursements (Bills)
                            </TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md">
                                Full History
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="receipts">
                            <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Schedule A: Receipts of Income</h3>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input className="w-full bg-white border border-slate-200 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Search receipts..." />
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {receipts.map((r) => (
                                        <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <Receipt className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{r.desc}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{r.date}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-emerald-600">+${r.amount.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                                {receipts.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <div className="text-xs font-bold uppercase">No receipts logged yet</div>
                                    </div>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="disbursements">
                            <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Schedule C: Disbursements</h3>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input className="w-full bg-white border border-slate-200 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Search disbursements..." />
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {disbursements.map((d) => (
                                        <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{d.desc}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{d.date}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-rose-600">-${d.amount.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
