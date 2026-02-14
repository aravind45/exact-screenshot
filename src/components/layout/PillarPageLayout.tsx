import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
        <div className="min-h-screen bg-slate-50/30">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-white border-b border-slate-100">
                <div className="section-container">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {category}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight"
                        >
                            {heroTitle}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-500 font-medium max-w-2xl"
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
                        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                            <CardContent className="p-8 md:p-12">
                                <div className="prose prose-slate prose-lg max-w-none 
                  prose-headings:font-black prose-headings:text-slate-900 
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:pb-4 prose-h2:border-b prose-h2:border-slate-100
                  prose-p:text-slate-600 prose-p:leading-relaxed
                  prose-strong:text-slate-900 prose-strong:font-bold
                  prose-li:text-slate-600 prose-ul:list-disc prose-ol:list-decimal
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic
                ">
                                    {children}
                                </div>
                            </CardContent>
                        </Card>
                    </main>

                    {/* Sidebar / TOC */}
                    <aside className="lg:col-span-4 space-y-8">
                        {toc && toc.length > 0 && (
                            <div className="sticky top-24">
                                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-slate-400">On this page</h4>
                                    <nav className="flex flex-col gap-4">
                                        {toc.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-2 group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
                                                {item.label}
                                            </a>
                                        ))}
                                    </nav>

                                    <Separator className="my-8" />

                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                        <h5 className="font-bold text-slate-900 mb-2">Ready to start?</h5>
                                        <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                                            Skip the paperwork and let our guided intake handle the details for you.
                                        </p>
                                        <a
                                            href="/auth?mode=signup"
                                            className="inline-flex items-center justify-center w-full py-3 px-4 bg-primary text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                                        >
                                            Begin Guided Intake
                                        </a>
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
