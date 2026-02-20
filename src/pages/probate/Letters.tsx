import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, LettersDispatch } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Mail,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    RefreshCw,
    Trash2,
    FileText,
    Info,
    Copy,
    RotateCcw,
    ChevronRight,
    Send,
    Eye,
    Landmark,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    not_sent: {
        label: "Not Sent",
        color: "bg-slate-100 text-slate-600 border-slate-200",
        icon: Clock,
        dot: "bg-slate-400",
    },
    sent: {
        label: "Sent — Awaiting Response",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Send,
        dot: "bg-amber-400",
    },
    acknowledged: {
        label: "Acknowledged",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
        dot: "bg-emerald-500",
    },
    na: {
        label: "N/A",
        color: "bg-slate-50 text-slate-400 border-slate-100",
        icon: Eye,
        dot: "bg-slate-300",
    },
};

const INSTITUTION_TYPES = [
    "Bank",
    "Brokerage",
    "Financial",
    "Insurance",
    "Real Estate",
    "Government",
    "Employer",
    "Legal",
    "Other",
];

// ── Progress summary ──────────────────────────────────────────────────────────
function ProgressBar({ dispatches }: { dispatches: LettersDispatch[] }) {
    const active = dispatches.filter(d => d.status !== "na");
    const sent = active.filter(d => d.status === "sent" || d.status === "acknowledged").length;
    const acked = active.filter(d => d.status === "acknowledged").length;
    const pct = active.length ? Math.round((acked / active.length) * 100) : 0;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Letters Progress</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{acked} / {active.length} Acknowledged</h3>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-primary">{pct}%</span>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sent} letters sent</p>
                </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />Not sent: {active.filter(d => d.status === "not_sent").length}</span>
                <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Awaiting: {active.filter(d => d.status === "sent").length}</span>
                <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Done: {acked}</span>
            </div>
        </div>
    );
}

// ── Dispatch Row Card ─────────────────────────────────────────────────────────
function DispatchRow({
    item,
    onUpdateStatus,
    onDelete,
    isUpdating,
}: {
    item: LettersDispatch;
    onUpdateStatus: (id: string, status: string) => void;
    onDelete: (item: LettersDispatch) => void;
    isUpdating: boolean;
}) {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_sent;
    const Icon = cfg.icon;
    const isNA = item.status === "na";

    const nextStatus: Record<string, string> = {
        not_sent: "sent",
        sent: "acknowledged",
        acknowledged: "not_sent",
        na: "not_sent",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={cn(
                "group bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-all",
                isNA && "opacity-50",
                item.status === "sent" && "border-l-4 border-l-amber-400",
                item.status === "acknowledged" && "border-l-4 border-l-emerald-500",
            )}
        >
            <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                {/* Icon + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0",
                        item.status === "acknowledged" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            item.status === "sent" ? "bg-amber-50 border-amber-100 text-amber-600" :
                                "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 truncate">{item.institutionName}</span>
                            {item.isCustom && (
                                <Badge variant="outline" className="text-[9px] font-black px-1.5 border-indigo-200 text-indigo-500 bg-indigo-50">
                                    Custom
                                </Badge>
                            )}
                            {item.needsOriginal && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-[9px] font-black px-1.5 border-rose-200 text-rose-500 bg-rose-50 cursor-help">
                                                Original Required
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-3 max-w-xs">
                                            <p className="text-xs font-bold">Requires Original Document</p>
                                            <p className="text-[10px] text-slate-400 mt-1">This institution requires an original certified copy of Letters Testamentary, not a photocopy.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.institutionType}</span>
                            {item.sentAt && (
                                <span className="text-[10px] text-slate-400">· Sent {format(new Date(item.sentAt), "MMM d, yyyy")}</span>
                            )}
                            {item.followUpDueAt && item.status === "sent" && (
                                <span className={cn(
                                    "text-[10px] font-bold",
                                    new Date(item.followUpDueAt) < new Date() ? "text-rose-600" : "text-amber-600"
                                )}>
                                    · Follow up {format(new Date(item.followUpDueAt), "MMM d")}
                                </span>
                            )}
                            {item.acknowledgedAt && (
                                <span className="text-[10px] text-emerald-600">· Acked {format(new Date(item.acknowledgedAt), "MMM d, yyyy")}</span>
                            )}
                        </div>
                        {item.notes && (
                            <p className="text-[10px] text-slate-500 mt-1 italic truncate max-w-md">{item.notes}</p>
                        )}
                    </div>
                </div>

                {/* Status badge + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn("text-[10px] font-black border rounded-lg px-2 py-1 flex items-center gap-1.5", cfg.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                    </Badge>

                    {/* Cycle status button */}
                    {!isNA && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUpdateStatus(item.id, nextStatus[item.status])}
                                        disabled={isUpdating}
                                        className="h-8 px-3 text-[10px] font-black rounded-xl border-slate-200 hover:bg-slate-50"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                        {item.status === "not_sent" ? "Mark Sent" :
                                            item.status === "sent" ? "Mark Acked" : "Reopen"}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-2">
                                    <p className="text-[10px] font-bold">
                                        {item.status === "not_sent" && "Marks letter as sent → auto-sets 14-day follow-up"}
                                        {item.status === "sent" && "Institution acknowledged your letter"}
                                        {item.status === "acknowledged" && "Reopen to not_sent"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* N/A toggle */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUpdateStatus(item.id, isNA ? "not_sent" : "na")}
                        disabled={isUpdating}
                        className="h-8 px-2 text-[10px] font-black rounded-xl text-slate-400 hover:text-slate-600"
                    >
                        {isNA ? "Enable" : "N/A"}
                    </Button>

                    {/* Delete (custom only) */}
                    {item.isCustom && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(item)}
                            disabled={isUpdating}
                            className="h-8 w-8 p-0 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Letters() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [addOpen, setAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LettersDispatch | null>(null);
    const [resetOpen, setResetOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Form state for add dialog
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("Bank");
    const [newOriginal, setNewOriginal] = useState(false);
    const [newNotes, setNewNotes] = useState("");

    // Data
    const { data: dispatches = [], isLoading, refetch } = useQuery({
        queryKey: ["letters-dispatch"],
        queryFn: api.lettersDispatch.getAll,
    });

    // Mutations
    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.lettersDispatch.update(id, { status }),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["letters-dispatch"] });
            queryClient.invalidateQueries({ queryKey: ["letters-dispatch-followups"] });
            const msg =
                updated.status === "sent"
                    ? `Marked as sent. Follow-up set for ${format(new Date(updated.followUpDueAt!), "MMM d")}.`
                    : updated.status === "acknowledged"
                        ? "Institution acknowledged!"
                        : "Status updated.";
            toast({ title: "Updated", description: msg });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
    });

    const addMutation = useMutation({
        mutationFn: () =>
            api.lettersDispatch.addCustom({
                institutionName: newName.trim(),
                institutionType: newType,
                needsOriginal: newOriginal,
                notes: newNotes.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["letters-dispatch"] });
            toast({ title: "Institution Added", description: `${newName} added to your list.` });
            setAddOpen(false);
            setNewName("");
            setNewType("Bank");
            setNewOriginal(false);
            setNewNotes("");
        },
        onError: () => toast({ title: "Failed to add institution", variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.lettersDispatch.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["letters-dispatch"] });
            toast({ title: "Removed", description: `${deleteTarget?.institutionName} removed.` });
            setDeleteTarget(null);
        },
        onError: () => toast({ title: "Delete failed", variant: "destructive" }),
    });

    const resetMutation = useMutation({
        mutationFn: api.lettersDispatch.reset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["letters-dispatch"] });
            toast({ title: "Reset Complete", description: "List restored to defaults." });
            setResetOpen(false);
        },
        onError: () => toast({ title: "Reset failed", variant: "destructive" }),
    });

    // Filter
    const filtered =
        filterStatus === "all"
            ? dispatches
            : dispatches.filter((d) => d.status === filterStatus);

    const statusCounts = {
        all: dispatches.length,
        not_sent: dispatches.filter((d) => d.status === "not_sent").length,
        sent: dispatches.filter((d) => d.status === "sent").length,
        acknowledged: dispatches.filter((d) => d.status === "acknowledged").length,
        na: dispatches.filter((d) => d.status === "na").length,
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-[220px] flex flex-col">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-50">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                            <Mail className="w-3.5 h-3.5" />
                            Estate Administration
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Letters of Authority</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Institution Notification Tracker
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetOpen(true)}
                            className="h-10 rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 px-4 gap-2 text-[11px]"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset to Defaults
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setAddOpen(true)}
                            className="h-10 rounded-xl font-black px-5 gap-2 text-[11px]"
                        >
                            <Plus className="w-4 h-4" />
                            Add Institution
                        </Button>
                    </div>
                </header>

                <main className="p-5 max-w-4xl mx-auto w-full space-y-5 pb-24">
                    {/* Info Banner */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                        <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-indigo-700">
                            <strong className="font-black">Send Letters of Testamentary</strong> to each institution to notify them of your authority as executor.
                            Track when each letter is sent and when it is acknowledged. Follow-ups are auto-scheduled 14 days after sending.
                        </div>
                    </div>

                    {/* Progress */}
                    {!isLoading && <ProgressBar dispatches={dispatches} />}

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {(["all", "not_sent", "sent", "acknowledged", "na"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                                    filterStatus === s
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {s === "all" ? "All" :
                                    s === "not_sent" ? "Not Sent" :
                                        s === "sent" ? "Awaiting" :
                                            s === "acknowledged" ? "Acknowledged" : "N/A"}
                                <span className={cn(
                                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]",
                                    filterStatus === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                )}>
                                    {statusCounts[s]}
                                </span>
                            </button>
                        ))}
                        <div className="ml-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="h-8 px-3 text-[10px] font-black text-slate-400 rounded-xl gap-1.5"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-12 bg-white border border-slate-200 border-dashed rounded-2xl text-center">
                                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">
                                    {filterStatus === "all" ? "No institutions yet" : `No ${filterStatus.replace("_", " ")} items`}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filtered.map((item) => (
                                    <DispatchRow
                                        key={item.id}
                                        item={item}
                                        onUpdateStatus={(id, status) => updateMutation.mutate({ id, status })}
                                        onDelete={setDeleteTarget}
                                        isUpdating={updateMutation.isPending}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Institution Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">Add Custom Institution</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Institution Name</Label>
                            <Input
                                placeholder="e.g. First National Bank"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Type</Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {INSTITUTION_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <input
                                type="checkbox"
                                id="needsOriginal"
                                checked={newOriginal}
                                onChange={(e) => setNewOriginal(e.target.checked)}
                                className="w-4 h-4 rounded accent-primary"
                            />
                            <label htmlFor="needsOriginal" className="text-sm font-bold text-slate-700 cursor-pointer">
                                Requires original certified copy (not photocopy)
                            </label>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Notes (optional)</Label>
                            <Input
                                placeholder="Account number, contact info, etc."
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button
                            onClick={() => addMutation.mutate()}
                            disabled={!newName.trim() || addMutation.isPending}
                            className="rounded-xl font-black"
                        >
                            {addMutation.isPending ? "Adding…" : "Add Institution"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black">Remove Institution?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove <strong>{deleteTarget?.institutionName}</strong> from your letters list? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 font-black"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reset Confirm */}
            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black">Reset to Defaults?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete all current entries (including custom ones) and restore the 12 default institutions. Your progress will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => resetMutation.mutate()}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 font-black"
                        >
                            Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
