import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Communication } from "@/lib/api";
import { CommunicationTimeline } from "./CommunicationTimeline";
import { CommunicationLogDialog, CommunicationData } from "../CommunicationLogDialog";
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


    const updateMutation = useMutation({
        mutationFn: (params: { id: string, data: any }) => api.updateCommunication(params.id, params.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications", assetId] });
            setEditingComm(null);
            setIsAdding(false);
            toast({ title: "Updated", description: "Log entry updated." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteCommunication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications", assetId] });
            toast({ title: "Deleted", description: "Log entry removed." });
        }
    });

    const [editingComm, setEditingComm] = useState<any>(null);

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
                <Button onClick={() => { setEditingComm(null); setIsAdding(true); }} className="rounded-full gap-2 font-bold shadow-md">
                    <Plus className="w-4 h-4" />
                    Log Contact
                </Button>
            </CardHeader>

            <CardContent className="px-0">
                <div className="space-y-6">
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
                        onEdit={(comm) => { setEditingComm(comm); setIsAdding(true); }}
                    />
                </div>
            </CardContent>

            <CommunicationLogDialog
                open={isAdding}
                onOpenChange={(open) => {
                    setIsAdding(open);
                    if (!open) setEditingComm(null);
                }}
                assetId={assetId}
                initialData={editingComm}
                onSubmit={(data) => {
                    if (editingComm) {
                        updateMutation.mutate({ id: editingComm.id, data });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
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
