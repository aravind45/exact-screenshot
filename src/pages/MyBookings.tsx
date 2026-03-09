import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
    MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { api } from '@/lib/api';
import { toStringArray } from '@/lib/advisorData';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Sidebar } from '@/components/Sidebar';
import { BookingChatPanel } from '@/components/marketplace/BookingChatPanel';

type ClientBooking = {
    id: string;
    status: string;
    sessionDate: string | null;
    sessionDuration: number;
    totalAmount: number;
    platformFee: number;
    advisorPayout: number;
    cancellationReason?: string;
    advisor?: { expertise?: string[] | string; specialties?: string[] | string; user?: { fullName?: string; email?: string } };
    estate?: { name?: string };
};

const normalizeBookingStatus = (rawStatus?: string): string => {
    if (rawStatus === 'REQUESTED') return 'PENDING';
    return rawStatus || 'PENDING';
};

const normalizeBooking = (booking: any): ClientBooking => {
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
        totalAmount: Number(booking?.totalAmount || 0),
        platformFee: Number(booking?.platformFee || 0),
        advisorPayout: Number(booking?.advisorPayout || 0),
    };
};

export default function MyBookings() {
    const queryClient = useQueryClient();
    const [cancelReasonById, setCancelReasonById] = useState<Record<string, string>>({});

    const { data: bookingsPayload, isLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => api.marketplace.getMyMarketplaceBookings()
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => api.marketplace.cancelBooking(id, reason),
        onSuccess: (_data, variables) => {
            toast.success('Booking cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            setCancelReasonById((prev) => ({ ...prev, [variables.id]: '' }));
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to cancel booking');
        }
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
            CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
            COMPLETED: { variant: 'default', icon: CheckCircle, label: 'Completed' },
            CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
            REFUNDED: { variant: 'outline', icon: AlertCircle, label: 'Refunded' }
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

    const handleCancelBooking = (bookingId: string) => {
        const reason = (cancelReasonById[bookingId] || '').trim();
        if (!reason) {
            toast.error('Please provide a cancellation reason');
            return;
        }
        cancelMutation.mutate({ id: bookingId, reason });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="space-y-6">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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

    const bookingList: ClientBooking[] = rawBookings.map(normalizeBooking);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <main className="max-w-[1240px] w-full mx-auto px-6 py-8">
                    <div className="space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black tracking-tight">My Bookings</h1>
                                <p className="text-slate-500 text-lg">
                                    View and manage your advisor consultation bookings.
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <a href="/consultations/calendar">Calendar View</a>
                            </Button>
                        </div>

                        {bookingList.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-20">
                                    <Calendar className="w-16 h-16 text-slate-200 mb-4" />
                                    <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
                                    <p className="text-slate-500 mb-6 text-center max-w-md">
                                        You haven't booked any consultations yet. Browse our marketplace to find an advisor.
                                    </p>
                                    <Button asChild>
                                        <a href="/marketplace">Browse Advisors</a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {bookingList.map((booking) => {
                                    const sessionStart = booking.sessionDate;
                                    const expertiseList = toStringArray(booking.advisor?.expertise ?? booking.advisor?.specialties);
                                    const expertise = expertiseList.length > 0 ? expertiseList.join(', ') : 'General Consultation';

                                    return (
                                        <Card key={booking.id} className="overflow-hidden">
                                            <CardHeader className="bg-slate-50/50 border-b">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <CardTitle className="flex items-center gap-3">
                                                            <User className="w-5 h-5 text-indigo-600" />
                                                            {booking.advisor?.user?.fullName || 'Advisor'}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {expertise}
                                                        </CardDescription>
                                                    </div>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                                            <div>
                                                                <div className="text-sm text-slate-500">Session Date</div>
                                                                <div className="font-semibold">
                                                                    {sessionStart ? format(new Date(sessionStart), 'PPP p') : 'Not scheduled'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                                                            <div>
                                                                <div className="text-sm text-slate-500">Duration</div>
                                                                <div className="font-semibold">
                                                                    {booking.sessionDuration} {booking.sessionDuration === 1 ? 'Hour' : 'Hours'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {booking.estate && (
                                                            <div className="flex items-start gap-3">
                                                                <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                                                                <div>
                                                                    <div className="text-sm text-slate-500">Related Estate</div>
                                                                    <div className="font-semibold">{booking.estate.name || 'Estate'}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Total Amount</span>
                                                                <span className="font-bold">${booking.totalAmount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Platform Fee</span>
                                                                <span className="text-slate-500">${booking.platformFee.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm pt-2 border-t">
                                                                <span className="text-slate-600">Advisor Receives</span>
                                                                <span className="font-bold text-indigo-600">${booking.advisorPayout.toFixed(2)}</span>
                                                            </div>
                                                        </div>

                                                        {booking.status === 'PENDING' && (
                                                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                                                <div className="flex items-start gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                                                    <div className="text-xs text-amber-800">
                                                                        <strong>Awaiting Confirmation</strong>
                                                                        <p className="mt-1">The advisor will confirm your booking soon.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {booking.status === 'CONFIRMED' && (
                                                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                                                <div className="flex items-start gap-2">
                                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                                    <div className="text-xs text-green-800">
                                                                        <strong>Booking Confirmed</strong>
                                                                        <p className="mt-1">Your session is scheduled. The advisor will contact you.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {booking.cancellationReason && (
                                                            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                                                <div className="text-xs text-red-800">
                                                                    <strong>Cancellation Reason:</strong>
                                                                    <p className="mt-1">{booking.cancellationReason}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                    <div className="mt-6 pt-6 border-t flex justify-end">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" size="sm">
                                                                    Cancel Booking
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. Please provide a reason for cancellation.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <div className="py-4">
                                                                    <Textarea
                                                                        placeholder="Reason for cancellation..."
                                                                        value={cancelReasonById[booking.id] || ''}
                                                                        onChange={(e) => setCancelReasonById((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                                                                        rows={3}
                                                                    />
                                                                </div>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel onClick={() => setCancelReasonById((prev) => ({ ...prev, [booking.id]: '' }))}>
                                                                        Keep Booking
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleCancelBooking(booking.id)}
                                                                        disabled={cancelMutation.isPending}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        {cancelMutation.isPending ? (
                                                                            <>
                                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                Cancelling...
                                                                            </>
                                                                        ) : (
                                                                            'Cancel Booking'
                                                                        )}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                )}

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
                </main>
            </div>
        </div>
    );
}





