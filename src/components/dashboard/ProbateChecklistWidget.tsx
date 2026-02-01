import { useState, useEffect } from "react";
import { type SettlementTrack, getTrackStages, type ProcessStage } from "@/config/settlementStages";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Flag, AlertTriangle } from "lucide-react";

interface ProbateChecklistWidgetProps {
    estateType: SettlementTrack | null;
    deceasedState?: string;
}

export function ProbateChecklistWidget({ estateType, deceasedState = "CA" }: ProbateChecklistWidgetProps) {
    const navigate = useNavigate();
    const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

    // Load initial state from local storage or props if available
    useEffect(() => {
        const saved = localStorage.getItem("probate_checklist_progress");
        if (saved) {
            try {
                setCheckedTasks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved checklist progress", e);
            }
        }
    }, []);

    const handleCheck = (taskId: string, checked: boolean) => {
        const newChecked = { ...checkedTasks, [taskId]: checked };
        setCheckedTasks(newChecked);
        localStorage.setItem("probate_checklist_progress", JSON.stringify(newChecked));
    };

    const stages = estateType ? getTrackStages(estateType, deceasedState) : [];

    if (!estateType || stages.length === 0) {
        return (
            <Card className="border-slate-200 shadow-sm bg-amber-50/30 border-amber-100">
                <CardContent className="p-10 text-center space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                        <h3 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Probate track pending configuration</h3>
                        <p className="text-xs text-amber-700 max-w-sm mx-auto leading-relaxed">
                            Based on your estate details, we need one more input to finalize the correct legal track and generate your custom roadmap.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 font-bold uppercase text-[10px]"
                        onClick={() => navigate('/onboarding')}
                    >
                        Complete Setup →
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Calculate overall progress
    const totalTasks = stages.reduce((acc, stage) => acc + (stage.tasks?.length || 0), 0);
    const completedTasks = Object.values(checkedTasks).filter(Boolean).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-[32px]">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Flag className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Probate Process Roadmap</CardTitle>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                {estateType.replace(/_/g, " ")} TRACK
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-slate-400">Progress</span>
                            <span className="text-sm font-black text-indigo-600">{progressPercent}%</span>
                        </div>
                        <div className="w-10 h-10 relative">
                            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="text-indigo-600 transition-all duration-1000 ease-out"
                                    strokeDasharray={`${progressPercent}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                    {stages.map((stage, index) => {
                        const stageTasks = stage.tasks || [];
                        const completedStageTasks = stageTasks.filter(t => checkedTasks[t.id]).length;
                        const isStageComplete = stageTasks.length > 0 && completedStageTasks === stageTasks.length;

                        return (
                            <AccordionItem key={stage.id} value={stage.id} className="border-b border-slate-100 last:border-0 px-6">
                                <AccordionTrigger className="hover:no-underline py-5 group">
                                    <div className="flex items-center gap-4 text-left w-full">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                                            isStageComplete
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white border-slate-200 text-slate-500 group-hover:border-indigo-400 group-hover:text-indigo-600"
                                        )}>
                                            {isStageComplete ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={cn(
                                                "text-sm font-bold transition-colors",
                                                isStageComplete ? "text-emerald-700" : "text-slate-900 group-hover:text-indigo-700"
                                            )}>
                                                {stage.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-1">{stage.description}</p>
                                        </div>
                                        {stageTasks.length > 0 && (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                {completedStageTasks}/{stageTasks.length}
                                            </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-2 pl-14 pr-4">
                                    <div className="space-y-3">
                                        {stageTasks.map((task) => (
                                            <div key={task.id} className="flex items-start gap-3 group/task">
                                                <Checkbox
                                                    id={task.id}
                                                    checked={!!checkedTasks[task.id]}
                                                    onCheckedChange={(c) => handleCheck(task.id, c as boolean)}
                                                    className="mt-0.5"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={task.id}
                                                        className={cn(
                                                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                                                            checkedTasks[task.id] ? "text-slate-400 line-through" : "text-slate-700 group-hover/task:text-indigo-600"
                                                        )}
                                                    >
                                                        {task.title}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        {stageTasks.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No specific subtasks defined for this stage.</p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}
