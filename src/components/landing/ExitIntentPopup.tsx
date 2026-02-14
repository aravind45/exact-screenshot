import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function ExitIntentPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS">("IDLE");
    const [hasLeft, setHasLeft] = useState(false);

    useEffect(() => {
        // Check if already dismissed or subscribed
        const dismissed = localStorage.getItem("marketing_popup_dismissed");
        if (dismissed) return;

        const handleMouseLeave = (e: MouseEvent) => {
            // Show only if mouse leaves from the top of the viewport
            if (e.clientY <= 0 && !hasLeft) {
                setIsVisible(true);
                setHasLeft(true);
            }
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }, [hasLeft]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("marketing_popup_dismissed", "true");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("LOADING");
        try {
            await api.marketing.submitChecklist({
                email,
                source: "exit_intent_popup",
                utmSource: "website_popup"
            });
            setStatus("SUCCESS");
            toast.success("Checklist sent to your inbox!");

            // Keep success message for 3 seconds then close
            setTimeout(() => {
                handleDismiss();
            }, 3000);

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setStatus("IDLE");
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col md:flex-row">
                            {/* Left Stripe (Visual) */}
                            <div className="hidden md:block w-32 bg-primary flex-shrink-0 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                                <div className="h-full flex items-center justify-center">
                                    <ShieldCheck className="w-12 h-12 text-white opacity-50" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 md:p-10 flex-1">
                                {status === "SUCCESS" ? (
                                    <div className="flex flex-col items-center text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">On its way!</h3>
                                        <p className="text-slate-600">
                                            Check your inbox for the <strong>Ultimate Executor Checklist</strong>.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-6">
                                            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
                                                Wait! Don't leave empty handed
                                            </span>
                                            <h3 className="text-3xl font-black text-slate-900 leading-tight mb-3">
                                                Grab the Free Executor Checklist
                                            </h3>
                                            <p className="text-slate-500 font-medium">
                                                Join 500+ executors who use our 7-day roadmap to avoid common probate mistakes.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <Input
                                                    type="email"
                                                    placeholder="Enter your email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="h-12 text-lg bg-slate-50 border-slate-200 focus:ring-primary"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={status === "LOADING"}
                                                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                                            >
                                                {status === "LOADING" ? "Sending..." : (
                                                    <span className="flex items-center gap-2">
                                                        Send Me The Checklist <ArrowRight className="w-5 h-5" />
                                                    </span>
                                                )}
                                            </Button>
                                            <p className="text-xs text-center text-slate-400 mt-4">
                                                100% Free. Unsubscribe anytime. No spam.
                                            </p>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
