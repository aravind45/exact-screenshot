import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
    Zap,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Download,
    Clock,
    ChevronRight,
    Search,
    Info,
    ArrowRight,
    Gavel,
    Shield,
    Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const THRESHOLD = 184500;

const GET_REQUIRED_FORMS = () => {
    return [
        { code: "DE-310", name: "Small Estate Affidavit", url: "https://www.courts.ca.gov/documents/de310.pdf", required: true, source: "PREP" },
        { code: "DE-315", name: "Inventory & Appraisal (Small Estate)", url: "https://www.courts.ca.gov/documents/de315.pdf", required: true, source: "PREP" }
    ];
};

export function SmallEstateHub() {
    const [showFullRules, setShowFullRules] = useState(false);

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: documents } = useQuery({
        queryKey: ["estate", "documents"],
        queryFn: api.getEstateDocuments
    });

    const [uploadingForm, setUploadingForm] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: assetsData } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];

    // Filter assets that count towards the California Small Estate threshold
    // Generally includes bank accounts, stocks, vehicles, and real property (with limits)
    // Excludes joint tenancy, POD, and trust assets.
    const qualifiedAssets = assets.filter(a => a.ownershipType === "INDIVIDUAL");
    const totalQualifiedValue = qualifiedAssets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
    const progressPercentage = Math.min((totalQualifiedValue / THRESHOLD) * 100, 100);
    const isOverThreshold = totalQualifiedValue > THRESHOLD;

    const handleSyncRoadmap = async (roadmapId: string) => {
        try {
            if (!estate) return;
            const completedTaskIds = estate.roadmapProgress?.completedTaskIds || [];
            if (!completedTaskIds.includes(roadmapId)) {
                const newIds = [...completedTaskIds, roadmapId];
                await api.updateRoadmap({
                    completedTaskIds: newIds,
                    completedPhases: estate.roadmapProgress?.completedPhases || [],
                    taskId: roadmapId,
                    action: 'COMPLETED'
                });
                queryClient.invalidateQueries({ queryKey: ["estate"] });
                toast({
                    title: "Roadmap Sync",
                    description: `Automatically marked roadmap task as "Complete".`,
                });
            }
        } catch (err) {
            console.error("Failed to sync roadmap:", err);
        }
    };

    const handleUpload = async (formCode: string, file: File, displayName?: string) => {
        setUploadingForm(formCode);
        try {
            const docName = displayName || `${formCode} - Completed`;
            await api.uploadEstateDocument(formCode, docName, file);
            toast({ title: "Form Uploaded", description: `${displayName || formCode} saved successfully.` });

            const roadmapMapping: Record<string, string> = {
                "DE-310": "file_affidavit",
                "DE-315": "complete_inventory"
            };
            if (roadmapMapping[formCode]) {
                await handleSyncRoadmap(roadmapMapping[formCode]);
            }

            if (formCode === "DE-310") {
                await api.updateMyEstate({ probateStatus: 'EXECUTOR_APPOINTED' });
                queryClient.invalidateQueries({ queryKey: ["estate"] });
            }

            queryClient.invalidateQueries({ queryKey: ["estate", "documents"] });
        } catch (error) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setUploadingForm(null);
        }
    };

    const getFormStatus = (formCode: string) => documents?.find((d: any) => d.documentType === formCode)?.status || "NOT_STARTED";

    const checklist = [
        { id: 1, label: "40 Days Have Passed since date of death", status: "PENDING", details: "You must wait at least 40 days before using an affidavit." },
        { id: 2, label: "Total Assets < $184,500", status: isOverThreshold ? "FAILED" : "PASSED", details: "Current total is $" + totalQualifiedValue.toLocaleString() },
        { id: 3, label: "No Probate Proceeding started or pending", status: "PENDING", details: "No one has filed a DE-111 with the court." },
        { id: 4, label: "Inventory & Appraisal Completed", status: "PENDING", details: "Needed if real property is included in the total." }
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-amber-500 rounded-md">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Small Estate Hub</h1>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] font-bold">
                            Section 13100
                        </Badge>
                    </div>
                    <p className="text-slate-500 text-sm max-w-2xl">
                        In California, estates worth less than <span className="font-bold text-slate-900">${THRESHOLD.toLocaleString()}</span> can be settled
                        without a court hearing using a simple notarized Affidavit.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold uppercase tracking-tight">
                        <Download className="w-3.5 h-3.5 mr-2" /> Download Blank Form
                    </Button>
                    <Button className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-tight">
                        Generate Custom Affidavit
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Eligibility Card */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-600">Threshold Monitoring</CardTitle>
                            <Info className="w-4 h-4 text-slate-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <div className="text-3xl font-black text-slate-900">
                                    ${totalQualifiedValue.toLocaleString()}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">
                                    Qualified Probate Assets
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={cn(
                                    "text-sm font-black",
                                    isOverThreshold ? "text-red-600" : "text-slate-400"
                                )}>
                                    ${THRESHOLD.toLocaleString()} LIMIT
                                </div>
                            </div>
                        </div>

                        <Progress value={progressPercentage} className={cn(
                            "h-3 mb-6",
                            isOverThreshold ? "bg-red-100" : "bg-slate-100"
                        )} />

                        {isOverThreshold ? (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-900 mb-1">Over Threshold</h4>
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        The estate exceeds the California Small Estate limit. You likely need to file for
                                        <strong> Full Probate</strong>. Our Probate Command Center can help you file the DE-111.
                                    </p>
                                    <Button variant="link" size="sm" className="p-0 h-auto text-red-800 font-bold underline mt-2">
                                        Switch to Full Probate Path
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-green-900 mb-1">Affidavit-Eligible</h4>
                                    <p className="text-xs text-green-700 leading-relaxed">
                                        This estate qualifies for the simplified Section 13100 transfer. No court
                                        hearings or judges are required for these assets.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Important Dates */}
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white">
                    <CardHeader className="pb-2 border-b border-slate-800">
                        <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-400">Survival Wait Period</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-amber-500/30 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black">40 Days</div>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Legal Waiting Period</p>
                            </div>
                            <div className="w-full bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Earliest Filing Date</div>
                                <div className="text-sm font-bold">
                                    {estate?.deceasedDateOfDeath ?
                                        new Date(new Date(estate.deceasedDateOfDeath).getTime() + 40 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                                        "Calculating..."}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Required Documents List */}
                <Card className="lg:col-span-12 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-600 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Required Affidavit Documents
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {GET_REQUIRED_FORMS().map((form) => {
                                const status = getFormStatus(form.code);
                                const isCompleted = status === "OBTAINED";
                                return (
                                    <div key={form.code} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-none px-1 py-0 text-[9px] font-bold">
                                                    SECTION 13100
                                                </Badge>
                                                <span className="font-mono text-[10px] font-bold text-slate-500">{form.code}</span>
                                                {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 mt-1">{form.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                                <a href={form.url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                variant={isCompleted ? "outline" : "default"}
                                                size="sm"
                                                className={cn(
                                                    "h-9 px-4 text-xs font-bold uppercase tracking-tight",
                                                    isCompleted ? "border-green-100 text-green-600" : "bg-slate-900 text-white"
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
                                                {uploadingForm === form.code ? "..." : isCompleted ? "UPDATE" : "UPLOAD COMPLETED"}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Generic Upload Row */}
                            <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group border-t border-dashed border-slate-200">
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="px-1 py-0 text-[8px] font-bold border-none bg-slate-100 text-slate-700">
                                            OTHER
                                        </Badge>
                                        <span className="text-sm font-bold text-slate-700 mt-1">Generic Document Upload</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-0.5">Use this for any documents not listed above</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 text-xs font-bold uppercase tracking-tight border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/10 text-slate-500 hover:text-blue-600 transition-all font-bold"
                                    onClick={() => {
                                        const name = window.prompt("Enter a name for this document (e.g. 'Death Certificate', 'Will copy'):");
                                        if (name) {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.pdf,.jpg,.jpeg,.png';
                                            input.onchange = (e: any) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUpload('OTHER', file, name);
                                            };
                                            input.click();
                                        }
                                    }}
                                >
                                    <Upload className="w-3.5 h-3.5 mr-1" /> UPLOAD OTHER
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Requirements Checklist */}
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-600">Requirements Checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {checklist.map((item) => (
                                <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                        item.status === "PASSED" ? "bg-green-100 text-green-600" :
                                            item.status === "FAILED" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {item.status === "PASSED" ? <CheckCircle2 className="w-4 h-4" /> :
                                            item.status === "FAILED" ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-900">{item.label}</div>
                                        <div className="text-xs text-slate-500 mt-1">{item.details}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Qualified Assets List */}
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-600">Assets in this Track</CardTitle>
                            <Badge variant="secondary" className="bg-slate-900 text-white text-[9px]">
                                {qualifiedAssets.length} INDIVIDUAL ASSETS
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 min-h-[300px]">
                        {qualifiedAssets.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {qualifiedAssets.map((asset) => (
                                    <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-amber-50/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded group-hover:bg-amber-100 transition-colors">
                                                <Shield className="w-4 h-4 text-slate-500 group-hover:text-amber-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{asset.institution}</div>
                                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tight">{asset.assetType?.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-black text-slate-900 text-right">
                                            ${(parseFloat(asset.value) || 0).toLocaleString()}
                                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Needs Affidavit</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Search className="w-12 h-12 text-slate-200 mb-4" />
                                <h3 className="text-sm font-bold text-slate-900 mb-1">No probate assets found</h3>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    We couldn't find any individually owned assets. Check your Asset Ledger.
                                </p>
                            </div>
                        )}
                        <div className="p-4 border-t border-slate-50 bg-slate-50/30 mt-auto">
                            <div className="flex items-start gap-2">
                                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Joint accounts, POD beneficiaries, and Living Trust assets <span className="font-bold text-slate-900">DO NOT count</span> toward the limit and can be transferred separately.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
