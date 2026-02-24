export const TENANTS = {
    default: {
        id: 'default',
        domain: 'expectedestate.com',
        name: 'Expected Estate',
        primaryColor: '#6366f1', // Indigo
        secondaryColor: '#ec4899', // Pink
        targetRole: 'EXECUTOR',
        onboardingTitle: 'Estate Settlement Simplified'
    },
    texas_lawyer: {
        id: 'texas_lawyer',
        domain: 'texas.expectedestate.com',
        name: 'Expected Estate - Texas Lawyer Edition',
        primaryColor: '#0c4a6e', // Sky 900
        secondaryColor: '#f59e0b', // Amber 500
        defaultState: 'TX',
        targetRole: 'ADVISOR',
        landingPage: '/landing/texas-lawyer',
        onboardingTitle: 'Streamlined Texas Probate for Attorneys',
        description: 'Specialized estate settlement engine for Texas legal professionals.'
    }
};
export const getTenantByHostname = (hostname) => {
    const tenant = Object.values(TENANTS).find(t => t.domain === hostname);
    return tenant || TENANTS.default;
};
