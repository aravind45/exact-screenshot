import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export function InternationalHelpSection() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                    <Globe className="w-4 h-4" />
                    International Executor Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-600" />
                        Handling an Estate from Outside the U.S.
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 text-slate-700">
                    {/* Short Truth */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <p className="font-semibold text-indigo-900">
                            You do not lose inheritance rights because you are outside the U.S.
                        </p>
                        <p className="text-sm text-indigo-800 mt-1">
                            Estates can be settled remotely — but they require extra coordination.
                        </p>
                    </div>

                    {/* What Changes */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">What Changes When You Are Abroad</h3>
                        <div className="grid gap-3">
                            <div className="flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-slate-900">1) You may need a U.S. representative</h4>
                                    <p className="text-sm text-slate-600">Many courts and banks require a U.S.-based contact. This is normal and does not mean there is a problem.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-slate-900">2) Documents take longer</h4>
                                    <p className="text-sm text-slate-600">Foreign notarization often requires apostille. This can add weeks — plan ahead.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-slate-900">3) Banks are more cautious</h4>
                                    <p className="text-sm text-slate-600">International estates are reviewed more closely. Clear records and written communication help.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-slate-900">4) Taxes may be handled differently</h4>
                                    <p className="text-sm text-slate-600">Some institutions withhold more by default for foreign recipients. Review before funds are released.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Checklist */}
                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">What to Do First (First 10 Days)</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-2 items-start text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>
                                    <strong>Decide representation:</strong> Choose a U.S. attorney or local agent if needed.
                                </span>
                            </li>
                            <li className="flex gap-2 items-start text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>
                                    <strong>Order multiple death certificates:</strong> You will need more than one.
                                </span>
                            </li>
                            <li className="flex gap-2 items-start text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>
                                    <strong>Gather identity documents:</strong> Passports, Marriage/Birth certificates.
                                </span>
                            </li>
                            <li className="flex gap-2 items-start text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>
                                    <strong>Do not rush distributions:</strong> Early mistakes cause long delays.
                                </span>
                            </li>
                            <li className="flex gap-2 items-start text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>
                                    <strong>Keep everything documented:</strong> Upload communications and confirmations.
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Remote Capabilities */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">What You Can Do Remotely</h3>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-1">
                            <li>Serve as executor or beneficiary</li>
                            <li>Sign documents (with proper notarization/apostille)</li>
                            <li>Communicate with courts and banks through counsel</li>
                            <li>Receive funds internationally (with preparation)</li>
                        </ul>
                    </section>

                    {/* Common Delays */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Common Delays (So You’re Not Surprised)</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">• Apostille processing time</div>
                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">• Bank compliance reviews</div>
                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">• International wire verification</div>
                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">• Time-zone coordination</div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 italic">These are procedural, not failures.</p>
                    </section>

                    {/* When to Get Help */}
                    <section className="border-l-4 border-amber-400 pl-4 py-1">
                        <h3 className="text-md font-bold text-slate-900">When to Get Help</h3>
                        <p className="text-sm text-slate-600 mb-2">You should strongly consider U.S. counsel if:</p>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• You are the executor and outside the U.S.</li>
                            <li>• Real estate is involved</li>
                            <li>• There are minor beneficiaries</li>
                            <li>• There are significant debts</li>
                            <li>• You receive no response from banks</li>
                        </ul>
                    </section>

                    {/* Footer Reassurance */}
                    <div className="pt-4 border-t border-slate-100 text-center">
                        <p className="font-medium text-slate-800">Many families complete estate settlement from abroad.</p>
                        <p className="text-sm text-slate-500">The key is structure, documentation, and patience.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
