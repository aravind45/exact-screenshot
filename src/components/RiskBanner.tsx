import React from 'react';
import { cn } from "@/lib/utils";
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
                    className={cn(
                        "py-2 px-3 rounded-xl border",
                        risk.level === 'CRITICAL' ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'
                    )}
                >
                    {risk.level === 'CRITICAL' ? (
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <AlertTitle className={cn(
                        "text-xs font-black tracking-tight",
                        risk.level === 'CRITICAL' ? 'text-red-900' : 'text-amber-900'
                    )}>
                        {risk.title}
                    </AlertTitle>
                    <AlertDescription className={risk.level === 'CRITICAL' ? 'text-red-800' : 'text-amber-800'}>
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-medium leading-relaxed">{risk.description}</p>
                            {risk.mitigation && (
                                <p className="text-[10px] font-black mt-0.5 flex items-center gap-1 uppercase tracking-widest text-current/70">
                                    <Info className="w-2.5 h-2.5" />
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
        <Card className="border-indigo-100 bg-indigo-50/30 rounded-xl overflow-hidden">
            <CardHeader className="py-2.5 px-3">
                <CardTitle className="text-[10px] font-black text-indigo-900 flex items-center gap-1.5 uppercase tracking-widest">
                    <Scale className="w-3 h-3" />
                    Compliance Monitor
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
                <div className="space-y-1.5">
                    <div className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p className="text-[10px] text-indigo-900 leading-normal italic font-medium">
                            "{recommendation.reason}"
                        </p>
                    </div>

                    {recommendation.citations && recommendation.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {recommendation.citations.map((cite: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1 bg-white border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-black">
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    {cite}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-[9px] text-indigo-400 mt-1 font-bold uppercase tracking-tighter">
                        Informational logic only. Not legal advice.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
