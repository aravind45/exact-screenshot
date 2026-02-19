import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, CheckCircle, ArrowRight, Scale } from "lucide-react";

const deadlines = [
  {
    id: 1,
    title: "File Application to Probate the Will",
    days: "Within 4 years of death",
    anchor: "Date of Death",
    priority: "critical",
    statute: "Tex. Est. Code § 256.003",
    consequence: "After 4 years, the will can only be admitted as a muniment of title. You lose the ability to be appointed as independent executor.",
    details: "Texas has a strict 4-year deadline to admit a will to probate. However, don't wait — courts prefer applications filed within months of death. If you miss this window, you lose the standard probate path entirely."
  },
  {
    id: 2,
    title: "Qualify as Executor / Post Bond (if required)",
    days: "At time of appointment (typically 30–60 days after filing)",
    anchor: "Court Appointment Date",
    priority: "critical",
    statute: "Tex. Est. Code § 305.001",
    consequence: "Failure to qualify or post bond results in the court revoking letters testamentary.",
    details: "Once the court appoints you, you must take the executor oath and, if the will doesn't waive bond, post a surety bond within the court's deadline. Most modern wills waive bond for named executors."
  },
  {
    id: 3,
    title: "Notify Beneficiaries of Probate",
    days: "Within 30 days of qualifying as executor",
    anchor: "Qualification Date",
    priority: "critical",
    statute: "Tex. Est. Code § 308.002",
    consequence: "Failure to notify beneficiaries can result in personal liability and delays in closing the estate.",
    details: "You must send each beneficiary named in the will a written notice stating that the will has been admitted to probate. This can be done by certified mail or personal delivery."
  },
  {
    id: 4,
    title: "Publish Notice to Creditors",
    days: "Within 30 days of qualifying",
    anchor: "Qualification Date",
    priority: "high",
    statute: "Tex. Est. Code § 308.051",
    consequence: "Without proper publication, the creditor claim period doesn't start running, exposing the estate to claims indefinitely.",
    details: "Post a notice to creditors in a newspaper of general circulation in the county where letters were issued. The notice must run for one week and must include your name, address, and the court information."
  },
  {
    id: 5,
    title: "Creditor Claim Period Closes",
    days: "4 months after publication of notice to creditors",
    anchor: "Publication Date",
    priority: "high",
    statute: "Tex. Est. Code § 355.060",
    consequence: "Claims presented after this period are generally barred. Do not distribute estate assets before this period ends.",
    details: "General creditors must present their claims within 4 months of published notice (or 90 days of receiving actual notice). Secured creditors may have different rights. Validate all claims before paying."
  },
  {
    id: 6,
    title: "File Inventory, Appraisement, and List of Claims",
    days: "Within 90 days of qualifying as executor",
    anchor: "Qualification Date",
    priority: "critical",
    statute: "Tex. Est. Code § 309.051",
    consequence: "Failure to file may result in removal as executor. The court can also hold you in contempt.",
    details: "List all estate property with appraised values as of the date of death, plus all claims the estate has against others. For independent administrations, an Affidavit in Lieu of Inventory may be filed if all beneficiaries agree in writing."
  },
  {
    id: 7,
    title: "File Decedent's Final Federal Income Tax Return",
    days: "April 15 of the year following death",
    anchor: "Date of Death",
    priority: "high",
    statute: "IRC § 6072",
    consequence: "Penalties and interest accrue on unpaid taxes. The executor is personally liable if estate assets are distributed before paying federal taxes.",
    details: "File Form 1040 for the year of death. File Form 1041 for any income earned by the estate after death. Request a 6-month extension if needed (Form 4868), but taxes owed are still due April 15."
  },
  {
    id: 8,
    title: "File Federal Estate Tax Return (Form 706) — If Required",
    days: "9 months after date of death",
    anchor: "Date of Death",
    priority: "high",
    statute: "IRC § 6075(a)",
    consequence: "Penalties of 5% per month (up to 25%) on unpaid estate taxes. Executor personally liable.",
    details: "Required only if gross estate exceeds the federal exemption ($13.61M in 2024). Texas has no state estate or inheritance tax, so federal is the only concern. 6-month extension available via Form 4768, but taxes owed are still due at 9 months."
  },
  {
    id: 9,
    title: "Independent Administration Accounting (if required)",
    days: "As directed by court or beneficiaries",
    anchor: "Court Order or Beneficiary Demand",
    priority: "medium",
    statute: "Tex. Est. Code § 404.001",
    consequence: "Beneficiaries may petition the court for an accounting if you fail to provide one upon written demand.",
    details: "Texas independent executors generally don't need court approval for most actions, but must provide an accounting to beneficiaries upon written request. Keep meticulous records of all receipts and disbursements."
  },
  {
    id: 10,
    title: "Muniment of Title (alternative — no administration needed)",
    days: "Any time within 4 years of death if no debts exist",
    anchor: "Date of Death",
    priority: "medium",
    statute: "Tex. Est. Code § 257.001",
    consequence: "Misuse of muniment of title (e.g., when estate has unpaid debts) can create legal exposure for heirs.",
    details: "If the estate has no unpaid debts (other than liens on real property) and no need for an administration, heirs can admit the will as a muniment of title only — a faster, cheaper process that transfers real property without a full probate."
  },
  {
    id: 11,
    title: "Close the Estate and Discharge Executor",
    days: "After all debts paid and assets distributed",
    anchor: "Completion of Administration",
    priority: "medium",
    statute: "Tex. Est. Code § 405.003",
    consequence: "Remaining open as executor creates ongoing fiduciary liability. Close the estate formally to terminate your duties.",
    details: "File a final accounting or closing report with the court (if dependent administration). Distribute remaining assets to beneficiaries. Obtain receipts. File the closing document and receive a discharge order."
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
    q: "How long do you have to probate a will in Texas?",
    a: "Texas law requires a will to be filed for probate within 4 years of the decedent's death (Tex. Est. Code § 256.003). After 4 years, the will may only be admitted as a muniment of title, which has limitations. Courts strongly prefer applications filed promptly — ideally within a few months of death."
  },
  {
    q: "What happens if you don't probate a will in Texas?",
    a: "If you miss the 4-year window entirely, the estate is treated as if the person died intestate (without a will), and assets pass under Texas's intestacy laws. Property may also become difficult or impossible to transfer without probate, creating title problems for real estate."
  },
  {
    q: "Does Texas have an estate tax?",
    a: "No. Texas does not have a state estate tax or inheritance tax. However, large estates may still be subject to the federal estate tax if the gross estate exceeds the federal exemption ($13.61 million per individual in 2024). The federal estate tax return (Form 706) is due 9 months after death."
  },
  {
    q: "What is an independent administration in Texas?",
    a: "Texas's independent administration is one of the most executor-friendly probate processes in the country. If the will authorizes it (or all heirs agree), the executor can manage and distribute the estate without routine court supervision — no court approval needed for most actions. This makes Texas probate significantly faster and cheaper than most states."
  },
  {
    q: "What is a muniment of title in Texas?",
    a: "A muniment of title is a simplified Texas probate alternative where the court admits the will to probate without appointing an executor. It's used when the estate has no unpaid debts (other than liens on real property). It's primarily used to transfer real estate title to heirs quickly and cheaply. It cannot be used to collect debts owed to the estate or manage ongoing estate affairs."
  }
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Texas Probate Deadlines: Complete Timeline for Executors (2024)",
      "description": "All critical Texas probate deadlines with Texas Estate Code citations. Filing windows, creditor periods, tax deadlines, and inventory requirements.",
      "author": { "@type": "Organization", "name": "ExpectedEstate" },
      "publisher": { "@type": "Organization", "name": "ExpectedEstate", "url": "https://www.expectedestate.com" },
      "datePublished": "2026-02-18",
      "dateModified": "2026-02-18",
      "url": "https://www.expectedestate.com/guides/texas-probate-deadlines",
      "mainEntityOfPage": "https://www.expectedestate.com/guides/texas-probate-deadlines"
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
      "name": "How to Probate a Will in Texas",
      "description": "Step-by-step guide to Texas probate with deadlines and statute citations.",
      "step": deadlines.map((d, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": d.title,
        "text": `${d.days}. ${d.details}`,
        "url": `https://www.expectedestate.com/guides/texas-probate-deadlines#step-${d.id}`
      }))
    }
  ]
};

export default function TexasProbateDeadlines() {
  return (
    <>
      <Helmet>
        <title>Texas Probate Deadlines 2024: Complete Timeline for Executors | ExpectedEstate</title>
        <meta name="description" content="All Texas probate deadlines in one place: 4-year will filing window, 90-day inventory, creditor claim period, federal tax deadlines. Texas Estate Code citations included." />
        <link rel="canonical" href="https://www.expectedestate.com/guides/texas-probate-deadlines" />
        <meta property="og:title" content="Texas Probate Deadlines 2024 — Complete Executor Timeline" />
        <meta property="og:description" content="Every critical Texas probate deadline with statute citations. Miss one and face personal liability." />
        <meta property="og:url" content="https://www.expectedestate.com/guides/texas-probate-deadlines" />
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
            <span className="text-gray-900">Texas Probate Deadlines</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Texas-Specific</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Updated Feb 2026</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
              Texas Probate Deadlines:<br />Complete Executor Timeline (2024)
            </h1>
            <p className="text-xl text-gray-600">
              Texas is one of the most executor-friendly probate states — but only if you hit the right deadlines.
              Here are all 11 critical windows with Texas Estate Code citations.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Scale className="h-4 w-4" /> Texas Estate Code</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 11 Key Deadlines</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Independent Administration Guide</span>
            </div>
          </header>

          {/* Warning banner */}
          <div className="mb-10 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Texas's 4-Year Will Filing Deadline is Absolute</p>
              <p className="mt-1 text-sm text-amber-800">
                Unlike most states where the probate window is shorter, Texas gives executors 4 years —
                but after that window closes, the standard probate path is permanently unavailable.
                Do not confuse "more time" with "no urgency."
              </p>
            </div>
          </div>

          {/* Quick anchor links */}
          <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Quick Reference — Anchor Dates</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { label: "Date of Death", items: ["File will within 4 years", "Fed. income tax: April 15", "Fed. estate tax: 9 months"] },
                { label: "Qualification Date", items: ["Notify beneficiaries: 30 days", "Publish creditor notice: 30 days", "File inventory: 90 days"] },
                { label: "Publication Date", items: ["Creditor claim period closes: 4 months"] },
                { label: "Federal Deadlines", items: ["Form 1040: April 15 (year after death)", "Form 706: 9 months after death"] },
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
            <h2 className="text-2xl font-bold text-gray-900">All Texas Probate Deadlines</h2>
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
            <h2 className="mb-2 text-2xl font-bold">Track Every Texas Deadline Automatically</h2>
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
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Texas Probate FAQ</h2>
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
            <p>This guide is for general informational purposes only and does not constitute legal advice. Texas probate law is complex and fact-specific. Consult a licensed Texas estate attorney for guidance on your specific situation. Deadlines and statutes are based on Texas law as of early 2026.</p>
          </div>

          {/* Related links */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Related Guides</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/probate-texas" className="text-sm text-indigo-600 hover:underline">→ Texas Probate Process Overview</Link>
              <Link to="/guides/california-probate-deadlines" className="text-sm text-indigo-600 hover:underline">→ California Probate Deadlines</Link>
              <Link to="/executor-checklist" className="text-sm text-indigo-600 hover:underline">→ Executor Checklist</Link>
              <Link to="/probate-cost" className="text-sm text-indigo-600 hover:underline">→ How Much Does Probate Cost?</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
