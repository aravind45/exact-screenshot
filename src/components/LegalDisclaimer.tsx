import React from "react";
import { Scale } from "lucide-react";

export function LegalDisclaimer() {
    return (
        <div className="bg-slate-50 border-t border-slate-200 py-6 px-8 ml-64">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 text-slate-500">
                <div className="p-2 bg-slate-200 rounded-lg shrink-0">
                    <Scale className="w-4 h-4" />
                </div>
                <div className="text-[11px] leading-relaxed space-y-3">
                    <div>
                        <p className="font-bold text-slate-600 mb-1 uppercase tracking-wider">Legal Boundary Statement</p>
                        <p>
                            ExpectedEstate is a workflow and documentation assistance platform. We are not a law firm, we do not provide legal advice,
                            and our automated monitors are for informational purposes only. Use of this platform does not create an attorney-client relationship.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                        <div>
                            <p className="font-bold text-slate-600 mb-1">Our Guarantee</p>
                            <p>
                                We guarantee the integrity of your activity logs and the deterministic application of the specific workflow patterns and state-specific notice periods you select.
                                Your "Fiduciary Activity Report" is a faithful record of your diligence.
                            </p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-600 mb-1">What We Do Not Replace</p>
                            <p>
                                This platform does not replace the professional judgment of legal counsel, nor does it replace the executor's responsibility
                                to verify all account data, valuations, and claim statuses prior to final distribution.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
