import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function SmallEstateAffidavitGuide() {
    const toc = [
        { id: "what-is-small-estate", label: "What is a Small Estate Affidavit?" },
        { id: "when-to-use", label: "When Can You Use It?" },
        { id: "step-by-step", label: "How to File (Step-by-Step)" },
        { id: "state-thresholds", label: "State-by-State Thresholds" },
        { id: "risks", label: "Common Risks & Pitfalls" },
        { id: "faq", label: "Frequently Asked Questions" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Use a Small Estate Affidavit to Bypassing Probate",
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
            },
            {
                "@type": "HowToStep",
                "name": "Sign Before a Notary",
                "text": "The affidavit must be signed by the heirs or personal representative in the presence of a notary public."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Simplified Probate"
            heroTitle="Small Estate Affidavit: The Faster Way to Settle Estates"
            heroSubtitle="Bypass the lengthy probate court process. Learn if you qualify for a Small Estate Affidavit and how to file one successfully."
            toc={toc}
        >
            <SEO
                title="Small Estate Affidavit Guide: How to Avoid Probate in 2026"
                description="Learn how to use a Small Estate Affidavit to settle an estate without a full probate process. State thresholds, forms, and instructions for executors."
                ogTitle="Small Estate Affidavit Guide | ExpectedEstate"
                structuredData={structuredData}
            />

            <section id="what-is-small-estate">
                <h2>What is a Small Estate Affidavit?</h2>
                <p>
                    A Small Estate Affidavit is a legal document that allows heirs or beneficiaries to collect assets from a deceased person's estate without going through the formal (and often expensive) probate court process.
                </p>
                <p>
                    Think of it as a "shortcut." Instead of a judge presiding over months of hearings, the heirs present a sworn statement (the affidavit) directly to banks, financial institutions, or the DMV to transfer property title. This process is designed to prevent the legal costs of probate from consuming the value of smaller estates.
                </p>
            </section>

            <section id="when-to-use">
                <h2>When Can You Use It?</h2>
                <p>
                    Not every estate qualifies for this simplified procedure. Eligibility is determined by three main factors:
                </p>
                <ul>
                    <li><strong>Estate Value:</strong> The total value of the deceased's assets must be below your state's "Small Estate Threshold."</li>
                    <li><strong>Type of Assets:</strong> Some states only allow affidavits for "personal property" (bank accounts, cars, jewelry) and not for "real property" (houses, land).</li>
                    <li><strong>Time Elapsed:</strong> Most states require a mandatory waiting period (often 30-40 days) after the death before you can use the affidavit.</li>
                </ul>
                <p>
                    <em>Note: Assets that pass via "operation of law" (like joint bank accounts or living trusts) typically do not count toward the small estate limit.</em>
                </p>
            </section>

            <section id="step-by-step">
                <h2>How to File (Step-by-Step)</h2>
                <p>
                    While forms vary, the general steps for using a Small Estate Affidavit are as follows:
                </p>

                <h3>1. Wait the Required Time</h3>
                <p>
                    Check your state's waiting period. In California, it's 40 days; in Texas, it's 30 days. This period allows creditors a chance to come forward before assets are distributed.
                </p>

                <h3>2. Inventory the Assets</h3>
                <p>
                    List every asset that needs to be transferred. You must include the "fair market value" as of the date of death. You can use tools like the <a href="/executor-checklist">ExpectedEstate Asset Tracker</a> to organize this data.
                </p>

                <h3>3. Complete the State Form</h3>
                <p>
                    Most county courts provide a template. You must list all legal heirs and state that no formal probate proceeding is currently pending in court.
                </p>

                <h3>4. Sign in Front of a Notary</h3>
                <p>
                    Every person entitled to a share of the assets (the "affiants") must typically sign the document. Their signatures must be notarized.
                </p>

                <h3>5. Present the Affidavit</h3>
                <p>
                    You do not "file" this with the court in most cases. Instead, you take the certified death certificate and the notarized affidavit to the bank or institution holding the assets.
                </p>
            </section>

            <section id="state-thresholds">
                <h2>State-by-State Thresholds (2026 Updated)</h2>
                <p>
                    Limits change frequently. Here are the most common state thresholds for small estate simplified procedures:
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Maximum Estate Value</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>California</td>
                            <td>$184,500</td>
                            <td>Adjusted every 3 years for inflation</td>
                        </tr>
                        <tr>
                            <td>Texas</td>
                            <td>$75,000</td>
                            <td>Excludes homestead and exempt property</td>
                        </tr>
                        <tr>
                            <td>Florida</td>
                            <td>$75,000</td>
                            <td>Summary Administration portal available</td>
                        </tr>
                        <tr>
                            <td>New York</td>
                            <td>$50,000</td>
                            <td>Voluntary Administration process</td>
                        </tr>
                        <tr>
                            <td>Illonois</td>
                            <td>$100,000</td>
                            <td>Requires original will if one exists</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    For more specific state rules, see our deep dive on <a href="/probate-texas">Texas Probate Procedures</a>.
                </p>
            </section>

            <section id="risks">
                <h2>Common Risks & Pitfalls</h2>
                <p>
                    Using an affidavit is simpler, but it still carries legal weight.
                </p>
                <blockquote>
                    "If you collect money using an affidavit, you are legally responsible to pay the deceased person's debts before keeping the money for yourself."
                </blockquote>
                <ul>
                    <li><strong>Personal Liability:</strong> If you distribute money to heirs and a creditor later files a valid claim, you may have to pay that creditor out of your own pocket.</li>
                    <li><strong>Real Estate Complexity:</strong> If the deceased owned a home, a Small Estate Affidavit might not be enough to clear title for a sale. You may need a more formal "Affidavit of Heirship."</li>
                    <li><strong>Out-of-State Assets:</strong> If assets are located in multiple states, you might need to follow the rules for each individual state.</li>
                </ul>
            </section>

            <section id="faq">
                <h2>Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Is a Small Estate Affidavit the same as a will?</strong>
                        <p>No. A will says who *should* get property. An affidavit is the mechanism used to *actually get* the property when the value is low enough to skip court.</p>
                    </div>
                    <div>
                        <strong>Can I use an affidavit if there is no will?</strong>
                        <p>Yes. This is common. In this case, the state's intestacy laws determine who the legal heirs are that must sign the affidavit.</p>
                    </div>
                    <div>
                        <strong>Do I have to file the affidavit in court?</strong>
                        <p>In many states (like California), no. You just present it to the bank. In others (like Texas), you may need to file it for court approval if real estate is involved.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-primary rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Don't guess on values.</h2>
                <p className="text-primary-foreground/80 mb-8">
                    One of the biggest reasons Small Estate Affidavits are rejected is incorrect asset valuations. Use ExpectedEstate to precisely inventory and value everything in the estate.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-white text-primary rounded-full font-black hover:scale-105 transition-all shadow-xl shadow-primary/20">
                        Get Precise Valuations
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-primary-foreground/10 rounded-full font-black hover:bg-white/20 transition-all">
                        Full Probate Guide
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
