import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Estate } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Clock, MapPin, Building, Calendar, Save } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function Notices() {
    const queryClient = useQueryClient();
    const [hearingData, setHearingData] = useState<Partial<Estate>>({});

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        staleTime: 0
    });

    React.useEffect(() => {
        if (estate) {
            setHearingData({
                hearingDate: estate.hearingDate ? estate.hearingDate.split('T')[0] : "",
                hearingTime: estate.hearingTime || "",
                hearingDept: estate.hearingDept || "",
                hearingAddress: estate.hearingAddress || ""
            });
        }
    }, [estate]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Estate>) => api.updateMyEstate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast.success("Hearing details saved");
        },
        onError: (err: any) => toast.error("Failed to save: " + err.message)
    });

    const previewMutation = useMutation({
        mutationFn: () => api.previewPetition({ ...estate, ...hearingData, formType: 'DE-121' }),
        onError: (err: any) => toast.error("Preview failed: " + err.message)
    });

    const handlePreview = () => {
        // Optimistically save first to ensure we preview what we see
        updateMutation.mutate(hearingData);
        previewMutation.mutate();
    };

    if (!estate) return <div className="p-8">Loading...</div>;

    const hearingStatus = hearingData.hearingDate ? 'scheduled' : 'pending';

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Court Notices & Hearings</h1>
                        <p className="text-slate-500 mt-1">
                            Manage your hearing dates and generate required notice forms (DE-121).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Hearing Scheduler */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Hearing Details
                                </CardTitle>
                                <CardDescription>Enter the date provided by the court.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Hearing Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="date"
                                            className="pl-9"
                                            value={hearingData.hearingDate}
                                            onChange={(e) => setHearingData({ ...hearingData, hearingDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input
                                            placeholder="e.g. 9:00 AM"
                                            value={hearingData.hearingTime}
                                            onChange={(e) => setHearingData({ ...hearingData, hearingTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dept / Room</Label>
                                        <Input
                                            placeholder="e.g. 204"
                                            value={hearingData.hearingDept}
                                            onChange={(e) => setHearingData({ ...hearingData, hearingDept: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Court Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Full address of the courthouse"
                                            value={hearingData.hearingAddress}
                                            onChange={(e) => setHearingData({ ...hearingData, hearingAddress: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => updateMutation.mutate(hearingData)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Hearing Details
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 2. Form Generation */}
                        <Card className="bg-slate-900 text-white">
                            <CardHeader>
                                <CardTitle className="text-slate-100 flex items-center gap-2">
                                    <Building className="w-5 h-5 text-amber-400" />
                                    DE-121 Notice of Petition
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Required to be mailed to all heirs and creditors 15 days before hearing.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-300">Hearing Status</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${hearingStatus === 'scheduled' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {hearingStatus === 'scheduled' ? 'SCHEDULED' : 'MISSING DATE'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        You cannot file DE-121 without a confirmed hearing date from the court clerk.
                                    </p>
                                </div>

                                <Button
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                                    onClick={handlePreview}
                                    disabled={!hearingData.hearingDate}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview DE-121 Form
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Modal */}
                    {previewMutation.isSuccess && (
                        <Card className="mt-8 border-2 border-blue-500">
                            <CardHeader>
                                <CardTitle>Form Preview</CardTitle>
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
