import React from "react";
import { Scale } from "lucide-react";

export function LegalDisclaimer() {
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
                        <p className="italic text-slate-400">
                            "ExpectedEstate provides executors with a disciplined, state-specific workflow that mirrors how probate attorneys document estate administration... so attorneys can efficiently review, advise, and defend executor decisions."
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-6">
                    <div className="text-[11px] leading-relaxed">
                        <p className="font-bold text-slate-600 mb-1">Process Guarantee</p>
                        <p>
                            We guarantee the integrity of your activity logs and the deterministic application of statutory notice periods as defined in your selected probate track.
                            The <strong>Fiduciary Activity Report</strong> serves as documented evidence of reasonable care.
                        </p>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                        <p className="font-bold text-slate-600 mb-1">Attorney-Compliant Workflow</p>
                        <p>
                            This platform is designed to complement legal counsel by enforcing search discipline and creditor priority tracking.
                            It does not replace professional judgment or the executor's duty to verify final distributions with an attorney.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
