import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTracking } from "@/hooks/useTracking";
import { toast } from "sonner";
import { CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const ChecklistLanding = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { trackEvent, getTrackingData } = useTracking();

    useEffect(() => {
        trackEvent("checklist_viewed");
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        try {
            const trackingData = getTrackingData();
            const response = await fetch("/api/marketing/checklist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, ...trackingData })
            });

            if (response.ok) {
                setIsSuccess(true);
                toast.success("Checklist sent to your email!");
            } else {
                toast.error("Fixed some issues, please try again.");
            }
        } catch (error) {
            toast.error("Failed to send checklist. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <SEO
                title="Executor 7-Day Checklist"
                description="Email capture page for the ExpectedEstate executor checklist lead magnet."
                canonical="https://www.expectedestate.com/checklist"
                noindex
            />
            <div className="w-full max-w-md space-y-8 text-center mb-8">
                <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                    Executor 7-Day Checklist
                </h1>
                <p className="text-lg text-slate-600">
                    Everything you need to do in your first week as an executor. Free, simple, and step-by-step.
                </p>
            </div>

            <Card className="w-full max-w-md shadow-xl border-slate-200">
                {!isSuccess ? (
                    <>
                        <CardHeader>
                            <CardTitle>Get the Checklist</CardTitle>
                            <CardDescription>
                                Enter your email below and we'll send the checklist directly to your inbox.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 text-lg"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Sending..." : "Get the checklist"}
                                    {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                                </Button>
                                <p className="text-xs text-center text-slate-500">
                                    No spam. Just help.
                                </p>
                            </form>
                        </CardContent>
                    </>
                ) : (
                    <CardContent className="pt-10 pb-10 text-center space-y-6">
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">It's on its way!</h2>
                            <p className="text-slate-600">
                                Check your email for the checklist. Ready to get started right away?
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate("/auth")}
                            variant="outline"
                            className="w-full h-12 text-lg font-semibold border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            Start Estate Intake
                        </Button>
                    </CardContent>
                )}
            </Card>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-left">
                <div className="space-y-2">
                    <h3 className="font-bold text-slate-800">1. Immediate Steps</h3>
                    <p className="text-sm text-slate-600">Secure the home, find the Will, and notify family.</p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-slate-800">2. Asset Tracking</h3>
                    <p className="text-sm text-slate-600">How to identify banks, accounts, and valuable property.</p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-slate-800">3. Legal Filings</h3>
                    <p className="text-sm text-slate-600">Step-by-step through the California probate petition.</p>
                </div>
            </div>
        </div>
    );
};

export default ChecklistLanding;

