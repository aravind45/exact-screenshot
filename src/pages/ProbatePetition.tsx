import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, CheckCircle, CheckCircle2, AlertCircle, Users, Gavel, Landmark, Upload, Eye, FileUp, Loader2, Archive, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadAutofillPdf } from "@/lib/formAutofill";

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

    const { data: heirsData, isError: heirsQueryFailed } = useQuery({
        queryKey: ["heirs"],
        queryFn: api.getHeirs,
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
    const heirs = Array.isArray(heirsData) ? heirsData : [];
    const estateHeirs = Array.isArray(estate.heirs) ? estate.heirs : [];
    const estateBeneficiaries = Array.isArray((estate as any).beneficiaries) ? (estate as any).beneficiaries : [];
    const heirCount = Math.max(heirs.length, estateHeirs.length, estateBeneficiaries.length);

    const missingFields = [];
    if (!estate.deceasedFirstName) missingFields.push("Decedent Name");
    if (!estate.deceasedDateOfDeath) missingFields.push("Date of Death");
    if (!estate.probateCounty) missingFields.push("Probate County");
    if (heirCount === 0 && !heirsQueryFailed) missingFields.push("Heirs/Beneficiaries");

    const progress = Math.max(0, 100 - (missingFields.length * 25));
    const isReady = missingFields.length === 0;

    const handleDownloadDraft = async () => {
        try {
            await downloadAutofillPdf({
                formType: "DE-111",
                payload: formData,
                filename: "probate-petition-draft.pdf",
            });
            toast.success("Draft downloaded successfully");
        } catch (err: any) {
            toast.error("Download failed: " + err.message);
        }
    };

    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewPdf, setPreviewPdf] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState<any>({});

    // Sync estate data to local form state on load
    React.useEffect(() => {
        if (estate) {
            setFormData({
                publicationNewspaper: estate.publicationNewspaper || "",
                hasCodicil: estate.hasCodicil || false,
                codicilDate: estate.codicilDate || "",
                petitionerPhone: estate.petitionerPhone || "",
            });
        }
    }, [estate]);

    const previewMutation = useMutation({
        mutationFn: (data: any) => api.previewPetition({ ...estate, ...data }),
        onSuccess: (res: any) => {
            if (!res?.pdfBase64) {
                toast.error("Preview unavailable: form generation did not return a PDF.");
                return;
            }
            setPreviewPdf(`data:application/pdf;base64,${res.pdfBase64}`);
            setPreviewOpen(true);
        },
        onError: (err: any) => toast.error("Preview failed: " + err.message)
    });

    const handlePreview = () => {
        previewMutation.mutate(formData);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate({ file });
        }
    };

    const handleViewStored = async () => {
        try {
            await api.downloadEstateDocument("DE-111", "filed-petition.pdf");
        } catch (err: any) {
            toast.error("Download failed: " + err.message);
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-['Outfit'] font-black text-slate-900 tracking-tight">Probate Petition (DE-111)</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                The foundation of your authority.
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="preparation" className="space-y-6">
                        <TabsList className="bg-slate-100 p-1 rounded-[1.5rem] h-12 max-w-[440px]">
                            <TabsTrigger value="preparation" className="rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-none transition-all">1. Preparation</TabsTrigger>
                            <TabsTrigger value="filing" className="rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-none transition-all">2. Filing & Results</TabsTrigger>
                        </TabsList>

                        <TabsContent value="preparation" className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2 border-slate-100 shadow-premium rounded-[2rem] overflow-hidden">
                                    <CardHeader className="p-8">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="font-['Outfit'] font-black text-xl">Preparation Status</CardTitle>
                                            <div className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                                                isReady ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-primary/5 text-primary border border-primary/10"
                                            )}>
                                                {isReady ? "Draft Ready" : "In Progress"}
                                            </div>
                                        </div>
                                        <CardDescription className="font-bold text-slate-400">
                                            Gathering the required data for your Petition for Probate.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8 space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Readiness Score</span>
                                                <span className="text-2xl font-black text-slate-900">{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-3 bg-slate-50 [&>div]:bg-primary transition-all duration-1000" />
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
                                                complete={heirCount > 0}
                                            />
                                            <StatusItem
                                                icon={<Gavel className="w-4 h-4" />}
                                                label="Bond Logic"
                                                complete={estate.bondWaived || !!estate.bondAmount}
                                            />
                                        </div>

                                        {/* NEW: Additional Inputs */}
                                        <div className="p-4 bg-white rounded-lg border space-y-4">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <Edit2 className="w-4 h-4 text-primary" /> Additional Details (Required)
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Publication Newspaper</Label>
                                                    <Input
                                                        placeholder="e.g. SF Chronicle"
                                                        value={formData.publicationNewspaper || ""}
                                                        onChange={(e) => setFormData({ ...formData, publicationNewspaper: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Petitioner Phone</Label>
                                                    <Input
                                                        placeholder="(555) 123-4567"
                                                        value={formData.petitionerPhone || ""}
                                                        onChange={(e) => setFormData({ ...formData, petitionerPhone: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 pt-2">
                                                    <Checkbox
                                                        id="hasCodicil"
                                                        checked={formData.hasCodicil}
                                                        onCheckedChange={(c) => setFormData({ ...formData, hasCodicil: c === true })}
                                                    />
                                                    <Label htmlFor="hasCodicil">Are there any codicils to the will?</Label>
                                                </div>
                                                {formData.hasCodicil && (
                                                    <div className="col-span-2 space-y-2">
                                                        <Label>Date of Codicil</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.codicilDate ? new Date(formData.codicilDate).toISOString().split('T')[0] : ""}
                                                            onChange={(e) => setFormData({ ...formData, codicilDate: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                            </div>
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
                                            <Button variant="outline" onClick={handlePreview} disabled={previewMutation.isPending}>
                                                {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
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
                                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                                <FileText className="w-6 h-6 text-primary" />
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

                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Petition Preview</DialogTitle>
                            <DialogDescription>Review your DE-111 before downloading.</DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 bg-slate-100 rounded-md overflow-hidden border">
                            {previewPdf && (
                                <iframe src={previewPdf} className="w-full h-full" title="PDF Preview" />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}

function StatusItem({ icon, label, complete }: { icon: React.ReactNode, label: string, complete: boolean }) {
    return (
        <div className={cn("flex items-center gap-4 p-4 border border-slate-100 rounded-2xl bg-white transition-all hover:border-primary/20 hover:scale-[1.02] shadow-sm", complete ? "border-emerald-100" : "")}>
            <div className={cn(
                "p-3 rounded-xl transition-all shadow-sm",
                complete ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className={cn("text-xs font-bold", complete ? "text-slate-900" : "text-slate-300")}>
                    {complete ? "Validated" : "Required"}
                </p>
            </div>
            {complete && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        </div>
    );
}

