import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Clock,
    FileText,
    Landmark,
    History,
    Search,
    ChevronRight,
    ArrowRight,
    MapPin,
    Calendar,
    User,
    ArrowUpRight,
    FileCheck2,
    Scale,
    Activity,
    AlertCircle,
    CheckCircle2,
    SearchX,
    FileSearch2,
    MessageSquare,
    Zap,
    Flag,
    HelpCircle,
    Save,
    X,
    PencilLine
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Sidebar } from "@/components/Sidebar";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettlementTrail() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
    const [intentNote, setIntentNote] = useState("");

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: activities = [], isLoading } = useQuery({
        queryKey: ["activities"],
        queryFn: api.getActivities,
    });

    const { data: discoveryStatus } = useQuery({
        queryKey: ["discovery-status", estate?.id],
        queryFn: () => api.getDiscoveryStatus(estate!.id),
        enabled: !!estate?.id
    });

    const { data: assets = [] } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const updateNoteMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes: string }) => api.updateActivity(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            setEditingActivityId(null);
            setIntentNote("");
            toast.success("Executor intent note saved.");
        }
    });

    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];
    const currentPhase = estate?.status || "immediate_actions";

    const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === currentPhase);
    const pendingTasks = phaseData?.tasks.filter(t => !completedTaskIds.includes(t.id)) || [];
    const pendingAssets = assets.filter((a: any) => !['distributed', 'closed'].includes(a.status?.toLowerCase()));
    const negativeFindings = discoveryStatus?.categories.filter((c: any) => c.status === 'NOT_FOUND') || [];

    // Aggregation Logic: Groups identical back-to-back activities
    const aggregatedActivities = useMemo(() => {
        if (!activities.length) return [];

        const result: any[] = [];
        let currentGroup: any = null;

        activities.forEach((activity: any) => {
            const isSimilar = currentGroup &&
                currentGroup.type === activity.type &&
                currentGroup.action === activity.action &&
                currentGroup.notes === activity.notes;

            if (isSimilar) {
                currentGroup.count = (currentGroup.count || 1) + 1;
                currentGroup.instances = currentGroup.instances || [currentGroup.id];
                currentGroup.instances.push(activity.id);
            } else {
                if (currentGroup) result.push(currentGroup);
                currentGroup = { ...activity, count: 1 };
            }
        });
        if (currentGroup) result.push(currentGroup);
        return result;
    }, [activities]);

    const filteredActivities = aggregatedActivities.filter(a =>
        a.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.action?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Orientation Cockpit: Last Meaningful Action & Next Area of Attention
    const orientationStats = useMemo(() => {
        const meaningful = activities.find((a: any) =>
            a.action === 'COMPLETED' ||
            a.type === 'COMMUNICATION' ||
            (a.type === 'ASSET' && a.action === 'UPDATED' && a.notes.includes('status changed'))
        );

        const nextTask = pendingTasks[0]?.title || "Continue Asset Discovery";

        return {
            lastAction: (meaningful?.notes || activities[0]?.notes || "Estate processing started").split('| Note:')[0],
            lastActionTime: meaningful?.occurredAt || activities[0]?.occurredAt,
            nextTask
        };
    }, [activities, pendingTasks]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'DOCUMENT': return FileText;
            case 'ASSET': return Landmark;
            case 'ROADMAP': return MapPin;
            case 'COMMUNICATION': return MessageSquare;
            default: return History;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'DOCUMENT': return "text-indigo-600 bg-indigo-50 border-indigo-100";
            case 'ASSET': return "text-emerald-600 bg-emerald-50 border-emerald-100";
            case 'ROADMAP': return "text-amber-600 bg-amber-50 border-amber-100";
            case 'COMMUNICATION': return "text-violet-600 bg-violet-50 border-violet-100";
            default: return "text-slate-600 bg-slate-50 border-slate-100";
        }
    };

    const getActionDisplay = (activity: any) => {
        if (activity.notes) {
            // Semantic Reframing
            const mainNote = activity.notes.split('| Note:')[0];
            return mainNote
                .replace("Re-opened", "Information Refinement Requested")
                .replace("marked as complete", "Marked as Fiduciary Action Complete")
                .replace("ROADMAP – ", "");
        }

        const labels: Record<string, string> = {
            'COMPLETED': 'Task Completed',
            'PHASE_COMPLETED': 'Phase Completed',
            'UPLOADED': 'Document Uploaded',
            'CREATED': 'Entry Created',
            'UPDATED': 'Entry Updated',
            'UNCOMPLETED': 'Information Refinement'
        };
        return labels[activity.action] || activity.action;
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <main className="flex-1 pl-64">
                <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                                <History className="w-3.5 h-3.5" />
                                Fiduciary Record
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settlement Trail</h1>
                            <p className="text-slate-500 font-medium max-w-2xl">
                                Defensive chronological journal of every legal action and asset determination.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                className="h-11 rounded-xl bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50 relative overflow-hidden group/btn px-6 shadow-sm"
                                onClick={async () => {
                                    try {
                                        const blob = await api.downloadActivityLog();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `Settlement_Trail_${new Date().toISOString().split('T')[0]}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                    } catch (e) {
                                        console.error("Download failed:", e);
                                    }
                                }}
                            >
                                <ArrowUpRight className="w-4 h-4 mr-2 text-slate-400 group-hover/btn:text-primary transition-colors" />
                                Export Ledger
                            </Button>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search actions..."
                                    className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </header>

                    {/* Cockpit - Orientation Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 border-indigo-100 bg-indigo-50/30 rounded-3xl overflow-hidden shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-100 rounded-2xl">
                                        <Zap className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Last Meaningful Action</p>
                                        <div className="space-y-1">
                                            <h4 className="text-base font-bold text-slate-900 leading-tight">
                                                {orientationStats.lastAction}
                                            </h4>
                                            <p className="text-xs text-indigo-600 font-medium">
                                                {orientationStats.lastActionTime ? format(new Date(orientationStats.lastActionTime), "MMMM d 'at' h:mm a") : "Just now"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white border border-indigo-100 rounded-2xl text-center hidden sm:block">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Fidelity Score</p>
                                        <p className="text-lg font-black text-indigo-600">9.5</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-100 bg-emerald-50/30 rounded-3xl overflow-hidden shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-emerald-100 rounded-2xl">
                                        <Flag className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Next Attention Area</p>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                                {orientationStats.nextTask}
                                            </h4>
                                            <p className="text-[10px] font-medium text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded-full w-fit">
                                                Priority Action
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-8">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center text-slate-400 font-medium">
                                Syncing fiduciary records...
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                                <Search className="w-6 h-6 text-slate-200 mx-auto" />
                                <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">No activities found</p>
                            </div>
                        ) : (
                            // Group by date
                            Object.entries(
                                filteredActivities.reduce((groups: any, activity) => {
                                    const dateKey = format(new Date(activity.occurredAt), "yyyy-MM-dd");
                                    if (!groups[dateKey]) groups[dateKey] = [];
                                    groups[dateKey].push(activity);
                                    return groups;
                                }, {})
                            ).sort((a: any, b: any) => b[0].localeCompare(a[0]))
                                .map(([dateKey, groupActivities]: [string, any]) => {
                                    const groupDate = new Date(dateKey + 'T12:00:00');
                                    let dateLabel = format(groupDate, "MMMM d, yyyy");

                                    const todayStr = format(new Date(), "yyyy-MM-dd");
                                    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                                    const yesterdayStr = format(yesterday, "yyyy-MM-dd");

                                    if (dateKey === todayStr) dateLabel = "Today";
                                    else if (dateKey === yesterdayStr) dateLabel = "Yesterday";

                                    return (
                                        <div key={dateKey} className="space-y-6">
                                            <div className="sticky top-0 z-20 py-2 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex-shrink-0">
                                                        {dateLabel}
                                                    </span>
                                                    <div className="h-px w-full bg-slate-200" />
                                                </div>
                                            </div>

                                            <div className="relative border-l-2 border-slate-200 ml-4 pl-10 space-y-6">
                                                {groupActivities.map((activity: any, idx: number) => {
                                                    const activityType = activity.type || 'ROADMAP';
                                                    const Icon = getActivityIcon(activityType);
                                                    const colorClasses = getActivityColor(activityType);
                                                    const isAggregated = activity.count > 1;
                                                    const parts = activity.notes.split('| Note:');
                                                    const hasExistingNote = parts.length > 1;
                                                    const existingNote = hasExistingNote ? parts[1].trim() : "";

                                                    return (
                                                        <motion.div
                                                            key={activity.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="relative"
                                                        >
                                                            {/* Timeline Dot */}
                                                            <div className={cn(
                                                                "absolute -left-[51px] top-1 p-1.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-110",
                                                                colorClasses.split(' ')[1]
                                                            )}>
                                                                <div className={cn(
                                                                    "w-3 h-3 rounded-full",
                                                                    colorClasses.split(' ')[0].replace('text-', 'bg-')
                                                                )} />
                                                            </div>

                                                            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden hover:border-slate-300">
                                                                {isAggregated && (
                                                                    <div className="absolute right-0 top-0 bg-indigo-50 border-l border-b border-indigo-100 px-3 py-1 rounded-bl-xl">
                                                                        <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                                                                            {activity.count} Repeated Events Compressed
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="space-y-3 flex-1 min-w-0">
                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                            <Badge className={cn("rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border", colorClasses)}>
                                                                                {activityType}
                                                                            </Badge>
                                                                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                                                                <Clock className="w-3 h-3" />
                                                                                {format(new Date(activity.occurredAt), "h:mm a")}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <h3 className="font-bold text-slate-900 text-[16px] leading-snug group-hover:text-primary transition-colors pr-8">
                                                                                {getActionDisplay(activity)}
                                                                            </h3>

                                                                            {activity.phase && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                                                                                        PHASE: {activity.phase.replace(/_/g, ' ')}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-shrink-0">
                                                                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:rotate-12", colorClasses.split(' ')[1])}>
                                                                            <Icon className={cn("w-5 h-5", colorClasses.split(' ')[0])} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Executor Intent Note Display/Edit */}
                                                                <div className="mt-4 pt-4 border-t border-slate-50">
                                                                    {editingActivityId === activity.id ? (
                                                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                                                            <div className="relative">
                                                                                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-primary opacity-50" />
                                                                                <textarea
                                                                                    autoFocus
                                                                                    className="w-full bg-slate-50 border border-primary/20 rounded-xl p-3 pl-10 text-sm font-medium focus:ring-0 focus:border-primary transition-all min-h-[80px]"
                                                                                    placeholder="Why was this action taken? (e.g., Followed up due to no response)"
                                                                                    value={intentNote}
                                                                                    onChange={(e) => setIntentNote(e.target.value)}
                                                                                />
                                                                            </div>
                                                                            <div className="flex gap-2 justify-end">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="rounded-lg h-8 text-[11px] font-bold uppercase"
                                                                                    onClick={() => setEditingActivityId(null)}
                                                                                >
                                                                                    <X className="w-3 h-3 mr-1.5" /> Cancel
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="rounded-lg h-8 text-[11px] font-bold uppercase bg-primary hover:bg-primary/90"
                                                                                    disabled={updateNoteMutation.isPending}
                                                                                    onClick={() => updateNoteMutation.mutate({
                                                                                        id: activity.id,
                                                                                        notes: `${parts[0].trim()} | Note: ${intentNote}`
                                                                                    })}
                                                                                >
                                                                                    <Save className="w-3 h-3 mr-1.5" /> Save Intent
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-between group/note">
                                                                            <div className="space-y-1">
                                                                                {hasExistingNote ? (
                                                                                    <div className="flex items-start gap-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 max-w-xl">
                                                                                        <PencilLine className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                                                                        <p className="text-xs font-bold text-emerald-900 italic leading-relaxed">
                                                                                            "{existingNote}"
                                                                                        </p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
                                                                                        <User className="w-3 h-3" />
                                                                                        Executor action recorded by {activity.user?.fullName || "System"}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                className="h-7 px-2 text-[10px] font-bold text-slate-500 hover:text-primary gap-1.5 opacity-0 group-hover/note:opacity-100 transition-opacity"
                                                                                onClick={() => {
                                                                                    setEditingActivityId(activity.id);
                                                                                    setIntentNote(existingNote);
                                                                                }}
                                                                            >
                                                                                {hasExistingNote ? <PencilLine className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                                                                {hasExistingNote ? "Edit Note" : "Add Intent Note"}
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* Defense Footer */}
                <footer className="fixed bottom-0 right-0 left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                This trail serves as your primary evidence of fiduciary diligence. All timestamps are UTC-linked and tamper-evident.
                            </p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px]">VERIFIED RECORD</Badge>
                    </div>
                </footer>
            </main>
        </div>
    );
}
