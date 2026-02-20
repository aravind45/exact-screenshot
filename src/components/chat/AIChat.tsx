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
        { role: "bot", content: "Hello! I'm your ExpectedEstate Legal Research Assistant. I use our curated legal guides to answer your questions about estate settlement and California probate law. How can I help you today?" }
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
            setMessages(prev => [...prev, { role: "bot", content: "I'm sorry, I'm currently having trouble accessing the knowledge base. Please ensure the system configuration is complete." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border border-slate-200 shadow-sm bg-white text-slate-900 overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="border-b border-slate-100 bg-slate-50 p-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Legal Research Assistant</CardTitle>
                        <p className="text-xs text-slate-500 font-medium">Powered by Agentic RAG & Expert Knowledge</p>
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
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-blue-600" : "bg-slate-100 border border-slate-200"}`}>
                                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-600" />}
                                </div>
                                <div className={`space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`rounded-2xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-none font-medium border-blue-500"
                                            : "bg-white text-slate-800 rounded-tl-none border-slate-200 font-serif"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about probate, taxes, or creditor claims..."
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-12 focus-visible:ring-blue-600"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
