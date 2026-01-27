import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Flag, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import { TASK_ACTIONS } from "@/config/taskActions";
import { type SettlementPhase } from "@/components/SettlementPhaseChevron";

interface CurrentMilestoneProps {
    currentPhase: SettlementPhase;
    progress: number;
    completedTaskIds?: string[];
}

export function CurrentMilestone({ currentPhase, progress, completedTaskIds = [] }: CurrentMilestoneProps) {
    const navigate = useNavigate();
    const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === currentPhase);

    if (!phaseData) return null;

    // Find the current "Active" task - first one not completed
    const nextTask = phaseData.tasks.find(t => !completedTaskIds.includes(t.id));
    const nextAction = nextTask ? TASK_ACTIONS[nextTask.id] : null;

    return (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-[32px]">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                    {/* Visual Progress Side */}
                    <div className="p-8 bg-slate-900 text-white flex flex-col items-center justify-center md:w-1/3 text-center space-y-4">
                        <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="3"
                                />
                                <motion.circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="#4f46e5"
                                    strokeWidth="3"
                                    strokeDasharray={`${progress} ${100 - progress}`}
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 100" }}
                                    animate={{ strokeDasharray: `${progress} ${100 - progress}` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{progress}%</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Complete</span>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-white/20 text-white/80 bg-white/5 uppercase text-[10px] tracking-widest px-3 py-1">
                            Phase {SETTLEMENT_PHASE_TASKS.indexOf(phaseData) + 1} of 6
                        </Badge>
                    </div>

                    {/* Content Side */}
                    <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Flag className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Current Milestone</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{phaseData.title}</h2>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {phaseData.subtitle} • {phaseData.duration}
                            </p>
                        </div>

                        {nextTask && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 bg-indigo-50 border border-indigo-100 rounded-[24px] group hover:border-indigo-300 transition-all cursor-pointer"
                                onClick={() => nextAction?.type === 'navigate' ? navigate(nextAction.target) : navigate('/roadmap')}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Next Critical Step</p>
                                        <h4 className="text-base font-black text-slate-900 leading-tight">{nextTask.title}</h4>
                                        <p className="text-xs text-slate-600 font-medium">{nextTask.description}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {nextAction?.icon === 'Upload' ? <Upload className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                </div>

                                {nextAction && (
                                    <div className="mt-4 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                        {nextAction.label} <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-100 mt-auto pt-6">
                            <Button className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-900 px-8 h-12 rounded-2xl font-bold gap-2" asChild>
                                <Link to="/roadmap">
                                    View Full Roadmap
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Inline card shim if not imported
function Card({ children, className }: any) {
    return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>{children}</div>
}
function CardContent({ children, className }: any) {
    return <div className={cn("p-6 pt-0", className)}>{children}</div>
}
