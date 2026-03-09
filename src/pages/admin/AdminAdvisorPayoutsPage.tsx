import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Loader2, RefreshCw, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PayoutQueueItem = {
  id: string;
  status: string;
  payoutStatus: string;
  advisorPayout: number | string;
  platformFee: number | string;
  totalAmount: number | string;
  escrowReleaseDate?: string | null;
  dueForRelease?: boolean;
  user?: { fullName?: string | null; email?: string | null };
  advisor?: { user?: { fullName?: string | null; email?: string | null } };
};

type PayoutQueueResponse = {
  items: PayoutQueueItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  dueCount: number;
  pendingCount: number;
  holdDays: number;
  nextReleaseAt?: string | null;
};

const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
};

export default function AdminAdvisorPayoutsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);

  const payoutQueueQuery = useQuery<PayoutQueueResponse>({
    queryKey: ["admin-advisor-payout-queue", page],
    queryFn: async () => api.marketplace.admin.getPayoutQueue({ page, limit: 25 }) as Promise<PayoutQueueResponse>,
    staleTime: 20_000,
  });

  const releaseMutation = useMutation({
    mutationFn: async () => api.marketplace.admin.releaseDuePayouts(true),
    onSuccess: async (payload: any) => {
      const paid = Number(payload?.payoutResult?.paid ?? 0);
      const failed = Number(payload?.payoutResult?.failed ?? 0);
      toast.success(`Payout job completed: ${paid} paid, ${failed} failed`);
      await queryClient.invalidateQueries({ queryKey: ["admin-advisor-payout-queue"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to release due payouts");
    },
  });

  const data = payoutQueueQuery.data;
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Advisor Payout Queue</h1>
              <p className="text-slate-500 text-sm mt-1">
                Manual control for escrow releases. Escrow hold: {data?.holdDays ?? 30} days.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => payoutQueueQuery.refetch()}
                disabled={payoutQueueQuery.isFetching || releaseMutation.isPending}
              >
                {payoutQueueQuery.isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
              <Button
                onClick={() => releaseMutation.mutate()}
                disabled={releaseMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {releaseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Release Due Payouts
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Due Now</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-black text-slate-900">{data?.dueCount ?? 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Pending</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-black text-slate-900">{data?.pendingCount ?? 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Total Queue</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-black text-slate-900">{data?.total ?? 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Next Release</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-slate-900">
                  {data?.nextReleaseAt ? format(new Date(data.nextReleaseAt), "MMM d, yyyy") : "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              {payoutQueueQuery.isLoading ? (
                <div className="h-56 flex items-center justify-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading payout queue...
                </div>
              ) : items.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-500">No escrow payouts in queue.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Advisor</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Escrow Release</TableHead>
                      <TableHead className="text-right">Advisor Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const releaseDate = item.escrowReleaseDate ? new Date(item.escrowReleaseDate) : null;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.id.slice(0, 12)}...</TableCell>
                          <TableCell>
                            <div className="font-semibold text-slate-900">{item.advisor?.user?.fullName || "-"}</div>
                            <div className="text-xs text-slate-500">{item.advisor?.user?.email || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-slate-900">{item.user?.fullName || "-"}</div>
                            <div className="text-xs text-slate-500">{item.user?.email || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit">{item.status}</Badge>
                              <Badge variant={item.dueForRelease ? "default" : "secondary"} className="w-fit">{item.dueForRelease ? "DUE" : "PENDING"}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {releaseDate ? (
                              <>
                                <div className="font-medium text-slate-900">{format(releaseDate, "MMM d, yyyy")}</div>
                                <div className="text-xs text-slate-500">{formatDistanceToNowStrict(releaseDate, { addSuffix: true })}</div>
                              </>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">{formatMoney(item.advisorPayout)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              disabled={(data?.page ?? 1) <= 1 || payoutQueueQuery.isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">Page {data?.page ?? 1} of {data?.totalPages ?? 1}</span>
            <Button
              variant="outline"
              disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1) || payoutQueueQuery.isFetching}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

