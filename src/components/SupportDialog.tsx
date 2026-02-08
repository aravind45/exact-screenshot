import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mail, Star, Loader2, Send, Info } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "feedback" | "contact";
}

export function SupportDialog({ open, onOpenChange, defaultTab = "feedback" }: SupportDialogProps) {
    const { toast } = useToast();
    const [tab, setTab] = useState<string>(defaultTab);
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [contactSubject, setContactSubject] = useState("");
    const [contactMessage, setContactMessage] = useState("");

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        enabled: open
    });

    const feedbackMutation = useMutation({
        mutationFn: (data: { rating: number; comment: string }) =>
            fetch("/api/help/feedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(data)
            }).then(res => res.json()),
        onSuccess: () => {
            toast({
                title: "Feedback Sent",
                description: "Thank you for helping us improve ExpectedEstate!",
            });
            onOpenChange(false);
            resetForm();
        }
    });

    const contactMutation = useMutation({
        mutationFn: (data: { estateId?: string; subject: string; message: string }) =>
            fetch("/api/help/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(data)
            }).then(res => res.json()),
        onSuccess: () => {
            toast({
                title: "Message Sent",
                description: "Our support team will get back to you shortly at expectedestate@gmail.com.",
            });
            onOpenChange(false);
            resetForm();
        }
    });

    const resetForm = () => {
        setRating(0);
        setFeedbackComment("");
        setContactSubject("");
        setContactMessage("");
    };

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        feedbackMutation.mutate({ rating, comment: feedbackComment });
    };

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        contactMutation.mutate({
            estateId: estate?.id,
            subject: contactSubject,
            message: contactMessage
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[32px] border-none shadow-2xl overflow-hidden p-0">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black tracking-tight">How can we help?</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            We're here to support you during this difficult process.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-2xl">
                            <TabsTrigger value="feedback" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-2.5">
                                <MessageSquare className="w-3.5 h-3.5 mr-2" /> Feedback
                            </TabsTrigger>
                            <TabsTrigger value="contact" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-2.5">
                                <Mail className="w-3.5 h-3.5 mr-2" /> Support
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="feedback" className="mt-0 outline-none">
                            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                                <div className="space-y-3 text-center">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rate your experience</Label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="transition-transform active:scale-95"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star
                                                    className={cn(
                                                        "w-8 h-8 transition-colors",
                                                        (hoverRating || rating) >= star
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-slate-200"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your specific feedback</Label>
                                    <Textarea
                                        placeholder="What can we do better? Be as honest as you'd like."
                                        className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-colors p-4 text-sm resize-none"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                                    disabled={feedbackMutation.isPending || rating === 0}
                                >
                                    {feedbackMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Submit Feedback <Send className="w-3.5 h-3.5 ml-2" /></>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="contact" className="mt-0 outline-none">
                            <form onSubmit={handleContactSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subject</Label>
                                        <Input
                                            placeholder="e.g. Question about filing DE-111"
                                            className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-colors px-4 text-sm"
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Message</Label>
                                        <Textarea
                                            placeholder="Tell us what you need help with..."
                                            className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-colors p-4 text-sm resize-none"
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <div className="flex gap-3">
                                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                            Our team typically responds within 4-6 hours. For immediate legal definitions, be sure to check the **Help Center**.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                                    disabled={contactMutation.isPending}
                                >
                                    {contactMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Send Message <Send className="w-3.5 h-3.5 ml-2" /></>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <Mail className="w-3 h-3" /> expectedestate@gmail.com
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
