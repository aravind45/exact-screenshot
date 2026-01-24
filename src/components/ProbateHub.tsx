
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Gavel,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    Edit3,
    Save,
    X,
    ChevronRight,
    Scale,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProcessFlow } from "./ProcessFlow";
import { TRACK_STAGES, SettlementTrack } from "@/config/settlementStages";
import { calculateAuthorityRecommendation, getInstitutionAuthorityRequirement } from "@/lib/authorityEngine";
import { cn } from "@/lib/utils";
import { DocumentVault } from "./DocumentVault";

export function ProbateHub() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: assets = [] } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateMyEstate(data),
        onSuccess: () => {
            toast({ title: "Legal Status Updated", description: "The estate's probate tracking has been updated." });
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            setIsEditing(false);
        }
    });

    const individualAssets = assets.filter((a: any) => a.ownershipType === "INDIVIDUAL");
    const probateRequiredCount = individualAssets.length;

    if (isLoading) return <div className="h-40 flex items-center justify-center">Loading legal status...</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "EXECUTOR_APPOINTED": return "bg-green-100 text-green-700";
            case "FILED": return "bg-blue-100 text-blue-700";
            case "CLOSED": return "bg-gray-100 text-gray-700";
            default: return "bg-amber-100 text-amber-700";
        }
    };

    const statusMap: Record<string, string> = {
        NOT_STARTED: "Not Started",
        FILED: "Case Filed",
        EXECUTOR_APPOINTED: "Executor Appointed",
        CLOSED: "Probate Closed",
        NOT_REQUIRED: "Not Required"
    };

    return (
        <Card className="card-elevated border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Scale className="w-16 h-16" />
            </div>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-primary" />
                        Probate Command Center
                    </CardTitle>
                    <CardDescription>
                        Manage legal filings and court authority
                    </CardDescription>
                </div>
                {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update Status
                    </Button>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="editing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Estate Type / Track</label>
                                    <Select
                                        defaultValue={estate.estateType || "PROBATE"}
                                        onValueChange={(val) => updateMutation.mutate({ estateType: val })}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PROBATE">Probate (Full Administration)</SelectItem>
                                            <SelectItem value="SMALL_ESTATE">Small Estate (Affidavit)</SelectItem>
                                            <SelectItem value="TRUST_BASED">Trust-Based Settlement</SelectItem>
                                            <SelectItem value="NON_PROBATE">Non-Probate / Beneficiary-Only</SelectItem>
                                            <SelectItem value="INTESTATE">Intestate (No Will)</SelectItem>
                                            <SelectItem value="ANCILLARY">Ancillary (Multi-State)</SelectItem>
                                            <SelectItem value="INSOLVENT">Insolvent (Debt-Heavy)</SelectItem>
                                            <SelectItem value="SPECIAL">Special / Conditional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Probate Status</label>
                                    <Select
                                        defaultValue={estate.probateStatus}
                                        onValueChange={(val) => updateMutation.mutate({ probateStatus: val })}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                                            <SelectItem value="FILED">Case Filed in Court</SelectItem>
                                            <SelectItem value="EXECUTOR_APPOINTED">Letters Testamentary Issued</SelectItem>
                                            <SelectItem value="CLOSED">Probate Closed</SelectItem>
                                            <SelectItem value="NOT_REQUIRED">Not Required for this Estate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Court Case Number</label>
                                    <Input
                                        placeholder="EX: 2024-PR-12345"
                                        defaultValue={estate.courtCaseNumber}
                                        className="bg-white"
                                        onBlur={(e) => updateMutation.mutate({ courtCaseNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Deceased First Name</label>
                                    <Input
                                        defaultValue={estate.deceasedFirstName}
                                        className="bg-white"
                                        onBlur={(e) => updateMutation.mutate({ deceasedFirstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Deceased Last Name</label>
                                    <Input
                                        defaultValue={estate.deceasedLastName}
                                        className="bg-white"
                                        onBlur={(e) => updateMutation.mutate({ deceasedLastName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">SSN (last 4 or full)</label>
                                    <Input
                                        defaultValue={estate.deceasedSsn}
                                        className="bg-white"
                                        onBlur={(e) => updateMutation.mutate({ deceasedSsn: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Certified Copies on Hand</label>
                                    <Input
                                        type="number"
                                        defaultValue={estate.certifiedCopies}
                                        className="bg-white"
                                        onBlur={(e) => updateMutation.mutate({ certifiedCopies: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="viewing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Settlement Track</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {estate.estateType?.replace(/_/g, " ") || "Probate (Full)"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Current State</p>
                                    <Badge className={getStatusColor(estate.probateStatus)}>
                                        {statusMap[estate.probateStatus] || estate.probateStatus}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Case Number</p>
                                    <p className="text-sm font-semibold">{estate.courtCaseNumber || "Unassigned"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Jurisdiction</p>
                                    <p className="text-sm font-semibold">{estate.deceasedState || "N/A"}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Authority Eligibility Logic */}
                <div className="pt-4 border-t border-border/50">
                    {(() => {
                        const rec = calculateAuthorityRecommendation(assets, estate.deceasedState || "CA");
                        const status = estate.authorityStatus || "NOT_STARTED";
                        const isGranted = status === "GRANTED" || estate.probateStatus === "EXECUTOR_APPOINTED";

                        // Analyze mixed authority requirements
                        const authRequirements = assets.map((a: any) =>
                            getInstitutionAuthorityRequirement(a.assetType, a.category, a.value || 0, a.ownershipType)
                        );
                        const needsLetters = authRequirements.some(r => r.requirement === "LETTERS_REQUIRED" || r.requirement === "LETTERS_PREFERRED");
                        const canUseAffidavit = authRequirements.some(r => r.requirement === "AFFIDAVIT_ACCEPTED");
                        const hasBeneficiaryOnly = authRequirements.some(r => r.requirement === "BENEFICIARY_ONLY");
                        const isMixedAuthority = (needsLetters && canUseAffidavit) || (needsLetters && hasBeneficiaryOnly) || (canUseAffidavit && hasBeneficiaryOnly);

                        return (
                            <div className="space-y-4">
                                {isMixedAuthority && (
                                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-900 leading-none mb-1">Mixed Authority Estate Detected</p>
                                            <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                                Your estate requires multiple authority paths:
                                                {needsLetters && " Letters Testamentary for some assets,"}
                                                {canUseAffidavit && " Small Estate Affidavit for others,"}
                                                {hasBeneficiaryOnly && " Direct beneficiary claims for designated accounts."}
                                                {" "}This is common and expected.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className={cn(
                                    "flex items-start gap-4 p-4 rounded-xl border",
                                    rec.type === "SMALL_ESTATE" ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                                )}>
                                    {rec.type === "SMALL_ESTATE" ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={cn("text-sm font-bold", rec.type === "SMALL_ESTATE" ? "text-green-900" : "text-amber-900")}>
                                                Authority Optimizer: {rec.type === "SMALL_ESTATE" ? "Small Estate Eligible" : "Full Probate Required"}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">
                                                {estate.deceasedState || "CA"} Threshold
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                            {rec.reason}
                                        </p>

                                        {!isGranted && (
                                            <div className="mt-4 p-4 bg-white/60 rounded-xl border border-border/20 backdrop-blur-sm">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Legal Process Roadmap</p>
                                                <div className="space-y-3">
                                                    {(rec.type === "SMALL_ESTATE" ? [
                                                        "Verify asset eligibility",
                                                        "Wait the 40-day mandatory period",
                                                        "Prepare & Notarize Affidavit",
                                                        "Submit directly to Bank/Brokerage"
                                                    ] : [
                                                        "File Probate Petition with Court",
                                                        "Provide Legal Notice to all Heirs",
                                                        "Attend Court Inquiry / Hearing",
                                                        "Receive Court-Sealed Letters"
                                                    ]).map((step, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                {i + 1}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-700">{step}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Document Vault */}
                <div className="mt-6">
                    <DocumentVault />
                </div>

                {/* Key Documents */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Critical Authorization</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-white shadow-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Letters Testamentary</span>
                            </div>
                            {estate.probateStatus === "EXECUTOR_APPOINTED" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-muted-foreground/30" />}
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-white shadow-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Certified Death Cert</span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
