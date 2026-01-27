
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import { type SettlementPhase } from "@/components/SettlementPhaseChevron";

interface CurrentMilestoneProps {
    currentPhase: SettlementPhase;
    progress: number;
}

export function CurrentMilestone({ currentPhase, progress }: CurrentMilestoneProps) {
    const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === currentPhase);

    if (!phaseData) return null;

    return (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-[32px]">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
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
                    <div className="p-8 flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Flag className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Current Milestone</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{phaseData.title}</h2>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {phaseData.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 gap-2" asChild>
                                <Link to="/roadmap">
                                    Resume Roadmap
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                            <p className="text-xs text-slate-500 font-medium">
                                Estimated time: <span className="text-slate-900 font-bold">{phaseData.duration}</span>
                            </p>
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
