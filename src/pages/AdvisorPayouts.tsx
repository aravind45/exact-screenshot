import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    ShieldCheck,
    CreditCard,
    ArrowRight,
    Loader2,
    Banknote,
    Clock,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdvisorPayouts() {
    const queryClient = useQueryClient();
    const [stripeLoading, setStripeLoading] = useState(false);

    // Fetch advisor profile and stripe status
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['advisor-profile'],
        queryFn: () => api.advisors.getMe(),
        retry: false
    });

    const { data: stripeStatus, isLoading: isStripeLoading } = useQuery({
        queryKey: ['stripe-status'],
        queryFn: () => api.advisors.getStripeStatus(),
        retry: 2
    });

    const handleStartStripe = async () => {
        setStripeLoading(true);
        try {
            const returnUrl = `${window.location.origin}/advisor/payouts?success=true`;
            const refreshUrl = `${window.location.origin}/advisor/payouts?refresh=true`;

            const { url } = await api.advisors.startStripeOnboarding({
                returnUrl,
                refreshUrl
            });

            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No onboarding URL returned");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start Stripe onboarding");
            setStripeLoading(false);
        }
    };

    if (isProfileLoading || isStripeLoading) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading payout settings...</p>
            </div>
        );
    }

    const isStripeComplete = stripeStatus?.stripeOnboardingComplete;
    const isStripeDetailsSubmitted = stripeStatus?.stripeDetailsSubmitted;

    return (
        <div className="container mx-auto py-12 max-w-4xl">
            <div className="space-y-2 mb-12">
                <h1 className="text-4xl font-black tracking-tight">Payout Settings</h1>
                <p className="text-slate-500 text-lg">
                    Manage how you receive payments from your consultations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card className={cn(
                        "relative transition-all duration-300 border-slate-200 overflow-hidden",
                        isStripeComplete && "bg-emerald-50/10 border-emerald-200"
                    )}>
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                            isStripeComplete ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                                        )}>
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl">Stripe Connect</CardTitle>
                                            <CardDescription className="text-sm font-medium">
                                                {isStripeComplete ? "Linked & Ready" : "Payout Account Setup"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                                {isStripeComplete && (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Connected
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-start gap-4">
                                    <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900">Secure Payments</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            We use Stripe Connect for all financial operations. Your bank data is encrypted and handled entirely by Stripe. ExpectedEstate never sees or stores your sensitive financial information.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Status & Actions</h4>
                                {isStripeComplete ? (
                                    <Alert className="bg-emerald-50 border-emerald-100 text-emerald-800 rounded-2xl p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <AlertTitle className="text-lg font-black">All Set!</AlertTitle>
                                                <AlertDescription className="text-sm opacity-80">
                                                    Your account is fully verified and connected. Payments will be automatically deposited after the escrow period.
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                ) : (
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        To receive payouts, you need to link your bank account or debit card via Stripe. This process takes about 2-5 minutes.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-6">
                            <Button
                                onClick={handleStartStripe}
                                className={cn(
                                    "w-full font-black h-12 rounded-xl group transition-all",
                                    isStripeComplete
                                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                                )}
                                disabled={stripeLoading}
                            >
                                {stripeLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    isStripeComplete ? <ExternalLink className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />
                                )}
                                {isStripeComplete ? "View/Update Stripe Dashboard" : (isStripeDetailsSubmitted ? "Resume Setup / Check Status" : "Connect with Stripe")}
                                {!isStripeComplete && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Pending Earnings Notice */}
                    <Card className="bg-amber-50 border-amber-200 rounded-2xl border-dashed">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div className="space-y-1">
                                    <h3 className="font-bold text-amber-900">Important: Verification</h3>
                                    <p className="text-sm text-amber-700 leading-relaxed">
                                        Even if connected, your account must be fully verified by Stripe before payouts can be issued. Please ensure you provide all requested legal documentation on the Stripe dashboard.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-slate-200 bg-slate-50/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 font-medium">Platform Fee</p>
                                <p className="text-2xl font-black text-slate-900">20%</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 font-medium">Escrow Period</p>
                                <p className="text-2xl font-black text-slate-900">90 Days</p>
                            </div>
                            <div className="pt-4 border-t border-slate-200">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                        Escrow protection ensures quality service for executors and secure payments for advisors.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-900 text-white border-none shadow-xl shadow-indigo-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        <CardHeader>
                            <CardTitle className="text-lg">Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm relative z-10">
                            <p className="text-indigo-100">
                                Having trouble with your Stripe account? Our support team can help with verification and payout issues.
                            </p>
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold border-none" onClick={() => (window as any).EE_OPEN_SUPPORT?.()}>
                                Contact Support
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Shorthand for Badge and Alert components if not available globally
const Badge = ({ children, className }: any) => (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
        {children}
    </div>
);

const Alert = ({ children, className }: any) => (
    <div className={cn("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", className)}>
        {children}
    </div>
);

const AlertTitle = ({ children, className }: any) => (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)}>
        {children}
    </h5>
);

const AlertDescription = ({ children, className }: any) => (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)}>
        {children}
    </div>
);

import { ExternalLink } from 'lucide-react';
