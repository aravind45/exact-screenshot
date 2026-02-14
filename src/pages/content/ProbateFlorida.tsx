import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function ProbateFlorida() {
    const toc = [
        { id: "florida-basics", label: "Florida Probate Basics" },
        { id: "summary-admin", label: "Summary Administration" },
        { id: "formal-admin", label: "Formal Administration" },
        { id: "homestead", label: "Florida Homestead Protection" },
        { id: "timelines", label: "Florida Probate Timelines" },
        { id: "faq", label: "Florida FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Florida Probate Guide: Summary vs Formal Administration",
        "description": "Understand Florida's unique probate laws. Learn about Summary Administration for estates under $75,000, the importance of Florida Homestead, and required legal counsel.",
        "author": {
            "@type": "Organization",
            "name": "ExpectedEstate"
        }
    };

    return (
        <PillarPageLayout
            category="State Guide"
            heroTitle="Florida Probate: Navigating the Sunshine State's Estate Rules"
            heroSubtitle="Florida probate law is unique, particularly regarding its protections for the family home. Learn how to navigate the system efficiently in 2026."
            toc={toc}
        >
            <SEO
                title="Florida Probate Guide: Summary vs Formal Administration | ExpectedEstate"
                description="A complete guide to Florida probate. Learn about Summary Administration thresholds, Formal Administration requirements, and the Florida Homestead law."
                ogTitle="Florida Probate: The 2026 Complete Roadmap"
                structuredData={structuredData}
            />

            <section id="florida-basics">
                <h2>Florida Probate Basics</h2>
                <p>
                    Florida law recognizes two primary levels of probate: <strong>Summary Administration</strong> and <strong>Formal Administration</strong>. A key requirement in Florida is that almost every executor (Personal Representative) must be represented by an attorney, with very few exceptions for small estates.
                </p>
                <p>
                    The process is governed by the Florida Probate Code and is designed to ensure that creditors are paid and assets are distributed according to the deceased's will or state intestacy laws. For a broader look at executor duties, see our <a href="/executor-checklist">National Executor Checklist</a>.
                </p>
            </section>

            <section id="summary-admin">
                <h2>Summary Administration: The Faster Option</h2>
                <p>
                    Summary Administration is a "shortcut" for smaller estates. You may qualify if:
                </p>
                <ul>
                    <li>The total value of the "probate" assets is <strong>$75,000 or less</strong>.</li>
                    <li>OR, the deceased has been dead for more than <strong>two years</strong>.</li>
                </ul>
                <p>
                    In Summary Administration, the court issues an "Order of Summary Administration" that directs the transfer of assets immediately, bypassing the long appointment of a Personal Representative.
                </p>
            </section>

            <section id="formal-admin">
                <h2>Formal Administration</h2>
                <p>
                    Formal Administration is required for estates exceeding $75,000 or when there are complicated creditor issues. This is a full court proceeding where a Personal Representative is officially appointed by "Letters of Administration."
                </p>
                <p>
                    <strong>Note:</strong> In Florida, a Personal Representative must either be a resident of Florida OR a close relative (spouse, sibling, parent, child, etc.). Non-residents who are not close family members cannot serve as executors in Florida.
                </p>
            </section>

            <section id="homestead">
                <h2>Florida Homestead Protection</h2>
                <p>
                    Florida has some of the strongest "Homestead" protections in the country. A family's primary residence is often protected from the claims of most creditors.
                </p>
                <p>
                    However, this asset is "non-probate" in terms of value but still requires a court order to clear title for sale or transfer. This is done via a "Petition to Determine Homestead," which is a secondary filing within the probate case.
                </p>
            </section>

            <section id="timelines">
                <h2>Florida Probate Timelines</h2>
                <p>
                    Florida courts are relatively efficient, but certain statutory windows cannot be bypassed:
                </p>
                <ul>
                    <li><strong>Summary Administration:</strong> 3 to 8 weeks.</li>
                    <li><strong>Formal Administration:</strong> 6 to 12 months (minimum).</li>
                    <li><strong>Creditor Period:</strong> A mandatory 90-day window from the first publication of the "Notice to Creditors."</li>
                </ul>
            </section>

            <section id="faq">
                <h2>Florida Probate FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Do I need a lawyer for probate in Florida?</strong>
                        <p>Yes. Under Florida Probate Rule 5.030, every guardian and every personal representative, unless the personal representative remains the sole interested party, must be represented by an attorney admitted to practice in Florida.</p>
                    </div>
                    <div>
                        <strong>Can I avoid probate in Florida?</strong>
                        <p>Yes. Common methods include "Lady Bird Deeds" for real estate and Revocable Living Trusts for financial assets.</p>
                    </div>
                    <div>
                        <strong>How much does a Florida probate lawyer cost?</strong>
                        <p>Florida law provides a "presumptively reasonable" fee schedule based on the estate's value, typically starting at 3% for the first $1 million.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Dealing with a Florida Estate?</h2>
                <p className="text-slate-400 mb-8">
                    Between Summary Administration and Homestead petitions, Florida probate involves significant paperwork. ExpectedEstate helps you track every requirement so your legal consultation is focused and efficient.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Join ExpectedEstate Florida
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        General Probate Guide
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
