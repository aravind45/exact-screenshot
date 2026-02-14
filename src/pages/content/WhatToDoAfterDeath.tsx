import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function WhatToDoAfterDeath() {
    const toc = [
        { id: "first-24-hours", label: "The First 24 Hours" },
        { id: "funeral-arrangements", label: "Funeral & Memorials" },
        { id: "legal-notifications", label: "Initial Legal Notifications" },
        { id: "finding-the-will", label: "Finding the Will & Documents" },
        { id: "emotional-support", label: "Emotional & Mental Health" },
        { id: "faq", label: "High-Priority FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "What to Do Immediately After Someone Dies: A Checklist",
        "description": "A compassionate guide on the immediate steps to take after the loss of a loved one, covering medical, legal, and funeral arrangements.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Obtain Pronouncement of Death",
                "text": "If the death occurs in a hospital, this is done by medical staff. If at home, you must call 911 or a hospice nurse."
            },
            {
                "@type": "HowToStep",
                "name": "Notify Close Family and Friends",
                "text": "Start with a few core people who can help you share the news and manage immediate tasks."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Immediate Support"
            heroTitle="What to Do After Death: A Compassionate First-Step Guide"
            heroSubtitle="In the moments of loss, the checklist can feel overwhelming. We've broken down exactly what needs your attention right now, and what can wait."
            toc={toc}
        >
            <SEO
                title="What to Do After Someone Dies: Immediate Checklist & Steps"
                description="A compassionate guide to the first 24-48 hours after losing a loved one. Learn about legal pronouncements, funeral arrangements, and notifying agencies."
                ogTitle="Immediate Steps After a Death | ExpectedEstate Guide"
                structuredData={structuredData}
            />

            <section id="first-24-hours">
                <h2>The First 24 Hours: Essential Actions</h2>
                <p>
                    The first day after a loss is for safety, dignity, and family. Before you worry about the bank or the court, these are the logistical priorities:
                </p>

                <h3>1. Get a Legal Pronouncement of Death</h3>
                <p>
                    Without this, no other steps can happen.
                </p>
                <ul>
                    <li><strong>In a Hospital or Nursing Home:</strong> The medical staff will handle the pronouncement and help you coordinate with a funeral home.</li>
                    <li><strong>At Home (Under Hospice Care):</strong> Contact the hospice nurse immediately. They are trained to handle this transition and will notify the proper authorities.</li>
                    <li><strong>At Home (Unexpected):</strong> Call 911. Be prepared for a brief police or coroner's inquiry, which is standard procedure for deaths occurring outside of medical supervision.</li>
                </ul>

                <h3>2. Notify Core Family & Friends</h3>
                <p>
                    Don't try to call everyone yourself. Identify 2 or 3 close friends or relatives who can act as "notifiers" for the wider circle. This preserves your energy for the immediate tasks ahead.
                </p>

                <h3>3. Secure the Home and Pets</h3>
                <p>
                    If the deceased lived alone:
                </p>
                <ul>
                    <li><strong>Pets:</strong> Arrange for immediate care and feeding.</li>
                    <li><strong>Security:</strong> Lock all doors, set alarms, and remove any identifiable cash or high-value jewelry for safekeeping.</li>
                    <li><strong>Vehicles:</strong> Ensure all cars are parked safely and locked.</li>
                </ul>
            </section>

            <section id="funeral-arrangements">
                <h2>Funeral & Memorial Arrangements</h2>
                <p>
                    Once the immediate logistics are secure, you can begin honoring your loved one's wishes.
                </p>

                <h3>Check for Pre-Plans</h3>
                <p>
                    Before booking a funeral home, search for any "Pre-Need" contracts or burial insurance policies. Many people prepay for these services to save their families the stress.
                </p>

                <h3>Choose a Funeral Home or Crematorium</h3>
                <p>
                    You are not obligated to use the first funeral home you call. It is appropriate to ask for a "General Price List" (GPL) to compare costs for burial, cremation, and memorial services.
                </p>

                <h3>Organize the Service</h3>
                <p>
                    Consider the deceased’s religious or philosophical beliefs. If they served in the military, they may be eligible for a military honors service and burial in a national cemetery.
                </p>
            </section>

            <section id="legal-notifications">
                <h2>Initial Legal Notifications</h2>
                <p>
                    While most legal work happens in the <a href="/probate-process">probate process</a>, certain notifications should happen within the first week.
                </p>
                <ul>
                    <li><strong>Social Security:</strong> Most funeral homes will notify Social Security for you, but you should verify this. This stops monthly payments and starts the process for survivor benefits.</li>
                    <li><strong>Employer:</strong> If the deceased was still working, notify their HR department to inquire about final paychecks, 401(k) accounts, and company life insurance.</li>
                    <li><strong>Landlord:</strong> If they were renting, review the lease to see when you must vacate the property or if there is a "death of tenant" clause.</li>
                </ul>
            </section>

            <section id="finding-the-will">
                <h2>Finding the Will & Documents</h2>
                <p>
                    As the haze of the first few days lifts, you will need to find the "Original Will."
                </p>
                <p>
                    <strong>Why the Original?</strong> Courts rarely accept copies of a will without a lengthy and expensive sub-process. The original usually has a blue ink signature or an embossed seal.
                </p>
                <p>Common locations to search:</p>
                <ul>
                    <li>A fireproof home safe.</li>
                    <li>A "Important Docs" binder in a home office.</li>
                    <li>The files of the family attorney.</li>
                    <li>A Safe Deposit Box (Note: You may need a court order to open this if no one else's name is on it).</li>
                </ul>
                <p>
                    For a full list of documents you'll eventually need, see our <a href="/executor-checklist">Executor Document Checklist</a>.
                </p>
            </section>

            <section id="emotional-support">
                <h2>Emotional & Mental Health</h2>
                <p>
                    Estate settlement is a marathon, not a sprint. The "fog of grief" can make simple decisions feel impossible.
                </p>
                <ul>
                    <li><strong>Allow for Delays:</strong> Except for security and funeral plans, almost everything else can wait a week.</li>
                    <li><strong>Professional Support:</strong> Consider a grief counselor or support group. Organizations like <i>GriefShare</i> offer local and online resources.</li>
                    <li><strong>Avoid Major Financial Decisions:</strong> Don't sell the house, give away expensive heirlooms, or quit your job in the first month if possible.</li>
                </ul>
            </section>

            <section id="faq">
                <h2>High-Priority FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>Do I need to pay the deceased's bills immediately?</strong>
                        <p>No. Do not pay bills with your own money. Wait until an estate account is opened. Valid creditors understand that probate takes time.</p>
                    </div>
                    <div>
                        <strong>How many death certificates should I order?</strong>
                        <p>Generally, 10 to 15 is a safe number. You need originals for banks, life insurance, real estate transfers, and closing out accounts.</p>
                    </div>
                    <div>
                        <strong>Who pays for the funeral?</strong>
                        <p>The funeral is a "priority debt" of the estate. If family pays out of pocket, they are entitled to be reimbursed by the estate assets before anyone else inherits.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">You don't have to do this alone.</h2>
                <p className="text-slate-400 mb-8">
                    ExpectedEstate was built by people who have been exactly where you are. We've turned the complex legal maze into a clear, supportive roadmap.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Start Your Roadmap
                    </a>
                    <a href="/executor-checklist" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        Full Executor Checklist
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
