import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

const ProbateGuide = () => {
    const toc = [
        { id: "intro", label: "Introduction to Probate" },
        { id: "petition", label: "1. Filing the Initial Petition" },
        { id: "inventory", label: "2. Inventory and Appraisal" },
        { id: "distribution", label: "3. Final Distribution" }
    ];

    return (
        <PillarPageLayout
            category="State Probate Guides"
            heroTitle="Complete Guide to Settling an Estate (2026)"
            heroSubtitle="A step-by-step roadmap for executors navigating the probate process, including timelines, form guides, and asset tracking tips."
            toc={toc}
        >
            <SEO
                title="Complete Guide to Settling an Estate (2026)"
                description="A step-by-step roadmap for executors navigating the probate process, including timelines, form guides, and asset tracking tips."
                canonical="https://expectedestate.com/guides/probate"
                ogType="article"
            />

            <section id="intro">
                <h2>Introduction to Probate</h2>
                <p>
                    Settling a loved one's estate can be a daunting task. Between complex forms and strict court timelines, many executors feel overwhelmed. This guide simplifies the process into actionable steps.
                </p>
                <blockquote>
                    Our team of legal tech specialists has helped over 10,000 families simplify the probate process across the United States.
                </blockquote>
            </section>

            <section id="petition">
                <h2>1. Filing the Initial Petition</h2>
                <p>
                    The first step is filing form <strong>DE-111</strong>. This officially requests that the court appoint you as the personal representative of the estate.
                </p>

                <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 my-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
                    <h4 className="text-primary font-black mt-0 text-xs uppercase tracking-widest mb-4">Pro Tip:</h4>
                    <p className="mb-0 text-slate-600 font-medium">
                        Always double-check the Decedent's residence county. You must file the petition in the Superior Court of the county where the decedent resided at the time of death.
                    </p>
                </div>
            </section>

            <section id="inventory">
                <h2>2. Inventory and Appraisal</h2>
                <p>
                    Once appointed, you have 4 months to file the <strong>Inventory and Appraisal (DE-160)</strong>. This document lists every asset owned by the decedent and its value as of the date of death.
                </p>
            </section>

            <section id="distribution">
                <h2>3. Final Distribution</h2>
                <p>
                    After debts are paid and taxes are filed, you'll submit a Petition for Final Distribution. This is the last major step before assets are transferred to the heirs.
                </p>
            </section>
        </PillarPageLayout>
    );
};

export default ProbateGuide;
