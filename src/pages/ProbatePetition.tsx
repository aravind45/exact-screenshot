import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, CheckCircle, AlertCircle, Users, Gavel, Landmark, Upload, Eye, FileUp, Loader2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ProbatePetition() {
    const queryClient = useQueryClient();

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: documents } = useQuery({
        queryKey: ["estate_documents"],
        queryFn: api.getEstateDocuments,
        enabled: !!estate,
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file }: { file: File }) => api.uploadEstateDocument("DE-111", "Petition for Probate (Filed)", file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate_documents"] });
            toast.success("Petition uploaded successfully!");
        },
        onError: (err: any) => {
            toast.error("Failed to upload petition: " + err.message);
        }
    });

    if (!estate) return <div className="p-8">Loading estate data...</div>;

    const filedPetition = documents?.find((d: any) => d.documentType === "DE-111");

    const missingFields = [];
    if (!estate.deceasedFirstName) missingFields.push("Decedent Name");
    if (!estate.deceasedDateOfDeath) missingFields.push("Date of Death");
    if (!estate.probateCounty) missingFields.push("Probate County");
    if (!estate.heirs || estate.heirs.length === 0) missingFields.push("Heirs/Beneficiaries");

    const progress = Math.max(0, 100 - (missingFields.length * 25));
    const isReady = missingFields.length === 0;

    const handleDownloadDraft = () => {
        window.open(`${import.meta.env.VITE_API_URL || "/api"}/estates/my/petition/pdf?token=${localStorage.getItem("auth_token")}`, '_blank');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate({ file });
        }
    };

    const handleViewStored = () => {
        window.open(api.getEstateDocumentDownloadUrl("DE-111"), '_blank');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Probate Petition (DE-111)</h1>
                <p className="text-muted-foreground underline">
                    The foundation of your authority. This document initiates the court process.
                </p>
            </div>

            <Tabs defaultValue="preparation" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="preparation">1. Preparation</TabsTrigger>
                    <TabsTrigger value="filing">2. Filing & Results</TabsTrigger>
                </TabsList>

                <TabsContent value="preparation" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Preparation Status</CardTitle>
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                        isReady ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {isReady ? "Draft Ready" : "In Progress"}
                                    </span>
                                </div>
                                <CardDescription>
                                    Gathering the required data for your California Petition for Probate.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Readiness</span>
                                        <span className="font-bold">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <StatusItem
                                        icon={<FileText className="w-4 h-4" />}
                                        label="Decedent Info"
                                        complete={!!estate.deceasedFirstName && !!estate.deceasedDateOfDeath}
                                    />
                                    <StatusItem
                                        icon={<Landmark className="w-4 h-4" />}
                                        label="Court Selection"
                                        complete={!!estate.probateCounty}
                                    />
                                    <StatusItem
                                        icon={<Users className="w-4 h-4" />}
                                        label="Heirs List"
                                        complete={estate.heirs?.length > 0}
                                    />
                                    <StatusItem
                                        icon={<Gavel className="w-4 h-4" />}
                                        label="Bond Logic"
                                        complete={estate.bondWaived || !!estate.bondAmount}
                                    />
                                </div>

                                {!isReady && (
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex gap-2">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">Missing Information</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    The AI Agent needs the following to complete your petition:
                                                </p>
                                                <ul className="list-disc list-inside text-xs text-amber-800 mt-2 space-y-1">
                                                    {missingFields.map(f => <li key={f}>{f}</li>)}
                                                </ul>
                                                <p className="text-[10px] mt-3 font-medium opacity-80 uppercase tracking-tight italic">
                                                    TIP: Ask the AI Chat to "Check my petition status" to resolve these.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={handleDownloadDraft} disabled={!isReady && progress < 10}>
                                        Preview Draft
                                    </Button>
                                    <Button onClick={handleDownloadDraft} disabled={!isReady}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Draft PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-sm">What is form DE-111?</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-4 leading-relaxed">
                                <p>
                                    The **Petition for Probate** is the official request to open the estate.
                                </p>
                                <p>
                                    It triggers the court hearing where you are officially named Executor.
                                </p>
                                <div className="p-3 bg-muted rounded border border-dashed text-[10px] space-y-2">
                                    <p className="font-bold uppercase tracking-widest text-primary">Next Step</p>
                                    <p>
                                        Once downloaded, you must sign it and file it with the Superior Court in {estate.probateCounty || "the deceased's county"}.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="filing" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Filing & Document Storage</CardTitle>
                                <CardDescription>
                                    Manage the signed and court-stamped version of your petition.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Action 1: Upload */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold">Step 1: File your Petition</h3>
                                        <p className="text-xs text-muted-foreground">
                                            After you file the DE-111 with the court, scan the version with the court's stamp and upload it here.
                                        </p>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="petition-upload"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={handleFileUpload}
                                                disabled={uploadMutation.isPending}
                                            />
                                            <Button
                                                variant="outline"
                                                className="w-full h-24 border-dashed flex-col gap-2"
                                                asChild
                                            >
                                                <label htmlFor="petition-upload" className="cursor-pointer">
                                                    {uploadMutation.isPending ? (
                                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    ) : (
                                                        <FileUp className="w-6 h-6 text-muted-foreground" />
                                                    )}
                                                    <span className="text-xs font-bold">
                                                        {uploadMutation.isPending ? "Uploading..." : "Upload Stamped Copy"}
                                                    </span>
                                                </label>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Action 2: Stored File */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold">Stored Document</h3>
                                        {filedPetition ? (
                                            <div className="p-4 border rounded-xl bg-slate-50 relative group">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <FileText className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate">{filedPetition.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Uploaded: {new Date(filedPetition.obtainedDate || filedPetition.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Button size="sm" variant="secondary" className="w-full text-[10px] h-8" onClick={handleViewStored}>
                                                        <Eye className="w-3 h-3 mr-1.5" />
                                                        View
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="w-full text-[10px] h-8" onClick={handleViewStored}>
                                                        <Download className="w-3 h-3 mr-1.5" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
                                                <Archive className="w-8 h-8 text-slate-300 mb-2" />
                                                <p className="text-[10px] text-slate-400 font-medium">No filed document found.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-sm text-green-700">Next Stage?</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-4 leading-relaxed">
                                <p>
                                    Once filed, the court will set a **Hearing Date**.
                                </p>
                                <p>
                                    You will soon need to complete form **DE-121** (Notice of Petition) to legally notify all heirs and creditors.
                                </p>
                                <div className="p-3 bg-green-50 rounded border border-green-200 text-[10px] space-y-2">
                                    <p className="font-bold uppercase tracking-widest text-green-700">Digital Vault</p>
                                    <p>
                                        All documents uploaded here are also accessible in your central <strong>Vault</strong> for sharing with attorneys or banks.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatusItem({ icon, label, complete }: { icon: React.ReactNode, label: string, complete: boolean }) {
    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className={cn(
                "p-2 rounded-md",
                complete ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{label}</p>
                <p className={cn("text-[10px]", complete ? "text-green-600" : "text-muted-foreground")}>
                    {complete ? "Complete" : "Missing"}
                </p>
            </div>
            {complete && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
    );
}
