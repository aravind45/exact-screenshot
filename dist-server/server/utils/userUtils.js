/**
 * Standardizes email comparison and role checks.
 */
export const RoleUtils = {
    isAdmin(user) {
        if (!user)
            return false;
        return user.role === 'ADMIN' || user.email?.toLowerCase() === 'aravind45@gmail.com';
    },
    isAdvisor(user) {
        if (!user)
            return false;
        return user.role === 'ADVISOR' || this.isAdmin(user);
    },
    isAttorney(user) {
        if (!user)
            return false;
        return user.role === 'ATTORNEY' || this.isAdmin(user);
    },
    isExecutor(user) {
        if (!user)
            return false;
        return user.role === 'EXECUTOR' || this.isAdmin(user);
    },
    isHeir(user) {
        if (!user)
            return false;
        return user.role === 'HEIR' || this.isAdmin(user);
    }
};
