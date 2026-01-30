import React from "react";
import { SEO } from "./SEO";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ShieldCheck, User, Calendar, BookOpen } from "lucide-react";

interface PillarContentProps {
    title: string;
    description: string;
    category: string;
    publishDate: string;
    readTime: string;
    author: {
        name: string;
        role: string;
        image?: string;
        bio: string;
    };
    expertReviewer?: {
        name: string;
        role: string;
    };
    faqs?: Array<{ question: string; answer: string }>;
    steps?: Array<{ name: string; text: string }>;
    children: React.ReactNode;
}

export const PillarContentTemplate: React.FC<PillarContentProps> = ({
    title,
    description,
    category,
    publishDate,
    readTime,
    author,
    expertReviewer,
    faqs,
    steps,
    children,
}) => {
    // Generate Structured Data (JSON-LD)
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "datePublished": publishDate,
        "author": {
            "@type": "Person",
            "name": author.name,
        },
        ...(faqs && {
            "mainEntity": faqs.map((f) => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.answer,
                },
            })),
        }),
        ...(steps && {
            "@type": "HowTo",
            "name": title,
            "step": steps.map((s, i) => ({
                "@type": "HowToStep",
                "position": i + 1,
                "name": s.name,
                "text": s.text,
            })),
        }),
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <SEO
                title={title}
                description={description}
                ogType="article"
                structuredData={structuredData}
            />

            {/* Breadcrumbs / Category */}
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <span>{category}</span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-500">Guide</span>
            </div>

            {/* Header */}
            <header className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                    {title}
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed mb-8">
                    {description}
                </p>

                {/* E-E-A-T Signals */}
                <div className="flex flex-wrap items-center gap-6 py-6 border-y border-white/5">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-primary/20">
                            <AvatarImage src={author.image} />
                            <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">{author.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{author.role}</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/5 hidden md:block" />

                    <div className="flex items-center gap-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{publishDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{readTime} read</span>
                        </div>
                    </div>

                    {expertReviewer && (
                        <div className="ml-auto">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Expert Reviewed by {expertReviewer.name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <article className="prose prose-invert prose-slate max-w-none">
                {children}
            </article>

            {/* FAQ Section (SEO Value) */}
            {faqs && faqs.length > 0 && (
                <section className="mt-20 pt-10 border-t border-white/5">
                    <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                    <div className="grid gap-6">
                        {faqs.map((faq, i) => (
                            <Card key={i} className="p-6 bg-slate-900/50 border-white/5">
                                <h3 className="text-lg font-bold text-white mb-3">{faq.question}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Author Bio (Trust) */}
            <footer className="mt-20 p-8 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-6">
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                        <AvatarImage src={author.image} />
                        <AvatarFallback><User className="w-8 h-8" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-2">About {author.name}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            {author.bio}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
