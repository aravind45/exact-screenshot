
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Communication } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bell,
    Calendar,
    Clock,
    CheckCircle2,
    ChevronRight,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    MessageSquare,
    Landmark,
    ArrowRight
} from "lucide-react";
import { format, isPast, isBefore, addDays, startOfToday, endOfToday, endOfISOWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CommunicationLogDialog, CommunicationData } from "@/components/CommunicationLogDialog";
import { motion } from "framer-motion";

export default function FollowUps() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

    const { data: followUps = [], isLoading, refetch } = useQuery({
        queryKey: ['follow-ups'],
        queryFn: api.getFollowUps,
    });

    const { data: timeline = [] } = useQuery({
        queryKey: ['communications', 'timeline'],
        queryFn: api.getTimeline,
    });

    const completeMutation = useMutation({
        mutationFn: (id: string) => api.updateCommunication(id, { followUpCompletedAt: new Date().toISOString() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
            toast({ title: "Task Completed", description: "The follow-up has been marked as handled." });
        }
    });

    // Categorize
    const today = startOfToday();
    const weekEnd = endOfISOWeek(today);

    const overdue = followUps.filter(f => f.followUpDueAt && isPast(new Date(f.followUpDueAt)) && !isBefore(new Date(f.followUpDueAt), today) === false);
    const thisWeek = followUps.filter(f => f.followUpDueAt && new Date(f.followUpDueAt) >= today && new Date(f.followUpDueAt) <= weekEnd);

    // "Waiting on them" - Outbound communications without followUpDueAt but sent recently, or just general outbound stale ones
    // For the demo/structure, let's look for outbound comms in the last 30 days that aren't in the follow-up list
    const waitingOnThem = timeline.filter(c =>
        c.direction === 'outbound' &&
        !c.followUpDueAt &&
        !c.followUpCompletedAt
    ).slice(0, 5);

    const handleUpdateLog = async (data: CommunicationData) => {
        if (!selectedComm) return;
        try {
            await api.updateCommunication(selectedComm.id, {
                type: data.method as any,
                direction: data.direction as any,
                occurredAt: data.occurredAt,
                subject: data.subject,
                notes: data.notes,
                statusChange: data.statusChange,
                contactName: data.contactPerson,
                contactChannel: data.recipientEmail
            });
            toast({ title: "Log Updated" });
            setIsLogDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Action Items</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Executor Follow-Up Hub</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl font-bold gap-2">
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            Sync
                        </Button>
                    </div>
                </header>

                <main className="p-8 max-w-4xl mx-auto w-full space-y-10">

                    {/* OVERDUE */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-600">
                            <AlertCircle className="w-5 h-5 fill-rose-50" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Overdue ({overdue.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {overdue.length === 0 && (
                                <div className="p-6 bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium text-sm">
                                    No overdue items. Great job!
                                </div>
                            )}
                            {overdue.map(item => (
                                <FollowUpCard
                                    key={item.id}
                                    item={item}
                                    variant="overdue"
                                    onComplete={() => completeMutation.mutate(item.id)}
                                    onViewAsset={() => navigate(`/asset/${item.assetId}`)}
                                    onUpdate={() => { setSelectedComm(item); setIsLogDialogOpen(true); }}
                                />
                            ))}
                        </div>
                    </section>

                    {/* THIS WEEK */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Calendar className="w-5 h-5 fill-amber-50" />
                            <h2 className="text-lg font-black uppercase tracking-tight">This Week ({thisWeek.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {thisWeek.length === 0 && (
                                <div className="p-6 bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium text-sm">
                                    No items scheduled for this week.
                                </div>
                            )}
                            {thisWeek.map(item => (
                                <FollowUpCard
                                    key={item.id}
                                    item={item}
                                    variant="upcoming"
                                    onComplete={() => completeMutation.mutate(item.id)}
                                    onViewAsset={() => navigate(`/asset/${item.assetId}`)}
                                    onUpdate={() => { setSelectedComm(item); setIsLogDialogOpen(true); }}
                                />
                            ))}
                        </div>
                    </section>

                    {/* WAITING ON THEM */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Clock className="w-5 h-5 fill-indigo-50" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Waiting on Them ({waitingOnThem.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {waitingOnThem.map(item => (
                                <FollowUpCard
                                    key={item.id}
                                    item={item}
                                    variant="waiting"
                                    onViewAsset={() => navigate(`/asset/${item.assetId}`)}
                                    onUpdate={() => { setSelectedComm(item); setIsLogDialogOpen(true); }}
                                />
                            ))}
                        </div>
                    </section>
                </main>
            </div>

            <CommunicationLogDialog
                open={isLogDialogOpen}
                onOpenChange={setIsLogDialogOpen}
                onSubmit={handleUpdateLog}
                initialData={selectedComm ? {
                    method: selectedComm.type,
                    direction: selectedComm.direction,
                    occurredAt: selectedComm.occurredAt,
                    subject: selectedComm.subject || "",
                    notes: selectedComm.notes,
                    statusChange: selectedComm.statusChange || "NEEDS_ATTENTION",
                    contactPerson: selectedComm.contactName || "",
                    recipientEmail: selectedComm.contactChannel || ""
                } : undefined}
                assetId={selectedComm?.assetId}
            />
        </div>
    );
}

function FollowUpCard({ item, variant, onComplete, onViewAsset, onUpdate }: any) {
    const isOverdue = variant === 'overdue';
    const isWaiting = variant === 'waiting';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-slate-300 transition-all",
                isOverdue && "border-l-4 border-l-rose-500"
            )}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                            <Landmark className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            {item.asset?.institution || item.institutionName || "Unknown Institution"}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 border-slate-200 text-slate-500 bg-slate-50/50">
                            {item.asset?.name || "Asset"}
                        </Badge>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-tight">
                        {item.subject || item.notes.substring(0, 60)}
                    </h3>

                    <div className="flex items-center gap-3 text-xs font-bold">
                        {isWaiting ? (
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                Contacted: {format(new Date(item.occurredAt), 'MMM d')}
                            </span>
                        ) : (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full",
                                isOverdue ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                            )}>
                                Due: {format(new Date(item.followUpDueAt), 'MMM d')}
                                {isOverdue && ` (${Math.abs(Math.round((new Date().getTime() - new Date(item.followUpDueAt).getTime()) / (1000 * 60 * 60 * 24)))} days ago)`}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    {!isWaiting && (
                        <Button
                            onClick={onComplete}
                            variant="outline"
                            className="rounded-xl h-10 px-4 font-black text-[11px] uppercase tracking-wider hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 group-hover:bg-slate-50 transition-all"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Mark Complete
                        </Button>
                    )}
                    {isWaiting && (
                        <Button
                            onClick={onUpdate}
                            variant="outline"
                            className="rounded-xl h-10 px-4 font-black text-[11px] uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 group-hover:bg-slate-50 transition-all"
                        >
                            <MessageSquare className="w-3.5 h-3.5 mr-2" />
                            Log Update
                        </Button>
                    )}
                    <Button
                        onClick={onViewAsset}
                        variant="ghost"
                        className="rounded-xl h-10 px-4 font-black text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    >
                        View Asset
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
