import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Search, CheckCircle2, Sparkles, Plus, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DiscoveryCategory, DiscoveryStatus } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
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

const CATEGORY_MAP: Record<string, { label: string, examples: string }> = {
    'BANK_ACCOUNTS': { label: 'Bank Accounts', examples: 'Checking, Savings' },
    'INVESTMENTS': { label: 'Investment Accounts', examples: 'Brokerage, IRA, 401(k)' },
    'EMPLOYER_BENEFITS': { label: 'Employer Benefits', examples: 'Life Insurance, Stock Plans, Final Pay' },
    'REAL_PROPERTY': { label: 'Real Property', examples: 'Primary Residence, Rental, Vacant Land' },
    'SAFE_DEPOSIT': { label: 'Safe Deposit Boxes', examples: 'Bank-held valuables' },
    'DIGITAL_ASSETS': { label: 'Digital Assets', examples: 'Crypto, PayPal, Venmo, Social Media' },
    'UNCLAIMED_PROPERTY': { label: 'Unclaimed Property', examples: 'State registry search' },
    'PERSONAL_PROPERTY': { label: 'Vehicles & Personal Property', examples: 'Cars, Jewelry, Art' },
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
                // Initialize if not found or error
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
            toast.success("Category updated");
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
            // We need a direct fetch here or extend api client to handle FormData
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
            else toast.info("No obvious assets found. Try another document?");
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
            // Remove from findings list
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

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-amber-500" />
                            Discovery Assistant
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Analyzes provided documents to suggest potential accounts for your review and systematic ledger entry.
                        </p>
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                                <strong>Reasonable Diligence Notice:</strong> This tool assists in identifying potential assets from documents you provide.
                                It is not an exhaustive search. Verification of findings and documenting a systematic review of all asset classes is the responsibility of the executor to meet fiduciary standards.
                            </p>
                        </div>
                    </div>

                    {/* Discovery Completion Progress */}
                    {discoveryStatus && (
                        <Card className="border-indigo-100 bg-indigo-50/30">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h3 className="font-bold text-indigo-900">Systematic Review Progress</h3>
                                        <p className="text-xs text-indigo-600">
                                            {discoveryStatus.progress.completed} of {discoveryStatus.progress.total} categories reviewed
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-indigo-600">{discoveryStatus.progress.percentage}%</span>
                                    </div>
                                </div>
                                <Progress value={discoveryStatus.progress.percentage} className="h-2 bg-indigo-100" />
                                {discoveryStatus.progress.isComplete ? (
                                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-green-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Reasonable Diligence Standards Met
                                    </div>
                                ) : (
                                    <p className="mt-2 text-[10px] text-slate-400 italic">
                                        Note: All categories must be addressed to generate a defensible Fiduciary Activity Report.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Asset Coverage Matrix */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-indigo-600" />
                                Asset Coverage Matrix
                            </CardTitle>
                            <CardDescription>
                                Systematically review all asset classes to build a defensible record of reasonable care.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Examples</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {discoveryStatus?.categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">
                                                {CATEGORY_MAP[cat.category]?.label || cat.category}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {CATEGORY_MAP[cat.category]?.examples}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={cat.status === 'NOT_CHECKED' ? 'outline' : 'secondary'}
                                                    className={
                                                        cat.status === 'REVIEWED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            cat.status === 'NOT_FOUND' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                cat.status === 'NA' ? 'bg-slate-50 text-slate-500 border-slate-200' : ''
                                                    }
                                                >
                                                    {cat.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">Update</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Update {CATEGORY_MAP[cat.category]?.label} Diligence</DialogTitle>
                                                                <DialogDescription>
                                                                    Record findings or provide negative assurance for this category.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="space-y-2">
                                                                    <Label>Status</Label>
                                                                    <select
                                                                        className="w-full h-10 px-3 border rounded-md text-sm"
                                                                        defaultValue={cat.status}
                                                                        onChange={(e) => updateStatusMutation.mutate({ id: cat.id, status: e.target.value })}
                                                                    >
                                                                        <option value="NOT_CHECKED">Not Checked</option>
                                                                        <option value="REVIEWED">Reviewed (Assets Found)</option>
                                                                        <option value="NOT_FOUND">Not Found (Negative Finding)</option>
                                                                        <option value="NA">Not Applicable</option>
                                                                    </select>
                                                                </div>

                                                                {cat.status === 'REVIEWED' && (
                                                                    <div className="space-y-2">
                                                                        <Label>Evidence Source</Label>
                                                                        <Input
                                                                            placeholder="e.g. 2024 Tax Returns, Brokerage Statement"
                                                                            defaultValue={cat.evidenceSource}
                                                                            onBlur={(e) => updateStatusMutation.mutate({ id: cat.id, status: cat.status, evidenceSource: e.target.value })}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {cat.status === 'NOT_FOUND' && (
                                                                    <div className="space-y-2">
                                                                        <Label>Negative Assurance Statement</Label>
                                                                        <Textarea
                                                                            placeholder="e.g. Reviewed deceased's digital files and physical records; no evidence of cryptocurrency exchanges found."
                                                                            onBlur={(e) => negativeAssuranceMutation.mutate({ id: cat.id, statement: e.target.value })}
                                                                        />
                                                                        <p className="text-[10px] text-slate-400">
                                                                            This statement will be included in your Fiduciary Activity Report to prove diligent search.
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {cat.negativeFindings && cat.negativeFindings.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] uppercase text-slate-400">Logged Assurances</Label>
                                                                        {cat.negativeFindings.map(f => (
                                                                            <div key={f.id} className="text-xs p-2 bg-slate-50 rounded italic border-l-2 border-indigo-300">
                                                                                "{f.statement}"
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Systematic Discovery Upload Section */}
                    <div className="relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full z-10 shadow-lg">
                            SYSTEMATIC REVIEW HELPER
                        </div>

                        {/* Upload Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                            border-4 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer
                            ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}
                        `}
                        >
                            {analyzing ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <Search className="w-16 h-16 text-indigo-500 mb-4 animate-bounce" />
                                    <h3 className="text-xl font-bold text-slate-700">Analyzing Document...</h3>
                                    <p className="text-slate-500">Searching for keywords: "Chase", "401k", "Dividend"...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                                        <Upload className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                        Drag & Drop Documents
                                    </h3>
                                    <p className="text-slate-400 max-w-sm mx-auto mb-6">
                                        Support for PDF and Images. Assists in identifying potentially relevant data for your review.
                                    </p>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                                        Or Click to Upload
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
                                </div>
                            )}
                        </div>

                        {/* Findings Feed */}
                        {findings.length > 0 && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-8">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    Potential Findings ({findings.length})
                                </h2>

                                <div className="grid grid-cols-1 gap-4">
                                    {findings.map((finding, idx) => (
                                        <Card key={idx} className="border-l-4 border-l-amber-400">
                                            <CardContent className="flex items-center justify-between p-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-lg">{finding.asset.name}</h3>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {finding.asset.assetType}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
                                                            {Math.round(finding.confidence * 100)}% Match
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        Institution: {finding.asset.institution}
                                                        {finding.asset.accountNumber && ` • Acct: ${finding.asset.accountNumber}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 bg-slate-50 p-2 rounded w-fit">
                                                        <Search className="w-3 h-3" />
                                                        "{finding.sourceText}"
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {finding.asset.value && (
                                                        <div className="text-right mr-4">
                                                            <div className="text-sm text-slate-400">Est. Value</div>
                                                            <div className="text-xl font-bold text-slate-900">
                                                                ${finding.asset.value.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <Button
                                                        onClick={() => confirmMutation.mutate(finding.asset)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Add to Ledger
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
