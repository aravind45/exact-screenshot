import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function ProbateCost() {
    const toc = [
        { id: "cost-breakdown", label: "Where Does the Money Go?" },
        { id: "attorney-fees", label: "Attorney Fees (Statutory vs. Hourly)" },
        { id: "court-costs", label: "Court & Filing Fees" },
        { id: "executor-pay", label: "How Much is the Executor Paid?" },
        { id: "hidden-costs", label: "Hidden Probate Expenses" },
        { id: "faq", label: "Probate Cost FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "How Much Does Probate Cost in 2026?",
        "description": "A comprehensive guide to the expenses associated with probate, including court fees, attorney commissions, and hidden costs like appraisals and bonds.",
        "author": {
            "@type": "Organization",
            "name": "ExpectedEstate"
        }
    };

    return (
        <PillarPageLayout
            category="Commercial Intent"
            heroTitle="How Much Does Probate Really Cost? A Comprehensive Breakdown"
            heroSubtitle="Probate is an investment in clearing title and settling debts. Learn the typical cost ranges and where you can save money during the process."
            toc={toc}
        >
            <SEO
                title="Probate Costs: How Much Does It Cost to Settle an Estate? | ExpectedEstate"
                description="A full breakdown of probate fees in 2026. Learn about statutory attorney fees, court filing costs, executor commissions, and appraisal expenses."
                ogTitle="The True Cost of Probate: 2026 Fee Guide"
                structuredData={structuredData}
            />

            <section id="cost-breakdown">
                <h2>Where Does the Money Go?</h2>
                <p>
                    On average, the total cost of probate ranges from <strong>3% to 7% of the gross estate value</strong>. For an estate worth $500,000, that means between $15,000 and $35,000 is consumed by fees and expenses before any heirs get paid.
                </p>
                <p>
                    These costs aren't paid "upfront" by the executor; they are paid out of the estate's assets (the bank accounts and proceeds from sales) as the case progresses.
                </p>
            </section>

            <section id="attorney-fees">
                <h2>Attorney Fees (Statutory vs. Hourly)</h2>
                <p>
                    This is typically the single largest expense. Attorneys charge in one of three ways:
                </p>
                <ul>
                    <li><strong>Statutory Fees:</strong> In states like California and Florida, the fee is a fixed percentage set by state law. (See our <a href="/probate-california">California Fee Table</a>).</li>
                    <li><strong>Hourly Rates:</strong> Common in states like Texas and New York. Rates for probate attorneys typically range from $250 to $600 per hour.</li>
                    <li><strong>Flat Fees:</strong> Occasional for very simple, "uncontested" cases like a <a href="/small-estate-affidavit">Small Estate Affidavit</a>.</li>
                </ul>
            </section>

            <section id="court-costs">
                <h2>Court & Filing Fees</h2>
                <p>
                    Every state and county has their own fee schedule. These are mandatory "taxes" to use the court system.
                </p>
                <ul>
                    <li><strong>Initial Filing Fee:</strong> $300 - $1,500 depending on the estate value.</li>
                    <li><strong>Publication Fee:</strong> $100 - $300 to publish the mandatory notice in a local newspaper.</li>
                    <li><strong>Certified Copies:</strong> $15 - $30 per copy of letters or death certificates.</li>
                </ul>
            </section>

            <section id="executor-pay">
                <h2>How Much is the Executor Paid?</h2>
                <p>
                    By law, executors are entitled to be paid for their work. In states with statutory fees, the executor usually gets the exact same amount as the attorney. For a full breakdown of these responsibilities, see our <a href="/executor-checklist">Executor Checklist</a>.
                </p>
                <blockquote>
                    "Many family members choose to waive their fee to preserve more of the inheritance for the rest of the family, but this is a personal choice, not a legal requirement."
                </blockquote>
            </section>

            <section id="hidden-costs">
                <h2>Hidden Probate Expenses</h2>
                <ul className="space-y-4">
                    <li><strong>Probate Bond:</strong> An insurance policy that protects heirs. Premiums are usually around $500 - $1,000 per year.</li>
                    <li><strong>Appraisal Fees:</strong> Professional valuations for real estate and jewelry. Expect $300 - $1,000 per appraisal.</li>
                    <li><strong>Property Maintenance:</strong> Paying utilities, gardening, and insurance on a house while it sits in probate.</li>
                </ul>
            </section>

            <section id="faq">
                <h2>Probate Cost FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Can I pay probate costs with my own money?</strong>
                        <p>You can, and you are entitled to be reimbursed as a "priority claim" before any other debts are paid. However, it is always better to pay directly from the estate's bank account if liquidity is available.</p>
                    </div>
                    <div>
                        <strong>Is probate cheaper if there is a will?</strong>
                        <p>Not necessarily. While a will makes the process smoother and often waives the "bond" cost, the statutory percentages remains the same in many states.</p>
                    </div>
                    <div>
                        <strong>How can I lower the cost of probate?</strong>
                        <p>Being organized. Every hour an attorney spends searching for your paperwork is an hour they bill you for. ExpectedEstate is designed to keep you organized so you spend less on professional fees.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-green-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Don't overpay for settlement.</h2>
                <p className="text-green-200 mb-8">
                    The more organized the executor, the lower the professional fees. ExpectedEstate's digital roadmap keeps every document and receipt in one place, ready for your attorney.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Save Time & Money
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        General Probate Guide
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
