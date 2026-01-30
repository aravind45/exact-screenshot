import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Search, CheckCircle2, Sparkles, Plus, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
    const queryClient = useQueryClient();
    const [isDragging, setIsDragging] = useState(false);
    const [findings, setFindings] = useState<DiscoveredAsset[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

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
                            Asset Detective
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Upload tax returns, bank statements, or wills. Our AI will scan them for lost accounts.
                        </p>
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
                                    Support for PDF and Images. We extract institution names and values automatically.
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
                                Discovered Assets ({findings.length})
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
            </main>
        </div>
    );
}
