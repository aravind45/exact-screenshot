import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Search, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { DocumentScanner } from "@/components/DocumentScanner";
import { Sidebar } from "@/components/Sidebar";

export default function UploadDocument() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [scannedData, setScannedData] = useState<any>(null);

    const handleScanComplete = (data: any) => {
        setScannedData(data);
    };

    const handleCreateAsset = async () => {
        if (!scannedData) return;
        try {
            await api.createAsset({
                institution: scannedData.institution || "Unknown",
                assetType: scannedData.assetType || "other",
                category: scannedData.category || "financial",
                value: scannedData.value || 0,
                accountNumber: scannedData.accountNumber,
                status: "discovered",
                priority: "medium"
            });
            toast({
                title: "Asset Created",
                description: "Asset created from document data.",
            });
            navigate("/dashboard");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create asset.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-background">
                <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="section-container">
                    <div className="flex items-center h-16">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate("/dashboard")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <h1 className="ml-4 font-bold text-lg">Upload Document</h1>
                    </div>
                </div>
            </header>

            <main className="section-container py-8 max-w-2xl">
                <div className="card-elevated p-6 space-y-6">

                    {!scannedData ? (
                        <DocumentScanner onScanComplete={handleScanComplete} />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 flex items-center gap-3">
                                <Check className="w-5 h-5" />
                                <span className="font-semibold">Analysis Successful</span>
                            </div>

                            <div className="bg-muted/30 border rounded-lg p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">Extracted Details</h3>
                                    <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
                                        <Sparkles className="w-3 h-3" />
                                        AI Verified
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <span className="text-muted-foreground block">Institution</span>
                                        <span className="font-medium">{scannedData.institution}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Value</span>
                                        <span className="font-medium">${scannedData.value}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Type</span>
                                        <span className="font-medium capitalize">{scannedData.assetType}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Account #</span>
                                        <span className="font-medium">{scannedData.accountNumber || "N/A"}</span>
                                    </div>
                                </div>

                                {scannedData.reasoningChain && (
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                                            <span className="font-semibold text-primary not-italic mr-1">Detective Insight:</span>
                                            {scannedData.reasoningChain}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Agentic Insights: Hidden Assets Discovered */}
                            {scannedData.agentInsights && scannedData.agentInsights.length > 0 && (
                                <div className="p-5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Search className="w-5 h-5" />
                                        <h3 className="font-bold">The Detective found clues!</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        While analyzing this document, I found mentions of other potential assets you might want to track:
                                    </p>
                                    <div className="space-y-3">
                                        {scannedData.agentInsights.map((insight: any, i: number) => (
                                            <div key={i} className="bg-background border rounded-lg p-3 flex items-start gap-3 shadow-sm">
                                                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold">{insight.title}</p>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
                                                    <div className="pt-2 flex gap-2">
                                                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2">
                                                            Ignore
                                                        </Button>
                                                        <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                            Add to Discovery
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setScannedData(null)}
                                    className="flex-1"
                                >
                                    Scan Another
                                </Button>
                                <Button
                                    onClick={handleCreateAsset}
                                    className="flex-1 variant-success"
                                    variant="default"
                                >
                                    Save as New Asset
                                </Button>
                            </div>
                        </motion.div>
                    )}

                </div>
            </main>
            </div>
        </div>
    );
}
