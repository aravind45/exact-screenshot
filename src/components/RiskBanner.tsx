import React from 'react';
import { AlertCircle, ShieldAlert, Info, ExternalLink, Scale } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useWorkflow } from '@/contexts/WorkflowContext';

export function RiskBanner() {
    const { legalRisks } = useWorkflow();

    if (legalRisks.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            {legalRisks.map((risk) => (
                <Alert
                    key={risk.id}
                    variant={risk.level === 'CRITICAL' ? 'destructive' : 'default'}
                    className={risk.level === 'CRITICAL' ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'}
                >
                    {risk.level === 'CRITICAL' ? (
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <AlertTitle className={risk.level === 'CRITICAL' ? 'text-red-900 font-bold' : 'text-amber-900 font-bold'}>
                        {risk.title}
                    </AlertTitle>
                    <AlertDescription className={risk.level === 'CRITICAL' ? 'text-red-800' : 'text-amber-800'}>
                        <div className="flex flex-col gap-2">
                            <p>{risk.description}</p>
                            {risk.mitigation && (
                                <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Mitigation: {risk.mitigation}
                                </p>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}

export function AuthorityDecisionGuide({ recommendation }: { recommendation: any }) {
    if (!recommendation || recommendation.type === 'UNSET') return null;

    return (
        <Card className="border-indigo-100 bg-indigo-50/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Compliance Engine: Deterministic Path Selection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p className="text-sm text-indigo-900 leading-relaxed italic">
                            "{recommendation.reason}"
                        </p>
                    </div>

                    {recommendation.citations && recommendation.citations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {recommendation.citations.map((cite: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-[10px] uppercase font-black">
                                    <ExternalLink className="w-3 h-3" />
                                    {cite}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-[11px] text-indigo-400 mt-2">
                        Logic designed to align with state-specific probate code and fiduciary standards.
                        Adjusting case parameters will update this determination.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
