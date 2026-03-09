import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Star,
    MessageSquare,
    Calendar,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewListProps {
    advisorId: string;
}

export default function ReviewList({ advisorId }: ReviewListProps) {
    const { data: reviewsPayload, isLoading } = useQuery({
        queryKey: ['advisor-reviews', advisorId],
        queryFn: () => api.reviews.getAdvisorReviews(advisorId)
    });

    const reviews = Array.isArray(reviewsPayload)
        ? reviewsPayload
        : Array.isArray((reviewsPayload as any)?.reviews)
            ? (reviewsPayload as any).reviews
            : Array.isArray((reviewsPayload as any)?.data)
                ? (reviewsPayload as any).data
                : [];

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No reviews yet for this advisor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                Client Reviews
                <span className="text-sm font-normal text-slate-400">({reviews.length})</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {reviews.map((review: any) => (
                    <Card key={review.id} className="border-slate-100 shadow-sm overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="font-bold text-slate-900">{review?.user?.fullName || 'Client'}</div>
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        {review?.createdAt ? format(new Date(review.createdAt), 'MMMM yyyy') : '-'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                'w-4 h-4',
                                                i < Number(review?.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            {review?.comment && (
                                <p className="text-slate-600 text-sm leading-relaxed italic">
                                    "{review.comment}"
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
