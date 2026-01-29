import { Card, CardContent } from "@/components/ui/card";
import { LiabilityStats } from "@/lib/api";
import { DollarSign, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export function LiabilityStatsWidget({ stats }: { stats: LiabilityStats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Debt</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                            ${(stats.total || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Claims</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats.openCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Off</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">
                            ${(stats.paid || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-indigo-600 text-white">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Creditors</p>
                        <p className="text-2xl font-black text-white mt-1">{stats.count}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                        <FileText className="w-6 h-6" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
