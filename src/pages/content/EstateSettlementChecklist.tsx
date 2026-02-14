import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";
import { CheckCircle, ArrowRight, ShieldCheck, Clock, FileText } from "lucide-react";

export default function EstateSettlementChecklist() {
    const toc = [
        { id: "workflow-overview", label: "The Master Workflow" },
        { id: "phase-1", label: "Phase 1: Immediate Protection" },
        { id: "phase-2", label: "Phase 2: Legal Authority" },
        { id: "phase-3", label: "Phase 3: Asset Inventory" },
        { id: "phase-4", label: "Phase 4: Distribution" },
        { id: "digital-solution", label: "Going Digital" }
    ];

    return (
        <PillarPageLayout
            category="Product Bridge"
            heroTitle="The Complete Estate Settlement Checklist: A Workflow for Executors"
            heroSubtitle="Stop juggling spreadsheets and chaotic emails. This master checklist turns the complex probate maze into a manageable project."
            toc={toc}
        >
            <SEO
                title="Estate Settlement Checklist: The 2026 Master Workflow | ExpectedEstate"
                description="A comprehensive master checklist for estate settlement. From death certificate orders to final distribution of assets. Organize your executor duties today."
                ogTitle="Estate Settlement: The Complete Executor Workflow"
            />

            <section id="workflow-overview">
                <h2>Turn Complexity into a Clear Workflow</h2>
                <p>
                    Settling an estate isn't a single task—it's a series of legal, financial, and emotional phases. This master checklist is designed to keep you from missing critical deadlines during your first year as an executor.
                </p>
                <p>
                    For state-specific nuances, make sure to cross-reference our <a href="/probate-texas">Texas</a> or <a href="/probate-california">California</a> guides.
                </p>
            </section>

            <section id="phase-1" className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black">1</div>
                    <h2 className="m-0 border-none">Immediate Protection (Week 1)</h2>
                </div>
                <ul className="space-y-4">
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Pronouncement of Death:</strong> Ensure legal documents are filed by medical staff or hospice.</span>
                    </li>
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Secure Property:</strong> Change locks if necessary and ensure pets/perishables are managed.</span>
                    </li>
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Funeral Arrangements:</strong> Inquire about pre-paid plans or military honors.</span>
                    </li>
                </ul>
                <p>For more detail on these first 48 hours, see <a href="/what-to-do-when-someone-dies">What to Do When Someone Dies</a>.</p>
            </section>

            <section id="phase-2" className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black">2</div>
                    <h2 className="m-0 border-none">Establishing Authority (Month 1-2)</h2>
                </div>
                <ul className="space-y-4">
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Locate the Original Will:</strong> Search safes and attorney files for the signed original.</span>
                    </li>
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>File Petition for Probate:</strong> Start the court clock in the deceased's county of residence.</span>
                    </li>
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Obtain EIN:</strong> Create a tax ID for the estate so you can open accounts.</span>
                    </li>
                </ul>
                <p>Deep Dive: <a href="/probate-process">The Full Probate Timeline</a>.</p>
            </section>

            <section id="phase-3" className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black">3</div>
                    <h2 className="m-0 border-none">Asset Inventory & Debt (Month 3-9)</h2>
                </div>
                <ul className="space-y-4">
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Inventory All Assets:</strong> Bank accounts, real estate, vehicles, and digital property.</span>
                    </li>
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Appraise High-Value Items:</strong> Get written valuations for jewelry and homes.</span>
                    </li>
                    <li className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-1" />
                        <span><strong>Notify and Pay Creditors:</strong> Use estate funds only to pay valid, verified debts after the notice period.</span>
                    </li>
                </ul>
                <p>Related: <a href="/transfer-car-title-after-death">How to Transfer Vehicle Titles</a>.</p>
            </section>

            <section id="phase-4" className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black">4</div>
                    <h2 className="m-0 border-none">Final Accounting & Distribution</h2>
                </div>
                <p>
                    Once all debts are paid and taxes (including final 1040) are filed, you must provide a final accounting to the beneficiaries and the court. Only then can checks be written to the heirs.
                </p>
            </section>

            <section id="digital-solution" className="mt-20 p-12 bg-primary rounded-[3rem] text-white">
                <div className="max-w-2xl">
                    <h2 className="text-white border-none mt-0">Ditch the paper. Go digital.</h2>
                    <p className="text-primary-foreground/80 mb-10 text-lg font-medium leading-relaxed">
                        The checklist above is just the start. ExpectedEstate turns these steps into an interactive dashboard that guides you day-by-day.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                        {[
                            { icon: ShieldCheck, text: "Fiduciary Recordkeeping" },
                            { icon: Clock, text: "Deadline Reminders" },
                            { icon: FileText, text: "Auto-Generated Reports" },
                            { icon: ArrowRight, text: "Direct Advisor Access" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 text-white/60" />
                                <span className="font-bold">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <a href="/auth?mode=signup" className="px-10 py-5 bg-white text-primary rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl">
                            Launch Your Dashboard
                        </a>
                    </div>
                </div>
            </section>
        </PillarPageLayout>
    );
}
