
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Ban, Info, CheckCircle2 } from "lucide-react";

interface SubscriptionAuditProps {
    assetType: string;
}

export function SubscriptionAudit({ assetType }: SubscriptionAuditProps) {
    const isBank = assetType.toLowerCase().includes("bank") || assetType.toLowerCase().includes("checking") || assetType.toLowerCase().includes("savings");

    if (!isBank) return null;

    const standardDebits = [
        { name: "Streaming Services", action: "Check for Netflix, Hulu, Spotify." },
        { name: "Utilities", action: "Keep active until property sale, then stop." },
        { name: "Club Memberships", action: "Gyms, professional orgs, Costco." },
        { name: "Cloud Storage", action: "iCloud, Google One, Dropbox (DO NOT STOP YET - may contain digital assets)." }
    ];

    return (
        <Card className="border-slate-200 shadow-sm bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl text-red-600">
                        <Ban className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Subscription Audit</CardTitle>
                        <p className="text-xs text-slate-500 font-medium">Identify & Stop Recurring Debits</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-800 leading-tight">
                        Fiduciary Alert: Letting an estate account drain through unused subscriptions can be considered "Waste of Assets."
                    </p>
                </div>

                <div className="space-y-3">
                    {standardDebits.map((debit, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-900">{debit.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight">{debit.action}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <Button className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest gap-2">
                    <Info className="w-3.5 h-3.5" />
                    Audit Recent Statements
                </Button>
            </CardContent>
        </Card>
    );
}
