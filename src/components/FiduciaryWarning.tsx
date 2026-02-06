import React from 'react';
import { AlertTriangle, ShieldAlert, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FiduciaryRisk, RiskSeverity } from '@/lib/fiduciaryRiskEngine';
import { getRiskSeverityStyle } from '@/lib/fiduciaryRiskEngine';

interface FiduciaryWarningProps {
    risk: FiduciaryRisk;
    onDismiss?: () => void;
    onProceedAnyway?: () => void;
    showActions?: boolean;
    className?: string;
}

/**
 * Displays a fiduciary risk warning to the executor.
 * Used to prevent actions that could create personal liability.
 */
export function FiduciaryWarning({
    risk,
    onDismiss,
    onProceedAnyway,
    showActions = false,
    className
}: FiduciaryWarningProps) {
    const style = getRiskSeverityStyle(risk.severity);

    const Icon = getIconForSeverity(risk.severity);

    return (
        <div className={cn(
            'rounded-2xl border-2 p-4 space-y-3',
            style.bgColor,
            style.borderColor,
            className
        )}>
            <div className="flex items-start gap-3">
                <div className={cn(
                    'p-2 rounded-xl',
                    risk.severity === 'CRITICAL' ? 'bg-red-100' :
                        risk.severity === 'DANGER' ? 'bg-orange-100' :
                            risk.severity === 'WARNING' ? 'bg-yellow-100' :
                                'bg-blue-100'
                )}>
                    <Icon className={cn(
                        'w-5 h-5',
                        risk.severity === 'CRITICAL' ? 'text-red-600' :
                            risk.severity === 'DANGER' ? 'text-orange-600' :
                                risk.severity === 'WARNING' ? 'text-yellow-600' :
                                    'text-blue-600'
                    )} />
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <h4 className={cn(
                            'font-bold text-sm tracking-tight',
                            style.textColor
                        )}>
                            {style.icon} {risk.title}
                        </h4>
                        {risk.severity === 'CRITICAL' && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                BLOCKED
                            </span>
                        )}
                    </div>

                    <p className={cn('text-xs leading-relaxed', style.textColor)}>
                        {risk.description}
                    </p>

                    {risk.legalBasis && (
                        <p className="text-[10px] text-slate-500 italic mt-2">
                            Legal basis: {risk.legalBasis}
                        </p>
                    )}
                </div>
            </div>

            {/* Recommendation */}
            <div className="ml-11 p-3 bg-white/60 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">Recommendation:</p>
                <p className="text-xs text-slate-600">{risk.recommendation}</p>
            </div>

            {/* Actions */}
            {showActions && (risk.severity !== 'CRITICAL') && (
                <div className="ml-11 flex gap-2">
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Dismiss
                        </button>
                    )}
                    {onProceedAnyway && (
                        <button
                            onClick={onProceedAnyway}
                            className={cn(
                                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                                risk.severity === 'DANGER'
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
                            )}
                        >
                            I Understand, Proceed Anyway
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Compact inline warning for task lists
 */
export function InlineRiskBadge({ severity, label }: { severity: RiskSeverity; label?: string }) {
    const icons = {
        CRITICAL: '🚨',
        DANGER: '⚠️',
        WARNING: '⚡',
        INFO: 'ℹ️'
    };

    const colors = {
        CRITICAL: 'bg-red-100 text-red-700 border-red-200',
        DANGER: 'bg-orange-100 text-orange-700 border-orange-200',
        WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        INFO: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border',
            colors[severity]
        )}>
            {icons[severity]} {label || severity}
        </span>
    );
}

/**
 * Authority gate blocker overlay
 */
export function AuthorityBlocker({
    requiredDocument,
    prerequisiteTask,
    onNavigateToPrerequisite
}: {
    requiredDocument: string;
    prerequisiteTask?: string;
    onNavigateToPrerequisite?: () => void;
}) {
    return (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] rounded-2xl flex items-center justify-center p-4 z-10">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-4 max-w-sm text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>

                <div>
                    <h4 className="font-bold text-slate-900 text-sm">Authority Required</h4>
                    <p className="text-xs text-slate-600 mt-1">
                        This action requires <span className="font-semibold">{requiredDocument}</span>
                    </p>
                </div>

                {prerequisiteTask && onNavigateToPrerequisite && (
                    <button
                        onClick={onNavigateToPrerequisite}
                        className="w-full px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
                    >
                        Complete "{prerequisiteTask}" First
                    </button>
                )}
            </div>
        </div>
    );
}

function getIconForSeverity(severity: RiskSeverity) {
    switch (severity) {
        case 'CRITICAL':
            return XCircle;
        case 'DANGER':
            return AlertTriangle;
        case 'WARNING':
            return AlertTriangle;
        case 'INFO':
        default:
            return Info;
    }
}
