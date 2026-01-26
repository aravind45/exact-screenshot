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

interface AssetValueTrackerProps {
    assetId: string;
    currentValue: number;
    dateOfDeathValue?: number;
}

export function AssetValueTracker({ assetId, currentValue, dateOfDeathValue }: AssetValueTrackerProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const [values, setValues] = useState({
        current: currentValue?.toString() || "",
        dod: dateOfDeathValue?.toString() || ""
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateAsset(assetId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
            queryClient.invalidateQueries({ queryKey: ["assets"] }); // Update global stats
            setIsEditing(false);
            toast({ title: "Values Updated", description: "Financial data saved." });
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

    if (isEditing) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Edit Asset Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Date of Death Value</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                value={values.dod}
                                onChange={(e) => setValues({ ...values, dod: e.target.value })}
                                className="pl-9"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Current Value</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                value={values.current}
                                onChange={(e) => setValues({ ...values, current: e.target.value })}
                                className="pl-9"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Value Tracker</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-xs">
                    Edit
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(current)}
                        </div>
                        <p className="text-xs text-slate-500">Current Value</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                            <div className="text-sm font-semibold text-slate-700">
                                {dod > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dod) : "Not Set"}
                            </div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Date of Death Value</p>
                        </div>

                        {dod > 0 && (
                            <div className={cn(
                                "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full",
                                isGain ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                                {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(gainLoss).toFixed(1)}%
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
