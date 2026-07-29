import React from "react";
import { ArrowRight, Info } from "lucide-react";

interface ScreenIntroAction {
    label: string;
    onClick: () => void;
}

interface ScreenIntroProps {
    /** One plain-English sentence answering "what is this screen?" */
    what: string;
    /** Optional next-action strip — the single most useful thing to do here */
    action?: ScreenIntroAction;
}

/**
 * ScreenIntro — the standard top-of-screen anatomy for heavy feature pages.
 *
 * Rule: every screen answers two questions before showing any tooling:
 *   1. "What is this?"  — one plain-English line, no jargon
 *   2. "What now?"      — at most ONE highlighted next action
 *
 * Power features belong below the fold or inside an Advanced drawer, never
 * competing with these two answers at the top of the page.
 */
export function ScreenIntro({ what, action }: ScreenIntroProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-slate-500 leading-relaxed max-w-3xl">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                <p className="font-medium">{what}</p>
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                    {action.label}
                    <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

interface AdvancedSectionProps {
    title?: string;
    children: React.ReactNode;
}

/**
 * AdvancedSection — a collapsed drawer for power features. Content is hidden
 * by default so screens open calm; executors who want depth opt in.
 */
export function AdvancedSection({ title = "Advanced options", children }: AdvancedSectionProps) {
    return (
        <details className="rounded-2xl border border-slate-200 bg-slate-50/50 group">
            <summary className="cursor-pointer list-none px-5 py-3.5 flex items-center justify-between text-sm font-bold text-slate-600 hover:text-slate-900 select-none">
                <span>{title}</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-open:rotate-180 transition-transform">
                    ▾
                </span>
            </summary>
            <div className="px-5 pb-5 pt-1 border-t border-slate-200/60">
                {children}
            </div>
        </details>
    );
}
