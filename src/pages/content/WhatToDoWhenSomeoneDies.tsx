import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function WhatToDoWhenSomeoneDies() {
    const toc = [
        { id: "immediate-pronouncement", label: "Step 1: Pronouncement of Death" },
        { id: "family-notification", label: "Step 2: Notifying Key People" },
        { id: "organ-donation", label: "Step 3: Organ Donation & Wishes" },
        { id: "securing-assets", label: "Step 4: Securing the Home & Assets" },
        { id: "funeral-logistics", label: "Step 5: Funeral & Memorial Arrangements" },
        { id: "finding-the-will", label: "Step 6: Locating the Original Will" },
        { id: "next-steps-checklist", label: "Next Steps: The Product Bridge" },
        { id: "faq", label: "Initial Logistical FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "What To Do When Someone Dies: Step-by-Step Checklist",
        "description": "A comprehensive 7-step guide for the immediate hours and days following the loss of a loved one, including medical, legal, and security protocols.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Pronouncement of Death",
                "text": "The first legal requirement is a formal pronouncement. In a hospital, doctors do this. At home, call hospice or 911."
            },
            {
                "@type": "HowToStep",
                "name": "Secure the Estate",
                "text": "An executor's duty starts with protection. Lock doors, manage pets, and address perishables immediately."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Immediate Urgency"
            heroTitle="What To Do When Someone Dies (Step-by-Step Checklist)"
            heroSubtitle="In the wake of loss, the logistics can feel impossible. This structured guide identifies exactly what requires your attention in the first 72 hours."
            toc={toc}
        >
            <SEO
                title="What To Do When Someone Dies: Checklist & First Steps 2026"
                description="Follow this 7-step checklist for what to do when someone dies. Learn about legal pronouncements, securing assets, finding the will, and starting the probate process."
                ogTitle="What To Do After Death: The Critical First 7 Steps"
                structuredData={structuredData}
            />

            <section id="immediate-pronouncement">
                <h2>Step 1: Obtain a Legal Pronouncement of Death</h2>
                <p>
                    Regardless of where the death occurs, the very first step is obtaining a legal pronouncement. This is the official document that allows the funeral home to take custody and for the <a href="/probate-process">probate process</a> to eventually begin.
                </p>
                <h3>Hospital or Facility Death</h3>
                <p>
                    If the death occurs in a hospital, nursing home, or hospice facility, the medical staff will handle this. They will ask which funeral home you wish to use and coordinate the transfer.
                </p>
                <h3>Home Death (Hospice)</h3>
                <p>
                    If the person was under hospice care, <strong>do not call 911</strong>. Call the hospice nurse instead. They are legally authorized to pronounce death and will help you through the immediate emotional transition.
                </p>
                <h3>Home Death (Unexpected)</h3>
                <p>
                    Call 911 immediately. Emergency responders will pronounce death and, in many jurisdictions, the police or coroner will perform a standard inquiry to rule out foul play or neglect.
                </p>
            </section>

            <section id="family-notification">
                <h2>Step 2: Notify Key Family and Friends</h2>
                <p>
                    Grief is overwhelming. You should not handle all communications yourself. Identify 2-3 "point people" to manage different social circles (family, work, friends).
                </p>
                <p>
                    <strong>The "Three-Call Rule":</strong> Focus on the most immediate family first. Then, call the deceased's employer (to handle immediate pay/benefits) and their religious leader if applicable.
                </p>
            </section>

            <section id="organ-donation">
                <h2>Step 3: Check for Organ Donation Wishes</h2>
                <p>
                    Organ donation is time-sensitive. Check the deceased's driver’s license or their healthcare directive. If they were an organ donor, notify the medical team or the funeral home within the first few hours.
                </p>
            </section>

            <section id="securing-assets">
                <h2>Step 4: Secure the Home and Perishable Assets</h2>
                <p>
                    As a potential executor, you have a fiduciary duty to protect the estate even before the court appoints you.
                </p>
                <ul>
                    <li><strong>Lock the Home:</strong> Ensure all windows and doors are secure. If the home is vacant, consider notifying security or neighbors.</li>
                    <li><strong>Pets & Plants:</strong> Arrange for care immediately.</li>
                    <li><strong>Perishables:</strong> Check the refrigerator and garbage. If the house will be empty for weeks, clear out items that will spoil.</li>
                    <li><strong>High-Value Items:</strong> Remove small, portable physical assets like jewelry or cash for safekeeping, keeping a detailed log of what was moved.</li>
                </ul>
                <p>For a full list of protection duties, see our <a href="/executor-checklist">Essential Executor Checklist</a>.</p>
            </section>

            <section id="funeral-logistics">
                <h2>Step 5: Funeral & Memorial Arrangements</h2>
                <p>
                    The funeral industry is complex. Before committing to a provider, ask for a "General Price List." You are legally entitled to this, and it prevents overpaying during a vulnerable time.
                </p>
                <h3>Check for Pre-Need Contracts</h3>
                <p>
                    Check the deceased’s records for "pre-need" funeral contracts. Many people pay for these in advance to save their family the stress.
                </p>
                <h3>Military Honors</h3>
                <p>
                    If the deceased was a veteran, they may be eligible for a free burial in a national cemetery and many of the funeral expenses may be subsidized by the VA.
                </p>
            </section>

            <section id="finding-the-will">
                <h2>Step 6: Locating the Original Will</h2>
                <p>
                    Finding the will is the bridge to the legal process. You need the <strong>original</strong> document, not a photocopy, to start most probate proceedings.
                </p>
                <p>Search for a fireproof safe, a safe deposit box (reach out to their bank), or contact their estate planning attorney. If no will is found, the estate may be subject to <a href="/intestate-without-will">Intestate Succession</a> rules.</p>
            </section>

            <section id="next-steps-checklist">
                <h2>Next Steps: The Product Bridge</h2>
                <p>
                    The first 72 hours are an emotional whirlwind. Once the funeral is set, your transition into the formal "settlement phase" begins. This is where most executors get bogged down in spreadsheets and missing documents.
                </p>
                <p>
                    To move from a static checklist to an interactive, guided experience, visit our <a href="/estate-settlement-checklist">Complete Estate Settlement Workflow</a>.
                </p>
            </section>

            <section id="faq">
                <h2>Initial Logistical FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Do I need to pay the mortgage right now?</strong>
                        <p>No. Most lenders have a grace period when notified of a death. Do not use your personal funds. Wait until you have access to the estate bank account.</p>
                    </div>
                    <div>
                        <strong>What if the person died in another state?</strong>
                        <p>You will need a funeral home in the state where they died to coordinate the transfer back home. This is called "forwarding remains."</p>
                    </div>
                    <div>
                        <strong>How do I stop Social Security payments?</strong>
                        <p>Generally, the funeral home will notify the SSA. However, you should follow up to ensure payments stop, as the government will eventually claw back any funds sent after the date of death.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-primary rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Start organizing the estate.</h2>
                <p className="text-primary-foreground/80 mb-8">
                    The minutes after a loss are for family. The days after are for clarity. Use ExpectedEstate to manage the legal burden so you can focus on healing.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-white text-primary rounded-full font-black hover:scale-105 transition-all shadow-xl shadow-primary/20">
                        Start Free Roadmap
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-primary-foreground/10 rounded-full font-black hover:bg-white/20 transition-all">
                        How Probate Works
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
