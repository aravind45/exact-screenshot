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

    const { data: estate, isLoading, isError } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        retry: false,
        enabled: !!user && user.role !== 'ADMIN' && user.role !== 'ADVISOR',
    });

    useEffect(() => {
        // Skip profile check for non-executor users
        if (!user || user.role === 'ADMIN' || user.role === 'ADVISOR') return;

        // Skip if still loading or error occurred
        if (isLoading || isError) return;

        // Skip if no estate data yet (brand new user)
        if (!estate) return;

        // Skip if already on onboarding or advisor routes
        const isAtOnboarding = location.pathname === "/onboarding";
        const isAdvisorRoute = location.pathname.startsWith("/advisor") || location.pathname === "/marketplace";
        if (isAtOnboarding || isAdvisorRoute) return;

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
    }, [user, estate, isLoading, isError, navigate, location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/30">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return <>{children}</>;
}
