import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    DollarSign,
    Users,
    Star,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Loader2,
    TrendingUp,
    ExternalLink,
    ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function AdvisorDashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch dashboard stats
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['advisor-stats'],
        queryFn: () => api.advisors.getDashboardStats()
    });

    // Fetch advisor bookings
    const { data: bookings, isLoading: isBookingsLoading } = useQuery({
        queryKey: ['advisor-bookings'],
        queryFn: () => api.bookings.getAdvisorBookings()
    });

    // Mutations for booking actions
    const confirmMutation = useMutation({
        mutationFn: (id: string) => api.bookings.confirm(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-stats'] });
            toast.success("Booking confirmed!");
        }
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => api.bookings.cancel(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advisor-bookings'] });
            toast.success("Booking cancelled.");
        }
    });

    if (isStatsLoading || isBookingsLoading) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Preparing your dashboard...</p>
            </div>
        );
    }

    const upcomingBookings = bookings?.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PAID') || [];
    const pendingBookings = bookings?.filter((b: any) => b.status === 'PENDING') || [];

    return (
        <div className="container mx-auto py-10 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight">Advisor Dashboard</h1>
                    <p className="text-slate-500">Welcome back, {user?.fullName}. Here's your business performance.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Stripe Dashboard
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => window.location.href = '/marketplace'}>
                        View My Listing
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Shared Volume"
                    value={`$${stats?.totalEarnings || 0}`}
                    subValue="All-time processed"
                    icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                    trend="+12% from last month"
                />
                <StatCard
                    title="Pending Payouts"
                    value={`$${stats?.pendingPayouts || 0}`}
                    subValue="Held in escrow"
                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                />
                <StatCard
                    title="Total Sessions"
                    value={stats?.totalSessions || 0}
                    subValue="Completed consultations"
                    icon={<Users className="w-5 h-5 text-indigo-600" />}
                    trend="+3 this week"
                />
                <StatCard
                    title="Average Rating"
                    value={stats?.averageRating || "N/A"}
                    subValue="From clients"
                    icon={<Star className="w-5 h-5 text-indigo-600 fill-indigo-100" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bookings Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Pending Approvals */}
                    <Card className="border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold">Pending Approvals</CardTitle>
                                <CardDescription>New session requests requiring your confirmation.</CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none">
                                {pendingBookings.length} New
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingBookings.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-sm italic">
                                        No pending requests at the moment.
                                    </div>
                                ) : (
                                    pendingBookings.map((booking: any) => (
                                        <BookingRow
                                            key={booking.id}
                                            booking={booking}
                                            onConfirm={() => confirmMutation.mutate(booking.id)}
                                            onCancel={() => cancelMutation.mutate({ id: booking.id, reason: 'Advisor rejected' })}
                                            isLoading={confirmMutation.isPending || cancelMutation.isPending}
                                        />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Schedule */}
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Upcoming Schedule</CardTitle>
                            <CardDescription>Your confirmed sessions for the next 30 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingBookings.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-sm italic">
                                        No upcoming sessions scheduled.
                                    </div>
                                ) : (
                                    upcomingBookings.map((booking: any) => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                                                    <span className="text-[10px] font-black uppercase text-indigo-600">{format(new Date(booking.sessionDate), "MMM")}</span>
                                                    <span className="text-lg font-black leading-none">{format(new Date(booking.sessionDate), "dd")}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="font-bold text-slate-900">{booking.user.fullName}</div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.sessionDuration} Hours</span>
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(booking.sessionDate), "p")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t border-slate-100 justify-center">
                            <Button variant="link" className="text-slate-500 hover:text-indigo-600 text-sm">View Full Calendar</Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Performance Widget */}
                    <Card className="bg-slate-900 text-white border-none shadow-xl shadow-slate-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16" />
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Growth Potential
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Your average rating is in the top 10%. Complete 5 more sessions to earn the "Top Rated" badge.
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Milestone Progress</span>
                                    <span>70%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[70%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resources */}
                    <Card className="border-slate-200 shadow-none bg-slate-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">Advisor Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <ResourceLink title="Best practices for consultations" />
                            <ResourceLink title="Understanding platform fees" />
                            <ResourceLink title="Optimizing your profile" />
                            <ResourceLink title="Escrow & Payout policy" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subValue, icon, trend }: any) {
    return (
        <Card className="border-slate-100 shadow-sm border-b-2 border-b-slate-100 hover:border-b-indigo-500 transition-all duration-300">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                        {icon}
                    </div>
                    {trend && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[10px]">
                            {trend}
                        </Badge>
                    )}
                </div>
                <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-900">{value}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">{title}</div>
                    <div className="text-[10px] text-slate-400">{subValue}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function BookingRow({ booking, onConfirm, onCancel, isLoading }: any) {
    return (
        <div className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {booking.user.fullName.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{booking.user.fullName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {format(new Date(booking.sessionDate), "PPP p")}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:flex-none border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ResourceLink({ title }: { title: string }) {
    return (
        <a href="#" className="flex items-center justify-between p-2 rounded-lg hover:bg-white hover:text-indigo-600 text-slate-500 transition-all text-sm group">
            <span className="truncate">{title}</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    );
}
