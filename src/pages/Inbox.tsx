import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Mail, Search, Inbox as InboxIcon, Send, Archive, RefreshCw, Paperclip, ChevronRight, MessageSquare, Phone, Printer, History, Landmark, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function Inbox() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("timeline");

    const { data: timelineMessages, isLoading: timelineLoading, refetch: refetchTimeline } = useQuery({
        queryKey: ["communications", "timeline"],
        queryFn: api.getTimeline,
    });

    const { data: inboxMessages, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
        queryKey: ["communications", "inbox"],
        queryFn: api.getInbox,
    });

    const { data: outboxMessages, isLoading: outboxLoading, refetch: refetchOutbox } = useQuery({
        queryKey: ["communications", "outbox"],
        queryFn: api.getOutbox,
    });

    const getMessages = () => {
        if (activeTab === "inbox") return inboxMessages;
        if (activeTab === "outbox") return outboxMessages;
        return timelineMessages;
    };

    const messages = getMessages();

    const filteredMessages = messages?.filter((msg: any) =>
        msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.institutionName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const selectedMessage = filteredMessages.find((m: any) => m.id === selectedId) ||
        (timelineMessages?.find((m: any) => m.id === selectedId));

    const handleRefresh = () => {
        refetchTimeline();
        refetchInbox();
        refetchOutbox();
    };

    const getCommIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'email': return Mail;
            case 'call': return Phone;
            case 'fax': return Printer;
            case 'letter': return Landmark;
            default: return MessageSquare;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <InboxIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settlement Inbox</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Pilar Settlement Engine</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 border-none font-bold">
                            {filteredMessages.length} Interactions
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search settlement logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64 h-9 bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="h-9 w-9">
                            <RefreshCw className={cn("w-4 h-4", (timelineLoading || inboxLoading) && "animate-spin")} />
                        </Button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Message List */}
                    <div className="w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
                        <div className="p-2 border-b border-slate-100">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="timeline" className="gap-2 text-xs">
                                        <History className="w-3.5 h-3.5" /> All
                                    </TabsTrigger>
                                    <TabsTrigger value="inbox" className="gap-2 text-xs">
                                        <InboxIcon className="w-3.5 h-3.5" /> Inbox
                                    </TabsTrigger>
                                    <TabsTrigger value="outbox" className="gap-2 text-xs">
                                        <Send className="w-3.5 h-3.5" /> Sent
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="flex flex-col divide-y divide-slate-100">
                                {messages?.length === 0 && !timelineLoading && (
                                    <div className="p-12 text-center space-y-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                            <MessageSquare className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">No interactions recorded yet.</p>
                                    </div>
                                )}
                                {filteredMessages.map((msg: any) => {
                                    const Icon = getCommIcon(msg.type);
                                    return (
                                        <button
                                            key={msg.id}
                                            onClick={() => setSelectedId(msg.id)}
                                            className={cn(
                                                "p-4 text-left transition-all border-l-4 group relative",
                                                selectedId === msg.id
                                                    ? "bg-slate-50 border-indigo-600"
                                                    : "border-transparent hover:bg-slate-50/50"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "p-1.5 rounded-lg",
                                                        msg.direction === 'inbound' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                                                    )}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm truncate max-w-[140px]">
                                                        {msg.institutionName || "General Inquiry"}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    {formatDistanceToNow(new Date(msg.occurredAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-semibold text-slate-700 mb-1 truncate capitalize">
                                                {msg.subject || (msg.type === 'call' ? 'Phone Conversation' : '(No Subject)')}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                                                "{msg.notes}"
                                            </p>
                                            <div className="mt-3 flex items-center justify-between">
                                                {msg.asset && (
                                                    <Badge variant="outline" className="text-[9px] py-0 h-4 px-1.5 font-bold text-slate-400 bg-white border-slate-200">
                                                        {msg.asset.name}
                                                    </Badge>
                                                )}
                                                {msg.statusChange && msg.statusChange !== 'none' && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                                                        <AlertCircle className="w-2.5 h-2.5" />
                                                        Status Updated
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Reading Pane */}
                    <div className="flex-1 bg-white/50 flex flex-col overflow-hidden">
                        {selectedMessage ? (
                            <div className="flex flex-col h-full bg-white shadow-2xl m-6 rounded-3xl border border-slate-200 overflow-hidden">
                                <div className="p-8 border-b border-slate-100">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Badge className={cn(
                                                    "px-3 py-1 font-black uppercase text-[10px] tracking-widest border-none",
                                                    selectedMessage.direction === 'inbound' ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white"
                                                )}>
                                                    {selectedMessage.direction} {selectedMessage.type}
                                                </Badge>
                                                {selectedMessage.followUpDueAt && !selectedMessage.followUpCompletedAt && (
                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-bold text-[10px]">
                                                        Follow-up Due: {new Date(selectedMessage.followUpDueAt).toLocaleDateString()}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                                                {selectedMessage.subject || (selectedMessage.type === 'call' ? 'Call Summary' : 'Interaction Details')}
                                            </h2>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                < Landmark className="w-4 h-4" />
                                                <span className="text-slate-900 font-bold">
                                                    {selectedMessage.institutionName}
                                                </span>
                                                <span className="text-slate-300 mx-1">|</span>
                                                <span>{new Date(selectedMessage.occurredAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="rounded-xl font-bold gap-2">
                                                <Archive className="w-4 h-4" />
                                                File Away
                                            </Button>
                                            <Button className="rounded-xl font-black gap-2 shadow-lg shadow-indigo-100">
                                                <RefreshCw className="w-4 h-4" />
                                                Update Log
                                            </Button>
                                        </div>
                                    </div>

                                    {selectedMessage.asset && (
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 w-fit group cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Impacted Asset</p>
                                                <p className="text-sm font-bold text-slate-900">{selectedMessage.asset.name}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </div>

                                <ScrollArea className="flex-1 p-8">
                                    <div className="max-w-3xl">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-[1px] flex-1 bg-slate-100"></div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Interaction Notes</span>
                                            <div className="h-[1px] flex-1 bg-slate-100"></div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                            "{selectedMessage.notes}"
                                        </div>

                                        {selectedMessage.statusChange && selectedMessage.statusChange !== 'none' && (
                                            <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                                                <div className="flex items-center gap-2 text-amber-700">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <h4 className="font-black uppercase text-xs tracking-widest">Automatic System Trigger</h4>
                                                </div>
                                                <p className="text-sm text-amber-900 font-medium">
                                                    This communication automatically updated the asset status to <strong>{selectedMessage.statusChange.toUpperCase()}</strong>.
                                                </p>
                                            </div>
                                        )}

                                        {selectedMessage.attachments?.length > 0 && (
                                            <div className="mt-12">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <Paperclip className="w-4 h-4 text-indigo-500" />
                                                    Supporting Documents ({selectedMessage.attachments.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {selectedMessage.attachments.map((att: any) => (
                                                        <div key={att.id} className="group flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl text-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-[10px] uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                {att.fileName.split('.').pop()}
                                                            </div>
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="font-bold text-slate-700 truncate">{att.fileName}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium tracking-tight">{(att.sizeBytes / 1024).toFixed(1)} KB &bull; Verified Attachment</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 animate-in fade-in zoom-in duration-500">
                                <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-6 rotate-3">
                                    <Mail className="w-16 h-16 opacity-20 -rotate-3" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-300 tracking-tight">Select an Interaction</h3>
                                <p className="text-sm font-medium opacity-60">View details, tracking, and audit trail.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LayoutGrid({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    )
}
