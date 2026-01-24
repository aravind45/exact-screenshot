
import React from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { ProcessStage } from "@/config/settlementStages";

interface ProcessFlowProps {
    stages: ProcessStage[];
    currentStageId?: string;
    completedStageIds?: string[];
}

export function ProcessFlow({ stages, currentStageId, completedStageIds = [] }: ProcessFlowProps) {
    return (
        <div className="w-full py-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center min-w-max px-2">
                {stages.map((stage, index) => {
                    const isCompleted = completedStageIds.includes(stage.id);
                    const isActive = stage.id === currentStageId;
                    const isLast = index === stages.length - 1;

                    return (
                        <React.Fragment key={stage.id}>
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className={`
                                    flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300
                                    ${isActive ? "bg-primary/10 ring-1 ring-primary/20 scale-105 z-10" : "bg-transparent"}
                                    min-w-[140px] max-w-[180px]
                                `}>
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                        ${isCompleted ? "bg-primary text-primary-foreground" :
                                            isActive ? "bg-primary/20 text-primary animate-pulse" :
                                                "bg-slate-200 text-slate-500"}
                                    `}>
                                        {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                                    </div>

                                    <div className="text-center">
                                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? "text-primary" : "text-slate-600"}`}>
                                            {stage.title}
                                        </p>
                                        <p className="text-[9px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                                            {stage.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Hover tooltip for longer description */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    {stage.description}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                </div>
                            </motion.div>

                            {!isLast && (
                                <div className="px-1 text-slate-300">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
