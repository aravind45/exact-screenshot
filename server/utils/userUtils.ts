
export type UserRole = 'ADMIN' | 'ADVISOR' | 'ATTORNEY' | 'EXECUTOR' | 'HEIR';

export interface UserIdentifiable {
    email?: string | null;
    role?: string | null; // Use string here to handle Prisma enum results
}

/**
 * Standardizes email comparison and role checks.
 */
export const RoleUtils = {
    isAdmin(user: UserIdentifiable | null): boolean {
        if (!user) return false;
        return user.role === 'ADMIN' || user.email?.toLowerCase() === 'aravind45@gmail.com';
    },

    isAdvisor(user: UserIdentifiable | null): boolean {
        if (!user) return false;
        return user.role === 'ADVISOR' || this.isAdmin(user);
    },

    isAttorney(user: UserIdentifiable | null): boolean {
        if (!user) return false;
        return user.role === 'ATTORNEY' || this.isAdmin(user);
    },

    isExecutor(user: UserIdentifiable | null): boolean {
        if (!user) return false;
        return user.role === 'EXECUTOR' || this.isAdmin(user);
    },

    isHeir(user: UserIdentifiable | null): boolean {
        if (!user) return false;
        return user.role === 'HEIR' || this.isAdmin(user);
    }
};
