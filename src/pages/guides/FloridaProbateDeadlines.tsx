import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, CheckCircle, ArrowRight, Scale } from "lucide-react";

const deadlines = [
  {
    id: 1,
    title: "File Petition for Administration / Deposit the Will",
    days: "Within 10 days of learning of the death (will deposit); probate petition as soon as possible",
    anchor: "Date of Death",
    priority: "critical",
    statute: "Fla. Stat. § 733.202; § 732.901",
    consequence: "Florida law requires the person holding the original will to deposit it with the circuit court within 10 days of learning of death. Failure is a misdemeanor.",
    details: "Anyone holding the decedent's will must deposit it with the clerk of the circuit court in the county of the decedent's domicile within 10 days of learning of the death. Separately, file a petition for administration to open probate. Florida courts process formal administration petitions relatively quickly."
  },
  {
    id: 2,
    title: "Serve Notice of Administration on Interested Persons",
    days: "Within 3 months of first publication of notice to creditors",
    anchor: "Letters of Administration Date",
    priority: "critical",
    statute: "Fla. Stat. § 733.212",
    consequence: "Failure to serve notice extends the period for interested persons to challenge the will or administration — creating unlimited liability exposure for the personal representative.",
    details: "After being appointed, you must serve a Notice of Administration on the surviving spouse, all beneficiaries, the trustee of any trust receiving estate assets, and any persons who are adversely affected by the will. Service must be by formal notice."
  },
  {
    id: 3,
    title: "Publish Notice to Creditors",
    days: "As soon as possible after appointment; creditor period runs from first publication",
    anchor: "Letters of Administration Date",
    priority: "critical",
    statute: "Fla. Stat. § 733.2121",
    consequence: "Without publication, the creditor claim period never starts. All estate assets remain at risk from future claims.",
    details: "Publish a notice to creditors in a newspaper of general circulation in the county where probate is pending. Must run once a week for 2 consecutive weeks. Also mail actual notice to all known creditors within 3 months of first publication."
  },
  {
    id: 4,
    title: "Creditor Claim Period Closes (Known Creditors)",
    days: "30 days after mailing actual notice to known creditors",
    anchor: "Date of Mailing Notice",
    priority: "high",
    statute: "Fla. Stat. § 733.702",
    consequence: "Claims filed after the deadline are generally barred. Do NOT distribute assets until this period has expired for all known creditors.",
    details: "Known creditors (those whose names you can identify through reasonable diligence) must receive actual written notice and have 30 days from mailing to file a claim. Unknown creditors have 3 months from first publication date."
  },
  {
    id: 5,
    title: "Creditor Claim Period Closes (Unknown Creditors)",
    days: "3 months after first publication of notice to creditors",
    anchor: "First Publication Date",
    priority: "high",
    statute: "Fla. Stat. § 733.702",
    consequence: "After 3 months from publication, unknown creditors are barred. However, serving known creditors resets their clock to 30 days from mailing.",
    details: "This is the absolute outer boundary for creditor claims from unknown creditors. Once this period expires, you may begin paying validated claims and eventually distribute estate assets to beneficiaries."
  },
  {
    id: 6,
    title: "File Inventory of Estate Assets",
    days: "Within 60 days of appointment as personal representative",
    anchor: "Letters of Administration Date",
    priority: "critical",
    statute: "Fla. Stat. § 733.604",
    consequence: "Failure to file inventory on time can result in surcharge (financial penalty) against the personal representative and court-ordered removal.",
    details: "List all probate assets with their fair market values as of the date of death. Include real property, bank accounts, investments, vehicles, and tangible personal property. File with the court and serve copies on all interested persons."
  },
  {
    id: 7,
    title: "File Decedent's Final Federal Income Tax Return (Form 1040)",
    days: "April 15 of the year following death",
    anchor: "Date of Death",
    priority: "high",
    statute: "IRC § 6072",
    consequence: "Penalties and interest accrue on unpaid taxes. Personal representative is personally liable if estate assets are distributed before paying federal taxes.",
    details: "File Form 1040 for income earned through the date of death. File Form 1041 (Fiduciary Income Tax) for income earned by the estate after death (if the estate earns more than $600/year). Florida has no state income tax."
  },
  {
    id: 8,
    title: "File Federal Estate Tax Return (Form 706) — If Required",
    days: "9 months after date of death",
    anchor: "Date of Death",
    priority: "high",
    statute: "IRC § 6075(a)",
    consequence: "Penalties of 5% per month (up to 25%) on unpaid estate taxes. Personal representative personally liable.",
    details: "Required if gross estate exceeds the federal exemption ($13.61M in 2024). Florida has no state estate tax. 6-month extension available via Form 4768, but taxes owed are still due 9 months after death."
  },
  {
    id: 9,
    title: "Elective Share Claim by Surviving Spouse",
    days: "Within 6 months after service of notice of administration, or 2 years after death — whichever is earlier",
    anchor: "Date of Service of Notice of Administration",
    priority: "high",
    statute: "Fla. Stat. § 732.2135",
    consequence: "If the surviving spouse doesn't file an election within this period, the right to the elective share is permanently waived.",
    details: "Florida's elective share gives a surviving spouse 30% of the elective estate (which includes many non-probate assets). If the will doesn't provide at least this amount, the spouse may elect against the will. This deadline is strict and non-waivable."
  },
  {
    id: 10,
    title: "Petition for Summary Administration (Small Estates — Alternative)",
    days: "Any time if estate qualifies",
    anchor: "Date of Death",
    priority: "medium",
    statute: "Fla. Stat. § 735.201",
    consequence: "If probate assets don't exceed $75,000 (excluding exempt property) or if decedent has been dead 2+ years, summary administration may be available — a much faster, cheaper process.",
    details: "Florida's summary administration is available for estates where the value of non-exempt probate assets doesn't exceed $75,000, OR where the decedent has been dead for 2 or more years. No personal representative is appointed; assets transfer via court order."
  },
  {
    id: 11,
    title: "File Petition for Discharge and Close the Estate",
    days: "After all debts, taxes, and expenses paid; assets distributed",
    anchor: "Completion of Administration",
    priority: "medium",
    statute: "Fla. Stat. § 733.901",
    consequence: "Remaining open as personal representative creates ongoing fiduciary liability. File for formal discharge to terminate your duties.",
    details: "After paying all creditors, taxes, and expenses, and distributing assets to beneficiaries, file a Petition for Discharge. Serve all interested persons. The court will enter an Order of Discharge, formally closing the estate and releasing you from further liability."
  }
];

const priorityColor: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-700",
  high: "bg-amber-50 border-amber-200 text-amber-700",
  medium: "bg-blue-50 border-blue-200 text-blue-700",
};
const priorityLabel: Record<string, string> = {
  critical: "Critical",
  high: "High Priority",
  medium: "Important",
};

const faqs = [
  {
    q: "How long does probate take in Florida?",
    a: "Florida formal administration typically takes 6 months to 2 years. The minimum is about 5–6 months because creditors have 3 months from first publication to file claims, and additional time is needed to pay debts, file taxes, and obtain court approval for distribution. Simple estates with no disputes can close in 6–9 months. Complex estates with litigation, real estate sales, or tax issues can take 2+ years."
  },
  {
    q: "What assets avoid probate in Florida?",
    a: "Assets that typically avoid Florida probate include: joint tenancy property (passes to survivor), assets with beneficiary designations (life insurance, IRAs, 401(k)s, payable-on-death bank accounts), assets held in a revocable living trust, and Florida homestead property (subject to special rules). Only assets titled solely in the decedent's name without beneficiary designations go through probate."
  },
  {
    q: "Does Florida have an estate tax or inheritance tax?",
    a: "No. Florida has neither a state estate tax nor a state inheritance tax. Beneficiaries receiving assets from a Florida estate owe no Florida tax. However, the federal estate tax applies to estates exceeding the federal exemption ($13.61 million per individual in 2024), and the federal estate tax return (Form 706) is due 9 months after death."
  },
  {
    q: "What is Florida summary administration?",
    a: "Florida summary administration is a simplified, faster probate process available when: (1) the value of probate assets (excluding exempt property) doesn't exceed $75,000, OR (2) the decedent has been dead for 2 or more years. No personal representative is appointed. Instead, the court enters an Order of Summary Administration directing financial institutions and others to transfer assets to the appropriate parties. It typically takes 2–4 months."
  },
  {
    q: "Can I avoid probate in Florida with a living trust?",
    a: "Yes. A revocable living trust is the most common tool for avoiding Florida probate entirely. Assets transferred into the trust during life pass to beneficiaries through the trust document — no court involvement needed. This is especially valuable in Florida because the probate process is court-supervised, time-consuming, and all court filings are public record. Many Florida estate planning attorneys recommend living trusts as the default plan."
  }
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Florida Probate Deadlines: Complete Timeline for Personal Representatives (2024)",
      "description": "All critical Florida probate deadlines with Florida Statutes citations. Inventory filing, creditor periods, notice requirements, and tax deadlines.",
      "author": { "@type": "Organization", "name": "ExpectedEstate" },
      "publisher": { "@type": "Organization", "name": "ExpectedEstate", "url": "https://www.expectedestate.com" },
      "datePublished": "2026-02-18",
      "dateModified": "2026-02-18",
      "url": "https://www.expectedestate.com/guides/florida-probate-deadlines",
      "mainEntityOfPage": "https://www.expectedestate.com/guides/florida-probate-deadlines"
    },
    {
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    },
    {
      "@type": "HowTo",
      "name": "How to Administer a Florida Probate Estate",
      "description": "Step-by-step guide to Florida formal administration with deadlines and statute citations.",
      "step": deadlines.map((d, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": d.title,
        "text": `${d.days}. ${d.details}`,
        "url": `https://www.expectedestate.com/guides/florida-probate-deadlines#step-${d.id}`
      }))
    }
  ]
};

export default function FloridaProbateDeadlines() {
  return (
    <>
      <Helmet>
        <title>Florida Probate Deadlines 2024: Complete Timeline for Personal Representatives | ExpectedEstate</title>
        <meta name="description" content="All Florida probate deadlines: 60-day inventory, creditor claim periods, notice to creditors requirements, elective share deadline, and federal tax deadlines. Florida Statutes cited." />
        <link rel="canonical" href="https://www.expectedestate.com/guides/florida-probate-deadlines" />
        <meta property="og:title" content="Florida Probate Deadlines 2024 — Complete Personal Representative Timeline" />
        <meta property="og:description" content="Every critical Florida probate deadline with statute citations. Miss one and face personal liability or court removal." />
        <meta property="og:url" content="https://www.expectedestate.com/guides/florida-probate-deadlines" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link to="/" className="text-lg font-bold text-indigo-600">ExpectedEstate</Link>
            <div className="flex items-center gap-3">
              <Link to="/auth" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link to="/auth?mode=signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Start Free
              </Link>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">›</span>
            <Link to="/guides/probate" className="hover:text-gray-700">Probate Guides</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Florida Probate Deadlines</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Florida-Specific</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Updated Feb 2026</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
              Florida Probate Deadlines:<br />Complete Personal Representative Timeline (2024)
            </h1>
            <p className="text-xl text-gray-600">
              Florida formal administration is fully court-supervised with strict filing deadlines.
              Here are all 11 critical windows with Florida Statutes citations for personal representatives.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Scale className="h-4 w-4" /> Florida Statutes</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 11 Key Deadlines</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Summary Administration Guide</span>
            </div>
          </header>

          {/* Warning banner */}
          <div className="mb-10 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Florida Probate is Fully Court-Supervised — Every Deadline Matters</p>
              <p className="mt-1 text-sm text-amber-800">
                Unlike Texas's independent administration, Florida formal administration requires court approval
                for most major actions. Missing deadlines can result in surcharges, removal as personal
                representative, or personal liability for estate losses.
              </p>
            </div>
          </div>

          {/* Quick reference */}
          <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Quick Reference — Anchor Dates</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { label: "Date of Death", items: ["Deposit will with court: 10 days", "Fed. income tax: April 15", "Fed. estate tax: 9 months"] },
                { label: "Letters of Administration Date", items: ["Serve notice of administration: promptly", "Publish creditor notice: promptly", "File inventory: 60 days"] },
                { label: "First Publication Date", items: ["Unknown creditor claims bar: 3 months"] },
                { label: "Known Creditor Mailing Date", items: ["Known creditor claims bar: 30 days"] },
              ].map(g => (
                <div key={g.label} className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="mb-1 text-xs font-bold uppercase text-gray-500">{g.label}</p>
                  {g.items.map(i => <p key={i} className="text-sm text-gray-700">• {i}</p>)}
                </div>
              ))}
            </div>
          </div>

          {/* Deadline cards */}
          <section className="mb-12 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">All Florida Probate Deadlines</h2>
            {deadlines.map(d => (
              <article
                key={d.id}
                id={`step-${d.id}`}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{d.id}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{d.title}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${priorityColor[d.priority]}`}>
                    {priorityLabel[d.priority]}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 font-medium text-indigo-700">
                    <Clock className="h-4 w-4" /> {d.days}
                  </span>
                  <span className="text-gray-500">Anchor: {d.anchor}</span>
                  <span className="font-mono text-xs text-gray-400">{d.statute}</span>
                </div>
                <p className="mb-3 text-gray-700">{d.details}</p>
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700"><span className="font-semibold">If you miss this:</span> {d.consequence}</p>
                </div>
              </article>
            ))}
          </section>

          {/* Mid-page CTA */}
          <div className="mb-12 rounded-2xl bg-indigo-600 p-8 text-center text-white">
            <h2 className="mb-2 text-2xl font-bold">Track Every Florida Deadline Automatically</h2>
            <p className="mb-6 text-indigo-200">ExpectedEstate calculates your deadlines based on the date of death and sends you reminders before each one.</p>
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Start Free — No Credit Card <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Florida Probate FAQ</h2>
            <div className="space-y-3">
              {faqs.map(f => (
                <details key={f.q} className="group rounded-xl border border-gray-200 bg-white">
                  <summary className="cursor-pointer px-5 py-4 font-semibold text-gray-900 list-none flex justify-between items-center">
                    {f.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="border-t border-gray-100 px-5 py-4 text-gray-700">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Legal Disclaimer */}
          <div className="mb-8 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Legal Disclaimer</p>
            <p>This guide is for general informational purposes only and does not constitute legal advice. Florida probate law is complex and fact-specific. Consult a licensed Florida estate attorney for guidance on your specific situation. Deadlines and statutes are based on Florida law as of early 2026.</p>
          </div>

          {/* Related links */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Related Guides</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/probate-florida" className="text-sm text-indigo-600 hover:underline">→ Florida Probate Process Overview</Link>
              <Link to="/guides/california-probate-deadlines" className="text-sm text-indigo-600 hover:underline">→ California Probate Deadlines</Link>
              <Link to="/guides/texas-probate-deadlines" className="text-sm text-indigo-600 hover:underline">→ Texas Probate Deadlines</Link>
              <Link to="/executor-checklist" className="text-sm text-indigo-600 hover:underline">→ Executor Checklist</Link>
              <Link to="/probate-cost" className="text-sm text-indigo-600 hover:underline">→ How Much Does Probate Cost?</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
