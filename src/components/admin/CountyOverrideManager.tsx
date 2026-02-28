/**
 * County Override Manager Component
 * 
 * Manages county override approval workflow.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, Clock, FileDiff, MapPin, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { CountyOverrideWithApproval } from "@/jurisdiction/diagnostics/types";

export function CountyOverrideManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOverrideId, setSelectedOverrideId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Fetch pending overrides
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "county-overrides", "pending"],
    queryFn: () => api.admin.getPendingCountyOverrides(),
    enabled: activeTab === "pending",
  });

  // Fetch all overrides
  const { data: allOverridesData, isLoading: allLoading } = useQuery({
    queryKey: ["admin", "county-overrides", "all"],
    queryFn: () => api.admin.getCountyOverrides(),
    enabled: activeTab === "all",
  });

  // Fetch diff for selected override
  const { data: diffData, isLoading: diffLoading } = useQuery({
    queryKey: ["admin", "county-overrides", selectedOverrideId, "diff"],
    queryFn: () => api.admin.getCountyOverrideDiff(selectedOverrideId!),
    enabled: !!selectedOverrideId && isDiffModalOpen,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.admin.approveCountyOverride(id, notes),
    onSuccess: () => {
      toast({ title: "Override Approved", description: "The county override has been approved." });
      queryClient.invalidateQueries({ queryKey: ["admin", "county-overrides"] });
      setSelectedOverrideId(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Failed to approve override",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.admin.rejectCountyOverride(id, reason),
    onSuccess: () => {
      toast({ title: "Override Rejected", description: "The county override has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["admin", "county-overrides"] });
      setSelectedOverrideId(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message || "Failed to reject override",
      });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, notes: reviewNotes });
  };

  const handleReject = (id: string) => {
    if (!reviewNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
      });
      return;
    }
    rejectMutation.mutate({ id, reason: reviewNotes });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOverrideCard = (override: CountyOverrideWithApproval) => (
    <Card key={override.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{override.countyName}, {override.stateCode}</span>
              {getStatusBadge(override.status)}
            </div>
            <code className="text-xs text-muted-foreground">{override.taskId}</code>
            {override.title && (
              <p className="text-sm"><span className="font-medium">Title:</span> {override.title}</p>
            )}
            {override.feeAmount && (
              <p className="text-sm"><span className="font-medium">Fee:</span> ${override.feeAmount}</p>
            )}
            {override.formNames && override.formNames.length > 0 && (
              <p className="text-sm"><span className="font-medium">Forms:</span> {override.formNames.join(', ')}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOverrideId(override.id);
                setIsDiffModalOpen(true);
              }}
            >
              <FileDiff className="w-4 h-4 mr-1" />
              View Diff
            </Button>
            {override.status === 'PENDING_REVIEW' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(override.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(override.id)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Review notes input for pending items */}
        {override.status === 'PENDING_REVIEW' && (
          <div className="mt-4">
            <Textarea
              placeholder="Review notes (optional for approval, required for rejection)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        {/* Display review notes for reviewed items */}
        {override.reviewNotes && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <p className="font-medium text-muted-foreground">Review Notes:</p>
            <p>{override.reviewNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review
            {pendingData?.total > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingData.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingData?.data?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No pending overrides</p>
                <p className="text-sm text-muted-foreground">
                  All county overrides have been reviewed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {pendingData?.data?.length || 0} pending override{pendingData?.data?.length !== 1 ? 's' : ''}
              </p>
              {pendingData?.data?.map(renderOverrideCard)}
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {allLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {allOverridesData?.data?.length || 0} override{allOverridesData?.data?.length !== 1 ? 's' : ''}
              </p>
              {allOverridesData?.data?.map(renderOverrideCard)}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Diff Modal */}
      <Dialog open={isDiffModalOpen} onOpenChange={setIsDiffModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDiff className="w-5 h-5" />
              Override Diff
            </DialogTitle>
            <DialogDescription>
              Comparing override changes to the original task
            </DialogDescription>
          </DialogHeader>

          {diffLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : diffData ? (
            <div className="space-y-4">
              <div className="text-sm">
                <p><strong>State:</strong> {diffData.override.stateCode}</p>
                <p><strong>County:</strong> {diffData.override.countyName}</p>
                <p><strong>Task:</strong> {diffData.override.taskId}</p>
              </div>

              {Object.entries(diffData.diff).map(([field, change]) => {
                if (!change) return null;
                return (
                  <Card key={field}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 space-y-2">
                      <div className="p-2 bg-red-50 rounded text-sm">
                        <span className="text-red-600 font-medium">- Original:</span>
                        <pre className="mt-1 text-xs overflow-auto">
                          {JSON.stringify((change as { from: unknown }).from, null, 2)}
                        </pre>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-sm">
                        <span className="text-green-600 font-medium">+ Override:</span>
                        <pre className="mt-1 text-xs overflow-auto">
                          {JSON.stringify((change as { to: unknown }).to, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiffModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
