import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";
import { LeadMagnetForm } from "./LeadMagnetForm";

export function ExitIntentPopup() {
    const [isVisible, setIsVisible] = useState(false);
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

    const handleSuccess = () => {
        // Keep popup open for a moment to show success message, then close
        setTimeout(() => {
            handleDismiss();
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
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
                                <div className="mb-6">
                                    <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
                                        Wait! Don't leave empty handed
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                                        First 30 Days Action Plan
                                    </h3>
                                    <p className="text-slate-500 font-medium text-sm">
                                        Download our free guide on the exact first steps needed to protect the estate and avoid liability.
                                    </p>
                                </div>

                                <LeadMagnetForm
                                    source="exit_intent"
                                    onSuccess={handleSuccess}
                                    buttonText="Send Me The Plan"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
