import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantConfig } from '@/config/tenantConfig';

interface TenantContextType {
    tenant: TenantConfig | null;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<TenantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTenantConfig = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const tenantParam = urlParams.get('tenant');
                const apiUrl = `/api/tenant-config${tenantParam ? `?tenant=${tenantParam}` : ''}`;

                const response = await fetch(apiUrl);
                if (response.ok) {
                    const config = await response.json();
                    setTenant(config);
                    applyTheme(config);
                }
            } catch (error) {
                console.error('Failed to fetch tenant config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTenantConfig();
    }, []);

    const applyTheme = (config: TenantConfig) => {
        if (config.primaryColor) {
            document.documentElement.style.setProperty('--primary', config.primaryColor);
            // Simple HSL conversion or variation could be done here if needed
            // For now, we just set the primary hex/css variable
        }
    };

    return (
        <TenantContext.Provider value={{ tenant, isLoading }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
