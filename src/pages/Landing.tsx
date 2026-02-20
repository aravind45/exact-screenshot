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
      "I was completely overwhelmed after my father passed. ExpectedEstate gave me a clear roadmap and I knew exactly what to do next. Settled the estate in 11 months without an attorney.",
    name: "Sarah M.",
    role: "Executor, California",
    stars: 5,
  },
  {
    quote:
      "The deadline tracker alone is worth it. California probate has so many statutory dates — I would have missed the creditor notice window without this.",
    name: "James T.",
    role: "Executor, Texas",
    stars: 5,
  },
  {
    quote:
      "My attorney quoted $18,000 to handle the estate. I used ExpectedEstate and spent $0 on legal fees. The AI guidance is that good.",
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
    a: "You are not legally required to hire an attorney, but probate involves complex forms, strict deadlines, and potential personal liability if done incorrectly. ExpectedEstate provides step-by-step guidance and gives you access to verified attorneys when you need one — typically saving $5,000–$15,000 in legal fees.",
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
        description="Settle your loved one's estate without a $15,000 attorney fee. ExpectedEstate gives executors an AI-powered step-by-step action plan, deadline tracker, document vault, and probate forms — free to start."
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
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 text-white">
          {/* background rings */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-indigo-500/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-6 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                Free to Start — No Credit Card
              </Badge>

              <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
                The Probate Software
                <br />
                <span className="text-indigo-400">That Pays for Itself</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
                Settle your loved one's estate in months, not years — without a{" "}
                <strong className="text-white">$15,000 attorney fee</strong>. Get a
                personalized AI action plan, track every legal deadline, and manage
                assets, creditors, and heirs — all in one place.
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
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="text-slate-300 hover:text-white font-bold text-base h-14 w-full sm:w-auto"
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
        <section className="bg-slate-50 border-y border-slate-200 py-10">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
              As executor, you're legally responsible for all of this:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Filing probate court petition", risk: "Deadline: 30 days" },
                { label: "Notifying all creditors", risk: "Deadline: 60 days" },
                { label: "Estate inventory & appraisal", risk: "Personal liability" },
                { label: "Final tax return (Form 1041)", risk: "IRS penalties" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-slate-200 p-4"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 mb-2" />
                  <p className="text-sm font-bold text-slate-900 leading-tight">{item.label}</p>
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{item.risk}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-500 font-medium mt-6">
              Miss a deadline → personal liability. Miss a creditor → lawsuit.
              <strong className="text-slate-900"> ExpectedEstate tracks it all for you.</strong>
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
        <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4 text-xs font-black uppercase tracking-widest">
              How It Works
            </Badge>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              From overwhelmed to organized
              <br />
              <span className="text-indigo-600">in under 10 minutes</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-black text-slate-100 leading-none mb-4">{s.step}</div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{s.description}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-5 h-5 text-slate-300" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/register?mode=signup")}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-indigo-200"
            >
              Get My Free Action Plan
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="bg-slate-50 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4 text-xs font-black uppercase tracking-widest">
                Features
              </Badge>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Everything an executor needs.
                <br />
                Nothing they don't.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{f.description}</p>
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
            {/* Attorney option */}
            <div className="rounded-3xl border-2 border-slate-200 p-8 text-left">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Traditional Attorney
              </p>
              <p className="text-5xl font-black text-slate-900 mb-2">
                $15,000
                <span className="text-xl text-slate-500 font-semibold"> avg.</span>
              </p>
              <ul className="space-y-3 mt-6 text-sm text-slate-600">
                {[
                  "4% of estate value in California",
                  "Months of back-and-forth",
                  "No 24/7 visibility into progress",
                  "You still do most of the legwork",
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
                Recommended
              </Badge>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">
                ExpectedEstate
              </p>
              <p className="text-5xl font-black text-indigo-700 mb-2">
                $0
                <span className="text-xl text-indigo-500 font-semibold"> free to start</span>
              </p>
              <ul className="space-y-3 mt-6 text-sm text-slate-700">
                {[
                  "AI-generated action plan in minutes",
                  "All deadlines tracked automatically",
                  "Real-time dashboard for heirs",
                  "Verified attorney access when needed",
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
        <section className="bg-slate-50 py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Executors who've been where you are
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm font-medium leading-relaxed mb-6">
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500 font-semibold">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 mb-4 text-xs font-black uppercase tracking-widest">
              FAQ
            </Badge>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Common questions about probate &amp; estate settlement
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-black text-slate-900 pr-6">{f.q}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed font-medium">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/guides/california-probate-deadlines"
              className="text-indigo-600 font-bold text-sm hover:underline"
            >
              See California Probate Deadlines →
            </Link>
          </div>
        </section>

        <section className="bg-indigo-600 py-24 px-6 text-white overflow-hidden text-center">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
                Finalize with <span className="text-indigo-200">confidence.</span>
              </h2>
              <p className="text-indigo-200 font-medium text-lg mb-10 leading-relaxed max-w-xl mx-auto">
                Free account. No credit card. Your personalized action plan is ready in minutes.
              </p>
              <Button
                onClick={() => navigate("/register?mode=signup")}
                size="lg"
                className="bg-white hover:bg-indigo-50 text-indigo-700 font-black text-lg px-12 h-14 rounded-2xl shadow-2xl w-full sm:w-auto"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-indigo-300 text-sm font-semibold mt-8">
                Join executors across all 50 states who chose clarity over chaos.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-slate-950 text-slate-400 py-12 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="font-black text-white">ExpectedEstate</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm font-semibold">
              <Link to="/guides/california-probate-deadlines" className="hover:text-white transition-colors">
                CA Probate Guide
              </Link>
              <Link to="/marketplace" className="hover:text-white transition-colors">
                Find an Advisor
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register?mode=signup" className="hover:text-white transition-colors">
                Register
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} ExpectedEstate. Not legal advice.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
