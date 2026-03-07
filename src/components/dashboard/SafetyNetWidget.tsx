import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
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

interface StaleAsset extends Asset {
  daysSinceLastContact: number;
}

export function SafetyNetWidget({ assets, onNavigate }: SafetyNetWidgetProps) {
  const navigate = useNavigate();
  const STUCK_THRESHOLD_DAYS = 14;

  const staleAssets: StaleAsset[] = assets
    .map((asset) => {
      const status = asset.status?.toLowerCase() || "";
      if (status === "closed" || status === "distributed") return null;

      const lastDate = asset.lastContactDate ? new Date(asset.lastContactDate) : null;
      if (!lastDate) return null;

      const daysSinceLastContact = Math.ceil(
        (Date.now() - lastDate.getTime()) / (1000 * 3600 * 24)
      );

      if (daysSinceLastContact <= STUCK_THRESHOLD_DAYS) return null;

      return {
        ...asset,
        daysSinceLastContact,
      };
    })
    .filter((asset): asset is StaleAsset => !!asset)
    .sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact);

  if (staleAssets.length === 0) return null;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <CardTitle className="text-sm font-bold text-slate-900">Follow-Up Reminders</CardTitle>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {staleAssets.length} pending
        </span>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          These accounts have had no recent updates. A quick follow-up call or secure message can keep the case moving.
        </p>

        <div className="space-y-1.5">
          {staleAssets.slice(0, 3).map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{asset.institution}</p>
                <p className="text-[11px] text-slate-500">No update for {asset.daysSinceLastContact} days</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-white"
                onClick={() => onNavigate(asset.id)}
              >
                Review
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-[10px] uppercase font-black tracking-widest text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-xl"
          onClick={() => navigate("/assets")}
        >
          Open Asset Ledger
        </Button>
      </CardContent>
    </Card>
  );
}
