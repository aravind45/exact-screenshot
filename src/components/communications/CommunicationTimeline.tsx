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
    Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommunicationTimelineProps {
    communications: Communication[];
    onDelete?: (id: string) => void;
}

export function CommunicationTimeline({ communications, onDelete }: CommunicationTimelineProps) {
    if (communications.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No communications recorded yet.</p>
            </div>
        );
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="w-4 h-4" />;
            case 'email': return <Mail className="w-4 h-4" />;
            case 'letter': return <FileText className="w-4 h-4" />;
            case 'fax': return <Printer className="w-4 h-4" />;
            case 'in-person': return <Users className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {communications.map((comm) => (
                <div key={comm.id} className="relative flex items-start group">
                    {/* Icon Column */}
                    <div className={cn(
                        "absolute left-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110",
                        comm.direction === 'outbound' ? "bg-primary text-white" : "bg-slate-900 text-white"
                    )}>
                        {getTypeIcon(comm.type)}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 ml-14 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                    {comm.direction === 'outbound' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                    {comm.direction}
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    {format(new Date(comm.occurredAt), 'MMM d, yyyy • h:mm a')}
                                </span>
                            </div>
                            {comm.statusChange && (
                                <Badge variant="secondary" className="w-fit bg-amber-100 text-amber-700 border-none font-bold uppercase text-[10px]">
                                    {comm.statusChange.replace(/_/g, ' ')}
                                </Badge>
                            )}
                        </div>

                        {comm.subject && (
                            <h4 className="font-bold text-slate-900 mb-1 leading-tight">{comm.subject}</h4>
                        )}

                        <div className="text-sm text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">
                            {comm.notes}
                        </div>

                        {(comm.contactName || comm.contactChannel) && (
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 mb-4">
                                {comm.contactName && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Contact</span>
                                        <span className="text-xs font-semibold text-slate-700">{comm.contactName}</span>
                                    </div>
                                )}
                                {comm.contactChannel && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Channel</span>
                                        <span className="text-xs font-semibold text-slate-700">{comm.contactChannel}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {comm.attachments?.map((att) => (
                                    <Badge key={att.id} variant="outline" className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-50 cursor-pointer">
                                        <Paperclip className="w-3 h-3" />
                                        <span className="text-[10px] truncate max-w-[120px]">{att.fileName}</span>
                                    </Badge>
                                ))}
                            </div>

                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(comm.id)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
