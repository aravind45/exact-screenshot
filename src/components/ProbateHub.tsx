import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Gavel,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    Edit2,
    ChevronRight,
    Scale,
    Info,
    Download,
    Upload,
    ExternalLink,
    MapPin,
    Hash,
    Calendar,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { calculateAuthorityRecommendation, getInstitutionAuthorityRequirement } from "@/lib/authorityEngine";
import { cn } from "@/lib/utils";

const REQUIRED_FORMS = [
    { code: "DE-111", name: "Petition for Probate", url: "https://www.courts.ca.gov/documents/de111.pdf", required: true, source: "PREP" },
    { code: "DE-121", name: "Notice of Hearing", url: "https://www.courts.ca.gov/documents/de121.pdf", required: true, source: "PREP" },
    { code: "DE-160", name: "Inventory and Appraisal", url: "https://www.courts.ca.gov/documents/de160.pdf", required: false, source: "PREP" },
    { code: "DE-165", name: "Notice of Proposed Action", url: "https://www.courts.ca.gov/documents/de165.pdf", required: false, source: "PREP" },
    { code: "DE-140", name: "Order for Probate", url: "https://www.courts.ca.gov/documents/de140.pdf", required: true, source: "COURT" },
    { code: "DE-150", name: "Letters Testamentary", url: "https://www.courts.ca.gov/documents/de150.pdf", required: true, source: "COURT" }
];

export function ProbateHub() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [uploadingForm, setUploadingForm] = useState<string | null>(null);

    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: assetsData } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const { data: documents } = useQuery({
        queryKey: ["estate", "documents"],
        queryFn: api.getEstateDocuments
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];
    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateMyEstate(data),
        onSuccess: () => {
            toast({ title: "Updated", description: "Legal status updated." });
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            setIsEditing(false);
        }
    });

    const handleUpload = async (formCode: string, file: File) => {
        setUploadingForm(formCode);
        try {
            await api.uploadEstateDocument(formCode, `${formCode} - Completed`, file);
            toast({ title: "Form Uploaded", description: `${formCode} saved successfully.` });
            queryClient.invalidateQueries({ queryKey: ["estate", "documents"] });
        } catch (error) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setUploadingForm(null);
        }
    };

    if (isLoading) return <div className="h-40 flex items-center justify-center">Loading...</div>;
    if (!estate) return null;

    const getFormStatus = (formCode: string) => documents?.find((d: any) => d.documentType === formCode)?.status || "NOT_STARTED";

    // Phase Logic
    const de111Completed = getFormStatus("DE-111") === "OBTAINED";
    const de121Completed = getFormStatus("DE-121") === "OBTAINED";
    const formsReady = de111Completed && de121Completed;

    const orderReceived = getFormStatus("DE-140") === "OBTAINED";
    const lettersReceived = getFormStatus("DE-150") === "OBTAINED";

    let currentPhase = 1; // Preparation
    if (lettersReceived && estate.probateStatus === "EXECUTOR_APPOINTED") currentPhase = 4;
    else if (estate.probateStatus === "FILED") currentPhase = 3;
    else if (formsReady) currentPhase = 2;

    const phases = [
        { id: 1, name: "Preparation", icon: FileText },
        { id: 2, name: "Filing & Notice", icon: MapPin },
        { id: 3, name: "Court Hearing", icon: Gavel },
        { id: 4, name: "Authorization", icon: Scale }
    ];

    const individualAssets = assets.filter((a: any) => a.ownershipType === "INDIVIDUAL");
    const probateRequiredCount = individualAssets.length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "EXECUTOR_APPOINTED": return "bg-green-100 text-green-700 border-green-200";
            case "FILED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "CLOSED": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-amber-100 text-amber-700 border-amber-200";
        }
    };

    return (
        <Card className="card-elevated border-none overflow-hidden pb-0">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-600 rounded-lg shadow-sm">
                            <Gavel className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Estate Probate Command Center</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-tight text-slate-600">
                                {estate.deceasedFirstName} {estate.deceasedLastName} • {estate.deceasedState || "CA"}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showHelp ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowHelp(!showHelp)}
                            className={cn("h-7 text-[10px] font-bold", showHelp ? "bg-blue-600 hover:bg-blue-700" : "")}
                        >
                            <HelpCircle className="w-3 h-3 mr-1" /> {showHelp ? "HIDE GUIDE" : "HELP"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="h-7 text-[10px] font-bold">
                            <Edit2 className="w-3 h-3 mr-1" /> {isEditing ? "SAVE" : "EDIT INFO"}
                        </Button>
                    </div>
                </div>

                {/* Compact Phase Stepper */}
                <div className="mt-4 flex items-center justify-between gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto scrollbar-none">
                    {phases.map((phase) => {
                        const Icon = phase.icon;
                        const isCurrent = currentPhase === phase.id;
                        const isPast = currentPhase > phase.id;
                        return (
                            <div key={phase.id} className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md transition-all whitespace-nowrap",
                                isCurrent ? "bg-amber-600 text-white shadow-md shadow-amber-200" : isPast ? "bg-green-50 text-green-700" : "bg-transparent text-slate-600"
                            )}>
                                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                <span className="text-[10px] font-bold uppercase tracking-tight">{phase.name}</span>
                            </div>
                        );
                    })}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                    {/* Left Panel: Info & Phase Actions (5 cols) */}
                    <div className="lg:col-span-12 xl:col-span-5 p-4 space-y-4 bg-slate-50/30">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 bg-white p-3 rounded-lg border shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-700 uppercase">Case #</label>
                                            <Input size={1} className="h-7 text-xs" defaultValue={estate.courtCaseNumber} onBlur={(e) => updateMutation.mutate({ courtCaseNumber: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-700 uppercase">Status</label>
                                            <Select defaultValue={estate.probateStatus} onValueChange={(val) => updateMutation.mutate({ probateStatus: val })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                                                    <SelectItem value="FILED">Case Filed</SelectItem>
                                                    <SelectItem value="EXECUTOR_APPOINTED">Authorized (Letters)</SelectItem>
                                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-600 uppercase">Estate Type</label>
                                            <Select defaultValue={estate.estateType} onValueChange={(val) => updateMutation.mutate({ estateType: val })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PROBATE">Full Probate</SelectItem>
                                                    <SelectItem value="SMALL_ESTATE">Small Estate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-600 uppercase">Cert. Copies</label>
                                            <Input
                                                type="number"
                                                className="h-7 text-xs"
                                                defaultValue={estate.certifiedCopies || 0}
                                                onBlur={(e) => updateMutation.mutate({ certifiedCopies: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                                            <div className="text-[8px] font-bold text-slate-600 uppercase">Status</div>
                                            <Badge variant="outline" className={cn("mt-1 px-1.5 py-0 text-[10px] border", getStatusColor(estate.probateStatus))}>
                                                {estate.probateStatus.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 group relative">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[8px] font-bold text-slate-600 uppercase">Case Number</div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Info className="w-2.5 h-2.5 text-slate-400" />
                                                </div>
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-700 truncate mt-1">{estate.courtCaseNumber || "N/A"}</div>
                                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-lg">
                                                <div className="absolute top-10 left-0 w-max bg-slate-900 text-white text-[8px] p-2 rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all z-50 max-w-[150px] leading-tight origin-top-left">
                                                    Assigned by the court clerk when you first file your petition.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 group relative">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[8px] font-bold text-slate-600 uppercase">Copies</div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Info className="w-2.5 h-2.5 text-slate-400" />
                                                </div>
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-700 mt-1">{estate.certifiedCopies || 0} Cert.</div>
                                            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden rounded-lg">
                                                <div className="absolute top-10 right-0 w-max bg-slate-900 text-white text-[8px] p-2 rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all z-50 max-w-[150px] leading-tight origin-top-right text-right">
                                                    Fresh court-sealed copies of your Letters (DE-150) needed for banks.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smart Phase Instructions */}
                                    <div className="p-3 rounded-lg bg-white border border-amber-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            <IconMap phase={currentPhase} className="w-12 h-12" />
                                        </div>
                                        <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                                            {currentPhase === 1 && "Phase 1: Complete Paperwork"}
                                            {currentPhase === 2 && "Phase 2: Filing & Notice"}
                                            {currentPhase === 3 && "Phase 3: Court Hearing"}
                                            {currentPhase === 4 && "Phase 4: Authorities Granted"}
                                        </h4>
                                        <div className="text-[11px] text-amber-800/80 leading-relaxed font-medium">
                                            {currentPhase === 1 && "Upload DE-111 and DE-121 to continue. Your forms are listed on the right."}
                                            {currentPhase === 2 && "Paperwork is ready! Take forms to the Superior Court. Don't forget to Mail Notice to all heirs."}
                                            {currentPhase === 3 && (
                                                <div className="space-y-2">
                                                    <p>Wait for your hearing. Once the judge approves, the court will issue two final documents:</p>
                                                    <ul className="list-disc ml-4 space-y-1">
                                                        <li><strong>Order for Probate (DE-140)</strong> - The judge's decision.</li>
                                                        <li><strong>Letters (DE-150)</strong> - Your proof of power.</li>
                                                    </ul>
                                                    <p className="mt-2 text-amber-900 font-bold">You MUST upload the signed/sealed copies of these once you receive them.</p>
                                                </div>
                                            )}
                                            {currentPhase === 4 && "You are officially authorized! You can now use your court-sealed Letters (DE-150) to settle individual accounts."}
                                        </div>

                                        {currentPhase === 2 && estate.probateStatus === "NOT_STARTED" && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateMutation.mutate({ probateStatus: 'FILED' })}
                                                className="mt-3 w-full h-8 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold tracking-wide"
                                            >
                                                I HAVE FILED THE PETITION
                                            </Button>
                                        )}
                                        {currentPhase === 3 && orderReceived && lettersReceived && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateMutation.mutate({ probateStatus: 'EXECUTOR_APPOINTED' })}
                                                className="mt-3 w-full h-8 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold tracking-wide"
                                            >
                                                ALL DOCUMENTS UPLOADED - ACTIVATE ESTATE
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {probateRequiredCount > 0 && currentPhase < 4 && (
                            <Link to="/assets" className="flex items-center justify-between p-2 bg-slate-900 text-white rounded-lg group hover:bg-slate-800 transition-all">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
                                        <AlertCircle className="w-3.5 h-3.5 text-slate-900" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{probateRequiredCount} Assets Locked</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                    </div>

                    {/* Right Panel: Required Forms List (7 cols) */}
                    <div className="lg:col-span-12 xl:col-span-7 p-0 bg-white min-h-[300px]">
                        <div className="px-4 py-2 border-b bg-slate-50/20 flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Probate Documents
                            </h4>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded bg-amber-100 border border-amber-200" />
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Prepare</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded bg-violet-100 border border-violet-200" />
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Court Issued</span>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {REQUIRED_FORMS.map((form) => {
                                const status = getFormStatus(form.code);
                                const isCompleted = status === "OBTAINED";
                                return (
                                    <div key={form.code} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn(
                                                    "px-1 py-0 text-[8px] font-bold border-none",
                                                    form.source === "PREP" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
                                                )}>
                                                    {form.source === "PREP" ? "FOR FILING" : "COURT SEAL"}
                                                </Badge>
                                                <span className="font-mono text-[10px] font-bold text-slate-500">{form.code}</span>
                                                {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                            </div>
                                            <span className="text-[11px] font-medium text-slate-700 truncate">{form.name}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 opacity-100 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-500">
                                                <a href={form.url} target="_blank" rel="noopener noreferrer" title="Download Blank">
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </Button>

                                            {isCompleted && (
                                                <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 hover:bg-green-50 text-green-600">
                                                    <a href={api.getEstateDocumentDownloadUrl(form.code)} target="_blank" rel="noopener noreferrer" title="View Uploaded">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "h-7 px-2 text-[9px] font-bold uppercase tracking-tight",
                                                    isCompleted ? "border-green-100 text-green-600" : "border-slate-200"
                                                )}
                                                disabled={uploadingForm === form.code}
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = '.pdf';
                                                    input.onchange = (e: any) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUpload(form.code, file);
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                {uploadingForm === form.code ? "..." : isCompleted ? (form.source === "COURT" ? "UPDATE" : "RE-FILE") : "UPLOAD"}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <AnimatePresence>
                    {showHelp && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-blue-50/50 border-t border-blue-100 overflow-hidden"
                        >
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-tight">
                                        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                                            <Hash className="w-3 h-3" />
                                        </div>
                                        1. Court Case Number
                                    </div>
                                    <p className="text-[11px] text-slate-700 leading-relaxed">
                                        When you file your petition at the Superior Court, the clerk will assign your estate a unique <span className="font-bold text-blue-900">Case Number</span> (e.g., 24PR00123).
                                    </p>
                                    <div className="bg-white/60 p-2 rounded border border-blue-100 space-y-1">
                                        <div className="text-[9px] font-bold text-blue-800 uppercase tracking-tighter">Why it matters</div>
                                        <p className="text-[10px] text-slate-600 italic">You must write this number on every single form you file from that point forward. It is how the court tracks your specific estate.</p>
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500">
                                        In the Hub: You can enter this by clicking <span className="font-bold text-slate-700">"EDIT INFO"</span> at the top right.
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-violet-900 font-bold text-xs uppercase tracking-tight">
                                        <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center">
                                            <Scale className="w-3 h-3 text-violet-700" />
                                        </div>
                                        2. Certified Copies
                                    </div>
                                    <p className="text-[11px] text-slate-700 leading-relaxed">
                                        Once the judge signs your "Letters" (DE-150), you usually need to buy <span className="font-bold text-violet-900">Certified Copies</span> from the court clerk ($\approx$\$25–\$40 each).
                                    </p>
                                    <div className="bg-white/60 p-2 rounded border border-violet-100 space-y-1">
                                        <div className="text-[9px] font-bold text-violet-800 uppercase tracking-tighter">Why it matters</div>
                                        <p className="text-[10px] text-slate-600 italic">Banks and financial institutions demand a fresh, physical certified copy of your Letters to let you move money. They rarely give them back.</p>
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500">
                                        In the Hub: The "Copies" counter helps you track your unspent physical copies.
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

function IconMap({ phase, className }: { phase: number, className?: string }) {
    switch (phase) {
        case 1: return <FileText className={className} />;
        case 2: return <MapPin className={className} />;
        case 3: return <Gavel className={className} />;
        case 4: return <Scale className={className} />;
        default: return <Info className={className} />;
    }
}
