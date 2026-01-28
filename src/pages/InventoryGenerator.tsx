import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    User,
    Gavel,
    Download,
    Calculator,
    Info,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function InventoryGenerator() {
    const navigate = useNavigate();
    const { data: assetsData, isLoading: assetsLoading } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];

    // Attachment 1: Assets valued by the Personal Representative (Cash, bank accounts, etc.)
    const attachment1Assets = assets.filter(a =>
        a.assetType === "BANK_ACCOUNT" ||
        a.assetType === "CASH" ||
        a.assetType && a.assetType.toLowerCase().includes("checking") ||
        a.assetType && a.assetType.toLowerCase().includes("savings")
    );

    // Attachment 2: Assets valued by the Probate Referee (Real estate, stocks, vehicles, etc.)
    const attachment2Assets = assets.filter(a =>
        !attachment1Assets.includes(a)
    );

    const total1 = attachment1Assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
    const total2 = attachment2Assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Breadcrumbs/Back */}
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Legal Workflow
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 bg-white">
                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Sync Ledger
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-indigo-600 rounded-md">
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Appraisal (DE-160)</h1>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] font-bold tracking-widest px-2 py-0.5">
                                    Judicial Council Form
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-sm max-w-2xl">
                                California probate requires you to list all estate assets. Cash items are valued by you;
                                all other items are valued by a court-appointed **Probate Referee**.
                            </p>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-200">
                            <Download className="w-4 h-4 mr-2" /> Generate DE-160
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                        {/* Summary Cards */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Attachment 1 */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-indigo-600" />
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">Attachment 1: Executor Valued</h2>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-400 uppercase">Subtotal</div>
                                        <div className="text-lg font-black text-slate-900">${total1.toLocaleString()}</div>
                                    </div>
                                </div>

                                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                    <CardContent className="p-0">
                                        {attachment1Assets.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {attachment1Assets.map((asset) => (
                                                    <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                                                <Calculator className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900">{asset.institution || asset.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{asset.assetType?.replace('_', ' ')}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-black text-slate-900">${(parseFloat(asset.value) || 0).toLocaleString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center text-slate-400">
                                                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <div className="text-xs font-bold uppercase">No cash-type assets found</div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>

                            {/* Attachment 2 */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Gavel className="w-5 h-5 text-amber-600" />
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">Attachment 2: Referee Valued</h2>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-400 uppercase">Est. Fair Market Value</div>
                                        <div className="text-lg font-black text-slate-900">${total2.toLocaleString()}</div>
                                    </div>
                                </div>

                                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                    <CardContent className="p-0">
                                        {attachment2Assets.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {attachment2Assets.map((asset) => (
                                                    <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                                                <Search className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900">{asset.institution || asset.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{asset.assetType?.replace('_', ' ')}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-black text-slate-500 line-through decoration-slate-300 decoration-2 italic mr-2 text-[11px] opacity-40">
                                                            Pending Referral
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center text-slate-400">
                                                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <div className="text-xs font-bold uppercase">No non-cash assets found</div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>
                        </div>

                        {/* Sidebar Guidance */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-none shadow-xl bg-slate-900 text-white">
                                <CardHeader className="pb-2 border-b border-slate-800">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Referee Details</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
                                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">State Appointed Referee</div>
                                        <div className="text-sm font-bold">Pending Court Appointment</div>
                                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                            The court will assign a Referee for your county once you file the Petition for Probate.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-[11px] font-bold">Fixed Fee</div>
                                                <p className="text-[10px] text-slate-500 mt-1">Referees charge 0.1% of the total assets on Attachment 2.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-[11px] font-bold">Timeline</div>
                                                <p className="text-[10px] text-slate-500 mt-1">Expect 2-4 weeks for the Referee to return appraisals.</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-slate-500">Pro Tip</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                        "You must file the Inventory & Appraisal within **4 months** of your appointment as Personal Representative.
                                        Don't wait—Referral valuations often take longer than expected."
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
