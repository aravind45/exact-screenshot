import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Clock, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Deadline {
    id: string;
    title: string;
    dueDate: string;
    status: string;
    isStatutory: boolean;
}

export function DeadlineTracker({ estateId }: { estateId: string }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState("");

    const { data: deadlines = [], isLoading } = useQuery({
        queryKey: ["deadlines", estateId],
        queryFn: () => api.getDeadlines(estateId),
        enabled: !!estateId
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.createDeadline(estateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deadlines", estateId] });
            setIsAdding(false);
            setNewTitle("");
            setNewDate("");
            toast({ title: "Deadline Added", description: "Your calendar has been updated." });
        }
    });

    const generateMutation = useMutation({
        mutationFn: () => api.generateDeadlines(estateId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["deadlines", estateId] });
            toast({ title: "Deadlines Generated", description: `Added ${data.length} statutory deadlines.` });
        }
    });

    const handleAdd = () => {
        if (!newTitle || !newDate) return;
        createMutation.mutate({ title: newTitle, dueDate: newDate });
    };

    const isOverdue = (dateStr: string) => {
        return new Date(dateStr) < new Date();
    };

    const getDaysRemaining = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    if (isLoading) return <div className="animate-pulse h-48 bg-slate-100 rounded-xl" />;

    return (
        <Card className="bg-white border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Critical Dates</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    {deadlines.length === 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-violet-600"
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                        >
                            <Clock className="w-3 h-3 mr-1" />
                            Auto-Generate
                        </Button>
                    )}
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
                                        placeholder="e.g., File Tax Return"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleAdd} disabled={createMutation.isPending}>
                                    Save Date
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-1">
                {deadlines.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-100 rounded-xl">
                        <Clock className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500 font-medium">No deadlines tracked</p>
                        <p className="text-xs text-slate-400">Add key dates to stay compliant</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deadlines.map((d: Deadline) => {
                            const days = getDaysRemaining(d.dueDate);
                            const overdue = days < 0;
                            const urgent = days <= 30 && !overdue;

                            return (
                                <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-200 transition-colors group">
                                    <div className={cn(
                                        "mt-1 w-2 h-2 rounded-full shrink-0",
                                        overdue ? "bg-rose-500 shadow-rose-200" : (urgent ? "bg-amber-500 shadow-amber-200" : "bg-emerald-500 shadow-emerald-200"),
                                        "shadow-sm"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{d.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                {new Date(d.dueDate).toLocaleDateString()}
                                            </span>
                                            {d.isStatutory && (
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Legal</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {overdue ? (
                                            <div className="flex items-center gap-1 text-rose-600 font-bold text-xs">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{Math.abs(days)}d Late</span>
                                            </div>
                                        ) : (
                                            <div className={cn("text-xs font-bold", urgent ? "text-amber-600" : "text-emerald-600")}>
                                                {days}d Left
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
