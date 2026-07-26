import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function TransferCarTitle() {
    const toc = [
        { id: "step-by-step", label: "Step-by-Step Title Transfer" },
        { id: "probate-vs-non", label: "Probate vs. Non-Probate" },
        { id: "naming-rights", label: "Rights of Survivorship" },
        { id: "state-specific", label: "Major State DMV Rules" },
        { id: "common-fees", label: "Taxes & Fees" },
        { id: "faq", label: "Vehicle Transfer FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Transfer a Car Title After Death",
        "description": "A comprehensive guide on the legal steps to transfer a vehicle title to an heir or buyer after the owner has passed away.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Gather Required Documents",
                "text": "You will need the original title, a certified death certificate, and either probate letters or a small estate affidavit."
            },
            {
                "@type": "HowToStep",
                "name": "Visit the DMV",
                "text": "Most states require a physical visit to the DMV to submit the paperwork and pay the new registration and title fees."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Asset Transfer"
            heroTitle="Transferring a Vehicle Title After Death: A Practical Guide"
            heroSubtitle="One of the most common tasks for an executor is handling the deceased's vehicles. Learn how to navigate the DMV and clear title without the headaches."
            toc={toc}
        >
            <SEO
                title="Transfer Car Title After Death: Step-by-Step DMV Guide | ExpectedEstate"
                description="Learn how to legally transfer a car title after someone dies. Covers probate requirements, small estate affidavits, and state-specific DMV rules for 2026."
                ogTitle="Car Title Transfer Post-Death: The Complete Guide"
                structuredData={structuredData}
            />

            <section id="step-by-step">
                <h2>Step-by-Step Title Transfer</h2>
                <p>
                    Transferring the title of a car owned by a deceased person usually requires four main components: the <strong>Original Title</strong>, a <strong>Death Certificate</strong>, <strong>Legal Authority</strong> (like Letters Testamentary), and an <strong>Application for Title</strong>.
                </p>
                <ol>
                    <li><strong>Locate the Original Title:</strong> If the title is lost, you may need to apply for a duplicate title simultaneously.</li>
                    <li><strong>Verify the Lien Status:</strong> If the car has an outstanding loan, you must coordinate with the lender to clear the lien before the title can be transferred.</li>
                    <li><strong>Determine Authority:</strong> If the estate is in probate, the executor signs the back of the title. If not, a <a href="/small-estate-affidavit">Small Estate Affidavit</a> may be sufficient.</li>
                    <li><strong>Visit the DMV:</strong> Most states require the new owner (the heir or the buyer) to submit the paperwork in person to ensure all signatures are valid.</li>
                </ol>
            </section>

            <section id="probate-vs-non">
                <h2>Probate vs. Non-Probate Transfers</h2>
                <p>
                    How you transfer a car depends entirely on how it was owned.
                </p>
                <h3>Joint Ownership (JTWRS)</h3>
                <p>
                    If the car was owned by two people with "Rights of Survivorship," the title transfers automatically to the survivor. You usually only need to present the death certificate to the DMV to remove the deceased person's name.
                </p>
                <h3>Transfer on Death (TOD)</h3>
                <p>
                    Some states (like California, Texas, and Ohio) allow car owners to name a beneficiary directly on the title. This is the fastest way to transfer a vehicle as it bypasses probate entirely.
                </p>
                <h3>Probate Assets</h3>
                <p>
                    If the car was owned solely by the deceased and no beneficiary was named, it is a probate asset. You must follow the formal <a href="/probate-process">probate process</a> or use a small estate simplified procedure.
                </p>
            </section>

            <section id="naming-rights">
                <h2>Rights of Survivorship (WOS)</h2>
                <p>
                    In many states, if a vehicle is titled in the names of two or more people, they are assumed to have "Rights of Survivorship" unless the title specifically states otherwise. This is common between spouses.
                </p>
            </section>

            <section id="state-specific">
                <h2>Major State DMV Rules (2026)</h2>
                <ul>
                    <li><strong>California:</strong> Allows transfer without probate if the total estate value is under $208,850. Use Form REG 5 (Affidavit for Transfer Without Probate).</li>
                    <li><strong>Texas:</strong> Use Form VTR-262 (Affidavit of Heirship for a Motor Vehicle) if there is no will and no probate.</li>
                    <li><strong>Florida:</strong> Allows for "Disposition of Personal Property Without Administration" for vehicles in specific small estate scenarios.</li>
                </ul>
                <p>For more localized details, see our <a href="/probate-texas">Texas Probate Guide</a> or <a href="/probate-california">California Probate Guide</a>.</p>
            </section>

            <section id="common-fees">
                <h2>Common Taxes & Fees</h2>
                <p>
                    When you transfer a car to an heir, most states waive the "Sales Tax" that you would normally pay in a car purchase. However, you will still be responsible for:
                </p>
                <ul>
                    <li><strong>Title Fee:</strong> Usually $15 - $100.</li>
                    <li><strong>Registration Fee:</strong> Varies by vehicle weight and type.</li>
                    <li><strong>Plate Transfer Fee:</strong> If you are moving the plates to a new vehicle.</li>
                </ul>
            </section>

            <section id="faq">
                <h2>Vehicle Transfer FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Can I drive the car before the title is transferred?</strong>
                        <p>Technically, no. Once the owner dies, their insurance policy may become void. You should notify the insurance company immediately to ensure coverage remains active for the "Estate of" the deceased.</p>
                    </div>
                    <div>
                        <strong>What if the title is lost?</strong>
                        <p>The Personal Representative can apply for a duplicate title at the DMV by presenting their Letters Testamentary and the death certificate.</p>
                    </div>
                    <div>
                        <strong>Can I sell the car directly from the estate?</strong>
                        <p>Yes. The executor can sign the title as "Seller" on behalf of the estate. You will still need to provide the buyer with a certified copy of your Letters Testamentary so they can register the car in their name.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-blue-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Dozens of assets to track?</h2>
                <p className="text-blue-200 mb-8">
                    Cars, boats, bank accounts, and heirlooms—it adds up fast. ExpectedEstate's Asset Ledger helps you keep every title and account organized in one secure place.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Start Asset Ledger
                    </a>
                    <a href="/executor-checklist" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        Full Executor Checklist
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
