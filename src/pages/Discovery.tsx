import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
    Search,
    ArrowLeft,
    Sparkles,
    Plus,
    X,
    ShieldAlert,
    TrendingUp,
    FileSearch,
    CheckCircle2,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentScanner } from "@/components/DocumentScanner";
import { Sidebar } from "@/components/Sidebar";

interface DiscoveredClue {
    id: string;
    title: string;
    message: string;
    institution: string;
    type: string;
    confidence: number;
    added?: boolean;
}

export default function Discovery() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [clues, setClues] = useState<DiscoveredClue[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedDoc, setLastScannedDoc] = useState<string | null>(null);


    const handleScanComplete = (data: any) => {
        setIsScanning(false);
        const newClues: DiscoveredClue[] = [];

        // 1. Convert Agent Insights (Forensic Clues)
        if (data.agentInsights && data.agentInsights.length > 0) {
            data.agentInsights.forEach((insight: any, index: number) => {
                const institution = insight.data?.institution || "Unknown";
                const type = insight.data?.type || "account";

                // Avoid visual duplicates in the findings list
                const isDuplicate = newClues.some(c =>
                    c.institution.toLowerCase() === institution.toLowerCase() &&
                    c.type.toLowerCase() === type.toLowerCase()
                );

                if (!isDuplicate) {
                    newClues.push({
                        id: `clue-forensic-${Date.now()}-${index}`,
                        title: insight.title,
                        message: insight.message,
                        institution,
                        type,
                        confidence: insight.data?.confidence || 0.85,
                        added: false
                    });
                }
            });
        }

        // 2. Capture the Primary Extraction as a clue if it's meaningful AND not duplicate
        if (data.institution && data.institution !== "Unknown") {
            const isDuplicate = newClues.some(c =>
                c.institution.toLowerCase() === data.institution.toLowerCase() &&
                c.type.toLowerCase() === (data.assetType || "account").toLowerCase()
            );

            if (!isDuplicate) {
                newClues.push({
                    id: `clue-primary-${Date.now()}`,
                    title: "Primary Asset/Lead Identified",
                    message: data.reasoningChain || `I've identified a record for ${data.institution}.`,
                    institution: data.institution,
                    type: data.assetType || "account",
                    confidence: 0.95,
                    added: false
                });
            }
        }

        if (newClues.length > 0) {
            setClues(prev => [...newClues, ...prev]);
            toast({
                title: "Detective Success!",
                description: `Identified ${newClues.length} potential leads in the document.`,
            });
        } else {
            toast({
                title: "Analysis Complete",
                description: "No hidden assets or leads were found in this specific document.",
            });
        }
    };

    const queryClient = useQueryClient();

    const handleAddAsset = async (clue: DiscoveredClue) => {
        try {
            await api.createAsset({
                institution: clue.institution,
                assetType: clue.type,
                category: "financial", // Defaulting, AI might provide better later
                status: "discovered",
                priority: "medium",
                notes: `Automatically discovered by the Asset Detective. Source clue: ${clue.message}`
            });

            queryClient.invalidateQueries({ queryKey: ['assets'] });

            setClues(prev => prev.map(c => c.id === clue.id ? { ...c, added: true } : c));

            toast({
                title: "Asset Added",
                description: `${clue.institution} ${clue.type} has been added to your inventory.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add asset.",
                variant: "destructive",
            });
        }
    };

    const removeClue = (id: string) => {
        setClues(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-background text-foreground">
                {/* Header */}
                <header className="sticky top-0 z-40 glass border-b border-border/50">
                    <div className="section-container">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-lg leading-none">Asset Detective</h1>
                                        <p className="text-xs text-muted-foreground mt-1">Discovery Agent Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    AI Forensic Mode
                                </Badge>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="section-container py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Column: Scanner & Guidance */}
                        <div className="lg:col-span-5 space-y-6">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileSearch className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold">Deep Scan Document</h2>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Upload bank statements, insurance policies, or tax returns. The Detective will look for transfers, "Summary of Holdings", or hidden dividends that point to other accounts.
                                </p>

                                <DocumentScanner
                                    onScanStart={() => {
                                        setIsScanning(true);
                                        setClues([]); // Clear previous results to avoid confusion
                                    }}
                                    onScanComplete={handleScanComplete}
                                    onScanError={() => setIsScanning(false)}
                                    className="mt-6"
                                    saveToVault={true}
                                    documentType="DISCOVERY_LOG"
                                />

                                <div className="bg-muted/30 border border-border/50 rounded-xl p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-primary">
                                        <ShieldAlert className="w-4 h-4" />
                                        <h3 className="text-sm font-semibold italic">Detective's Tip</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        "Look for ACH transfers or wire instructions. Often, a single Checking statement reveals a hidden Brokerage account or a secondary Savings account at a different firm."
                                    </p>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Findings */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold">Discovery Findings</h2>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                    {clues.length} Hidden Clues
                                </span>
                            </div>


                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {isScanning ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-20 bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl text-center"
                                        >
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Search className="w-6 h-6 text-primary animate-pulse" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-primary mt-6">Detective is investigating...</h3>
                                            <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium">
                                                Running forensic scan on your document to find hidden clues and assets.
                                            </p>
                                        </motion.div>
                                    ) : clues.length === 0 ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-xl text-center"
                                        >
                                            <div className="p-4 rounded-full bg-muted mb-4">
                                                <Search className="w-10 h-10 text-muted-foreground/30" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-muted-foreground">No hidden assets discovered yet</h3>
                                            <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
                                                Upload a document on the left to start the forensic investigation.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        clues.map((clue) => (
                                            <motion.div
                                                key={clue.id}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`relative overflow-hidden group border-2 border-l-4 rounded-xl p-5 shadow-sm transition-all ${clue.added
                                                    ? 'bg-muted/50 border-muted opacity-80'
                                                    : 'bg-card border-border hover:border-primary/50 border-l-primary'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-1 pr-8">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-lg">{clue.institution}</h3>
                                                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 uppercase font-black tracking-wider bg-primary/10 text-primary border-none">
                                                                {clue.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm font-medium text-foreground/80 leading-snug">
                                                            {clue.title}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed italic">
                                                            "{clue.message}"
                                                        </p>
                                                    </div>

                                                    {!clue.added ? (
                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                                                                onClick={() => handleAddAsset(clue)}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                Claim Asset
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-muted-foreground hover:text-destructive"
                                                                onClick={() => removeClue(clue.id)}
                                                            >
                                                                <X className="w-4 h-4 mr-2" />
                                                                Dismiss
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="default" className="bg-green-500 hover:bg-green-500 gap-1 py-1 px-3">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Added
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Matching Confidence Sub-Bar */}
                                                {!clue.added && (
                                                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${clue.confidence * 100}%` }}
                                                                    className="h-full bg-primary"
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                {Math.round(clue.confidence * 100)}% Confidence
                                                            </span>
                                                        </div>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary group-hover:gap-1 transition-all">
                                                            View context <ChevronRight className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
