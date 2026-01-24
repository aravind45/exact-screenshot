
import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ProcessStage } from "@/config/settlementStages";

interface ProcessFlowProps {
    stages: ProcessStage[];
    currentStageId?: string;
    completedStageIds?: string[];
}

export function ProcessFlow({ stages, currentStageId, completedStageIds = [] }: ProcessFlowProps) {
    if (!stages || stages.length === 0) return null;

    return (
        <div className="w-full flex h-14 md:h-16 gap-0 overflow-hidden rounded-xl border border-border shadow-sm bg-slate-50">
            {stages.map((stage, index) => {
                const isCompleted = completedStageIds.includes(stage.id);
                const isActive = stage.id === currentStageId;
                const isLast = index === stages.length - 1;
                const isFirst = index === 0;

                // Color logic
                let bgColor = "bg-white";
                let textColor = "text-slate-400";

                if (isActive) {
                    bgColor = "bg-primary";
                    textColor = "text-primary-foreground";
                } else if (isCompleted) {
                    bgColor = "bg-primary/10";
                    textColor = "text-primary";
                }

                return (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                            relative flex-1 flex items-center justify-center px-4 transition-all duration-500
                            ${bgColor} ${textColor}
                            ${!isFirst ? "-ml-4 md:-ml-6" : ""}
                        `}
                        style={{
                            clipPath: isFirst
                                ? "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%)"
                                : isLast
                                    ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 8% 50%)"
                                    : "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 8% 50%)",
                            zIndex: isActive ? 50 : stages.length - index,
                        }}
                    >
                        <div className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 text-center md:text-left ${!isFirst ? "pl-4 md:pl-6" : ""}`}>
                            <div className={`
                                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0
                                ${isActive ? "bg-white text-primary border-white" :
                                    isCompleted ? "bg-primary text-white border-primary" :
                                        "bg-white text-slate-300 border-slate-200"}
                            `}>
                                {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                            </div>
                            <div className="flex flex-col justify-center leading-none">
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[80px] md:max-w-none`}>
                                    {stage.title}
                                </span>
                                {isActive && (
                                    <span className="hidden md:block text-[8px] opacity-80 font-medium">ACTIVE</span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
