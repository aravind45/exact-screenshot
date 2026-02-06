import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Ban, RefreshCcw, Loader2 } from "lucide-react";

export function BillingManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [waiveNotes, setWaiveNotes] = useState("");
    const [refundNotes, setRefundNotes] = useState("");

    const { data: transactions, isLoading } = useQuery({
        queryKey: ["admin", "transactions"],
        queryFn: () => api.adminBilling.getTransactions()
    });

    const waiveMutation = useMutation({
        mutationFn: ({ userId, notes }: { userId: string; notes: string }) =>
            api.adminBilling.waiveFees(userId, notes),
        onSuccess: () => {
            toast({ title: "Fees Waived", description: "User has been granted free access." });
            queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setSelectedUser(null);
            setWaiveNotes("");
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Failed to waive fees", description: error.message });
        }
    });

    const refundMutation = useMutation({
        mutationFn: ({ transactionId, notes }: { transactionId: string; notes: string }) =>
            api.adminBilling.issueRefund(transactionId, notes),
        onSuccess: () => {
            toast({ title: "Refund Issued", description: "Refund has been processed successfully." });
            queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
            setRefundNotes("");
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Failed to issue refund", description: error.message });
        }
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>;

    return (
        <div className="space-y-6">
            <Card className="card-elevated border-none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Transaction Ledger</CardTitle>
                            <CardDescription>View all payments, waivers, and refunds</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions?.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{t.user.fullName || t.user.email}</div>
                                            <div className="text-xs text-muted-foreground">{t.user.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={t.type === 'PAYMENT' ? 'default' : t.type === 'REFUND' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 font-bold">
                                            ${Number(t.amount).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold ${t.status === 'SUCCESS' ? 'text-green-600' : t.status === 'REFUNDED' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                                            {t.notes || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {t.type === 'PAYMENT' && t.status === 'SUCCESS' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 h-7"
                                                    onClick={() => {
                                                        if (confirm('Issue refund for this transaction?')) {
                                                            refundMutation.mutate({ transactionId: t.id, notes: refundNotes || 'Admin refund' });
                                                        }
                                                    }}
                                                    disabled={refundMutation.isPending}
                                                >
                                                    <RefreshCcw className="w-3 h-3 mr-1" />
                                                    Refund
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions?.length === 0 && (
                            <div className="p-8 text-muted-foreground text-center">No transactions found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="card-elevated border-none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Ban className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Waive Fees</CardTitle>
                            <CardDescription>Grant free access to a user without payment</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">User ID</label>
                            <Input
                                placeholder="Enter user ID"
                                value={selectedUser || ""}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <Input
                                placeholder="Reason for waiving fees"
                                value={waiveNotes}
                                onChange={(e) => setWaiveNotes(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => {
                                if (selectedUser) {
                                    waiveMutation.mutate({ userId: selectedUser, notes: waiveNotes || 'Admin waived fees' });
                                }
                            }}
                            disabled={!selectedUser || waiveMutation.isPending}
                        >
                            {waiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                            Waive Fees
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
