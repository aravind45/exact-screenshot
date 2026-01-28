import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";


interface AssetValueTrackerProps {
    assetId: string;
    currentValue: number;
    dateOfDeathValue?: number;
    assetType?: string;
    onSuccess?: () => void;
}

export function AssetValueTracker({ assetId, currentValue, dateOfDeathValue, assetType, onSuccess }: AssetValueTrackerProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);

    // Valuation Assistant State
    const [calc, setCalc] = useState({ high: "", low: "" });

    const [values, setValues] = useState({
        current: currentValue?.toString() || "",
        dod: dateOfDeathValue?.toString() || ""
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateAsset(assetId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            setIsEditing(false);
            if (onSuccess) onSuccess();
            toast({ title: "Value Verified", description: "Financial audit trail updated." });
        }
    });

    const current = parseFloat(values.current) || 0;
    const dod = parseFloat(values.dod) || 0;

    const gainLoss = dod > 0 ? ((current - dod) / dod) * 100 : 0;
    const isGain = gainLoss >= 0;

    const handleSave = () => {
        updateMutation.mutate({
            value: values.current,
            dateOfDeathValue: values.dod
        });
    };

    const applyCalculatedDod = () => {
        const h = parseFloat(calc.high) || 0;
        const l = parseFloat(calc.low) || 0;
        if (h > 0 && l > 0) {
            const avg = (h + l) / 2;
            setValues(prev => ({ ...prev, dod: avg.toFixed(2) }));
            setShowAssistant(false);
            toast({ title: "Average Calculated", description: "Standard high/low average applied to DOD value." });
        }
    };

    if (isEditing) {
        return (
            <Card className="border-2 border-primary/20 shadow-xl rounded-[32px] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Inventory Valuation</CardTitle>
                            <p className="text-xs text-slate-500 font-medium leading-none mt-1">Verify financial standing as of date of death</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-full h-8 w-8 p-0">
                            <TrendingDown className="w-4 h-4 rotate-45" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">Date of Death (DOD) Value</Label>
                                <Button
                                    variant="link"
                                    className="h-auto p-0 text-[10px] font-black text-primary uppercase"
                                    onClick={() => setShowAssistant(!showAssistant)}
                                >
                                    {showAssistant ? "Hide Assistant" : "Need help calculating?"}
                                </Button>
                            </div>

                            {showAssistant && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 mb-4"
                                >
                                    <p className="text-[10px] font-bold text-blue-700 leading-tight">
                                        IRS Rule: Use the average of the High and Low price on the Date of Death.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] uppercase font-black text-slate-400">High Price</Label>
                                            <Input
                                                value={calc.high}
                                                onChange={(e) => setCalc({ ...calc, high: e.target.value })}
                                                className="h-8 text-xs bg-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] uppercase font-black text-slate-400">Low Price</Label>
                                            <Input
                                                value={calc.low}
                                                onChange={(e) => setCalc({ ...calc, low: e.target.value })}
                                                className="h-8 text-xs bg-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={applyCalculatedDod}
                                        className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase"
                                        disabled={!calc.high || !calc.low}
                                    >
                                        Apply Average
                                    </Button>
                                </motion.div>
                            )}

                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400 font-bold" />
                                <Input
                                    value={values.dod}
                                    onChange={(e) => setValues({ ...values, dod: e.target.value })}
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">Current Market Value</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    value={values.current}
                                    onChange={(e) => setValues({ ...values, current: e.target.value })}
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-xs shadow-lg shadow-slate-200"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? "Validating..." : "Confirm & Save"}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl border-slate-200 text-slate-500 font-bold text-xs"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-[32px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valuation Ledger</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter text-slate-500 hover:bg-white hover:text-primary transition-all">
                    Update Market Data
                </Button>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <div className="text-3xl font-black tracking-tighter text-slate-900 mb-1">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(current)}
                        </div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Current Market Value</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                        <div>
                            <div className="text-sm font-black text-slate-900">
                                {dod > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dod) : "Not Set"}
                            </div>
                            <p className="text-[9px] uppercase font-black text-slate-400 tracking-tighter leading-none mt-1">DOD Baseline</p>
                        </div>

                        {dod > 0 && (
                            <div className="flex flex-col items-end">
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full ring-1",
                                    isGain ? "bg-emerald-50 text-emerald-700 ring-emerald-100 " : "bg-rose-50 text-rose-700 ring-rose-100"
                                )}>
                                    {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(gainLoss).toFixed(1)}%
                                </div>
                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-tighter mt-1">Volatility</p>
                            </div>
                        )}
                    </div>

                    {!dod && (
                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-800 leading-tight italic">
                                ⚠️ DOD value is required for IRS tax baseline (Step-Up Basis).
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
