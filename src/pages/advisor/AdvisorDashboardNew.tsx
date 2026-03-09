import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, DollarSign, CheckCircle, Loader2, AlertCircle, ArrowRight, ShieldCheck, CreditCard, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type VerifStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAUSED';

type DashboardBooking = {
  id: string;
  status: string;
  sessionDate: string | null;
  sessionDuration: number;
  user?: { fullName?: string; email?: string };
};

const STATUS_CONFIG: Record<VerifStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft - Complete your profile', color: 'text-slate-600', bg: 'bg-slate-100' },
  PENDING_REVIEW: { label: 'Under Review - We are reviewing your application', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  APPROVED: { label: 'Approved - You are live on the marketplace!', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Rejected - Please update your profile and resubmit', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  PAUSED: { label: 'Paused - Your listing is temporarily hidden', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

const normalizeVerificationStatus = (rawStatus?: string): VerifStatus => {
  if (rawStatus === 'PENDING') return 'PENDING_REVIEW';
  if (rawStatus === 'VERIFIED') return 'APPROVED';
  if (rawStatus === 'PENDING_REVIEW' || rawStatus === 'APPROVED' || rawStatus === 'REJECTED' || rawStatus === 'PAUSED' || rawStatus === 'DRAFT') {
    return rawStatus;
  }
  return 'DRAFT';
};

const normalizeBookingStatus = (rawStatus?: string): string => {
  if (rawStatus === 'REQUESTED') return 'PENDING';
  return rawStatus || 'PENDING';
};

const normalizeBooking = (booking: any): DashboardBooking => {
  const sessionDate = booking?.sessionDate || booking?.startTime || null;
  const durationHours = booking?.sessionDuration
    ? Number(booking.sessionDuration)
    : booking?.durationMinutes
      ? Math.max(1, Math.round(Number(booking.durationMinutes) / 60))
      : 1;

  return {
    ...booking,
    id: booking?.id || '',
    status: normalizeBookingStatus(booking?.status),
    sessionDate,
    sessionDuration: durationHours,
  };
};

function StatCard({ title, value, icon: Icon, trend, color = 'text-slate-900' }: { title: string; value: string | number; icon: any; trend?: string; color?: string }) {
  return (
    <Card className="rounded-xl border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle><Icon className="w-4 h-4 text-slate-400" /></CardHeader>
      <CardContent><div className={cn('text-3xl font-bold', color)}>{value}</div>{trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}</CardContent>
    </Card>
  );
}

export default function AdvisorDashboardNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['advisor-me'],
    queryFn: () => api.advisors.getMe(),
  });

  const { data: statsPayload, isLoading: statsLoading } = useQuery({
    queryKey: ['advisor-dashboard-stats'],
    queryFn: () => api.advisors.getDashboardStats(),
  });

  const { data: bookingsPayload, isLoading: bookingsLoading } = useQuery({
    queryKey: ['advisor-bookings-dashboard'],
    queryFn: () => api.marketplace.getAdvisorBookings(),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.marketplace.confirmBooking(id),
    onSuccess: () => {
      toast.success('Booking confirmed');
      queryClient.invalidateQueries({ queryKey: ['advisor-bookings-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-dashboard-stats'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to confirm booking'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.marketplace.cancelBooking(id, 'Cancelled by advisor'),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['advisor-bookings-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-dashboard-stats'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to cancel booking'),
  });

  const verifStatus: VerifStatus = normalizeVerificationStatus(profile?.status || profile?.verificationStatus);
  const statusCfg = STATUS_CONFIG[verifStatus] || STATUS_CONFIG.DRAFT;
  const stats = statsPayload?.stats ?? statsPayload ?? {};

  const rawBookings = Array.isArray(bookingsPayload)
    ? bookingsPayload
    : Array.isArray((bookingsPayload as any)?.bookings)
      ? (bookingsPayload as any).bookings
      : [];

  const allBookings: DashboardBooking[] = rawBookings.map(normalizeBooking);

  const upcoming = allBookings.filter((booking) => {
    if (!booking.sessionDate) return false;
    const startsAt = new Date(booking.sessionDate);
    if (Number.isNaN(startsAt.getTime())) return false;
    return ['CONFIRMED', 'PENDING'].includes(booking.status) && startsAt > new Date();
  });

  const profileComplete = {
    bio: !!profile?.bio,
    rates: !!profile?.hourlyRate,
    availability: true,
    docs: (Array.isArray(profile?.documents) ? profile.documents.length : Array.isArray(profile?.licenseDocuments) ? profile.licenseDocuments.length : 0) > 0,
    submitted: verifStatus !== 'DRAFT',
  };

  const completeness = Object.values(profileComplete).filter(Boolean).length;

  if (profileLoading || statsLoading) {
    return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-black text-slate-900">Advisor Dashboard</h1><p className="text-slate-500">Manage your bookings and track performance.</p></div>
        {verifStatus === 'DRAFT' && <Button onClick={() => navigate('/advisor/onboarding')} className="bg-indigo-600 hover:bg-indigo-700">Complete Onboarding <ArrowRight className="w-4 h-4 ml-2" /></Button>}
      </div>

      <div className={cn('rounded-xl border p-4 flex items-center gap-3', statusCfg.bg)}>
        {verifStatus === 'APPROVED' ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
        <p className={cn('font-medium text-sm', statusCfg.color)}>{statusCfg.label}</p>
        <Badge className="ml-auto text-xs">{verifStatus.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats?.totalBookings ?? 0} icon={BookOpen} trend="All time" />
        <StatCard title="Upcoming" value={upcoming.length} icon={Calendar} trend="Confirmed sessions" />
        <StatCard title="Total Earnings" value={`$${Number(stats?.totalEarnings ?? 0).toFixed(0)}`} icon={DollarSign} color="text-emerald-600" trend="All time" />
        <StatCard title="Pending Payout" value={`$${Number(stats?.pendingEarnings ?? 0).toFixed(0)}`} icon={CreditCard} color="text-indigo-600" trend="In escrow" />
      </div>

      <Card className="rounded-xl border-slate-200">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2">Profile Completeness <Badge className="bg-indigo-100 text-indigo-700 border-0">{completeness}/5</Badge></CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(profileComplete).map(([key, done]) => (
              <div key={key} className={cn('flex flex-col items-center gap-1 p-3 rounded-lg border text-center', done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200')}>
                {done ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                <span className={cn('text-xs font-medium capitalize', done ? 'text-emerald-700' : 'text-slate-400')}>{key}</span>
              </div>
            ))}
          </div>
          {completeness < 5 && <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/advisor/onboarding')}>Complete Your Profile</Button>}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" />Upcoming Sessions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {bookingsLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div> : upcoming.length === 0 ? (
            <div className="py-10 text-center"><Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" /><p className="text-slate-500 text-sm">No upcoming sessions.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b"><tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {upcoming.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="font-medium text-sm">{booking.user?.fullName || 'Client'}</div><div className="text-xs text-slate-400">{booking.user?.email || '-'}</div></td>
                      <td className="px-4 py-3 text-sm">{booking.sessionDate ? format(new Date(booking.sessionDate), 'MMM d, yyyy h:mm a') : '-'}</td>
                      <td className="px-4 py-3 text-sm">{booking.sessionDuration} hr{booking.sessionDuration !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3"><Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'} className={cn(booking.status === 'CONFIRMED' && 'bg-emerald-100 text-emerald-700 border-0')}>{booking.status}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {booking.status === 'PENDING' && <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(booking.id)}>Confirm</Button>}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(booking.id)}>Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

