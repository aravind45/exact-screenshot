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
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";
import { US_STATES } from "@/lib/states";
import { SEO } from "@/components/SEO";

const STEPS = [
    { id: "intro", title: "Let's Start" },
    { id: "role", title: "Your Role" },
    { id: "location", title: "State" },
    { id: "details", title: "Estate Details" },
    { id: "result", title: "Your Roadmap" }
];

export default function DiscoveryQuiz() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [role, setRole] = useState<"executor" | "heir" | null>(null);
    const [data, setData] = useState({
        deceasedName: "",
        state: "",
        hasWill: true,
        estimatedValue: ""
    });

    const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const back = () => setStep(s => Math.max(s - 1, 0));

    const recommendation = data.state ? calculateAuthorityRecommendation([], data.state, {
        hasWill: data.hasWill,
        estimatedValue: parseFloat(data.estimatedValue) || 0,
        isSpouse: role === "executor" // Simplified assumption for the quiz
    }) : null;

    const handleFinish = () => {
        // Save discovery data to session storage for pre-filling signup
        sessionStorage.setItem("discovery_data", JSON.stringify({
            role,
            ...data,
            recommendation
        }));
        navigate("/auth?mode=signup");
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
                                                    <p className="text-sm text-slate-500">I am inherited property or named in a will.</p>
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

                                {/* 3. DETAILS */}
                                {step === 3 && (
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

                                {/* 4. RESULT (PREVIEW) */}
                                {step === 4 && recommendation && (
                                    <div className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900">Your Path Found</h2>
                                            <p className="text-slate-500 font-medium">Based on {data.state} thresholds.</p>
                                        </div>

                                        <div className="p-6 rounded-3xl bg-indigo-50 border-2 border-indigo-100 space-y-4">
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
                                                    ? `Good news: This estate likely qualifies for a simplified process since it is below the $${recommendation.threshold.toLocaleString()} threshold.`
                                                    : `Because the estate exceeds $${recommendation.threshold.toLocaleString()}, a formal court process is likely required.`
                                                }
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold bg-white/50 p-3 rounded-xl border border-indigo-100">
                                                <CheckCircle2 className="w-4 h-4" /> Instant Analysis Complete
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Button onClick={handleFinish} size="lg" className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                                Get Your Full Roadmap <ArrowRight className="ml-2 w-6 h-6" />
                                            </Button>
                                            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                <Lock className="w-3 h-3" /> Secure & Non-Binding
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Trusted by Fiduciaries Nationwide</p>
                    <div className="flex justify-center gap-8 opacity-40 grayscale">
                        <div className="h-6 bg-slate-300 w-24 rounded" />
                        <div className="h-6 bg-slate-300 w-24 rounded" />
                        <div className="h-6 bg-slate-300 w-24 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}

