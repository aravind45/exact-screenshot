import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Zap, FileCheck, Scale, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const { url } = await api.billing.createCheckout();
            if (url) {
                window.location.href = url;
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Checkout Failed",
                description: error.message || "Unable to start checkout session"
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-slate-900" />
                        <span className="font-bold text-lg">ExpectedEstate</span>
                    </div>
                    <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-4xl mx-auto px-6 py-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold mb-6">
                    <Zap className="w-4 h-4" />
                    Soft Launch Special
                </div>
                <h1 className="text-5xl font-bold text-slate-900 mb-4">
                    The Fiduciary Execution OS
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Everything you need to execute your fiduciary duties with confidence. No tiers. No limits. Just results.
                </p>
            </section>

            {/* Pricing Card */}
            <section className="max-w-2xl mx-auto px-6 pb-16">
                <Card className="border-2 border-slate-900 shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-bold">$49</span>
                            <span className="text-xl text-slate-300">/month</span>
                        </div>
                        <p className="text-slate-200 text-lg">Total Executor Plan</p>
                    </div>

                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <FeatureItem icon={Shield} text="Full Fiduciary OS Access" />
                            <FeatureItem icon={FileCheck} text="Authority Guardrails & Risk Meter" />
                            <FeatureItem icon={Scale} text="Claims Priority Engine" />
                            <FeatureItem icon={AlertTriangle} text="Accounting Complete Safety Gate" />
                            <FeatureItem icon={Check} text="All 11 Settlement Type Workflows" />
                            <FeatureItem icon={Check} text="Unlimited Estates & Assets" />
                            <FeatureItem icon={Check} text="Comprehensive Audit Trail" />
                            <FeatureItem icon={Check} text="Email & Document Automation" />
                            <FeatureItem icon={Check} text="Priority Support" />
                        </div>

                        <div className="pt-6 border-t font-sans">
                            <Button
                                size="lg"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-lg py-6"
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Starting Checkout...
                                    </>
                                ) : (
                                    "Start 14-Day Free Trial"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full mt-4 h-12 text-slate-600 border-slate-200 hover:bg-slate-50 font-medium"
                                onClick={() => handleCheckout()}
                                disabled={loading}
                            >
                                Skip Trial & Buy Now
                            </Button>
                            <p className="text-center text-sm text-slate-500 mt-4">
                                No credit card required for trial. Cancel anytime.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="p-8 pt-0 flex flex-col items-center">
                        <p className="text-xs text-slate-400 text-center mb-4">
                            Questions about billing or refunds? Contact <a href="mailto:expected.estate@gmail.com" className="hover:text-slate-600 underline">expected.estate@gmail.com</a>
                        </p>
                    </CardFooter>
                </Card>

                {/* Value Prop */}
                <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="font-bold text-lg text-amber-900 mb-2">Why $49/month is a steal</h3>
                    <p className="text-amber-800 text-sm leading-relaxed">
                        A single mistake in estate administration can cost <strong>$10,000+</strong> in legal fees, penalties, or personal liability.
                        Our Fiduciary OS prevents those mistakes with automated guardrails, audit trails, and compliance checks—giving you the confidence
                        to execute your duties perfectly.
                    </p>
                </div>
            </section>
        </div>
    );
}

function FeatureItem({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Icon className="w-3 h-3 text-green-700" />
            </div>
            <span className="text-slate-700 font-medium">{text}</span>
        </div>
    );
}
