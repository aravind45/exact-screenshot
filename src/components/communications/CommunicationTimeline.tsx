import { Communication } from "@/lib/api";
import { format } from "date-fns";
import {
    Phone,
    Mail,
    FileText,
    Printer,
    Users,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    Paperclip,
    Trash2,
    Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommunicationTimelineProps {
    communications: Communication[];
    onDelete?: (id: string) => void;
    onEdit?: (comm: Communication) => void;
}


export function CommunicationTimeline({ communications, onDelete, onEdit }: CommunicationTimelineProps) {
    if (!Array.isArray(communications) || communications.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium tracking-tight">Financial audit trail is empty.</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">Ready for "Due Diligence" entry</p>
            </div>
        );
    }

    const getTypeIcon = (type: string) => {
        const t = type.toUpperCase();
        switch (t) {
            case 'CALL': return <Phone className="w-4 h-4" />;
            case 'EMAIL': return <Mail className="w-4 h-4" />;
            case 'LETTER':
            case 'POSTAL_MAIL': return <FileText className="w-4 h-4" />;
            case 'FAX': return <Printer className="w-4 h-4" />;
            case 'IN-PERSON':
            case 'IN_PERSON': return <Users className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 bg-slate-100 rounded-xl border border-slate-200 mb-2">
                <div className="col-span-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">Timestamp</div>
                <div className="col-span-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type</div>
                <div className="col-span-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Subject & Record</div>
                <div className="col-span-2 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Protocol</div>
                <div className="col-span-2 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</div>
            </div>

            <div className="space-y-3">
                {communications.map((comm) => (
                    <div
                        key={comm.id}
                        className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden"
                    >
                        {/* Status Strip */}
                        <div className={cn(
                            "absolute top-0 left-0 w-1 h-full",
                            comm.direction.toUpperCase() === 'OUTBOUND' ? "bg-primary" : "bg-slate-900"
                        )} />

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-start">
                            {/* Timestamp */}
                            <div className="md:col-span-2 space-y-1">
                                <p className="text-xs font-black text-slate-900 leading-none">
                                    {format(new Date(comm.occurredAt), 'MMM d, yyyy')}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {format(new Date(comm.occurredAt), 'h:mm a')}
                                </p>
                            </div>

                            {/* Type */}
                            <div className="md:col-span-1">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ring-1",
                                    comm.direction.toUpperCase() === 'OUTBOUND' ? "bg-blue-50 text-blue-600 ring-blue-100" : "bg-slate-50 text-slate-600 ring-slate-200"
                                )}>
                                    {getTypeIcon(comm.type)}
                                </div>
                            </div>

                            {/* Subject & Summary */}
                            <div className="md:col-span-5 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 leading-tight tracking-tight">
                                        {comm.subject || "Undisclosed Subject"}
                                    </h4>
                                    {comm.direction.toUpperCase() === 'OUTBOUND' ? (
                                        <ArrowUpRight className="w-3 h-3 text-blue-500 font-black" />
                                    ) : (
                                        <ArrowDownLeft className="w-3 h-3 text-slate-400 font-black" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic font-medium">
                                    "{comm.notes}"
                                </p>

                                {comm.contactName && (
                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge variant="outline" className="h-4 text-[9px] font-black uppercase tracking-tighter bg-slate-50">
                                            Rep: {comm.contactName}
                                        </Badge>
                                        {comm.contactChannel && (
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{comm.contactChannel}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Protocol / Phase Change */}
                            <div className="md:col-span-2 flex flex-col items-center justify-center gap-2 pt-1">
                                {comm.statusChange ? (
                                    <Badge className="bg-emerald-600 text-white border-none font-black uppercase text-[9px] tracking-widest h-5">
                                        {comm.statusChange.replace(/_/g, ' ')}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-400 border-slate-100 font-black uppercase text-[9px] tracking-widest h-5">
                                        Verification Only
                                    </Badge>
                                )}
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Protocol Stamped</span>
                            </div>

                            {/* Actions */}
                            <div className="md:col-span-2 flex items-center justify-end gap-2">
                                {comm.attachments && comm.attachments.length > 0 && (
                                    <div className="flex -space-x-2 mr-2">
                                        {comm.attachments.map((_, i) => (
                                            <div key={i} className="w-6 h-6 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400">
                                                <Paperclip className="w-3 h-3" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(comm)}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(comm.id)}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Court Admissibility Check</p>
                        <p className="text-xs font-bold text-white mt-1">Audit Trail Active & Verified</p>
                    </div>
                </div>
                <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] tracking-widest">Due Diligence Valid</Badge>
            </div>
        </div>
    );
}
