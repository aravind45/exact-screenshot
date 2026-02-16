import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Scale, Mail, AlertCircle, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


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
    const [ccPersonalEmail, setCcPersonalEmail] = useState(true);
    const [editedSubject, setEditedSubject] = useState("");
    const [editedBody, setEditedBody] = useState("");
    const [editedTo, setEditedTo] = useState("");


    const { data: user } = useQuery({
        queryKey: ['user-profile'],
        queryFn: api.getProfile,
    });

    const isAppointed = estate?.probateStatus === 'EXECUTOR_APPOINTED' || estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT';
    const isTrust = asset?.authorityType === 'TRUSTEE_DIRECT';

    const getAuthorityPhrase = () => {
        if (isTrust) return "I am the Successor Trustee for the trust holding this account.";
        if (isAppointed) return "I have been formally appointed as the legal representative of the estate.";
        return "I am the nominated personal representative of the estate and am currently in the process of obtaining formal appointment.";
    };

    const templates = {
        notification: {
            title: "Formal Notification",
            subject: `Estate Notification: Estate of ${estate?.deceasedFirstName} ${estate?.deceasedLastName} - Account ${asset?.accountNumber || "(pending)"}`,
            body: `Dear ${asset?.institution} Estate Services,\n\nI am writing to formally notify you of the passing of ${estate?.deceasedFirstName} ${estate?.deceasedLastName} on ${estate?.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "[Date]"}.\n\n${getAuthorityPhrase()} Please place an immediate secure lock on all accounts held by the deceased to prevent any unauthorized transactions or automatic withdrawals.\n\nPlease provide me with your specific requirements for asset transfer, including any required forms or certified documents.\n\nSincerely,\n\n${user?.firstName || estate?.deceasedFirstName} ${user?.lastName || 'Estate Representative'}\n${isAppointed ? 'Executor of the Estate' : isTrust ? 'Successor Trustee' : 'Personal Representative (Nominated)'}`
        },
        inquiry: {
            title: "Value Inquiry",
            subject: `Balance Inquiry: Estate of ${estate?.deceasedFirstName} ${estate?.deceasedLastName}`,
            body: `Dear ${asset?.institution} Support,\n\nAs the ${isAppointed ? 'Executor' : isTrust ? 'Trustee' : 'Representative'} for the Estate of ${estate?.deceasedFirstName} ${estate?.deceasedLastName}, I am requesting a Date of Death balance statement for all accounts held by the deceased.\n\nPlease provide the fair market value as of ${estate?.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "[Date]"}.\n\nThank you,\n\nEstate Representative`
        }
    };

    useEffect(() => {
        if (open) {
            const template = templates[selectedTemplate as keyof typeof templates];
            if (template) {
                setEditedSubject(template.subject);
                setEditedBody(template.body);
            }
        }
    }, [open, selectedTemplate]);

    // Only set the initial recipient email once when the dialog opens for a new asset
    useEffect(() => {
        if (open) {
            setEditedTo(asset?.institutionEmail || "");
        }
    }, [open, asset?.id]);

    const currentTemplate = templates[selectedTemplate as keyof typeof templates];


    const handleCopyAndOpen = () => {
        if (!editedTo) {
            toast({ variant: "destructive", title: "Recipient Missing", description: "Please enter a recipient email address." });
            return;
        }
        navigator.clipboard.writeText(editedBody);
        toast({ title: "Draft Copied", description: "Draft copied to clipboard. Opening Gmail..." });

        const mailtoUrl = `mailto:${editedTo}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
        window.location.href = mailtoUrl;
    };


    const handleSendDirectly = async () => {
        if (!editedTo) {
            toast({ variant: "destructive", title: "Email Missing", description: "Please add an email address for this recipient first." });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedTo)) {
            toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
            return;
        }

        if (ccPersonalEmail && !user?.personalEmail) {
            toast({ variant: "destructive", title: "Personal Email Required", description: "Please add your personal email in Profile Settings to use CC." });
            return;
        }

        setIsSending(true);
        try {
            const result = await api.sendEmail({
                assetId: asset.id,
                to: editedTo,
                subject: editedSubject,
                body: editedBody,
                ccPersonalEmail
            });

            const ccMsg = result.ccEmail ? ` (CC: ${result.ccEmail})` : '';
            toast({ title: "Email Sent", description: `Notification sent to ${asset.institution}${ccMsg}` });
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Send Failed", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[96vh] flex flex-col overflow-hidden rounded-[32px] p-0 border-none shadow-2xl bg-white">
                <div className="bg-slate-900 px-6 py-3 text-white relative flex-shrink-0">
                    <Badge className="bg-blue-600 text-white border-none px-3 py-1 font-black uppercase text-[9px] tracking-widest">Draft Assist</Badge>
                    <DialogTitle className="sr-only">Email Draft</DialogTitle>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                        {Object.entries(templates).map(([id, t]) => (
                            <Button
                                key={id}
                                variant={selectedTemplate === id ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedTemplate(id)}
                                className={cn(
                                    "rounded-lg font-bold text-xs px-4 h-8",
                                    selectedTemplate === id ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {t.title}
                            </Button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Recipient Email</label>
                            <Input
                                value={editedTo}
                                onChange={(e) => setEditedTo(e.target.value)}
                                className="rounded-xl font-bold text-indigo-600 text-sm border-slate-200 focus:border-indigo-500 transition-all h-10"
                                placeholder="recipient@institution.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Line</label>
                            <Input
                                value={editedSubject}
                                onChange={(e) => setEditedSubject(e.target.value)}
                                className="rounded-xl font-bold text-slate-700 text-sm border-slate-200 focus:border-indigo-500 transition-all h-10"
                                placeholder="Email Subject"
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <div className="flex justify-between items-center ml-1 mb-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Body</label>
                                {!isAppointed && !isTrust && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100 animate-pulse">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter">Letters Pending - Draft Adjusted</span>
                                    </div>
                                )}
                            </div>
                            <Textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                className="rounded-xl text-slate-600 text-sm h-48 border-slate-200 focus:border-indigo-500 transition-all font-medium leading-relaxed resize-none"
                                placeholder="Write your email here..."
                            />
                        </div>
                    </div>

                    {/* CC Personal Email Option */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="cc-personal"
                                checked={ccPersonalEmail}
                                onCheckedChange={(checked) => setCcPersonalEmail(checked as boolean)}
                            />
                            <label htmlFor="cc-personal" className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                                <Mail className="w-4 h-4 text-indigo-600" />
                                CC my personal email for records
                            </label>
                        </div>
                        {ccPersonalEmail && (
                            <div className="ml-7 text-xs">
                                {user?.personalEmail ? (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                        <span className="font-medium">{user.personalEmail}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span className="font-medium">No personal email set. <Link to="/profile" className="underline hover:text-amber-700">Add in Profile</Link></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-3 flex-shrink-0">
                    <Button
                        className="h-14 rounded-2xl bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 transition-all gap-3 font-bold shadow-lg shadow-amber-500/10 col-span-2 sm:col-span-1"
                        disabled={isSending}
                        onClick={handleSendDirectly}
                    >
                        <Scale className="w-5 h-5 text-amber-400" />
                        <div className="text-left flex flex-col">
                            <span className="leading-tight">{isSending ? "Sending..." : "Send via Digital Inbox"}</span>
                            <span className="text-[9px] opacity-70 font-medium text-amber-200">Permanent Digital Log</span>
                        </div>
                    </Button>
                    <Button
                        className="h-14 rounded-2xl bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-900 transition-all gap-3 font-bold shadow-sm col-span-2 sm:col-span-1"
                        onClick={() => {
                            onLogSent(editedSubject, editedBody);
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                                printWindow.document.write(`<html><head><title>Print</title></head><body><pre style="white-space: pre-wrap; font-family: sans-serif;">${editedBody}</pre></body></html>`);
                                printWindow.document.close();
                                printWindow.print();
                            }
                        }}
                    >
                        <Printer className="w-5 h-5 text-slate-500" />
                        <div className="text-left flex flex-col">
                            <span className="leading-tight">Print Letter</span>
                            <span className="text-[9px] opacity-70 font-medium text-slate-400">Download for Mailing</span>
                        </div>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg hover:bg-slate-200 transition-all gap-2 font-bold text-slate-500 col-span-2 border border-slate-200 mt-1"
                        onClick={handleCopyAndOpen}
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-wider">Copy & Open in my own Email Client</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
