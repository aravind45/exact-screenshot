import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function ExecutorChecklist() {
    const toc = [
        { id: "immediate-steps", label: "Immediate Steps (First 48 Hours)" },
        { id: "first-month", label: "The First Month" },
        { id: "legal-financial", label: "Legal & Financial Logistics" },
        { id: "inventory", label: "Inventory & Protection" },
        { id: "faq", label: "Executor FAQ" },
        { id: "resources", label: "Related Resources" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "Executor Checklist: A Complete Guide to Estate Settlement",
        "description": "A comprehensive checklist for executors including immediate steps, legal filings, and asset distribution.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Secure the Property",
                "text": "The very first task for an executor is ensuring all real estate and personal property is secure and insured."
            },
            {
                "@type": "HowToStep",
                "name": "Identify the Will",
                "text": "Locate the original will and any trust documents to understand the deceased's wishes and legal structure."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Executor Toolkit"
            heroTitle="The Essential Executor Checklist: Every Step Mapped Out"
            heroSubtitle="Taking on the role of an executor is a major responsibility. Use this comprehensive timeline to stay organized and minimize stress."
            toc={toc}
        >
            <SEO
                title="Executor Checklist: 2026 Comprehensive Guide for Settling Estates"
                description="A detailed step-by-step checklist for newly appointed executors. Learn what to do in the first 48 hours, first month, and beyond."
                ogTitle="The Definitive Executor Checklist | ExpectedEstate"
                structuredData={structuredData}
            />

            <section id="immediate-steps">
                <h2>Immediate Steps: The First 48 Hours</h2>
                <p>
                    The hours immediately following a loss are often the most stressful. For an executor, this window is about protection and preparation rather than legal paperwork.
                </p>
                <ul>
                    <li><strong>Secure Real Estate:</strong> Ensure all doors are locked and windows are shut. If the property is vacant, notify the neighbors and ensure the alarm (if any) is set.</li>
                    <li><strong>Protect Perishables:</strong> Address any immediate needs like pets, plants, or perishable food.</li>
                    <li><strong>Locate the Will:</strong> Search for the original will. Common hiding spots include home safes, safe deposit boxes (you may need a court order to open these), or the files of the deceased's attorney.</li>
                    <li><strong>Obtain Death Certificates:</strong> Order at least 10-15 certified copies. You will need these for almost every institution you contact (banks, life insurance, social security, DMV, etc.).</li>
                </ul>
            </section>

            <section id="first-month">
                <h2>The First Month: Setting the Foundation</h2>
                <p>
                    Once the immediate crisis has passed, your focus shifts to the formal legal process of estate administration.
                </p>

                <h3>1. Consult with Professionals</h3>
                <p>
                    Determine if you need a probate attorney or a CPA. While some small estates can be handled DIY, complex ones benefit significantly from professional guidance to avoid personal liability.
                </p>

                <h3>2. Notify Social Security and Agencies</h3>
                <p>
                    If the deceased was receiving Social Security, Veterans Affairs (VA), or other government benefits, you must notify them immediately to stop future payments and coordinate survivor benefits.
                </p>

                <h3>3. Mail and Subscription Management</h3>
                <p>
                    Forward the deceased's mail to your address. This is the single most effective way to identify unknown accounts, bills, and insurance policies.
                </p>
            </section>

            <section id="legal-financial">
                <h2>Legal & Financial Logistics</h2>
                <p>
                    This phase is about establishing your authority and opening the lines of communication with financial institutions.
                </p>

                <h3>Obtaining an EIN</h3>
                <p>
                    An estate is a separate legal entity. You must obtain an Employer Identification Number (EIN) from the IRS to open estate bank accounts and file tax returns.
                </p>

                <h3>Open an Estate Bank Account</h3>
                <p>
                    <strong>Never co-mingle estate funds with your personal funds.</strong> Open a dedicated account to receive income (like life insurance or tax refunds) and pay valid debts.
                </p>

                <h3>Inventory of Assets</h3>
                <p>
                    Create a comprehensive list of everything owned by the deceased. For a faster way to handle this, see our <a href="/probate-process">guide on asset inventory</a>.
                </p>
            </section>

            <section id="inventory">
                <h2>Inventory & Protection</h2>
                <p>
                    An executor has a "fiduciary duty" to protect the value of the estate. This means you must ensure assets don't lose value or disappear due to neglect or theft.
                </p>
                <ul>
                    <li><strong>Appraise High-Value Items:</strong> Get professional appraisals for jewelry, art, and real estate.</li>
                    <li><strong>Insurance Coverage:</strong> Ensure homeowners and auto insurance remain active. If a home is vacant, you may need a special "vacant home" policy.</li>
                    <li><strong>Digital Asset Management:</strong> Secure logins for social media, email, and online financial accounts.</li>
                </ul>
            </section>

            <section id="faq">
                <h2>Executor FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Can an executor be held personally liable?</strong>
                        <p>Yes. If an executor mismanages estate assets or pays the wrong people (like heirs before creditors), they can be held personally responsible for the loss.</p>
                    </div>
                    <div>
                        <strong>How much is an executor paid?</strong>
                        <p>Payment varies by state law and the terms of the will. It is often a percentage of the total estate value (typically 1-5%) or an hourly fee.</p>
                    </div>
                    <div>
                        <strong>Can heirs remove an executor?</strong>
                        <p>Heirs can petition the court to remove an executor if they can prove serious misconduct, such as theft, incompetence, or failure to follow court orders.</p>
                    </div>
                </div>
            </section>

            <section id="resources">
                <h2>Related Resources</h2>
                <p>Estates are complex. Explore our other guides to deepen your understanding:</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <a href="/probate-process" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-all">
                        <h4 className="font-bold mb-1">Probate Process Guide</h4>
                        <p className="text-xs text-slate-500">The full legal timeline from A to Z.</p>
                    </a>
                    <a href="/what-to-do-when-someone-dies" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-all">
                        <h4 className="font-bold mb-1">What to Do After Death</h4>
                        <p className="text-xs text-slate-500">Immediate emotional and logistical steps.</p>
                    </a>
                    <a href="/probate-texas" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-all">
                        <h4 className="font-bold mb-1">Texas Probate Secrets</h4>
                        <p className="text-xs text-slate-500">Specific rules for Texas estate settlement.</p>
                    </a>
                    <a href="/small-estate-affidavit" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-all">
                        <h4 className="font-bold mb-1">Small Estate Affidavit</h4>
                        <p className="text-xs text-slate-500">How to bypass court for smaller estates.</p>
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
