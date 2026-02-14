import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
    fallbackPath?: string;
}

/**
 * A stricter version of ProtectedRoute that validates the user's role.
 * If the user's role is not in the allowedRoles list, they are redirected to fallbackPath.
 */
export function RoleRoute({ children, allowedRoles, fallbackPath = '/dashboard' }: RoleRouteProps) {
    const { user, loading, isAdmin, isAdvisor, isAttorney, isExecutor, isHeir } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in
                sessionStorage.setItem("after_login_redirect", window.location.pathname + window.location.search);
                navigate('/auth');
            } else {
                // Check permissions based on allowedRoles
                let hasAccess = false;

                if (allowedRoles.includes('ADMIN') && isAdmin) hasAccess = true;
                if (allowedRoles.includes('ADVISOR') && isAdvisor) hasAccess = true;
                if (allowedRoles.includes('ATTORNEY') && isAttorney) hasAccess = true;
                if (allowedRoles.includes('EXECUTOR') && isExecutor) hasAccess = true;
                if (allowedRoles.includes('HEIR') && isHeir) hasAccess = true;
                if (allowedRoles.includes('USER') && user) hasAccess = true; // Any logged in user

                if (!hasAccess) {
                    // Logged in but wrong role - determine appropriate fallback
                    console.warn(`[RoleRoute] Access denied for user: ${user.email}. Role: ${user.role}. Allowed: ${allowedRoles.join(', ')}`);

                    let redirectPath = fallbackPath || '/dashboard';

                    if (isAdvisor && !isAdmin) {
                        redirectPath = '/advisor/dashboard';
                    } else if (isAdmin) {
                        redirectPath = '/admin';
                    }

                    navigate(redirectPath, { replace: true });
                }
            }
        }
    }, [user, loading, navigate, allowedRoles, fallbackPath, isAdmin, isAdvisor, isAttorney, isExecutor, isHeir]);

    // Use the same access logic for rendering as for redirecting
    const hasAccess = (() => {
        if (!user) return false;
        if (allowedRoles.includes('ADMIN') && isAdmin) return true;
        if (allowedRoles.includes('ADVISOR') && isAdvisor) return true;
        if (allowedRoles.includes('ATTORNEY') && isAttorney) return true;
        if (allowedRoles.includes('EXECUTOR') && isExecutor) return true;
        if (allowedRoles.includes('HEIR') && isHeir) return true;
        if (allowedRoles.includes('USER') && user) return true;
        return allowedRoles.includes(user.role);
    })();

    if (loading || (!hasAccess && user)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">{!user ? 'Verifying session...' : 'Verifying access...'}</p>
                </div>
            </div>
        );
    }

    if (!user || !hasAccess) {
        return null;
    }

    return <>{children}</>;
}
