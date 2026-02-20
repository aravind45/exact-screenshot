import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Search,
    ArrowRight,
    FileText,
    Clock,
    ChevronRight,
    Scale,
    Landmark,
    MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const GUIDES = [
    {
        title: "Complete Guide to Settled an Estate (2026)",
        description: "A step-by-step roadmap for executors navigating the probate process.",
        category: "State Probate Guides",
        slug: "probate",
        readTime: "12 min",
        icon: Scale,
        color: "text-indigo-600 bg-indigo-50"
    },
    {
        title: "The 7-Step Court Flow",
        description: "Standard probate following a rigid legal checklist.",
        category: "Master Hub",
        slug: "process",
        readTime: "8 min",
        icon: Landmark,
        color: "text-emerald-600 bg-emerald-50"
    },
    {
        title: "Executor Workflow Checklist",
        description: "Don't guess on the next step. Every task, deadline, and form.",
        category: "Execution",
        slug: "checklist",
        readTime: "15 min",
        icon: FileText,
        color: "text-amber-600 bg-amber-50"
    },
    {
        title: "AI Legal Q&A — Grounded in Law",
        description: "How ExpectedEstate uses RAG to answer complex probate questions.",
        category: "Technology",
        slug: "ai",
        readTime: "5 min",
        icon: MessageSquare,
        color: "text-teal-600 bg-teal-50"
    }
];

export function GuideExplorer() {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const filteredGuides = GUIDES.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenGuide = (slug: string) => {
        setOpen(false);
        navigate(`/guides/${slug}`);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors flex items-center gap-2 group">
                    <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    Guides
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-[540px] p-0 border-l border-slate-100 bg-slate-50/50 backdrop-blur-xl">
                <div className="flex flex-col h-full bg-white/80">
                    <SheetHeader className="p-8 pb-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black text-slate-900 leading-none">Guide Library</SheetTitle>
                                <p className="text-sm text-slate-500 font-medium mt-1">Settle with certainty, one step at a time.</p>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search guides, forms, or deadlines..."
                                className="pl-10 h-12 bg-slate-100/50 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-8 pb-8">
                        <div className="space-y-6">
                            <AnimatePresence mode="popLayout">
                                {filteredGuides.map((guide, i) => (
                                    <motion.div
                                        key={guide.slug}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => handleOpenGuide(guide.slug)}
                                        className="group cursor-pointer p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/5 transition-colors" />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <Badge variant="outline" className="rounded-full bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-none px-3">
                                                    {guide.category}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {guide.readTime}
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`p-3 rounded-2xl shrink-0 ${guide.color}`}>
                                                    <guide.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors leading-tight mb-1">
                                                        {guide.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 font-medium line-clamp-2">
                                                        {guide.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-xs font-black text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">
                                                Read Full Guide
                                                <ArrowRight className="w-3 h-3 ml-2" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredGuides.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="font-bold text-slate-400">No guides found for "{search}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                        <div className="bg-slate-950 rounded-[2.5rem] p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                            <h4 className="text-white font-black text-xl mb-2 relative z-10">Need expert help?</h4>
                            <p className="text-slate-400 text-sm font-medium mb-6 relative z-10 leading-relaxed">
                                Our verified advisor marketplace connects you with top probate specialists.
                            </p>
                            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl">
                                Browse Marketplace
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
