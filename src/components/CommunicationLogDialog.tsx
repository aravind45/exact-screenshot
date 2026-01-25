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
}: CommunicationLogDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [formData, setFormData] = useState<CommunicationData>({
        method: "phone",
        subject: "",
        notes: "",
        occurredAt: new Date().toISOString().slice(0, 16),
        type: "follow_up",
        direction: "outbound",
        contactPerson: "",
        statusChange: "none"
    });

    useEffect(() => {
        if (open && assetId && !formData.subject && !formData.notes) {
            handleGenerateDraft();
        }
    }, [open, assetId]);

    const handleGenerateDraft = async () => {
        if (!assetId) return;
        setIsGenerating(true);
        try {
            const draft = await api.generateDraft(assetId, {
                workflowStepTitle: workflowContext?.title,
                workflowStepDescription: workflowContext?.description
            });
            if (draft) {
                setFormData(prev => ({
                    ...prev,
                    subject: draft.subject || prev.subject,
                    notes: draft.notes || prev.notes
                }));
            }
        } catch (error) {
            console.error("Failed to generate draft:", error);
        } finally {
            setIsGenerating(false);
        }
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
            setFormData({
                method: "phone",
                subject: "",
                notes: "",
                occurredAt: new Date().toISOString().slice(0, 16),
                type: "follow_up",
                direction: "outbound",
                contactPerson: "",
                statusChange: "none"
            });
        }, 200);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <DialogTitle>Log Activity & Communication</DialogTitle>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">
                                <strong>Legal Purpose:</strong> Maintaining a detailed history of your interactions with {workflowContext?.title || 'the institution'} serves as "Due Diligence" evidence for the court and heirs.
                            </p>
                        </div>
                        {isGenerating && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-primary animate-pulse">
                                <Sparkles className="w-3.5 h-3.5" />
                                Smart Drafting...
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl mb-2 flex items-start gap-3">
                    <div className="p-1.5 bg-white rounded-lg border border-blue-100 text-blue-600 shadow-sm">
                        <Loader2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-blue-900 leading-tight">📤 Personal Email Usage</p>
                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                            Send messages using your own email (e.g. Gmail/Outlook). <strong>Log the activity here afterwards</strong> so it's included in your Verified Settlement History.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            <Label htmlFor="method">Method *</Label>
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
                            <Label htmlFor="direction">Direction *</Label>
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
                            <Label htmlFor="type">Type</Label>
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
                            <Label htmlFor="date">Date & Time *</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                value={formData.occurredAt}
                                onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Outcome & Status Progress */}
                    <div className="space-y-3 p-4 bg-violet-50 border border-violet-100 rounded-xl">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-violet-500">Outcome & Status Progress</Label>
                            <span className="text-[9px] text-violet-600 font-bold italic">Updates Asset Progress</span>
                        </div>
                        <Select
                            value={formData.statusChange}
                            onValueChange={(value) => setFormData({ ...formData, statusChange: value })}
                        >
                            <SelectTrigger className="bg-white border-violet-200">
                                <SelectValue placeholder="Did this move the process forward?" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No status change</SelectItem>
                                <SelectItem value="contacted">Institution Contacted</SelectItem>
                                <SelectItem value="documents_submitted">Documents Sent/Received</SelectItem>
                                <SelectItem value="in_review">Awaiting Their Decision (In Review)</SelectItem>
                                <SelectItem value="approved">Asset Released (Approved)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact Person */}
                    <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person (optional)</Label>
                        <Input
                            id="contactPerson"
                            placeholder="e.g., John Doe, Rep #12345"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        />
                    </div>

                    {/* Attachments Section */}
                    {(formData.method === "email" || formData.method === "fax" || formData.method === "mail") && availableDocuments.length > 0 && (
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Attach Verified Documents</Label>
                                <span className="text-[10px] text-blue-600 font-bold">Include in Evidence Chain</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => {
                                            setSelectedDocIds(prev =>
                                                prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                            );
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                                            selectedDocIds.includes(doc.id)
                                                ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            selectedDocIds.includes(doc.id) ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                        )}>
                                            {selectedDocIds.includes(doc.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate">{doc.name}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">{doc.documentType || doc.type || "Document"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            placeholder="Brief summary of communication"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Detailed notes about the conversation..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading || isGenerating}>
                            Cancel
                        </Button>
                        {assetId && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleGenerateDraft}
                                disabled={isLoading || isGenerating}
                                className="gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Regenerate
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading || isGenerating}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Log Communication
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
