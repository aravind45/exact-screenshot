import React from "react";
import { Scale } from "lucide-react";
import { useLocation } from "react-router-dom";

export function LegalDisclaimer() {
    const location = useLocation();

    // Pages that show the disclaimer
    const showDisclaimerPages = [
        "/dashboard",
        "/settlement-trail",
        "/roadmap",
        "/discovery",
        "/probate",
        "/forms"
    ];

    const shouldShow = showDisclaimerPages.some(p => location.pathname.startsWith(p));

    if (!shouldShow) return null;

    return (
        <div className="bg-slate-50 border-t border-slate-200 py-4 px-8 ml-64">
            <div className="max-w-6xl mx-auto flex items-center gap-3 text-slate-500">
                <Scale className="w-4 h-4 shrink-0" />
                <p className="text-[10px] font-medium leading-relaxed">
                    <strong>ExpectedEstate is not a law firm.</strong> We provide recordkeeping tools to help executors document fiduciary actions for attorney review. Use does not create an attorney-client relationship.
                </p>
            </div>
        </div>
    );
}
