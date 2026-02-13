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
    User,
    MessageSquare,
    XCircle,
    Loader2,
    ChevronRight,
    MapPin,
    ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { format, isAfter } from "date-fns";
import { toast } from "sonner";
import ReviewModal from "@/components/advisor/ReviewModal";
import { cn } from "@/lib/utils";

export default function MyBookings() {
    const queryClient = useQueryClient();
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const { data: bookings, isLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => api.bookings.getMyBookings()
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => api.bookings.cancel(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            toast.success("Booking cancelled successfuly.");
        }
    });

    if (isLoading) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Fetching your bookings...</p>
            </div>
        );
    }

    const upcoming = bookings?.filter((b: any) =>
        (b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'PENDING') &&
        isAfter(new Date(b.sessionDate), new Date())
    ) || [];

    const past = bookings?.filter((b: any) =>
        b.status === 'COMPLETED' || !isAfter(new Date(b.sessionDate), new Date())
    ) || [];

    return (
        <div className="container mx-auto py-12 max-w-5xl space-y-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight">Consultations</h1>
                <p className="text-slate-500 text-lg">Manage your sessions with professional advisors.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Upcoming Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            Upcoming Sessions
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-none">
                                {upcoming.length}
                            </Badge>
                        </h2>

                        {upcoming.length === 0 ? (
                            <Card className="border-dashed border-2 border-slate-100 bg-slate-50/30">
                                <CardContent className="py-12 text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                                        <Calendar className="w-6 h-6 text-slate-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-500 font-medium">No upcoming sessions</p>
                                        <p className="text-xs text-slate-400">Find an expert to help with your estate settlement.</p>
                                    </div>
                                    <Button onClick={() => window.location.href = '/marketplace'} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                                        Browse Marketplace
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {upcoming.map((booking: any) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        isUpcoming={true}
                                        onCancel={() => cancelMutation.mutate({ id: booking.id, reason: 'User cancelled' })}
                                        isLoading={cancelMutation.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-400">Past History</h2>
                        <div className="space-y-4">
                            {past.map((booking: any) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    isUpcoming={false}
                                    onReview={() => {
                                        setSelectedBooking(booking);
                                        setIsReviewOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-indigo-900 text-white border-none overflow-hidden relative shadow-2xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        <CardHeader>
                            <CardTitle className="text-lg">Need more help?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <p className="text-sm text-indigo-100">
                                Our platform advisors are experts in probate, taxes, and estate law. Book multiple sessions to get a comprehensive roadmap.
                            </p>
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white border-none font-bold" onClick={() => window.location.href = '/help'}>
                                View Help Center
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-none bg-slate-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Policy Reminder</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-700">Cancellation</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Cancellations made less than 24 hours before the session may incur a 50% fee.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-700">Escrow Security</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Your payment is held in escrow and only released to the advisor after a 90-day verification period.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {selectedBooking && (
                <ReviewModal
                    isOpen={isReviewOpen}
                    onClose={() => setIsReviewOpen(false)}
                    bookingId={selectedBooking.id}
                    advisorName={selectedBooking.advisor.user.fullName}
                />
            )}
        </div>
    );
}

function BookingCard({ booking, isUpcoming, onCancel, onReview, isLoading }: any) {
    const statusColors: any = {
        'PENDING': 'bg-amber-100 text-amber-700',
        'CONFIRMED': 'bg-blue-100 text-blue-700',
        'PAID': 'bg-emerald-100 text-emerald-700',
        'COMPLETED': 'bg-slate-100 text-slate-600',
        'CANCELLED': 'bg-red-100 text-red-700'
    };

    return (
        <Card className={cn(
            "border-slate-100 shadow-sm transition-all hover:shadow-md",
            !isUpcoming && "opacity-80 grayscale-[0.5]"
        )}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-[10px] font-black uppercase text-indigo-600">{format(new Date(booking.sessionDate), "MMM")}</span>
                            <span className="text-2xl font-black leading-none">{format(new Date(booking.sessionDate), "dd")}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900">{booking.advisor.user.fullName}</h3>
                                <Badge className={cn("border-none text-[10px] px-2 py-0 h-5", statusColors[booking.status])}>
                                    {booking.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(new Date(booking.sessionDate), "p")}</div>
                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Virtual Session</div>
                                <div className="flex items-center gap-1.5 font-bold text-slate-400 capitalize">{booking.sessionDuration} Hours</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                        {isUpcoming ? (
                            <>
                                <Button variant="ghost" size="sm" className="flex-1 md:flex-none text-slate-400 hover:text-red-500" onClick={onCancel} disabled={isLoading}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 md:flex-none border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold">
                                    Join Session
                                </Button>
                            </>
                        ) : (
                            booking.status === 'COMPLETED' && !booking.review && (
                                <Button size="sm" className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={onReview}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Review Advisor
                                </Button>
                            )
                        )}
                        <Button variant="ghost" size="icon" className="hidden md:flex text-slate-300">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
