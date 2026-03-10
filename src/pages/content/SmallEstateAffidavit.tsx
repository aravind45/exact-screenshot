import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function SmallEstateAffidavit() {
    const toc = [
        { id: "what-is-small-estate", label: "What is a Small Estate Affidavit?" },
        { id: "when-to-use", label: "When Can You Use It? ($ Thresholds)" },
        { id: "step-by-step", label: "How to File (Step-by-Step)" },
        { id: "state-thresholds", label: "State-by-State Affidavit Limits" },
        { id: "risks", label: "Personal Liability Risks" },
        { id: "faq", label: "Affidavit Frequently Asked Questions" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Use a Small Estate Affidavit to Bypass Probate",
        "description": "A guide on using a small estate affidavit to collect assets without a full court probate process.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Wait the Required Period",
                "text": "Most states require you to wait between 30 and 40 days after the date of death before filing the affidavit."
            },
            {
                "@type": "HowToStep",
                "name": "Prepare the Affidavit",
                "text": "Fill out the state-specific form, listing all assets and their values."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Simplified Probate"
            heroTitle="Small Estate Affidavit: The Faster Path to Settle Estates"
            heroSubtitle="Skip the years of court hearings. Learn if the estate qualifies for this 'shortcut' and how to secure assets in as little as 30 days."
            toc={toc}
        >
            <SEO
                title="Small Estate Affidavit: State Limits & Filing Guide 2026"
                description="Learn if you qualify for a Small Estate Affidavit. Explore the $184.5k CA limit, $75k TX limit, and step-by-step instructions for bypassing probate."
                ogTitle="Small Estate Affidavit: The Complete 2026 Procedural Guide"
                structuredData={structuredData}
            />

            <section id="what-is-small-estate">
                <h2>What is a Small Estate Affidavit? (Primary Keyword Intent)</h2>
                <p>
                    A <strong>Small Estate Affidavit</strong> is a sworn legal statement that allows heirs or beneficiaries to collect assets without going through a full, formal <a href="/probate-process">probate court process</a>.
                </p>
                <p>
                    In most states, if the total value of the deceased's assets is below a certain dollar limit, you can present this notarized document directly to banks, financial institutions, and DMVs to transfer title or funds. This is a powerful tool for executors to reduce the <a href="/probate-cost">cost of probate</a> significantly.
                </p>
            </section>

            <section id="when-to-use">
                <h2>When Can You Use It? Eligibility Requirements</h2>
                <p>
                    Eligibility is the most critical hurdle. You must satisfy three primary criteria:
                </p>
                <ul>
                    <li><strong>The Dollar Limit:</strong> The gross value of the estate (minus things like mortgages and non-probate trusts) must be below your state's threshold.</li>
                    <li><strong>Mandatory Waiting Period:</strong> You cannot use an affidavit the day after a loss. Most states require 30 to 40 days to pass first. See our <a href="/what-to-do-when-someone-dies">What to Do After Death</a> guide for immediate tasks.</li>
                    <li><strong>No Other Probate Pending:</strong> You cannot use an affidavit if someone else has already opened a formal probate case in court for the same estate.</li>
                </ul>
            </section>

            <section id="step-by-step">
                <h2>How to File (Step-by-Step Instructions)</h2>
                <ol>
                    <li><strong>Identify the Probate Assets:</strong> List every bank account, vehicle, and piece of property owned solely by the deceased. For cars, see our <a href="/transfer-car-title-after-death">Vehicle Title Guide</a>.</li>
                    <li><strong>Check for Real Estate:</strong> Some states do not allow affidavits for real property (houses). In those cases, even if the value is low, you may still need a formal process or an "Affidavit of Heirship."</li>
                    <li><strong>Locate the Heirs:</strong> Every person who is legally entitled to a share of the estate under the will or <a href="/intestate-without-will">Intestacy Laws</a> must sign the affidavit.</li>
                    <li><strong>Notarize the Document:</strong> The affidavit is a sworn statement. All signatures must be made in the presence of a Notary Public.</li>
                </ol>
            </section>

            <section id="state-thresholds">
                <h2>State-by-State Thresholds (2026 Updated)</h2>
                <p>
                    Limits are adjusted frequently for inflation. Here are the 2026 limits for high-volume states:
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Small Estate Limit</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>California</td>
                            <td>$184,500</td>
                            <td>Deep Dive: <a href="/probate-california">CA Rules</a></td>
                        </tr>
                        <tr>
                            <td>Texas</td>
                            <td>$75,000</td>
                            <td>Deep Dive: <a href="/probate-texas">TX Rules</a></td>
                        </tr>
                        <tr>
                            <td>Florida</td>
                            <td>$75,000</td>
                            <td>Deep Dive: <a href="/probate-florida">FL Rules</a></td>
                        </tr>
                        <tr>
                            <td>Illinois</td>
                            <td>$100,000</td>
                            <td>Must include original will if found.</td>
                        </tr>
                        <tr>
                            <td>New York</td>
                            <td>$50,000</td>
                            <td>Known as "Voluntary Administration."</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section id="risks">
                <h2>Personal Liability Risks</h2>
                <p>
                    Using an affidavit is simpler, but it is not a "get out of debt free" card.
                </p>
                <blockquote>
                    "By signing a Small Estate Affidavit, you are personally swearing to the truth of the statements. If you omit a creditor or an heir, you can be held personally liable for the financial loss."
                </blockquote>
                <p>
                    Always ensure you have used a comprehensive <a href="/executor-checklist">Settlement Checklist</a> before distributing assets.
                </p>
            </section>

            <section id="faq">
                <h2>Affidavit Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Can I use a Small Estate Affidavit if there is NO will?</strong>
                        <p>Yes. This is one of the most common uses. The heirs are determined by your state's "intestacy" laws.</p>
                    </div>
                    <div>
                        <strong>Do I need to file this with the court?</strong>
                        <p>In most states (like California), no. You just present it to the bank. In some (like Texas), you must file it with the court clerk for a judge's signature before it is valid.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Confirm your eligibility.</h2>
                <p className="text-slate-400 mb-8">
                    The difference between a 30-day affidavit and a 12-month probate is often just $1. ExpectedEstate helps you precisely value the estate to ensure you aren't spending more time in court than necessary.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Get Precise Value Support
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        General Probate Guide
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}

