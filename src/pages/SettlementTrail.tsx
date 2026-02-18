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
        <div className="flex min-h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900">
            <Sidebar />
            <main className="flex-1 pl-[220px] relative">

                {/* Sleek Glassmorphic Header */}
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-200">
                    <div className="max-w-5xl mx-auto px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 shadow-inner">
                                    <History className="w-5 h-5 text-indigo-900" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settlement Trail</h1>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <Scale className="w-3 h-3" />
                                        <span>Fiduciary Audit Log</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Live & Verified
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <Input
                                        placeholder="Search trail..."
                                        className="pl-9 h-9 w-64 bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold shadow-sm"
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
                                    <ArrowUpRight className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 max-w-5xl mx-auto space-y-5 pb-24">
                    {/* Cockpit - Orientation Tools (Refined) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="md:col-span-2 border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-indigo-100/50 rounded-xl">
                                        <Zap className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Latest Action</p>
                                        <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                                            {orientationStats.lastAction}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium pt-1">
                                            {orientationStats.lastActionTime ? format(new Date(orientationStats.lastActionTime), "MMMM d • h:mm a") : "Just now"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-emerald-100/50 rounded-xl">
                                        <Flag className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Recommended Next</p>
                                        <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                                            {orientationStats.nextTask}
                                        </h4>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-4">
                        {/* Continuous Vertical Line */}
                        <div className="absolute left-[39px] top-6 bottom-0 w-px bg-slate-200" />

                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="h-40 flex items-center justify-center text-slate-400 font-medium text-sm">
                                    Reading ledger...
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2 shadow-sm">
                                    <SearchX className="w-8 h-8 text-slate-200 mx-auto" />
                                    <p className="text-slate-500 font-medium text-sm">No recorded activities found</p>
                                </div>
                            ) : (
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
                                            <div key={dateKey} className="relative z-10">
                                                {/* Date Header Node */}
                                                <div className="flex items-center gap-6 mb-6">
                                                    <div className="w-[50px] flex justify-center shrink-0">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 ring-4 ring-slate-50" />
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                        {dateLabel}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    {groupActivities.map((activity: any, idx: number) => {
                                                        const activityType = activity.type || 'ROADMAP';
                                                        const Icon = getActivityIcon(activityType);
                                                        const colorClasses = getActivityColor(activityType);
                                                        const isAggregated = activity.count > 1;
                                                        const parts = (activity.notes || "").split('| Note:');
                                                        const hasExistingNote = parts.length > 1;
                                                        const existingNote = hasExistingNote ? parts[1].trim() : "";

                                                        return (
                                                            <motion.div
                                                                key={activity.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.03 }}
                                                                className="group relative flex gap-6"
                                                            >
                                                                {/* Time & Node Column */}
                                                                <div className="w-[50px] flex flex-col items-center shrink-0 pt-1">
                                                                    <div className="text-[10px] font-semibold text-slate-400 mb-1">
                                                                        {format(new Date(activity.occurredAt), "h:mm a")}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "w-2 h-2 rounded-full border-2 border-white shadow-sm z-20 transition-all duration-300 group-hover:scale-125 group-hover:ring-2",
                                                                        colorClasses.split(' ')[1], // Border/Ring Color
                                                                        colorClasses.split(' ')[0].replace('text-', 'bg-') // Bg Color
                                                                    )} />
                                                                </div>

                                                                {/* Content Card */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group-hover:border-slate-300">
                                                                        {isAggregated && (
                                                                            <div className="absolute top-0 right-0 p-1.5 bg-slate-50 rounded-bl-lg border-b border-l border-slate-100">
                                                                                <span className="text-[9px] font-bold text-slate-500 px-1">×{activity.count}</span>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex items-start gap-4">
                                                                            <div className={cn("p-2 rounded-lg bg-opacity-10 shrink-0 mt-0.5", colorClasses.split(' ')[1], colorClasses.split(' ')[2].replace('border-', 'bg-'))}>
                                                                                <Icon className={cn("w-4 h-4", colorClasses.split(' ')[0])} />
                                                                            </div>

                                                                            <div className="flex-1 space-y-1">
                                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-opacity-20", colorClasses.split(' ')[1], colorClasses.split(' ')[0].replace('text-', 'bg-').replace('600', '100'))}>
                                                                                        {activityType}
                                                                                    </span>
                                                                                </div>
                                                                                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                                                                                    {getActionDisplay(activity)}
                                                                                </h3>

                                                                                {/* Intent Note / Actions */}
                                                                                {editingActivityId === activity.id ? (
                                                                                    <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1">
                                                                                        <textarea
                                                                                            autoFocus
                                                                                            className="w-full bg-transparent border-0 p-0 text-xs font-medium focus:ring-0 text-slate-700 placeholder:text-slate-400"
                                                                                            rows={2}
                                                                                            placeholder="Add context..."
                                                                                            value={intentNote}
                                                                                            onChange={(e) => setIntentNote(e.target.value)}
                                                                                        />
                                                                                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200/50">
                                                                                            <button onClick={() => setEditingActivityId(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">Cancel</button>
                                                                                            <button
                                                                                                onClick={() => updateNoteMutation.mutate({ id: activity.id, notes: `${parts[0].trim()} | Note: ${intentNote}` })}
                                                                                                className="text-[10px] font-bold text-primary uppercase hover:text-primary/80"
                                                                                            >
                                                                                                Save
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="mt-1 flex items-center justify-between group/audit">
                                                                                        <div>
                                                                                            {hasExistingNote && (
                                                                                                <div className="flex items-center gap-2 text-xs text-slate-600 italic bg-amber-50/50 px-2 py-1 rounded-md border border-amber-100/50 inline-flex mt-1">
                                                                                                    <PencilLine className="w-3 h-3 text-amber-500" />
                                                                                                    "{existingNote}"
                                                                                                </div>
                                                                                            )}
                                                                                        </div>

                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingActivityId(activity.id);
                                                                                                setIntentNote(existingNote);
                                                                                            }}
                                                                                            className="opacity-0 group-hover/audit:opacity-100 transition-opacity text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase mb-[-4px]"
                                                                                        >
                                                                                            {hasExistingNote ? "Edit" : "Annotate"}
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
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
                </div>

            </main>
        </div>
    );
}
