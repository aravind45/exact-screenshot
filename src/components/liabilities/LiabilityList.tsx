import { Liability } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, Trash2, Edit2, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function LiabilityList({ liabilities }: { liabilities: Liability[] }) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteLiability(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liabilities"] })
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => api.updateLiability(id, { status } as any),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liabilities"] })
    });

    if (liabilities.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No liabilities recorded</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Add funeral costs, medical bills, or credit card debts to start tracking the estate's obligations.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Creditor</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Note</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Due Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Amount</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {liabilities.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm text-slate-900">{item.name}</div>
                                    <div className="text-[10px] text-slate-500">{item.accountNumber ? `Acct: ${item.accountNumber}` : 'No Acct #'}</div>
                                </td>
                                <td className="px-6 py-4 max-w-[200px]">
                                    <div className="text-xs text-slate-600 truncate">{item.notes || "-"}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.dueDate ? (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(item.dueDate).toLocaleDateString()}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">No date</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-sm text-slate-900">
                                    ${item.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'PAID' })}>
                                                <Check className="w-4 h-4 mr-2 text-emerald-500" /> Mark as Paid
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-rose-600">
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        DISCOVERED: "bg-slate-100 text-slate-600",
        NOTICE_SENT: "bg-blue-50 text-blue-600",
        CLAIM_FILED: "bg-amber-50 text-amber-600",
        APPROVED: "bg-indigo-50 text-indigo-600",
        REJECTED: "bg-rose-50 text-rose-600",
        PAID: "bg-emerald-50 text-emerald-600",
        DISPUTED: "bg-red-50 text-red-600"
    };

    return (
        <Badge variant="secondary" className={`border-none ${variants[status] || variants.DISCOVERED} text-[10px] uppercase font-black tracking-wider`}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}
