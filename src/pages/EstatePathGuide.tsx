import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Scale,
    Clock,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    FileText,
    Building2,
    Home,
    Users2,
    DollarSign,
    Zap,
    Shield,
    BookOpen,
    Info,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

// ──────────────────────────────────────────────────────────
// PATH DATA  (derived from Estate_Path_Combinations_With_Complexity_Time.xlsx)
// ──────────────────────────────────────────────────────────

interface EstatePath {
    id: string;
    name: string;
    friendlyName: string;
    complexity: "Simple" | "Medium" | "Complex";
    timeline: string;
    color: string;
    icon: React.ReactNode;
    description: string;
    triggers: string[];
    keySteps: string[];
    notFor: string[];
    faqs: { q: string; a: string }[];
}

const ESTATE_PATHS: EstatePath[] = [
    {
        id: "trust_revocable",
        name: "Trust Administration (Revocable Living Trust)",
        friendlyName: "Living Trust Settlement",
        complexity: "Medium",
        timeline: "2–6 months",
        color: "emerald",
        icon: <Building2 className="w-5 h-5" />,
        description:
            "The deceased set up a Revocable Living Trust during their lifetime and transferred assets into it. Because trust assets are not part of the probate estate, a court is typically not involved — the Trustee distributes assets directly according to the trust document.",
        triggers: [
            "A Revocable (Living) Trust document exists",
            "Assets were titled in the trust's name (e.g., 'John Smith, Trustee')",
            "No contest or dispute has been filed",
        ],
        keySteps: [
            "Obtain the original Trust document",
            "Collect and file the Death Certificate with each institution",
            "Notify beneficiaries of trust existence (mandatory in most states)",
            "Pay valid debts and taxes from trust assets",
            "Distribute assets to beneficiaries per trust terms",
        ],
        notFor: [
            "Assets that were never transferred into the trust",
            "Estates with significant contested claims",
            "Estates where the trust was revoked before death",
        ],
        faqs: [
            {
                q: "Do I still need probate if there is a trust?",
                a: "Generally no — assets inside the trust skip probate entirely. However, assets held outside the trust (in the deceased's personal name) may still require a small probate or affidavit process.",
            },
            {
                q: "What does 'revocable' mean?",
                a: "Revocable means the person could change or cancel the trust at any time while alive. After death it becomes irrevocable, meaning no further changes can be made.",
            },
        ],
    },
    {
        id: "trust_irrevocable",
        name: "Irrevocable Trust Administration",
        friendlyName: "Irrevocable Trust Settlement",
        complexity: "Medium",
        timeline: "3–9 months",
        color: "blue",
        icon: <Shield className="w-5 h-5" />,
        description:
            "The deceased placed assets into an Irrevocable Trust — one that could not be changed or revoked after it was created. These are often used for asset protection, Medi-Cal/Medicaid planning, or special needs purposes. A Trustee administers the trust per its fixed terms, typically without court involvement.",
        triggers: [
            "An Irrevocable Trust document exists",
            "Assets are titled in the irrevocable trust's name",
            "Trust was funded and active at time of death",
        ],
        keySteps: [
            "Review the irrevocable trust document carefully",
            "Obtain a Taxpayer ID (EIN) for the trust",
            "File a Trust tax return (Form 1041)",
            "Notify all beneficiaries in writing",
            "Distribute assets as the trust document requires",
        ],
        notFor: [
            "Living (Revocable) Trusts — see Living Trust Settlement path",
            "Estates with no trust document at all",
        ],
        faqs: [
            {
                q: "Does an irrevocable trust avoid estate taxes?",
                a: "Often yes — assets in a properly structured irrevocable trust are generally not included in the taxable estate, which is one reason people create them.",
            },
            {
                q: "Who is the trustee for an irrevocable trust?",
                a: "The trust document names a Trustee (a person or institution). The trust grantor typically cannot serve as their own Trustee for an irrevocable trust.",
            },
        ],
    },
    {
        id: "general_probate",
        name: "General Probate Administration",
        friendlyName: "Standard Probate",
        complexity: "Medium",
        timeline: "6–12 months",
        color: "amber",
        icon: <Scale className="w-5 h-5" />,
        description:
            "The most common path when there is a valid Will but the estate value exceeds the small-estate threshold, there is no trust, and no special complications. The Executor files the Will with the probate court, which supervises the process of paying debts and distributing assets to beneficiaries.",
        triggers: [
            "A valid Will was found",
            "Estate value exceeds your state's small-estate threshold",
            "No living trust exists",
            "No active disputes",
            "All property is in the home state",
        ],
        keySteps: [
            "Lodge the original Will with the probate court within the required deadline",
            "Petition for Letters Testamentary (your legal authority as Executor)",
            "Notify creditors and publish notice in local newspaper",
            "Inventory and appraise estate assets",
            "Pay valid debts, taxes, and administration expenses",
            "File a final accounting with the court",
            "Distribute assets and close the estate",
        ],
        notFor: [
            "Estates below the small-estate threshold in your state",
            "Estates with a fully-funded living trust",
            "Estates with active will contests",
        ],
        faqs: [
            {
                q: "How long does probate take?",
                a: "Straightforward probate typically takes 6–12 months. Complexity, creditor claims, or tax issues can extend this timeline.",
            },
            {
                q: "Do I need a lawyer for probate?",
                a: "It depends on your state and estate complexity. Many states allow Executors to self-represent for simple estates. Complex or high-value estates generally benefit from legal counsel.",
            },
        ],
    },
    {
        id: "intestate",
        name: "Intestate Probate",
        friendlyName: "No-Will Probate (Intestate)",
        complexity: "Medium",
        timeline: "8–18 months",
        color: "orange",
        icon: <FileText className="w-5 h-5" />,
        description:
            "When someone dies without a valid Will, they are said to have died 'intestate.' The court applies your state's intestacy laws to determine how assets are distributed — typically to the closest living relatives in a set legal order. This path usually takes longer than testate probate because there is no Will to guide distribution.",
        triggers: [
            "No valid Will was found",
            "Estate value exceeds the small-estate threshold",
            "No living trust or beneficiary designations cover all assets",
        ],
        keySteps: [
            "File a Petition for Letters of Administration with the probate court",
            "Court appoints an Administrator (often the closest living heir)",
            "Identify all legal heirs under state intestacy law",
            "Inventory and appraise estate assets",
            "Pay debts, taxes, and administration costs",
            "Distribute assets to heirs in the statutory order",
        ],
        notFor: [
            "Estates with a valid Will",
            "Estates covered entirely by beneficiary designations or joint ownership",
        ],
        faqs: [
            {
                q: "Who inherits if there is no Will?",
                a: "State law determines this — generally a spouse first, then children, then parents, then siblings, and so on. The exact order varies by state.",
            },
            {
                q: "Can I still serve as Administrator without a Will?",
                a: "Yes. The court will appoint an Administrator, usually from a priority list that starts with the surviving spouse, then adult children, then parents, and so on.",
            },
        ],
    },
    {
        id: "ancillary_probate",
        name: "Ancillary Probate Required",
        friendlyName: "Multi-State Probate",
        complexity: "Complex",
        timeline: "9–18 months",
        color: "purple",
        icon: <Home className="w-5 h-5" />,
        description:
            "When the deceased owned real estate or other assets in a state different from where they lived, a separate 'ancillary' probate proceeding must be opened in each state where property is located in addition to the main probate in the home state. This adds cost and time.",
        triggers: [
            "Real property (land, house) owned in a state other than the home state",
            "Business interests in another state",
        ],
        keySteps: [
            "Open the primary (domiciliary) probate in the home state",
            "Hire local counsel in each state where property is held",
            "File ancillary probate petition in each out-of-state court",
            "Transfer or sell the out-of-state property under local court supervision",
            "Close each ancillary proceeding before the primary estate can be closed",
        ],
        notFor: [
            "Estates where all property is in one state",
            "Out-of-state assets transferred via trust or beneficiary designation (those avoid ancillary probate)",
        ],
        faqs: [
            {
                q: "Can I avoid ancillary probate?",
                a: "Yes — the most common method is to title out-of-state real estate in a Living Trust. The trust then transfers the property without court involvement in any state.",
            },
            {
                q: "How much does ancillary probate cost?",
                a: "Costs vary widely. Expect court filing fees and separate attorney fees in each state, potentially $2,000–$10,000+ per ancillary state.",
            },
        ],
    },
    {
        id: "contested",
        name: "Contested Probate Litigation",
        friendlyName: "Disputed Estate",
        complexity: "Complex",
        timeline: "12–24+ months",
        color: "red",
        icon: <AlertTriangle className="w-5 h-5" />,
        description:
            "When heirs, beneficiaries, or creditors formally dispute the Will, the appointment of the Executor, the value of assets, or the distribution plan, the estate enters contested probate. This is the most time-consuming and expensive path, often requiring litigation and court hearings before distribution can begin.",
        triggers: [
            "A party has filed or threatened to file a Will contest",
            "A creditor dispute is active or likely",
            "Executor authority is being challenged",
            "Multiple parties claim rights to the same asset",
        ],
        keySteps: [
            "Retain a probate litigation attorney immediately",
            "File all required court documents to open estate",
            "Respond formally to all challenges and motions",
            "Participate in mediation (often required before trial)",
            "Attend court hearings as needed",
            "Await court resolution before distributing any assets",
        ],
        notFor: [
            "Informal family disagreements that have not been filed with the court",
        ],
        faqs: [
            {
                q: "What is a Will contest?",
                a: "A formal legal challenge filed in court claiming the Will is invalid — typically on grounds of lack of mental capacity, undue influence, fraud, or improper execution.",
            },
            {
                q: "Can disputes arise even with a trust?",
                a: "Yes, though less common. Trust contests follow a similar litigation path but in civil rather than probate court.",
            },
        ],
    },
    {
        id: "insolvent",
        name: "Insolvent Estate Administration",
        friendlyName: "Insolvent Estate",
        complexity: "Complex",
        timeline: "6–18+ months",
        color: "rose",
        icon: <DollarSign className="w-5 h-5" />,
        description:
            "When an estate's total debts exceed its total assets, the estate is insolvent. This path overrides all others — it doesn't matter whether there is a Will, Trust, or other factors. The Executor or Administrator must pay creditors in a statutory priority order. Beneficiaries typically receive nothing.",
        triggers: [
            "Total debts (mortgages, loans, credit cards, medical bills) exceed total assets",
            "Creditors have filed claims against the estate",
        ],
        keySteps: [
            "Open probate and notify all known creditors",
            "Obtain appraisals of all estate assets",
            "Liquidate assets under court supervision",
            "Pay creditors in the statutory priority order (funeral expenses, taxes, secured creditors, general creditors)",
            "File final accounting with the court",
            "Inform beneficiaries that the estate is insolvent and they will not receive distributions",
        ],
        notFor: [
            "Estates where assets exceed debts",
        ],
        faqs: [
            {
                q: "Am I personally liable for the deceased's debts?",
                a: "Generally no — estate debts are paid from estate assets. Heirs and executors are not personally responsible for the deceased's debts unless they co-signed or the debt involves a jointly-held asset.",
            },
            {
                q: "What if there is not enough money to pay all creditors?",
                a: "Creditors are paid in a statutory priority order set by your state. Lower-priority creditors may receive partial or no payment. The estate is then closed with nothing left for beneficiaries.",
            },
        ],
    },
    {
        id: "small_estate",
        name: "Small Estate / Affidavit",
        friendlyName: "Simple Transfer (No Court Required)",
        complexity: "Simple",
        timeline: "30 days – 3 months",
        color: "teal",
        icon: <Zap className="w-5 h-5" />,
        description:
            "Many states allow families to transfer assets without a full probate proceeding when the estate's probate assets are below a dollar threshold. The exact procedure varies — California uses a 13100 Affidavit, Texas has a Small Estate Affidavit, Florida uses Summary Administration. This is the fastest and least expensive path.",
        triggers: [
            "Estate value falls below your state's small-estate threshold",
            "No real estate in the probate estate (or deed is TOD/joint tenancy)",
            "No active disputes",
        ],
        keySteps: [
            "Wait the required holding period (typically 30–40 days after death)",
            "Prepare and notarize the state-specific affidavit or simplified petition",
            "Present the affidavit to each institution along with a Death Certificate",
            "Assets are released directly to the rightful heirs",
        ],
        notFor: [
            "Estates with probate assets exceeding your state's threshold",
            "Estates with contested claims or unknown creditors",
            "Estates with complex real estate in the deceased's name",
        ],
        faqs: [
            {
                q: "What are the thresholds by state?",
                a: "Thresholds vary widely: California ~$184,500 (2024), Texas ~$75,000, Florida no monetary threshold but uses a simplified adminstration for estates under $75,000. Check your state's current limits.",
            },
            {
                q: "Can I use an affidavit for real estate?",
                a: "In most states, no — real estate in the deceased's sole name usually requires formal probate. Some states (like California) have specific procedures for real property in very small estates.",
            },
        ],
    },
];

// ──────────────────────────────────────────────────────────
// QUICK PATH FINDER
// ──────────────────────────────────────────────────────────

const QUESTIONS = [
    { id: "insolvent", text: "Were the total debts more than the total assets?", priority: 1 },
    { id: "contested", text: "Is there an active dispute, will contest, or creditor claim?", priority: 2 },
    { id: "trust", text: "Did the deceased have a Living Trust?", priority: 3 },
    { id: "outofstate", text: "Is there real estate in a different state?", priority: 4 },
    { id: "will", text: "Was a valid Will found?", priority: 5 },
    { id: "small", text: "Is the estate value below ~$100,000?", priority: 6 },
];

function getRecommendedPath(answers: Record<string, boolean | null>): string {
    if (answers.insolvent === true) return "insolvent";
    if (answers.contested === true) return "contested";
    // Trust beats probate
    if (answers.trust === true) return "trust_revocable";
    if (answers.outofstate === true) return "ancillary_probate";
    if (answers.small === true) return "small_estate";
    if (answers.will === true) return "general_probate";
    if (answers.will === false) return "intestate";
    return "general_probate"; // default fallback
}

// ──────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ──────────────────────────────────────────────────────────

const complexityColors = {
    Simple: "bg-teal-100 text-teal-800 border-teal-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    Complex: "bg-red-100 text-red-800 border-red-200",
};

const pathColors: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50",
    blue: "border-blue-200 bg-blue-50",
    amber: "border-amber-200 bg-amber-50",
    orange: "border-orange-200 bg-orange-50",
    purple: "border-purple-200 bg-purple-50",
    red: "border-red-200 bg-red-50",
    rose: "border-rose-200 bg-rose-50",
    teal: "border-teal-200 bg-teal-50",
};

const iconColors: Record<string, string> = {
    emerald: "bg-emerald-600 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-500 text-white",
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-600 text-white",
    rose: "bg-rose-600 text-white",
    teal: "bg-teal-600 text-white",
};

function PathCard({ path, highlight }: { path: EstatePath; highlight?: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <motion.div
            layout
            id={`path-${path.id}`}
            className={cn(
                "rounded-2xl border-2 p-6 transition-all duration-300",
                pathColors[path.color],
                highlight ? "ring-4 ring-primary ring-offset-2 shadow-2xl" : "shadow-sm hover:shadow-md"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl shadow-sm", iconColors[path.color])}>
                        {path.icon}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                            {path.name}
                        </p>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            {path.friendlyName}
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", complexityColors[path.complexity])}>
                        {path.complexity}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {path.timeline}
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mt-4">
                {path.description}
            </p>

            {/* Triggers */}
            <div className="mt-4">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">This path applies when…</p>
                <ul className="space-y-1">
                    {path.triggers.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {t}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Expand/Collapse */}
            <button
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? "Show less" : "See key steps & FAQs"}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Key Steps */}
                        <div className="mt-4 p-4 rounded-xl bg-white/60 border border-white/80">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Key Steps</p>
                            <ol className="space-y-2">
                                {path.keySteps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Not For */}
                        <div className="mt-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                            <p className="text-[10px] font-bold uppercase text-rose-500 tracking-wider mb-2">This path does NOT apply if…</p>
                            <ul className="space-y-1">
                                {path.notFor.map((n, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-rose-700">
                                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        {n}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* FAQs */}
                        {path.faqs.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">FAQs</p>
                                {path.faqs.map((faq, i) => (
                                    <div key={i} className="rounded-xl border border-white/80 bg-white/50 overflow-hidden">
                                        <button
                                            className="w-full text-left p-3 flex items-start justify-between gap-2"
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        >
                                            <span className="text-xs font-bold text-slate-800 flex items-start gap-2">
                                                <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                {faq.q}
                                            </span>
                                            {openFaq === i ? (
                                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {openFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: "auto" }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="px-3 pb-3 text-xs text-slate-600 leading-relaxed">
                                                        {faq.a}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ──────────────────────────────────────────────────────────
// PATH FINDER WIDGET
// ──────────────────────────────────────────────────────────

function PathFinder() {
    const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
    const [result, setResult] = useState<string | null>(null);

    const answered = Object.keys(answers).filter(k => answers[k] !== null).length;
    const totalQ = QUESTIONS.length;

    const handleAnswer = (id: string, val: boolean) => {
        const next = { ...answers, [id]: val };
        setAnswers(next);
        // Auto-compute result when all answered or early exit conditions
        if (next.insolvent === true || next.contested === true || Object.keys(next).length === totalQ) {
            setResult(getRecommendedPath(next));
        }
    };

    const reset = () => { setAnswers({}); setResult(null); };

    const resultPath = result ? ESTATE_PATHS.find(p => p.id === result) : null;

    return (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-2xl shadow-indigo-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white/20 rounded-xl">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Quick Path Finder</h3>
                    <p className="text-indigo-200 text-sm">Answer a few questions to find your path</p>
                </div>
            </div>

            {!result ? (
                <div className="space-y-4">
                    {QUESTIONS.map(q => (
                        <div key={q.id} className="p-4 rounded-2xl bg-white/10 backdrop-blur space-y-3">
                            <p className="text-sm font-bold">{q.text}</p>
                            <div className="flex gap-2">
                                {[true, false, null].map((val, vi) => {
                                    const labels = ["Yes", "No", "Not Sure"];
                                    const current = answers[q.id];
                                    const isActive = current === val;
                                    return (
                                        <button
                                            key={vi}
                                            onClick={() => handleAnswer(q.id, val as boolean)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                                isActive
                                                    ? "bg-white text-indigo-700 shadow-lg"
                                                    : "bg-white/15 hover:bg-white/25 text-white"
                                            )}
                                        >
                                            {labels[vi]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <p className="text-xs text-indigo-300 text-center mt-2">
                        {answered} of {totalQ} answered
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-white/10 backdrop-blur space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Likely Path</p>
                        {resultPath && (
                            <>
                                <h4 className="text-xl font-bold">{resultPath.friendlyName}</h4>
                                <p className="text-sm text-indigo-100">{resultPath.description.slice(0, 160)}…</p>
                                <div className="flex items-center gap-3 pt-1">
                                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">
                                        {resultPath.complexity}
                                    </span>
                                    <span className="text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {resultPath.timeline}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={`#path-${result}`}
                            className="flex-1 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm text-center hover:bg-indigo-50 transition-colors"
                        >
                            See Full Details ↓
                        </a>
                        <button
                            onClick={reset}
                            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 font-bold text-sm transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                    <p className="text-[10px] text-indigo-300 leading-relaxed">
                        <Info className="w-3 h-3 inline mr-1" />
                        This is an educational guide only — not legal advice. Your specific situation may differ.
                    </p>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────
// DECISION SIGNAL LEGEND
// ──────────────────────────────────────────────────────────

const SIGNALS = [
    { icon: <FileText className="w-4 h-4" />, label: "Will", desc: "A signed legal document specifying how assets are distributed. Its presence determines Testate (with Will) vs Intestate (without Will) probate.", color: "bg-amber-50 border-amber-100" },
    { icon: <Building2 className="w-4 h-4" />, label: "Trust", desc: "A legal arrangement where assets are held by a Trustee. Revocable Trusts avoid probate; Irrevocable Trusts offer additional asset protection.", color: "bg-emerald-50 border-emerald-100" },
    { icon: <Home className="w-4 h-4" />, label: "TOD Deed", desc: "A Transfer-on-Death Deed recorded on real property. Passes real estate automatically at death, avoiding probate for that property.", color: "bg-blue-50 border-blue-100" },
    { icon: <Users2 className="w-4 h-4" />, label: "Surviving Spouse", desc: "A living spouse may qualify for simplified proceedings such as a Spousal Property Petition, which avoid full probate court.", color: "bg-pink-50 border-pink-100" },
    { icon: <Home className="w-4 h-4" />, label: "Out-of-State Property", desc: "Real estate in a different state from the deceased's home state requires a separate Ancillary Probate in that state.", color: "bg-purple-50 border-purple-100" },
    { icon: <AlertTriangle className="w-4 h-4" />, label: "Contested", desc: "Any formal legal dispute — will contest, creditor claim, or heir disagreement filed with the court. Triggers litigation path.", color: "bg-red-50 border-red-100" },
    { icon: <DollarSign className="w-4 h-4" />, label: "Insolvent", desc: "Total debts exceed total assets. This overrides all other signals — the Insolvent Estate Administration path is always applied first.", color: "bg-rose-50 border-rose-100" },
];

// ──────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────

export default function EstatePathGuide() {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<"All" | "Simple" | "Medium" | "Complex">("All");

    const filtered = activeFilter === "All"
        ? ESTATE_PATHS
        : ESTATE_PATHS.filter(p => p.complexity === activeFilter);

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="Estate Administration Path Guide | ExpectedEstate"
                description="Understand the 8 estate settlement paths — from Living Trust to Contested Probate. A plain-English guide to help executors choose the right approach."
            />

            {/* Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm mb-6 border border-white/20">
                        <BookOpen className="w-4 h-4 text-indigo-300" />
                        <span className="text-indigo-200">Estate Path Reference Guide</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
                        Which Estate Path Applies to You?
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        There are 8 distinct estate administration paths. Your path depends on 7 key signals about the estate. Use the guide below to understand each path — or use the Quick Finder to narrow it down.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center mt-8">
                        <Button
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            onClick={() => navigate("/onboarding")}
                        >
                            Start Free Setup <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-slate-300 hover:text-white"
                            onClick={() => document.getElementById("path-finder")?.scrollIntoView({ behavior: "smooth" })}
                        >
                            Jump to Path Finder ↓
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

                {/* Decision Signals */}
                <section>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">The 7 Key Signals</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Your estate path is determined by these 7 factors, applied in priority order. Insolvency always wins. Trust type beats probate paths.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SIGNALS.map((s, i) => (
                            <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border", s.color)}>
                                <div className="p-1.5 rounded-lg bg-white/80 text-slate-500 shrink-0">
                                    {s.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">#{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-800">{s.label}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Path Finder */}
                <section id="path-finder">
                    <PathFinder />
                </section>

                {/* All 8 Paths */}
                <section>
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">All 8 Estate Paths</h2>
                            <p className="text-sm text-slate-500 mt-1">Click any card to expand steps and FAQs</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(["All", "Simple", "Medium", "Complex"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                                        activeFilter === f
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {filtered.map(path => (
                                <motion.div
                                    key={path.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                >
                                    <PathCard path={path} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Disclaimer */}
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-800 mb-1">Educational Resource — Not Legal Advice</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            This guide is for informational purposes only and does not constitute legal advice.
                            Estate law varies significantly by state and individual circumstances. Always consult
                            a licensed probate attorney for decisions specific to your situation.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center py-6">
                    <h3 className="text-xl font-black text-slate-900 mb-2">Ready to start your estate?</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        ExpectedEstate guides you through your specific path — document by document.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => navigate("/onboarding")}
                        className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
                    >
                        Start Free Estate Setup <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
