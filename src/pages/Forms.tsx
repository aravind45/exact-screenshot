import React, { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { FileText, Download, Eye, Gavel, Scale, ScrollText, Loader2, MapPin, Search, ShieldCheck, Lock, AlertCircle, CheckCircle2, Info } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, FormReadiness } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATES = [
    // Fully Supported States
    { id: "CA", name: "California", icon: "🌴", supported: true },
    
    // Coming Soon States (alphabetical)
    { id: "AL", name: "Alabama", icon: "🏛️", supported: false },
    { id: "AK", name: "Alaska", icon: "🏔️", supported: false },
    { id: "AZ", name: "Arizona", icon: "🌵", supported: false },
    { id: "AR", name: "Arkansas", icon: "💎", supported: false },
    { id: "CO", name: "Colorado", icon: "⛰️", supported: false },
    { id: "CT", name: "Connecticut", icon: "⚓", supported: false },
    { id: "DE", name: "Delaware", icon: "🦅", supported: false },
    { id: "FL", name: "Florida", icon: "☀️", supported: false },
    { id: "GA", name: "Georgia", icon: "🍑", supported: false },
    { id: "HI", name: "Hawaii", icon: "🌺", supported: false },
    { id: "ID", name: "Idaho", icon: "🥔", supported: false },
    { id: "IL", name: "Illinois", icon: "🌆", supported: false },
    { id: "IN", name: "Indiana", icon: "🏁", supported: false },
    { id: "IA", name: "Iowa", icon: "🌽", supported: false },
    { id: "KS", name: "Kansas", icon: "🌻", supported: false },
    { id: "KY", name: "Kentucky", icon: "🐴", supported: false },
    { id: "LA", name: "Louisiana", icon: "🎺", supported: false },
    { id: "ME", name: "Maine", icon: "🦞", supported: false },
    { id: "MD", name: "Maryland", icon: "🦀", supported: false },
    { id: "MA", name: "Massachusetts", icon: "⛵", supported: false },
    { id: "MI", name: "Michigan", icon: "🚗", supported: false },
    { id: "MN", name: "Minnesota", icon: "❄️", supported: false },
    { id: "MS", name: "Mississippi", icon: "🎸", supported: false },
    { id: "MO", name: "Missouri", icon: "🎭", supported: false },
    { id: "MT", name: "Montana", icon: "🦬", supported: false },
    { id: "NE", name: "Nebraska", icon: "🌾", supported: false },
    { id: "NV", name: "Nevada", icon: "🎰", supported: false },
    { id: "NH", name: "New Hampshire", icon: "🍁", supported: false },
    { id: "NJ", name: "New Jersey", icon: "🏖️", supported: false },
    { id: "NM", name: "New Mexico", icon: "🌶️", supported: false },
    { id: "NY", name: "New York", icon: "🗽", supported: false },
    { id: "NC", name: "North Carolina", icon: "🏔️", supported: false },
    { id: "ND", name: "North Dakota", icon: "🦬", supported: false },
    { id: "OH", name: "Ohio", icon: "🌰", supported: false },
    { id: "OK", name: "Oklahoma", icon: "🤠", supported: false },
    { id: "OR", name: "Oregon", icon: "🌲", supported: false },
    { id: "PA", name: "Pennsylvania", icon: "🔔", supported: false },
    { id: "RI", name: "Rhode Island", icon: "⚓", supported: false },
    { id: "SC", name: "South Carolina", icon: "🌴", supported: false },
    { id: "SD", name: "South Dakota", icon: "🗿", supported: false },
    { id: "TN", name: "Tennessee", icon: "🎵", supported: false },
    { id: "TX", name: "Texas", icon: "🤠", supported: false },
    { id: "UT", name: "Utah", icon: "🏜️", supported: false },
    { id: "VT", name: "Vermont", icon: "🍁", supported: false },
    { id: "VA", name: "Virginia", icon: "🏛️", supported: false },
    { id: "WA", name: "Washington", icon: "🌲", supported: false },
    { id: "WV", name: "West Virginia", icon: "⛰️", supported: false },
    { id: "WI", name: "Wisconsin", icon: "🧀", supported: false },
    { id: "WY", name: "Wyoming", icon: "🦌", supported: false },
];

const FORM_CONTEXTS: Record<string, string> = {
    'DE-111': "Probate Initialization → Court Filing",
    'DE-121': "Creditor Notification → Notice Phase",
    'DE-150': "Probate Hub → Appointment Phase",
    'DE-160': "Asset Discovery → Inventory Phase"
};

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] || FileText;
    return <IconComponent className={className} />;
};

const Forms = () => {
    const [selectedState, setSelectedState] = useState("CA");
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const stateName = STATES.find(s => s.id === selectedState)?.name || selectedState;

    const { data: templates, isLoading: templatesLoading } = useQuery({
        queryKey: ["forms", "templates"],
        queryFn: api.getFormTemplates
    });

    const { data: readiness } = useQuery<FormReadiness>({
        queryKey: ["forms", "readiness"],
        queryFn: () => api.getFormReadiness()
    });

    const handleFormAction = async (formId: string, isPreview: boolean, isBlank: boolean = false) => {
        setLoadingAction(`${formId}-${isBlank ? 'blank' : (isPreview ? 'preview' : 'generate')}`);
        try {
            let blob: Blob;
            if (isBlank) {
                blob = await api.getTemplateFile(formId);
            } else {
                blob = await api.generateForm(formId, isPreview);
            }

            const url = window.URL.createObjectURL(blob);

            if (isPreview && !isBlank) {
                window.open(url, '_blank');
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${formId}${isBlank ? '_Blank' : ''}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            toast.success(isBlank ? "Blank template downloaded" : (isPreview ? "Preview layout ready" : "Form downloaded"));
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
            <SEO
                title={`${stateName} Probate Forms`}
                description={`Access official ${stateName} Judicial Council and Probate forms. Pre-filled, blank download, and auto-fill (Beta) support.`}
            />
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
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Select State:</span>
                        </div>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                        >
                            <optgroup label="✓ Fully Supported">
                                {STATES.filter(s => s.supported).map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.icon} {s.name}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="⏳ Coming Soon">
                                {STATES.filter(s => !s.supported).map(s => (
                                    <option key={s.id} value={s.id} disabled>
                                        {s.icon} {s.name} (Coming Soon)
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        
                        {!STATES.find(s => s.id === selectedState)?.supported && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs font-bold text-amber-500">Forms not yet available for this state</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {templatesLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-[10px]">Cataloging Forms...</p>
                        </div>
                    ) : !STATES.find(s => s.id === selectedState)?.supported ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <div className="p-6 rounded-full bg-slate-900 border border-slate-800 mb-6">
                                <MapPin className="w-12 h-12 opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {STATES.find(s => s.id === selectedState)?.name} Forms Coming Soon
                            </h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-md text-center">
                                We're working on adding official probate forms for {STATES.find(s => s.id === selectedState)?.name}. 
                                Currently, only California forms are available.
                            </p>
                            <Button
                                onClick={() => setSelectedState("CA")}
                                className="bg-primary hover:bg-primary/90 text-white font-bold"
                            >
                                View California Forms
                            </Button>
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
                                    filteredForms.map((form: any, index: number) => {
                                        const formReady = readiness?.[form.name]?.ready ?? true;
                                        const reason = readiness?.[form.name]?.reason;
                                        const context = FORM_CONTEXTS[form.name];

                                        return (
                                            <motion.div
                                                key={form.name}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Card className="bg-slate-900/50 border-slate-800/50 hover:border-primary/30 transition-all group relative overflow-hidden h-full flex flex-col rounded-3xl">
                                                    {/* Readiness Banner */}
                                                    <div className={cn(
                                                        "px-4 py-2 border-b flex items-center gap-2",
                                                        formReady ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                                                    )}>
                                                        {formReady ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                        )}
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            formReady ? "text-emerald-500" : "text-amber-500"
                                                        )}>
                                                            {formReady ? "Ready for Preparation" : "Not Ready Yet"}
                                                        </span>
                                                    </div>

                                                    <div className="absolute top-10 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
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

                                                        {context && (
                                                            <div className="mt-3 flex items-center gap-1.5 p-2 bg-white/5 rounded-xl">
                                                                <Info className="w-3 h-3 text-slate-500" />
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                    Used in: {context}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </CardHeader>

                                                    <div className="mt-auto px-6 pb-6 pt-2">
                                                        <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl"
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
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl"
                                                                    onClick={() => handleFormAction(form.name, false, true)}
                                                                    disabled={loadingAction !== null}
                                                                >
                                                                    {loadingAction === `${form.name}-blank` ? (
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Download className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    Blank
                                                                </Button>
                                                            </div>

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="w-full">
                                                                            <Button
                                                                                size="sm"
                                                                                className={cn(
                                                                                    "w-full transition-all border font-black uppercase tracking-widest text-[10px] h-10 rounded-xl",
                                                                                    formReady
                                                                                        ? "bg-primary/10 hover:bg-primary text-primary hover:text-white border-primary/20"
                                                                                        : "bg-white/5 text-slate-500 border-white/5 cursor-not-allowed"
                                                                                )}
                                                                                onClick={() => formReady && handleFormAction(form.name, false)}
                                                                                disabled={loadingAction !== null || !formReady}
                                                                            >
                                                                                {loadingAction === `${form.name}-generate` ? (
                                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                ) : (
                                                                                    formReady ? <FileText className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" /> : <Lock className="w-4 h-4 mr-2" />
                                                                                )}
                                                                                Auto-Fill (Beta)
                                                                            </Button>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    {!formReady && reason && (
                                                                        <TooltipContent className="bg-slate-900 border-slate-800 text-slate-300 text-[10px] font-bold uppercase p-3">
                                                                            {reason}
                                                                        </TooltipContent>
                                                                    )}
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight text-center mt-1">
                                                                Prepares a draft using your current estate data.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })
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

                {/* Legal Footnote */}
                <footer className="px-8 py-6 shrink-0 bg-slate-950 border-t border-white/5">
                    <div className="max-w-4xl mx-auto flex gap-6 items-center">
                        <Scale className="w-8 h-8 text-slate-800 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                ExpectedEstate is not a law firm and does not provide legal advice. We guarantee the integrity of your activity logs and the deterministic application of statutory notice periods as part of your fiduciary defense.
                            </p>
                            <p className="text-[10px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-widest">
                                Need help? Contact the Probate Hub Support Team
                            </p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Forms;
