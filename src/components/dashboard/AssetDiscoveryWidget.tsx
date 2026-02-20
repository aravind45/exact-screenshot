import { Search, ChevronRight, FileSearch, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Props {
  assetCount: number;
  estateCreatedAt?: string | null;
  className?: string;
}

/**
 * AssetDiscoveryWidget
 *
 * Shown prominently when:
 *   - The estate has fewer than 5 documented assets, OR
 *   - The estate is less than 30 days old
 *
 * Collapses / hides when the executor has ≥ 5 assets AND the estate is older than 30 days.
 * The purpose is to surface the "Asset Detective" feature right on the dashboard
 * so new executors don't miss it.
 */
export function AssetDiscoveryWidget({ assetCount, estateCreatedAt, className }: Props) {
  const navigate = useNavigate();

  const estateAgeDays = estateCreatedAt
    ? Math.floor((Date.now() - new Date(estateCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isNew = estateAgeDays < 30;
  const isSparse = assetCount < 5;

  // Once the estate is mature AND has enough assets, hide this widget
  if (!isNew && !isSparse) return null;

  const hints = [
    "Old bank accounts, forgotten 401(k)s, or unclaimed property?",
    "Upload any financial document and AI will extract assets instantly.",
    "Average estate has 8–12 assets — most executors miss 3+.",
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200/50",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-8 translate-x-8 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-4 pointer-events-none" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <FileSearch className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                  Asset Detective
                </p>
                {isSparse && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span className="text-[10px] font-bold text-amber-300">
                      Only {assetCount} asset{assetCount !== 1 ? "s" : ""} found — scan for more
                    </span>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-base font-black text-white mb-1 leading-snug">
              Find hidden assets automatically
            </h3>
            <p className="text-[12px] text-indigo-200 font-medium leading-relaxed mb-4">
              Upload bank statements, tax returns, or insurance documents.
              AI scans and extracts every asset automatically.
            </p>

            <div className="space-y-1.5 mb-4">
              {hints.map((hint, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0" />
                  <p className="text-[11px] text-indigo-200 font-medium leading-snug">{hint}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 bg-white text-indigo-700 hover:bg-indigo-50 font-black text-[11px] uppercase tracking-widest px-5 rounded-xl border-0 shadow-sm"
                onClick={() => navigate("/assets?tab=detective")}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Scan Now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-white hover:bg-white/10 font-bold text-[11px] px-4 rounded-xl"
                onClick={() => navigate("/assets")}
              >
                View Inventory
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
