import React from "react";
import { Link } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface TableOfContentsItem {
    id: string;
    label: string;
}

interface PillarPageLayoutProps {
    children: React.ReactNode;
    toc?: TableOfContentsItem[];
    heroTitle: string;
    heroSubtitle: string;
    category: string;
}

export function PillarPageLayout({
    children,
    toc,
    heroTitle,
    heroSubtitle,
    category
}: PillarPageLayoutProps) {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section - Premium Visuals */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950">
                {/* Background Blurs */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] pointer-events-none opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none opacity-30" />

                <div className="section-container relative z-10">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-8"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            {category}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight"
                        >
                            {heroTitle}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed"
                        >
                            {heroSubtitle}
                        </motion.p>
                    </div>
                </div>
            </section>

            <div className="section-container py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Area */}
                    <main className="lg:col-span-8">
                        <div className="prose prose-slate prose-lg max-w-none 
                  font-serif
                  prose-headings:font-sans prose-headings:font-black prose-headings:text-slate-900 
                  prose-h2:text-3xl prose-h2:mt-16 prose-h2:pb-4 prose-h2:border-b prose-h2:border-slate-100
                  prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
                  prose-strong:text-slate-900 prose-strong:font-bold
                  prose-li:text-slate-600 prose-ul:list-disc prose-ol:list-decimal
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-slate-700
                ">
                            {children}
                        </div>
                    </main>

                    {/* Sidebar / TOC */}
                    <aside className="lg:col-span-4 space-y-8">
                        {toc && toc.length > 0 && (
                            <div className="sticky top-24">
                                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium">
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-slate-400">On this page</h4>
                                    <nav className="flex flex-col gap-4">
                                        {toc.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-3 group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary group-hover:scale-150 transition-all" />
                                                {item.label}
                                            </a>
                                        ))}
                                    </nav>

                                    <Separator className="my-8 bg-slate-100" />

                                    <div className="p-8 bg-slate-950 rounded-3xl relative overflow-hidden group">
                                        {/* Accent blur */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                                        <h5 className="relative z-10 font-black text-white text-xl mb-2 leading-tight">Ready to start?</h5>
                                        <p className="relative z-10 text-sm text-slate-400 mb-6 font-medium leading-relaxed">
                                            Skip the paperwork and let our guided intake handle the details for you.
                                        </p>
                                        <Button
                                            asChild
                                            className="relative z-10 w-full h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg shadow-primary/20"
                                        >
                                            <Link to="/auth?mode=signup">Begin Guided Intake</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <Footer />
        </div>
    );
}

