import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export interface TrackingData {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    source?: string;
    email?: string;
    metadata?: any;
}

export const useTracking = () => {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);

        const utmSource = params.get("utm_source");
        const utmMedium = params.get("utm_medium");
        const utmCampaign = params.get("utm_campaign");
        const source = params.get("source");

        // Perist to sessionStorage if present
        if (utmSource) sessionStorage.setItem("utm_source", utmSource);
        if (utmMedium) sessionStorage.setItem("utm_medium", utmMedium);
        if (utmCampaign) sessionStorage.setItem("utm_campaign", utmCampaign);
        if (source) sessionStorage.setItem("source", source);
    }, [location]);

    const getTrackingData = useCallback((): TrackingData => {
        return {
            utmSource: sessionStorage.getItem("utm_source") || undefined,
            utmMedium: sessionStorage.getItem("utm_medium") || undefined,
            utmCampaign: sessionStorage.getItem("utm_campaign") || undefined,
            source: sessionStorage.getItem("source") || undefined,
        };
    }, []);

    const trackEvent = useCallback(async (event: string, extraData: Partial<TrackingData> = {}) => {
        const trackingData = getTrackingData();
        const payload = {
            event,
            ...trackingData,
            ...extraData
        };

        try {
            await fetch("/api/marketing/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Failed to track event:", error);
        }
    }, [getTrackingData]);

    return { trackEvent, getTrackingData };
};
