import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Communication } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    ArrowRight,
    Zap,
    Info,
    HelpCircle
} from "lucide-react";
import { format, isPast, isBefore, addDays, startOfToday, endOfToday, endOfISOWeek, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CommunicationLogDialog, CommunicationData } from "@/components/CommunicationLogDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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

    // Grouping Logic: Collapses duplicates by institution + subject
    const groupFollowUps = (items: Communication[]) => {
        const groups: Record<string, Communication[]> = {};
        items.forEach(item => {
            const key = `${item.institutionName}-${item.subject || item.notes.substring(0, 30)}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return Object.values(groups).map(group => ({
            ...group[0],
            duplicates: group.length > 1 ? group.slice(1) : []
        }));
    };

    const overdue = useMemo(() => {
        const items = followUps.filter(f => f.followUpDueAt && isPast(new Date(f.followUpDueAt)) && !isBefore(new Date(f.followUpDueAt), today) === false);
        return groupFollowUps(items);
    }, [followUps, today]);

    const thisWeek = useMemo(() => {
        const items = followUps.filter(f => f.followUpDueAt && new Date(f.followUpDueAt) >= today && new Date(f.followUpDueAt) <= weekEnd);
        return groupFollowUps(items);
    }, [followUps, today, weekEnd]);

    const waitingOnThem = useMemo(() => {
        const items = timeline.filter(c =>
            c.direction === 'outbound' &&
            !c.followUpDueAt &&
            !c.followUpCompletedAt
        ).slice(0, 8);
        return groupFollowUps(items);
    }, [timeline]);

    // Recommended Focus Logic
    const recommendedFocus = useMemo(() => {
        if (overdue.length > 0) {
            return {
                title: "Address Overdue Items",
                description: `You have ${overdue.length} items that require immediate attention.`,
                variant: "overdue" as const
            };
        }
        if (thisWeek.length > 0) {
            return {
                title: "Stay on Schedule",
                description: `Focus on completing ${thisWeek.length} follow-ups scheduled for this week.`,
                variant: "upcoming" as const
            };
        }
        if (waitingOnThem.length > 0) {
            return {
                title: "Process Monitoring",
                description: `No action required today. Monitoring ${waitingOnThem.length} institutional responses.`,
                variant: "waiting" as const
            };
        }
        return {
            title: "Estate Current",
            description: "No pending follow-ups. All communications are currently up to date.",
            variant: "current" as const
        };
    }, [overdue, thisWeek, waitingOnThem]);

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
                <header className="h-24 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-50">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            Fiduciary Controls
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Action Items</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Executor Follow-Up Hub</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['communications'] }); }} className="h-11 rounded-xl bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50 shadow-sm px-6 gap-2">
                                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                                        Refresh Follow-Ups
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-3">
                                    <p className="text-xs font-bold">Manual Sync</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Updates institutional status and identifies stale responses.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </header>

                <main className="p-8 max-w-4xl mx-auto w-full space-y-12 pb-32">

                    {/* Recommended Focus Banner */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Card className={cn(
                            "rounded-3xl border-none shadow-sm overflow-hidden",
                            recommendedFocus.variant === 'overdue' ? "bg-rose-50 border border-rose-100" :
                                recommendedFocus.variant === 'waiting' ? "bg-indigo-50 border border-indigo-100" :
                                    "bg-emerald-50 border border-emerald-100"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-2xl",
                                        recommendedFocus.variant === 'overdue' ? "bg-rose-100 text-rose-600" :
                                            recommendedFocus.variant === 'waiting' ? "bg-indigo-100 text-indigo-600" :
                                                "bg-emerald-100 text-emerald-600"
                                    )}>
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Recommended Focus</p>
                                        <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{recommendedFocus.title}</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">{recommendedFocus.description}</p>
                                    </div>
                                    <Button variant="ghost" className="rounded-xl h-10 px-4 font-bold text-slate-400">
                                        Dismiss
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* OVERDUE */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-rose-600">
                            <AlertCircle className="w-5 h-5" />
                            <h2 className="text-xl font-black uppercase tracking-tight">Overdue ({overdue.length})</h2>
                        </div>
                        <div className="space-y-4">
                            {overdue.length === 0 && (
                                <div className="p-12 bg-white border border-slate-200 border-dashed rounded-[2rem] text-center space-y-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto" />
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No overdue items. Great job!</p>
                                </div>
                            )}
                            <AnimatePresence mode="popLayout">
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
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* THIS WEEK */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-xl font-black uppercase tracking-tight">Scheduled Follow-Ups ({thisWeek.length})</h2>
                        </div>
                        <div className="space-y-4">
                            {thisWeek.length === 0 && (
                                <div className="p-8 bg-white/50 border border-slate-200 rounded-[2rem] text-center">
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No items scheduled for this week.</p>
                                </div>
                            )}
                            <AnimatePresence mode="popLayout">
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
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* WAITING ON THEM */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Clock className="w-5 h-5" />
                            <h2 className="text-xl font-black uppercase tracking-tight">Waiting on Them ({waitingOnThem.length})</h2>
                        </div>
                        <div className="space-y-4">
                            {waitingOnThem.length === 0 && (
                                <div className="p-8 bg-white/50 border border-slate-200 rounded-[2rem] text-center">
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No institutional tasks pending.</p>
                                </div>
                            )}
                            <AnimatePresence mode="popLayout">
                                {waitingOnThem.map(item => (
                                    <FollowUpCard
                                        key={item.id}
                                        item={item}
                                        variant="waiting"
                                        onViewAsset={() => navigate(`/asset/${item.assetId}`)}
                                        onUpdate={() => { setSelectedComm(item); setIsLogDialogOpen(true); }}
                                    />
                                ))}
                            </AnimatePresence>
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
    const isUpcoming = variant === 'upcoming';
    const hasDuplicates = item.duplicates && item.duplicates.length > 0;

    // Expected Response logic for "Waiting" state
    const getExpectedResponse = () => {
        if (!isWaiting) return null;
        const sentDate = new Date(item.occurredAt);
        const today = new Date();
        const daysElapsed = differenceInDays(today, sentDate);

        // Typical window 5-10 days
        if (daysElapsed < 5) {
            return { label: "Wait period (Normal)", color: "text-slate-400 bg-slate-100", note: "Standard response: 5-10 days" };
        } else if (daysElapsed <= 10) {
            return { label: "Response Window Active", color: "text-indigo-600 bg-indigo-50", note: "Typical response time remaining" };
        } else {
            return { label: "Follow-Up Recommended", color: "text-rose-600 bg-rose-50", note: "Silence exceeds normal 10-day window" };
        }
    };

    const expResp = getExpectedResponse();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl hover:border-slate-300 transition-all",
                isOverdue && "border-l-4 border-l-rose-500",
                isUpcoming && "border-l-4 border-l-amber-500",
                isWaiting && "border-l-4 border-l-indigo-500"
            )}
        >
            {hasDuplicates && (
                <div className="absolute -top-3 -right-3">
                    <Badge className="rounded-full h-8 w-8 bg-indigo-600 border-4 border-white shadow-lg text-[10px] font-black p-0 flex items-center justify-center">
                        +{item.duplicates.length + 1}
                    </Badge>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors",
                            isOverdue ? "bg-rose-50 border-rose-100 text-rose-600" :
                                isWaiting ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                                    "bg-amber-50 border-amber-100 text-amber-600"
                        )}>
                            <Landmark className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate">
                                    {item.asset?.institution || item.institutionName || "Unknown Institution"}
                                </span>
                                <Badge variant="outline" className="text-[9px] font-black rounded-lg bg-slate-50 border-slate-200 text-slate-500 px-2">
                                    {item.asset?.name || "Asset Record"}
                                </Badge>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight mt-1 truncate">
                                {item.subject || item.notes.substring(0, 60)}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black tracking-tight flex-wrap">
                        {isWaiting ? (
                            <div className="flex items-center gap-3">
                                <span className="text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-full uppercase">
                                    SENT: {format(new Date(item.occurredAt), 'MMM d')}
                                </span>
                                {expResp && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={cn("px-3 py-1 rounded-full flex items-center gap-1.5 cursor-help whitespace-nowrap", expResp.color)}>
                                                    <Info className="w-3 h-3 shrink-0" />
                                                    {expResp.label}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-3">
                                                <p className="text-[10px] font-black">{expResp.note}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        ) : (
                            <span className={cn(
                                "px-3 py-1 rounded-full uppercase flex items-center gap-1.5",
                                isOverdue ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                            )}>
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(item.followUpDueAt), 'MMM d')}
                                {isOverdue && ` (${Math.abs(Math.round((new Date().getTime() - new Date(item.followUpDueAt).getTime()) / (1000 * 60 * 60 * 24)))} Days Late)`}
                            </span>
                        )}
                        {hasDuplicates && (
                            <span className="text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase flex items-center gap-1.5">
                                <HelpCircle className="w-3 h-3" />
                                {item.duplicates.length} Related items collapsed
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-6 md:pt-0">
                    {!isWaiting && (
                        <Button
                            onClick={onComplete}
                            size="lg"
                            className="rounded-2xl h-12 px-6 font-black text-[11px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex-1 md:flex-none"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Resolve
                        </Button>
                    )}
                    {isWaiting && (
                        <Button
                            onClick={onUpdate}
                            variant="outline"
                            size="lg"
                            className="rounded-2xl h-12 px-6 font-black text-[11px] uppercase tracking-widest bg-white border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 md:flex-none"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Log Update
                        </Button>
                    )}
                    <Button
                        onClick={onViewAsset}
                        variant="ghost"
                        size="lg"
                        className="rounded-2xl h-12 px-4 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        View Context
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
            {hasDuplicates && (
                <div className="mt-6 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Audit Compression Active
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Grouping multiple follow-ups for {item.institutionName} to reduce dashboard noise. Full history is preserved in the Settlement Trail.
                    </p>
                </div>
            )}
        </motion.div>
    );
}
