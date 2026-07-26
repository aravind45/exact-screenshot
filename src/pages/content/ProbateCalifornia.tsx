import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function ProbateCalifornia() {
    const toc = [
        { id: "california-basics", label: "California Probate Basics" },
        { id: "simplified-procedures", label: "Simplified Procedures ($208,850)" },
        { id: "full-probate", label: "Full Formal Probate" },
        { id: "fees-costs", label: "Statutory Fees & Costs" },
        { id: "forms", label: "Essential CA Forms" },
        { id: "faq", label: "California FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "California Probate Process: The 2026 Complete Guide",
        "description": "Navigate the California probate court system. Learn about the $208,850 threshold, statutory attorney fees, and the step-by-step timeline for CA estates.",
        "author": {
            "@type": "Organization",
            "name": "ExpectedEstate"
        }
    };

    return (
        <PillarPageLayout
            category="State Guide"
            heroTitle="California Probate: A Comprehensive Roadmap for Executors"
            heroSubtitle="California's probate system is notoriously complex and expensive. We've simplified the rules, thresholds, and timelines to help you stay in control."
            toc={toc}
        >
            <SEO
                title="California Probate Process: Rules, Fees & Timelines | ExpectedEstate"
                description="A detailed guide to California probate law. Learn about simplified procedures for estates under $208,850, statutory fees, and the CA probate timeline."
                ogTitle="California Probate Guide: 2026 Updated Laws"
                structuredData={structuredData}
            />

            <section id="california-basics">
                <h2>California Probate Basics</h2>
                <p>
                    In California, probate is the court-supervised process for identifying and gathering the assets of a deceased person, paying their debts, and distributing the balance to their heirs. The process is handled by the Superior Court in the county where the deceased resided.
                </p>
                <p>
                    Unlike some states with flexible "independent" administration, California probate involves multiple court hearings, mandatory appraisals by a Probate Referee, and strictly regulated attorney fees. For a general overview of the national process, see our <a href="/probate-process">National Probate Guide</a>.
                </p>
            </section>

            <section id="simplified-procedures">
                <h2>Simplified Procedures: The $208,850 Threshold</h2>
                <p>
                    Not every California estate requires a full court proceeding. As of 2026, if the total value of the "probate estate" is <strong>$208,850 or less</strong>, you may qualify for simplified procedures that bypass formal court hearings entirely.
                </p>
                <ul>
                    <li><strong>Small Estate Affidavit:</strong> Used for personal property (bank accounts, stocks, cars) after a 40-day waiting period. See our dedicated <a href="/small-estate-affidavit">Small Estate Affidavit Guide</a>.</li>
                    <li><strong>Spousal Property Petition:</strong> If the assets pass to a surviving spouse or domestic partner, this allows for a much faster transfer regardless of the estate's value.</li>
                    <li><strong>Succession to Real Property:</strong> A simplified court petition for real estate valued under $208,850.</li>
                    <li><strong>Primary Residence Petition (AB 2016, new for 2025):</strong> For deaths on or after April 1, 2025, the decedent's primary residence valued at <strong>$750,000 or less</strong> (gross) may qualify for a streamlined court petition (Prob. Code §§13151–13154) without full probate — a major expansion since most California homes far exceed the general $208,850 threshold.</li>
                </ul>
            </section>

            <section id="full-probate">
                <h2>Full Formal Probate</h2>
                <p>
                    If the estate exceeds the small estate threshold, you must file a formal petition. In California, this typically takes <strong>12 to 18 months</strong>.
                </p>
                <ol>
                    <li><strong>Petition for Letters:</strong> Filing the initial paperwork to have the executor appointed.</li>
                    <li><strong>Creditor Notice:</strong> A mandatory 4-month period where creditors can file claims.</li>
                    <li><strong>Inventory & Appraisal:</strong> Every asset must be valued by a court-appointed "Probate Referee."</li>
                    <li><strong>Final Distribution:</strong> Once all taxes and debts are settled, the court signs an order authorizing distribution.</li>
                </ol>
            </section>

            <section id="fees-costs">
                <h2>Statutory Fees & Costs</h2>
                <p>
                    California law sets mandatory statutory fees for both the attorney and the executor based on the gross value of the estate. These fees are NOT based on work performed, but on a sliding scale:
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>Estate Value</th>
                            <th>Statutory Fee (Each)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>First $100,000</td>
                            <td>4%</td>
                        </tr>
                        <tr>
                            <td>Next $100,000</td>
                            <td>3%</td>
                        </tr>
                        <tr>
                            <td>Next $800,000</td>
                            <td>2%</td>
                        </tr>
                        <tr>
                            <td>Next $9,000,000</td>
                            <td>1%</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    <em>Example: A $1,000,000 estate in California results in $23,000 for the attorney and $23,000 for the executor, totaling $46,000 in mandatory fees.</em>
                </p>
            </section>

            <section id="forms">
                <h2>Essential CA Forms</h2>
                <p>
                    The Judicial Council of California provides standardized forms for every step. The most common include:
                </p>
                <ul>
                    <li><strong>DE-111:</strong> Petition for Probate</li>
                    <li><strong>DE-160:</strong> Inventory and Appraisal</li>
                    <li><strong>DE-121:</strong> Notice of Petition to Administer Estate</li>
                </ul>
            </section>

            <section id="faq">
                <h2>California Probate FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Can I avoid probate in California?</strong>
                        <p>Yes. Using a Revocable Living Trust is the most common way to ensure your California assets bypass the court system entirely.</p>
                    </div>
                    <div>
                        <strong>Is probate public in California?</strong>
                        <p>Yes. All filings, including the list of your assets and who inherits them, are public records accessible at the county courthouse.</p>
                    </div>
                    <div>
                        <strong>How long do I have to file probate in CA?</strong>
                        <p>While there is no strict deadline for opening probate, California law requires the custodian of a will to deliver it to the clerk of the court within 30 days of learning of the death.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Managing a California Estate?</h2>
                <p className="text-slate-400 mb-8">
                    The California statutory fee structure means errors can be incredibly expensive. Use ExpectedEstate to stay organized and minimize the billable hours you spend with professionals.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Start Your CA Roadmap
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        General Probate Guide
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
