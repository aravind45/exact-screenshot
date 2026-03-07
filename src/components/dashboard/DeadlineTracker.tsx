import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar, Plus, Clock, AlertTriangle,
    RefreshCw, ChevronDown, ChevronUp, Trash2,
    ExternalLink, Info, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DeadlineMeta {
    description?: string;
    legalBasis?: string;
    priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    ruleId?: string;
    missingAnchor?: string;
}

interface Deadline {
    id: string;
    title: string;
    dueDate: string;
    status: string; // JSON metadata string from server
    isStatutory: boolean;
}

interface ParsedDeadline extends Deadline {
    meta: DeadlineMeta;
    isPending: boolean; // missing anchor date — date not yet computed
    daysRemaining: number;
    isOverdue: boolean;
    isUrgent: boolean; // ≤30 days
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function parseMeta(statusStr: string | null | undefined): DeadlineMeta {
    try {
        return statusStr ? JSON.parse(statusStr) : {};
    } catch {
        return {};
    }
}

function getDaysRemaining(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function enrich(d: Deadline): ParsedDeadline {
    const meta = parseMeta(d.status);
    const isPending = new Date(d.dueDate).getFullYear() === 2099 || !!meta.missingAnchor;
    const days = getDaysRemaining(d.dueDate);
    return {
        ...d,
        meta,
        isPending,
        daysRemaining: days,
        isOverdue: !isPending && days < 0,
        isUrgent: !isPending && days >= 0 && days <= 30,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Priority colours
// ─────────────────────────────────────────────────────────────────────────────
function priorityBadge(p?: string) {
    switch (p) {
        case "CRITICAL": return "bg-rose-100 text-rose-700 border-rose-200";
        case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
        case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
        default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
}

function statusDot(d: ParsedDeadline) {
    if (d.isPending) return "bg-slate-400";
    if (d.isOverdue) return "bg-rose-500 animate-pulse";
    if (d.isUrgent) return "bg-amber-500";
    return "bg-emerald-500";
}

function countdownText(d: ParsedDeadline) {
    if (d.isPending) return null;
    if (d.isOverdue) return { text: `${Math.abs(d.daysRemaining)}d Overdue`, cls: "text-rose-600 font-bold" };
    if (d.isUrgent) return { text: `${d.daysRemaining}d Left`, cls: "text-amber-600 font-bold" };
    return { text: `${d.daysRemaining}d`, cls: "text-emerald-600 font-semibold" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single deadline row
// ─────────────────────────────────────────────────────────────────────────────
function DeadlineRow({
    d,
    onDelete,
    onNavigateSettings
}: {
    d: ParsedDeadline;
    onDelete: (id: string) => void;
    onNavigateSettings: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const cd = countdownText(d);

    return (
        <div className={cn(
            "rounded-xl border transition-all duration-200",
            d.isPending
                ? "bg-slate-50 border-slate-200"
                : d.isOverdue
                    ? "bg-rose-50 border-rose-200"
                    : d.isUrgent
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-slate-100 hover:border-violet-200"
        )}>
            {/* Main row */}
            <div className="flex items-start gap-2 p-2.5">
                {/* Status dot */}
                <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0 shadow-sm", statusDot(d))} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 flex-wrap">
                        <p className={cn(
                            "text-sm font-semibold leading-tight",
                            d.isPending ? "text-slate-500 italic" : "text-slate-900"
                        )}>
                            {d.title}
                        </p>
                        {d.meta.priority && (
                    <span className={cn(
                                "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                                priorityBadge(d.meta.priority)
                            )}>
                                {d.meta.priority}
                            </span>
                        )}
                        {d.isStatutory && (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-200">
                                Statutory
                            </span>
                        )}
                    </div>

                    {/* Date row */}
                    {!d.isPending && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                                {new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        </div>
                    )}

                    {/* Missing anchor notice */}
                    {d.isPending && d.meta.missingAnchor && (
                        <button
                            onClick={onNavigateSettings}
                            className="flex items-center gap-1 mt-1 text-[11px] text-amber-700 font-medium hover:underline"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            Add {d.meta.missingAnchor} to compute this date
                            <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                    )}
                </div>

                {/* Right side: countdown + actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {cd && (
                        <span className={cn("text-xs min-w-[56px] text-right", cd.cls)}>
                            {cd.text}
                        </span>
                    )}
                    {/* Legal basis expand */}
                    {d.meta.legalBasis && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Legal basis"
                        >
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    )}
                    {/* Delete */}
                    <button
                        onClick={() => onDelete(d.id)}
                        className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove deadline"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-3 pt-0 space-y-1.5 border-t border-slate-100">
                    {d.meta.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{d.meta.description}</p>
                    )}
                    {d.meta.legalBasis && (
                        <div className="flex items-start gap-1.5">
                            <Info className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-violet-700 font-medium">{d.meta.legalBasis}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function DeadlineTracker({ estateId }: { estateId: string }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState("");
    const [showPending, setShowPending] = useState(false);

    // ── Data ─────────────────────────────────────────────────────────────────
    const { data: raw = [], isLoading } = useQuery({
        queryKey: ["deadlines", estateId],
        queryFn: () => api.getDeadlines(estateId),
        enabled: !!estateId,
    });

    const deadlines: ParsedDeadline[] = Array.isArray(raw)
        ? (raw as Deadline[]).map(enrich)
        : [];

    const computed = deadlines.filter(d => !d.isPending);
    const pending = deadlines.filter(d => d.isPending);
    const overdue = computed.filter(d => d.isOverdue);
    const urgent = computed.filter(d => d.isUrgent && !d.isOverdue);

    // ── Mutations ─────────────────────────────────────────────────────────────
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["deadlines", estateId] });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.createDeadline(estateId, data),
        onSuccess: () => {
            invalidate();
            setIsAdding(false);
            setNewTitle("");
            setNewDate("");
            toast({ title: "Deadline Added" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteDeadline(estateId, id),
        onSuccess: () => {
            invalidate();
            toast({ title: "Deadline removed" });
        },
    });

    const generateMutation = useMutation({
        mutationFn: () => api.generateDeadlines(estateId),
        onSuccess: (data: any) => {
            invalidate();
            const created = data?.created?.length ?? 0;
            const needDate = data?.pendingAnchorDates?.length ?? 0;
            toast({
                title: `${created} Statutory Deadlines Generated`,
                description: needDate > 0
                    ? `${needDate} deadline${needDate > 1 ? "s" : ""} need anchor dates to compute. Click ⚠️ items to add them.`
                    : "All deadlines have been computed with real dates.",
            });
        },
    });

    const recomputeMutation = useMutation({
        mutationFn: () => api.recomputeDeadlines(estateId),
        onSuccess: (data: any) => {
            invalidate();
            const n = data?.recomputed ?? 0;
            toast({
                title: n > 0 ? `${n} Deadline${n > 1 ? "s" : ""} Recomputed` : "No pending deadlines to update",
                description: n > 0 ? "Dates have been computed from your updated case information." : undefined,
            });
        },
    });

    const handleAdd = () => {
        if (!newTitle || !newDate) return;
        createMutation.mutate({ title: newTitle, dueDate: newDate });
    };

    if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

    const isEmpty = deadlines.length === 0;

    return (
        <Card className="bg-white border-slate-200 shadow-sm h-full flex flex-col">
            {/* ── Header ─────────────────────────────────────────────── */}
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
                        Important Dates
                    </CardTitle>
                    {overdue.length > 0 && (
                    <span className="text-xs font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5 animate-pulse">
                            {overdue.length} Overdue
                        </span>
                    )}
                    {overdue.length === 0 && urgent.length > 0 && (
                        <span className="text-xs font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                            {urgent.length} Urgent
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* Recompute: only show when pending exist */}
                    {pending.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-amber-600 hover:bg-amber-50"
                            onClick={() => recomputeMutation.mutate()}
                            disabled={recomputeMutation.isPending}
                            title="Re-run date computation after adding anchor dates"
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-1", recomputeMutation.isPending && "animate-spin")} />
                            Recompute
                        </Button>
                    )}
                    {/* Auto-generate */}
                    {isEmpty && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-violet-600 hover:bg-violet-50"
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                        >
                            <Sparkles className={cn("w-3 h-3 mr-1", generateMutation.isPending && "animate-spin")} />
                            Auto-Generate
                        </Button>
                    )}
                    {/* Regenerate (after first run) */}
                    {!isEmpty && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] text-slate-500 hover:bg-slate-50"
                                        onClick={() => generateMutation.mutate()}
                                        disabled={generateMutation.isPending}
                                    >
                                        <Sparkles className={cn("w-3 h-3", generateMutation.isPending && "animate-spin")} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Re-generate statutory deadlines</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {/* Add custom */}
                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Plus className="w-4 h-4 text-slate-400" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Custom Deadline</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Task Title</Label>
                                    <Input
                                        placeholder="e.g., File State Tax Return"
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleAdd}
                                    disabled={createMutation.isPending || !newTitle || !newDate}
                                >
                                    Save Deadline
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            {/* ── Content ────────────────────────────────────────────── */}
            <CardContent className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                {/* Empty state */}
                {isEmpty && (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-slate-100 rounded-xl">
                        <Clock className="w-6 h-6 text-slate-300 mb-1.5" />
                        <p className="text-sm text-slate-500 font-medium">No dates saved yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Click <strong>Auto-Generate</strong> to compute all statutory deadlines
                            <br />based on your estate's track and state
                        </p>
                    </div>
                )}

                {/* Overdue section */}
                {overdue.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wide px-0.5">Needs Attention</p>
                        {overdue.map(d => (
                            <div key={d.id} className="group">
                                <DeadlineRow
                                    d={d}
                                    onDelete={id => deleteMutation.mutate(id)}
                                    onNavigateSettings={() => navigate("/settings")}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Urgent section */}
                {urgent.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide px-0.5">Coming Soon</p>
                        {urgent.map(d => (
                            <div key={d.id} className="group">
                                <DeadlineRow
                                    d={d}
                                    onDelete={id => deleteMutation.mutate(id)}
                                    onNavigateSettings={() => navigate("/settings")}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Upcoming section */}
                {computed.filter(d => !d.isOverdue && !d.isUrgent).length > 0 && (
                    <div className="space-y-1">
                        {(overdue.length > 0 || urgent.length > 0) && (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-0.5">Upcoming</p>
                        )}
                        {computed
                            .filter(d => !d.isOverdue && !d.isUrgent)
                            .map(d => (
                                <div key={d.id} className="group">
                                    <DeadlineRow
                                        d={d}
                                        onDelete={id => deleteMutation.mutate(id)}
                                        onNavigateSettings={() => navigate("/settings")}
                                    />
                                </div>
                            ))}
                    </div>
                )}

                {/* Pending anchor section */}
                {pending.length > 0 && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setShowPending(!showPending)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide px-0.5 hover:text-slate-600 transition-colors"
                        >
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {pending.length} Missing Anchor Date{pending.length > 1 ? "s" : ""}
                            {showPending ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {showPending && pending.map(d => (
                            <div key={d.id} className="group">
                                <DeadlineRow
                                    d={d}
                                    onDelete={id => deleteMutation.mutate(id)}
                                    onNavigateSettings={() => navigate("/settings")}
                                />
                            </div>
                        ))}
                        {!showPending && (
                            <p className="text-[11px] text-slate-400 px-0.5">
                                Add missing dates in{" "}
                                <button
                                    onClick={() => navigate("/settings")}
                                    className="text-violet-500 hover:underline font-medium"
                                >
                                    Case Settings
                                </button>{" "}
                                to compute these deadlines.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

