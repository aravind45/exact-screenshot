import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Liability } from "@/lib/api";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle } from "lucide-react";

interface ManageClaimDialogProps {
    liability: Liability | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageClaimDialog({ liability, open, onOpenChange }: ManageClaimDialogProps) {
    const queryClient = useQueryClient();
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [notes, setNotes] = useState("");
    const [allowedAmount, setAllowedAmount] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    React.useEffect(() => {
        if (liability) {
            setAllowedAmount(liability.amount.toString());
            setNotes(liability.rejectionReason || "");
            setAction(null);
            setPreviewUrl(null);
        }
    }, [liability]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateLiability(liability!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
            toast.success("Claim updated");
            onOpenChange(false);
        }
    });

    const previewMutation = useMutation({
        mutationFn: () => api.previewPetition({
            formType: 'DE-174',
            liabilityId: liability!.id,
            liabilityData: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                rejectionReason: notes,
                allowedAmount: parseFloat(allowedAmount)
            }
        }),
        onSuccess: (res: any) => {
            if (!res?.pdfBase64) {
                setPreviewUrl(null);
                toast.info("Auto-fill unavailable. Opened blank DE-174 form.");
                window.open("https://www.courts.ca.gov/documents/de174.pdf", "_blank", "noopener,noreferrer");
                return;
            }
            setPreviewUrl(`data:application/pdf;base64,${res.pdfBase64}`);
        },
        onError: (err: any) => {
            setPreviewUrl(null);
            toast.error("Preview failed: " + err.message);
        }
    });

    const handleSave = () => {
        if (!action) return;
        const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        updateMutation.mutate({
            status,
            rejectionReason: action === 'REJECT' ? notes : null,
            allowedAmount: action === 'APPROVE' ? parseFloat(allowedAmount) : 0
        });
    };

    if (!liability) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Creditor Claim</DialogTitle>
                    <DialogDescription>
                        {liability.name} - ${liability.amount}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!action ? (
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-24 flex flex-col gap-2 border-green-200 hover:bg-green-50 hover:border-green-500"
                                onClick={() => setAction('APPROVE')}
                            >
                                <CheckCircle className="w-8 h-8 text-green-500" />
                                <span className="font-bold text-green-700">Allow Claim</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-24 flex flex-col gap-2 border-red-200 hover:bg-red-50 hover:border-red-500"
                                onClick={() => setAction('REJECT')}
                            >
                                <XCircle className="w-8 h-8 text-red-500" />
                                <span className="font-bold text-red-700">Reject Claim</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <Button variant="ghost" size="sm" onClick={() => setAction(null)} className="mb-2">
                                ← Back
                            </Button>

                            {action === 'APPROVE' && (
                                <div className="space-y-2">
                                    <Label>Allowed Amount</Label>
                                    <Input
                                        type="number"
                                        value={allowedAmount}
                                        onChange={(e) => setAllowedAmount(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500">Usually the full amount, unless negotiated.</p>
                                </div>
                            )}

                            {action === 'REJECT' && (
                                <div className="space-y-2">
                                    <Label>Reason for Rejection</Label>
                                    <Textarea
                                        placeholder="e.g., Debt not recognized, Statues of limitations expired..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="bg-slate-50 p-3 rounded border flex items-center justify-between">
                                <span className="text-sm font-medium">Generate DE-174 Form</span>
                                <Button size="sm" variant="outline" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                                    <FileText className="w-4 h-4 mr-2" /> {previewMutation.isPending ? "Generating..." : "Preview"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {previewUrl && (
                    <div className="mt-4 p-2 border rounded bg-slate-100 h-64">
                        <iframe
                            src={previewUrl}
                            className="w-full h-full"
                            title="PDF Preview"
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!action || updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Confirm Decision"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

