import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ArrowRight, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LetterPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: any;
    estate: any;
    onGenerate: (overrides: any) => void;
    isGenerating: boolean;
}

export function LetterPreviewDialog({ open, onOpenChange, asset, estate, onGenerate, isGenerating }: LetterPreviewDialogProps) {
    const [overrides, setOverrides] = useState({
        institution: asset?.institution || "",
        accountNumber: asset?.accountNumber || "",
        deceasedName: estate ? `${estate.deceasedFirstName} ${estate.deceasedLastName}` : "",
        dateOfDeath: estate?.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "",
        assetType: asset?.assetType || "",
        senderName: estate?.user?.fullName || ""
    });

    useEffect(() => {
        if (open) {
            setOverrides({
                institution: asset?.institution || "",
                accountNumber: asset?.accountNumber || "",
                deceasedName: estate ? `${estate.deceasedFirstName} ${estate.deceasedLastName}` : "",
                dateOfDeath: estate?.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "",
                assetType: asset?.assetType || "",
                senderName: estate?.user?.fullName || ""
            });
        }
    }, [open, asset, estate]);

    const handleChange = (field: string, value: string) => {
        setOverrides(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] overflow-hidden rounded-[32px] p-0 border-none shadow-2xl bg-white">
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FileText className="w-24 h-24" />
                    </div>
                    <Badge className="bg-indigo-500 text-white border-none mb-4 px-3 py-1 font-black uppercase text-[10px] tracking-widest">Document Editor</Badge>
                    <DialogTitle className="text-3xl font-black tracking-tighter leading-none mb-2">Generate Settlement Letter</DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">Verify or edit the details below to ensure the letter is accurate for the institution.</DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institution Name</Label>
                            <Input
                                value={overrides.institution}
                                onChange={(e) => handleChange('institution', e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Number</Label>
                            <Input
                                value={overrides.accountNumber}
                                onChange={(e) => handleChange('accountNumber', e.target.value)}
                                placeholder="Unknown / Pending"
                                className="rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deceased Full Name</Label>
                            <Input
                                value={overrides.deceasedName}
                                onChange={(e) => handleChange('deceasedName', e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date of Death</Label>
                            <Input
                                value={overrides.dateOfDeath}
                                onChange={(e) => handleChange('dateOfDeath', e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Type</Label>
                            <Input
                                value={overrides.assetType}
                                onChange={(e) => handleChange('assetType', e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sender (Your Name)</Label>
                            <Input
                                value={overrides.senderName}
                                onChange={(e) => handleChange('senderName', e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button
                            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 shadow-lg shadow-indigo-200"
                            disabled={isGenerating}
                            onClick={() => onGenerate(overrides)}
                        >
                            {isGenerating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isGenerating ? "Generating..." : "Generate & Download PDF"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
