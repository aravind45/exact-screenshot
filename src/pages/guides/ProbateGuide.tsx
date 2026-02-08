import React from "react";
import { PillarContentTemplate } from "@/components/PillarContentTemplate";
import { SEO } from "@/components/SEO";

const ProbateGuide = () => {
    const guideData = {
        title: "Complete Guide to Settling an Estate (2026)",
        description: "A step-by-step roadmap for executors navigating the probate process, including timelines, form guides, and asset tracking tips.",
        category: "State Probate Guides",
        publishDate: "January 30, 2026",
        readTime: "12 min",
        author: {
            name: "The ExpectedEstate Team",
            role: "Estate Settlement Experts",
            bio: "Our team of legal tech specialists has helped over 10,000 families simplify the probate process across the United States."
        },
        expertReviewer: {
            name: "Expert Legal Panel",
            role: "Compliance Review"
        },
        faqs: [
            {
                question: "How long does probate take?",
                answer: "Probate typically takes between 12 to 18 months, depending on the complexity of the estate and court backlog."
            },
            {
                question: "What is the small estate limit in CA?",
                answer: "For deaths after April 1, 2022, the limit for a small estate affidavit (Section 13100) is $184,500."
            }
        ],
        steps: [
            { name: "File DE-111", text: "Submit the Petition for Probate to start the court process." },
            { name: "Notify Creditors", text: "Use form DE-121 to alert known creditors and the general public." },
            { name: "Inventory Assets", text: "File DE-160 within 4 months of being appointed executor." }
        ]
    };

    return (
        <div className="min-h-screen">
            <SEO
                title={guideData.title}
                description={guideData.description}
                canonical="https://expectedestate.com/guides/probate"
                ogType="article"
            />
            <PillarContentTemplate {...guideData}>
                <section>
                    <h2>Introduction to Probate</h2>
                    <p>
                        Settling a loved one's estate can be a daunting task. Between complex forms and strict court timelines, many executors feel overwhelmed. This guide simplifies the process into actionable steps.
                    </p>

                    <h3>1. Filing the Initial Petition</h3>
                    <p>
                        The first step is filing form <strong>DE-111</strong>. This officially requests that the court appoint you as the personal representative of the estate.
                    </p>

                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 my-8">
                        <h4 className="text-primary font-bold mt-0">Pro Tip:</h4>
                        <p className="mb-0 text-sm">
                            Always double-check the Decedent's residence county. You must file the petition in the Superior Court of the county where the decedent resided at the time of death.
                        </p>
                    </div>

                    <h3>2. Inventory and Appraisal</h3>
                    <p>
                        Once appointed, you have 4 months to file the <strong>Inventory and Appraisal (DE-160)</strong>. This document lists every asset owned by the decedent and its value as of the date of death.
                    </p>

                    <h3>3. Final Distribution</h3>
                    <p>
                        After debts are paid and taxes are filed, you'll submit a Petition for Final Distribution. This is the last major step before assets are transferred to the heirs.
                    </p>
                </section>
            </PillarContentTemplate>
        </div>
    );
};

export default ProbateGuide;
