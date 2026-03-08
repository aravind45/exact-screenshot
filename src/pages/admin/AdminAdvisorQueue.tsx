import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ShieldCheck, XCircle, Pause, Play, Eye, Loader2, AlertCircle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sidebar } from '@/components/Sidebar';

type VerifStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAUSED';
type AdminAction = 'approve' | 'reject' | 'pause' | 'unpause';

interface AdvisorQueueItem {
  id: string;
  bio: string;
  advisorType: string;
  verificationStatus: VerifStatus;
  createdAt: string;
  documents: any[];
  user: { fullName: string; email: string };
}

interface AdvisorQueueApiItem {
  id?: string;
  bio?: string;
  advisorType?: string;
  status?: string;
  verificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  documents?: any[];
  licenseDocuments?: any[];
  user?: { fullName?: string; email?: string };
}

const STATUS_TABS = ['All', 'Pending Review', 'Approved', 'Rejected', 'Paused'] as const;
const STATUS_MAP: Record<string, VerifStatus[]> = {
  All: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAUSED'],
  'Pending Review': ['PENDING_REVIEW'],
  Approved: ['APPROVED'],
  Rejected: ['REJECTED'],
  Paused: ['PAUSED'],
};
const STATUS_COLORS: Record<VerifStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-orange-100 text-orange-700',
};

const normalizeStatus = (status?: string): VerifStatus => {
  if (status === 'PENDING') return 'PENDING_REVIEW';
  if (status === 'VERIFIED') return 'APPROVED';
  if (status === 'PENDING_REVIEW' || status === 'APPROVED' || status === 'REJECTED' || status === 'PAUSED' || status === 'DRAFT') {
    return status;
  }
  return 'DRAFT';
};

const normalizeAdvisor = (advisor: AdvisorQueueApiItem): AdvisorQueueItem => ({
  id: advisor.id ?? '',
  bio: advisor.bio ?? '',
  advisorType: advisor.advisorType ?? '',
  verificationStatus: normalizeStatus(advisor.status ?? advisor.verificationStatus),
  createdAt: advisor.createdAt ?? advisor.updatedAt ?? '',
  documents: Array.isArray(advisor.documents) ? advisor.documents : Array.isArray(advisor.licenseDocuments) ? advisor.licenseDocuments : [],
  user: {
    fullName: advisor.user?.fullName ?? 'Unknown Advisor',
    email: advisor.user?.email ?? 'unknown@example.com',
  },
});

export default function AdminAdvisorQueue() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; advisorId: string; reason: string }>({
    open: false,
    advisorId: '',
    reason: '',
  });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; advisorId: string; action: 'approve' | 'pause' | 'unpause' }>({
    open: false,
    advisorId: '',
    action: 'approve',
  });
  const [detailModal, setDetailModal] = useState<{ open: boolean; advisor: AdvisorQueueItem | null }>({ open: false, advisor: null });

  const { data: advisors, isLoading, isError } = useQuery<AdvisorQueueItem[]>({
    queryKey: ['admin-advisor-queue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/marketplace/advisors', {
        headers: { Authorization: `Bearer ${api.getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to load advisors');

      const payload = await res.json();
      const advisorList = Array.isArray(payload) ? payload : Array.isArray(payload?.advisors) ? payload.advisors : [];
      return advisorList.map((advisor: AdvisorQueueApiItem) => normalizeAdvisor(advisor));
    },
  });

  const mutateStatus = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: AdminAction; reason?: string }) => {
      const body = reason ? JSON.stringify({ reason }) : undefined;
      const res = await fetch(`/api/admin/marketplace/advisors/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.getToken()}` },
        ...(body ? { body } : {}),
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-advisor-queue'] });
      const messageMap: Record<AdminAction, string> = {
        approve: 'Advisor approved',
        reject: 'Advisor rejected',
        pause: 'Advisor paused',
        unpause: 'Advisor unpaused',
      };
      toast.success(messageMap[variables.action] || 'Advisor status updated');
      setRejectModal(m => ({ ...m, open: false }));
      setConfirmModal(m => ({ ...m, open: false }));
    },
    onError: (e: any) => toast.error(e?.message || 'Action failed'),
  });

  const all: AdvisorQueueItem[] = advisors ?? [];
  const filtered = all.filter(a => {
    const inTab = STATUS_MAP[tab]?.includes(a.verificationStatus);
    const inSearch =
      !search ||
      a.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase());
    return inTab && inSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <div className="max-w-7xl mx-auto px-6 py-8 w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900">Advisor Review Queue</h1>
            <p className="text-slate-500">Review and manage advisor applications.</p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <TabsList className="bg-slate-100">
                {STATUS_TABS.map(t => (
                  <TabsTrigger key={t} value={t}>
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search advisors..."
                  className="pl-10 w-64 bg-white"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {STATUS_TABS.map(t => (
              <TabsContent key={t} value={t}>
                <Card className="rounded-xl border-slate-200">
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      </div>
                    ) : isError ? (
                      <div className="flex items-center justify-center gap-2 py-12 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span>Failed to load advisors.</span>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="py-12 text-center text-slate-500">No advisors in this category.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map(advisor => (
                            <TableRow key={advisor.id}>
                              <TableCell className="font-medium">{advisor.user.fullName}</TableCell>
                              <TableCell className="text-sm text-slate-500">{advisor.user.email}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{advisor.advisorType || '—'}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-slate-500">
                                {advisor.createdAt ? format(new Date(advisor.createdAt), 'MMM d, yyyy') : '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{advisor.documents?.length ?? 0} docs</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn('border-0', STATUS_COLORS[advisor.verificationStatus] || 'bg-slate-100 text-slate-600')}>
                                  {advisor.verificationStatus.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    title="View Details"
                                    onClick={() => setDetailModal({ open: true, advisor })}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>

                                  {advisor.verificationStatus !== 'APPROVED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => setConfirmModal({ open: true, advisorId: advisor.id, action: 'approve' })}
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                      Approve
                                    </Button>
                                  )}

                                  {advisor.verificationStatus !== 'REJECTED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => setRejectModal({ open: true, advisorId: advisor.id, reason: '' })}
                                    >
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
                                      Reject
                                    </Button>
                                  )}

                                  {advisor.verificationStatus === 'PAUSED' ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-orange-600"
                                      onClick={() => setConfirmModal({ open: true, advisorId: advisor.id, action: 'unpause' })}
                                    >
                                      <Play className="w-3.5 h-3.5 mr-1" />
                                      Unpause
                                    </Button>
                                  ) : advisor.verificationStatus === 'APPROVED' ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-slate-600"
                                      onClick={() => setConfirmModal({ open: true, advisorId: advisor.id, action: 'pause' })}
                                    >
                                      <Pause className="w-3.5 h-3.5 mr-1" />
                                      Pause
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <Dialog open={rejectModal.open} onOpenChange={o => setRejectModal(m => ({ ...m, open: o }))}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Advisor</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Rejection Reason</Label>
                <Textarea
                  placeholder="Explain why this application is rejected..."
                  value={rejectModal.reason}
                  onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectModal(m => ({ ...m, open: false }))}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  disabled={mutateStatus.isPending || !rejectModal.reason.trim()}
                  onClick={() =>
                    mutateStatus.mutate({ id: rejectModal.advisorId, action: 'reject', reason: rejectModal.reason })
                  }
                >
                  {mutateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={confirmModal.open} onOpenChange={o => setConfirmModal(m => ({ ...m, open: o }))}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                Are you sure you want to <strong>{confirmModal.action}</strong> this advisor?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmModal(m => ({ ...m, open: false }))}>
                  Cancel
                </Button>
                <Button
                  className={cn(confirmModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700')}
                  disabled={mutateStatus.isPending}
                  onClick={() => mutateStatus.mutate({ id: confirmModal.advisorId, action: confirmModal.action })}
                >
                  {mutateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={detailModal.open} onOpenChange={o => setDetailModal(m => ({ ...m, open: o }))}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{detailModal.advisor?.user?.fullName}</DialogTitle>
              </DialogHeader>
              {detailModal.advisor && (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">Email: </span>
                    {detailModal.advisor.user.email}
                  </div>
                  <div>
                    <span className="text-slate-500">Type: </span>
                    {detailModal.advisor.advisorType || '—'}
                  </div>
                  <div>
                    <span className="text-slate-500">Status: </span>
                    <Badge className={cn('border-0', STATUS_COLORS[detailModal.advisor.verificationStatus])}>
                      {detailModal.advisor.verificationStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-500">Bio: </span>
                    {detailModal.advisor.bio || 'No bio.'}
                  </div>
                  <div>
                    <span className="text-slate-500">Documents: </span>
                    {detailModal.advisor.documents?.length ?? 0}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

