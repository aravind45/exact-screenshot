import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Download, Eye, Loader2, AlertCircle, CheckCircle2,
    Info, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface FLFormAutoFillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formId: string;
    formTitle: string;
}

type FieldSchema = {
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    overridable: boolean;
};

const FL_FORM_DESCRIPTIONS: Record<string, string> = {
    'FL-1': 'Petition for administration in Florida circuit court. Auto-filled with petitioner, county, and decedent details.',
    'FL-2': 'Summary administration petition. Uses estate value and heir summary data with a basis override when needed.',
    'FL-3': 'Notice of administration. Pre-fills core estate data and lets you provide the creditor deadline.',
    'FL-8': 'Statement of claim. Requires creditor-specific override details before download.',
    'FL-11': 'Petition for discharge and final distribution. Uses estate totals and lets you supply the distribution plan.',
    'FL-15': 'Homestead property petition. Requires property-specific overrides before the draft is generated.',
};

export function FLFormAutoFillDialog({ open, onOpenChange, formId, formTitle }: FLFormAutoFillDialogProps) {
    const [overrides, setOverrides] = useState<Record<string, any>>({});
    const [showAllFields, setShowAllFields] = useState(false);

    const { data: schemaData, isLoading: schemaLoading } = useQuery({
        queryKey: ['fl-form-schema', formId],
        queryFn: () => api.getFLFormSchema(formId),
        enabled: open && !!formId,
    });

    const { data: previewData, isLoading: previewLoading } = useQuery({
        queryKey: ['fl-form-preview', formId, overrides],
        queryFn: () => api.previewFLFormFields(formId, overrides),
        enabled: open && !!formId,
        staleTime: 0,
    });

    useEffect(() => {
        if (!open) {
            setOverrides({});
            setShowAllFields(false);
        }
    }, [open]);

    const generateMutation = useMutation({
        mutationFn: async ({ isPreview }: { isPreview: boolean }) => {
            const blob = await api.generateFLForm(formId, isPreview, overrides);

            if (!blob || blob.size === 0) {
                throw new Error(`Generated ${formId} file was empty`);
            }

            const normalizedType = (blob.type || "").toLowerCase();
            if (normalizedType.includes("text/html")) {
                throw new Error(`Server returned HTML instead of a PDF for ${formId}`);
            }

            return { blob, isPreview };
        },
        onSuccess: ({ blob, isPreview }) => {
            const url = window.URL.createObjectURL(blob);

            if (isPreview) {
                const previewTab = window.open(url, "_blank", "noopener,noreferrer");
                if (!previewTab) {
                    window.URL.revokeObjectURL(url);
                    toast.error("Preview blocked by browser popup settings");
                    return;
                }
                window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                toast.success("Preview opened in new tab");
                return;
            }

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${formId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            toast.success(`${formId} downloaded successfully`);
        },
        onError: (e: any) => {
            toast.error(`Failed to generate ${formId}: ${e.message || "Use Blank form as fallback."}`);
        },
    });

    const overrideFields = schemaData?.schema.filter(f => f.type !== 'checkbox') ?? [];

    const overridableFields = overrideFields.filter(f => f.overridable);
    const requiredOverrideFields = overridableFields.filter(f => f.required);
    const optionalOverrideFields = overridableFields.filter(f => !f.required);

    const validationErrors = previewData?.validationErrors ?? [];
    const fieldValues = previewData?.fieldValues ?? {};
    const isReady = validationErrors.length === 0;

    const handleFieldChange = useCallback((key: string, value: any) => {
        setOverrides(prev => ({ ...prev, [key]: value }));
    }, []);

    const renderFieldInput = (field: FieldSchema) => {
        if (field.type === 'currency') {
            return (
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={overrides[field.key] ?? ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        className="pl-7 h-9 text-sm border-gray-200 focus:border-primary/50"
                    />
                </div>
            );
        }

        if (field.type === 'date') {
            return (
                <Input
                    type="date"
                    value={overrides[field.key] ?? ''}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                    className="h-9 text-sm border-gray-200 focus:border-primary/50"
                />
            );
        }

        return (
            <Input
                type="text"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                value={overrides[field.key] ?? ''}
                onChange={e => handleFieldChange(field.key, e.target.value)}
                className="h-9 text-sm border-gray-200 focus:border-primary/50"
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white border-gray-200 p-0 gap-0 overflow-hidden rounded-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary px-2 py-0.5">
                                    {formId}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-300 text-emerald-700 bg-emerald-50 px-2 py-0.5">
                                    Auto-Fill (Beta)
                                </Badge>
                            </div>
                            <DialogTitle className="text-base font-bold text-gray-900 leading-tight">
                                {formTitle}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {FL_FORM_DESCRIPTIONS[formId] || 'Generate a pre-filled draft using your estate data.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="px-6 py-5 space-y-5">
                        {schemaLoading ? (
                            <div className="flex items-center justify-center py-8 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                <span className="text-sm">Loading form schema...</span>
                            </div>
                        ) : (
                            <>
                                <AnimatePresence>
                                    {previewLoading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200"
                                        >
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                            <span className="text-xs text-gray-500">Validating estate data...</span>
                                        </motion.div>
                                    ) : isReady ? (
                                        <motion.div
                                            key="ready"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                                Ready — all required fields found in your estate data
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="errors"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-amber-50 rounded-xl border border-amber-200"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                                                    Missing required data
                                                </span>
                                            </div>
                                            <ul className="space-y-1 pl-6 list-disc">
                                                {validationErrors.map((err, i) => (
                                                    <li key={i} className="text-xs text-amber-800">{err}</li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {requiredOverrideFields.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            Required Fields
                                        </p>
                                        {requiredOverrideFields.map(field => (
                                            <div key={field.key} className="space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Label className="text-xs font-semibold text-gray-700">
                                                        {field.label}
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </Label>
                                                    {field.description && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Info className="w-3 h-3 text-gray-400" />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs max-w-xs">
                                                                    {field.description}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                {renderFieldInput(field)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {Object.keys(fieldValues).length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                Resolved Preview Data
                                            </p>
                                            {optionalOverrideFields.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500"
                                                    onClick={() => setShowAllFields(prev => !prev)}
                                                >
                                                    {showAllFields ? (
                                                        <>
                                                            <ChevronUp className="w-3 h-3 mr-1" />
                                                            Hide Optional
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-3 h-3 mr-1" />
                                                            Show Optional
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                                            {requiredOverrideFields.map(field => (
                                                <div key={field.key} className="px-4 py-3 bg-white">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                                        {field.label}
                                                    </div>
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {String(fieldValues[field.key] ?? overrides[field.key] ?? '—')}
                                                    </div>
                                                </div>
                                            ))}

                                            <AnimatePresence>
                                                {showAllFields && optionalOverrideFields.map(field => (
                                                    <motion.div
                                                        key={field.key}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="px-4 py-3 bg-gray-50/50"
                                                    >
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                                            {field.label}
                                                        </div>
                                                        {renderFieldInput(field)}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>

                <Separator />

                <DialogFooter className="px-6 py-4 flex-row gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 border-gray-200"
                        onClick={() => generateMutation.mutate({ isPreview: true })}
                        disabled={generateMutation.isPending}
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Eye className="w-4 h-4 mr-2" />
                        )}
                        Preview
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 font-black uppercase tracking-widest text-[10px]",
                            isReady ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-200"
                        )}
                        onClick={() => generateMutation.mutate({ isPreview: false })}
                        disabled={generateMutation.isPending || !isReady}
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Download Draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
