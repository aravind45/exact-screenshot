import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    advisorName: string;
}

export default function ReviewModal({ isOpen, onClose, bookingId, advisorName }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: { bookingId: string, rating: number, comment?: string }) =>
            api.reviews.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-reviews'] });
            toast.success("Thank you for your feedback!");
            onClose();
            // Reset state
            setRating(0);
            setComment('');
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to submit review");
        }
    });

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error("Please select a star rating");
            return;
        }
        mutation.mutate({ bookingId, rating, comment });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-indigo-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Share your experience</DialogTitle>
                        <DialogDescription className="text-indigo-100/80">
                            How was your consultation with {advisorName}?
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-4 text-center">
                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your Rating</Label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform active:scale-90"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={cn(
                                            "w-10 h-10 transition-all duration-200",
                                            (hoverRating || rating) >= star
                                                ? "text-amber-400 fill-amber-400 scale-110 drop-shadow-md"
                                                : "text-slate-200"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-slate-400 min-h-[20px]">
                            {rating === 5 && "Exceptional service!"}
                            {rating === 4 && "Great experience!"}
                            {rating === 3 && "Satisfactory session."}
                            {rating === 2 && "Could have been better."}
                            {rating === 1 && "Not as expected."}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="comment" className="font-bold text-slate-700">Add a comment (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Share some details about how the advisor helped you..."
                            className="min-h-[120px] bg-slate-50 border-slate-100 focus:bg-white transition-all text-slate-600"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
                    <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-xl"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
