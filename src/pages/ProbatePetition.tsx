import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, CheckCircle, AlertCircle, Users, Gavel, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProbatePetition() {
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    if (!estate) return <div className="p-8">Loading estate data...</div>;

    const missingFields = [];
    if (!estate.deceasedFirstName) missingFields.push("Decedent Name");
    if (!estate.deceasedDateOfDeath) missingFields.push("Date of Death");
    if (!estate.probateCounty) missingFields.push("Probate County");
    if (!estate.heirs || estate.heirs.length === 0) missingFields.push("Heirs/Beneficiaries");

    const progress = Math.max(0, 100 - (missingFields.length * 25));
    const isReady = missingFields.length === 0;

    const handleDownload = () => {
        window.open(`${import.meta.env.VITE_API_URL || "/api"}/estates/my/petition/pdf?token=${localStorage.getItem("auth_token")}`, '_blank');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Probate Petition (DE-111)</h1>
                <p className="text-muted-foreground underline">
                    The foundation of your authority. This document initiates the court process.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Completion Status</CardTitle>
                            <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                isReady ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {isReady ? "Ready to File" : "In Progress"}
                            </span>
                        </div>
                        <CardDescription>
                            We are gathering the required data for your California Petition for Probate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Overall Readiness</span>
                                <span className="font-bold">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <StatusItem
                                icon={<FileText className="w-4 h-4" />}
                                label="Decedent Info"
                                complete={!!estate.deceasedFirstName && !!estate.deceasedDateOfDeath}
                            />
                            <StatusItem
                                icon={<Landmark className="w-4 h-4" />}
                                label="Court Selection"
                                complete={!!estate.probateCounty}
                            />
                            <StatusItem
                                icon={<Users className="w-4 h-4" />}
                                label="Heirs List"
                                complete={estate.heirs?.length > 0}
                            />
                            <StatusItem
                                icon={<Gavel className="w-4 h-4" />}
                                label="Bond Logic"
                                complete={estate.bondWaived || !!estate.bondAmount}
                            />
                        </div>

                        {!isReady && (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Missing Information</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            The AI Agent needs the following to complete your petition:
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-amber-800 mt-2 space-y-1">
                                            {missingFields.map(f => <li key={f}>{f}</li>)}
                                        </ul>
                                        <p className="text-[10px] mt-3 font-medium opacity-80 uppercase tracking-tight italic">
                                            TIP: Ask the AI Chat (bottom right) to "Check my petition status" to resolve these.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline">Preview Draft</Button>
                            <Button onClick={handleDownload} disabled={!isReady && progress < 50}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Court PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm">What is form DE-111?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-4 leading-relaxed">
                        <p>
                            The **Petition for Probate** is the first official document you submit to the Superior Court in California.
                        </p>
                        <p>
                            It asks the judge to:
                            1. Prove the Will (if one exists).
                            2. Appoint you as the legal representative.
                            3. Approve the "bond" amount or waive it.
                        </p>
                        <div className="p-3 bg-muted rounded border border-dashed text-[10px] space-y-2">
                            <p className="font-bold uppercase tracking-widest text-primary">Pro Tip</p>
                            <p>
                                In California, most petitions are filed in the county where the deceased resided at their time of death.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatusItem({ icon, label, complete }: { icon: React.ReactNode, label: string, complete: boolean }) {
    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className={cn(
                "p-2 rounded-md",
                complete ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{label}</p>
                <p className={cn("text-[10px]", complete ? "text-green-600" : "text-muted-foreground")}>
                    {complete ? "Complete" : "Missing"}
                </p>
            </div>
            {complete && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
    );
}
