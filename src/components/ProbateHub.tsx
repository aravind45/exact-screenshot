
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Gavel,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    Edit3,
    Edit2,
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

export function ProbateHub() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: assetsData } = useQuery({
        queryKey: ["assets"],
        queryFn: api.getAssets,
    });

    // Ensure assets is always an array
    const assets = Array.isArray(assetsData) ? assetsData : [];

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
    if (!estate) return <div className="h-40 flex items-center justify-center text-gray-500">No estate found. Please create an estate first.</div>;

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
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
                            <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-bold">Estate-Level Probate Process</CardTitle>
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                                    REQUIRED FIRST
                                </Badge>
                            </div>
                            <CardDescription className="text-xs mt-1 font-medium">
                                Court authority required before settling individual assets
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="h-8 text-xs"
                    >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        {isEditing ? "Done" : "Edit"}
                    </Button>
                </div>

                {/* Blocked Assets Counter */}
                {probateRequiredCount > 0 && estate.authorityStatus !== "GRANTED" && estate.probateStatus !== "EXECUTOR_APPOINTED" && (
                    <Link to="/assets" className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 hover:bg-amber-100 transition-colors group">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-amber-900 group-hover:underline">
                                    {probateRequiredCount} {probateRequiredCount === 1 ? 'Asset' : 'Assets'} Waiting for Authority
                                </p>
                                <ChevronRight className="w-3 h-3 text-amber-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Complete this probate process to unlock settlement workflows
                            </p>
                        </div>
                    </Link>
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
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-semibold text-slate-600">Status:</div>
                                        <Badge className={getStatusColor(estate.probateStatus)}>
                                            {statusMap[estate.probateStatus] || estate.probateStatus}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="text-xs font-semibold text-slate-600 mb-1">Jurisdiction</div>
                                        <div className="text-sm font-medium text-slate-900">{estate.deceasedState || "CA"}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="text-xs font-semibold text-slate-600 mb-1">Case Number</div>
                                        <div className="text-sm font-medium text-slate-900">{estate.courtCaseNumber || "Unassigned"}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Authority Eligibility Logic */}
                <div className="pt-4 border-t border-border/50 pb-4">
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
                                    "p-4 rounded-lg border-l-4",
                                    rec.type === "SMALL_ESTATE" ? "bg-green-50 border-l-green-500" : "bg-amber-50 border-l-amber-500"
                                )}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {rec.type === "SMALL_ESTATE" ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-700" />
                                            ) : (
                                                <Info className="w-4 h-4 text-amber-700" />
                                            )}
                                            <h4 className={cn("font-bold text-sm", rec.type === "SMALL_ESTATE" ? "text-green-900" : "text-amber-900")}>
                                                {rec.type === "SMALL_ESTATE" ? "Small Estate Eligible" : "Full Probate Required"}
                                            </h4>
                                        </div>
                                        <div className="px-2 py-0.5 bg-white rounded text-xs font-semibold">
                                            {estate.deceasedState || "CA"}
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed mb-3" style={{ color: rec.type === "SMALL_ESTATE" ? "rgb(21 128 61)" : "rgb(146 64 14)" }}>
                                        {rec.reason}
                                    </p>

                                    {!isGranted && (
                                        <div className="bg-white rounded-lg p-3 border" style={{ borderColor: rec.type === "SMALL_ESTATE" ? "rgb(187 247 208)" : "rgb(254 215 170)" }}>
                                            <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Next Steps</div>
                                            <div className="space-y-2">
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
                                                    <div key={i} className="flex items-start gap-2">
                                                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: rec.type === "SMALL_ESTATE" ? "rgb(187 247 208)" : "rgb(254 215 170)", color: rec.type === "SMALL_ESTATE" ? "rgb(21 128 61)" : "rgb(146 64 14)" }}>
                                                            {i + 1}
                                                        </div>
                                                        <div className="text-xs text-slate-700 leading-relaxed">{step}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </CardContent>
        </Card >
    );
}
