import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Circle,
    Clock,
    Phone,
    FileText,
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronRight,
    MessageCircle,
    Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowConfig, WorkflowStep } from "@/config/workflows/fidelity";
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
}

export function SettlementWorkflow({
    asset,
    workflow,
    currentStepId,
    completedStepIds,
    onStepSelect,
    onStepComplete,
    onLogCommunication,
    onSendFax
}: SettlementWorkflowProps) {

    // Get Estate Context (proactive check for probate status)
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

    // Filter steps based on asset context and conditions
    const visibleSteps = workflow.steps.filter(step => {
        if (!step.condition) return true;
        return step.condition(asset);
    });

    const currentStepIndex = visibleSteps.findIndex(s => s.id === currentStepId);

    // Fallback if current step is hidden
    const effectiveStepId = currentStepId === "initial_contact" ? visibleSteps[0].id : currentStepId;
    const currentStep = visibleSteps.find(s => s.id === effectiveStepId) || visibleSteps[0];

    // Check for legal blocking
    const isBlockedByProbate =
        currentStep.id === "probate_filing" &&
        estate?.probateStatus !== "EXECUTOR_APPOINTED" &&
        asset.ownershipType === "INDIVIDUAL";

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case "important": return <AlertCircle className="w-5 h-5 text-destructive" />;
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: Step List */}
            <div className="lg:col-span-1 space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground px-2">
                    Settlement Progress
                </h3>
                <div className="space-y-1">
                    {visibleSteps.map((step, index) => {
                        const isCompleted = completedStepIds.includes(step.id);
                        const isActive = step.id === currentStep.id;

                        return (
                            <button
                                key={step.id}
                                onClick={() => onStepSelect(step.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                                        : isCompleted
                                            ? "text-primary hover:bg-primary/10"
                                            : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                                            isActive ? "border-primary-foreground" : "border-muted-foreground"
                                        )}>
                                            {index + 1}
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm truncate">{renderText(step.title)}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content: Current Step Details */}
            <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-none shadow-lg overflow-hidden glass-morphism">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <CardHeader className="pb-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                            {renderText(currentStep.title)}
                                            {completedStepIds.includes(currentStep.id) && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                    Completed
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            {renderText(currentStep.description)}
                                        </CardDescription>
                                    </div>
                                    {currentStep.estimatedTime && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                            <Clock className="w-4 h-4" />
                                            <span>{currentStep.estimatedTime}</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Alerts/Callouts */}
                                {currentStep.alerts && currentStep.alerts.length > 0 && (
                                    <div className="space-y-3">
                                        {currentStep.alerts.map((alert, i) => (
                                            <div key={i} className={cn("flex items-start gap-4 p-4 rounded-xl border", getAlertBg(alert.type))}>
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getAlertIcon(alert.type)}
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed">
                                                    {renderText(alert.message)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Specific Guidance */}
                                {currentStep.guidance && (
                                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <Info className="w-4 h-4 text-primary" />
                                            Pro Guidance
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {renderText(currentStep.guidance)}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Action Items/Checklist */}
                                    {currentStep.requiredDocs && currentStep.requiredDocs.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                                Required Documents
                                            </h4>
                                            <ul className="space-y-3">
                                                {currentStep.requiredDocs.map((doc, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-border/10">
                                                        <div className="w-5 h-5 rounded border border-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <div className="w-3 h-3 bg-primary rounded-sm opacity-0" />
                                                        </div>
                                                        <span className="text-sm text-foreground/80 leading-snug">{doc}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Actions & Tools */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                            Available Tools
                                        </h4>
                                        <div className="flex flex-col gap-3">
                                            {currentStep.phone && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start gap-3 h-12 shadow-sm hover:translate-x-1 transition-transform"
                                                    onClick={() => window.location.href = `tel:${currentStep.phone}`}
                                                >
                                                    <Phone className="w-5 h-5 text-primary" />
                                                    <div className="text-left">
                                                        <p className="text-xs text-muted-foreground">Call Institution</p>
                                                        <p className="font-semibold">{renderText(currentStep.phone)}</p>
                                                    </div>
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start gap-3 h-12 shadow-sm hover:translate-x-1 transition-transform"
                                                onClick={onLogCommunication}
                                            >
                                                <MessageCircle className="w-5 h-5 text-primary" />
                                                <div className="text-left">
                                                    <p className="text-xs text-muted-foreground">Keep Records</p>
                                                    <p className="font-semibold">Log Communication & Notes</p>
                                                </div>
                                            </Button>

                                            {currentStep.id === "submit_documents" && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start gap-3 h-12 shadow-sm hover:translate-x-1 transition-transform"
                                                    onClick={onSendFax}
                                                >
                                                    <Printer className="w-5 h-5 text-primary" />
                                                    <div className="text-left">
                                                        <p className="text-xs text-muted-foreground">Fax Documents</p>
                                                        <p className="font-semibold">Securely Fax Documents</p>
                                                    </div>
                                                </Button>
                                            )}
                                        </div>

                                        {currentStep.script && (
                                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-4">
                                                <h5 className="text-xs font-bold text-primary uppercase mb-2">Talking Script</h5>
                                                <p className="text-sm italic text-muted-foreground leading-relaxed">
                                                    "{renderText(currentStep.script)}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-between items-center pt-6 border-t border-border/50">
                                    <div className="text-sm text-muted-foreground italic">
                                        {completedStepIds.includes(currentStep.id)
                                            ? "✓ You've finished this step."
                                            : "Tip: Log your call before marking this as complete."}
                                    </div>
                                    <div className="flex gap-3">
                                        {!completedStepIds.includes(currentStep.id) ? (
                                            <Button
                                                size="lg"
                                                variant="default"
                                                className="px-8 gap-2 bg-green-600 hover:bg-green-700 shadow-md"
                                                onClick={() => onStepComplete(currentStep.id)}
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                Mark as Complete
                                            </Button>
                                        ) : (
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                className="px-8 gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                                                disabled
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                Already Completed
                                            </Button>
                                        )}

                                        {currentStepIndex < visibleSteps.length - 1 && (
                                            <Button
                                                size="lg"
                                                variant="secondary"
                                                className="px-8 gap-2 group shadow-sm"
                                                onClick={() => onStepSelect(visibleSteps[currentStepIndex + 1].id)}
                                            >
                                                <span>Next Step: {renderText(visibleSteps[currentStepIndex + 1].title)}</span>
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
