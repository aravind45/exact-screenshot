import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  actionLabel: string;
  urgent?: boolean;
  isComplete: (ctx: ChecklistContext) => boolean;
}

interface ChecklistContext {
  completedTaskIdSet: Set<string>;
  hasWillDoc: boolean;
  hasDeathCertDoc: boolean;
  hasEstateAccount: boolean;
  hasAssets: boolean;
  hasLiabilities: boolean;
  hasInstitutionNoticeDoc: boolean;
}

const FIRST_WEEK_ITEMS: ChecklistItem[] = [
  {
    id: "file_death_cert",
    label: "Locate the will & death certificate",
    description: "You'll need certified copies — order at least 10 from the funeral home or county clerk.",
    href: "/documents?focus=required-docs",
    actionLabel: "Upload Docs",
    urgent: true,
    isComplete: (ctx) =>
      ctx.completedTaskIdSet.has("locate_will") ||
      ctx.completedTaskIdSet.has("locate_docs_no_will") ||
      (ctx.hasDeathCertDoc && (ctx.hasWillDoc || ctx.completedTaskIdSet.has("locate_docs_no_will"))),
  },
  {
    id: "open_estate_account",
    label: "Open an estate bank account",
    description: "Never mix estate funds with personal funds. Take death certificate + letters to any bank.",
    href: "/add-asset?assetType=checking&category=financial&institution=Estate%20Checking%20Account",
    actionLabel: "Add Account",
    urgent: true,
    isComplete: (ctx) => ctx.completedTaskIdSet.has("open_estate_account") || ctx.hasEstateAccount,
  },
  {
    id: "list_assets",
    label: "List every asset you know about",
    description: "Real estate, bank accounts, investments, vehicles, valuables. Use Asset Detective to find hidden ones.",
    href: "/add-asset?category=financial",
    actionLabel: "Add Asset",
    isComplete: (ctx) =>
      ctx.hasAssets ||
      ctx.completedTaskIdSet.has("preliminary_asset_scan") ||
      ctx.completedTaskIdSet.has("inventory_assets") ||
      ctx.completedTaskIdSet.has("complete_inventory"),
  },
  {
    id: "list_debts",
    label: "List known debts & bills",
    description: "Mortgage, credit cards, utilities. Don't pay anything yet — wait until the creditor period ends.",
    href: "/add-liability",
    actionLabel: "Add Liability",
    isComplete: (ctx) =>
      ctx.hasLiabilities ||
      ctx.completedTaskIdSet.has("pay_immediate_bills") ||
      ctx.completedTaskIdSet.has("review_claims"),
  },
  {
    id: "notify_institutions",
    label: "Notify key institutions",
    description: "Social Security, pension plans, life insurance. Use the Letters page to track who you've contacted.",
    href: "/probate/letters",
    actionLabel: "Open Letters",
    isComplete: (ctx) =>
      ctx.completedTaskIdSet.has("notify_ssa") ||
      ctx.completedTaskIdSet.has("mail_notice") ||
      ctx.completedTaskIdSet.has("prepare_required_notices_and_waivers") ||
      ctx.hasInstitutionNoticeDoc,
  },
];

interface Props {
  completedTaskIds: string[];
  className?: string;
}

function normalize(value: unknown): string {
  return String(value || "").toUpperCase();
}

function isLikelyEstateAccount(asset: any): boolean {
  const text = `${asset?.institution || ""} ${asset?.name || ""} ${asset?.assetType || ""} ${asset?.category || ""}`.toLowerCase();
  return text.includes("estate") && (text.includes("checking") || text.includes("bank") || text.includes("financial"));
}

export function FirstWeekChecklist({ completedTaskIds, className }: Props) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: api.getAssets,
  });

  const { data: liabilities = [] } = useQuery({
    queryKey: ["liabilities"],
    queryFn: api.getLiabilities,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["estate-documents"],
    queryFn: api.getEstateDocuments,
  });

  const checklistContext = useMemo<ChecklistContext>(() => {
    const completedTaskIdSet = new Set(completedTaskIds || []);

    const hasWillDoc = (documents as any[]).some((doc) => {
      const text = `${normalize(doc?.documentType)} ${normalize(doc?.name)}`;
      return text.includes("WILL") || text.includes("TESTAMENT");
    });

    const hasDeathCertDoc = (documents as any[]).some((doc) => {
      const text = `${normalize(doc?.documentType)} ${normalize(doc?.name)}`;
      return text.includes("DEATH_CERT") || text.includes("DEATH CERTIFICATE");
    });

    const hasInstitutionNoticeDoc = (documents as any[]).some((doc) => {
      const text = `${normalize(doc?.documentType)} ${normalize(doc?.name)}`;
      return text.includes("SSA") || text.includes("NOTICE") || text.includes("LETTER") || text.includes("CREDITOR");
    });

    return {
      completedTaskIdSet,
      hasWillDoc,
      hasDeathCertDoc,
      hasEstateAccount: (assets as any[]).some((asset) => isLikelyEstateAccount(asset)),
      hasAssets: (assets as any[]).length > 0,
      hasLiabilities: (liabilities as any[]).length > 0,
      hasInstitutionNoticeDoc,
    };
  }, [assets, liabilities, documents, completedTaskIds]);

  const completionByItemId = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const item of FIRST_WEEK_ITEMS) {
      result[item.id] = item.isComplete(checklistContext);
    }
    return result;
  }, [checklistContext]);

  const totalComplete = FIRST_WEEK_ITEMS.filter((item) => completionByItemId[item.id]).length;
  const allDone = totalComplete === FIRST_WEEK_ITEMS.length;

  if (allDone) return null;

  return (
    <div className={cn("bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden", className)}>
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

      {!collapsed && (
        <div className="divide-y divide-slate-50">
          {FIRST_WEEK_ITEMS.map((item) => {
            const checked = completionByItemId[item.id];
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 group transition-colors",
                  checked ? "bg-slate-50/60" : "hover:bg-slate-50/30"
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {checked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  )}
                </div>

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
                    {item.actionLabel}
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

