import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, PartyPopper, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        // ── GA4 purchase conversion event ────────────────────────────────────
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'purchase', {
                transaction_id: sessionId || `txn_${Date.now()}`,
                currency: 'USD',
                value: 49,
                items: [
                    {
                        item_id: 'premium_monthly',
                        item_name: 'ExpectedEstate Premium',
                        price: 49,
                        quantity: 1,
                    },
                ],
            });
        }

        // Celebrate!
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
            <Card className="max-w-xl w-full border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-md">
                <div className="h-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

                <CardHeader className="text-center pt-12 pb-8">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <CardTitle className="text-4xl font-black text-slate-900 mb-2">
                        You're All Set!
                    </CardTitle>
                    <p className="text-slate-500 text-lg">
                        Welcome to ExpectedEstate's Fiduciary Execution OS.
                    </p>
                </CardHeader>

                <CardContent className="px-12 pb-12 space-y-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-slate-700" />
                            What happens now?
                        </h3>
                        <ul className="space-y-4">
                            <StepItem
                                icon={PartyPopper}
                                title="Full Access Unlocked"
                                description="Your pro features are now live across all your estates."
                            />
                            <StepItem
                                icon={ArrowRight}
                                title="Start Your Roadmap"
                                description="Head back to the dashboard to begin your guided settlement process."
                            />
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                            onClick={() => navigate("/dashboard")}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <p className="text-center text-xs text-slate-400">
                            Session ID: {sessionId?.substring(0, 12)}...
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StepItem({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <li className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
                <p className="font-bold text-slate-900 text-sm leading-none mb-1">{title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
            </div>
        </li>
    );
}
