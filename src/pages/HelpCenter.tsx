import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AIChat } from "@/components/chat/AIChat";
import { MessageCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    BookOpen,
    Search,
    Scale,
    Zap,
    Shield,
    HelpCircle,
    ArrowRight,
    ExternalLink,
    AlertCircle,
    Info,
    Gavel,
    Heart,
    FileText,
    History,
    Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenter() {
    const navigate = useNavigate();
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const estateId = estate?.id;
    const [searchParams] = useSearchParams();
    const context = searchParams.get("context");
    const articleId = searchParams.get("article");
    const [searchQuery, setSearchQuery] = useState("");
    const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>();

    // Situational Search Anchors
    const situationalPrompts = [
        "Am I allowed to distribute yet?",
        "What does 'Blocked' mean?",
        "Why is my task locked?",
        "Is it safe to pay this creditor?",
        "How do I avoid liability?"
    ];

    const { data: recommendations } = useQuery({
        queryKey: ["help-recommendations", estateId],
        queryFn: () => fetch(`/api/help/recommendations/${estateId}`).then(res => res.json()),
        enabled: !!estateId
    });

    // Scroll to article if specified in URL
    React.useEffect(() => {
        if (articleId) {
            // Find which accordion item contains this article
            let foundItemValue: string | undefined;
            faqs.forEach((group, gIdx) => {
                group.items.forEach((item, iIdx) => {
                    if (item.id === articleId) {
                        foundItemValue = `item-${gIdx}-${iIdx}`;
                    }
                });
            });

            if (foundItemValue) {
                setOpenAccordionItem(foundItemValue);
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    const element = document.getElementById(`article-${articleId}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        }
    }, [articleId]);

    const logReference = async (topic: string) => {
        if (!estateId) return;
        try {
            await fetch("/api/help/log", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ estateId, topic })
            });
        } catch (e) {
            console.error("Failed to log help ref", e);
        }
    };

    const faqs = [
        {
            category: "Probate 101: Duties & Steps",
            items: [
                {
                    id: "probate-needed",
                    q: "When is full probate actually needed?",
                    a: "Probate is required when a deceased person owned assets in their name alone (no beneficiary, no joint owner) that exceed the state's 'Small Estate' threshold. In California, this is currently $184,500 for assets not in a trust or joint tenancy."
                },
                {
                    id: "executor-duties",
                    q: "What are the core duties of an Executor?",
                    a: "Your 'Fiduciary Duty' involves four main pillars: 1. Gathering and protecting assets. 2. Notifying creditors and heirs. 3. Paying valid debts and taxes from estate funds. 4. Distributing remaining property exactly as the Will specifies."
                },
                {
                    id: "probate-steps",
                    q: "What are the standard steps in a California probate case?",
                    a: "1. File Petition (DE-111) to open the case. 2. Publish Notice in a local paper. 3. Attend Hearing to get 'Letters (DE-150)'. 4. File Inventory (DE-160). 5. Pay Creditors/Taxes. 6. File Final Petition for Distribution. 7. Distribute assets and close the case."
                }
            ]
        },
        {
            category: "Understanding Settlement Types & Authority",
            items: [
                {
                    id: "settlement-vs-authority",
                    q: "What's the difference between 'Settlement Type' and 'Authority Type'?",
                    a: "Settlement Type is the OVERALL PATH or category of estate settlement (e.g., FORMAL_PROBATE, SMALL_ESTATE, TRUST_ADMIN). Authority Type is the SPECIFIC LEGAL DOCUMENT you need to act on behalf of the estate (e.g., LETTERS_TESTAMENTARY, AFFIDAVIT, SUCCESSOR_TRUSTEE). Think of it this way: Settlement Type = the process you're following. Authority Type = the document that gives you legal power."
                },
                {
                    id: "authority-examples",
                    q: "What are the common Authority Types for each Settlement Type?",
                    a: "FORMAL_PROBATE (with will) → LETTERS_TESTAMENTARY | INTESTATE (no will) → LETTERS_OF_ADMINISTRATION | SMALL_ESTATE → AFFIDAVIT (no court letters needed) | TRUST_ADMIN → SUCCESSOR_TRUSTEE (certificate of trust) | SPOUSAL_PETITION → SPOUSAL_PROPERTY_ORDER | JOINT_TRANSFER → AFFIDAVIT_OF_DEATH | POD_TOD_TRANSFER → BENEFICIARY_CLAIM"
                },
                {
                    id: "letters-testamentary",
                    q: "What are 'Letters Testamentary' and when do I need them?",
                    a: "Letters Testamentary (Form DE-150) are court-issued documents that prove you have legal authority to act as Executor of an estate with a Will. You receive them after the probate hearing. Financial institutions require these letters before they'll release assets to you. They're your 'proof of power' during the formal probate process."
                },
                {
                    id: "letters-administration",
                    q: "What's the difference between Letters Testamentary and Letters of Administration?",
                    a: "Both are court-issued authority documents (Form DE-150), but: LETTERS TESTAMENTARY = You're named as Executor in a Will. LETTERS OF ADMINISTRATION = No Will exists, so the court appoints you as Administrator. Once you have either one, your legal powers are identical—both give you full authority to manage the estate."
                }
            ]
        },
        {
            category: "Avoiding & Minimizing Probate",
            items: [
                {
                    id: "avoid-probate",
                    q: "How can I avoid court probate entirely?",
                    a: "Common 'Probate Shortcuts' include: 1. Small Estate Affidavits (for estates under threshold). 2. Living Trusts (assets move privately). 3. Joint Tenancy (survivor takes title). 4. POD/TOD designation (transfers on death). 5. Spousal Property Petitions (simplified court order for surviving spouses)."
                },
                {
                    id: "spousal-property",
                    q: "What is the benefit of a Spousal Property Petition (DE-221)?",
                    a: "This is a streamlined court process that transfers property to a surviving spouse without full probate. It's faster (weeks instead of months), costs less, and doesn't require the full 'Executor' checklist."
                }
            ]
        },
        {
            category: "Trust Administration",
            items: [
                {
                    id: "trust-administration",
                    q: "How do I administer a Living Trust?",
                    a: "1. Read the Trust document carefully. 2. Sign an 'Affidavit of Assumption' to take over as Trustee. 3. Notify beneficiaries. 4. Collect and value trust assets. 5. Pay trust-related debts and taxes. 6. Distribute property according to the trust's instructions—usually without any court involvement."
                },
                {
                    id: "executor-vs-trustee",
                    q: "What is the difference between an Executor and a Successor Trustee?",
                    a: "An Executor handles property in the Will (monitored by a judge). A Successor Trustee handles property inside a Living Trust (handled privately). Often, the same person does both if some assets were left out of the trust."
                }
            ]
        },
        {
            category: "Asset Mastery: Locate, Value, Manage",
            items: [
                {
                    id: "critical-dates",
                    q: "How are 'Critical Dates' generated if I didn't enter them?",
                    a: "Critical dates (statutory deadlines) are automatically calculated based on the 'Date of Death' you provided. For example, the Petition for Probate is typically due within 1 month, and the Inventory & Appraisal within 4 months. These reminders help ensure you stay compliant with California court timelines without having to manually track them."
                },
                {
                    id: "asset-discovery",
                    q: "How do I find all the assets?",
                    a: "Search through: 1. Physical mail/statements. 2. Tax returns (look for 1099s). 3. Digital accounts/email. 4. Real estate records in the county. 5. Unclaimed property databases. Our 'Discovery' hub helps automate this forensic search."
                },
                {
                    id: "inventory-appraisal",
                    q: "How are assets valued for the court?",
                    a: "You must use the 'Date of Death' market value. For cash/bank accounts, you list the balance. For real estate, vehicles, or jewelry, a court-appointed 'Probate Referee' must perform an official appraisal (DE-160)."
                },
                {
                    id: "asset-management",
                    q: "What are my duties for managing property?",
                    a: "You must safeguard assets: Change locks on empty houses, ensure vehicles are insured/garaged, keep estate cash in a separate 'Estate Bank Account', and avoid mixing estate money with your own."
                }
            ]
        },
        {
            category: "Creditors, Taxes & Closing",
            items: [
                {
                    id: "creditor-claims",
                    q: "How do I handle creditors?",
                    a: "You must send a formal Notice to Creditors (DE-157). They generally have 4 months to file a claim. You pay valid bills in a specific legal order: Admin expenses first, then funeral costs, then taxes, then general debts."
                },
                {
                    id: "creditor-notice",
                    q: "What is the creditor notice requirement?",
                    a: "You must publish notice in a local newspaper for 3 consecutive weeks and mail notice to all known creditors. This starts the 4-month creditor claim period and protects you from late claims after distribution."
                },
                {
                    id: "tax-returns",
                    q: "What tax returns are required?",
                    a: "1. The final 'Individual Income Tax' (Form 1040) for the deceased. 2. The 'Estate Income Tax' (Form 1041) if the estate generates income while probate is open. 3. Estate Tax (Form 706) only if the total value exceeds the multi-million dollar federal limit."
                }
            ]
        },
        {
            category: "Wills vs. No-Will (Intestacy)",
            items: [
                {
                    id: "no-will",
                    q: "What if there is no Will?",
                    a: "This is called 'Intestacy'. The state's 'Intestate Succession' laws decide who inherits (usually spouse, then children, then parents). You are appointed as an 'Administrator' instead of an 'Executor', but the process is mostly the same."
                },
                {
                    id: "administrator-vs-executor",
                    q: "Is an 'Administrator' different from an 'Executor'?",
                    a: "Only in how you are named. An Executor is chosen by the deceased in a Will. An Administrator is chosen by the Judge. Both have the same 'Personal Representative' authority once they receive their Letters."
                }
            ]
        },
        {
            category: "Small Estate Affidavit",
            items: [
                {
                    id: "small-estate-affidavit",
                    q: "How does the Small Estate Affidavit work?",
                    a: "For estates under $184,500 in California, you can use a Small Estate Affidavit (Section 13100) to claim assets without going through court probate. You must wait 40 days after death, then present the notarized affidavit directly to financial institutions. This is the fastest way to settle a small estate."
                }
            ]
        }
    ];

    const contextualBanner = {
        distribution: { title: "Viewing Help for: Final Distribution", q: ["Safe to distribute?", "Early distribution risks", "Court approval needed"] },
        discovery: { title: "Viewing Help for: Asset Discovery", q: ["Finding digital assets", "Safe deposit boxes", "Small estate shortcuts"] },
        liabilities: { title: "Viewing Help for: Creditor Claims", q: ["Safe to pay creditors?", "Insolvency risks", "Priority of claims"] },
        accounting: { title: "Viewing Help for: Estate Accounting", q: ["Waiver of accounting", "Record retention", "Proof of value"] }
    }[context as string];

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Hero Section */}
                    <div className="text-center space-y-4 py-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest">
                            <BookOpen className="w-3 h-3" /> Knowledge Base
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">How can we help?</h1>
                        <p className="text-slate-500 max-w-lg mx-auto italic text-sm">
                            Search our library of legal explanations, form guides, and California-specific probate tips.
                        </p>

                        <div className="relative max-w-xl mx-auto mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                className="pl-12 h-14 bg-white border-none shadow-xl shadow-slate-200/50 rounded-2xl text-lg"
                                placeholder="What are you trying to do right now?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {/* Situational Search Chips */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                                {situationalPrompts.map(p => (
                                    <Badge
                                        key={p}
                                        variant="outline"
                                        className="bg-white hover:bg-slate-50 text-[10px] text-slate-500 font-bold border-slate-200 cursor-pointer h-7 px-3 flex items-center gap-1.5 transition-all group"
                                        onClick={() => {
                                            setSearchQuery(p);
                                            logReference(p);
                                        }}
                                    >
                                        <Sparkles className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                                        {p}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contextual / Recommended Section */}
                    {(contextualBanner || (recommendations && recommendations.length > 0)) && (
                        <Card className="border-none shadow-xl bg-indigo-600 text-white overflow-hidden rounded-[32px] relative group transition-all">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
                            <CardContent className="p-8 relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <Zap className="w-5 h-5 text-white animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-tight">
                                            {contextualBanner?.title || "Recommended Focus Right Now"}
                                        </h3>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Based on your current roadmap phase</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(contextualBanner?.q || recommendations || []).map((topic: string) => (
                                        <Button
                                            key={topic}
                                            variant="secondary"
                                            className="justify-between h-12 bg-white/10 hover:bg-white/20 border-white/5 text-white font-bold rounded-2xl backdrop-blur-sm transition-all text-xs"
                                            onClick={() => logReference(topic)}
                                        >
                                            <span className="truncate">{topic}</span>
                                            <ArrowRight className="w-4 h-4 shrink-0" />
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Fast Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white group">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <Scale className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-sm text-slate-900">Probate 101</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white group">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-sm text-slate-900">Trust Admin</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white group">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-sm text-slate-900">Form Guides</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Strategic Settlement Paths */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl font-bold text-slate-900">Strategic Settlement Paths</h2>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">
                                Strategy Guide
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Probate */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all rounded-[2rem]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                            <Gavel className="w-5 h-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 text-[9px] font-black tracking-widest uppercase">Required</Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold">Full Probate Flow</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Estate {">"} $184,500</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        Formal court process required when assets exceed the state threshold. Involves a judge's oversight, public notice, and a formal appointment of a Personal Representative.
                                    </p>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Key Milestones</Label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {[
                                                "File Petition (DE-111)",
                                                "Letters of Authority (DE-150)",
                                                "Final Distribution Order"
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                    <div className="w-1 h-1 rounded-full bg-rose-400" />
                                                    {m}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Small Estate */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all rounded-[2rem]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black tracking-widest uppercase">Streamlined</Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold">Small Estate Affidavit</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Estate ≤ $184,500</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        A simplified non-court process for smaller estates. Allows heirs to claim assets by presenting a notarized affidavit directly to financial institutions.
                                    </p>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Key Milestones</Label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {[
                                                "40-Day Waiting Period",
                                                "Notarized §13100 Affidavit",
                                                "Instant Asset Transfer"
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                    {m}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Spousal Property */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all rounded-[2rem]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Heart className="w-5 h-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black tracking-widest uppercase">Spousal</Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold">Spousal Property Flow</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Surviving Spouses</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        A streamlined court order (DE-221) designed specifically for property passing to a surviving spouse or domestic partner. Much faster than full probate.
                                    </p>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Key Milestones</Label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {[
                                                "File Petition (DE-221)",
                                                "Court Order for Transfer",
                                                "Title Re-registration"
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                                    {m}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Trust Administration */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all rounded-[2rem]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black tracking-widest uppercase">Private</Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold">Trust Administration</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Assets in Living Trust</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        A private process where the Successor Trustee manages and distributes assets according to the terms of the Living Trust. Usually involves zero court filings.
                                    </p>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Key Milestones</Label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {[
                                                "Successor Trustee Notice",
                                                "Asset Certification",
                                                "Private Distribution"
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                                                    {m}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Joint / POD-TOD */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all rounded-[2rem] md:col-span-2">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <History className="w-5 h-5" />
                                        </div>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-black tracking-widest uppercase">Automatic</Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold">Joint Transfer / POD-TOD Flow</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Operation of Law</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        Assets with named beneficiaries or joint owners transfer automatically ("By Operation of Law"). This is the fastest way to settle an asset and requires no probate or trust work.
                                    </p>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Key Milestones</Label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {[
                                                "Death Certificate Submission",
                                                "Institution Claims Forms",
                                                "Direct Payout to Beneficiary"
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                                    {m}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Roadmap to Hub Mapping */}
                    <div id="mapping" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl font-bold text-slate-900">Roadmap to Hub Mapping</h2>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">
                                App Navigation Guide
                            </Badge>
                        </div>
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Step #</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Roadmap Step</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Functional Hub</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action / Form</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {[
                                                { step: "01", roadmap: "Immediate Actions (Phase 1)", hub: "Document Vault", action: "Upload Death Certificate & Will", note: "Foundational documents needed for everything else." },
                                                { step: "02", roadmap: "Check Eligibility", hub: "Overview / Onboarding", action: "Strategy Selection", note: "Determine if probate is even required (Small Estate)." },
                                                { step: "02b", roadmap: "Non-Probate Transfers", hub: "Assets Hub", action: "TOD / Beneficiary Claims", note: "Assets like Life Insurance or Joint Accounts that bypass court." },
                                                { step: "03", roadmap: "File Petition (DE-111)", hub: "Probate Hub", action: "Generate/Upload DE-111", note: "Opens the court case and starts the clock." },
                                                { step: "04", roadmap: "Publish/Mail Notice", hub: "Settlement Trail", action: "Upload Proofs of Notice", note: "Required to clear potential debts." },
                                                { step: "05", roadmap: "Receive Letters (DE-150)", hub: "Probate Hub", action: "Upload DE-150 (Unlocks Assets)", note: "Grant of legal authority. The 'God Move'." },
                                                { step: "06", roadmap: "Asset Discovery", hub: "Assets Hub", action: "Extract from statements", note: "Finding and valuing all estate property." },
                                                { step: "07", roadmap: "Inventory & Appraisal", hub: "Probate Hub", action: "Upload DE-160", note: "Official report of values to the court." },
                                                { step: "08", roadmap: "Creditor Claims", hub: "Settlement Trail", action: "Manage Debt status", note: "Paying valid debts or rejecting invalid ones." },
                                                { step: "09", roadmap: "Asset Liquidation", hub: "Assets Hub", action: "Record transfers/sales", note: "Moving assets out of the name of the deceased." },
                                                { step: "10", roadmap: "Final Distribution", hub: "Distribution Hub", action: "Close Estate", note: "Handing over inheritance and closing the file." }
                                            ].map((row, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-slate-400">{row.step}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-slate-900">{row.roadmap}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{row.note}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[9px] font-bold uppercase tracking-tight px-1.5 h-5">
                                                            {row.hub}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{row.action}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 px-1">Common Questions</h2>
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                    value={openAccordionItem}
                                    onValueChange={setOpenAccordionItem}
                                >
                                    {faqs.map((group, gIdx) => (
                                        <div key={gIdx}>
                                            <div className="bg-slate-50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">
                                                {group.category}
                                            </div>
                                            {group.items.map((item, iIdx) => (
                                                <AccordionItem
                                                    key={iIdx}
                                                    value={`item-${gIdx}-${iIdx}`}
                                                    className="border-slate-100 px-6 last:border-none"
                                                    id={`article-${item.id}`}
                                                >
                                                    <AccordionTrigger
                                                        className="text-sm font-bold text-left hover:no-underline hover:text-blue-600"
                                                        onClick={() => logReference(item.q)}
                                                    >
                                                        {item.q}
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-4">
                                                        {item.a}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </div>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Legal Assistant Section */}
                    <div className="pb-12">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 text-blue-400" />
                                Legal Assistant (RAG)
                            </h2>
                            <p className="text-slate-400 text-sm">Ask questions based on our primary legal guides and California Probate Code.</p>
                        </div>
                        <AIChat />
                    </div>

                </div>
            </main>
        </div>
    );
}
