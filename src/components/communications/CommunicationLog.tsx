import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Communication } from "@/lib/api";
import { CommunicationTimeline } from "./CommunicationTimeline";
import { CommunicationForm } from "./CommunicationForm";
import { Button } from "@/components/ui/button";
import { Plus, Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface CommunicationLogProps {
    assetId: string;
}

export function CommunicationLog({ assetId }: CommunicationLogProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: communications = [], isLoading } = useQuery({
        queryKey: ["communications", assetId],
        queryFn: () => api.getCommunications(assetId),
    });

    const createMutation = useMutation({
        mutationFn: (values: any) => api.createCommunication({ ...values, assetId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications", assetId] });
            queryClient.invalidateQueries({ queryKey: ["assets"] }); // To update last contact info
            setIsAdding(false);
            toast({
                title: "Communication Logged",
                description: "Your interaction has been recorded successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to log communication.",
                variant: "destructive",
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteCommunication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications", assetId] });
            toast({ title: "Log Deleted", description: "The entry has been removed." });
        }
    });

    const filteredComms = communications.filter(comm =>
        comm.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Communication History
                    </CardTitle>
                    <CardDescription>Keep track of every interaction with this institution.</CardDescription>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="rounded-full gap-2 font-bold shadow-md">
                        <Plus className="w-4 h-4" />
                        Log Contact
                    </Button>
                )}
            </CardHeader>

            <CardContent className="px-0">
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-slate-900">New Log Entry</h3>
                                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-full h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <CommunicationForm
                                onSubmit={(vals) => createMutation.mutate(vals)}
                                onCancel={() => setIsAdding(false)}
                                isLoading={createMutation.isPending}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {communications.length > 0 && (
                                <div className="relative mb-8">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search notes, contacts, or subjects..."
                                        className="pl-10 h-11 bg-slate-100/50 border-transparent focus:bg-white focus:border-primary/20 rounded-xl transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            )}

                            <CommunicationTimeline
                                communications={filteredComms}
                                onDelete={(id) => deleteMutation.mutate(id)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
