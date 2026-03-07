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

interface NYFormAutoFillDialogProps {
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

const NY_FORM_DESCRIPTIONS: Record<string, string> = {
    'ET-1': 'Petition to admit a will to probate and appoint an executor. Auto-filled with decedent and petitioner details.',
    'ET-2': 'Petition for administration when there is no will. Auto-filled with decedent and heir summaries.',
    'ET-3': 'Ancillary probate petition for out-of-state wills. Requires foreign probate details.',
    'ET-8': 'Inventory of estate assets. Auto-filled from your asset list and valuations.',
    'ET-13': 'Petition for final distribution. Includes estate totals and distribution plan summary.',
};

export function NYFormAutoFillDialog({ open, onOpenChange, formId, formTitle }: NYFormAutoFillDialogProps) {
    const [overrides, setOverrides] = useState<Record<string, any>>({});
    const [showAllFields, setShowAllFields] = useState(false);

    const { data: schemaData, isLoading: schemaLoading } = useQuery({
        queryKey: ['ny-form-schema', formId],
        queryFn: () => api.getNYFormSchema(formId),
        enabled: open && !!formId,
    });

    const { data: previewData, isLoading: previewLoading } = useQuery({
        queryKey: ['ny-form-preview', formId, overrides],
        queryFn: () => api.previewNYFormFields(formId, overrides),
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
            const blob = await api.generateNYForm(formId, isPreview, overrides);

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
                                {NY_FORM_DESCRIPTIONS[formId] || 'Generate a pre-filled draft using your estate data.'}
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
                                                Auto-Filled from Estate Data
                                            </p>
                                            <button
                                                onClick={() => setShowAllFields(v => !v)}
                                                className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
                                            >
                                                {showAllFields ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                {showAllFields ? 'Hide' : 'Show all'}
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {showAllFields && (
                                                <motion.div
                                                    key="all-fields"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        {Object.entries(fieldValues)
                                                            .filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
                                                            .slice(0, 20)
                                                            .map(([key, value]) => {
                                                                const schemaDef = schemaData?.schema.find(s => s.key === key);
                                                                return (
                                                                    <div key={key} className="min-w-0">
                                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 truncate">
                                                                            {schemaDef?.label || key}
                                                                        </p>
                                                                        <p className="text-xs text-gray-700 truncate">
                                                                            {typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : String(value)}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {!showAllFields && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(fieldValues)
                                                    .filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
                                                    .slice(0, 5)
                                                    .map(([key, value]) => {
                                                        const schemaDef = schemaData?.schema.find(s => s.key === key);
                                                        return (
                                                            <div key={key} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase">
                                                                    {schemaDef?.label || key}:
                                                                </span>
                                                                <span className="text-[10px] text-gray-700 font-medium max-w-[120px] truncate">
                                                                    {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                {Object.keys(fieldValues).length > 5 && (
                                                    <button
                                                        onClick={() => setShowAllFields(true)}
                                                        className="px-2 py-1 text-[9px] font-bold text-primary bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10"
                                                    >
                                                        +{Object.keys(fieldValues).length - 5} more
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {optionalOverrideFields.length > 0 && (
                                    <div className="space-y-3">
                                        <Separator />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            Optional Overrides
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {optionalOverrideFields.map(field => (
                                                <div key={field.key} className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-medium text-gray-600">
                                                            {field.label}
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
                                    </div>
                                )}

                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-blue-700 leading-relaxed">
                                        This generates a structured draft for attorney review. Upload the official Surrogate's Court
                                        PDF template via Admin → Templates to enable field-level auto-fill.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-row gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl"
                        disabled={generateMutation.isPending}
                    >
                        Cancel
                    </Button>

                    <div className="flex-1" />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateMutation.mutate({ isPreview: true })}
                        disabled={generateMutation.isPending || schemaLoading || !isReady}
                        className="border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl"
                    >
                        {generateMutation.isPending && generateMutation.variables?.isPreview ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Eye className="w-4 h-4 mr-2" />
                        )}
                        Preview
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => generateMutation.mutate({ isPreview: false })}
                        disabled={generateMutation.isPending || schemaLoading || !isReady}
                        className={cn(
                            "rounded-xl font-bold text-xs uppercase tracking-wider",
                            isReady
                                ? "bg-primary hover:bg-primary/90 text-white"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        )}
                    >
                        {generateMutation.isPending && !generateMutation.variables?.isPreview ? (
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

