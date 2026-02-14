import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function LifeInsuranceClaim() {
    const toc = [
        { id: "claim-basics", label: "Life Insurance Claim Basics" },
        { id: "required-docs", label: "Documentation Checklist" },
        { id: "probate-vs-non", label: "Bypassing Probate" },
        { id: "payout-options", label: "Lump Sum vs. Annuity" },
        { id: "taxation", label: "Is Life Insurance Taxable?" },
        { id: "faq", label: "Life Insurance FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to File a Life Insurance Claim",
        "description": "A step-by-step guide for beneficiaries to successfully claim life insurance benefits and understand payout options.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Identify the Policy",
                "text": "Locate the paper policy or check bank records for premium payments to identify the insurance company."
            },
            {
                "@type": "HowToStep",
                "name": "Submit the Claim Form",
                "text": "Complete the 'Statement of Claim' provided by the insurance company and attach an original certified death certificate."
            }
        ]
    };

    return (
        <PillarPageLayout
            category="Non-Probate Assets"
            heroTitle="Life Insurance Claims: A Guide for Beneficiaries"
            heroSubtitle="Life insurance is designed to provide immediate support after a loss. Learn how to navigate the claim process and receive benefits without the probate wait."
            toc={toc}
        >
            <SEO
                title="Life Insurance Claim Process: Step-by-Step for Beneficiaries | ExpectedEstate"
                description="Learn how to file a life insurance claim. Covers necessary documents, payout timelines, tax implications, and why life insurance usually bypasses probate."
                ogTitle="Filing a Life Insurance Claim: The Complete 2026 Guide"
                structuredData={structuredData}
            />

            <section id="claim-basics">
                <h2>Life Insurance Claim Basics</h2>
                <p>
                    Life insurance is one of the most important components of an estate because it typically passes <strong>outside of probate</strong>. This means the money goes directly to the named beneficiaries without waiting for court approval or paying executor fees.
                </p>
                <p>
                    While the process is generally faster than probate, insurance companies still have strict verification requirements. For a broad look at all immediate actions, see our <a href="/what-to-do-when-someone-dies">What to Do After Death</a> guide.
                </p>
            </section>

            <section id="required-docs">
                <h2>Documentation Checklist</h2>
                <p>
                    To process a claim, most insurance companies require the following:
                </p>
                <ul>
                    <li><strong>Claimant Statement:</strong> A form where you identify yourself and provide payment instructions.</li>
                    <li><strong>Death Certificate:</strong> A certified original copy (not a photocopy).</li>
                    <li><strong>The Policy Document:</strong> If you can't find the original policy, you can still file a claim if you can provide the policy number.</li>
                    <li><strong>Proof of Identity:</strong> A copy of your driver's license or passport.</li>
                </ul>
            </section>

            <section id="probate-vs-non">
                <h2>Bypassing Probate</h2>
                <p>
                    Life insurance only bypasses probate if you have <strong>valid named beneficiaries</strong>.
                </p>
                <h3>Named Beneficiaries</h3>
                <p>
                    If "John Doe" is named as the beneficiary, the insurance company pays John Doe directly. This is a non-probate transfer.
                </p>
                <h3>The Estate as Beneficiary</h3>
                <p>
                    If the beneficiary is named as "The Estate of the Deceased," or if all named beneficiaries have already passed away, the proceeds <strong>must go through probate</strong>. This means the money will be subject to creditor claims and court delays.
                </p>
                <p>To learn more about court requirements, visit our <a href="/probate-process">Probate Process Overview</a>.</p>
            </section>

            <section id="payout-options">
                <h2>Lump Sum vs. Annuity</h2>
                <p>
                    Insurance companies often offer several ways to receive the death benefit:
                </p>
                <ul>
                    <li><strong>Lump Sum:</strong> You receive the entire benefit in one tax-free payment. This is the most common choice.</li>
                    <li><strong>Retained Asset Account:</strong> The money stays with the insurer in an interest-bearing account, and you can write checks against it.</li>
                    <li><strong>Life Income / Annuity:</strong> You receive a guaranteed stream of payments for a set period or for the rest of your life.</li>
                </ul>
            </section>

            <section id="taxation">
                <h2>Is Life Insurance Taxable?</h2>
                <p>
                    In almost all cases, <strong>life insurance proceeds are NOT subject to income tax.</strong>
                </p>
                <p>
                    However, there is a catch: <strong>Estate Tax</strong>. While the beneficiary doesn't pay income tax on the payout, the total value of the payout is included in the deceased's "gross estate" for federal estate tax purposes if they were the owner of the policy.
                </p>
            </section>

            <section id="faq">
                <h2>Life Insurance FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>How long does it take to get a life insurance payout?</strong>
                        <p>Most companies pay within 30 to 60 days of receiving a completed claim and death certificate. If the death occurred within the "contestability period" (usually the first two years of the policy), the investigation may take longer.</p>
                    </div>
                    <div>
                        <strong>Can creditors take life insurance money?</strong>
                        <p>If the money is paid to a named beneficiary, it is generally protected from the deceased's creditors. However, if the money goes to the estate, it can be used to pay off debts.</p>
                    </div>
                    <div>
                        <strong>What if the policy is lost?</strong>
                        <p>You can search the <a href="https://eapps.naic.org/mi_h_ols/ols.jsp" target="_blank" rel="noopener noreferrer">NAIC Life Insurance Policy Locator</a> to find lost policies across the United States.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Coordinate your payouts.</h2>
                <p className="text-slate-400 mb-8">
                    ExpectedEstate helps you track which assets have been claimed and which are still pending, giving you a real-time view of the estate's liquidity.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Get Started Free
                    </a>
                    <a href="/executor-checklist" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        Full Executor Checklist
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
