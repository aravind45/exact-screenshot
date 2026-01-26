import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, DollarSign, Wallet, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
    id: string;
    value?: number;
    category?: string;
    assetType?: string;
}

interface FinancialHealthWidgetProps {
    assets: Asset[];
}

export function FinancialHealthWidget({ assets }: FinancialHealthWidgetProps) {
    // Helper to determine if an asset is a debt
    const isDebt = (asset: Asset) => {
        const type = asset.assetType?.toLowerCase() || "";
        const category = asset.category?.toLowerCase() || "";
        return type.includes("mortgage") ||
            type.includes("loan") ||
            type.includes("debt") ||
            type.includes("credit") ||
            category === "liability" ||
            category === "debt";
    };

    const totalAssets = assets
        .filter(a => !isDebt(a))
        .reduce((sum, a) => sum + (a.value || 0), 0);

    const totalDebts = assets
        .filter(a => isDebt(a))
        .reduce((sum, a) => sum + (a.value || 0), 0);

    const netValue = totalAssets - totalDebts;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);

    return (
        <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Financial Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Net Value (Big) */}
                    <div className="md:col-span-3 pb-6 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Wallet className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">Net Estate Value</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(netValue)}
                        </div>
                    </div>

                    {/* Assets */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Assets</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {formatCurrency(totalAssets)}
                        </div>
                        <p className="text-[10px] text-slate-400">Cash, Property, Investments</p>
                    </div>

                    {/* Debts */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                            <ArrowDownLeft className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Debts</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {formatCurrency(totalDebts)}
                        </div>
                        <p className="text-[10px] text-slate-400">Mortgages, Loans, Credit</p>
                    </div>

                    {/* Solvency Ratio */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Solvency</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {totalDebts === 0 ? "100%" : `${Math.min(100, Math.round((totalAssets / (totalAssets + totalDebts)) * 100))}%`}
                        </div>
                        <p className="text-[10px] text-slate-400">Asset to Liability Ratio</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
