
import { useState } from "react";
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
    LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AssetCategory } from "@/components/CategoryBadge";
import type { AssetStatus } from "@/components/StatusBadge";
import type { Priority } from "@/components/PriorityBadge";

export default function Assets() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

    const { data: assetsData, isLoading, error } = useQuery({
        queryKey: ['assets'],
        queryFn: api.getAssets,
    });

    const assets = Array.isArray(assetsData) ? assetsData : [];

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

                <main className="max-w-[1200px] w-full mx-auto px-8 py-10 space-y-8">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={isSelectionMode ? "secondary" : "outline"}
                                size="sm"
                                className="h-10 px-4 border-slate-200 rounded-xl font-bold"
                                onClick={toggleSelectionMode}
                            >
                                {isSelectionMode ? "Cancel" : "Batch Select"}
                            </Button>
                            <div className="h-6 w-px bg-slate-100 mx-2" />
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">{assets.length} Total</Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search assets..."
                                    className="pl-9 h-11 w-full md:w-[280px] bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm transition-all"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-11 px-4 border-slate-200 rounded-xl font-bold text-slate-600">
                                <Filter className="w-4 h-4 mr-2" /> Filter
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                            ))
                        ) : assets.length === 0 ? (
                            <div className="py-24 border-2 border-dashed border-slate-200 rounded-[40px] text-center bg-white/50">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Landmark className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">No assets identified yet</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Start by adding your first financial account or property to the estate.</p>
                                <Button
                                    onClick={() => navigate('/add-asset')}
                                    className="rounded-xl font-bold px-8"
                                >
                                    Add Your First Asset
                                </Button>
                            </div>
                        ) : (
                            assets.map((asset: any, index: number) => (
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
                                            "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-2xl p-6",
                                            selectedAssetIds.includes(asset.id) && "border-indigo-600 ring-2 ring-indigo-600/10 shadow-lg bg-indigo-50/10"
                                        )}
                                    />
                                </motion.div>
                            ))
                        )}
                    </div>
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
