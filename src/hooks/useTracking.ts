import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export interface TrackingData {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    source?: string;
    email?: string;
    metadata?: any;
    [key: string]: any; // Allow arbitrary extra data for pixels
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

        // 1. Fire Internal Tracking
        try {
            await fetch("/api/marketing/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Failed to track event:", error);
        }

        // 2. Fire External Pixels (Safe Checks)
        try {
            // Facebook Pixel
            if (typeof window !== 'undefined' && (window as any).fbq) {
                const fbEventMap: Record<string, string> = {
                    'intake_started': 'InitiateCheckout',
                    'intake_completed': 'CompleteRegistration', // or Purchase if paid
                    'purchase': 'Purchase',
                    'lead': 'Lead',
                    'view_content': 'ViewContent'
                };
                const fbEvent = fbEventMap[event] || 'CustomEvent';
                (window as any).fbq('track', fbEvent, extraData);
            }

            // Google Tag (gtag)
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', event, extraData);
            }

            // TikTok Pixel
            if (typeof window !== 'undefined' && (window as any).ttq) {
                (window as any).ttq.track(event, extraData);
            }
        } catch (e) {
            console.warn("External pixel error", e);
        }
    }, [getTrackingData]);

    return { trackEvent, getTrackingData };
};
