import React from "react";
import { Scale, Info } from "lucide-react";
import { useLocation } from "react-router-dom";

export function LegalDisclaimer() {
    const location = useLocation();

    // Pages that require the high-visibility detailed disclaimer
    const riskPages = [
        "/dashboard",
        "/settlement-trail",
        "/roadmap",
        "/discovery",
        "/probate",
        "/forms"
    ];

    const isRiskPage = riskPages.some(p => location.pathname.startsWith(p));

    if (!isRiskPage) {
        return (
            <div className="border-t border-slate-100 py-4 px-8 ml-64 bg-white/50">
                <div className="max-w-6xl mx-auto flex items-center gap-3 text-slate-400">
                    <Info className="w-3.5 h-3.5" />
                    <p className="text-[10px] font-medium leading-none">
                        <strong>ExpectedEstate is not a law firm and does not provide legal advice.</strong> This platform helps executors document fiduciary actions for attorney review.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border-t border-slate-200 py-8 px-8 ml-64">
            <div className="max-w-6xl mx-auto space-y-6 text-slate-500">
                <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="p-2 bg-slate-200 rounded-lg shrink-0">
                        <Scale className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] leading-relaxed flex-1">
                        <p className="font-bold text-slate-600 mb-2 uppercase tracking-wider">Legal Notice & Fiduciary Record Statement</p>
                        <p className="mb-3">
                            <strong>ExpectedEstate is not a law firm and does not provide legal advice.</strong> Use of this platform does not create an attorney-client relationship.
                            ExpectedEstate provides a structured process and recordkeeping system designed to help executors document fiduciary actions and comply with procedural requirements.
                            Executors are encouraged to consult qualified legal counsel for legal interpretation, judgment, and advice.
                        </p>
                        <p className="italic text-slate-400 font-medium">
                            "ExpectedEstate provides executors with a disciplined, state-specific workflow that mirrors how probate attorneys document estate administration... so attorneys can efficiently review, advise, and defend executor decisions."
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-6">
                    <div className="text-[11px] leading-relaxed">
                        <p className="font-bold text-slate-600 mb-1">Process Guarantee</p>
                        <p>
                            We guarantee the integrity of your activity logs and the deterministic application of statutory notice periods as defined in your selected probate track.
                        </p>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                        <p className="font-bold text-slate-600 mb-1">Attorney-Compliant Workflow</p>
                        <p>
                            This platform is designed to complement legal counsel by enforcing search discipline and creditor priority tracking.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
