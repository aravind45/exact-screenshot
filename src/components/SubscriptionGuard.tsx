import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Alpha users and team extensions are exempt
    const isAlphaUser = user?.fullName?.includes("(Alpha)") || user?.email?.endsWith("@expectedestate.com");
    const isAdmin = user?.role === 'ADMIN';
    const isActive = (user as any)?.subscriptionStatus === 'ACTIVE' || (user as any)?.isTrialing === true;

    const canAccess = isAdmin || isAlphaUser || isActive;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Subscription Required</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        This section is reserved for Active subscribers. Get full access to automated filings, statutory track selection, and the fiduciary audit trail.
                    </p>
                    <div className="space-y-3">
                        <Button
                            className="w-full h-12 font-bold tracking-tight shadow-lg shadow-primary/20"
                            onClick={() => navigate('/pricing')}
                        >
                            View Pricing & Plans
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-slate-400 font-bold"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
