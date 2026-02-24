import { useMemo } from 'react';

/**
 * A hook to centralize terminology differences between B2C (Executor) 
 * and B2B (Texas Attorney Pilot) modes.
 */
export const useTerminology = () => {
    const isB2BTexas = import.meta.env.NEXT_PUBLIC_PRODUCT_MODE === 'b2b_texas';

    const terms = useMemo(() => {
        if (isB2BTexas) {
            return {
                roleName: 'Attorney',
                estateName: 'Case',
                estates: 'Cases',
                estateOwner: 'Lead Attorney',
                executorDashboard: 'Firm Dashboard',
                firmDashboard: "Firm Dashboard",
                clientStatusReport: "Client Status Report",
                authorityType: "Administration",
                dashboardTitle: "Firm Dashboard",
                // Logic flags
                griefReferences: false,
            };
        }

        return {
            roleName: 'Executor',
            estateName: 'Estate',
            estates: 'Estates',
            estateOwner: 'Estate Owner',
            executorDashboard: 'Executor Dashboard',
            firmDashboard: "Executor Dashboard",
            clientStatusReport: "Client Status Report",
            authorityType: "Authority",
            dashboardTitle: "Executor Dashboard",
            // Logic flags
            griefReferences: true,
        };
    }, [isB2BTexas]);

    const t = (term: keyof typeof terms) => terms[term];

    return {
        isB2BTexas,
        t,
        ...terms
    };
};
