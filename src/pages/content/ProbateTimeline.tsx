import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProbateTimeline() {
    const toc = [
        { id: "overview", label: "Overview: How Long?" },
        { id: "factors", label: "What Causes Delays?" },
        { id: "timeline-breakdown", label: "Month-by-Month Breakdown" },
        { id: "state-comparison", label: "State Comparisons" },
        { id: "speed-tips", label: "How to Speed It Up" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "headline": "Probate Timeline 2026: How Long Does It Really Take?",
                "description": "A realistic month-by-month breakdown of the probate process. Learn why it takes 9-18 months and how to speed it up.",
                "author": {
                    "@type": "Organization",
                    "name": "ExpectedEstate"
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "How long does probate take?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "On average, probate takes 9 to 18 months. Simple estates can finish in 6 months, while contested ones can take years."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can you sell a house during probate?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, but it usually adds 4-6 weeks to the timeline for court approval unless you have full independent authority."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Timelines & Expectations"
            heroTitle="How Long Does Probate Take? (2026 Guide)"
            heroSubtitle="The average estate takes 12 months to settle. Here is the realistic timeline you need to plan for-and how to avoid the delays that drag it out."
            toc={toc}
        >
            <SEO
                title="Probate Timeline 2026: Month-by-Month Schedule"
                description="How long does probate take? See the realistic 12-month timeline for settling an estate, from filing to final distribution."
                ogTitle="Probate Timeline: The Realistic 12-Month Schedule"
                structuredData={structuredData}
            />

            <section id="overview">
                <h2>Overview: The 9-18 Month Reality</h2>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-6 rounded-r-xl">
                    <p className="font-bold text-amber-900 m-0 flex items-start gap-3">
                        <Clock className="w-6 h-6 shrink-0" />
                        <span>
                            National Average: <strong>12 Months</strong><br />
                            Fastest Possible: <strong>6 Months</strong> (requires perfect paperwork)<br />
                            Complex Cases: <strong>2+ Years</strong>
                        </span>
                    </p>
                </div>
                <p>
                    Most executors reduce "probate" to just the court appointment stage. In reality, the settlement clock starts the day of death and ends when the final distribution check is cashed.
                </p>
            </section>

            <section id="factors">
                <h2>Why Does It Take So Long?</h2>
                <p>Three main bottlenecks slow down every estate:</p>
                <ul className="space-y-4 mt-4">
                    <li className="flex gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <strong>Court Backlog (Adds 2-4 Months):</strong>
                            <p className="text-sm text-slate-600">Courts in major counties (like LA or Cook County) are overwhelmed. Just getting a hearing date can take 3 months.</p>
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <strong>Creditor Notice Periods (Fixed 4 Months):</strong>
                            <p className="text-sm text-slate-600">Most states legally mandate a 4-month waiting period for creditors to file claims. You literally cannot close faster than this.</p>
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <strong>Asset Sale Delays (Adds 3-6 Months):</strong>
                            <p className="text-sm text-slate-600">Cleaning out, listing, and selling a home is the biggest variable. If the market is slow, the estate stays open.</p>
                        </div>
                    </li>
                </ul>
            </section>

            <section id="timeline-breakdown">
                <h2>Month-by-Month Breakdown</h2>

                <div className="relative border-l-2 border-slate-200 ml-3 space-y-12 py-4">
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                        <h3 className="text-xl font-bold mt-0">Month 1: The Scramble</h3>
                        <p className="text-slate-600">
                            <strong>Goal:</strong> File the Petition.<br />
                            Order death certificates, locate the Will, hire counsel (or get software), and file the initial petition with the court.
                        </p>
                    </div>

                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                        <h3 className="text-xl font-bold mt-0">Month 2-3: The Waiting Game</h3>
                        <p className="text-slate-600">
                            <strong>Goal:</strong> Get "Letters".<br />
                            Wait for your court hearing. Once appointed, you get "Letters Testamentary" and can finally access bank accounts.
                        </p>
                    </div>

                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                        <h3 className="text-xl font-bold mt-0">Month 4-7: Asset Gathering & Debts</h3>
                        <p className="text-slate-600">
                            <strong>Goal:</strong> Inventory & appraisal.<br />
                            The 4-month creditor window is open. You are selling the car, cleaning the house, and building the official Inventory & Appraisal.
                        </p>
                    </div>

                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                        <h3 className="text-xl font-bold mt-0">Month 8-10: Taxes & Accounting</h3>
                        <p className="text-slate-600">
                            <strong>Goal:</strong> Final numbers.<br />
                            File the final tax returns. Prepare the Final Accounting to show beneficiaries exactly where every penny went.
                        </p>
                    </div>

                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white" />
                        <h3 className="text-xl font-bold mt-0">Month 11-12+: Distribution</h3>
                        <p className="text-slate-600">
                            <strong>Goal:</strong> Close the estate.<br />
                            Petition the court for final distribution. Once the judge signs the order, you cut the checks and file receipts.
                        </p>
                    </div>
                </div>
            </section>

            <section id="speed-tips">
                <h2>Verified Ways to Speed It Up</h2>
                <div className="grid md:grid-cols-2 gap-6 not-prose">
                    <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            File "Full Authority"
                        </h3>
                        <p className="text-sm text-slate-600">Always ask for full IAEA authority under the Independent Administration of Estates Act. It lets you sell assets without asking the judge for permission every time.</p>
                    </div>
                    <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            Waiver of Accounting
                        </h3>
                        <p className="text-sm text-slate-600">If all beneficiaries get along, ask them to sign a "Waiver of Accounting". This skips the months of detailed financial reporting to the court.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem]">
                <h2 className="border-none mt-0">Don't let the timeline slip.</h2>
                <p className="mb-8 font-medium text-lg">
                    Missing a single deadline can add 2 months to your timeline. ExpectedEstate tracks every date automatically.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary text-white rounded-full font-black hover:scale-105 transition-all shadow-xl shadow-primary/20">
                        Start Tracking My Deadlines
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
