import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Printer, FileText, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunicationLogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CommunicationData) => void;
    isLoading?: boolean;
    templates?: Record<string, { subject: string; body: string }>;
    assetId?: string;
    workflowContext?: {
        title: string;
        description: string;
    };
    availableDocuments?: any[];
    initialData?: Partial<CommunicationData>;
}

export interface CommunicationData {
    method: string;
    subject: string;
    notes: string;
    occurredAt: string;
    type: string;
    direction: string;
    contactPerson?: string;
    statusChange?: string;
    recipientEmail?: string;
}

const methodIcons: Record<string, any> = {
    phone: Phone,
    email: Mail,
    fax: Printer,
    mail: FileText,
    portal: ExternalLink,
};

export function CommunicationLogDialog({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
    templates = {},
    assetId,
    workflowContext,
    availableDocuments = [],
    initialData
}: CommunicationLogDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [formData, setFormData] = useState<CommunicationData>({
        method: "email",
        subject: "",
        notes: "",
        occurredAt: new Date().toISOString().slice(0, 16),
        type: "initial_contact",
        direction: "outbound",
        contactPerson: "",
        statusChange: "none",
        recipientEmail: ""
    });

    const handleGenerateDraft = async () => {
        if (!assetId) {
            console.log("No assetId provided, skipping draft generation");
            return;
        }
        console.log("Generating draft for asset:", assetId, "with context:", workflowContext);
        setIsGenerating(true);
        try {
            const draft = await api.generateDraft(assetId, {
                workflowStepTitle: workflowContext?.title || "Initial Contact",
                workflowStepDescription: workflowContext?.description || "First communication with the institution"
            });
            console.log("Draft generated:", draft);
            if (draft && draft.subject && draft.notes) {
                setFormData(prev => ({
                    ...prev,
                    subject: draft.subject,
                    notes: draft.notes
                }));
            }
        } catch (error) {
            console.error("Failed to generate draft:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (open && !initialData && assetId) {
            console.log("Dialog opened, triggering auto-generation for asset:", assetId);
            handleGenerateDraft();
        } else if (open && initialData) {
            setFormData({
                method: initialData.method || "email",
                subject: initialData.subject || "",
                notes: initialData.notes || "",
                occurredAt: initialData.occurredAt ? new Date(initialData.occurredAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                type: initialData.type || "initial_contact",
                direction: initialData.direction || "outbound",
                contactPerson: initialData.contactPerson || "",
                statusChange: initialData.statusChange || "none",
                recipientEmail: initialData.recipientEmail || ""
            });
        }
    }, [open]);

    };

    const handleTemplateSelect = (templateKey: string) => {
        const template = templates[templateKey];
        if (template) {
            setFormData(prev => ({
                ...prev,
                subject: template.subject,
                notes: template.body
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Enrich notes with attachment info if any selected
        let finalNotes = formData.notes;
        if (selectedDocIds.length > 0) {
            const docNames = availableDocuments
                .filter(d => selectedDocIds.includes(d.id))
                .map(d => d.name)
                .join(", ");
            const attachmentNote = `\n\n[Attachments: ${docNames}]`;
            if (!finalNotes.includes("[Attachments:")) {
                finalNotes += attachmentNote;
            }
        }

        onSubmit({ ...formData, notes: finalNotes });
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset form after a short delay to avoid visual glitch
        setTimeout(() => {
            if (!initialData) {
                setFormData({
                    method: "email",
                    subject: "",
                    notes: "",
                    occurredAt: new Date().toISOString().slice(0, 16),
                    type: "initial_contact",
                    direction: "outbound",
                    contactPerson: "",
                    statusChange: "none",
                    recipientEmail: ""
                });
            }
        }, 200);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[720px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Log Activity & Communication</DialogTitle>
                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight max-w-[500px]">
                                <strong>Legal Purpose:</strong> Maintaining a detailed history of your interactions with {workflowContext?.title || 'the institution'} serves as "Due Diligence" evidence for the court and heirs.
                            </p>
                        </div>
                        {isGenerating && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 animate-pulse bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                <Sparkles className="w-3.5 h-3.5" />
                                Smart Drafting...
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 min-h-0">
                    <form id="comm-log-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Template Selector (if templates provided) */}
                        {Object.keys(templates).length > 0 && (
                            <div className="space-y-2">
                                <Label>Use Template</Label>
                                <Select onValueChange={handleTemplateSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a template (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(templates).map(key => (
                                            <SelectItem key={key} value={key}>
                                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* Method */}
                            <div className="space-y-2">
                                <Label htmlFor="method" className="text-[11px] font-bold text-slate-500">Method *</Label>
                                <Select
                                    value={formData.method}
                                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                                >
                                    <SelectTrigger id="method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(methodIcons).map(method => {
                                            const Icon = methodIcons[method];
                                            return (
                                                <SelectItem key={method} value={method}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-4 h-4" />
                                                        <span className="capitalize">{method}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Direction */}
                            <div className="space-y-2">
                                <Label htmlFor="direction" className="text-[11px] font-bold text-slate-500">Direction *</Label>
                                <Select
                                    value={formData.direction}
                                    onValueChange={(value) => setFormData({ ...formData, direction: value })}
                                >
                                    <SelectTrigger id="direction">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="outbound">Outbound (I contacted them)</SelectItem>
                                        <SelectItem value="inbound">Inbound (They contacted me)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Type */}
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-[11px] font-bold text-slate-500">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="initial_contact">Initial Contact</SelectItem>
                                        <SelectItem value="follow_up">Follow-up</SelectItem>
                                        <SelectItem value="document_submission">Document Submission</SelectItem>
                                        <SelectItem value="status_check">Status Check</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date/Time */}
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-[11px] font-bold text-slate-500">Date & Time *</Label>
                                <Input
                                    id="date"
                                    type="datetime-local"
                                    value={formData.occurredAt}
                                    onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Contact Person */}
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson" className="text-[11px] font-bold text-slate-500">Contact Person (optional)</Label>
                                <Input
                                    id="contactPerson"
                                    placeholder="e.g., John Doe, Rep #12345"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="h-10"
                                />
                            </div>

                            {/* Recipient Email (shown for email method) */}
                            {formData.method === "email" && (
                                <div className="space-y-2">
                                    <Label htmlFor="recipientEmail" className="text-[11px] font-bold text-slate-500">Recipient Email</Label>
                                    <Input
                                        id="recipientEmail"
                                        type="email"
                                        placeholder="e.g., claims@institution.com"
                                        value={formData.recipientEmail}
                                        onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                                        className="h-10"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Process Progress */}
                        <div className="space-y-2 px-4 py-3 bg-violet-50/50 border border-violet-100 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-violet-500">Process Progress</Label>
                                <span className="text-[8px] text-violet-600 font-bold italic">Updates Status</span>
                            </div>
                            <Select
                                value={formData.statusChange}
                                onValueChange={(value) => setFormData({ ...formData, statusChange: value })}
                            >
                                <SelectTrigger className="bg-white border-violet-200 h-9 text-xs">
                                    <SelectValue placeholder="Status change?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No status change</SelectItem>
                                    <SelectItem value="contacted">Institution Contacted</SelectItem>
                                    <SelectItem value="documents_submitted">Documents Sent/Received</SelectItem>
                                    <SelectItem value="in_review">Awaiting Their Decision</SelectItem>
                                    <SelectItem value="approved">Asset Released</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Attachments Section */}
                        {(formData.method === "email" || formData.method === "fax" || formData.method === "mail") && availableDocuments.length > 0 && (
                            <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Evidence Chain Documents</Label>
                                    <span className="text-[9px] text-blue-600 font-bold">Link Selected Items</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availableDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => {
                                                setSelectedDocIds(prev =>
                                                    prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                                );
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                                                selectedDocIds.includes(doc.id)
                                                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0",
                                                selectedDocIds.includes(doc.id) ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                            )}>
                                                {selectedDocIds.includes(doc.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-700 truncate">{doc.name}</p>
                                                <p className="text-[8px] text-slate-400 font-medium uppercase">{doc.documentType || doc.type || "Doc"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="text-[11px] font-bold text-slate-500">Subject *</Label>
                                <Input
                                    id="subject"
                                    placeholder="Brief summary of communication"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-[11px] font-bold text-slate-500">Detailed Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Detailed notes about the conversation..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={4}
                                    className="resize-none min-h-[100px]"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="px-6 py-3 border-t bg-slate-50 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading || isGenerating} className="font-bold text-slate-500 h-9">
                            Cancel
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        {assetId && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGenerateDraft}
                                disabled={isLoading || isGenerating}
                                className="gap-2 border-slate-200 h-9"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                                <span className="font-bold text-xs">Regenerate</span>
                            </Button>
                        )}
                        <Button
                            form="comm-log-form"
                            type="submit"
                            disabled={isLoading || isGenerating}
                            className="bg-primary hover:bg-primary/90 text-white font-bold h-9 px-6 shadow-sm"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Log Communication
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
