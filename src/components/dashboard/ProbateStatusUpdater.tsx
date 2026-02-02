
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Edit } from "lucide-react";

interface ProbateStatusUpdaterProps {
    currentStatus: string;
    currentCaseNumber?: string;
}

const STATUS_OPTIONS = [
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "PETITION_FILED", label: "Petition Filed" },
    { value: "HEARING_SCHEDULED", label: "Hearing Scheduled" },
    { value: "EXECUTOR_APPOINTED", label: "Letters Testamentary Issued" }, // Matches test text
    { value: "INVENTORY_FILED", label: "Inventory Filed" },
    { value: "CREDITOR_PERIOD_ACTIVE", label: "Creditor Period Active" },
    { value: "DISTRIBUTION_READY", label: "Distribution Ready" },
    { value: "CLOSED", label: "Estate Closed" }
];

export function ProbateStatusUpdater({ currentStatus, currentCaseNumber }: ProbateStatusUpdaterProps) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(currentStatus);
    const [caseNumber, setCaseNumber] = useState(currentCaseNumber || "");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: api.updateMyEstate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estate'] });
            setOpen(false);
        }
    });

    const handleSave = () => {
        mutation.mutate({
            probateStatus: status,
            courtCaseNumber: caseNumber
        } as any);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-slate-200">
                    <Edit className="w-3 h-3 text-slate-500" />
                    <span className="sr-only">Update Status</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Estate Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Probate Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Court Case Number</Label>
                        <Input
                            placeholder="EX: 2024-PR-12345"
                            value={caseNumber}
                            onChange={(e) => setCaseNumber(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSave} disabled={mutation.isPending} className="w-full">
                        {mutation.isPending ? "Saving..." : "Done"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
