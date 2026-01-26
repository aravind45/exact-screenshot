import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, MessageSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Asset {
    id: string;
    institution: string;
    status: string;
    lastContactDate?: string | null;
}

interface SafetyNetWidgetProps {
    assets: Asset[];
    onNavigate: (assetId: string) => void;
}

export function SafetyNetWidget({ assets, onNavigate }: SafetyNetWidgetProps) {
    const STUCK_THRESHOLD_DAYS = 14;

    // Identify assets that are "stuck":
    // 1. Status is discoverd or contacted (not closed/distributed)
    // 2. Last contact was > 14 days ago OR never contacted but created > 14 days ago
    const stuckAssets = assets.filter(asset => {
        const status = asset.status?.toLowerCase() || "";
        if (status === "closed" || status === "distributed") return false;

        const lastDate = asset.lastContactDate ? new Date(asset.lastContactDate) : null;
        if (!lastDate) return false; // If never contacted, maybe it's just new. Simplified logic.

        const daysSince = Math.ceil((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        return daysSince > STUCK_THRESHOLD_DAYS;
    });

    if (stuckAssets.length === 0) return null;

    return (
        <Card className="bg-amber-50 border-amber-100 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-sm font-bold text-amber-900 uppercase tracking-wider">Safety Net Active</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-xs text-amber-800 font-medium">
                        {stuckAssets.length} asset{stuckAssets.length > 1 ? 's' : ''} haven't had activity in over 2 weeks.
                        Institutions often stall here.
                    </p>

                    <div className="space-y-2">
                        {stuckAssets.slice(0, 3).map(asset => (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200">
                                <span className="text-sm font-bold text-slate-700">{asset.institution}</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={() => onNavigate(asset.id)}
                                >
                                    Nudge
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
