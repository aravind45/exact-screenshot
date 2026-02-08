import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { api } from "@/lib/api";
import { MessageCircle, Send, User, Bot, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "bot";
    content: string;
    sources?: string[];
}

export function AIChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", content: "Hello! I'm your ExpectedEstate settlement assistant. I use our curated legal guides to answer your questions about estate settlement. Please note: This is for educational purposes only and does not constitute legal advice. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            const { answer, sources } = await api.help.chat(userMsg);
            setMessages(prev => [...prev, { role: "bot", content: answer, sources }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", content: "I'm sorry, I encountered an error. Please ensure your API key is configured correctly." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="border-b border-slate-800 bg-slate-800/50 p-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Settlement Assistant</CardTitle>
                        <p className="text-xs text-slate-400">Powered by RAG & Expert Knowledge Base</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-indigo-600" : "bg-slate-800 border border-slate-700"}`}>
                                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
                                </div>
                                <div className={`space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-lg"}`}>
                                        {msg.content}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1 font-sans">
                                            {msg.sources.map((s, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    <Info className="w-3 h-3" />
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <div className="p-6 bg-slate-800/50 border-t border-slate-800">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about probate, taxes, or creditor claims..."
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-12 focus-visible:ring-blue-500"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
