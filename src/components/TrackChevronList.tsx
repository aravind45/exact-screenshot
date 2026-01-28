import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Track {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

interface TrackChevronListProps {
    tracks: Track[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function TrackChevronList({ tracks, selectedId, onSelect }: TrackChevronListProps) {
    return (
        <div className="flex flex-col gap-2">
            {tracks.map((track, index) => {
                const isSelected = selectedId === track.id;
                const isFirst = index === 0;
                const isLast = index === tracks.length - 1;

                return (
                    <motion.button
                        key={track.id}
                        onClick={() => onSelect(track.id)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            "relative w-full flex items-center p-4 pl-8 transition-all duration-300 text-left group",
                            isSelected
                                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02] z-10"
                                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                        )}
                        style={{
                            clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
                            marginLeft: isSelected ? "0" : "4px",
                        }}
                    >
                        <div className={cn(
                            "p-2 rounded-lg mr-4 transition-colors",
                            isSelected ? "bg-white/20" : track.bg
                        )}>
                            <track.icon className={cn("w-5 h-5", isSelected ? "text-white" : track.color)} />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn("font-bold text-sm", isSelected ? "text-white" : "text-slate-900")}>
                                {track.title}
                            </h3>
                            <p className={cn(
                                "text-[10px] mt-0.5 line-clamp-1",
                                isSelected ? "text-white/80" : "text-slate-500"
                            )}>
                                {track.description}
                            </p>
                        </div>
                        {isSelected && (
                            <div className="mr-6">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            </div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
