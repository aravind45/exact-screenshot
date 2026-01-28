import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    CheckSquare,
    ChevronRight,
    ArrowLeft,
    FileText,
    Scale,
    Users,
    Landmark,
    CheckCircle2,
    Search,
    Download,
    Eye,
    AlertCircle,
    Info,
    History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function ClosingStatement() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        { id: 1, label: "Case Status", desc: "Verify claims & taxes", icon: Search },
        { id: 2, label: "Accounting", desc: "Finalize totals", icon: Scale },
        { id: 3, label: "Distributions", desc: "Plan asset transfers", icon: Users },
        { id: 4, label: "Final Review", desc: "Generate Petition", icon: FileText },
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-lg shadow-sm">
                                <CheckSquare className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Closing Statement Wizard</h1>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Petition for Final Distribution</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            California DE-295 Compatible
                        </Badge>
                    </header>

                    {/* Progress Bar */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                {steps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isActive = currentStep === step.id;
                                    const isCompleted = currentStep > step.id;

                                    return (
                                        <div key={step.id} className="flex flex-col items-center relative z-10">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                isActive ? "bg-slate-900 text-white shadow-lg ring-4 ring-slate-100" :
                                                    isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <div className={cn("text-[10px] font-black uppercase tracking-tighter", isActive ? "text-slate-900" : "text-slate-400")}>
                                                    {step.label}
                                                </div>
                                            </div>
                                            {idx < steps.length - 1 && (
                                                <div className={cn(
                                                    "absolute top-5 left-[50px] w-[140%] h-[2px]",
                                                    currentStep > step.id + 1 ? "bg-emerald-500" : "bg-slate-100"
                                                )} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Step Content */}
                            <div className="min-h-[300px] flex flex-col">
                                {currentStep === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-2">
                                            <h2 className="text-lg font-bold text-slate-900 italic underline decoration-slate-200 underline-offset-8">Phase 1: Legal & Tax Readiness</h2>
                                            <p className="text-sm text-slate-500">Before petitioning for closure, verify these court prerequisites.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: "Creditor Claims Period", desc: "4 months since letters issued", status: "complete" },
                                                { label: "Notice to Franchise Tax Board", desc: "Filed within 30 days of letters", status: "complete" },
                                                { label: "Final Income Tax Return", desc: "IRS Form 1040 (Final)", status: "pending" },
                                                { label: "Inventory & Appraisal", desc: "DE-160 filed with Clerk", status: "complete" },
                                            ].map((item, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                                                    {item.status === 'complete' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">{item.label}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-12">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Scale className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">Accounting Verified</h2>
                                        <p className="text-slate-500 text-sm max-w-md mx-auto">
                                            We've imported your totals from the Estate Accounting tool.
                                            Total property currently available for distribution is **$124,500.00**.
                                        </p>
                                        <Button variant="ghost" size="sm" className="text-emerald-600 font-bold uppercase text-[10px]" onClick={() => navigate("/accounting")}>
                                            <Eye className="w-3 h-3 mr-2" /> View Detailed Schedules
                                        </Button>
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="p-6 bg-slate-900 rounded-2xl text-white">
                                            <div className="flex items-center gap-4 mb-4">
                                                <Download className="w-6 h-6 text-blue-400" />
                                                <h3 className="text-lg font-bold">Ready to Print</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-6">
                                                Your **Petition for Final Distribution** has been generated using California Probate
                                                Code compliance rules.
                                            </p>
                                            <div className="flex gap-3">
                                                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-6 border-none">
                                                    Download Petition PDF
                                                </Button>
                                                <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold h-11 px-6">
                                                    Generate Final Order
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200">
                                            <div className="flex gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-bold text-slate-900 uppercase">Next Steps</h4>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                                        "Once you file this petition, the court will set a hearing date (usually 4-8 weeks out).
                                                        You must serve a Notice of Hearing (DE-120) on all beneficiaries at least 15 days before the hearing."
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-50">
                                    <Button variant="ghost" className="text-slate-400 font-bold uppercase text-[10px]" onClick={prevStep} disabled={currentStep === 1}>
                                        <ArrowLeft className="w-3 h-3 mr-2" /> Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {steps.map(s => (
                                            <div key={s.id} className={cn("w-1.5 h-1.5 rounded-full transition-all", currentStep === s.id ? "bg-slate-900 w-4" : "bg-slate-200")} />
                                        ))}
                                    </div>
                                    <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-8 rounded-lg shadow-lg" onClick={nextStep} disabled={currentStep === steps.length}>
                                        Continue <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
