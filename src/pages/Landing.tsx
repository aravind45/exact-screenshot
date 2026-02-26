import { useNavigate, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  Scale,
  Landmark,
  MapPin,
  AlertCircle,
  Star,
  ChevronDown,
  MessageSquare,
  BookOpen,
  CreditCard,
  Bell,
} from "lucide-react";
import { Header } from "@/components/layout/Header";

const FEATURES = [
  {
    icon: MapPin,
    title: "AI-Powered Action Plan",
    description:
      "Get a step-by-step roadmap customized to your estate's legal track — from probate filing to final distribution. No guessing.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Clock,
    title: "Statutory Deadline Tracker",
    description:
      "California law sets strict deadlines for creditor notices, court filings, and tax returns. We track every one so you never miss a date.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: FileText,
    title: "Document Vault",
    description:
      "Upload wills, death certificates, Letters Testamentary, and court filings. Organize everything the court and heirs will ask for.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Scale,
    title: "Creditor & Claims Management",
    description:
      "Send legally-required creditor notices, track claim periods, and manage approved / disputed debts with a clear audit trail.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Users,
    title: "Heir Collaboration",
    description:
      "Invite beneficiaries so they can see estate progress. Fewer calls, less conflict, complete transparency — all in one place.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "Verified Advisor Marketplace",
    description:
      "Need an estate attorney, CPA, or real-estate professional? Book verified advisors directly — no cold-call guessing.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: MessageSquare,
    title: "AI Legal Q&A — Grounded in Law",
    description:
      "Ask any probate question and get answers sourced directly from your state's statutes and court rules — not generic internet advice. Powered by retrieval-augmented AI.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: BookOpen,
    title: "Estate Accounting",
    description:
      "Track every income receipt, expense, and distribution in a court-ready ledger. Generates the formal accounting report that courts and beneficiaries require at closing.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: CreditCard,
    title: "Liabilities & Debt Tracker",
    description:
      "Log every known debt — mortgages, credit cards, medical bills, taxes. Track payment status, dispute flags, and outstanding balances so nothing slips through.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Bell,
    title: "Follow-Up & Task Reminders",
    description:
      "Set follow-up tasks for pending items — unanswered creditor calls, awaited appraisals, overdue court responses. Never let a loose end become a liability.",
    color: "bg-yellow-50 text-yellow-600",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Answer 5 questions",
    description:
      "Tell us about the estate — state, estate size, whether there's a will, and whether probate is needed.",
  },
  {
    step: "02",
    title: "Get your personalized plan",
    description:
      "Our authority engine instantly generates a legal-track-specific action plan with all tasks, deadlines, and required forms.",
  },
  {
    step: "03",
    title: "Work through it step by step",
    description:
      "Complete tasks, upload documents, log creditor communications, and track every deadline — the whole estate in one dashboard.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I was completely overwhelmed after my father passed. ExpectedEstate gave me a clear roadmap and I knew exactly what to do next. Settled the estate efficiently without traditional manual overhead.",
    name: "Sarah M.",
    role: "Executor, California",
    stars: 5,
  },
  {
    quote:
      "The deadline tracker alone is worth it. California probate has so many statutory dates — I would have missed the creditor notice window without this automation.",
    name: "James T.",
    role: "Executor, Texas",
    stars: 5,
  },
  {
    quote:
      "My initial legal consult estimated $15,000 for full manual handling. ExpectedEstate's automation handled the logistics for a fraction of that, letting me focus on family.",
    name: "Maria L.",
    role: "Executor, Florida",
    stars: 5,
  },
];

const FAQS = [
  {
    q: "How long does probate take in California?",
    a: "Most California probate cases take 9–18 months. Simple estates under $184,500 may qualify for small-estate procedures that take 30–60 days. Contested estates can take 2–5 years.",
  },
  {
    q: "Do I need an attorney to be an executor in California?",
    a: "While hiring an attorney is common, the manual handling of a standard estate can cost $5,000–$15,000 in statutory fees. ExpectedEstate provides the logistical automation and procedural guidance to help you manage the process efficiently, whether you are working independently or with professional counsel.",
  },
  {
    q: "What is the deadline to file for probate in California?",
    a: "California has no strict statutory deadline, but you should file within 30 days of the decedent's death. The creditor notice period is 60 days from the first publication. Missing these windows can expose you to personal liability as executor.",
  },
  {
    q: "What does ExpectedEstate cost?",
    a: "Free to start — no credit card required. Create your account, complete the estate discovery, and get your full action plan at no cost. Premium plans unlock advisor bookings and advanced features.",
  },
  {
    q: "What states does ExpectedEstate support?",
    a: "ExpectedEstate currently provides in-depth support for California, Texas, Florida, and New York probate law, with general guidance for all 50 states. State-specific statutory deadlines and forms are updated quarterly.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Free Probate & Estate Settlement Software for Executors | ExpectedEstate"
        description="Stop overpaying for manual probate logistics. ExpectedEstate gives executors an AI-powered step-by-step action plan, deadline tracker, and document vault — saving $5,000–$15,000 in traditional manual fees. Free to start."
        canonical="https://www.expectedestate.com/"
        ogTitle="ExpectedEstate — Probate Software That Pays for Itself"
        ogDescription="Stop guessing. Get a personalized probate action plan in minutes. Track every statutory deadline, manage assets, and settle the estate — free to start."
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "ExpectedEstate",
              "url": "https://www.expectedestate.com",
              "logo": "https://www.expectedestate.com/modern_roadmap_banner.png",
              "sameAs": ["https://twitter.com/ExpectedEstate"],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "availableLanguage": "English",
              },
            },
            {
              "@type": "SoftwareApplication",
              "name": "ExpectedEstate",
              "applicationCategory": "LegalApplication",
              "operatingSystem": "Web",
              "url": "https://www.expectedestate.com",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free to start — no credit card required",
              },
              "description":
                "AI-powered probate and estate settlement software for executors. Step-by-step action plan, statutory deadline tracker, document vault, and verified advisor marketplace.",
              "featureList": [
                "AI-powered probate action plan",
                "Asset discovery and inventory",
                "Statutory deadline tracker",
                "Document vault",
                "Creditor notice management",
                "Heir collaboration portal",
                "Verified advisor marketplace",
                "AI legal Q&A grounded in state statutes (RAG)",
              ],
              "screenshot": "https://www.expectedestate.com/modern_roadmap_banner.png",
            },
            {
              "@type": "FAQPage",
              "mainEntity": FAQS.map((f) => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a },
              })),
            },
          ],
        }}
      />

      <div className="min-h-screen bg-white font-sans">
        <Header />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-slate-950 text-white pt-24 pb-32">
          {/* Advanced background aesthetics */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Badge className="bg-white/10 text-indigo-300 border border-white/10 mb-8 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                Free to Start — No Credit Card Required
              </Badge>

              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-8 max-w-4xl mx-auto">
                The Probate Software <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
                  That Pays for Itself
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                Settle your loved one's estate in months, not years — without the{" "}
                <strong className="text-white">$15,000 manual overhead</strong>. Get a
                personalized AI action plan, track every legal deadline, and automate
                your executor duties in one integrated platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => navigate("/register?mode=signup")}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg px-10 h-14 rounded-2xl shadow-2xl shadow-indigo-900/50 w-full sm:w-auto"
                >
                  Start Your Free Estate Plan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="ghostDark"
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="font-bold text-base h-14 w-full sm:w-auto"
                >
                  Sign In to Existing Account
                </Button>
              </div>

              {/* trust bar */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-slate-400">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SOC 2 Compliant Storage
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Used in all 50 States
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Star className="w-4 h-4 text-amber-400" />
                  4.9/5 Average Rating
                </div>
              </div>

            </motion.div>
          </div>
        </section>

        {/* ── Pain Bar ── */}
        <section className="bg-slate-900 border-y border-white/5 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/5 mb-4 uppercase tracking-[0.2em] font-black py-1.5 px-4">
                The Cost of Inaction
              </Badge>
              <h2 className="text-3xl font-black text-white tracking-tight">
                As executor, you are legally responsible.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Probate Court Petition", risk: "Deadline: 30 days" },
                { label: "Creditor Notification", risk: "Deadline: 60 days" },
                { label: "Inventory & Appraisal", risk: "Personal liability" },
                { label: "Final Tax Return", risk: "IRS penalties" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-sm group hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-base font-bold text-white mb-2 leading-tight">{item.label}</p>
                  <p className="text-xs text-rose-400 font-black uppercase tracking-widest">{item.risk}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-400 font-medium mt-10">
              Miss a deadline → personal liability. Miss a creditor → lawsuit.
              <strong className="text-white"> ExpectedEstate tracks it all for you automatically.</strong>
            </p>
          </div>
        </section>

        {/* ── Product Screenshot ── */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4 text-xs font-black uppercase tracking-widest">
                Real-Time Tracking
              </Badge>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Always know where things stand
              </h2>
              <p className="text-slate-500 font-medium mt-2">Real-time progress tracking so you — and your heirs — always know where things stand.</p>
            </div>
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-indigo-200"
              >
                Try It Free — No Card Required
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-32 bg-slate-50 border-y border-slate-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-6 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]">
                The Process
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                From overwhelmed to organized <br />
                <span className="text-indigo-600">in under 10 minutes</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-slate-200 z-0" />

              {STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative z-10 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black mb-8 shadow-lg shadow-indigo-200">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4">{s.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{s.description}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-20">
              <Button
                onClick={() => navigate("/register?mode=signup")}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 h-16 rounded-2xl shadow-2xl shadow-indigo-900/20"
              >
                Get My Free Action Plan
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="bg-white py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-6 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]">
                Complete Toolkit
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Everything an executor needs. <br />
                <span className="text-slate-400">Nothing they don't.</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/20 transition-all duration-500"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500 ${f.color}`}>
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cost Comparison ── */}
        <section className="py-24 px-6 max-w-4xl mx-auto text-center">
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4 text-xs font-black uppercase tracking-widest">
            The Math Is Simple
          </Badge>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-12">
            Compare your options
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traditional Manual Path */}
            <div className="rounded-3xl border-2 border-slate-200 p-8 text-left">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Traditional Manual Path
              </p>
              <p className="text-5xl font-black text-slate-900 mb-2">
                $15,000
                <span className="text-xl text-slate-500 font-semibold"> avg fees</span>
              </p>
              <ul className="space-y-3 mt-6 text-sm text-slate-600">
                {[
                  "Manual paperwork and physical mailing",
                  "High hourly billable rates for logistics",
                  "Opaque process with legacy tracking",
                  "Reliant on slow back-and-forth syncs",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-slate-500 text-[9px] font-black">✕</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* ExpectedEstate */}
            <div className="rounded-3xl border-2 border-indigo-500 bg-indigo-50 p-8 text-left relative">
              <Badge className="absolute top-4 right-4 bg-indigo-600 text-white border-none text-[10px] font-black uppercase">
                Digital Automation
              </Badge>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">
                ExpectedEstate Software
              </p>
              <p className="text-5xl font-black text-indigo-700 mb-2">
                $0
                <span className="text-xl text-indigo-500 font-semibold"> free to start</span>
              </p>
              <ul className="space-y-3 mt-6 text-sm text-slate-700">
                {[
                  "AI-generated action plan in minutes",
                  "Automated statutory deadline tracking",
                  "24/7 digital transparency for heirs",
                  "Direct path to expert advice when needed",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate("/register?mode=signup")}
                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-xl shadow-lg shadow-indigo-200"
              >
                Start Free — No Card Required
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="bg-slate-50 py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Executors who've been <br />
                <span className="text-slate-400">exactly where you are</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 mb-8">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 text-lg font-medium leading-relaxed mb-10 italic">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-base">{t.name}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-32 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <Badge className="bg-slate-100 text-slate-600 border border-slate-200 mb-6 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]">
                Common Questions
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Navigating the maze <br />
                <span className="text-slate-400">with absolute clarity</span>
              </h2>
            </div>
            <div className="space-y-4">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group bg-slate-50 border border-slate-200 rounded-[2rem] overflow-hidden transition-all duration-300 open:bg-white open:shadow-xl open:shadow-slate-200/50 open:border-indigo-500/20"
                >
                  <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                    <span className="font-bold text-slate-900 text-lg pr-6">{f.q}</span>
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-transform group-open:rotate-180 group-open:bg-indigo-600 group-open:border-indigo-600">
                      <ChevronDown className="w-5 h-5 text-slate-400 group-open:text-white" />
                    </div>
                  </summary>
                  <div className="px-8 pb-8 text-slate-600 text-base leading-relaxed font-medium">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                to="/guides/california-probate-deadlines"
                className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all"
              >
                Explore our full Knowledge Base <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-950 py-32 px-6 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.15)_0,transparent_70%)]" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-[1.1]">
                Finalize with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">absolute confidence.</span>
              </h2>
              <p className="text-slate-400 font-medium text-xl mb-12 leading-relaxed max-w-2xl mx-auto">
                No surprises. No hidden fees. Just clear, compassionate guidance to help you finish what you started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button
                  onClick={() => navigate("/register?mode=signup")}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg px-12 h-16 rounded-2xl shadow-2xl shadow-indigo-900/50 w-full sm:w-auto"
                >
                  Start Your Free Roadmap
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="flex items-center gap-4 text-slate-500 font-bold">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800" />
                    ))}
                  </div>
                  <span>Joined by 1,200+ executors</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-slate-950 text-slate-400 py-24 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="font-black text-white text-xl tracking-tight">ExpectedEstate</span>
                </div>
                <p className="text-sm font-medium leading-relaxed mb-6">
                  The compassionate platform for modern estate settlement. Built to handle the logistics so you can handle the family.
                </p>
              </div>
              <div className="col-span-1">
                <h4 className="text-white font-bold mb-6 tracking-tight uppercase text-xs">Resources</h4>
                <ul className="space-y-4 text-sm font-semibold">
                  <li><Link to="/guides/california-probate-deadlines" className="hover:text-white transition-colors">California Probate Guide</Link></li>
                  <li><Link to="/guides/texas-probate-deadlines" className="hover:text-white transition-colors">Texas Probate Guide</Link></li>
                  <li><Link to="/probate-process" className="hover:text-white transition-colors">Probate Process Overview</Link></li>
                </ul>
              </div>
              <div className="col-span-1">
                <h4 className="text-white font-bold mb-6 tracking-tight uppercase text-xs">Platform</h4>
                <ul className="space-y-4 text-sm font-semibold">
                  <li><Link to="/marketplace" className="hover:text-white transition-colors">Find an Advisor</Link></li>
                  <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/advisor/onboarding" className="hover:text-white transition-colors">Become an Advisor</Link></li>
                </ul>
              </div>
              <div className="col-span-1">
                <h4 className="text-white font-bold mb-6 tracking-tight uppercase text-xs">Legal</h4>
                <ul className="space-y-4 text-sm font-semibold">
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} ExpectedEstate. Not legal advice. Educational purposes only.
              </p>
              <div className="flex gap-8">
                {/* Social links could go here */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
