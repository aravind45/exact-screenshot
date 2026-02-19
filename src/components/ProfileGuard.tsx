import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isProfileComplete } from "@/lib/authorityEngine";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileGuardProps {
    children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // CRITICAL FIX: Skip all checks for advisors and admins
    const shouldSkipCheck =
        !user ||
        user.role === 'ADMIN' ||
        user.role === 'ADVISOR' ||
        user.userType === 'ADVISOR';

    const { data: estate, isLoading, isError } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        retry: false,
        enabled: !!user && !shouldSkipCheck, // Only fetch for executors
    });

    useEffect(() => {
        // Skip profile check for non-executor users
        if (shouldSkipCheck) return;

        // Skip if still loading
        if (isLoading) return;

        // Skip if already on onboarding routes
        const isAtOnboarding = location.pathname === "/onboarding";
        const isAtAdvisorOnboarding = location.pathname === "/advisor/onboarding";
        const isAdvisorRoute = location.pathname.startsWith("/advisor") || location.pathname === "/marketplace";

        if (isAtOnboarding || isAtAdvisorOnboarding || isAdvisorRoute) return;

        // HEIRS (VIEWERS) should never be sent to the onboarding wizard
        const isHeir = user?.role === 'HEIR' || (user as any)?.userType === 'HEIR';
        const isViewer = (estate as any)?.userRole === 'VIEWER';
        if (isHeir || isViewer) return;

        // If there's an error fetching estate (404 = no estate yet), redirect to onboarding
        if (isError) {
            console.log("No estate found, redirecting to onboarding");
            navigate("/onboarding", { replace: true });
            return;
        }

        // Skip if no estate data yet (still loading or brand new user)
        if (!estate) return;

        // Check if executor profile is complete
        const complete = isProfileComplete(estate);
        if (!complete) {
            console.log("Executor profile incomplete, redirecting to onboarding. Missing:", {
                deceasedFirstName: !!estate.deceasedFirstName,
                deceasedLastName: !!estate.deceasedLastName,
                deceasedState: !!estate.deceasedState,
                authorityType: estate.authorityType,
            });
            navigate("/onboarding", { replace: true });
        }
    }, [user, estate, isLoading, isError, navigate, location.pathname, shouldSkipCheck]);

    // Show loading only for executors
    if (!shouldSkipCheck && isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/30">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return <>{children}</>;
}
