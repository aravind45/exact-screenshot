import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight, CheckCircle } from "lucide-react";

interface LeadMagnetFormProps {
    source?: string;
    onSuccess?: () => void;
    buttonText?: string;
    className?: string;
}

export function LeadMagnetForm({
    source = "website",
    onSuccess,
    buttonText = "Send Me The Checklist",
    className = ""
}: LeadMagnetFormProps) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS">("IDLE");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("LOADING");
        try {
            await api.marketing.submitChecklist({
                email,
                source: source,
                utmSource: "website_lead_magnet"
            });
            setStatus("SUCCESS");
            toast.success("Checklist sent to your inbox!");

            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setStatus("IDLE");
        }
    };

    if (status === "SUCCESS") {
        return (
            <div className="flex flex-col items-center text-center py-6 bg-green-50 rounded-2xl border border-green-100 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">It's on the way!</h3>
                <p className="text-sm text-slate-600">
                    Check your inbox for the <strong>First 30 Days Action Plan</strong>.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
            <div>
                <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-lg bg-white border-slate-200 focus:ring-primary"
                />
            </div>
            <Button
                type="submit"
                disabled={status === "LOADING"}
                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
                {status === "LOADING" ? "Sending..." : (
                    <span className="flex items-center gap-2">
                        {buttonText} <ArrowRight className="w-5 h-5" />
                    </span>
                )}
            </Button>
            <p className="text-xs text-center text-slate-400">
                100% Free. Unsubscribe anytime available.
            </p>
        </form>
    );
}
