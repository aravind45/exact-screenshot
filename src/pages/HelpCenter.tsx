import React from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    BookOpen,
    Search,
    Scale,
    Zap,
    Shield,
    HelpCircle,
    ArrowRight,
    MessageCircle,
    ExternalLink,
    AlertCircle,
    Info,
    Gavel,
    Heart,
    FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenter() {
    const faqs = [
        {
            category: "Core Concepts",
            items: [
                {
                    q: "Why do I see 'Non-Probate' assets if I'm doing a Full Probate?",
                    a: "Settling an estate requires a complete financial picture. Even if you are in court for 'solely owned' assets, you still need to track 'Non-Probate' items (like life insurance or joint accounts) because they impact your total estate value for taxes, and you are responsible for ensuring they reach the right beneficiaries."
                },
                {
                    q: "What is the California Small Estate threshold?",
                    a: "In California, if the total value of probate-qualified assets is under $184,500, you can usually avoid full court probate and use a 'Small Estate Affidavit' (Section 13100) instead. Non-probate assets like Living Trusts or Joint Tenancy do NOT count toward this limit."
                },
                {
                    q: "What is the difference between an Executor and an Administrator?",
                    a: "An Executor is named in a Will. An Administrator is appointed by the court if there is no Will (Intestate). Both perform the same duties as the 'Personal Representative' of the estate."
                }
            ]
        },
        {
            category: "Legal Forms",
            items: [
                {
                    q: "What is a DE-160 (Inventory & Appraisal)?",
                    a: "This is a mandatory list of everything the deceased owned. You value cash items (Attachment 1), and a court-appointed Probate Referee values everything else like real estate or jewelry (Attachment 2)."
                },
                {
                    q: "Do I need a lawyer for a Spousal Property Petition (DE-221)?",
                    a: "While not strictly required, a DE-221 is a legal proceeding. It's much simpler than full probate, but you must still file a petition and attend a court hearing. Our wizard helps you prep the forms, but an attorney can provide peace of mind."
                }
            ]
        }
    ];

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
                        <p className="text-slate-500 max-w-lg mx-auto">
                            Search our library of legal explanations, form guides, and California-specific probate tips.
                        </p>
                        <div className="relative max-w-xl mx-auto mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                className="pl-12 h-14 bg-white border-none shadow-xl shadow-slate-200/50 rounded-2xl text-lg"
                                placeholder="Search probate terms, forms like 'DE-160'..."
                            />
                        </div>
                    </div>

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

                    {/* Roadmap to Hub Mapping */}
                    <div className="space-y-6">
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
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((group, gIdx) => (
                                        <div key={gIdx}>
                                            <div className="bg-slate-50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">
                                                {group.category}
                                            </div>
                                            {group.items.map((item, iIdx) => (
                                                <AccordionItem key={iIdx} value={`item-${gIdx}-${iIdx}`} className="border-slate-100 px-6 last:border-none">
                                                    <AccordionTrigger className="text-sm font-bold text-left hover:no-underline hover:text-blue-600">
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

                    {/* Still Need Help? */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                        <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-bold">Chat with our AI Agent</h3>
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Our AI agent is trained on California probate code and can answer specific questions
                                    about your case 24/7.
                                </p>
                                <Button className="w-full bg-blue-600 hover:bg-blue-500 font-bold border-none">
                                    Start Chatting
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md bg-white border-l-4 border-l-rose-500">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                                        <Gavel className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Legal Consultation</h3>
                                </div>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                    Sometimes you need a human. We can connect you with California-licensed probate
                                    attorneys for a flat-fee review.
                                </p>
                                <Button variant="outline" className="w-full border-slate-200 text-slate-700 font-bold">
                                    Browse Attorneys <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
