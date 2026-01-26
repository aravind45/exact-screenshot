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
import { Mail, Search, Inbox as InboxIcon, Send, Archive, RefreshCw, Paperclip, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Inbox() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("inbox");

    const { data: inboxMessages, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
        queryKey: ["communications", "inbox"],
        queryFn: api.getInbox,
    });

    const { data: outboxMessages, isLoading: outboxLoading, refetch: refetchOutbox } = useQuery({
        queryKey: ["communications", "outbox"],
        queryFn: api.getOutbox,
    });

    const messages = activeTab === "inbox" ? inboxMessages : outboxMessages;

    const filteredMessages = messages?.filter((msg: any) =>
        msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.institutionName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const selectedMessage = messages?.find((m: any) => m.id === selectedId);

    const handleRefresh = () => {
        refetchInbox();
        refetchOutbox();
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <InboxIcon className="w-5 h-5 text-slate-500" />
                        <h1 className="text-xl font-bold text-slate-900">Digital Inbox</h1>
                        <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                            {filteredMessages.length} Messages
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64 h-9 bg-slate-50"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="h-9 w-9">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Message List */}
                    <div className="w-96 border-r border-slate-200 bg-white flex flex-col">
                        <div className="p-2 border-b border-slate-100">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="inbox" className="gap-2">
                                        <InboxIcon className="w-4 h-4" /> Inbox
                                    </TabsTrigger>
                                    <TabsTrigger value="outbox" className="gap-2">
                                        <Send className="w-4 h-4" /> Sent
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="flex flex-col divide-y divide-slate-100">
                                {messages?.length === 0 && (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        No messages found.
                                    </div>
                                )}
                                {filteredMessages.map((msg: any) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => setSelectedId(msg.id)}
                                        className={`p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none ${selectedId === msg.id ? "bg-blue-50/60 border-l-4 border-blue-500" : "border-l-4 border-transparent"}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                {msg.institutionName || "Unknown Sender"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                {formatDistanceToNow(new Date(msg.occurredAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-700 mb-1 truncate">
                                            {msg.subject || "(No Subject)"}
                                        </h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {msg.notes}
                                        </p>
                                        {msg.asset && (
                                            <div className="mt-2">
                                                <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 font-normal text-slate-500 border-slate-200">
                                                    {msg.asset.name}
                                                </Badge>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Reading Pane */}
                    <div className="flex-1 bg-slate-50/50 flex flex-col">
                        {selectedMessage ? (
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-slate-200 bg-white">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                                {selectedMessage.subject || "(No Subject)"}
                                            </h2>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span className="font-medium text-slate-700">
                                                    {activeTab === "inbox" ? "From:" : "To:"} {selectedMessage.institutionName}
                                                </span>
                                                <span>&bull;</span>
                                                <span>{new Date(selectedMessage.occurredAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Archive className="w-4 h-4 mr-2" />
                                                Archive
                                            </Button>
                                            {activeTab === "inbox" && (
                                                <Button size="sm">
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Reply
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {selectedMessage.asset && (
                                        <div className="flex items-center gap-2 text-xs bg-slate-100 p-2 rounded-lg border border-slate-200 w-fit">
                                            <span className="text-slate-500">Linked Asset:</span>
                                            <span className="font-semibold text-slate-900">{selectedMessage.asset.name}</span>
                                            <ChevronRight className="w-3 h-3 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <ScrollArea className="flex-1 p-6">
                                    <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap">
                                        {selectedMessage.notes}
                                    </div>

                                    {selectedMessage.attachments?.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-slate-200">
                                            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <Paperclip className="w-4 h-4" />
                                                Attachments ({selectedMessage.attachments.length})
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedMessage.attachments.map((att: any) => (
                                                    <div key={att.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-sm hover:border-slate-300 transition-colors cursor-pointer">
                                                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                            {att.fileName.split('.').pop()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-700">{att.fileName}</span>
                                                            <span className="text-[10px] text-slate-400">{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <Mail className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select a message to read</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
