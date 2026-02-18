import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Landmark,
  Calendar,
  FileText,
  Scale,
} from "lucide-react";

/**
 * AEO Content Page: California Probate Deadlines
 *
 * Targets:
 *   - "california probate deadlines" (high AEO + Google AI Overview potential)
 *   - "letters testamentary california deadline"
 *   - "how long does probate take california"
 *   - "creditor notice deadline california probate"
 *
 * Structured as direct-answer content for featured snippets and AI tool citations.
 */

const DEADLINES = [
  {
    id: "petition",
    category: "Court Filing",
    title: "File Petition for Probate",
    dayFrom: "ASAP",
    anchor: "Date of Death",
    statutory: "No strict deadline — but advisable within 30 days",
    consequence: "Delay can complicate asset management and expose executor to creditor claims",
    code: "Cal. Prob. Code § 8000",
    priority: "critical",
  },
  {
    id: "notice_heirs",
    category: "Notifications",
    title: "Mail Notice of Petition to Known Heirs & Beneficiaries",
    dayFrom: "15 days before hearing",
    anchor: "Court Hearing Date",
    statutory: "At least 15 days before initial hearing (Cal. Prob. Code § 8110)",
    consequence: "Failure to notify heirs can invalidate probate proceedings",
    code: "Cal. Prob. Code § 8110",
    priority: "critical",
  },
  {
    id: "publish_notice",
    category: "Creditor Notice",
    title: "Publish Notice to Creditors in Newspaper",
    dayFrom: "Within 30 days of appointment",
    anchor: "Letters Issuance Date",
    statutory: "Within 30 days of executor appointment (Cal. Prob. Code § 8120)",
    consequence: "Failure to publish restarts creditor claim window — extends estate administration by months",
    code: "Cal. Prob. Code § 8120",
    priority: "critical",
  },
  {
    id: "creditor_claim_period",
    category: "Creditor Notice",
    title: "Creditor Claim Period Closes",
    dayFrom: "60 days after first publication",
    anchor: "First Publication Date",
    statutory: "4 months from Letters OR 60 days from first publication — whichever is LATER",
    consequence: "Claims filed after this date can be rejected. Do not distribute assets before this period closes.",
    code: "Cal. Prob. Code § 9100",
    priority: "critical",
  },
  {
    id: "mail_creditors",
    category: "Creditor Notice",
    title: "Mail Notice to Known Creditors",
    dayFrom: "Within 30 days of appointment",
    anchor: "Letters Issuance Date",
    statutory: "Within 30 days — executor must mail notice to creditors they know about",
    consequence: "Known creditors who don't receive notice retain right to file claims even after publication period closes",
    code: "Cal. Prob. Code § 9050",
    priority: "critical",
  },
  {
    id: "inventory",
    category: "Estate Administration",
    title: "File Inventory & Appraisal (Form DE-160)",
    dayFrom: "Within 4 months of appointment",
    anchor: "Letters Issuance Date",
    statutory: "4 months from issuance of Letters Testamentary",
    consequence: "Overdue inventory can trigger court sanctions and delay estate closing by 6+ months",
    code: "Cal. Prob. Code § 8800",
    priority: "high",
  },
  {
    id: "tax_return",
    category: "Taxes",
    title: "File Decedent's Final Income Tax Return (Form 1040)",
    dayFrom: "April 15 of year after death",
    anchor: "Date of Death",
    statutory: "April 15 following year of death (IRS 26 U.S.C. § 6012)",
    consequence: "Failure to file exposes executor to personal liability for IRS penalties and interest",
    code: "26 U.S.C. § 6012",
    priority: "high",
  },
  {
    id: "estate_tax_return",
    category: "Taxes",
    title: "File Estate Income Tax Return (Form 1041) — if applicable",
    dayFrom: "15th day of 4th month after fiscal year end",
    anchor: "Estate Tax Year End",
    statutory: "Required if estate gross income exceeds $600/year. Due 4th month after tax year end.",
    consequence: "Failure to file triggers IRS penalties. Executors can be held personally liable.",
    code: "26 U.S.C. § 6072",
    priority: "high",
  },
  {
    id: "federal_estate_tax",
    category: "Taxes",
    title: "File Federal Estate Tax Return (Form 706) — if applicable",
    dayFrom: "9 months after date of death",
    anchor: "Date of Death",
    statutory: "9 months from date of death. 6-month extension available by filing Form 4768.",
    consequence: "Estates over $13.61M (2024) must file. Failure triggers IRS interest and penalties.",
    code: "26 U.S.C. § 6075",
    priority: "high",
  },
  {
    id: "petition_final",
    category: "Court Filing",
    title: "Petition for Final Distribution",
    dayFrom: "After creditor period closes + debts paid",
    anchor: "Creditor Period Close",
    statutory: "No fixed deadline — but court expects timely administration (usually 1–2 years)",
    consequence: "Unreasonable delays can result in court surcharges against the executor",
    code: "Cal. Prob. Code § 12200",
    priority: "medium",
  },
  {
    id: "accounting",
    category: "Accounting",
    title: "File Final Accounting with Court",
    dayFrom: "Before petition for distribution",
    anchor: "Petition for Distribution",
    statutory: "Required before final distribution unless waived by all beneficiaries",
    consequence: "Distribution without accounting exposes executor to personal liability claims from heirs",
    code: "Cal. Prob. Code § 10900",
    priority: "medium",
  },
];

const priorityConfig = {
  critical: { label: "Critical", color: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  high: { label: "High Priority", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  medium: { label: "Important", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
};

export default function CaliforniaProbateDeadlines() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="California Probate Deadlines: Every Statutory Date Executors Must Know (2024)"
        description="Complete guide to California probate deadlines — creditor notice periods, inventory filing, tax return due dates, and court filing windows. Missing any of these dates can expose you to personal liability."
        canonical="https://www.expectedestate.com/guides/california-probate-deadlines"
        ogTitle="California Probate Deadlines — The Complete Executor's Checklist"
        ogDescription="11 statutory deadlines every California executor must track. Miss one and face personal liability, IRS penalties, or invalid court proceedings."
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "headline": "California Probate Deadlines: Every Statutory Date Executors Must Know",
              "description": "Complete guide to California probate deadlines for executors — creditor notices, inventory, tax returns, and court filing windows.",
              "url": "https://www.expectedestate.com/guides/california-probate-deadlines",
              "publisher": {
                "@type": "Organization",
                "name": "ExpectedEstate",
                "url": "https://www.expectedestate.com",
              },
              "datePublished": "2026-02-18",
              "dateModified": "2026-02-18",
              "author": { "@type": "Organization", "name": "ExpectedEstate Legal Research Team" },
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How long does a creditor have to file a claim in California probate?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In California, creditors have 4 months from the issuance of Letters Testamentary OR 60 days from the date the Notice to Creditors was first published in a newspaper — whichever date is later. This is set by California Probate Code § 9100.",
                  },
                },
                {
                  "@type": "Question",
                  "name": "When must an executor file the estate inventory in California?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A California executor must file the Inventory and Appraisal (Form DE-160) within 4 months of the date Letters Testamentary are issued by the probate court, per California Probate Code § 8800.",
                  },
                },
                {
                  "@type": "Question",
                  "name": "What is the deadline to publish the Notice to Creditors in California?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The executor must publish the Notice of Petition to Administer Estate in a newspaper of general circulation within 30 days of appointment, per California Probate Code § 8120. This publication starts the creditor claim period.",
                  },
                },
                {
                  "@type": "Question",
                  "name": "When is the final income tax return due for a deceased person in California?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The decedent's final Form 1040 is due April 15 of the year following the year of death. If the estate earns more than $600 in income, the executor must also file Form 1041 (Estate Income Tax Return) for the estate's tax year.",
                  },
                },
              ],
            },
            {
              "@type": "HowTo",
              "name": "How to Track California Probate Deadlines as an Executor",
              "description": "A step-by-step guide to managing all probate deadlines in California",
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "File the Petition for Probate",
                  "text": "File with the Superior Court in the county where the deceased lived, ideally within 30 days of death.",
                },
                {
                  "@type": "HowToStep",
                  "name": "Publish Notice to Creditors",
                  "text": "Within 30 days of receiving Letters Testamentary, publish the notice in a qualified newspaper for 3 consecutive weeks.",
                },
                {
                  "@type": "HowToStep",
                  "name": "Mail Notice to Known Creditors",
                  "text": "Within 30 days, mail a separate notice to any creditors you know about.",
                },
                {
                  "@type": "HowToStep",
                  "name": "File Inventory & Appraisal",
                  "text": "Within 4 months of appointment, file DE-160 with a court-appointed referee appraisal.",
                },
                {
                  "@type": "HowToStep",
                  "name": "Wait for creditor period to close",
                  "text": "Do not distribute assets until the creditor claim period closes (4 months from Letters OR 60 days from first publication, whichever is later).",
                },
              ],
            },
          ],
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-900 text-sm">ExpectedEstate</span>
            </Link>
            <Button
              onClick={() => navigate("/register?mode=signup")}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200"
            >
              Track My Deadlines Free
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <p className="text-xs text-slate-400 font-semibold">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            {" / "}
            <Link to="/guides" className="hover:text-indigo-600 transition-colors">Guides</Link>
            {" / "}
            <span className="text-slate-600">California Probate Deadlines</span>
          </p>
        </div>

        {/* Hero */}
        <header className="max-w-5xl mx-auto px-6 py-12">
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 mb-4 text-xs font-black uppercase tracking-widest">
            Executor Legal Guide
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            California Probate Deadlines:
            <br />
            Every Statutory Date Executors Must Know
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-3xl mb-6">
            As executor, you are personally liable for missing these deadlines. California probate law sets strict windows for creditor notices, inventory filing, and tax returns. Miss one and face court sanctions, personal liability, or invalid proceedings.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Updated February 2026</span>
            <span className="flex items-center gap-1.5"><Scale className="w-4 h-4" /> California Probate Code</span>
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {DEADLINES.length} Key Deadlines</span>
          </div>
        </header>

        {/* Warning Banner */}
        <div className="max-w-5xl mx-auto px-6 mb-10">
          <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-rose-900 text-sm mb-1">Personal Liability Warning</p>
              <p className="text-sm text-rose-700 font-medium leading-relaxed">
                California courts hold executors to a strict fiduciary standard. Missing a statutory deadline — especially the creditor notice period or inventory deadline — can result in personal liability, court surcharges, or removal as executor. This guide reflects current California Probate Code as of January 2026. Consult an estate attorney for your specific situation.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="max-w-5xl mx-auto px-6 mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Quick Reference: Anchor Dates</h2>
          <p className="text-slate-600 text-sm font-medium mb-6">
            All California probate deadlines are calculated from one of three "anchor" dates. Know yours.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Date of Death", icon: "⚰️", desc: "Triggers final tax returns and starts the probate clock" },
              { label: "Letters Testamentary Issued", icon: "📜", desc: "Triggers creditor publication, inventory, and notice deadlines" },
              { label: "First Creditor Publication", icon: "📰", desc: "Starts the 60-day creditor claim window" },
            ].map((a) => (
              <div key={a.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-2xl mb-2">{a.icon}</div>
                <p className="font-black text-slate-900 text-sm mb-1">{a.label}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Deadline Table */}
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            All California Probate Deadlines — Executor's Master Checklist
          </h2>

          <div className="space-y-4">
            {DEADLINES.map((d) => {
              const p = priorityConfig[d.priority as keyof typeof priorityConfig];
              return (
                <div
                  key={d.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 text-slate-500">
                          {d.category}
                        </Badge>
                        <Badge className={`text-[10px] font-black uppercase tracking-widest border ${p.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.dot} mr-1.5`} />
                          {p.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-black text-indigo-700">{d.dayFrom}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1">{d.title}</h3>

                    <p className="text-sm text-slate-600 font-medium mb-3 leading-relaxed">
                      <strong className="text-slate-800">Statutory rule:</strong> {d.statutory}
                    </p>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                        <strong>If missed:</strong> {d.consequence}
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold mt-3 font-mono">
                      Authority: {d.code}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA mid-page */}
          <div className="mt-12 bg-indigo-600 rounded-3xl p-8 text-white text-center">
            <h2 className="text-2xl font-black mb-3">Don't track these manually</h2>
            <p className="text-indigo-200 font-medium mb-6 max-w-xl mx-auto">
              ExpectedEstate automatically calculates every deadline from your estate's anchor dates and sends you alerts before each one is due.
            </p>
            <Button
              onClick={() => navigate("/register?mode=signup")}
              className="bg-white hover:bg-indigo-50 text-indigo-700 font-black h-12 px-8 rounded-xl shadow-xl"
            >
              Track My Deadlines Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Full explanation sections for AEO content depth */}
          <div className="mt-16 prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-slate-900 not-prose mb-4">
              Understanding California Probate Deadlines in Detail
            </h2>

            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-sm font-black flex items-center justify-center shrink-0">1</span>
                  The Creditor Notice Period: Your Most Critical Deadline
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-3">
                  The creditor notice period is the most consequential deadline in California probate. Under Cal. Prob. Code § 9100, creditors have until <strong>4 months after Letters Testamentary are issued OR 60 days after the first publication of the Notice to Creditors — whichever is later</strong>.
                </p>
                <p className="text-slate-600 font-medium leading-relaxed mb-3">
                  This means you cannot safely distribute estate assets to beneficiaries until this entire period has passed and all known claims have been resolved. Distributing early exposes you to personal liability if a valid creditor claim comes in after distribution.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-4">
                  <p className="font-black text-slate-900 text-sm mb-2">Example Timeline:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600 font-medium">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> January 1: Date of Death</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> February 15: Letters Testamentary issued</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> March 1: First creditor publication</li>
                    <li className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> April 30: 60 days from first publication (creditor window closes here if after 4-month period)</li>
                    <li className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> June 15: 4 months from Letters (creditor window closes here — later of the two dates)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> June 16+: Safe to begin distribution (after all claims resolved)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-sm font-black flex items-center justify-center shrink-0">2</span>
                  Inventory & Appraisal (Form DE-160): The 4-Month Countdown
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-3">
                  Within 4 months of appointment, you must file a complete inventory of all estate assets with the probate court. This requires a court-appointed probate referee to appraise non-cash assets (real estate, stocks, collectibles, business interests).
                </p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  The inventory must include <em>every</em> asset the decedent owned or had an interest in at date of death — bank accounts, real property, vehicles, retirement accounts (if payable to the estate), intellectual property, and personal effects. Missing assets can later be discovered and create liability.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black flex items-center justify-center shrink-0">3</span>
                  Tax Deadlines: Personal Liability Territory
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-3">
                  As executor, you are personally responsible for filing the decedent's final income tax return (Form 1040) by April 15 of the year following death. If you distribute estate assets before taxes are paid and the IRS later assesses deficiencies, you can be held personally liable.
                </p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  If the estate earns more than $600 in income during administration (interest, dividends, rental income, etc.), you must also file Form 1041 — the Estate Income Tax Return — for each tax year the estate remains open.
                </p>
              </section>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 bg-slate-900 rounded-3xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black mb-2">Ready to manage these deadlines automatically?</h2>
                <p className="text-slate-400 font-medium">
                  ExpectedEstate calculates every deadline from your estate's specific dates and alerts you before each one expires.
                </p>
              </div>
              <Button
                onClick={() => navigate("/register?mode=signup")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black h-12 px-8 rounded-xl shadow-xl shrink-0"
              >
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Legal disclaimer */}
          <p className="text-xs text-slate-400 font-medium leading-relaxed mt-8 pb-8 border-t border-slate-100 pt-6">
            <strong>Legal Disclaimer:</strong> This content is for general informational purposes only and does not constitute legal advice. California probate law is complex and fact-specific. Deadlines and thresholds may change. Always consult a licensed California probate attorney for advice specific to your estate. ExpectedEstate is not a law firm and does not provide legal representation.
          </p>
        </div>
      </div>
    </>
  );
}
