import React from "react";
import { PillarPageLayout } from "@/components/layout/PillarPageLayout";
import { SEO } from "@/components/SEO";

export default function IntestateWithoutWill() {
    const toc = [
        { id: "intestate-definition", label: "What is Intestacy?" },
        { id: "who-inherits", label: "Who Inherits? (The Hierarchy)" },
        { id: "probate-process", label: "The Process Without a Will" },
        { id: "administrator-role", label: "Administrator vs. Executor" },
        { id: "common-myths", label: "Intestacy Myths" },
        { id: "faq", label: "Intestate FAQ" }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Died Without a Will: Understanding Intestate Succession",
        "description": "Learn what happens when someone dies without a will. Explore the legal hierarchy of heirs, the court process for administrators, and how state laws determine inheritance.",
        "author": {
            "@type": "Organization",
            "name": "ExpectedEstate"
        }
    };

    return (
        <PillarPageLayout
            category="Edge Cases"
            heroTitle="Died Without a Will: A Guide to Intestate Succession"
            heroSubtitle="When there is no will, the state provides the roadmap. Learn how 'Intestacy' works and who the law says is next in line to inherit."
            toc={toc}
        >
            <SEO
                title="Died Without a Will: What is Intestate Succession? | ExpectedEstate"
                description="A complete guide to dying without a will. Learn the legal hierarchy for heirs, how an administrator is appointed, and how assets are distributed by state law."
                ogTitle="No Will? Here is the Step-by-Step Legal Process"
                structuredData={structuredData}
            />

            <section id="intestate-definition">
                <h2>What is Intestacy?</h2>
                <p>
                    "Intestate" is the legal term for dying without a valid will. When this happens, the deceased person's property doesn't just go to the state (a common myth). Instead, it's distributed according to the <strong>Intestacy Laws</strong> of the state where they lived.
                </p>
                <p>
                    These laws act as a "one-size-fits-all" will designed by the state legislature. While the intent is to be fair, these laws often don't reflect the specific wishes or family dynamics of the deceased. To see how this fits into the broader legal system, read our <a href="/probate-process">Introduction to Probate</a>.
                </p>
            </section>

            <section id="who-inherits">
                <h2>Who Inherits? (The Hierarchy)</h2>
                <p>
                    While laws vary by state, most follow a similar hierarchy when determining who gets the assets:
                </p>
                <ol>
                    <li><strong>Surviving Spouse:</strong> Usually gets the first share, but may have to split it with children.</li>
                    <li><strong>Children & Descendants:</strong> Inherit if there is no spouse or if the spouse's share is limited.</li>
                    <li><strong>Parents:</strong> Inherit if there are no children or spouse.</li>
                    <li><strong>Siblings:</strong> Inherit if there are no children, spouse, or parents.</li>
                    <li><strong>More Distant Relatives:</strong> Grandparents, aunts, uncles, and cousins.</li>
                </ol>
                <p>
                    <em>Crucial Note: Unmarried partners, step-children (who weren't legally adopted), and close friends usually inherit <strong>nothing</strong> under intestacy laws.</em>
                </p>
            </section>

            <section id="probate-process">
                <h2>The Process Without a Will</h2>
                <p>
                    If there is no will, the estate must still go through the <a href="/probate-process">probate process</a> to clear title to assets. The main difference is that the court, rather than a will, chooses who is in charge.
                </p>
                <ul>
                    <li><strong>Petitoning for Letters:</strong> Instead of "Letters Testamentary," the court issues "Letters of Administration."</li>
                    <li><strong>Bond Requirements:</strong> Without a will to waive it, the court almost always requires the person in charge to pay for an insurance "bond" to protect the heirs.</li>
                    <li><strong>Heirship Hearings:</strong> In many states (like Texas), the court must hold a formal "Judgment Declaring Heirship" to legally prove who the family members are.</li>
                </ul>
            </section>

            <section id="administrator-role">
                <h2>Administrator vs. Executor</h2>
                <p>
                    The person in charge of an intestate estate is called an <strong>Administrator</strong>. Their duties are identical to an <strong>Executor</strong> (who is named in a will). Both are "fiduciaries" with a legal obligation to protect the estate.
                </p>
                <p>
                    For a full list of these duties, check out our <a href="/executor-checklist">Executor & Administrator Checklist</a>.
                </p>
            </section>

            <section id="common-myths">
                <h2>Intestacy Myths</h2>
                <blockquote>
                    "The most common myth is that if you don't have a will, the state takes everything. The state only takes the property (a process called 'escheat') if they cannot find a single living relative within a certain degree of kinship."
                </blockquote>
            </section>

            <section id="faq">
                <h2>Intestate FAQ</h2>
                <div className="space-y-6">
                    <div>
                        <strong>What happens to the house if there is no will?</strong>
                        <p>Title to the house is determined by state law. If there is a surviving spouse, they often have "homestead rights" to stay in the house, even if they share ownership with the children. See our <a href="/probate-florida">Florida Homestead Guide</a> for a detailed example.</p>
                    </div>
                    <div>
                        <strong>Can a will be 'found' later?</strong>
                        <p>Yes. If a valid will is found after an administrator is appointed, the court can "probate" the will and replace the administrator with the named executor.</p>
                    </div>
                    <div>
                        <strong>Do all assets go through intestacy?</strong>
                        <p>No. Just like with a will, assets with named beneficiaries (life insurance, 401ks, joint bank accounts) pass directly to those people regardless of what the state's intestacy law says.</p>
                    </div>
                </div>
            </section>

            <section className="mt-16 p-8 bg-purple-900 rounded-[2.5rem] text-white">
                <h2 className="text-white border-none mt-0">Dealing with a complex family tree?</h2>
                <p className="text-purple-200 mb-8">
                    Intestate estates are prone to disputes. ExpectedEstate provides a transparent, neutral platform for administrators to document their actions and keep all heirs informed.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a href="/auth?mode=signup" className="px-8 py-4 bg-primary rounded-full font-black hover:scale-105 transition-all">
                        Start Organizing
                    </a>
                    <a href="/probate-process" className="px-8 py-4 bg-white/10 rounded-full font-black hover:bg-white/20 transition-all">
                        Full Probate Guide
                    </a>
                </div>
            </section>
        </PillarPageLayout>
    );
}
