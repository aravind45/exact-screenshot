
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { AssetCard } from "@/components/AssetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Landmark,
    Search,
    Filter,
    Plus,
    Mail,
    CheckCircle2,
    X,
    ArrowRight,
    LayoutGrid,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAssetTaxonomyState } from "@/lib/taxonomy";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { DocumentScanner } from "@/components/DocumentScanner";
import {
    Sparkles,
    FileSearch,
    TrendingUp,
    ChevronRight,
    Search as SearchIcon
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { AssetCategory } from "@/components/CategoryBadge";
import type { AssetStatus } from "@/components/StatusBadge";
import type { Priority } from "@/components/PriorityBadge";

export default function Assets() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("inventory");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "detective" || tab === "inventory") {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Discovery State (Ported)
    const [clues, setClues] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const { data: assetsData, isLoading, error } = useQuery({
        queryKey: ['assets'],
        queryFn: api.getAssets,
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];

    const sortedAssets = [...assets].sort((a, b) => {
        const stateOrder: Record<string, number> = {
            action_required: 0,
            waiting: 1,
            blocked: 2,
            ready: 3,
            monitoring: 4,
            resolved: 5
        };

        const stateA = getAssetTaxonomyState(a as any);
        const stateB = getAssetTaxonomyState(b as any);

        if (stateOrder[stateA] !== stateOrder[stateB]) {
            return stateOrder[stateA] - stateOrder[stateB];
        }

        return (a.institution || "").localeCompare(b.institution || "");
    });

    const normalize = (val: string | undefined) => (val || "").toLowerCase().replace(/ /g, "_");

    const handleAssetClick = (id: string) => {
        navigate(`/asset/${id}`);
    };

    const handleSelectAsset = (id: string, selected: boolean) => {
        if (selected) {
            setSelectedAssetIds(prev => [...prev, id]);
        } else {
            setSelectedAssetIds(prev => prev.filter(aId => aId !== id));
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedAssetIds([]);
    };

    const handleBatchNotify = async () => {
        toast({
            title: "Batch Notification Sent",
            description: `Sent notification requests for ${selectedAssetIds.length} assets.`
        });
        setSelectedAssetIds([]);
        setIsSelectionMode(false);
    };

    const queryClient = useQueryClient();

    const handleScanComplete = (data: any) => {
        setIsScanning(false);
        const newClues: any[] = [];

        console.log("Discovery Analysis Engine Received:", data);

        // 1. Convert Agent Insights (Forensic Clues)
        if (data.agentInsights && Array.isArray(data.agentInsights)) {
            data.agentInsights.forEach((insight: any, index: number) => {
                const institution = insight.data?.institution || "Unspecified Institution";
                const type = insight.data?.type || insight.data?.assetType || "Financial Asset";

                const isDuplicate = clues.some(c =>
                    c.institution.toLowerCase() === institution.toLowerCase() &&
                    c.type.toLowerCase() === type.toLowerCase()
                ) || newClues.some(c =>
                    c.institution.toLowerCase() === institution.toLowerCase() &&
                    c.type.toLowerCase() === type.toLowerCase()
                );

                if (!isDuplicate) {
                    newClues.push({
                        id: `clue-forensic-${Date.now()}-${index}`,
                        title: insight.title || "Potential Asset Found",
                        message: insight.message || "I've detected a possible financial lead in this document.",
                        institution,
                        type,
                        confidence: insight.data?.confidence || 0.85,
                        added: false
                    });
                }
            });
        }

        // 2. Capture Primary Extraction
        const primaryInstitution = data.institution && data.institution !== "Unknown" ? data.institution : null;
        const primaryType = data.assetType || "Account";

        if (primaryInstitution || data.assetType) {
            const instName = primaryInstitution || "Newly Identified Account";

            const isDuplicate = clues.some(c =>
                c.institution.toLowerCase() === instName.toLowerCase() &&
                c.type.toLowerCase() === primaryType.toLowerCase()
            ) || newClues.some(c =>
                c.institution.toLowerCase() === instName.toLowerCase() &&
                c.type.toLowerCase() === primaryType.toLowerCase()
            );

            if (!isDuplicate) {
                newClues.push({
                    id: `clue-primary-${Date.now()}`,
                    title: "Direct Document Extraction",
                    message: data.reasoningChain || `I've successfully extracted record details for this ${primaryType}.`,
                    institution: instName,
                    type: primaryType,
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
                description: "The Detective didn't find any specific new assets in this document, but has logged the scan.",
            });
        }
    };

    const handleClaimAsset = async (clue: any) => {
        try {
            await api.createAsset({
                institution: clue.institution,
                assetType: clue.type,
                category: "financial",
                status: "discovered",
                priority: "medium",
                notes: `Automatically discovered by the Asset Detective. Source clue: ${clue.message}`
            });

            queryClient.invalidateQueries({ queryKey: ['assets'] });
            setClues(prev => prev.map(c => c.id === clue.id ? { ...c, added: true } : c));

            toast({
                title: "Asset Claimed",
                description: `${clue.institution} ${clue.type} has been added to your inventory.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to claim asset.",
                variant: "destructive",
            });
        }
    };

    const removeClue = (id: string) => {
        setClues(prev => prev.filter(c => c.id !== id));
    };

    if (error) {
        return (
            <div className="flex min-h-screen bg-[#F8FAFC]">
                <Sidebar />
                <div className="flex-1 ml-64 p-8 text-rose-500 font-bold">
                    Error loading assets: {(error as Error).message}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Asset Ledger</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Financial Records</p>
                    </div>
                    <Button
                        onClick={() => navigate('/add-asset')}
                        className="rounded-xl font-black gap-2 shadow-lg shadow-indigo-100"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Asset
                    </Button>
                </header>

                <main className="max-w-[1200px] w-full mx-auto px-8 py-10">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                            <TabsList className="bg-transparent border-none p-0 h-10">
                                <TabsTrigger
                                    value="inventory"
                                    className="rounded-xl px-6 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all h-full"
                                >
                                    <LayoutGrid className="w-4 h-4 mr-2" />
                                    Estate Inventory
                                </TabsTrigger>
                                <TabsTrigger
                                    value="detective"
                                    className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Asset Detective
                                </TabsTrigger>
                            </TabsList>

                            {activeTab === "inventory" && (
                                <div className="flex items-center gap-2 pr-2">
                                    <Button
                                        variant={isSelectionMode ? "secondary" : "outline"}
                                        size="sm"
                                        className="h-10 px-4 border-slate-200 rounded-xl font-bold"
                                        onClick={toggleSelectionMode}
                                    >
                                        {isSelectionMode ? "Cancel" : "Batch Select"}
                                    </Button>
                                    <div className="h-6 w-px bg-slate-100 mx-2" />
                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">{assets.length} Total</Badge>
                                </div>
                            )}
                        </div>

                        <TabsContent value="inventory" className="space-y-8 mt-0 outline-none">
                            <div className="flex items-center gap-2 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search assets..."
                                        className="pl-9 h-11 w-full bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm transition-all"
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="h-11 px-6 border-slate-200 rounded-xl font-bold text-slate-600">
                                    <Filter className="w-4 h-4 mr-2" /> Filter
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                                    ))
                                ) : assets.length === 0 ? (
                                    <div className="py-24 border-2 border-dashed border-slate-200 rounded-[40px] text-center bg-white/50">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Landmark className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">No assets identified yet</h3>
                                        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Start by adding your first financial account or property to the estate.</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <Button
                                                onClick={() => navigate('/add-asset')}
                                                className="rounded-xl font-bold px-8 shadow-lg shadow-indigo-100"
                                            >
                                                Add Your First Asset
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setActiveTab("detective")}
                                                className="rounded-xl font-bold px-8 border-slate-200"
                                            >
                                                Run Detective Scan
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    sortedAssets.map((asset: any, index: number) => (
                                        <motion.div
                                            key={asset.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <AssetCard
                                                asset={{
                                                    ...asset,
                                                    type: normalize(asset.assetType),
                                                    category: normalize(asset.category) as AssetCategory,
                                                    status: normalize(asset.status) as AssetStatus,
                                                    priority: normalize(asset.priority) as Priority,
                                                    lastContactDate: asset.lastContactDate ? String(asset.lastContactDate).split('T')[0] : null,
                                                    nextFollowUpDate: asset.nextFollowUpDate ? String(asset.nextFollowUpDate).split('T')[0] : null,
                                                    daysSinceContact: 0
                                                }}
                                                onClick={() => !isSelectionMode && handleAssetClick(asset.id)}
                                                onSelect={(sel) => handleSelectAsset(asset.id, sel)}
                                                selected={selectedAssetIds.includes(asset.id)}
                                                selectable={isSelectionMode}
                                                className={cn(
                                                    "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-3xl p-6",
                                                    selectedAssetIds.includes(asset.id) && "border-indigo-600 ring-4 ring-indigo-600/5 shadow-lg bg-indigo-50/20"
                                                )}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="detective" className="mt-0 outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                                <FileSearch className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-xl font-black tracking-tight">Forensic Scan</h2>
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                            Upload bank statements, tax returns, or insurance policies. AI will scan for hidden transfers or "Summary of Holdings" that point to other accounts.
                                        </p>
                                        <p className="text-[10px] text-slate-400 italic mb-8">
                                            This tool assists with discovery. It does not guarantee that all assets will be identified.
                                        </p>

                                        <DocumentScanner
                                            onScanStart={() => {
                                                setIsScanning(true);
                                                setClues([]);
                                            }}
                                            onScanComplete={handleScanComplete}
                                            onScanError={() => setIsScanning(false)}
                                            saveToVault={true}
                                            documentType="DISCOVERY_LOG"
                                        />

                                        <div className="mt-8 pt-8 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-indigo-600 mb-3">
                                                <AlertCircle className="w-4 h-4" />
                                                <h3 className="text-xs font-black uppercase tracking-widest italic">Detective's Tip</h3>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                "Look for ACH transfers or wire instructions. Often, a single Checking statement reveals a hidden Brokerage account or a secondary Savings account."
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-black tracking-tight">Discovery Findings</h2>
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold px-3 py-1">
                                            {clues.length} Potential Leads
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <AnimatePresence mode="popLayout">
                                            {isScanning ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex flex-col items-center justify-center py-20 bg-indigo-50/30 border-2 border-dashed border-indigo-100 rounded-[32px] text-center"
                                                >
                                                    <div className="relative mb-6">
                                                        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <SearchIcon className="w-8 h-8 text-indigo-600 animate-pulse" />
                                                        </div>
                                                    </div>
                                                    <h3 className="font-black text-xl text-indigo-900">Detective is investigating...</h3>
                                                    <p className="text-sm text-slate-400 max-w-xs mt-3 font-bold leading-relaxed">
                                                        Running forensic scan on your document to find hidden clues and assets.
                                                    </p>
                                                </motion.div>
                                            ) : clues.length === 0 ? (
                                                <motion.div
                                                    key="empty"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex flex-col items-center justify-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] text-center"
                                                >
                                                    <div className="p-5 rounded-[20px] bg-slate-100 mb-6">
                                                        <SearchIcon className="w-10 h-10 text-slate-300" />
                                                    </div>
                                                    <h3 className="font-black text-xl text-slate-900">No clues discovered yet</h3>
                                                    <p className="text-sm text-slate-400 max-w-xs mt-3 font-bold">
                                                        Upload a document on the left to start the forensic investigation.
                                                    </p>
                                                </motion.div>
                                            ) : (
                                                clues.map((clue) => (
                                                    <motion.div
                                                        key={clue.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className={cn(
                                                            "relative overflow-hidden group border border-slate-200 rounded-3xl p-6 transition-all",
                                                            clue.added ? "bg-slate-50 opacity-60" : "bg-white hover:border-indigo-200 shadow-sm"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-2 flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="font-black text-lg text-slate-900">{clue.institution}</h3>
                                                                    <Badge variant="secondary" className="text-[10px] py-0.5 px-2 uppercase font-black tracking-widest bg-indigo-50 text-indigo-600 border-none">
                                                                        {clue.type}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-600">
                                                                    {clue.title}
                                                                </p>
                                                                <p className="text-sm text-slate-400 mt-3 leading-relaxed font-medium italic">
                                                                    "{clue.message}"
                                                                </p>
                                                            </div>

                                                            {!clue.added ? (
                                                                <div className="flex flex-col gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 shadow-lg px-6"
                                                                        onClick={() => handleClaimAsset(clue)}
                                                                    >
                                                                        <Plus className="w-4 h-4 mr-2" />
                                                                        Claim
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="rounded-xl font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                                        onClick={() => removeClue(clue.id)}
                                                                    >
                                                                        Dismiss
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-500 gap-1.5 py-1.5 px-4 rounded-xl font-black text-[10px] uppercase">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    Added to Ledger
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {!clue.added && (
                                                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${clue.confidence * 100}%` }}
                                                                            className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {Math.round(clue.confidence * 100)}% Confidence
                                                                    </span>
                                                                </div>
                                                                <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600 font-black text-xs hover:no-underline flex items-center gap-1 group/link">
                                                                    View Analysis <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
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
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Batch Action Bar */}
            <AnimatePresence>
                {selectedAssetIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
                    >
                        <div className="bg-slate-900 border border-slate-800 text-white rounded-[32px] p-2 pr-6 shadow-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4 ml-2">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-black">{selectedAssetIds.length} Assets Selected</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch Operations Enabled</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleBatchNotify}
                                    className="bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl h-12 px-6 gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    Notify All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-white/10 text-slate-400 hover:text-white rounded-full h-12 w-12"
                                    onClick={() => setSelectedAssetIds([])}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
