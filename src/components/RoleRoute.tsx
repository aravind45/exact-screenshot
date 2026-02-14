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
            } else if (user.role && !allowedRoles.includes(user.role)) {
                // Logged in but wrong role
                console.warn(`[RoleRoute] Access denied for role: ${user.role}. Allowed: ${allowedRoles.join(', ')}`);

                // If an advisor hits an executor path, send them to advisor dashboard
                if (user.role === 'ADVISOR' && !allowedRoles.includes('ADVISOR')) {
                    navigate('/advisor/dashboard');
                } else {
                    navigate(fallbackPath);
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
