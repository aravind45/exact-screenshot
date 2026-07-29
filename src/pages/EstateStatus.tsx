import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, HeartHandshake, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";

interface EstateStatusData {
    estateLabel: string;
    percentComplete: number;
    completedTasks: number;
    totalTasks: number;
    currentPhaseTitle: string;
    nextMilestone: string | null;
    isComplete: boolean;
    updatedAt: string;
}

/**
 * PUBLIC FAMILY STATUS PAGE (no login required)
 *
 * The link an executor texts to family so they can check progress themselves
 * instead of calling every week. Deliberately shows only: whose estate, how
 * far along, what's happening now, and what's next. Never shows asset
 * values, heir names, or account details.
 */
export default function EstateStatus() {
    const { estateId, token } = useParams<{ estateId: string; token: string }>();
    const [data, setData] = useState<EstateStatusData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/public/estate-status/${estateId}/${token}`);
                if (!res.ok) throw new Error(res.status === 404 ? "not-found" : "load-failed");
                const json = await res.json();
                if (!cancelled) setData(json);
            } catch (e: any) {
                if (!cancelled) setError(e.message === "not-found" ? "not-found" : "load-failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [estateId, token]);

    const updatedLabel = data?.updatedAt
        ? new Date(data.updatedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
        : null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <Link to="/" className="font-black text-lg text-slate-900 tracking-tight">
                        Expected<span className="text-primary">Estate</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex items-start justify-center p-4 pt-12">
                {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 mt-20" />
                ) : error || !data ? (
                    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
                        <h1 className="text-xl font-black text-slate-900">This link doesn't work</h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            The status link may have been mistyped or regenerated. Ask the person
                            handling the estate to send you a fresh link.
                        </p>
                    </div>
                ) : (
                    <div className="max-w-md w-full space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <HeartHandshake className="w-7 h-7 text-primary" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {data.estateLabel}'s estate
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">
                                A progress update from the person settling the estate
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
                            {/* Progress */}
                            <div className="space-y-3">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-4xl font-black text-slate-900">{data.percentComplete}%</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {data.completedTasks} of {data.totalTasks} steps
                                    </span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${data.percentComplete}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex gap-3">
                                    {data.isComplete ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                            {data.isComplete ? "Status" : "Currently working on"}
                                        </p>
                                        <p className="font-bold text-slate-800">{data.currentPhaseTitle}</p>
                                    </div>
                                </div>
                                {data.nextMilestone && (
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next milestone</p>
                                            <p className="font-bold text-slate-800">{data.nextMilestone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {updatedLabel && (
                                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                                    Last updated {updatedLabel}
                                </p>
                            )}
                        </div>

                        <div className="bg-indigo-50/60 rounded-2xl p-5 text-sm text-indigo-900 leading-relaxed">
                            <p className="font-bold mb-1">A note about timing</p>
                            <p>
                                Estate settlement has legally required waiting periods — for example,
                                months set aside for creditor claims — where progress looks paused but
                                the process is moving exactly as the law requires. Distributions can
                                only happen after those periods close.
                            </p>
                        </div>

                        <p className="text-center text-[11px] text-slate-400 leading-relaxed px-4">
                            This page intentionally shows progress only — no financial details, account
                            values, or personal information. Provided by ExpectedEstate, self-help
                            software (not a law firm).
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
