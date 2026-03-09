import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Calendar,
    Clock,
    DollarSign,
    User,
    TrendingUp,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    CreditCard,
    Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import {
    Alert,
    AlertTitle,
    AlertDescription
} from "@/components/ui/alert";
import {
    ArrowRight
} from "lucide-react";

export default function AdvisorDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: stripeStatus, isLoading: stripeLoading } = useQuery({
        queryKey: ['stripe-status'],
        queryFn: () => api.advisors.getStripeStatus()
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['advisor-dashboard-stats'],
        queryFn: () => api.advisors.getDashboardStats()
    });

    const { data: bookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ['advisor-bookings'],
        queryFn: () => api.marketplace.getAdvisorBookings()
    });

    const { data: earnings, isLoading: earningsLoading } = useQuery({
        queryKey: ['advisor-earnings'],
        queryFn: () => api.advisors.getDashboardEarnings()
    });

    const confirmMutation = useMutation({
        mutationFn: (bookingId: string) => api.marketplace.confirmBooking(bookingId),
        onSuccess: () => {
            toast.success('Booking confirmed successfully');
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-dashboard-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to confirm booking');
        }
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
            CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
            COMPLETED: { variant: 'default', icon: CheckCircle, label: 'Completed' },
            CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelled' }
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

    if (statsLoading || bookingsLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="space-y-6">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-32" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const bookingList = Array.isArray(bookings)
        ? bookings
        : Array.isArray((bookings as any)?.bookings)
            ? (bookings as any).bookings
            : Array.isArray((bookings as any)?.data)
                ? (bookings as any).data
                : [];

    const pendingBookings = bookingList.filter((booking: any) => {
        const status = String(booking?.status || '').toUpperCase();
        return status === 'PENDING' || status === 'REQUESTED';
    });

    const upcomingSessions = Array.isArray((stats as any)?.upcomingSessions)
        ? (stats as any).upcomingSessions
        : [];

    return (
        <div className="container mx-auto py-10">
            <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Advisor Dashboard</h1>
                    <p className="text-slate-500 text-lg">
                        Manage your bookings and track your earnings.
                    </p>
                </div>

                {/* Stripe Payouts Reminder */}
                {!stripeLoading && !stripeStatus?.stripeOnboardingComplete && (
                    <Alert className="bg-indigo-50 border-indigo-100 text-indigo-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-50 border-2 border-dashed">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                                <CreditCard className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <AlertTitle className="text-2xl font-black tracking-tight">Setup Payouts</AlertTitle>
                                <AlertDescription className="text-indigo-600 font-medium">
                                    You need to connect your bank account to receive payments from clients.
                                </AlertDescription>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/advisor/payouts')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 px-8 rounded-2xl shadow-lg shadow-indigo-100 whitespace-nowrap"
                        >
                            Link Bank Account
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Alert>
                )}

                {/* Stats Overview */}
                <div className="grid md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Total Bookings
                            </CardTitle>
                            <Users className="w-4 h-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.stats.totalBookings || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Pending
                            </CardTitle>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">
                                {stats?.stats.pendingBookings || 0}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Awaiting confirmation</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Total Earnings
                            </CardTitle>
                            <DollarSign className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                ${Number(stats?.stats.totalEarnings || 0).toFixed(0)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Pending Payout
                            </CardTitle>
                            <CreditCard className="w-4 h-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-600">
                                ${Number(stats?.stats.pendingEarnings || 0).toFixed(0)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">In escrow</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Bookings */}
                {pendingBookings.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                            Pending Bookings
                            <Badge variant="secondary">{pendingBookings.length}</Badge>
                        </h2>

                        <div className="grid gap-4">
                            {pendingBookings.map((booking: any) => (
                                <Card key={booking.id} className="border-amber-200 bg-amber-50/30">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <div className="font-bold">{booking.user.fullName}</div>
                                                        <div className="text-sm text-slate-500">{booking.user.email}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span>
                                                            {booking.sessionDate
                                                                ? format(new Date(booking.sessionDate), 'PPP')
                                                                : 'Not scheduled'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span>{booking.sessionDuration || 1} Hours</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                                        <span className="font-bold text-green-600">
                                                            ${Number(booking.advisorPayout).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {booking.estate && (
                                                    <div className="text-sm text-slate-600">
                                                        <strong>Estate:</strong> {booking.estate.name}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={() => confirmMutation.mutate(booking.id)}
                                                disabled={confirmMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {confirmMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Confirming...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Confirm Booking
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Sessions */}
                {upcomingSessions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                            Upcoming Sessions
                        </h2>

                        <div className="grid gap-4">
                            {upcomingSessions.map((session: any) => (
                                <Card key={session.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <div className="font-bold">{session.user.fullName}</div>
                                                        <div className="text-sm text-slate-500">{session.user.email}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span className="font-semibold">
                                                            {format(new Date(session.sessionDate), 'PPP')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span>{session.sessionDuration} Hours</span>
                                                    </div>
                                                </div>

                                                {session.estate && (
                                                    <div className="text-sm text-slate-600">
                                                        <strong>Estate:</strong> {session.estate.name}
                                                    </div>
                                                )}
                                            </div>

                                            {getStatusBadge(session.status)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Earnings Breakdown */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                        Earnings History
                    </h2>

                    {earningsLoading ? (
                        <Card>
                            <CardContent className="py-10">
                                <div className="flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                </div>
                            </CardContent>
                        </Card>
                    ) : !earnings?.earnings || earnings.earnings.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-10 text-center">
                                <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500">No earnings yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Client
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Session Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Platform Fee
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Your Payout
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {earnings.earnings.map((earning: any) => (
                                                <tr key={earning.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium">{earning.clientName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {earning.sessionDate
                                                            ? format(new Date(earning.sessionDate), 'MMM d, yyyy')
                                                            : 'Not scheduled'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        ${earning.totalAmount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        ${earning.platformFee.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                        ${earning.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge
                                                            variant={earning.payoutStatus === 'PAID' ? 'default' : 'secondary'}
                                                        >
                                                            {earning.payoutStatus}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Escrow Notice */}
                <Card className="bg-indigo-50 border-indigo-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="font-bold text-indigo-900">About Escrow & Payouts</h3>
                                <p className="text-sm text-indigo-700">
                                    Payments are held in escrow for 30 days after the session to ensure quality service.
                                    Funds are automatically released to your connected Stripe account after the escrow period.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

