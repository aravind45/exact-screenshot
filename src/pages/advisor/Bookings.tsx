import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Calendar,
    User,
    CheckCircle,
    XCircle,
    MessageSquare,
    Loader2,
    Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { BookingChatPanel } from '@/components/marketplace/BookingChatPanel';

type AdvisorBooking = {
    id: string;
    status: string;
    sessionDate: string | null;
    sessionDuration: number;
    advisorPayout: number;
    user?: { fullName?: string; email?: string; createdAt?: string };
    estate?: { name?: string };
};

const normalizeBookingStatus = (rawStatus?: string): string => {
    if (rawStatus === 'REQUESTED') return 'PENDING';
    return rawStatus || 'PENDING';
};

const normalizeBooking = (booking: any): AdvisorBooking => {
    const sessionDate = booking?.startTime || booking?.sessionDate || null;
    const sessionDuration = booking?.sessionDuration
        ? Number(booking.sessionDuration)
        : booking?.durationMinutes
            ? Math.max(1, Math.round(Number(booking.durationMinutes) / 60))
            : 1;

    return {
        ...booking,
        id: booking?.id || '',
        status: normalizeBookingStatus(booking?.status),
        sessionDate,
        sessionDuration,
        advisorPayout: Number(booking?.advisorPayout || 0),
    };
};

export default function AdvisorBookings() {
    const queryClient = useQueryClient();
    const [cancelReasonById, setCancelReasonById] = useState<Record<string, string>>({});

    const { data: bookingsPayload, isLoading } = useQuery({
        queryKey: ['advisor-bookings'],
        queryFn: () => api.marketplace.getAdvisorBookings(),
    });

    const confirmMutation = useMutation({
        mutationFn: (id: string) => api.marketplace.confirmBooking(id),
        onSuccess: () => {
            toast.success('Booking confirmed');
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to confirm booking');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => api.marketplace.cancelBooking(id, reason),
        onSuccess: (_data, variables) => {
            toast.success('Booking cancelled');
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
            setCancelReasonById((prev) => ({ ...prev, [variables.id]: '' }));
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to cancel booking');
        }
    });

    const handleCancelBooking = (bookingId: string) => {
        const reason = (cancelReasonById[bookingId] || '').trim();
        if (!reason) {
            toast.error('Please provide a cancellation reason');
            return;
        }
        cancelMutation.mutate({ id: bookingId, reason });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            PENDING: { variant: 'secondary', icon: Calendar, label: 'Pending Action' },
            CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
            COMPLETED: { variant: 'default', icon: CheckCircle, label: 'Completed' },
            CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
            REFUNDED: { variant: 'outline', icon: XCircle, label: 'Refunded' },
        };

        const config = variants[status] || variants.PENDING;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const rawBookings = Array.isArray(bookingsPayload)
        ? bookingsPayload
        : Array.isArray((bookingsPayload as any)?.bookings)
            ? (bookingsPayload as any).bookings
            : Array.isArray((bookingsPayload as any)?.data)
                ? (bookingsPayload as any).data
                : [];

    const bookingList: AdvisorBooking[] = rawBookings.map(normalizeBooking);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-['Outfit'] font-bold text-slate-900">Bookings</h1>
                <p className="text-slate-500 mt-2">Manage your client sessions and schedule.</p>
            </div>

            {bookingList.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <Calendar className="w-16 h-16 text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
                        <p className="text-slate-500 mb-6 max-w-md">
                            When clients book time with you, requests will appear here for your approval.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {bookingList.map((booking) => {
                        const sessionStart = booking.sessionDate;
                        const clientSinceYear = booking.user?.createdAt ? new Date(booking.user.createdAt).getFullYear() : null;

                        return (
                            <Card key={booking.id} className="overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <User className="w-5 h-5 text-indigo-600" />
                                                {booking.user?.fullName || 'Client'}
                                            </CardTitle>
                                            <CardDescription>
                                                {clientSinceYear ? `Client since ${clientSinceYear}` : 'Client details unavailable'}
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(booking.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <Calendar className="w-6 h-6 text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-slate-500 font-medium">Session Time</div>
                                                    <div className="font-bold text-lg">
                                                        {sessionStart ? format(new Date(sessionStart), 'PPP p') : 'Not scheduled'}
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-1">
                                                        Duration: {booking.sessionDuration} hour{booking.sessionDuration === 1 ? '' : 's'}
                                                    </div>
                                                </div>
                                            </div>

                                            {booking.estate && (
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-slate-100 rounded-lg">
                                                        <MessageSquare className="w-6 h-6 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-slate-500 font-medium">Estate Details</div>
                                                        <div className="font-bold">{booking.estate.name || 'Estate'}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border-l-4 border-indigo-500">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-600 font-medium">Topic</span>
                                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">General Consultation</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                    <span className="text-slate-600 font-medium">Your Payout</span>
                                                    <span className="font-bold text-lg text-green-600">${booking.advisorPayout.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {booking.status === 'PENDING' && (
                                                <div className="flex gap-3 justify-end">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                Decline
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Decline Booking Request?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Please provide a reason for declining this request.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <div className="py-4">
                                                                <Textarea
                                                                    placeholder="Reason for declining..."
                                                                    value={cancelReasonById[booking.id] || ''}
                                                                    onChange={(e) => setCancelReasonById((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                                                                />
                                                            </div>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Decline Booking
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                    <Button
                                                        onClick={() => confirmMutation.mutate(booking.id)}
                                                        disabled={confirmMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        size="sm"
                                                    >
                                                        {confirmMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                                        Accept Request
                                                    </Button>
                                                </div>
                                            )}

                                            {booking.status === 'CONFIRMED' && (
                                                <div className="flex justify-end gap-3">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`mailto:${booking.user?.email || ''}`}>Email Client</a>
                                                    </Button>
                                                    <Button size="sm">
                                                        Join Meeting
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t">
                                        <BookingChatPanel
                                            bookingId={booking.id}
                                            canSend={!['CANCELLED', 'REFUNDED'].includes(booking.status)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
