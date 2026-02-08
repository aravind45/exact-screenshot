import React, { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
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
    'DEBTS_CREDITORS': { label: 'Debts & Creditors', examples: 'Credit Cards, Medical Bills, Utilities', closure: 'Creditor search complete' },
};

const CATEGORY_EDUCATION: Record<string, { why: string, how: string, samples: string[], pitfalls: string[], tips: string[] }> = {
    'BANK_ACCOUNTS': {
        why: 'Bank accounts are often the primary source of immediate liquidity for an estate.',
        how: 'Check the deceased\'s mail for monthly statements. Look for "POD" (Payable on Death) designations which bypass probate.',
        samples: ['Checking accounts', 'Savings accounts', 'Money Market accounts', 'Certificates of Deposit (CDs)'],
        pitfalls: ['Forgetting small local bank accounts', 'Assuming joint accounts automatic transfer (depends on state signature card)', 'Not checking for safe deposit boxes at the same branch'],
        tips: ['Request "Date of Death" balances for all accounts', 'Search for "escheatment" notices in mail']
    },
    'INVESTMENTS': {
        why: 'Brokerage and retirement accounts often represent the bulk of an estate\'s value.',
        how: 'Search for 1099-INT or 1099-DIV forms from tax years. These reveal where dividends were paid from.',
        samples: ['Brokerage accounts', 'IRAs (Traditional/Roth)', '401(k) / 403(b)', 'Individual Stocks'],
        pitfalls: ['Missing old employer plans', 'Not verifying listed beneficiaries', 'Assuming IRAs are part of a Will (usually they are contract-based)'],
        tips: ['Use an "Asset Search" service if you suspect hidden offshore accounts', 'Check for DRIP (Dividend Reinvestment) plans']
    },
    'REAL_PROPERTY': {
        why: 'Real estate requires formal title transfer and often represents the most complex legal step.',
        how: 'Search county recorder websites. Look for Deeds, Mortgages, and Property Tax bills.',
        samples: ['Primary residence', 'Vacation homes', 'Rental properties', 'Vacant land'],
        pitfalls: ['Forgetting timeshares', 'Unrecorded deeds from family transfers', 'Assuming "Joint Tenancy" without checking the actual deed language'],
        tips: ['Get a "Preliminary Title Report" to check for unknown liens', 'Verify if property is in a Trust']
    },
    'DIGITAL_ASSETS': {
        why: 'Modern estates often have significant value in accounts with no physical footprint.',
        how: 'Search email for subscription notices, crypto exchange registrations, or payment platform receipts.',
        samples: ['Cryptocurrency (Wallets/Exchanges)', 'PayPal/Venmo balances', 'Domain names', 'Monetized social media'],
        pitfalls: ['Losing private keys for crypto', 'Accounts being locked due to inactivity', 'Assuming family members have legal rights to access email passwords'],
        tips: ['Check for "Legacy Contact" settings on Google/Apple/Facebook', 'Look for hardware wallets (Ledger/Trezor) in physical office']
    },
    'DEBTS_CREDITORS': {
        why: 'Identifying all debts is critical for fiduciary protection. Paying heirs before creditors can make you personally liable.',
        how: 'Review physical mail (look for final notices), check medical statements from the last 6 months, and search for evidence of recurring utility payments.',
        samples: ['Credit cards', 'Medical/Hospital bills', 'Final utilities (Water/Electric/Gas)', 'Mortgages/HELOCs', 'Personal loans'],
        pitfalls: ['Overlooking hospital bills that arrive months later', 'Ignoring small utility "final" statements', 'Not checking the deceased\'s credit report for unknown accounts'],
        tips: ['Order a "Deceased Credit Report" from Equifax/Experian', 'Check the last 3 months of bank statements for auto-pay withdrawals']
    }
};

const DiscoveryInsights = ({ discoveryStatus, findings, estateInsights = [] }: { discoveryStatus: DiscoveryStatus | null, findings: DiscoveredAsset[], estateInsights?: any[] }) => {
    const insights = useMemo(() => {
        if (!discoveryStatus) return [];
        const result = [];
        const completedCount = discoveryStatus.categories.filter(c => c.status !== 'NOT_CHECKED').length;

        // Add backend-driven insights first
        estateInsights.forEach(ei => {
            result.push({
                type: ei.type.toUpperCase(),
                title: ei.title,
                content: ei.content,
                icon: ei.type === 'warning' ? AlertCircle : (ei.type === 'success' ? ShieldCheck : Sparkles)
            });
        });

        // 1. Progress-based insight
        if (completedCount < 4) {
            result.push({
                type: 'ADVICE',
                title: 'Diligence Check',
                content: 'You\'ve only reviewed a few categories. Thorough discovery is key to avoiding future legal claims.',
                icon: Clock
            });
        }

        // 2. Pattern-based insight: No investments found
        if (result.length < 4) { // Cap insights to avoid clutter
            const invCat = discoveryStatus.categories.find(c => c.category === 'INVESTMENTS');
            const bankCat = discoveryStatus.categories.find(c => c.category === 'BANK_ACCOUNTS');
            if (bankCat?.status === 'REVIEWED' && invCat?.status === 'NOT_CHECKED') {
                result.push({
                    type: 'TIP',
                    title: 'Check Transfers',
                    content: 'Found bank accounts? Review statements for recurring transfers to brokerage or retirement accounts.',
                    icon: Zap
                });
            }

            // 3. Debt-specific insight
            const debtCat = discoveryStatus.categories.find(c => c.category === 'DEBTS_CREDITORS');
            if (debtCat?.status === 'NOT_CHECKED' && completedCount > 2) {
                result.push({
                    type: 'WARNING',
                    title: 'Potential Creditors',
                    content: 'Assets are surfacing. Have you checked for corresponding debts? Unpaid creditors can challenge distributions later.',
                    icon: AlertCircle
                });
            }
        }

        return result.slice(0, 4); // Show top 4 most relevant insights
    }, [discoveryStatus, findings, estateInsights]);

    if (insights.length === 0) return null;

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">AI Discovery Insights</h3>
            </div>
            <div className="flex flex-col gap-3">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start hover:bg-indigo-100/50 transition-colors">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                            <insight.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-indigo-900 tracking-tight mb-0.5">{insight.title}</h4>
                            <p className="text-xs text-indigo-700 font-medium leading-relaxed italic">
                                "{insight.content}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
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
        address?: string;
    };
    educationalNote?: string;
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

            let status = await api.getDiscoveryStatus(estate.id);

            // If no categories, initialize and fetch again
            if (!status.categories || status.categories.length === 0) {
                console.log("Initializing discovery categories...");
                await api.initializeDiscoveryCategories(estate.id);
                status = await api.getDiscoveryStatus(estate.id);
            }

            return {
                ...status,
                estateId: estate.id
            };
        },
        enabled: !!user?.id
    });

    // Estate-wide insights from Multi-document Intelligence
    const { data: estateInsights } = useQuery({
        queryKey: ["discovery-insights", discoveryStatus?.estateId],
        queryFn: () => api.getDiscoveryInsights(discoveryStatus!.estateId),
        enabled: !!discoveryStatus?.estateId
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, evidenceSource }: { id: string, status: string, evidenceSource?: string }) =>
            api.updateDiscoveryCategory(id, { status, evidenceSource }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discovery-status"] });
            queryClient.invalidateQueries({ queryKey: ["discovery-insights"] });
            toast.success("Diligence record updated");
        }
    });

    const negativeAssuranceMutation = useMutation({
        mutationFn: ({ id, statement }: { id: string, statement: string }) =>
            api.addNegativeAssurance(id, statement),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discovery-status"] });
            queryClient.invalidateQueries({ queryKey: ["discovery-insights"] });
            toast.success("Negative assurance logged");
        }
    });

    const analyzeMutation = useMutation({
        mutationFn: (file: File) => api.analyzeDiscoveryDocument(file, discoveryStatus!.estateId),
        onSuccess: (data) => {
            setFindings(data.findings);
            setAnalyzing(false);
            queryClient.invalidateQueries({ queryKey: ["discovery-insights"] });
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
            <SEO
                title="Discovery Assistant"
                description="Systematically identify and document estate assets. Build a defensible record of reasonable diligence for probate and fiduciary compliance."
            />
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8 pb-32">
                    <header className="flex justify-between items-start gap-8">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                                <Sparkles className="w-3.5 h-3.5" />
                                Forensic Diligence Protocol
                            </div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Discovery Assistant</h1>
                            <p className="text-[10px] font-medium text-slate-500 leading-tight">
                                Forensic protocol for identifying estate assets.
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-600 hover:bg-slate-50 px-4 h-9 text-[10px]">
                                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Standards
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
                                "border-2 border-dashed rounded-[2rem] p-6 text-center transition-all cursor-pointer relative",
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
                                        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">
                                            Evidence Upload
                                        </h3>
                                        <p className="text-[10px] font-medium text-slate-400 max-w-lg mb-3">
                                            Auto-detect assets from tax returns or statements.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-8 px-4 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100">
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
                                                <CardContent className="p-6 space-y-4">
                                                    {/* Asset Header */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
                                                                <Sparkles className="w-5 h-5 text-amber-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="font-black text-lg text-slate-900">{finding.asset.name}</h3>
                                                                    <Badge variant="secondary" className="rounded-md bg-indigo-50 text-indigo-700 font-black text-[9px] uppercase">
                                                                        {finding.asset.assetType}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs font-medium text-slate-500 mt-1">
                                                                    {finding.asset.institution}
                                                                    {finding.asset.accountNumber && ` • Account ${finding.asset.accountNumber}`}
                                                                    {finding.asset.value && ` • $${finding.asset.value.toLocaleString()}`}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-1 italic">
                                                                    {finding.sourceText}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => confirmMutation.mutate(finding.asset)}
                                                            size="sm"
                                                            className="rounded-xl h-9 px-4 bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 shrink-0"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                            Add
                                                        </Button>
                                                    </div>

                                                    {/* Confidence Score */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-2 rounded-full transition-all duration-500",
                                                                    finding.confidence >= 0.8 ? "bg-emerald-500" :
                                                                        finding.confidence >= 0.6 ? "bg-amber-500" :
                                                                            "bg-slate-400"
                                                                )}
                                                                style={{ width: `${finding.confidence * 100}%` }}
                                                            />
                                                        </div>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-1.5 cursor-help">
                                                                        <span className="text-xs font-bold text-slate-600">
                                                                            {Math.round(finding.confidence * 100)}% confident
                                                                        </span>
                                                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs">
                                                                    <p className="text-xs">
                                                                        Confidence based on document patterns, keyword matches, and proximity of related information.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>

                                                    {/* Educational Note */}
                                                    {finding.educationalNote && (
                                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                                            <div className="flex items-start gap-2">
                                                                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-xs font-black text-blue-900 mb-1.5 uppercase tracking-wider">
                                                                        Why This Matters
                                                                    </h4>
                                                                    <p className="text-xs text-blue-700 leading-relaxed">
                                                                        {finding.educationalNote}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
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
                                className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                                                            <DialogContent className="rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto">
                                                                <DialogHeader>
                                                                    <div className="flex items-center gap-4 mb-2">
                                                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                                                                            <Search className="w-6 h-6 text-indigo-600" />
                                                                        </div>
                                                                        <div>
                                                                            <DialogTitle className="text-2xl font-black text-slate-900">
                                                                                {CATEGORY_MAP[cat.category]?.label}
                                                                            </DialogTitle>
                                                                            <DialogDescription className="text-slate-500 font-medium">
                                                                                {CATEGORY_MAP[cat.category]?.examples}
                                                                            </DialogDescription>
                                                                        </div>
                                                                    </div>
                                                                </DialogHeader>

                                                                <div className="space-y-8 py-4">
                                                                    {/* Educational Brief */}
                                                                    {CATEGORY_EDUCATION[cat.category] && (
                                                                        <div className="flex flex-col gap-6">
                                                                            <div className="space-y-4">
                                                                                <div className="space-y-1">
                                                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Why it matters</h4>
                                                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                                                        {CATEGORY_EDUCATION[cat.category].why}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to search</h4>
                                                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                                                        {CATEGORY_EDUCATION[cat.category].how}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-4 bg-slate-50 rounded-3xl p-5 border border-slate-100">
                                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Common Samples</h4>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {CATEGORY_EDUCATION[cat.category].samples.map((s, i) => (
                                                                                        <Badge key={i} variant="outline" className="bg-white text-slate-600 border-slate-200">
                                                                                            {s}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <Separator />

                                                                    <div className="space-y-4">
                                                                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Update Diligence Status</Label>
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                            {[
                                                                                { value: 'REVIEWED', label: 'Assets Found', icon: ShieldCheck, color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700' },
                                                                                { value: 'NOT_FOUND', label: 'None Found', icon: Search, color: 'border-amber-200 hover:bg-amber-50 text-amber-700' },
                                                                                { value: 'NA', label: 'Not Applicable', icon: AlertCircle, color: 'border-slate-200 hover:bg-slate-50 text-slate-500' },
                                                                                { value: 'NOT_CHECKED', label: 'Reset', icon: Clock, color: 'border-slate-100 text-slate-400' }
                                                                            ].map((opt) => (
                                                                                <button
                                                                                    key={opt.value}
                                                                                    onClick={() => updateStatusMutation.mutate({ id: cat.id, status: opt.value })}
                                                                                    className={cn(
                                                                                        "h-20 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all",
                                                                                        cat.status === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2" :
                                                                                            `bg-white ${opt.color}`
                                                                                    )}
                                                                                >
                                                                                    <opt.icon className={cn("w-5 h-5", cat.status === opt.value ? "text-white" : "")} />
                                                                                    <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Pro Tips & Pitfalls */}
                                                                    {CATEGORY_EDUCATION[cat.category] && (
                                                                        <div className="space-y-4">
                                                                            <div className="flex flex-col gap-4">
                                                                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                                                                                    <h5 className="text-[10px] font-black text-rose-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                                                        Common Pitfalls
                                                                                    </h5>
                                                                                    <ul className="space-y-1.5">
                                                                                        {CATEGORY_EDUCATION[cat.category].pitfalls.map((p, i) => (
                                                                                            <li key={i} className="text-xs text-rose-700 font-medium leading-relaxed">• {p}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                                                                    <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                                        <Zap className="w-3.5 h-3.5" />
                                                                                        Pro Tips
                                                                                    </h5>
                                                                                    <ul className="space-y-1.5">
                                                                                        {CATEGORY_EDUCATION[cat.category].tips.map((t, i) => (
                                                                                            <li key={i} className="text-xs text-emerald-700 font-medium leading-relaxed">• {t}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <Separator />

                                                                    {cat.status === 'REVIEWED' && (
                                                                        <div className="space-y-3">
                                                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Evidence Source</Label>
                                                                            <div className="relative">
                                                                                <Input
                                                                                    className="rounded-2xl h-12 border-slate-200 pl-4"
                                                                                    placeholder="e.g. 2024 Tax Returns, Month-End Statement"
                                                                                    defaultValue={cat.evidenceSource}
                                                                                    onBlur={(e) => updateStatusMutation.mutate({ id: cat.id, status: cat.status, evidenceSource: e.target.value })}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {cat.status === 'NOT_FOUND' && (
                                                                        <div className="space-y-3">
                                                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Statement of Diligence</Label>
                                                                            <Textarea
                                                                                className="rounded-3xl border-slate-200 min-h-[100px] p-4 text-sm font-medium"
                                                                                placeholder="Affirm that you have searched all reasonable locations for these assets..."
                                                                                defaultValue={cat.negativeFindings?.[0]?.statement}
                                                                                onBlur={(e) => negativeAssuranceMutation.mutate({ id: cat.id, statement: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <DialogFooter className="sm:justify-start">
                                                                    <DialogTrigger asChild>
                                                                        <Button type="button" className="rounded-2xl h-12 px-8 bg-slate-900 font-black text-xs uppercase tracking-widest">
                                                                            Done
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                </DialogFooter>
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

                    {/* Smart Insights Section */}
                    <DiscoveryInsights
                        discoveryStatus={discoveryStatus}
                        findings={findings}
                        estateInsights={estateInsights}
                    />
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

function Separator() {
    return <div className="h-px bg-slate-100 w-full" />;
}
