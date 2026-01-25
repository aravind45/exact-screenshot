
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Clock,
    Phone,
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronRight,
    MessageCircle,
    Printer,
    ArrowRight,
    FileText,
    Gavel,
    CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowConfig } from "@/config/workflows/fidelity";
import { motion, AnimatePresence } from "framer-motion";

interface SettlementWorkflowProps {
    asset: any;
    workflow: WorkflowConfig;
    currentStepId: string;
    completedStepIds: string[];
    onStepSelect: (stepId: string) => void;
    onStepComplete: (stepId: string) => void;
    onLogCommunication: () => void;
    onSendFax: () => void;
    onGenerateLetter: () => void;
}

export function SettlementWorkflow({
    asset,
    workflow,
    currentStepId,
    completedStepIds,
    onStepSelect,
    onStepComplete,
    onLogCommunication,
    onSendFax,
    onGenerateLetter
}: SettlementWorkflowProps) {
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const renderText = (text: string | undefined): string => {
        if (!text) return "";
        let rendered = text;
        const replacements: Record<string, string> = {
            "{{institution}}": asset.institution || "Institution",
            "{{institutionPhone}}": asset.institutionPhone || "N/A",
            "{{deceasedName}}": estate ? `${estate.deceasedFirstName} ${estate.deceasedLastName}` : "the deceased",
            "{{userRole}}": "Executor",
            "{{ownershipType}}": asset.ownershipType || "Individual",
            "{{accountNumber}}": asset.accountNumber || "account",
        };

        Object.entries(replacements).forEach(([key, value]) => {
            rendered = rendered.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });

        return rendered;
    };

    const visibleSteps = workflow.steps.filter(step => {
        if (!step.condition) return true;
        return step.condition(asset);
    });

    const currentStepIndex = visibleSteps.findIndex(s => s.id === currentStepId);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case "important": return <AlertCircle className="w-5 h-5 text-red-500" />;
            case "caution": return <AlertCircle className="w-5 h-5 text-orange-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getAlertBg = (type: string) => {
        switch (type) {
            case "warning": return "bg-amber-50 border-amber-200 text-amber-900";
            case "important": return "bg-red-50 border-red-200 text-red-900";
            case "caution": return "bg-orange-50 border-orange-200 text-orange-900";
            default: return "bg-blue-50 border-blue-200 text-blue-900";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Settlement Action Plan</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 text-xs font-medium">Step-by-step track for {asset.institution}</p>
                            {estate?.probateStatus === 'EXECUTOR_APPOINTED' && asset.ownershipType === 'INDIVIDUAL' && (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px] h-5 py-0">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Authority Verified
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter">
                        {completedStepIds.length} / {visibleSteps.length} Completed
                    </span>
                </div>
            </div>

            <Accordion
                type="single"
                collapsible
                value={currentStepId}
                onValueChange={(val) => val && onStepSelect(val)}
                className="space-y-4"
            >
                {visibleSteps.map((step, index) => {
                    const isCompleted = completedStepIds.includes(step.id);
                    const isActive = step.id === currentStepId;

                    return (
                        <AccordionItem
                            key={step.id}
                            value={step.id}
                            className={cn(
                                "border rounded-2xl transition-all duration-300 overflow-hidden",
                                isActive ? "border-slate-300 shadow-md bg-white ring-1 ring-slate-200" : "border-slate-200 bg-slate-50/30",
                                isCompleted ? "bg-green-50/20 border-green-100" : ""
                            )}
                        >
                            <AccordionTrigger className="hover:no-underline px-5 py-4 group [&[data-state=open]>svg]:hidden">
                                <div className="flex items-center gap-4 text-left">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors",
                                        isCompleted ? "bg-green-600 text-white" :
                                            isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={cn(
                                                "font-bold text-base tracking-tight",
                                                isActive ? "text-slate-900" : "text-slate-500"
                                            )}>
                                                {renderText(step.title)}
                                            </h3>
                                            {isCompleted && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] h-4 leading-none py-0">
                                                    Done
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-5 pb-5 pt-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Horizontal Layout for Details & Tools */}
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
                                            <div className="lg:col-span-12 space-y-4">
                                                {/* Description Summary */}
                                                <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                                                    {renderText(step.description)}
                                                </p>

                                                {/* Alerts */}
                                                {step.alerts && step.alerts.length > 0 && (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {step.alerts.map((alert, i) => (
                                                            <div key={i} className={cn("flex items-start gap-2.5 p-3 rounded-xl border", getAlertBg(alert.type))}>
                                                                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                                                <p className="text-xs font-bold leading-normal italic">
                                                                    {renderText(alert.message)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-grid for Content vs Actions */}
                                            <div className="lg:col-span-7 space-y-5">
                                                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100/50">
                                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                        <Info className="w-3 h-3" />
                                                        Instructional Guidance
                                                    </h4>
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                        {renderText(step.guidance)}
                                                    </p>
                                                </div>

                                                {step.script && (
                                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 relative overflow-hidden group">
                                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Professional Script</h4>
                                                        <p className="text-xs font-bold text-slate-800 italic leading-relaxed">
                                                            "{renderText(step.script)}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="lg:col-span-5 space-y-5">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Tools</h4>
                                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Required for Compliance</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {step.id === "initial_notification" && (
                                                            <div className="space-y-2">
                                                                <Button
                                                                    variant="default"
                                                                    className="w-full justify-start gap-3 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm border-none"
                                                                    onClick={onGenerateLetter}
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    <div className="text-left">
                                                                        <p className="font-bold text-xs uppercase tracking-tight">Create Notification Letter</p>
                                                                        <p className="text-[9px] opacity-70 font-medium">Download formal PDF for their records</p>
                                                                    </div>
                                                                </Button>
                                                                <p className="px-1 text-[10px] text-slate-500 leading-tight italic">
                                                                    <strong>Purpose:</strong> Most institutions require a written notice to trigger formal estate protocols and freeze the account.
                                                                </p>
                                                            </div>
                                                        )}

                                                        {step.phone && (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start gap-3 h-10 border-slate-200 hover:bg-slate-50 rounded-xl"
                                                                onClick={() => window.location.href = `tel:${renderText(step.phone)}`}
                                                            >
                                                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                                                                <span className="font-bold text-xs">Call {renderText(step.phone)}</span>
                                                            </Button>
                                                        )}

                                                        <div className="space-y-2">
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start gap-3 h-12 border-slate-200 hover:bg-slate-50 rounded-xl"
                                                                onClick={onLogCommunication}
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5 text-slate-600" />
                                                                <div className="text-left">
                                                                    <p className="font-bold text-xs uppercase tracking-tight">Log History & Evidence</p>
                                                                    <p className="text-[9px] text-slate-500 font-medium">Record what you sent via Gmail/Outlook/Call</p>
                                                                </div>
                                                            </Button>
                                                            <p className="px-1 text-[10px] text-slate-500 leading-tight italic">
                                                                <strong>Purpose:</strong> This creates a "Chain of Evidence" for the court, proving you are actively securing estate assets.
                                                            </p>
                                                        </div>

                                                        {step.id === "submit_docs" && (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start gap-3 h-10 border-slate-200 hover:bg-slate-50 rounded-xl"
                                                                onClick={onSendFax}
                                                            >
                                                                <Printer className="w-3.5 h-3.5 text-blue-600" />
                                                                <span className="font-bold text-xs uppercase tracking-tight">Transmit via Fax</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {step.requiredDocs && step.requiredDocs.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Required Items</h4>
                                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 flex flex-wrap gap-2">
                                                            {step.requiredDocs.map((doc, i) => (
                                                                <Badge key={i} variant="outline" className="bg-white border-slate-200 text-[10px] font-bold text-slate-600 py-0.5">
                                                                    {renderText(doc)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{step.estimatedTime || "15m"} est.</span>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                {!isCompleted ? (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 sm:px-8 h-10 bg-green-600 hover:bg-green-700 font-bold text-xs"
                                                        onClick={() => onStepComplete(step.id)}
                                                        disabled={(step.id === "beneficiary_claim" || step.id === "trust_transition" || step.id === "final_distribution") && estate?.authorityStatus !== "GRANTED" && estate?.probateStatus !== "EXECUTOR_APPOINTED"}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Mark Done
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 sm:px-8 h-10 text-green-600 border-green-200 bg-green-50 text-xs"
                                                        disabled
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Completed
                                                    </Button>
                                                )}

                                                {currentStepIndex < visibleSteps.length - 1 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="flex-1 sm:px-6 h-10 font-bold text-slate-900 border border-slate-200 text-xs"
                                                        onClick={() => onStepSelect(visibleSteps[currentStepIndex + 1].id)}
                                                    >
                                                        Next Step
                                                        <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}
