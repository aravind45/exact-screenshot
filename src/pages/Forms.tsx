
import React, { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye, Gavel, Scale, ScrollText, Loader2, MapPin, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const STATES = [
    { id: "CA", name: "California", icon: "🌴" },
    { id: "NY", name: "New York", icon: "🗽", disabled: true },
    { id: "TX", name: "Texas", icon: "🤠", disabled: true },
    { id: "FL", name: "Florida", icon: "☀️", disabled: true },
];

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] || FileText;
    return <IconComponent className={className} />;
};

const Forms = () => {
    const [selectedState, setSelectedState] = useState("CA");
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const { data: templates, isLoading: templatesLoading } = useQuery({
        queryKey: ["forms", "templates"],
        queryFn: api.getFormTemplates
    });

    const handleFormAction = async (formId: string, isPreview: boolean) => {
        setLoadingAction(`${formId}-${isPreview ? 'preview' : 'generate'}`);
        try {
            const blob = await api.generateForm(formId, isPreview);
            const url = window.URL.createObjectURL(blob);

            if (isPreview) {
                window.open(url, '_blank');
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${formId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            toast.success(isPreview ? "Preview layout ready" : "Form downloaded");
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed to handle ${formId}: ${e.message}`);
        } finally {
            setLoadingAction(null);
        }
    };

    const filteredForms = useMemo(() => {
        const list = Array.isArray(templates) ? templates : [];
        return list.filter((f: any) =>
            f.state === selectedState &&
            ((f.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [templates, selectedState, searchQuery]);

    return (
        <div className="flex min-h-screen bg-slate-950 text-white font-sans">
            <Sidebar />
            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                {/* Header Section */}
                <header className="p-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl shrink-0">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-black tracking-tighter text-white"
                            >
                                PRO <span className="text-primary italic">FORMS</span>
                            </motion.h1>
                            <p className="text-slate-500 text-sm font-medium">Official Judicial Council Templates</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search forms..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-800/50 border-slate-700 focus:border-primary/50 transition-all rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* State Selector */}
                    <div className="flex gap-2 p-1 bg-slate-800/30 rounded-2xl w-fit">
                        {STATES.map((s) => (
                            <button
                                key={s.id}
                                disabled={s.disabled}
                                onClick={() => setSelectedState(s.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all relative
                  ${selectedState === s.id ? "text-white" : "text-slate-500 hover:text-slate-300"}
                  ${s.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                `}
                            >
                                {selectedState === s.id && (
                                    <motion.div
                                        layoutId="active-state"
                                        className="absolute inset-0 bg-slate-800 rounded-xl border border-white/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{s.icon}</span>
                                <span className="relative z-10">{s.name}</span>
                                {s.disabled && (
                                    <span className="relative z-10 text-[8px] uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 ml-1">Coming Soon</span>
                                )}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {templatesLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-[10px]">Cataloging Forms...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedState}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                            >
                                {filteredForms.length > 0 ? (
                                    filteredForms.map((form: any, index: number) => (
                                        <motion.div
                                            key={form.name}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-primary/30 transition-all group relative overflow-hidden h-full flex flex-col">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <DynamicIcon name={form.icon} className="w-16 h-16" />
                                                </div>

                                                <CardHeader className="pb-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-slate-500">
                                                            <MapPin className="w-3 h-3" />
                                                            {selectedState} / {form.category}
                                                        </div>
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-primary uppercase">
                                                            {form.name}
                                                        </span>
                                                    </div>
                                                    <CardTitle className="text-lg font-bold text-white mb-2 leading-tight">
                                                        {form.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-slate-400 text-xs leading-relaxed min-h-[3rem]">
                                                        {form.description}
                                                    </CardDescription>
                                                </CardHeader>

                                                <div className="mt-auto px-6 pb-6 pt-2">
                                                    <div className="flex gap-3 pt-4 border-t border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                                                            onClick={() => handleFormAction(form.name, true)}
                                                            disabled={loadingAction !== null}
                                                        >
                                                            {loadingAction === `${form.name}-preview` ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Eye className="w-4 h-4 mr-2" />
                                                            )}
                                                            Preview
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all border border-primary/20"
                                                            onClick={() => handleFormAction(form.name, false)}
                                                            disabled={loadingAction !== null}
                                                        >
                                                            {loadingAction === `${form.name}-generate` ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Download className="w-4 h-4 mr-2" />
                                                            )}
                                                            Print & Fill
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                                        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-4">
                                            <Search className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="font-bold">No forms found for "{searchQuery}"</p>
                                        <p className="text-sm">Try searching for a form ID like "DE-111"</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Help Banner */}
                <footer className="p-4 shrink-0 bg-slate-900/30 border-t border-white/5 text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        Need help? <span className="text-primary cursor-pointer hover:underline">Contact the Probate Hub Support Team</span>
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default Forms;
