import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, Liability } from "@/lib/api";
import { Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AddLiabilityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddLiabilityDialog({ open, onOpenChange }: AddLiabilityDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<Liability>>({
        name: "",
        amount: 0,
        status: "DISCOVERED",
        priority: "MEDIUM",
        priorityClass: "GENERAL_DEBTS"
    });

    const { data: priorityOptions } = useQuery({
        queryKey: ["priorityOptions"],
        queryFn: api.getPriorityOptions,
        enabled: open
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Liability>) => api.createLiability(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
            onOpenChange(false);
            setFormData({
                name: "",
                amount: 0,
                status: "DISCOVERED",
                priority: "MEDIUM",
                priorityClass: "GENERAL_DEBTS"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Add Liability</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">Record a new debt, claim, or expense for the estate.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Creditor Name</Label>
                        <Input
                            placeholder="e.g. Chase Bank, IRS, Funeral Home"
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-10 text-xs border-slate-200"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.amount || ""}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                className="h-10 text-xs border-slate-200"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                            >
                                <SelectTrigger className="h-10 text-xs border-slate-200">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DISCOVERED" className="text-xs">Discovered</SelectItem>
                                    <SelectItem value="FILED" className="text-xs">Claim Filed</SelectItem>
                                    <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
                                    <SelectItem value="PAID" className="text-xs">Paid</SelectItem>
                                    <SelectItem value="REJECTED" className="text-xs text-rose-500">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Priority Class</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[200px] text-[10px] bg-slate-900 text-white border-none p-3 leading-relaxed">
                                        <p>Probate Code § 11420 establishes the order of payment. High priority debts must be paid before lower ones.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Select
                            value={formData.priorityClass}
                            onValueChange={(value) => setFormData({ ...formData, priorityClass: value as any })}
                        >
                            <SelectTrigger className="h-10 text-xs border-slate-200">
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorityOptions?.options?.map((option: any) => (
                                    <SelectItem key={option.classId} value={option.classId} className="text-xs">
                                        <div className="flex flex-col py-0.5">
                                            <span className="font-semibold">{option.rank}. {option.label}</span>
                                            <span className="text-[10px] text-muted-foreground leading-tight">{option.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {!priorityOptions && (
                                    <>
                                        <SelectItem value="ADMINISTRATION_EXPENSES" className="text-xs">1. Administration Expenses</SelectItem>
                                        <SelectItem value="MORTGAGES_SECURED" className="text-xs">2. Secured Debts (Mortgages)</SelectItem>
                                        <SelectItem value="FUNERAL_EXPENSES" className="text-xs">3. Funeral Expenses</SelectItem>
                                        <SelectItem value="MEDICAL_LAST_ILLNESS" className="text-xs">4. Last Illness Expenses</SelectItem>
                                        <SelectItem value="FAMILY_ALLOWANCE" className="text-xs">5. Family Allowance</SelectItem>
                                        <SelectItem value="WAGE_CLAIMS" className="text-xs">6. Wage Claims (to $2000)</SelectItem>
                                        <SelectItem value="GENERAL_DEBTS" className="text-xs">7. General Debts / Credit Cards</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description / Notes</Label>
                        <Textarea
                            placeholder="Optional details about this liability..."
                            value={formData.notes || ""}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="min-h-[80px] text-xs border-slate-200 resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 h-10 px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest h-10 px-8 shadow-lg shadow-slate-200"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Record Liability"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
