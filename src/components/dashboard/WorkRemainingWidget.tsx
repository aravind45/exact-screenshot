
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, AlertTriangle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import type { SettlementPhase } from "@/components/SettlementPhaseChevron";

interface WorkRemainingWidgetProps {
    currentPhase: SettlementPhase;
    completedTaskIds: string[];
    assets: any[];
}

export function WorkRemainingWidget({ currentPhase, completedTaskIds, assets }: WorkRemainingWidgetProps) {
    const navigate = useNavigate();

    // Get pending tasks for CURRENT phase
    const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === currentPhase);
    const pendingTasks = phaseData?.tasks.filter(t => !completedTaskIds.includes(t.id)) || [];

    // Get pending asset actions (found but not settled)
    const pendingAssets = assets.filter(a => !['distributed', 'closed'].includes(a.status?.toLowerCase()));

    if (pendingTasks.length === 0 && pendingAssets.length === 0) {
        return (
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-emerald-900">Current Phase Fully Documented</h3>
                <p className="text-[10px] text-emerald-700 mt-1 uppercase font-bold tracking-widest">Ready for Review</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full hover:border-indigo-200 transition-all">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Diligence Gaps</h2>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-500 font-black">
                    {pendingTasks.length + pendingAssets.length} REMAINING
                </Badge>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
                {/* Roadmap Gaps */}
                {pendingTasks.length > 0 && (
                    <div>
                        <p className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Roadmap Gaps (Current Phase)</p>
                        <div className="space-y-2">
                            {pendingTasks.slice(0, 3).map(task => (
                                <div key={task.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate('/roadmap')}>
                                    <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 leading-tight">{task.title}</p>
                                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                                    </div>
                                </div>
                            ))}
                            {pendingTasks.length > 3 && (
                                <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] uppercase font-black text-slate-400" onClick={() => navigate('/roadmap')}>
                                    + {pendingTasks.length - 3} more roadmap items
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Asset Discovery Gaps */}
                {pendingAssets.length > 0 && (
                    <div>
                        <p className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unsettled Assets</p>
                        <div className="space-y-2">
                            {pendingAssets.slice(0, 3).map(asset => (
                                <div key={asset.id} className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex items-start gap-3 hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => navigate(`/asset/${asset.id}`)}>
                                    <SearchX className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-indigo-900 leading-tight">{asset.institution}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Badge className="h-4 text-[8px] font-black bg-white text-indigo-600 border-indigo-100">{asset.status}</Badge>
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase">{asset.assetType}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto p-4 bg-slate-50/30 border-t border-slate-100">
                <Button className="w-full bg-slate-900 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" onClick={() => navigate('/roadmap')}>
                    View Full Roadmap <ArrowRight className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
