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
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in
                sessionStorage.setItem("after_login_redirect", window.location.pathname + window.location.search);
                navigate('/auth');
            } else {
                const userEmail = user.email?.toLowerCase();
                const isAdminEmail = userEmail === 'aravind45@gmail.com';
                const hasRequiredRole = allowedRoles.includes(user.role || '') || (allowedRoles.includes('ADMIN') && isAdminEmail);

                if (!hasRequiredRole) {
                    // Logged in but wrong role - determine appropriate fallback based on user type
                    console.warn(`[RoleRoute] Access denied for role: ${user.role}. Allowed: ${allowedRoles.join(', ')}. Redirecting to appropriate dashboard.`);

                    // Determine appropriate fallback based on user type
                    let redirectPath = fallbackPath;

                    if (user.role === 'ADVISOR' || user.userType === 'ADVISOR') {
                        redirectPath = '/advisor/dashboard';
                    } else if (user.role === 'ADMIN' || isAdminEmail) {
                        redirectPath = '/admin';
                    } else {
                        redirectPath = fallbackPath || '/dashboard';
                    }

                    navigate(redirectPath, { replace: true });
                }
            }
        }
    }, [user, loading, navigate, allowedRoles, fallbackPath]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Only render children if the role is allowed
    if (!user || (user.role && !allowedRoles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
