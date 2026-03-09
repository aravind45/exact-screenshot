import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Activity, Loader2, RefreshCw, RotateCcw, Play } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type WorkflowMetrics = {
  capturedAt: string;
  inbox: {
    received: number;
    failed: number;
    processing: number;
    deadLetter: number;
    processed24h: number;
    retryDueNow: number;
    backlogLagMinutes: number;
  };
  outbox: {
    pending: number;
    failed: number;
    processing: number;
    deadLetter: number;
    processed24h: number;
    retryDueNow: number;
    backlogLagMinutes: number;
  };
  workflows: {
    running: number;
    failed: number;
    completed24h: number;
  };
  deadLetters: {
    open: number;
    replayed24h: number;
    bookingOpen: number;
  };
  payouts: {
    releaseEventsPending: number;
    releaseEventsDeadLetter: number;
    escrowHoldsActive: number;
    escrowReleasesDue: number;
  };
};

type DeadLetterItem = {
  id: string;
  sourceTable: "INBOX" | "OUTBOX";
  sourceId: string;
  eventType: string;
  correlationId?: string | null;
  status: "OPEN" | "REPLAYED";
  reason: string;
  retryCount: number;
  movedAt: string;
  replayedAt?: string | null;
  summary?: {
    bookingId?: string | null;
    stripeEventId?: string | null;
  };
};

type DeadLetterResponse = {
  items: DeadLetterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const toInt = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export default function AdminWorkflowReliabilityPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<"OPEN" | "REPLAYED" | "">("OPEN");
  const [sourceTable, setSourceTable] = React.useState<"INBOX" | "OUTBOX" | "">("");
  const [eventType, setEventType] = React.useState("");

  const metricsQuery = useQuery<WorkflowMetrics>({
    queryKey: ["admin-workflow-metrics"],
    queryFn: async () => api.getWorkflowMetrics() as Promise<WorkflowMetrics>,
    staleTime: 15_000,
  });

  const deadLettersQuery = useQuery<DeadLetterResponse>({
    queryKey: ["admin-workflow-deadletters", page, status, sourceTable, eventType],
    queryFn: async () => api.getWorkflowDeadLetters({
      page,
      limit: 25,
      status: status || undefined,
      sourceTable: sourceTable || undefined,
      eventType: eventType.trim() || undefined,
    }) as Promise<DeadLetterResponse>,
    staleTime: 10_000,
  });

  const replayMutation = useMutation({
    mutationFn: async (deadLetterId: string) => api.replayWorkflowDeadLetter(deadLetterId),
    onSuccess: async () => {
      toast.success("Dead-letter replay requested");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-workflow-metrics"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-workflow-deadletters"] }),
      ]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to replay dead-letter event");
    },
  });

  const drainMutation = useMutation({
    mutationFn: async () => api.runWorkflowDrain(),
    onSuccess: async () => {
      toast.success("Workflow drain completed");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-workflow-metrics"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-workflow-deadletters"] }),
      ]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to run workflow drain");
    },
  });

  const metrics = metricsQuery.data;
  const deadLetters = Array.isArray(deadLettersQuery.data?.items) ? deadLettersQuery.data.items : [];

  React.useEffect(() => {
    setPage(1);
  }, [status, sourceTable, eventType]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workflow Reliability</h1>
              <p className="text-slate-500 text-sm mt-1">
                Durable inbox/outbox health, dead-letter queue, and replay controls.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  void metricsQuery.refetch();
                  void deadLettersQuery.refetch();
                }}
                disabled={metricsQuery.isFetching || deadLettersQuery.isFetching || drainMutation.isPending}
              >
                {(metricsQuery.isFetching || deadLettersQuery.isFetching) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>

              <Button
                onClick={() => drainMutation.mutate()}
                disabled={drainMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {drainMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Run Drain
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Inbox Backlog</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{toInt(metrics?.inbox.received) + toInt(metrics?.inbox.failed)}</p>
                <p className="text-xs text-slate-500 mt-1">Lag: {toInt(metrics?.inbox.backlogLagMinutes)} min</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Outbox Backlog</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{toInt(metrics?.outbox.pending) + toInt(metrics?.outbox.failed)}</p>
                <p className="text-xs text-slate-500 mt-1">Lag: {toInt(metrics?.outbox.backlogLagMinutes)} min</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Open Dead Letters</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{toInt(metrics?.deadLetters.open)}</p>
                <p className="text-xs text-slate-500 mt-1">Booking related: {toInt(metrics?.deadLetters.bookingOpen)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Running Workflows</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{toInt(metrics?.workflows.running)}</p>
                <p className="text-xs text-slate-500 mt-1">Failed: {toInt(metrics?.workflows.failed)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Payout Events Pending</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{toInt(metrics?.payouts.releaseEventsPending)}</p>
                <p className="text-xs text-slate-500 mt-1">Dead-lettered: {toInt(metrics?.payouts.releaseEventsDeadLetter)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Escrow Releases Due</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{toInt(metrics?.payouts.escrowReleasesDue)}</p>
                <p className="text-xs text-slate-500 mt-1">On hold: {toInt(metrics?.payouts.escrowHoldsActive)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-base font-bold text-slate-900">Dead-Letter Queue</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "OPEN" | "REPLAYED" | "")}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">All status</option>
                    <option value="OPEN">Open</option>
                    <option value="REPLAYED">Replayed</option>
                  </select>

                  <select
                    value={sourceTable}
                    onChange={(e) => setSourceTable(e.target.value as "INBOX" | "OUTBOX" | "")}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">All sources</option>
                    <option value="INBOX">Inbox</option>
                    <option value="OUTBOX">Outbox</option>
                  </select>

                  <input
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    placeholder="Filter event type"
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm min-w-[180px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {deadLettersQuery.isLoading ? (
                <div className="h-56 flex items-center justify-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dead-letter queue...
                </div>
              ) : deadLetters.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-500">No dead-letter events found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Retry</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deadLetters.map((item) => {
                      const replaying = replayMutation.isPending && replayMutation.variables === item.id;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="text-sm font-medium text-slate-900">{formatDistanceToNowStrict(new Date(item.movedAt), { addSuffix: true })}</div>
                            <div className="text-xs text-slate-500 font-mono">{item.id.slice(0, 10)}...</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-slate-900">{item.eventType}</div>
                            <div className="text-xs text-slate-500">booking: {item.summary?.bookingId || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.sourceTable}</Badge>
                            <div className="text-xs text-slate-500 mt-1">{item.sourceId.slice(0, 12)}...</div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">{item.retryCount}</TableCell>
                          <TableCell className="max-w-[320px] text-sm text-slate-700">{item.reason}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "OPEN" ? "destructive" : "secondary"}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.status === "OPEN" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={replayMutation.isPending}
                                onClick={() => replayMutation.mutate(item.id)}
                              >
                                {replaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                                Replay
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-500 inline-flex items-center"><Activity className="w-3 h-3 mr-1" />Complete</span>
                            )}
                          </TableCell>
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
              disabled={(deadLettersQuery.data?.page ?? 1) <= 1 || deadLettersQuery.isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">Page {deadLettersQuery.data?.page ?? 1} of {deadLettersQuery.data?.totalPages ?? 1}</span>
            <Button
              variant="outline"
              disabled={(deadLettersQuery.data?.page ?? 1) >= (deadLettersQuery.data?.totalPages ?? 1) || deadLettersQuery.isFetching}
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
