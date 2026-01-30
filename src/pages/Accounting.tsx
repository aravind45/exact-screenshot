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

    // Fetch Real Data
    const { data: assetsData = [] } = useQuery({ queryKey: ["assets"], queryFn: api.getAssets });
    const { data: liabilitiesData = [] } = useQuery({ queryKey: ["liabilities"], queryFn: api.getLiabilities });

    // Calculate Financials - LOGIC SIMPLIFIED FOR PROTOTYPE
    // In a real app, "Receipts" are income events vs "Inventory" which is assets at DoD.
    // Here we treat all Assets as "Charges" (Inventory) for now.

    const assets = Array.isArray(assetsData) ? assetsData : [];
    const liabilities = Array.isArray(liabilitiesData) ? liabilitiesData : [];

    const inventoryTotal = assets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);

    // Expenses (Paid Liabilities)
    const paidLiabilities = liabilities.filter((l: any) => l.status === 'PAID');
    const unpaidLiabilities = liabilities.filter((l: any) => l.status !== 'PAID');

    const disbursementsTotal = paidLiabilities.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);
    const estimatedDebts = unpaidLiabilities.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);

    // PC 1060 Logic: Charges must equal Credits
    const totalCharges = inventoryTotal; // + Receipts (Todo) + Gains (Todo)
    const totalCredits = disbursementsTotal; // + Losses (Todo) + Distributions (Todo) // + Property On Hand
    const propertyOnHand = totalCharges - disbursementsTotal;

    const solvencyRatio = estimatedDebts > 0 ? (propertyOnHand / estimatedDebts) * 100 : 100;

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
                                    Probate Code § 1060
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-sm max-w-2xl">
                                Financial command center. Track inventory value, debts paid, and net property on hand for distribution.
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
                                <FileText className="w-4 h-4 mr-2" /> Export Report
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

                    {/* Financial KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
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
                                        <span className="text-slate-500">Receipts (Income)</span>
                                        <span className="font-bold text-emerald-600">+$0.00</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">Gains on Sales</span>
                                        <span className="font-bold text-emerald-600">+$0.00</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
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
                                        <span className="text-slate-500">Paid Debts/Expenses</span>
                                        <span className="font-bold text-rose-600">-${disbursementsTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">Open Debts (Est)</span>
                                        <span className="font-bold text-slate-400">${estimatedDebts.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-emerald-100 bg-slate-900 text-white overflow-hidden relative">
                            {/* Decorative Glow */}
                            <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Property On Hand</CardTitle>
                                <div className="text-3xl font-black text-white tracking-tight">${propertyOnHand.toLocaleString()}</div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                                    Calculated as <strong>Charges</strong> minus <strong>Credits</strong>. This is the distributable amount.
                                </p>
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-slate-300">Solvency Health</span>
                                        <span className={cn("text-[10px] font-bold", solvencyRatio >= 100 ? "text-emerald-400" : "text-amber-400")}>
                                            {solvencyRatio >= 100 ? "Solvent" : "Rick of Insolvency"}
                                        </span>
                                    </div>
                                    <Progress value={Math.min(solvencyRatio, 100)} className={cn("h-1.5", solvencyRatio >= 100 ? "bg-emerald-500" : "bg-amber-500")} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Schedules */}
                    <Tabs defaultValue="charges" className="space-y-4">
                        <TabsList className="bg-slate-200/50 p-1 border-none rounded-lg h-auto">
                            <TabsTrigger value="charges" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md">
                                Schedules A & B (Assets)
                            </TabsTrigger>
                            <TabsTrigger value="credits" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md">
                                Schedules C & D (Debts)
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="charges">
                            <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory & Receipts</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {assets.map((asset: any) => (
                                        <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{asset.name || asset.institution}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{asset.category || "General Asset"}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-emerald-600">+${(Number(asset.value) || 0).toFixed(2)}</div>
                                        </div>
                                    ))}
                                    {assets.length === 0 && (
                                        <div className="p-12 text-center text-slate-400">
                                            <div className="text-xs font-bold uppercase">No assets recorded</div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="credits">
                            <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disbursements (Paid Debts)</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {paidLiabilities.map((l: any) => (
                                        <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{l.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Paid on {l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-rose-600">-${(Number(l.amount) || 0).toFixed(2)}</div>
                                        </div>
                                    ))}
                                    {paidLiabilities.length === 0 && (
                                        <div className="p-12 text-center text-slate-400">
                                            <div className="text-xs font-bold uppercase">No paid liabilities yet</div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
