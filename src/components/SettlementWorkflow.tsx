
import { Button } from "@/components/ui/button";
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
    FileText
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
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Process Navigator</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Step-by-step settlement workflow for {asset.institution}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-slate-700">
                        {completedStepIds.length} / {visibleSteps.length} Steps Complete
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
                    const isNext = index === currentStepIndex + 1;

                    return (
                        <AccordionItem
                            key={step.id}
                            value={step.id}
                            className={cn(
                                "border rounded-2xl transition-all duration-300 overflow-hidden",
                                isActive ? "border-primary shadow-xl ring-4 ring-primary/5 bg-white" : "border-slate-200 bg-white/50",
                                isCompleted ? "bg-green-50/30 border-green-100" : ""
                            )}
                        >
                            <AccordionTrigger className="hover:no-underline px-6 py-5 group [&[data-state=open]>svg]:hidden">
                                <div className="flex items-center gap-4 text-left">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                                        isCompleted ? "bg-green-600 text-white" :
                                            isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={cn(
                                                "font-bold text-lg tracking-tight",
                                                isActive ? "text-slate-900" : "text-slate-500"
                                            )}>
                                                {renderText(step.title)}
                                            </h3>
                                            {isCompleted && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] h-5">
                                                    Done
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1 font-medium">
                                            {renderText(step.description)}
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-6 pb-6 pt-2">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                            {/* Details & Help */}
                                            <div className="md:col-span-7 space-y-6">
                                                {/* Alerts */}
                                                {step.alerts && step.alerts.length > 0 && (
                                                    <div className="space-y-3">
                                                        {step.alerts.map((alert, i) => (
                                                            <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border", getAlertBg(alert.type))}>
                                                                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                                                <p className="text-sm font-semibold leading-relaxed">
                                                                    {renderText(alert.message)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* AUTHORITY PREREQUISITE ALERT */}
                                                {(step.id === "beneficiary_claim" || step.id === "trust_transition" || step.id === "final_distribution") &&
                                                    estate?.authorityStatus !== "GRANTED" && estate?.probateStatus !== "EXECUTOR_APPOINTED" && (
                                                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6 flex items-start gap-4">
                                                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-bold text-red-900 leading-none mb-1">Legal Prerequisite Error</p>
                                                                <p className="text-xs text-red-800 font-medium">
                                                                    {asset.ownershipType === "INDIVIDUAL"
                                                                        ? "Institutional access is locked until you upload your Letters Testamentary."
                                                                        : "Institutional access is locked until you submit the Small Estate Affidavit."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                                                        <Info className="w-3.5 h-3.5" />
                                                        Instructional Guidance
                                                    </h4>
                                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                        {renderText(step.guidance)}
                                                    </p>
                                                </div>

                                                {step.script && (
                                                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                                            <MessageCircle className="w-12 h-12" />
                                                        </div>
                                                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Professional Script</h4>
                                                        <p className="text-sm font-semibold text-slate-700 italic leading-relaxed">
                                                            "{renderText(step.script)}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Tools */}
                                            <div className="md:col-span-5 space-y-6">
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Essential Tools</h4>
                                                    <div className="flex flex-col gap-2">
                                                        {step.id === "initial_notification" && (
                                                            <Button
                                                                variant="default"
                                                                className="w-full justify-start gap-4 h-16 bg-primary hover:bg-primary/90 text-white transition-all rounded-xl shadow-lg shadow-primary/20 border-none"
                                                                onClick={onGenerateLetter}
                                                            >
                                                                <div className="p-2 rounded-lg bg-white/20 text-white">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-tighter leading-none mb-1">Priority Action</p>
                                                                    <p className="font-bold text-sm">Generate Settlement Notice</p>
                                                                </div>
                                                            </Button>
                                                        )}

                                                        {step.phone && (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start gap-4 h-14 border-slate-200 hover:border-primary/50 transition-all rounded-xl shadow-sm"
                                                                onClick={() => window.location.href = `tel:${renderText(step.phone)}`}
                                                            >
                                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                                    <Phone className="w-4 h-4" />
                                                                </div>
                                                                <div className="text-left min-w-0">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none mb-1">Direct Line</p>
                                                                    <p className="font-bold text-sm text-slate-700 truncate">{renderText(step.phone)}</p>
                                                                </div>
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start gap-4 h-14 border-slate-200 hover:border-primary/50 transition-all rounded-xl shadow-sm"
                                                            onClick={onLogCommunication}
                                                        >
                                                            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none mb-1">Compliance Log</p>
                                                                <p className="font-bold text-sm text-slate-700">Record Progress</p>
                                                            </div>
                                                        </Button>

                                                        {step.id === "submit_documents" && (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start gap-4 h-14 border-slate-200 hover:border-primary/50 transition-all rounded-xl shadow-sm"
                                                                onClick={onSendFax}
                                                            >
                                                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                                                    <Printer className="w-4 h-4" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none mb-1">Secure Send</p>
                                                                    <p className="font-bold text-sm text-slate-700">Transmit via Fax</p>
                                                                </div>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {step.requiredDocs && step.requiredDocs.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Required Records</h4>
                                                        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
                                                            {step.requiredDocs.map((doc, i) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0">
                                                                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-slate-600 leading-tight">{renderText(doc)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">{step.estimatedTime || "15 minutes"} est.</span>
                                            </div>
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                {!isCompleted ? (
                                                    <Button
                                                        size="lg"
                                                        className="flex-1 sm:px-10 gap-2 bg-green-600 hover:bg-green-700 font-bold shadow-lg shadow-green-600/20"
                                                        onClick={() => onStepComplete(step.id)}
                                                        disabled={(step.id === "beneficiary_claim" || step.id === "trust_transition" || step.id === "final_distribution") && estate?.authorityStatus !== "GRANTED" && estate?.probateStatus !== "EXECUTOR_APPOINTED"}
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Mark Step Done
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="lg"
                                                        variant="outline"
                                                        className="flex-1 sm:px-10 gap-2 text-green-600 border-green-200 bg-green-50"
                                                        disabled
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Step Completed
                                                    </Button>
                                                )}

                                                {currentStepIndex < visibleSteps.length - 1 && (
                                                    <Button
                                                        size="lg"
                                                        variant="secondary"
                                                        className="flex-1 sm:px-10 gap-2 font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all border-none"
                                                        onClick={() => onStepSelect(visibleSteps[currentStepIndex + 1].id)}
                                                    >
                                                        Proceed
                                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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
