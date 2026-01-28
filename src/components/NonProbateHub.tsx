import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    FastForward,
    CheckCircle2,
    Link as LinkIcon,
    Shield,
    Heart,
    Users,
    Building2,
    ArrowRight,
    ExternalLink,
    Info,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NonProbateHub() {
    const { data: assetsData } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];

    // Non-probate assets bypass the court process
    const nonProbateAssets = assets.filter(a =>
        a.ownershipType === "JOINT" ||
        a.ownershipType === "BENEFICIARY" ||
        a.ownershipType === "TRUST"
    );

    const categories = [
        { id: "beneficiary", label: "Named Beneficiaries", icon: Heart, color: "text-rose-600", bg: "bg-rose-50", desc: "Life Insurance, POD & TOD accounts." },
        { id: "joint", label: "Joint Ownership", icon: Users, color: "text-blue-600", bg: "bg-blue-50", desc: "Accounts or real estate held jointly." },
        { id: "trust", label: "Living Trusts", icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Assets already titled in a trust." }
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-green-600 rounded-md">
                            <FastForward className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Non-Probate "Fast Track"</h1>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold">
                            Direct Transfer
                        </Badge>
                    </div>
                    <p className="text-slate-500 text-sm max-w-2xl">
                        These assets bypass court probate entirely. You deal directly with the institutions or joint owners
                        to transfer ownership.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold uppercase tracking-tight">
                        <Info className="w-3.5 h-3.5 mr-2" /> How to Claim
                    </Button>
                </div>
            </header>

            {/* Category Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => (
                    <Card key={cat.id} className="border-none shadow-md shadow-slate-200/50 bg-white">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn("p-2 rounded-lg", cat.bg)}>
                                <cat.icon className={cn("w-5 h-5", cat.color)} />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tight">{cat.label}</div>
                                <div className="text-sm font-bold text-slate-900">
                                    {assets.filter(a => {
                                        if (cat.id === 'beneficiary') return a.ownershipType === 'BENEFICIARY';
                                        if (cat.id === 'joint') return a.ownershipType === 'JOINT';
                                        if (cat.id === 'trust') return a.ownershipType === 'TRUST';
                                        return false;
                                    }).length} Assets
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active Transfers List */}
                <Card className="lg:col-span-8 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-600">Active Direct Transfers</CardTitle>
                            <Badge variant="secondary" className="bg-slate-900 text-white text-[9px]">
                                {nonProbateAssets.length} ASSETS TOTAL
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 min-h-[400px]">
                        {nonProbateAssets.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {nonProbateAssets.map((asset) => (
                                    <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                                asset.ownershipType === 'BENEFICIARY' ? "bg-rose-50 text-rose-600" :
                                                    asset.ownershipType === 'JOINT' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                                            )}>
                                                {asset.ownershipType === 'BENEFICIARY' ? <Heart className="w-5 h-5" /> :
                                                    asset.ownershipType === 'JOINT' ? <Users className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{asset.institution}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="px-1 py-0 text-[8px] font-bold uppercase border-slate-200 text-slate-500">
                                                        {asset.assetType?.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-400 font-medium">• {asset.ownershipType}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-900">
                                                    ${(parseFloat(asset.value) || 0).toLocaleString()}
                                                </div>
                                                <div className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Probate Exempt</div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <ArrowRight className="w-4 h-4 text-slate-300" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <Search className="w-12 h-12 text-slate-200 mb-4" />
                                <h3 className="text-sm font-bold text-slate-900 mb-1">No non-probate assets</h3>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    All your tracked assets appear to require full probate or a small estate affidavit.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Claiming Instructions */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white">
                        <CardHeader className="pb-2 border-b border-slate-800">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-400">Claim Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold">Death Certificate</div>
                                        <p className="text-[10px] text-slate-500 mt-1">Required for every institution (certified copy).</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold">Claim Forms</div>
                                        <p className="text-[10px] text-slate-500 mt-1">Each bank has their own specific forms to sign.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold">Affidavit of Domicile</div>
                                        <p className="text-[10px] text-slate-500 mt-1">Often required by brokerages to confirm CA residency.</p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-[10px] font-bold h-8 uppercase tracking-wider">
                                View Full Guide
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <h4 className="text-xs font-bold text-slate-900">Institution Links</h4>
                            </div>
                            <div className="space-y-2">
                                <a href="https://www.fidelity.com/customer-service/how-to-claim-inherited-assets" target="_blank" className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-blue-50 transition-colors">
                                    <span className="text-[10px] font-bold text-slate-700">Fidelity Claims</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                                <a href="https://www.vanguard.com/service/inherited-accounts/index.html" target="_blank" className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-blue-50 transition-colors">
                                    <span className="text-[10px] font-bold text-slate-700">Vanguard Inherited</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
