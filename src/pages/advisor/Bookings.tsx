import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    XCircle,
    MessageSquare,
    Loader2,
    Check,
    X
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

export default function AdvisorBookings() {
    const queryClient = useQueryClient();
    const [cancelReason, setCancelReason] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

    const { data: bookings, isLoading } = useQuery({
        queryKey: ['advisor-bookings'],
        queryFn: () => api.bookings.getAdvisorBookings()
    });

    const confirmMutation = useMutation({
        mutationFn: (id: string) => api.bookings.confirm(id),
        onSuccess: () => {
            toast.success('Booking confirmed');
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to confirm booking');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.bookings.cancel(id, reason),
        onSuccess: () => {
            toast.success('Booking cancelled');
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
            setSelectedBooking(null);
            setCancelReason('');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to cancel booking');
        }
    });

    const handleCancelBooking = (bookingId: string) => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }
        cancelMutation.mutate({ id: bookingId, reason: cancelReason });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            PENDING: { variant: 'secondary', icon: Clock, label: 'Pending Action' },
            CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
            COMPLETED: { variant: 'default', icon: CheckCircle, label: 'Completed' },
            CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
            REFUNDED: { variant: 'outline', icon: XCircle, label: 'Refunded' }
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-['Outfit'] font-bold text-slate-900">Bookings</h1>
                <p className="text-slate-500 mt-2">Manage your client sessions and schedule.</p>
            </div>

            {!bookings || bookings.length === 0 ? (
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
                    {bookings.map((booking: any) => (
                        <Card key={booking.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="w-5 h-5 text-indigo-600" />
                                            {booking.user.fullName}
                                        </CardTitle>
                                        <CardDescription>
                                            Client since {new Date(booking.user.createdAt || new Date()).getFullYear()}
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
                                                    {booking.sessionDate
                                                        ? format(new Date(booking.sessionDate), 'PPP p')
                                                        : 'Not scheduled'}
                                                </div>
                                                <div className="text-sm text-slate-500 mt-1">
                                                    Duration: {booking.sessionDuration} {booking.sessionDuration === 1 ? 'hour' : 'hours'}
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
                                                    <div className="font-bold">{booking.estate.name}</div>
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
                                                <span className="font-bold text-lg text-green-600">${Number(booking.advisorPayout).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {booking.status === 'PENDING' && (
                                            <div className="flex gap-3 justify-end">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking.id)}>
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
                                                                value={cancelReason}
                                                                onChange={(e) => setCancelReason(e.target.value)}
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
                                                    <a href={`mailto:${booking.user.email}`}>Email Client</a>
                                                </Button>
                                                <Button size="sm">
                                                    Join Meeting
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
