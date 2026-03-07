import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info, Loader2, Save } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { api, Liability } from "@/lib/api";

const defaultFormData: Partial<Liability> = {
  name: "",
  amount: undefined,
  status: "DISCOVERED",
  priority: "MEDIUM",
  priorityClass: "GENERAL_DEBTS"
};

export default function AddLiability() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Liability>>(defaultFormData);

  const { data: priorityOptions } = useQuery({
    queryKey: ["priorityOptions"],
    queryFn: api.getPriorityOptions
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Liability>) => api.createLiability(data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["liabilities"] }),
        queryClient.invalidateQueries({ queryKey: ["liabilityStations"] }),
        queryClient.invalidateQueries({ queryKey: ["solvency"] })
      ]);

      toast({
        title: "Liability Added",
        description: "The creditor record was added to your estate ledger."
      });
      navigate("/liabilities");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add liability. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const amount = Number(formData.amount);
    const name = formData.name?.trim();
    if (!name || Number.isNaN(amount) || amount <= 0) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide a creditor name and valid amount.",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      name,
      amount
    });
  };

  return (
    <DashboardLayout maxWidth="max-w-[960px]">
      <SEO
        title="Add Liability"
        description="Add a creditor claim, debt, or expense to the estate liabilities ledger."
      />

      <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 -mx-5 sm:-mx-7 -mt-5 sm:-mt-6 mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/liabilities")}
            className="h-8 px-3 text-[11px] font-bold text-slate-600"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Add Liability</h1>
        </div>
      </header>

      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount ?? ""}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setFormData({
                    ...formData,
                    amount: nextValue === "" ? undefined : Number(nextValue)
                  });
                }}
                className="h-10 text-xs border-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Liability["status"] })}
              >
                <SelectTrigger className="h-10 text-xs border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCOVERED" className="text-xs">Discovered</SelectItem>
                  <SelectItem value="NOTICE_SENT" className="text-xs">Notice Sent</SelectItem>
                  <SelectItem value="CLAIM_FILED" className="text-xs">Claim Filed</SelectItem>
                  <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
                  <SelectItem value="PAID" className="text-xs">Paid</SelectItem>
                  <SelectItem value="REJECTED" className="text-xs text-rose-500">Rejected</SelectItem>
                  <SelectItem value="DISPUTED" className="text-xs text-red-500">Disputed</SelectItem>
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
                    <p>Probate Code payment order determines which creditors must be paid first.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={formData.priorityClass}
              onValueChange={(value) => setFormData({ ...formData, priorityClass: value })}
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

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Creditor Address (Optional)</Label>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Street Address</Label>
              <Input
                placeholder="123 Main St"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-10 text-xs border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">City</Label>
                <Input
                  placeholder="City"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="h-10 text-xs border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">State</Label>
                <Input
                  placeholder="CA"
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className="h-10 text-xs border-slate-200"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Zip</Label>
                <Input
                  placeholder="12345"
                  value={formData.zip || ""}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="h-10 text-xs border-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description / Notes</Label>
            <Textarea
              placeholder="Optional details about this liability..."
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[100px] text-xs border-slate-200 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/liabilities")}
              className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 px-7 text-[10px] font-bold uppercase tracking-widest bg-slate-900 hover:bg-slate-800"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Record Liability
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

