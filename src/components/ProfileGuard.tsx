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
        // Don't retry on 401/403 as AuthContext handles that
        retry: false,
        enabled: !!user,
    });

    useEffect(() => {
        if (isLoading || isError) return;
        // No estate yet — user hasn't started onboarding at all
        if (!estate) return;

        const complete = isProfileComplete(estate);
        const isAtOnboarding = location.pathname === "/onboarding";
        const isAdvisorRoute = location.pathname.startsWith("/advisor") || location.pathname === "/marketplace";

        if (!complete && !isAtOnboarding && !isAdvisorRoute) {
            console.log("Profile incomplete, redirecting to onboarding. Missing fields:", {
                deceasedFirstName: !!estate.deceasedFirstName,
                deceasedLastName: !!estate.deceasedLastName,
                deceasedState: !!estate.deceasedState,
                authorityType: estate.authorityType,
            });
            navigate("/onboarding", { replace: true });
        }
    }, [estate, isLoading, isError, navigate, location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/30">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return <>{children}</>;
}
