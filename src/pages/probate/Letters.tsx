import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Estate } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Gavel, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function Letters() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<Estate>>({});

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        staleTime: 0
    });

    React.useEffect(() => {
        if (estate) {
            setFormData({
                iaeaType: estate.iaeaType || "FULL",
                appointedDate: estate.appointedDate ? estate.appointedDate.split('T')[0] : "",
                petitionerIsAttorney: estate.petitionerIsAttorney || false
            });
        }
    }, [estate]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Estate>) => api.updateMyEstate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast.success("Saved authority details");
        },
        onError: (err: any) => toast.error("Failed to save: " + err.message)
    });

    const previewMutation = useMutation({
        mutationFn: () => api.previewPetition({ ...estate, ...formData, formType: 'DE-150' }),
        onError: (err: any) => toast.error("Preview failed: " + err.message)
    });

    const handlePreview = () => {
        updateMutation.mutate(formData);
        previewMutation.mutate();
    };

    const isProbatePath = estate.authorityType === "FORMAL_PROBATE" ||
        estate.authorityType === "INFORMAL_PROBATE" ||
        estate.authorityType === "SUMMARY_ADMINISTRATION";

    const hasBond = !estate.bondWaived && (estate.bondAmount || 0) > 0;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tight">Letters (DE-150)</h1>
                        <p className="text-slate-500 text-xs">
                            The official court order granting you authority to act.
                        </p>
                    </div>

                    {!isProbatePath && (
                        <Card className="bg-amber-50/50 border-amber-200 shadow-none">
                            <CardContent className="p-3 flex gap-3">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-[11px] font-black text-amber-900 uppercase">Path Not Applicable</h4>
                                    <p className="text-[10px] text-amber-700 leading-tight">
                                        Your current Master Plan (<strong>{estate.authorityType}</strong>) typically does not require formal Letters of Administration.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Authority Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gavel className="w-5 h-5 text-purple-500" />
                                    Authority Details
                                </CardTitle>
                                <CardDescription>Confirm what the court approved.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Date Appointed / Issued</Label>
                                    <Input
                                        type="date"
                                        value={formData.appointedDate}
                                        onChange={(e) => setFormData({ ...formData, appointedDate: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400">Date of the order or hearing</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>IAEA Authority Level</Label>
                                    <Select
                                        value={formData.iaeaType}
                                        onValueChange={(v: any) => setFormData({ ...formData, iaeaType: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FULL">Full Authority</SelectItem>
                                            <SelectItem value="LIMITED">Limited Authority</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="text-xs text-slate-500 p-2 bg-slate-100 rounded">
                                        {formData.iaeaType === 'FULL'
                                            ? "Allows you to sell real property without court supervision."
                                            : "Requires court supervision for selling real property."}
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => updateMutation.mutate(formData)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Details
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 2. Bond Status & Generation */}
                        <Card className="bg-slate-900 text-white">
                            <CardHeader>
                                <CardTitle className="text-slate-100 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    Ready to Issue
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Generate the Letters to take to the bank.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Bond Status:</span>
                                        <span className={hasBond ? "text-amber-400 font-bold" : "text-green-400 font-bold"}>
                                            {hasBond ? `Required ($${estate.bondAmount})` : "Waived"}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
                                    onClick={handlePreview}
                                    disabled={!formData.appointedDate || !isProbatePath}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview Letters
                                </Button>
                                {!formData.appointedDate && (
                                    <p className="text-center text-xs text-red-400">
                                        Enter appointment date to enable preview.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Modal */}
                    {previewMutation.isSuccess && (
                        <Card className="mt-8 border-2 border-purple-500">
                            <CardHeader>
                                <CardTitle>Letters Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[600px]">
                                <iframe
                                    src={`data:application/pdf;base64,${previewMutation.data.pdfBase64}`}
                                    className="w-full h-full rounded-lg border"
                                    title="PDF Preview"
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
