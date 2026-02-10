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

    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        // Don't retry on 401/403 as AuthContext handles that
        retry: false,
        enabled: !!user,
    });

    useEffect(() => {
        if (!isLoading && estate) {
            const complete = isProfileComplete(estate);
            const isAtOnboarding = location.pathname === "/onboarding";

            if (!complete && !isAtOnboarding) {
                console.log("Profile incomplete, redirecting to onboarding...");
                navigate("/onboarding", { replace: true });
            } else if (complete && isAtOnboarding) {
                // Optional: redirect to dashboard if they try to go to onboarding after completion
                // navigate("/dashboard", { replace: true });
            }
        }
    }, [estate, isLoading, navigate, location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/30">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return <>{children}</>;
}
