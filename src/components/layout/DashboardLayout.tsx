
import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { MailCheck, X } from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

export function DashboardLayout({
    children,
    className,
    maxWidth = "max-w-[1440px]"
}: DashboardLayoutProps) {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [resending, setResending] = useState(false);

    const showBanner = !dismissed && user && !user.emailVerifiedAt && user.role !== 'ADMIN';

    const handleResend = async () => {
        setResending(true);
        try {
            await api.resendVerificationEmail();
            toast.success("Verification email sent! Check your inbox.");
        } catch {
            toast.error("Couldn't send email. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-[220px] flex flex-col transition-all duration-300">
                {showBanner && (
                    <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-sm text-amber-800">
                        <div className="flex items-center gap-2">
                            <MailCheck className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>Please verify your email address to secure your account.</span>
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="ml-1 font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
                            >
                                {resending ? "Sending..." : "Resend email"}
                            </button>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 rounded hover:bg-amber-100 text-amber-600 hover:text-amber-900 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <main
                    className={cn(
                        "w-full px-5 py-5 sm:px-7 sm:py-6 space-y-5",
                        maxWidth,
                        className
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
