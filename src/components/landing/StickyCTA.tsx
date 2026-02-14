import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export function StickyCTA() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past the hero (roughly 600px)
            if (window.scrollY > 600) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center"
                >
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-2xl p-3 pl-5 flex items-center gap-4 max-w-xl w-full pointer-events-auto mx-4 mb-4">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Start For Free</p>
                            <p className="font-bold text-slate-900 leading-tight">Get your personalized settlement roadmap</p>
                        </div>
                        <Button
                            size="lg"
                            className="rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            onClick={() => navigate("/start")}
                        >
                            Get Roadmap
                        </Button>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
