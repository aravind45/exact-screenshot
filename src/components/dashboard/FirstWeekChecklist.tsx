import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  actionLabel: string;
  urgent?: boolean;
}

const FIRST_WEEK_ITEMS: ChecklistItem[] = [
  {
    id: "file_death_cert",
    label: "Locate the will & death certificate",
    description: "You'll need certified copies — order at least 10 from the funeral home or county clerk.",
    href: "/documents?focus=required-docs",
    actionLabel: "Upload Docs",
    urgent: true,
  },
  {
    id: "open_estate_account",
    label: "Open an estate bank account",
    description: "Never mix estate funds with personal funds. Take death certificate + letters to any bank.",
    href: "/add-asset?assetType=checking&category=financial&institution=Estate%20Checking%20Account",
    actionLabel: "Add Account",
    urgent: true,
  },
  {
    id: "list_assets",
    label: "List every asset you know about",
    description: "Real estate, bank accounts, investments, vehicles, valuables. Use Asset Detective to find hidden ones.",
    href: "/add-asset?category=financial",
    actionLabel: "Add Asset",
  },
  {
    id: "list_debts",
    label: "List known debts & bills",
    description: "Mortgage, credit cards, utilities. Don't pay anything yet — wait until the creditor period ends.",
    href: "/add-liability",
    actionLabel: "Add Liability",
  },
  {
    id: "notify_institutions",
    label: "Notify key institutions",
    description: "Social Security, pension plans, life insurance. Use the Letters page to track who you've contacted.",
    href: "/probate/letters",
    actionLabel: "Open Letters",
  },
];

interface Props {
  completedTaskIds: string[];
  className?: string;
}

export function FirstWeekChecklist({ completedTaskIds, className }: Props) {
  const navigate = useNavigate();
  const [localChecked, setLocalChecked] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const totalComplete = FIRST_WEEK_ITEMS.filter((item) => localChecked.has(item.id)).length;
  const allDone = totalComplete === FIRST_WEEK_ITEMS.length;

  if (allDone) return null; // hide once user has checked everything off

  return (
    <div className={cn("bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-indigo-50/30 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Your First Week</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {totalComplete}/{FIRST_WEEK_ITEMS.length} steps complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(totalComplete / FIRST_WEEK_ITEMS.length) * 100}%` }}
            />
          </div>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="divide-y divide-slate-50">
          {FIRST_WEEK_ITEMS.map((item) => {
            const checked = localChecked.has(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 group transition-colors",
                  checked ? "bg-slate-50/60" : "hover:bg-slate-50/30"
                )}
              >
                <button
                  className="mt-0.5 flex-shrink-0 focus:outline-none"
                  onClick={() =>
                    setLocalChecked((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                >
                  {checked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p
                      className={cn(
                        "text-xs font-bold leading-tight transition-colors",
                        checked ? "line-through text-slate-400" : "text-slate-900"
                      )}
                    >
                      {item.label}
                    </p>
                    {item.urgent && !checked && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                        Week 1
                      </span>
                    )}
                  </div>
                  {!checked && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                {!checked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 flex-shrink-0 rounded-xl border border-indigo-100/60"
                    onClick={() => navigate(item.href)}
                  >
                    {item.actionLabel} →
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
