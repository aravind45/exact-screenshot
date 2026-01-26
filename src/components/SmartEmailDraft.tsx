import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface SmartEmailDraftProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: any;
    estate: any;
    onLogSent: (subject: string, content: string) => void;
}

export function SmartEmailDraft({ open, onOpenChange, asset, estate, onLogSent }: SmartEmailDraftProps) {
    const { toast } = useToast();
    const [selectedTemplate, setSelectedTemplate] = useState("notification");
    const [isSending, setIsSending] = useState(false);

    const templates = {
        notification: {
            title: "Formal Notification",
            subject: `Legal Notification: Estate of ${estate?.deceasedFirstName} ${estate?.deceasedLastName} - Account ${asset?.accountNumber || "(pending)"}`,
            body: `Dear ${asset?.institution} Estate Services,\n\nI am writing to formally notify you of the passing of ${estate?.deceasedFirstName} ${estate?.deceasedLastName} on ${estate?.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "[Date]"}.\n\nI have been appointed as the legal representative of the estate. Please place an immediate secure lock on all accounts held by the deceased to prevent any unauthorized transactions or automatic withdrawals.\n\nPlease provide me with your specific requirements for asset transfer, including any required forms or certified documents.\n\nSincerely,\n\n${estate?.deceasedFirstName} Estate Representative\nExecutor of the Estate`
        },
        inquiry: {
            title: "Value Inquiry",
            subject: `Balance Inquiry: Estate of ${estate?.deceasedFirstName} ${estate?.deceasedLastName}`,
            body: `Dear ${asset?.institution} Support,\n\nAs the Executor for the Estate of ${estate?.deceasedFirstName} ${estate?.deceasedLastName}, I am requesting a Date of Death balance statement for all accounts held by the deceased.\n\nPlease provide the fair market value as of ${estate?.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "[Date]"}.\n\nThank you,\n\nEstate Representative`
        }
    };

    const currentTemplate = templates[selectedTemplate as keyof typeof templates];

    const handleCopyAndOpen = () => {
        navigator.clipboard.writeText(currentTemplate.body);
        toast({ title: "Draft Copied", description: "Draft copied to clipboard. Opening Gmail..." });

        const mailtoUrl = `mailto:${asset?.institutionEmail || ""}?subject=${encodeURIComponent(currentTemplate.subject)}&body=${encodeURIComponent(currentTemplate.body)}`;
        window.location.href = mailtoUrl;
    };

    const handleSendDirectly = async () => {
        if (!asset?.institutionEmail) {
            toast({ variant: "destructive", title: "Email Missing", description: "Please add an email address for this institution first." });
            return;
        }

        setIsSending(true);
        try {
            await api.sendEmail({
                assetId: asset.id,
                to: asset.institutionEmail,
                subject: currentTemplate.subject,
                body: currentTemplate.body
            });
            toast({ title: "Email Sent", description: `Notification sent to ${asset.institution} directly from Pilar.` });
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Send Failed", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] overflow-hidden rounded-[32px] p-0 border-none shadow-2xl bg-white">
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Scale className="w-24 h-24" />
                    </div>
                    <Badge className="bg-blue-500 text-white border-none mb-4 px-3 py-1 font-black uppercase text-[10px] tracking-widest">Legal Draft Assist</Badge>
                    <DialogTitle className="text-3xl font-black tracking-tighter leading-none mb-2">Smart Email Draft</DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">Professional, court-ready templates verified by legal experts.</DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                        {Object.entries(templates).map(([id, t]) => (
                            <Button
                                key={id}
                                variant={selectedTemplate === id ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedTemplate(id)}
                                className={cn(
                                    "rounded-xl font-bold text-xs px-4",
                                    selectedTemplate === id ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {t.title}
                            </Button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Line</label>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm">
                                {currentTemplate.subject}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Body</label>
                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-sm h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-medium">
                                {currentTemplate.body}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <Button
                            className="h-14 rounded-2xl bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 transition-all gap-3 font-bold shadow-lg shadow-amber-500/10 col-span-2 sm:col-span-1"
                            disabled={isSending}
                            onClick={handleSendDirectly}
                        >
                            <Scale className="w-5 h-5 text-amber-400" />
                            <div className="text-left flex flex-col">
                                <span className="leading-tight">{isSending ? "Sending..." : "Send via Digital Inbox"}</span>
                                <span className="text-[9px] opacity-70 font-medium text-amber-200">Official Estate Record</span>
                            </div>
                        </Button>
                        <Button
                            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all gap-3 font-bold shadow-lg shadow-blue-500/20 col-span-2 sm:col-span-1"
                            onClick={() => {
                                onLogSent(currentTemplate.subject, currentTemplate.body);
                                onOpenChange(false);
                            }}
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            <div className="text-left flex flex-col">
                                <span className="leading-tight">Log as Sent Manual</span>
                                <span className="text-[9px] opacity-70 font-medium">Record in Evidence History</span>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-10 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all gap-2 font-bold text-slate-500 col-span-2"
                            onClick={handleCopyAndOpen}
                        >
                            <Copy className="w-4 h-4" />
                            <span className="text-xs">Copy & Open in my own Email Client</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
