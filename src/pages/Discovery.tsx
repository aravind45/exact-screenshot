import React, { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Search, CheckCircle2, Sparkles, Plus, AlertCircle, Loader2, Info, ArrowRight, ShieldCheck, Zap, Clock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DiscoveryCategory, DiscoveryStatus } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const CATEGORY_MAP: Record<string, { label: string, examples: string, closure: string }> = {
    'BANK_ACCOUNTS': { label: 'Bank Accounts', examples: 'Checking, Savings', closure: 'Bank inquiry complete' },
    'INVESTMENTS': { label: 'Investment Accounts', examples: 'Brokerage, IRA, 401(k)', closure: 'Holdings verified' },
    'EMPLOYER_BENEFITS': { label: 'Employer Benefits', examples: 'Life Insurance, Stock Plans', closure: 'Benefits search logged' },
    'REAL_PROPERTY': { label: 'Real Property', examples: 'Primary Residence, Rental', closure: 'Property search complete' },
    'SAFE_DEPOSIT': { label: 'Safe Deposit Boxes', examples: 'Bank-held valuables', closure: 'Box search recorded' },
    'DIGITAL_ASSETS': { label: 'Digital Assets', examples: 'Crypto, PayPal, Venmo', closure: 'Digital sweep complete' },
    'UNCLAIMED_PROPERTY': { label: 'Unclaimed Property', examples: 'State registry search', closure: 'State search logged' },
    'PERSONAL_PROPERTY': { label: 'Vehicles & Personal Items', examples: 'Cars, Jewelry, Art', closure: 'Inventory review complete' },
};

interface DiscoveredAsset {
    confidence: number;
    sourceText: string;
    asset: {
        name: string;
        institution: string;
        assetType: string;
        value?: number;
        accountNumber?: string;
    };
}

export default function Discovery() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isDragging, setIsDragging] = useState(false);
    const [findings, setFindings] = useState<DiscoveredAsset[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    // Systematic Discovery Queries
    const { data: discoveryStatus, isLoading: loadingDiscovery } = useQuery({
        queryKey: ["discovery-status", user?.id],
        queryFn: async () => {
            const estate = await api.getMyEstate();
            if (!estate) return null;
            try {
                return await api.getDiscoveryStatus(estate.id);
            } catch (e) {
                await api.initializeDiscoveryCategories(estate.id);
                return await api.getDiscoveryStatus(estate.id);
            }
        },
        enabled: !!user?.id
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, evidenceSource }: { id: string, status: string, evidenceSource?: string }) =>
            api.updateDiscoveryCategory(id, { status, evidenceSource }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discovery-status"] });
            toast.success("Diligence record updated");
        }
    });

    const negativeAssuranceMutation = useMutation({
        mutationFn: ({ id, statement }: { id: string, statement: string }) =>
            api.addNegativeAssurance(id, statement),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discovery-status"] });
            toast.success("Negative assurance logged");
        }
    });

    const analyzeMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/discovery/analyze", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error("Analysis failed");
            return res.json();
        },
        onSuccess: (data) => {
            setFindings(data.findings);
            setAnalyzing(false);
            if (data.findings.length > 0) toast.success(`Found ${data.findings.length} potential assets!`);
            else toast.info("No obvious assets found. Review complete.");
        },
        onError: () => {
            setAnalyzing(false);
            toast.error("Analysis failed.");
        }
    });

    const confirmMutation = useMutation({
        mutationFn: (asset: any) => api.createAsset(asset),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Asset added to ledger");
            setFindings(prev => prev.filter(f => f.asset.name !== confirmMutation.variables?.name));
        }
    });

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setAnalyzing(true);
            analyzeMutation.mutate(e.dataTransfer.files[0]);
        }
    };

    const diligenceState = useMemo(() => {
        if (!discoveryStatus) return { label: "Unknown", color: "text-slate-400 bg-slate-100", icon: Info };
        const { completed, total } = discoveryStatus.progress;
        if (completed === 0) return { label: "Not Started", color: "text-slate-400 bg-slate-100", icon: Clock };
        if (completed < total) return { label: "In Progress", color: "text-amber-600 bg-amber-50", icon: Loader2 };
        return { label: "Reasonable Diligence Standards Met", color: "text-emerald-600 bg-emerald-50", icon: ShieldCheck };
    }, [discoveryStatus]);

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-10 pb-32">
                    <header className="flex justify-between items-start gap-8">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                                <Sparkles className="w-3.5 h-3.5" />
                                Forensic Diligence Protocol
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Discovery Assistant</h1>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                A systematic protocol for identifying estate assets and documenting a defensible record of reasonable care.
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 italic flex items-center gap-1.5 uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3" />
                                Liability Protection: This log serves as proof of executor diligence.
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-600 hover:bg-slate-50 px-6 h-12">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Review Standards
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black">Attorney-Safe Record Keeping</DialogTitle>
                                    <DialogDescription className="font-bold">
                                        Building the record of "Reasonable Diligence"
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4 text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        Courts do not require you to be a private investigator. They require you to demonstrate <strong>reasonable care</strong> and a <strong>systematic approach</strong>.
                                    </p>
                                    <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                                        "ExpectedEstate mirrors how we document cases. It turns discovery from a guessing game into a timestamped record that attorneys can efficiently defend if called into court."
                                        <p className="text-[10px] text-right font-bold non-italic uppercase tracking-widest text-slate-400 mt-4">— Attorney Council</p>
                                    </div>
                                    <p className="font-medium">
                                        By checking off each category—even if you find nothing—you are closing the window for heir complaints and fiduciary liability.
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </header>

                    {/* Discovery Phase Complete Banner */}
                    <AnimatePresence>
                        {discoveryStatus?.progress.isComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-100 overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h2 className="text-2xl font-black tracking-tight">Discovery Phase Complete</h2>
                                        <p className="text-emerald-50 font-medium mt-1">
                                            All required asset categories have been systematically reviewed and logged in the Settlement Trail. Your diligence record is now defensible.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Systematic Review Progress */}
                    {discoveryStatus && (
                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={cn("px-4 py-1.5 rounded-full flex items-center gap-2", diligenceState.color)}>
                                                <diligenceState.icon className={cn("w-4 h-4", diligenceState.label === "In Progress" && "animate-spin")} />
                                                <span className="text-xs font-black uppercase tracking-widest">{diligenceState.label}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">Coverage Benchmark</h3>
                                        <p className="text-sm font-medium text-slate-400 mt-1">
                                            Systematic review of {discoveryStatus.progress.completed} of {discoveryStatus.progress.total} mandatory categories.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-5xl font-black text-indigo-600">{discoveryStatus.progress.percentage}%</span>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Diligence Score</p>
                                    </div>
                                </div>
                                <Progress value={discoveryStatus.progress.percentage} className="h-3 bg-slate-100" />
                                {!discoveryStatus.progress.isComplete && (
                                    <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                        <Zap className="w-4 h-4 text-amber-600 mt-0.5" />
                                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                            Critical: To meet "Reasonable Diligence" standards, every category below must be reviewed—even if you believe no such assets exist.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Asset Coverage Matrix */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900">Asset Coverage Matrix</CardTitle>
                                    <CardDescription className="font-medium mt-1">
                                        Validate your search across all major asset classes.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-none hover:bg-transparent">
                                        <TableHead className="px-8 h-12 font-black text-[10px] text-slate-400 uppercase tracking-widest">Category</TableHead>
                                        <TableHead className="px-8 h-12 font-black text-[10px] text-slate-400 uppercase tracking-widest">Examples</TableHead>
                                        <TableHead className="px-8 h-12 font-black text-[10px] text-slate-400 uppercase tracking-widest">Diligence Status</TableHead>
                                        <TableHead className="px-8 h-12 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {discoveryStatus?.categories.map((cat) => (
                                        <TableRow key={cat.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                            <TableCell className="px-8 py-6 font-black text-slate-900">
                                                {CATEGORY_MAP[cat.category]?.label || cat.category}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-sm font-medium text-slate-400">
                                                {CATEGORY_MAP[cat.category]?.examples}
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider",
                                                        cat.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            cat.status === 'NOT_FOUND' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                cat.status === 'NA' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                                                    'bg-slate-100 text-slate-400 opacity-60'
                                                    )}
                                                >
                                                    {cat.status === 'REVIEWED' ? 'Reviewed — Assets Found' :
                                                        cat.status === 'NOT_FOUND' ? 'Reviewed — No Assets Identified' :
                                                            cat.status === 'NA' ? 'Not Applicable' : 'Pending Review'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" className="rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 px-4">
                                                            Update
                                                            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="rounded-[2rem]">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-black">Verify {CATEGORY_MAP[cat.category]?.label}</DialogTitle>
                                                            <DialogDescription className="font-bold">
                                                                Document your inquiry for this category.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-6">
                                                            <div className="space-y-3">
                                                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</Label>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {[
                                                                        { value: 'REVIEWED', label: 'Assets Found', color: 'border-emerald-200 hover:bg-emerald-50' },
                                                                        { value: 'NOT_FOUND', label: 'None Found', color: 'border-amber-200 hover:bg-amber-50' },
                                                                        { value: 'NA', label: 'Not Applicable', color: 'border-slate-200 hover:bg-slate-50' },
                                                                        { value: 'NOT_CHECKED', label: 'Reset', color: 'border-slate-100' }
                                                                    ].map((opt) => (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => updateStatusMutation.mutate({ id: cat.id, status: opt.value })}
                                                                            className={cn(
                                                                                "h-12 rounded-2xl border text-xs font-black transition-all",
                                                                                cat.status === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" :
                                                                                    `bg-white text-slate-600 ${opt.color}`
                                                                            )}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {cat.status === 'REVIEWED' && (
                                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Evidence Source</Label>
                                                                    <Input
                                                                        className="rounded-2xl h-12 border-slate-200"
                                                                        placeholder="e.g. 2024 Tax Returns, Brokerage Statement"
                                                                        defaultValue={cat.evidenceSource}
                                                                        onBlur={(e) => updateStatusMutation.mutate({ id: cat.id, status: cat.status, evidenceSource: e.target.value })}
                                                                    />
                                                                </div>
                                                            )}

                                                            {cat.status === 'NOT_FOUND' && (
                                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Fiduciary Search Statement (Proof of Search)</Label>
                                                                    <Textarea
                                                                        className="rounded-3xl border-slate-200 min-h-[100px] p-4 text-sm font-medium"
                                                                        placeholder="e.g. Conducted a diligent review of decedent's tax returns (2021-2023) and personal files; no evidence of [Category] accounts or holdings found."
                                                                        onBlur={(e) => negativeAssuranceMutation.mutate({ id: cat.id, statement: e.target.value })}
                                                                    />
                                                                    <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                                                                        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                                                            It is standard and expected for many categories to yield negative findings. This log serves as your proof of systematic inquiry.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {cat.negativeFindings && cat.negativeFindings.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logged Assurances</Label>
                                                                    {cat.negativeFindings.map(f => (
                                                                        <div key={f.id} className="text-xs font-medium p-4 bg-indigo-50/50 rounded-2xl italic text-slate-600 border border-indigo-100 flex items-start gap-3">
                                                                            <ShieldCheck className="w-4 h-4 text-indigo-300 shrink-0" />
                                                                            "{f.statement}"
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()} className="rounded-2xl bg-slate-900 h-12 px-8 font-black text-xs uppercase tracking-widest">
                                                                Close & Record
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Forensic Review Helper */}
                    <div className="relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-full z-10 shadow-xl tracking-[0.2em] uppercase">
                            Analysis Engine (Optional Helper)
                        </div>

                        {/* Upload Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={cn(
                                "border-4 border-dashed rounded-[3rem] p-16 text-center transition-all cursor-pointer relative",
                                isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/30'
                            )}
                        >
                            {analyzing ? (
                                <div className="flex flex-col items-center animate-pulse py-4">
                                    <div className="relative">
                                        <Search className="w-20 h-20 text-indigo-500 animate-bounce" />
                                        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full animate-ping opacity-20" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mt-6 tracking-tight">Analyzing Intelligence...</h3>
                                    <p className="text-sm font-medium text-slate-400 mt-2 max-w-sm mx-auto">
                                        Scanning document for institutional keywords, account numbers, and ownership markers.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                                        <Upload className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                                        Drag & Drop Forensic Evidence
                                    </h3>
                                    <p className="text-base font-medium text-slate-400 max-w-lg mx-auto mb-8">
                                        Support for tax returns, statements, and personal files. This is <span className="text-indigo-600 font-bold uppercase">optional but recommended</span> to assist your systematic review.
                                    </p>
                                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
                                        Upload for Analysis
                                    </Button>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setAnalyzing(true);
                                                analyzeMutation.mutate(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <p className="mt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        PDF, PNG, JPG Supported • 10MB Limit
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Findings Feed */}
                        <AnimatePresence>
                            {findings.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6 mt-12"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <Sparkles className="w-7 h-7 text-amber-500" />
                                            AI-Identified Potential Assets ({findings.length})
                                        </h2>
                                        <Button variant="ghost" onClick={() => setFindings([])} className="text-slate-400 font-bold hover:text-rose-500">
                                            Clear Results
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {findings.map((finding, idx) => (
                                            <Card key={idx} className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white hover:scale-[1.01] transition-transform">
                                                <CardContent className="flex flex-col md:flex-row md:items-center justify-between p-8 gap-8">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                                                                <Landmark className="w-6 h-6 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-black text-xl text-slate-900">{finding.asset.name}</h3>
                                                                    <Badge variant="secondary" className="rounded-lg bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase">
                                                                        {finding.asset.assetType}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm font-medium text-slate-400">
                                                                    Institution: {finding.asset.institution}
                                                                    {finding.asset.accountNumber && ` • Acct: ${finding.asset.accountNumber}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="outline" className="text-[10px] font-black border-amber-200 bg-amber-50 text-amber-700 py-1 uppercase tracking-widest gap-1.5">
                                                                <Zap className="w-3 h-3" />
                                                                {Math.round(finding.confidence * 100)}% Confidence Match
                                                            </Badge>
                                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                                                                <Search className="w-3 h-3" />
                                                                "...{finding.sourceText}..."
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 border-t md:border-t-0 pt-6 md:pt-0">
                                                        {finding.asset.value && (
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Value</p>
                                                                <div className="text-2xl font-black text-slate-900">
                                                                    ${finding.asset.value.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <Button
                                                            onClick={() => confirmMutation.mutate(finding.asset)}
                                                            className="rounded-2xl h-14 px-8 bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Add to Ledger
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Landmark(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="3" y1="22" x2="21" y2="22" />
            <line x1="6" y1="18" x2="6" y2="11" />
            <line x1="10" y1="18" x2="10" y2="11" />
            <line x1="14" y1="18" x2="14" y2="11" />
            <line x1="18" y1="18" x2="18" y2="11" />
            <polygon points="12 2 3 7 21 7 12 2" />
        </svg>
    );
}
