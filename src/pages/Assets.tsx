
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
    AlertCircle,
    ShieldCheck,
    Scale,
    FileText,
    Lock,
    Users,
    Gavel,
    HelpCircle,
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
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getAssetTaxonomyState } from "@/lib/taxonomy";
import { classifyAsset, getSuggestedActions } from "@/lib/assetClassification";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { DocumentScanner } from "@/components/DocumentScanner";

function AssetItem({
    asset,
    index,
    isSelectionMode,
    selectedAssetIds,
    handleAssetClick,
    handleSelectAsset,
    normalize
}: any) {
    return (
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
                    category: normalize(asset.category),
                    status: normalize(asset.status),
                    priority: normalize(asset.priority),
                    authorityType: asset.authorityType,
                    lastContactDate: asset.lastContactDate ? String(asset.lastContactDate).split('T')[0] : null,
                    nextFollowUpDate: asset.nextFollowUpDate ? String(asset.nextFollowUpDate).split('T')[0] : null,
                    daysSinceContact: 0
                }}
                onClick={() => !isSelectionMode && handleAssetClick(asset.id)}
                onSelect={(sel: boolean) => handleSelectAsset(asset.id, sel)}
                selected={selectedAssetIds.includes(asset.id)}
                selectable={isSelectionMode}
                className={cn(
                    "bg-white border-slate-200 hover:border-primary/20 hover:shadow-md transition-all rounded-3xl p-6",
                    selectedAssetIds.includes(asset.id) && "border-primary ring-4 ring-primary/5 shadow-lg bg-primary/[0.02]"
                )}
            />
        </motion.div>
    );
}

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

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const isViewer = (estate as any)?.userRole === 'VIEWER';

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

    const authoritySummary = useMemo(() => {
        const counts: Record<string, number> = {
            COURT_REQUIRED: 0,
            TRUSTEE_DIRECT: 0,
            AFFIDAVIT_SMALL: 0,
            BENEFICIARY_CONTRACT: 0,
            SURVIVORSHIP_TITLE: 0,
            LITIGATION_HOLD: 0,
            UNSET: 0
        };
        assets.forEach((a: any) => {
            const type = a.authorityType || "UNSET";
            if (counts[type] !== undefined) counts[type]++;
            else counts.UNSET++;
        });
        return counts;
    }, [assets]);

    const groupedAssets = useMemo(() => {
        const groups = {
            PROBATE: [] as any[],
            NON_PROBATE: [] as any[],
            UNKNOWN: [] as any[]
        };
        sortedAssets.forEach((a: any) => {
            const legalClass = classifyAsset(a);
            groups[legalClass].push(a);
        });
        return groups;
    }, [sortedAssets]);

    const allSuggestedActions = useMemo(() => {
        const actionMap = new Map<string, any>();
        assets.forEach((a: any) => {
            const actions = getSuggestedActions(a);
            actions.forEach(action => {
                if (!actionMap.has(action.id)) {
                    actionMap.set(action.id, { ...action, relatedAssets: [a] });
                } else {
                    actionMap.get(action.id).relatedAssets.push(a);
                }
            });
        });
        return Array.from(actionMap.values()).sort((a, b) => b.priority === 'high' ? 1 : -1);
    }, [assets]);

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
            <DashboardLayout>
                <div className="p-8 text-rose-500 font-bold">
                    Error loading assets: {(error as Error).message}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <>
            <DashboardLayout maxWidth="max-w-[1200px]">
                <SEO
                    title="Asset Ledger"
                    description="Consolidate and track all estate assets, including bank accounts, real estate, and investments, in a secure and auditable ledger."
                />

                <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-12 flex items-center justify-between sticky top-0 z-10 -mx-6 -mt-6 mb-6 pt-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Asset Ledger</h1>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:block">Verified Financial Records</p>
                    </div>
                    {!isViewer && (
                        <Button
                            onClick={() => navigate('/add-asset')}
                            className="rounded-xl font-black gap-2 h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Asset
                        </Button>
                    )}
                </header>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                    <div className="flex items-center justify-between bg-white p-1.5 rounded-[2.25rem] border border-slate-100 shadow-sm">
                        <TabsList className="bg-transparent border-none p-0 h-11">
                            <TabsTrigger
                                value="inventory"
                                className="rounded-[1.75rem] px-10 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300 h-full"
                            >
                                <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                                Estate Inventory
                            </TabsTrigger>
                            <TabsTrigger
                                value="detective"
                                className="rounded-[1.75rem] px-10 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300 h-full"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-2" />
                                Asset Detective
                            </TabsTrigger>
                        </TabsList>

                        {activeTab === "inventory" && (
                            <div className="flex items-center gap-2 pr-2">
                                <Button
                                    variant={isSelectionMode ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-10 px-6 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest"
                                    onClick={toggleSelectionMode}
                                >
                                    {isSelectionMode ? "Cancel" : "Batch Select"}
                                </Button>
                                <div className="h-6 w-px bg-slate-200 mx-2" />
                                <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {assets.length} Total Accounts
                                </div>
                            </div>
                        )}
                    </div>

                    <TabsContent value="inventory" className="space-y-4 mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {/* Left Column: Asset List */}
                            <div className="lg:col-span-3 space-y-4">
                                {/* ── Compact Authority Chips Row ─────────────────────── */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[{ label: "Court", count: authoritySummary.COURT_REQUIRED, dot: "bg-rose-500" },
                                    { label: "Trust", count: authoritySummary.TRUSTEE_DIRECT, dot: "bg-emerald-500" },
                                    { label: "Affidavit", count: authoritySummary.AFFIDAVIT_SMALL, dot: "bg-amber-500" },
                                    { label: "Contract", count: authoritySummary.BENEFICIARY_CONTRACT, dot: "bg-indigo-500" },
                                    { label: "Title", count: authoritySummary.SURVIVORSHIP_TITLE, dot: "bg-slate-500" },
                                    { label: "Hold", count: authoritySummary.LITIGATION_HOLD, dot: "bg-red-700" }].map(chip => (
                                        <div key={chip.label} className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border shadow-sm text-[11px] font-black transition-all",
                                            chip.count > 0 ? "border-slate-200 text-slate-700" : "border-slate-100 text-slate-300"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", chip.count > 0 ? chip.dot : "bg-slate-200")} />
                                            <span className="uppercase tracking-wide">{chip.label}</span>
                                            <span className={cn("font-black", chip.count > 0 ? "text-slate-900" : "text-slate-300")}>{chip.count}</span>
                                        </div>
                                    ))}
                                    <div className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        {assets.length} total
                                    </div>
                                </div>

                                {/* ── Search + Filters ─────────────────────────────────── */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Search assets by institution, type, or status..."
                                            className="pl-9 h-9 bg-white border-slate-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <select className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer">
                                        <option value="">All Authority</option>
                                        <option value="COURT_REQUIRED">Court</option>
                                        <option value="TRUSTEE_DIRECT">Trust</option>
                                        <option value="AFFIDAVIT_SMALL">Affidavit</option>
                                        <option value="BENEFICIARY_CONTRACT">Contract</option>
                                        <option value="SURVIVORSHIP_TITLE">Title</option>
                                        <option value="LITIGATION_HOLD">Hold</option>
                                    </select>
                                    <select className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer">
                                        <option value="">All Status</option>
                                        <option value="discovered">Discovered</option>
                                        <option value="notified">Notified</option>
                                        <option value="claimed">Claimed</option>
                                        <option value="collected">Collected</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                {/* ── AI Actions Strip ─────────────────────────────────── */}
                                {allSuggestedActions.length > 0 && (
                                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white flex-shrink-0">
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1.5">
                                                {allSuggestedActions.length} Suggested Actions
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {allSuggestedActions.slice(0, 4).map((action, idx) => (
                                                    <div
                                                        key={idx}
                                                        title={action.description}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                                        onClick={() => {
                                                            if (action.id === 'wait_for_letters') {
                                                                navigate('/probate/letters');
                                                            } else if (action.relatedAssets?.[0]?.id) {
                                                                navigate(`/asset/${action.relatedAssets[0].id}`);
                                                            }
                                                        }}
                                                    >
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", action.priority === 'high' ? "bg-rose-500" : "bg-slate-400")} />
                                                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[160px]">{action.title}</span>
                                                        <ArrowRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                                    </div>
                                                ))}
                                                {allSuggestedActions.length > 4 && (
                                                    <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-indigo-500 font-black">
                                                        +{allSuggestedActions.length - 4} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 rounded-lg px-3 flex-shrink-0"
                                            onClick={() => setActiveTab("detective")}
                                        >
                                            Scan →
                                        </Button>
                                    </div>
                                )}

                                {/* ── Asset List ───────────────────────────────────────── */}
                                {isLoading ? (
                                    <div className="space-y-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-14 bg-white border border-slate-100 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : assets.length === 0 ? (
                                    <div className="py-20 border border-dashed border-slate-200 rounded-2xl text-center bg-white/50">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Landmark className="w-7 h-7 text-slate-300" />
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">No assets yet</h3>
                                        <p className="text-slate-400 text-xs mb-6 font-medium">Add your first financial account or property.</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <Button onClick={() => navigate('/add-asset')} className="rounded-xl font-black h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                                                Add First Asset
                                            </Button>
                                            <Button variant="outline" onClick={() => setActiveTab("detective")} className="rounded-xl font-black h-9 px-6 border-slate-200 text-xs">
                                                Run Detective Scan
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {groupedAssets.PROBATE.length > 0 && (
                                            <AssetGroup
                                                label="Probate Estate"
                                                sublabel="Court authority required"
                                                assets={groupedAssets.PROBATE}
                                                dotColor="bg-rose-500"
                                                isSelectionMode={isSelectionMode}
                                                selectedAssetIds={selectedAssetIds}
                                                onAssetClick={handleAssetClick}
                                                onSelectAsset={handleSelectAsset}
                                                normalize={normalize}
                                            />
                                        )}
                                        {groupedAssets.NON_PROBATE.length > 0 && (
                                            <AssetGroup
                                                label="Non-Probate Transfers"
                                                sublabel="Direct transfer to beneficiaries or trust"
                                                assets={groupedAssets.NON_PROBATE}
                                                dotColor="bg-emerald-500"
                                                isSelectionMode={isSelectionMode}
                                                selectedAssetIds={selectedAssetIds}
                                                onAssetClick={handleAssetClick}
                                                onSelectAsset={handleSelectAsset}
                                                normalize={normalize}
                                            />
                                        )}
                                        {groupedAssets.UNKNOWN.length > 0 && (
                                            <AssetGroup
                                                label="Unclassified"
                                                sublabel="Authority type not yet determined"
                                                assets={groupedAssets.UNKNOWN}
                                                dotColor="bg-slate-400"
                                                isSelectionMode={isSelectionMode}
                                                selectedAssetIds={selectedAssetIds}
                                                onAssetClick={handleAssetClick}
                                                onSelectAsset={handleSelectAsset}
                                                normalize={normalize}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Sidebar Widgets */}
                            <div className="lg:col-span-1 space-y-4">
                                {/* Asset Summary Widget */}
                                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                                    <h3 className="text-sm font-black text-slate-800 mb-3">Asset Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Total Assets</span>
                                            <span className="font-black">{assets.length}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Probate Assets</span>
                                            <span className="font-black">{groupedAssets.PROBATE.length}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Non-Probate</span>
                                            <span className="font-black">{groupedAssets.NON_PROBATE.length}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Needs Action</span>
                                            <span className="font-black text-amber-600">
                                                {sortedAssets.filter(a => getAssetTaxonomyState(a) === 'action_required').length}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions Widget */}
                                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4">
                                    <h3 className="text-sm font-black text-slate-800 mb-3">Quick Actions</h3>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start h-9 text-xs font-black border-slate-200"
                                            onClick={() => navigate('/add-asset')}
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" />
                                            Add New Asset
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start h-9 text-xs font-black border-slate-200"
                                            onClick={() => setActiveTab("detective")}
                                        >
                                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                                            Run Asset Scan
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start h-9 text-xs font-black border-slate-200"
                                            onClick={() => navigate('/probate/letters')}
                                        >
                                            <Mail className="w-3.5 h-3.5 mr-2" />
                                            Send Letters
                                        </Button>
                                    </div>
                                </div>

                                {/* Asset Categories Widget */}
                                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                                    <h3 className="text-sm font-black text-slate-800 mb-3">By Category</h3>
                                    <div className="space-y-2">
                                        {Object.entries(
                                            assets.reduce((acc: Record<string, number>, asset: any) => {
                                                const category = asset.category || 'Other';
                                                acc[category] = (acc[category] || 0) + 1;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([category, count]) => (
                                            <div key={category} className="flex justify-between text-xs">
                                                <span className="text-slate-500 capitalize">{category}</span>
                                                <span className="font-black">{count as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Help Widget */}
                                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4">
                                    <h3 className="text-sm font-black text-slate-800 mb-2">Need Help?</h3>
                                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                        Asset classification determines how each account is handled during probate.
                                    </p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-indigo-600 font-black text-xs"
                                        onClick={() => navigate('/help')}
                                    >
                                        Visit Help Center →
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="detective" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="bg-white border-none rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                    {/* Background Glow */}
                                    <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                                            <FileSearch className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-0.5">Discovery Scan</p>
                                            <h2 className="text-lg font-black tracking-tight text-slate-900">Forensic Scan</h2>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                        Upload bank statements, tax returns, or insurance policies. AI will scan for hidden transfers or "Summary of Holdings" that point to other accounts.
                                    </p>
                                    <p className="text-[10px] text-slate-400 italic mb-6">
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

                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <h3 className="text-xs font-black uppercase tracking-widest italic">Detective's Tip</h3>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                            "Look for ACH transfers or wire instructions. Often, a single Checking statement reveals a hidden Brokerage account or a secondary Savings account."
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Tips Card */}
                                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4">
                                    <h3 className="text-sm font-black text-slate-800 mb-2">Common Hidden Assets</h3>
                                    <ul className="text-xs text-slate-500 space-y-1">
                                        <li>• 401(k) plans with employer names</li>
                                        <li>• Life insurance policies</li>
                                        <li>• Safe deposit box fees</li>
                                        <li>• Investment account transfers</li>
                                        <li>• Cryptocurrency exchanges</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <h2 className="text-lg font-black tracking-tight">Discovery Findings</h2>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold px-2 py-0.5 text-xs">
                                        {clues.length} Potential Leads
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {isScanning ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-16 bg-primary/5 border-2 border-dashed border-primary/10 rounded-2xl text-center"
                                            >
                                                <div className="relative mb-4">
                                                    <div className="w-16 h-16 border-3 border-blue-100 border-t-primary rounded-full animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <SearchIcon className="w-6 h-6 text-primary animate-pulse" />
                                                    </div>
                                                </div>
                                                <h3 className="font-black text-lg text-primary-900">Detective is investigating...</h3>
                                                <p className="text-sm text-slate-400 mt-2 font-bold leading-relaxed">
                                                    Running forensic scan on your document
                                                </p>
                                            </motion.div>
                                        ) : clues.length === 0 ? (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-16 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl text-center"
                                            >
                                                <div className="p-3 rounded-xl bg-slate-100 mb-4">
                                                    <SearchIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="font-black text-lg text-slate-900">No clues discovered yet</h3>
                                                <p className="text-sm text-slate-400 mt-2 font-bold">
                                                    Upload a document to start the investigation
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
                                                        "relative border border-slate-200 rounded-xl p-4 transition-all",
                                                        clue.added ? "bg-slate-50 opacity-60" : "bg-white hover:border-primary/20 shadow-sm"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="space-y-1 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-black text-base text-slate-900">{clue.institution}</h3>
                                                                <Badge variant="secondary" className="text-[9px] py-0.5 px-2 uppercase font-black tracking-widest bg-primary/5 text-primary border-none">
                                                                    {clue.type}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-600">
                                                                {clue.title}
                                                            </p>
                                                            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium italic">
                                                                "{clue.message}"
                                                            </p>
                                                        </div>

                                                        {!clue.added ? (
                                                            <div className="flex flex-col gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    className="rounded-lg font-black bg-slate-900 text-white hover:bg-slate-800 shadow px-3 text-xs"
                                                                    onClick={() => handleClaimAsset(clue)}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                                    Claim
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="rounded-lg font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 text-xs"
                                                                    onClick={() => removeClue(clue.id)}
                                                                >
                                                                    Dismiss
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-500 gap-1 py-1 px-2 rounded-lg font-black text-[9px] uppercase">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Added
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {!clue.added && (
                                                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${clue.confidence * 100}%` }}
                                                                        className="h-full bg-primary shadow-[0_0_6px_rgba(37,99,235,0.5)]"
                                                                    />
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                    {Math.round(clue.confidence * 100)}%
                                                                </span>
                                                            </div>
                                                            <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600 font-black text-xs hover:no-underline flex items-center gap-1 group/link">
                                                                View <ChevronRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
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
            </DashboardLayout>

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
        </>
    );
}


function AssetGroup({ label, sublabel, assets, dotColor, isSelectionMode, selectedAssetIds, onAssetClick, onSelectAsset, normalize }: any) {
    if (!assets || assets.length === 0) return null;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-1">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor)} />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{label}</span>
                {sublabel && <span className="text-[10px] text-slate-400 font-medium">{sublabel}</span>}
                <div className="ml-auto text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{assets.length}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {assets.map((asset: any) => (
                    <CompactAssetRow
                        key={asset.id}
                        asset={asset}
                        isSelectionMode={isSelectionMode}
                        selected={selectedAssetIds.includes(asset.id)}
                        onAssetClick={onAssetClick}
                        onSelectAsset={onSelectAsset}
                        normalize={normalize}
                    />
                ))}
            </div>
        </div>
    );
}

function CompactAssetRow({ asset, isSelectionMode, selected, onAssetClick, onSelectAsset, normalize }: any) {
    const taxState = getAssetTaxonomyState(asset);
    const STATUS_COLORS: Record<string, string> = {
        action_required: "bg-red-100 text-red-700",
        waiting: "bg-amber-100 text-amber-700",
        blocked: "bg-orange-100 text-orange-700",
        ready: "bg-emerald-100 text-emerald-700",
        monitoring: "bg-blue-100 text-blue-700",
        resolved: "bg-slate-100 text-slate-500",
    };
    const displayValue = normalize && asset.value > 0
        ? `$${(asset.value / 1000).toFixed(0)}K`
        : asset.value > 0 ? `$${asset.value.toLocaleString()}` : null;

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group",
                selected && "bg-indigo-50/50"
            )}
            onClick={() => {
                if (isSelectionMode) {
                    onSelectAsset(asset.id);
                } else {
                    onAssetClick(asset.id);
                }
            }}
        >
            {isSelectionMode && (
                <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors",
                    selected ? "bg-indigo-500 border-indigo-500" : "border-slate-300"
                )} />
            )}
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Landmark className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                    {asset.institution || "Unknown Institution"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium capitalize leading-tight">
                    {asset.assetType || asset.category || "Asset"}
                </p>
            </div>
            <Badge className={cn(
                "text-[9px] font-black border-none px-2 py-0.5 rounded-lg flex-shrink-0",
                STATUS_COLORS[taxState] || "bg-slate-100 text-slate-500"
            )}>
                {taxState.replace(/_/g, " ")}
            </Badge>
            {displayValue && (
                <p className="text-xs font-black text-slate-700 w-16 text-right flex-shrink-0">
                    {displayValue}
                </p>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
        </div>
    );
}

function AuthoritySummaryCard({ label, count, icon: Icon, color, bgColor }: any) {
    return (
        <div className={cn(
            "p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3 transition-all duration-300 group cursor-default hover:shadow-md hover:border-indigo-100",
            count > 0 ? "opacity-100" : "opacity-70"
        )}>
            <div className="flex items-center justify-between">
                <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-300",
                    count > 0 ? cn(bgColor, color) : "bg-slate-50 text-slate-400"
                )}>
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className={cn(
                    "text-2xl font-['Outfit'] font-bold tracking-tight transition-colors",
                    count > 0 ? "text-slate-900" : "text-slate-300"
                )}>{count}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        </div>
    );
}
