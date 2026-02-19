import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, ShieldCheck, Zap, FileCheck, Scale, AlertTriangle, Loader2, ArrowLeft, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";

export default function Pricing(): JSX.Element {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isAdmin } = useAuth(); // Get user and helper
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const fetchClientSecret = useCallback(async (skipTrial = false) => {
        // Guard: must be logged in to start checkout
        if (!user) {
            sessionStorage.setItem("after_login_redirect", "/pricing");
            navigate("/auth");
            return;
        }
        setLoading(true);
        try {
            const { clientSecret: secret } = await api.billing.createCheckout({ skipTrial });
            setClientSecret(secret);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Checkout Failed",
                description: error.message || "Unable to start checkout session"
            });
        } finally {
            setLoading(false);
        }
    }, [toast, user, navigate]);

    // Admin Bypass
    if (isAdmin) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Admin Access Granted</h1>
                    <p className="text-slate-400">You have permanent premium access as a system administrator.</p>
                    <Button onClick={() => navigate('/dashboard')} className="mt-4">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
            <SEO
                title="Pricing & Plans | ExpectedEstate"
                description="Simple, transparent pricing for estate settlement. One plan includes all assets, unlimited document generation, and court forms."
                canonical="https://www.expectedestate.com/pricing"
            />

            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/dashboard")}>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white">ExpectedEstate</span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-20">
                <AnimatePresence mode="wait">
                    {!clientSecret ? (
                        <motion.div
                            key="pricing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            {/* Hero */}
                            <div className="text-center mb-16 space-y-6 max-w-3xl">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-sm font-bold tracking-wide uppercase"
                                >
                                    <Zap className="w-4 h-4" />
                                    Launch Special Pricing
                                </motion.div>
                                <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                                    Execute with <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                        Absolute Confidence
                                    </span>
                                </h1>
                                <p className="text-xl text-slate-400 leading-relaxed">
                                    The Fiduciary Execution OS gives you the same tools used by elite professionals.
                                    Protect the legacy, minimize liability, and settle faster.
                                </p>
                            </div>

                            {/* Pricing Card */}
                            <div className="relative group max-w-2xl w-full">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

                                <Card className="relative bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                                    <div className="grid md:grid-cols-5 h-full">
                                        <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 p-10 flex flex-col justify-center border-r border-slate-800/50">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-widest uppercase">
                                                    <Gem className="w-4 h-4" />
                                                    One Simple Plan
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-6xl font-black text-white tracking-tighter">$49</span>
                                                    <span className="text-slate-500 font-medium tracking-tight">/mo</span>
                                                </div>
                                                <p className="text-slate-400 text-sm leading-relaxed">
                                                    Cancel anytime. No lock-in. <br />
                                                    Deductible as an estate expense.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-3 p-10 flex flex-col">
                                            <div className="flex-1 space-y-4 mb-10 text-slate-300">
                                                <FeatureItem icon={Shield} text="Full Fiduciary OS Access" />
                                                <FeatureItem icon={FileCheck} text="Authority Guardrails & Risk Meter" />
                                                <FeatureItem icon={Scale} text="Claims Priority Engine" />
                                                <FeatureItem icon={AlertTriangle} text="Accounting Safety Gate" />
                                                <FeatureItem icon={Check} text="11 Settlement Workflows" />
                                                <FeatureItem icon={Check} text="Unlimited Estates & Assets" />
                                                <FeatureItem icon={Check} text="Comprehensive Audit Trail" />
                                                <FeatureItem icon={Check} text="Document Automation" />
                                            </div>

                                            <div className="space-y-4">
                                                <Button
                                                    size="lg"
                                                    className="w-full bg-white hover:bg-slate-100 text-slate-950 font-black text-lg py-7 rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95 disabled:opacity-50"
                                                    onClick={() => fetchClientSecret(false)}
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        "Start 7-Day Free Trial"
                                                    )}
                                                </Button>
                                                <button
                                                    onClick={() => fetchClientSecret(true)}
                                                    disabled={loading}
                                                    className="w-full text-slate-500 hover:text-slate-300 transition-colors text-sm font-bold uppercase tracking-widest py-2"
                                                >
                                                    Skip Trial & Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Trust Badge */}
                            <div className="mt-16 text-center text-slate-500 font-medium max-w-md">
                                <p className="mb-4 italic text-slate-400">
                                    "A single mistake can cost $10,000+ in penalties. ExpectedEstate could prevent those mistakes."
                                </p>
                                <div className="flex items-center justify-center gap-8 opacity-40 grayscale pointer-events-none">
                                    <div className="h-6 w-px bg-slate-800" />
                                    <div className="font-black italic text-lg tracking-tighter">STRIPE SECURE</div>
                                    <div className="h-6 w-px bg-slate-800" />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="checkout"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-5xl mx-auto w-full"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    className="text-slate-400 hover:text-white"
                                    onClick={() => setClientSecret(null)}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Change Plan
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-400" />
                                    <span className="font-bold text-white tracking-tight">Secure Checkout</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] overflow-hidden p-2 shadow-2xl">
                                <EmbeddedCheckoutProvider
                                    stripe={stripePromise}
                                    options={{ clientSecret }}
                                >
                                    <EmbeddedCheckout className="min-h-[650px]" />
                                </EmbeddedCheckoutProvider>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function FeatureItem({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors font-medium">{text}</span>
        </div>
    );
}
