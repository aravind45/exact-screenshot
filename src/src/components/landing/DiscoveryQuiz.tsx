import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ArrowRight,
    ChevronLeft,
    Heart,
    ShieldCheck,
    UserCircle,
    Scale,
    Zap,
    CheckCircle2,
    Lock,
    Home,
    Users,
    ScrollText,
    HelpCircle,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";
import { US_STATES } from "@/lib/states";
import { SEO } from "@/components/SEO";

const STEPS = [
    { id: "intro", title: "Let's Start" },
    { id: "role", title: "Your Role" },
    { id: "location", title: "State" },
    { id: "titling", title: "How Assets Were Held" },
    { id: "scope", title: "Complexity Check" },
    { id: "details", title: "Estate Details" },
    { id: "result", title: "Your Roadmap" }
];

// Answers that route the user away from self-help to professional help
const SCOPE_RED_FLAGS = [
    { id: "contested", label: "Someone is disputing the will or the distribution" },
    { id: "minors", label: "Minor children are inheriting" },
    { id: "medical", label: "They received Medi-Cal / Medicaid long-term care" },
    { id: "multistate", label: "They owned real estate in more than one state" },
];

export default function DiscoveryQuiz() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [role, setRole] = useState<"executor" | "heir" | null>(null);
    const [data, setData] = useState({
        deceasedName: "",
        state: "",
        hasWill: true,
        estimatedValue: "",
        titling: "" as "" | "sole" | "joint" | "trust" | "unsure",
        redFlags: [] as string[],
    });

    const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const back = () => setStep(s => Math.max(s - 1, 0));

    const hasRedFlags = data.redFlags.length > 0;

    const recommendation = data.state && !hasRedFlags ? calculateAuthorityRecommendation([], data.state, {
        hasWill: data.hasWill,
        estimatedValue: parseFloat(data.estimatedValue) || 0,
        isSpouse: role === "executor", // Simplified assumption for the quiz
        isTrustRevocable: data.titling === "trust",
        hasTODDeed: data.titling === "joint",
    }) : null;

    const toggleRedFlag = (id: string) => {
        setData(d => ({
            ...d,
            redFlags: d.redFlags.includes(id)
                ? d.redFlags.filter(f => f !== id)
                : [...d.redFlags, id]
        }));
    };

    const saveDiscovery = () => {
        sessionStorage.setItem("discovery_data", JSON.stringify({
            role,
            ...data,
            recommendation,
            needsAttorney: hasRedFlags
        }));
    };

    const handleFinish = () => {
        saveDiscovery();
        navigate("/auth?mode=signup");
    };

    const handleFreeRoadmap = () => {
        saveDiscovery();
        navigate("/free-roadmap");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <SEO
                title="Estate Intake Quiz"
                description="Interactive estate intake quiz used to start a personalized executor roadmap."
                canonical="https://www.expectedestate.com/start"
                noindex
            />
            <div className="max-w-xl w-full">
                {/* Progress header */}
                <div className="mb-8 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={back} className={cn("text-slate-400", step === 0 && "opacity-0 pointer-events-none")}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <div className="flex gap-1">
                        {STEPS.map((_, i) => (
                            <div key={i} className={cn("h-1 w-8 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-slate-200")} />
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {step + 1} of {STEPS.length}</p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                            <CardContent className="p-8 sm:p-12">

                                {/* 0. INTRO */}
                                {step === 0 && (
                                    <div className="text-center space-y-6">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                                        </div>
                                        <h1 className="text-3xl font-['Outfit'] font-black text-slate-900 tracking-tight">First, we're sorry for your loss.</h1>
                                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                            Settling an estate is a heavy burden. Let's find the simplest way forward together.
                                        </p>
                                        <Button onClick={next} size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                                            Get Started <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                )}

                                {/* 1. ROLE */}
                                {step === 1 && (
                                    <div className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-black text-slate-900">What is your role?</h2>
                                            <p className="text-slate-500 font-medium">This helps us tailor your roadmap.</p>
                                        </div>
                                        <div className="grid gap-4">
                                            <button
                                                onClick={() => { setRole("executor"); next(); }}
                                                className={cn(
                                                    "p-6 rounded-2xl border-2 text-left space-y-3 transition-all group",
                                                    role === "executor" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <ShieldCheck className="w-6 h-6 text-primary" />
                                                <div>
                                                    <h3 className="font-bold text-slate-900">Executor / Administrator</h3>
                                                    <p className="text-sm text-slate-500">I am responsible for managing the estate.</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => { setRole("heir"); next(); }}
                                                className={cn(
                                                    "p-6 rounded-2xl border-2 text-left space-y-3 transition-all group",
                                                    role === "heir" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <UserCircle className="w-6 h-6 text-indigo-500" />
                                                <div>
                                                    <h3 className="font-bold text-slate-900">Heir / Beneficiary</h3>
                                                    <p className="text-sm text-slate-500">I'm inheriting property or named in the will.</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 2. LOCATION */}
                                {step === 2 && (
                                    <div className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-black text-slate-900">Where was their residence?</h2>
                                            <p className="text-slate-500 font-medium">Probate laws vary significantly by state.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">State of Residence</Label>
                                            <Select
                                                value={data.state}
                                                onValueChange={(val) => { setData({ ...data, state: val }); next(); }}
                                            >
                                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-200">
                                                    <SelectValue placeholder="Select a State" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {US_STATES.map((state) => (
                                                        <SelectItem key={state.abbr} value={state.abbr}>
                                                            {state.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-slate-400 text-center uppercase tracking-tighter">Choose the state where the deceased lived permanently.</p>
                                        </div>
                                    </div>
                                )}

                                {/* 3. TITLING — how assets were held (the question that actually determines the path) */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-black text-slate-900">How were most of their assets held?</h2>
                                            <p className="text-slate-500 font-medium">This matters more than the total value.</p>
                                        </div>
                                        <div className="grid gap-3">
                                            {[
                                                { value: "sole", icon: Home, title: "House in their name alone + bank accounts", desc: "Real estate or accounts titled only in the decedent's name" },
                                                { value: "joint", icon: Users, title: "Joint accounts / named beneficiaries", desc: "Joint tenancy, TOD/POD, or beneficiary designations on most assets" },
                                                { value: "trust", icon: ScrollText, title: "A living trust", desc: "Most assets were titled in the name of a trust" },
                                                { value: "unsure", icon: HelpCircle, title: "I'm not sure", desc: "We'll help you figure this out during asset discovery" },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { setData({ ...data, titling: opt.value as any }); next(); }}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all",
                                                        data.titling === opt.value ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-300"
                                                    )}
                                                >
                                                    <opt.icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-sm">{opt.title}</h3>
                                                        <p className="text-xs text-slate-500">{opt.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 4. SCOPE GATE — screen out cases that need an attorney */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-black text-slate-900">One last check.</h2>
                                            <p className="text-slate-500 font-medium">Do any of these apply? Select all that fit — or none.</p>
                                        </div>
                                        <div className="grid gap-3">
                                            {SCOPE_RED_FLAGS.map((flag) => (
                                                <button
                                                    key={flag.id}
                                                    onClick={() => toggleRedFlag(flag.id)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all",
                                                        data.redFlags.includes(flag.id)
                                                            ? "border-amber-400 bg-amber-50"
                                                            : "border-slate-100 hover:border-slate-300"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
                                                        data.redFlags.includes(flag.id) ? "border-amber-500 bg-amber-500" : "border-slate-300"
                                                    )}>
                                                        {data.redFlags.includes(flag.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800">{flag.label}</p>
                                                </button>
                                            ))}
                                        </div>
                                        <Button onClick={next} size="lg" className="w-full h-14 rounded-2xl text-lg font-bold">
                                            {hasRedFlags ? "Continue" : "None of these apply"} <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                )}

                                {/* 5. DETAILS */}
                                {step === 5 && (
                                    <div className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-black text-slate-900">A few more details.</h2>
                                            <p className="text-slate-500 font-medium">This calculates your legal path (track).</p>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Their Full Name</Label>
                                                <Input
                                                    placeholder="e.g. John Doe"
                                                    value={data.deceasedName}
                                                    onChange={(e) => setData({ ...data, deceasedName: e.target.value })}
                                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Did they have a Will?</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button
                                                        variant={data.hasWill ? "default" : "outline"}
                                                        onClick={() => setData({ ...data, hasWill: true })}
                                                        className="h-12 rounded-xl font-bold"
                                                    >Yes, they did</Button>
                                                    <Button
                                                        variant={!data.hasWill ? "default" : "outline"}
                                                        onClick={() => setData({ ...data, hasWill: false })}
                                                        className="h-12 rounded-xl font-bold"
                                                    >No / Not Sure</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Estimated Total Assets</Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 250,000"
                                                        value={data.estimatedValue}
                                                        onChange={(e) => setData({ ...data, estimatedValue: e.target.value })}
                                                        className="h-14 pl-8 rounded-2xl bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic">Total value of bank accounts, real estate, and investments.</p>
                                            </div>
                                        </div>
                                        <Button onClick={next} disabled={!data.estimatedValue || !data.deceasedName} size="lg" className="w-full h-14 rounded-2xl text-lg font-bold">
                                            Analyze My Path
                                        </Button>
                                    </div>
                                )}

                                {/* 6. RESULT (PREVIEW) */}
                                {step === 6 && (
                                    <div className="space-y-8">
                                        {hasRedFlags ? (
                                            /* ── ATTORNEY OFF-RAMP ── */
                                            <>
                                                <div className="text-center space-y-2">
                                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-900">This one needs a professional.</h2>
                                                    <p className="text-slate-500 font-medium">And that's okay — here's why.</p>
                                                </div>
                                                <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 space-y-3">
                                                    <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                                        Based on what you selected, this estate has complications where mistakes create
                                                        <strong> personal liability</strong> for the executor — or permanent financial loss for the heirs.
                                                        Self-help tools (including ours) are the wrong fit here.
                                                    </p>
                                                    <ul className="text-xs text-amber-800 space-y-1.5 list-disc pl-5">
                                                        {data.redFlags.includes("contested") && <li>Disputed wills freeze estates for years and require litigation counsel</li>}
                                                        {data.redFlags.includes("minors") && <li>Distributions to minors require court-supervised guardianship accounts</li>}
                                                        {data.redFlags.includes("medical") && <li>Medi-Cal estate recovery claims must be resolved before any distribution</li>}
                                                        {data.redFlags.includes("multistate") && <li>Out-of-state property triggers a separate probate in that state</li>}
                                                    </ul>
                                                </div>
                                                <div className="space-y-4">
                                                    <Button onClick={() => navigate("/marketplace")} size="lg" className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20">
                                                        Find a Vetted Advisor <ArrowRight className="ml-2 w-6 h-6" />
                                                    </Button>
                                                    <button onClick={handleFinish} className="w-full text-sm text-slate-500 font-bold hover:text-slate-700 transition-colors">
                                                        I understand — continue with organizational tools only
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            /* ── PROVISIONAL RESULT ── */
                                            <>
                                                <div className="text-center space-y-2">
                                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-900">Your likely path</h2>
                                                    <p className="text-slate-500 font-medium">An initial estimate — it refines automatically as you add real account details.</p>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-indigo-50 border-2 border-indigo-100 space-y-4">
                                                    {data.titling === "trust" ? (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-lg">
                                                                    <ScrollText className="w-5 h-5" />
                                                                </div>
                                                                <h3 className="font-black text-emerald-900 uppercase tracking-tight">Trust Administration</h3>
                                                            </div>
                                                            <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                                                Good news: assets held in a living trust bypass probate entirely.
                                                                Your path is private trust administration — no court case, no statutory fees.
                                                            </p>
                                                        </>
                                                    ) : data.titling === "joint" ? (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-lg">
                                                                    <Users className="w-5 h-5" />
                                                                </div>
                                                                <h3 className="font-black text-emerald-900 uppercase tracking-tight">Direct Transfer</h3>
                                                            </div>
                                                            <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                                                Good news: jointly-held and beneficiary-designated assets transfer
                                                                directly to the survivors — usually with just a death certificate, no court.
                                                            </p>
                                                        </>
                                                    ) : recommendation ? (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg">
                                                                    <Scale className="w-5 h-5" />
                                                                </div>
                                                                <h3 className="font-black text-indigo-900 uppercase tracking-tight">
                                                                    {recommendation.type.replace('_', ' ')}
                                                                </h3>
                                                            </div>
                                                            <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                                                                {parseFloat(data.estimatedValue) <= recommendation.threshold
                                                                    ? `Good news: this estate likely qualifies for a simplified process — it's below the $${recommendation.threshold.toLocaleString()} ${data.state} threshold (2025–26).`
                                                                    : `Because the estate appears to exceed the $${recommendation.threshold.toLocaleString()} ${data.state} threshold (2025–26), a formal court process is the likely path.`
                                                                }
                                                            </p>
                                                        </>
                                                    ) : null}
                                                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold bg-white/50 p-3 rounded-xl border border-indigo-100">
                                                        <CheckCircle2 className="w-4 h-4" /> Initial estimate — not a legal determination
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Button onClick={handleFreeRoadmap} size="lg" className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                                        View My Free Roadmap <ArrowRight className="ml-2 w-6 h-6" />
                                                    </Button>
                                                    <button onClick={handleFinish} className="w-full text-sm text-slate-500 font-bold hover:text-slate-700 transition-colors">
                                                        Skip ahead — create my account now
                                                    </button>
                                                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                        <Lock className="w-3 h-3" /> Free — no account or credit card needed
                                                    </div>
                                                    <p className="text-center text-xs text-slate-400 leading-relaxed">
                                                        Your full step-by-step roadmap is free to view and print.
                                                        If you later want deadline tracking and auto-filled court forms,
                                                        every feature is free to try for 7 days.
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Confidential · Nothing is filed or shared</p>
                </div>
            </div>
        </div>
    );
}

