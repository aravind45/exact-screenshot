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
                <div className="max-w-4xl mx-auto space-y-8 pb-32">
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

                    {/* ACTION AREA: Forensic Review Helper (Moved to Top) */}
                    <div className="relative">
                        <div className="absolute -top-3 left-6 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-full z-10 shadow-lg tracking-[0.2em] uppercase">
                            Analysis Engine
                        </div>

                        {/* Upload Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={cn(
                                "border-3 border-dashed rounded-[3rem] p-12 text-center transition-all cursor-pointer relative",
                                isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/30'
                            )}
                        >
                            {analyzing ? (
                                <div className="flex flex-col items-center animate-pulse py-4">
                                    <div className="relative">
                                        <Search className="w-16 h-16 text-indigo-500 animate-bounce" />
                                        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full animate-ping opacity-20" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mt-6 tracking-tight">Analyzing Intelligence...</h3>
                                    <p className="text-sm font-medium text-slate-400 mt-2 max-w-sm mx-auto">
                                        Scanning document for institutional keywords, account numbers, and ownership markers.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-8 text-left">
                                    {/* Simplified Horizontal Layout */}
                                    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                                        <Upload className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                                            Drag & Drop Evidence
                                        </h3>
                                        <p className="text-sm font-medium text-slate-400 max-w-lg mb-4">
                                            Upload statements or tax returns to auto-detect assets.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">
                                                Select File
                                            </Button>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                PDF, JPG Supported
                                            </p>
                                        </div>
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
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Findings Feed */}
                        <AnimatePresence>
                            {findings.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6 mt-8"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-amber-500" />
                                            AI-Identified Potential Assets ({findings.length})
                                        </h2>
                                        <Button variant="ghost" size="sm" onClick={() => setFindings([])} className="text-slate-400 font-bold hover:text-rose-500 text-xs">
                                            Clear Results
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {findings.map((finding, idx) => (
                                            <Card key={idx} className="rounded-3xl border-none shadow-lg shadow-slate-200/50 overflow-hidden bg-white hover:scale-[1.01] transition-transform">
                                                <CardContent className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                                                                <Landmark className="w-5 h-5 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-black text-lg text-slate-900">{finding.asset.name}</h3>
                                                                    <Badge variant="secondary" className="rounded-md bg-indigo-50 text-indigo-700 font-black text-[9px] uppercase">
                                                                        {finding.asset.assetType}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs font-medium text-slate-400">
                                                                    {finding.asset.institution} {finding.asset.accountNumber && `• ${finding.asset.accountNumber}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => confirmMutation.mutate(finding.asset)}
                                                        size="sm"
                                                        className="rounded-xl h-10 px-6 bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 mr-2" />
                                                        Add
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Discovery Phase Complete Banner (Compact) */}
                    <AnimatePresence>
                        {discoveryStatus?.progress.isComplete && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-4"
                            >
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-emerald-900">Discovery Phase Complete</h3>
                                    <p className="text-xs text-emerald-700 font-medium leading-normal">
                                        All required asset categories have been systematically reviewed. Your diligence record is defensible.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Systematic Review Progress (Horizontal) */}
                    {discoveryStatus && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Score Card */}
                            <Card className="md:col-span-1 rounded-[2rem] border-none shadow-sm bg-white p-6 flex flex-col justify-center items-center text-center">
                                <div className="relative">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * discoveryStatus.progress.percentage) / 100} className="text-indigo-600 transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <span className="text-3xl font-black text-slate-900">{discoveryStatus.progress.percentage}%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Diligence Score</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">{discoveryStatus.progress.completed}/{discoveryStatus.progress.total} Categories</p>
                            </Card>

                            {/* Asset Coverage Matrix (Simplified list) */}
                            <Card className="md:col-span-2 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col">
                                <CardHeader className="p-6 border-b border-slate-50">
                                    <CardTitle className="text-lg font-black text-slate-900">Coverage Matrix</CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-y-auto max-h-[300px]">
                                    <Table>
                                        <TableBody>
                                            {discoveryStatus?.categories.map((cat) => (
                                                <TableRow key={cat.id} className="border-slate-50 hover:bg-slate-50/50">
                                                    <TableCell className="font-bold text-xs text-slate-700 py-4 pl-6">
                                                        {CATEGORY_MAP[cat.category]?.label}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider",
                                                                cat.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700' :
                                                                    cat.status === 'NOT_FOUND' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                            )}
                                                        >
                                                            {cat.status === 'REVIEWED' ? 'Found' : cat.status === 'NOT_FOUND' ? 'None' : 'Pending'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4 py-4">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-indigo-50 text-indigo-600">
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            {/* Reuse existing dialog content logic here... ideally extracted to subcomponent but keeping inline for complexity constraint */}
                                                            <DialogContent className="rounded-[2rem]">
                                                                {/* ... (Keep existing Dialog Content Logic) ... */}
                                                                <DialogHeader>
                                                                    <DialogTitle className="text-xl font-black">Verify {CATEGORY_MAP[cat.category]?.label}</DialogTitle>
                                                                </DialogHeader>
                                                                {/* ... (Same body as before) ... */}
                                                                {/* NOTE: For brevity in this tool call, I am assuming the Dialog Content needs to be fully retained. I will copy it back in next block if needed, but the tool instruction is to replace structure. I will paste the relevant parts to ensure it works. */}
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
                                                                    {/* ... (Rest of dialog logic preserved) ... */}
                                                                    {cat.status === 'REVIEWED' && (
                                                                        <div className="space-y-3">
                                                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Evidence Source</Label>
                                                                            <Input
                                                                                className="rounded-2xl h-12 border-slate-200"
                                                                                placeholder="e.g. 2024 Tax Returns"
                                                                                defaultValue={cat.evidenceSource}
                                                                                onBlur={(e) => updateStatusMutation.mutate({ id: cat.id, status: cat.status, evidenceSource: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {cat.status === 'NOT_FOUND' && (
                                                                        <Textarea
                                                                            className="rounded-3xl border-slate-200 min-h-[100px] p-4 text-sm font-medium"
                                                                            placeholder="Statement of negative assurance..."
                                                                            onBlur={(e) => negativeAssuranceMutation.mutate({ id: cat.id, statement: e.target.value })}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    )}
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
