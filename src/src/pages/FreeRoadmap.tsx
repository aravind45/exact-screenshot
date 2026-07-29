import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { US_STATES } from "@/lib/states";
import { StateCoverageNotice } from "@/components/StateCoverageNotice";
import { ArrowRight, Clock, Printer, Scale, ShieldCheck } from "lucide-react";

interface DiscoveryData {
    role?: "executor" | "heir";
    deceasedName?: string;
    state?: string;
    hasWill?: boolean;
    estimatedValue?: string;
    titling?: "" | "sole" | "joint" | "trust" | "unsure";
    redFlags?: string[];
    recommendation?: {
        type: any;
        masterMode: string;
        activeEngines: any[];
        modifiers?: string[];
        threshold: number;
        reason?: string;
    } | null;
    needsAttorney?: boolean;
}

/**
 * FREE ROADMAP — no account required.
 *
 * This page is the honest fulfillment of the landing-page promise
 * "Get My Free Roadmap". The quiz hands off its answers via
 * sessionStorage, the roadmap is generated entirely client-side, and the
 * visitor can read or print it without ever signing up. The paid product
 * is the *execution* of this plan: deadline tracking, auto-filled court
 * forms, accounting, and attorney review.
 */
export default function FreeRoadmap() {
    const navigate = useNavigate();

    const discovery = useMemo<DiscoveryData | null>(() => {
        try {
            const raw = sessionStorage.getItem("discovery_data");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    const phases = useMemo(() => {
        if (!discovery?.state) return [];
        const rec = discovery.recommendation;
        const authorityType = rec?.type ?? "DISCOVERY";
        return generateRoadmap(
            authorityType,
            discovery.state,
            rec?.modifiers ?? [],
            rec?.activeEngines ?? [],
            discovery.hasWill ?? true
        );
    }, [discovery]);

    if (!discovery || !discovery.state) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-black text-slate-900 mb-3">Start with the 2-minute intake</h1>
                <p className="text-slate-500 mb-8 max-w-md">
                    Your roadmap is built from your answers. It takes about two minutes and
                    stays free — no account, no credit card.
                </p>
                <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => navigate("/start")}>
                    Get My Free Roadmap <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        );
    }

    const stateName = US_STATES.find(s => s.abbr === discovery.state)?.name ?? discovery.state;
    const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0);
    const firstName = discovery.deceasedName?.trim().split(/\s+/)[0];

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            {/* Header — hidden when printing */}
            <header className="bg-white border-b border-slate-200 print:hidden">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="font-black text-lg text-slate-900 tracking-tight">
                        Expected<span className="text-primary">Estate</span>
                    </Link>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                        </Button>
                        <Button size="sm" className="rounded-full font-bold" onClick={() => navigate("/auth?mode=signup")}>
                            Track this roadmap <ArrowRight className="ml-1.5 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
                {/* Title */}
                <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                        Your free personalized roadmap
                    </p>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        {firstName ? `Settling ${firstName}'s estate` : "Your estate settlement plan"} — {stateName}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {phases.length} phases · {totalTasks} steps
                        {discovery.recommendation?.masterMode === "COURT_SUPERVISED" && " · Court-supervised process expected"}
                        {discovery.recommendation?.masterMode === "TRANSFER_ONLY" && " · Likely no court process needed"}
                        {discovery.recommendation?.masterMode === "FIDUCIARY_ADMINISTERED" && " · Trust administration path"}
                    </p>
                </div>

                {discovery.needsAttorney && (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 leading-relaxed">
                        <p className="font-bold mb-1">You flagged complications</p>
                        <p>
                            Based on your quiz answers, parts of this estate likely need a lawyer.
                            Use this roadmap for organization, and{" "}
                            <Link to="/marketplace" className="font-bold underline">connect with a vetted advisor</Link>{" "}
                            for the legal questions.
                        </p>
                    </div>
                )}

                <StateCoverageNotice state={discovery.state} />

                {/* Phases */}
                <div className="space-y-6">
                    {phases.map((phase, idx) => (
                        <section key={phase.phase} className="bg-white rounded-3xl border border-slate-200 overflow-hidden break-inside-avoid">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shrink-0">
                                    {idx + 1}
                                </span>
                                <div>
                                    <h2 className="font-black text-slate-900">{phase.title}</h2>
                                    {phase.description && (
                                        <p className="text-xs text-slate-500 font-medium">{phase.description}</p>
                                    )}
                                </div>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {phase.tasks.map(task => (
                                    <li key={task.id} className="px-6 py-4 flex gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                                            {task.description && (
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            {task.estimatedTime && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <Clock className="w-3 h-3" /> {task.estimatedTime}
                                                </span>
                                            )}
                                            {task.category === "court-issued" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                    <Scale className="w-3 h-3" /> Court required
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                {/* CTA — hidden when printing */}
                <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-center space-y-5 print:hidden">
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        This plan is free. Executing it is the hard part.
                    </h2>
                    <p className="text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
                        ExpectedEstate tracks every deadline, auto-fills your court forms, keeps the
                        fiduciary accounting the court expects, and flags the steps that carry
                        personal liability. Try everything free for 7 days.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-14 px-10 rounded-full text-lg font-bold bg-white text-slate-900 hover:bg-slate-100" onClick={() => navigate("/auth?mode=signup")}>
                            Save & Track My Roadmap <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg font-bold border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate("/pricing")}>
                            See pricing
                        </Button>
                    </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-2 max-w-2xl">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    ExpectedEstate provides self-help software and organizational tools. We are not a
                    law firm and do not provide legal advice. This roadmap is an educational
                    estimate based on your answers — not a legal determination.
                </p>
            </main>
        </div>
    );
}
