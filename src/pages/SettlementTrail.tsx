import { useQuery } from "@tanstack/react-query";
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
    FileSearch2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { motion } from "framer-motion";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";

export default function SettlementTrail() {
    const [searchQuery, setSearchQuery] = useState("");

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

    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];
    const currentPhase = estate?.status || "immediate_actions";

    const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === currentPhase);
    const pendingTasks = phaseData?.tasks.filter(t => !completedTaskIds.includes(t.id)) || [];
    const pendingAssets = assets.filter((a: any) => !['distributed', 'closed'].includes(a.status?.toLowerCase()));
    const negativeFindings = discoveryStatus?.categories.filter((c: any) => c.status === 'NOT_FOUND') || [];

    const filteredActivities = activities.filter(a =>
        a.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.action?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'DOCUMENT': return FileText;
            case 'ASSET': return Landmark;
            case 'ROADMAP': return MapPin;
            case 'COMMUNICATION': return Activity;
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

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <main className="flex-1 pl-64">
                <div className="p-8 max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                                <History className="w-3.5 h-3.5" />
                                Audit Trail
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settlement Trail</h1>
                            <p className="text-slate-500 font-medium max-w-2xl">
                                Real-time chronological history of every legal action, document upload, and asset revision.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                className="h-11 rounded-xl bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50 relative overflow-hidden group/btn px-6"
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
                                Export Trail
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

                    {/* Diligence Summary & Cognitive Load Reduction */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-indigo-100 bg-white shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-indigo-600" />
                                        <CardTitle className="text-sm font-black uppercase tracking-tight">Fiduciary Gaps (Pending)</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100 font-black text-[10px]">
                                        {pendingTasks.length + pendingAssets.length} ACTIONS
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Roadmap Requirements</p>
                                    {pendingTasks.length > 0 ? (
                                        pendingTasks.slice(0, 3).map(task => (
                                            <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-200 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 leading-tight">{task.title}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">{task.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-bold flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> All roadmap tasks for this phase are documented.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-100 bg-white shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <SearchX className="w-5 h-5 text-amber-600" />
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Explicit Negative Findings</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Proof of search (Absent items)</p>
                                    {negativeFindings.length > 0 ? (
                                        negativeFindings.map(cat => (
                                            <div key={cat.id} className="flex flex-col gap-1 p-3 bg-amber-50/30 rounded-2xl border border-amber-100/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-amber-900">{cat.category.replace(/_/g, ' ')}</span>
                                                    <Badge variant="outline" className="text-[8px] bg-white border-amber-200 text-amber-600 font-black h-4 uppercase">Absent</Badge>
                                                </div>
                                                {cat.negativeFindings?.map((f: any) => (
                                                    <p key={f.id} className="text-[10px] text-amber-700 italic mt-1 bg-white/50 p-2 rounded-lg border border-amber-100/30">
                                                        "{f.statement}"
                                                    </p>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center space-y-2">
                                            <FileSearch2 className="w-8 h-8 text-slate-200 mx-auto" />
                                            <p className="text-[10px] text-slate-400 font-medium">No negative findings logged yet.<br />Explicitly documenting "No Assets Found" reduces liability.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-8 pb-20">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center text-slate-400 font-medium">
                                Loading chronological history...
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                                <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto">
                                    <Search className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">No matching activities</p>
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
                            ).sort((a: any, b: any) => b[0].localeCompare(a[0])) // Descending dates
                                .map(([dateKey, groupActivities]: [string, any]) => {
                                    const groupDate = new Date(dateKey + 'T12:00:00'); // Midday to avoid TZ shifts
                                    let dateLabel = format(groupDate, "MMMM d, yyyy");

                                    // Simple relative date labels
                                    const todayStr = format(new Date(), "yyyy-MM-dd");
                                    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                                    const yesterdayStr = format(yesterday, "yyyy-MM-dd");

                                    if (dateKey === todayStr) dateLabel = "Today";
                                    else if (dateKey === yesterdayStr) dateLabel = "Yesterday";

                                    return (
                                        <div key={dateKey} className="space-y-4">
                                            <div className="flex items-center gap-4 px-2">
                                                <div className="h-px flex-1 bg-slate-200" />
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                    {dateLabel}
                                                </span>
                                                <div className="h-px flex-1 bg-slate-200" />
                                            </div>

                                            <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-4">
                                                {groupActivities.map((activity: any, idx: number) => {
                                                    const activityType = activity.type || 'ROADMAP';
                                                    const Icon = getActivityIcon(activityType);
                                                    const colorClasses = getActivityColor(activityType);

                                                    const getActionDisplay = () => {
                                                        // High priority for descriptive notes
                                                        if (activity.notes) {
                                                            // If it's a generic "Completed: ID", maybe strip it if we have something better?
                                                            // But usually notes contain the task title as we saw in estateRoutes.ts
                                                            return activity.notes;
                                                        }

                                                        const labels: Record<string, string> = {
                                                            'COMPLETED': 'Task Completed',
                                                            'PHASE_COMPLETED': 'Phase Completed',
                                                            'UPLOADED': 'Document Uploaded',
                                                            'CREATED': 'Entry Created',
                                                            'UPDATED': 'Entry Updated',
                                                            'UNCOMPLETED': 'Re-opened'
                                                        };
                                                        return labels[activity.action] || activity.action;
                                                    };

                                                    return (
                                                        <motion.div
                                                            key={activity.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="relative"
                                                        >
                                                            {/* Timeline Dot */}
                                                            <div className={`absolute -left-[41px] top-1 p-1.5 rounded-full border-2 border-white shadow-sm z-10 ${colorClasses.split(' ')[1]}`}>
                                                                <div className={`w-2 h-2 rounded-full ${colorClasses.split(' ')[0].replace('text-', 'bg-')}`} />
                                                            </div>

                                                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden hover:border-slate-300">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="space-y-2 flex-1 min-w-0">
                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                            <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border ${colorClasses}`}>
                                                                                {activityType}
                                                                            </Badge>
                                                                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                                                                <Clock className="w-3 h-3" />
                                                                                {format(new Date(activity.occurredAt), "h:mm a")}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-1">
                                                                            <h3 className="font-bold text-slate-900 text-[15px] leading-tight group-hover:text-primary transition-colors">
                                                                                {getActionDisplay()}
                                                                            </h3>
                                                                            {activity.phase && (
                                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <MapPin className="w-2.5 h-2.5" />
                                                                                    {activity.phase.replace(/_/g, ' ')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-shrink-0">
                                                                        <div className={`p-2.5 rounded-xl ${colorClasses.split(' ')[1]} group-hover:scale-110 transition-transform`}>
                                                                            <Icon className={`w-4 h-4 ${colorClasses.split(' ')[0]}`} />
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
            </main>
        </div>
    );
}
