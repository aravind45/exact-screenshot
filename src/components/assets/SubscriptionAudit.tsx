
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Ban, Info, ChevronRight } from "lucide-react";

interface SubscriptionAuditProps {
    assetType: string;
}

export function SubscriptionAudit({ assetType }: SubscriptionAuditProps) {
    const isBank = assetType.toLowerCase().includes("bank") || assetType.toLowerCase().includes("checking") || assetType.toLowerCase().includes("savings");

    if (!isBank) return null;

    const standardDebits = [
        { name: "Services", sub: "Streaming, Apps, Software" },
        { name: "Utilities", sub: "Wait for property sale" },
        { name: "Membership", sub: "Gyms, Clubs, Retail" },
        { name: "Cloud", sub: "iCloud, Google, Dropbox" }
    ];

    return (
        <div className="card-elevated p-4 space-y-3 bg-white border-slate-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
                        <Ban className="w-4 h-4" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription Audit</h3>
                </div>
                <Badge variant="outline" className="text-[8px] bg-red-50/50 border-red-100 text-red-700 font-black h-4 px-1.5">Waste Prevention</Badge>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
                {standardDebits.map((debit, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100 group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-900 leading-tight">{debit.name}</p>
                                <p className="text-[9px] text-slate-500 font-medium leading-tight">{debit.sub}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-400" />
                    </div>
                ))}
            </div>

            <Button variant="ghost" className="w-full h-8 hover:bg-slate-100 text-[10px] font-bold text-slate-600 gap-2 rounded-lg">
                <Info className="w-3 h-3" />
                Audit Recent Statements
            </Button>
        </div>
    );
}
