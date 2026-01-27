import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, MessageSquare, Send, Loader2, User, Bot, Trash2 } from "lucide-react";
import { agentService, AgentMessage } from "@/services/agentService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EstateAgentChatProps {
    estateId: string;
    phase?: string;
}

export function EstateAgentChat({ estateId, phase }: EstateAgentChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<AgentMessage[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [history]);

    const mutation = useMutation({
        mutationFn: (message: string) =>
            agentService.chat({
                message,
                estateId,
                phase,
                history,
            }),
        onSuccess: (data) => {
            setHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
            // Refresh relevant data if agent performed actions
            queryClient.invalidateQueries({ queryKey: ["assets", estateId] });
            queryClient.invalidateQueries({ queryKey: ["estate", estateId] });
        },
    });

    const handleSend = () => {
        if (!input.trim() || mutation.isPending) return;

        const userMessage: AgentMessage = { role: "user", content: input };
        setHistory((prev) => [...prev, userMessage]);
        mutation.mutate(input);
        setInput("");
    };

    const clearChat = () => {
        setHistory([]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4"
                    >
                        <Card className="w-[380px] h-[550px] shadow-2xl border-primary/20 flex flex-col overflow-hidden bg-background/95 backdrop-blur-md">
                            <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Estate Settlement Agent</CardTitle>
                                        <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Always Active</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/10"
                                        onClick={clearChat}
                                        title="Clear Chat"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/10"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30">
                                <ScrollArea className="h-full p-4">
                                    <div className="space-y-4">
                                        {history.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-70">
                                                <div className="p-4 bg-primary/10 rounded-full">
                                                    <Bot className="w-12 h-12 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold">How can I help you today?</h3>
                                                    <p className="text-xs max-w-[250px]">
                                                        Try asking: "What are my next steps?", "Analyze this document", or "Draft an email to the bank."
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {history.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "flex items-start gap-2",
                                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-1.5 rounded-full shrink-0 mt-1",
                                                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                                                )}>
                                                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "p-3 rounded-2xl text-sm leading-relaxed max-w-[85%]",
                                                        msg.role === "user"
                                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                                            : "bg-background border shadow-sm rounded-tl-none"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {mutation.isPending && (
                                            <div className="flex items-start gap-2">
                                                <div className="p-1.5 rounded-full bg-muted border shrink-0 mt-1">
                                                    <Bot className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="bg-background border shadow-sm p-3 rounded-2xl rounded-tl-none">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 border-t bg-background">
                                <form
                                    className="flex w-full items-center gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                >
                                    <Input
                                        placeholder="Type a message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="flex-1 h-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                                        disabled={mutation.isPending}
                                    />
                                    <Button size="icon" type="submit" disabled={!input.trim() || mutation.isPending} className="h-10 w-10 shrink-0">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            size="lg"
                            className="w-14 h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 flex items-center justify-center p-0"
                            onClick={() => setIsOpen(true)}
                        >
                            <Sparkles className="w-6 h-6 text-white" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
