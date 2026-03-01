import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    Heart,
    ArrowRight,
    Upload,
    Plus,
    Landmark,
    CheckCircle2,
    ShieldCheck,
    FileText,
    UserCircle,
    Scale,
    Zap,
    Info,
    Users,
    Mail,
    Loader2,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Clock,
    Calendar,
    DollarSign,
    Building2,
    Home,
    Users2,
    FileCheck,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InstitutionSelect } from "@/components/InstitutionSelect";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IntestacyDistributionPreview } from "@/components/IntestacyDistributionPreview";
import { useTracking } from "@/hooks/useTracking";
import { US_STATES } from "@/lib/states";

// Enhanced field types with clarification support
interface ClarificationField {
    value: boolean | null;
    clarificationOpen: boolean;
    clarificationAnswer: string;
}

interface GuidedFormData {
    deceasedName: string;
    dateOfDeath: string;
    location: string;
    probateCounty: string;
    estimatedValue: string;
    estimatedDebt: string;
    hasWill: ClarificationField;
    isSpouse: ClarificationField;
    isOutOfState: ClarificationField;
    hasUnknownHeirs: ClarificationField;
    isTrustRevocable: ClarificationField;
    hasTODDeed: ClarificationField;
    hasContest: ClarificationField;
}

const STEPS = [
    { id: "welcome", title: "Welcome" },
    { id: "estate_info", title: "Estate Basics" },
    { id: "guided_assessment", title: "Quick Assessment" },
    { id: "track_scout", title: "Your Path" },
    { id: "heirs", title: "Heirs & Benes" },
    { id: "documents", title: "Death Certificate" },
    { id: "assets", title: "Key Assets" },
    { id: "team", title: "The Team" },
    { id: "completion", title: "All Set" }
];

export default function OnboardingGuidedWizard() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { trackEvent } = useTracking();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

    // Form Data with enhanced clarification support
    const [role, setRole] = useState<"executor" | "heir" | null>(null);
    const [formData, setFormData] = useState<GuidedFormData>({
        deceasedName: "",
        dateOfDeath: "",
        location: "",
        probateCounty: "",
        estimatedValue: "",
        estimatedDebt: "",
        hasWill: { value: null, clarificationOpen: false, clarificationAnswer: "" },
        isSpouse: { value: null, clarificationOpen: false, clarificationAnswer: "" },
        isOutOfState: { value: null, clarificationOpen: false, clarificationAnswer: "" },
        hasUnknownHeirs: { value: null, clarificationOpen: false, clarificationAnswer: "" },
        isTrustRevocable: { value: null, clarificationOpen: false, clarificationAnswer: "" },
        hasTODDeed: { value: null, clarificationOpen: false, clarificationAnswer: "" },
        hasContest: { value: null, clarificationOpen: false, clarificationAnswer: "" }
    });

    const [heirs, setHeirs] = useState<Array<{ name: string; relationship: string; email: string; isMinor: boolean }>>([
        { name: "", relationship: "", email: "", isMinor: false }
    ]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [assets, setAssets] = useState<Array<{ name: string; type: string; institutionId?: string }>>([
        { name: "", type: "financial" }
    ]);
    const [collaborators, setCollaborators] = useState<Array<{ email: string; role: string }>>([]);

    const { data: estate, isLoading: isEstateLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        retry: false,
    });

    const { user } = useAuth();

    // Redirect Advisors out of executor onboarding
    // Auto-skip role selection for known EXECUTOR users
    useEffect(() => {
        if (user?.role === 'ADVISOR') {
            navigate('/advisor/dashboard');
            return;
        }

        // Handle direct navigation to steps via query parameter
        const params = new URLSearchParams(location.search);
        const targetStep = params.get('step');

        if (targetStep) {
            console.log(`[Onboarding] Targeted step from URL: ${targetStep}`);
            if (targetStep === 'track_selection' || targetStep === 'authority_setup') {
                setCurrentStep(3); // Track Scout
                setRole('executor');
            } else if (targetStep === 'state_selection') {
                setCurrentStep(1); // Estate Info
                setRole('executor');
            }
        } else if (user?.role === 'EXECUTOR' || user?.userType === 'EXECUTOR') {
            // If user already registered as EXECUTOR, skip the role question (step 0)
            if (!role) {
                setRole('executor');
            }
            // Only auto-advance if still on the welcome step
            if (currentStep === 0) {
                setCurrentStep(1);
            }
        }

        // If user registered as HEIR, set role accordingly
        if (user?.role === 'HEIR' || user?.userType === 'HEIR') {
            if (!role) {
                setRole('heir');
            }
        }
    }, [user, navigate, location.search]);

    // Populate data from existing estate
    useEffect(() => {
        if (estate) {
            const deceasedName = [estate.deceasedFirstName, estate.deceasedLastName]
                .filter(Boolean)
                .join(" ");

            setFormData(prev => ({
                ...prev,
                deceasedName: deceasedName || prev.deceasedName,
                dateOfDeath: estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toISOString().split('T')[0] : prev.dateOfDeath,
                location: estate.deceasedState || prev.location,
                probateCounty: estate.probateCounty || prev.probateCounty,
                estimatedValue: estate.estimatedPersonalProperty?.toString() || prev.estimatedValue,
                estimatedDebt: estate.estimatedLiabilities?.toString() || prev.estimatedDebt,
                hasContest: { ...prev.hasContest, value: estate.hasContest ?? null },
                hasTODDeed: { ...prev.hasTODDeed, value: estate.hasTODDeed ?? null },
                hasWill: { ...prev.hasWill, value: estate.hasWill ?? null },
                isSpouse: { ...prev.isSpouse, value: estate.isSurvivingSpouse ?? null },
                isOutOfState: { ...prev.isOutOfState, value: estate.hasOutOfStateProperty ?? null },
                hasUnknownHeirs: { ...prev.hasUnknownHeirs, value: estate.hasUnknownHeirs ?? null },
                isTrustRevocable: { ...prev.isTrustRevocable, value: estate.isTrustRevocable ?? null }
            }));
        } else {
            // Check for discovery data if no estate data exists yet (fresh registration)
            try {
                const saved = sessionStorage.getItem("discovery_data");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setRole(parsed.role || "executor");
                    setFormData(prev => ({
                        ...prev,
                        deceasedName: parsed.deceasedName || prev.deceasedName,
                        location: parsed.state || prev.location,
                        estimatedValue: parsed.estimatedValue || prev.estimatedValue,
                        hasWill: { ...prev.hasWill, value: parsed.hasWill ?? null },
                        isSpouse: { ...prev.isSpouse, value: parsed.role === "executor" }
                    }));
                    // Move to step 1 (Estate Basics) if we have data, skipping intro
                    if (parsed.deceasedName || parsed.state) {
                        setCurrentStep(1);
                    }
                }
            } catch (e) {
                console.warn("Failed to parse discovery data", e);
            }
        }
    }, [estate]);

    // Calculate recommendation based on current form state
    const recommendation = calculateAuthorityRecommendation(
        [], // No actual assets yet, just using estimates
        formData.location,
        {
            hasWill: formData.hasWill.value === true,
            isSpouse: formData.isSpouse.value === true,
            isOutOfState: formData.isOutOfState.value === true,
            estimatedValue: parseFloat(formData.estimatedValue) || 0,
            isTrustRevocable: formData.isTrustRevocable.value === true,
            hasTODDeed: formData.hasTODDeed.value === true,
            hasContest: formData.hasContest.value === true
        }
    );

    // Calculate confidence score
    useEffect(() => {
        const filledFields = Object.values(formData).filter(field =>
            typeof field === 'object' && field !== null && field.value !== null
        ).length;
        const totalFields = 7; // hasWill, isSpouse, isOutOfState, hasUnknownHeirs, isTrustRevocable, hasTODDeed, hasContest
        const score = Math.round((filledFields / totalFields) * 100);
        setConfidenceScore(score);
    }, [formData]);

    const handleNext = async () => {
        setIsLoading(true);
        try {
            let estate = await api.getMyEstate();

            // Step 1: Handle Estate Info
            if (currentStep === 1) {
                const nameParts = formData.deceasedName.trim().split(/\s+/);
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "Estate";

                estate = await api.updateMyEstate({
                    deceasedFirstName: firstName,
                    deceasedLastName: lastName,
                    deceasedDateOfDeath: new Date(formData.dateOfDeath),
                    deceasedState: formData.location,
                    probateCounty: formData.probateCounty || null,
                    estimatedPersonalProperty: parseFloat(formData.estimatedValue) || 0,
                    estimatedLiabilities: parseFloat(formData.estimatedDebt) || 0,
                    hasContest: formData.hasContest.value === true
                });

                if (!estate?.id) {
                    estate = await api.getMyEstate();
                }

                trackEvent('lead', {
                    step: 'estate_info_saved',
                    state: formData.location,
                    value: formData.estimatedValue
                });

                sessionStorage.removeItem("discovery_data");
            } else if (currentStep === 3) { // Track Scout (after guided assessment)
                await api.updateMyEstate({
                    estateType: recommendation.type,
                    authorityType: recommendation.type,
                    hasUnknownHeirs: formData.hasUnknownHeirs.value === true,
                    isTrustRevocable: formData.isTrustRevocable.value === true,
                    hasContest: formData.hasContest.value === true,
                    hasTODDeed: formData.hasTODDeed.value === true,
                    isSurvivingSpouse: formData.isSpouse.value === true,
                    hasOutOfStateProperty: formData.isOutOfState.value === true
                });

                if (estate?.id) {
                    try {
                        await api.completeTask(estate.id, "check_small_estate", "Auto-completed via onboarding questionnaire");
                    } catch (e) {
                        console.warn("Failed to auto-complete task", e);
                    }

                    // AUTO-PIN ROADMAP after authority decision
                    try {
                        await api.pinRoadmap(estate.id);
                        console.log("Roadmap pinned after Track Scout");
                    } catch (e) {
                        console.warn("Failed to pin roadmap (non-fatal)", e);
                    }
                }

                await queryClient.invalidateQueries({ queryKey: ["tasks"] });
                await queryClient.invalidateQueries({ queryKey: ["estate"] });
                await queryClient.invalidateQueries({ queryKey: ["roadmap"] });
            } else if (currentStep === 4) { // Heirs
                const validHeirs = heirs.filter(h => h.name.trim() !== "");
                const hasMinors = validHeirs.some(h => h.isMinor);

                await api.updateMyEstate({
                    hasMinorBeneficiaries: hasMinors
                });

                for (const heir of validHeirs) {
                    await api.createHeir({
                        ...heir,
                        isAdult: !heir.isMinor
                    });
                }
            } else if (currentStep === 5) { // Documents
                if (uploadedFile) {
                    await api.uploadEstateDocument("DEATH_CERTIFICATE", "Death Certificate.pdf", uploadedFile);
                }
            } else if (currentStep === 6) { // Assets
                const validAssets = assets.filter(a => a.name.trim() !== "");
                for (const asset of validAssets) {
                    await api.createAsset({
                        institution: asset.name,
                        category: asset.type,
                        assetType: asset.type === 'real_estate' ? 'real_estate' : 'bank_account',
                        status: "discovered",
                        priority: "medium"
                    });
                }
            } else if (currentStep === 7) { // Team
                const validCollabs = collaborators.filter(c => c.email.trim() !== "");
                if (validCollabs.length > 0) {
                    const freshEstate = estate?.id ? estate : await api.getMyEstate();
                    if (freshEstate?.id) {
                        for (const collab of validCollabs) {
                            await api.inviteCollaborator({
                                estateId: freshEstate.id,
                                email: collab.email,
                                role: collab.role
                            });
                        }
                    }
                }
            }

            if (currentStep < STEPS.length - 1) {
                toast({
                    description: "Progress saved",
                    duration: 2000,
                    className: "bg-emerald-50 text-emerald-900 border-none"
                });
                setCurrentStep(prev => prev + 1);
            } else {
                await trackEvent("intake_completed");
                navigate("/dashboard");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const stepId = STEPS[currentStep].id;

    // Helper functions for field updates
    const updateField = (field: keyof GuidedFormData, value: string | boolean | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field as keyof GuidedFormData] as object), value }
        }));
    };

    const toggleClarification = (field: keyof GuidedFormData) => {
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...(prev[field as keyof GuidedFormData] as object),
                clarificationOpen: !(prev[field as keyof GuidedFormData] as any).clarificationOpen
            }
        }));
    };

    const handleClarificationAnswer = (field: keyof GuidedFormData, answer: string) => {
        setFormData(prev => {
            const existing = prev[field as keyof GuidedFormData];
            if (typeof existing === 'object' && existing !== null) {
                return { ...prev, [field]: { ...existing, clarificationAnswer: answer } };
            }
            return prev;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
            <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-medium z-50"
            >
                Cancel & Exit
            </Button>
            <div className="max-w-xl w-full">
                {/* Progress Bar */}
                <div className="mb-8 flex gap-2">
                    {STEPS.map((step, index) => (
                        <div
                            key={step.id}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${index <= currentStep ? "bg-primary" : "bg-slate-200"}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={stepId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="border-none shadow-xl bg-white/90 backdrop-blur rounded-3xl overflow-hidden">
                            <CardContent className="p-8 sm:p-12">

                                {/* 0. WELCOME & ROLE */}
                                {stepId === "welcome" && (
                                    <div className="text-center space-y-4">
                                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                                        </div>
                                        <h1 className="text-2xl font-bold text-slate-900">We're so sorry for your loss.</h1>
                                        {isEstateLoading ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                                                <span className="text-slate-500 text-sm">Retrieving your progress...</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                                Settling an estate is a heavy burden. We're here to help you organize everything in one place.
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                            <button
                                                onClick={() => setRole("executor")}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all text-left space-y-2",
                                                    role === "executor" ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-primary/10 w-fit">
                                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-base">I am the Executor</h3>
                                                <p className="text-xs text-slate-500">I am responsible for managing and distributing the assets.</p>
                                            </button>

                                            <button
                                                onClick={() => setRole("heir")}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all text-left space-y-2",
                                                    role === "heir" ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-indigo-100 w-fit">
                                                    <UserCircle className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-base">I am an Heir</h3>
                                                <p className="text-xs text-slate-500">I am a beneficiary and want to track the progress.</p>
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {role === "heir" ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-left space-y-2 mt-4"
                                                >
                                                    <div className="flex items-center gap-2 text-indigo-900 font-bold">
                                                        <Info className="w-4 h-4" />
                                                        Invitation Required
                                                    </div>
                                                    <p className="text-xs text-indigo-800 leading-relaxed">
                                                        Heirs and beneficiaries join existing estates via a secure invitation link sent by the Executor.
                                                        Initiating a new estate is reserved for Executors and legal representatives.
                                                    </p>
                                                    <div className="pt-2">
                                                        <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">What to do next:</p>
                                                        <ul className="text-[10px] text-indigo-700 space-y-1 list-disc pl-3">
                                                            <li>Check your email for an invitation from the Executor.</li>
                                                            <li>If you haven't received one, ask the Executor to invite you from their ExpectedEstate dashboard.</li>
                                                            <li>Once you receive the link, simply click it to gain viewing access.</li>
                                                        </ul>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full mt-3 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs"
                                                        onClick={() => navigate("/")}
                                                    >
                                                        Return Home
                                                    </Button>
                                                </motion.div>
                                            ) : (
                                                <Button
                                                    size="lg"
                                                    onClick={() => setCurrentStep(1)}
                                                    disabled={!role}
                                                    className="w-full rounded-xl h-12 text-base font-bold mt-6 shadow-lg shadow-primary/20"
                                                >
                                                    Next Step <ArrowRight className="ml-2 w-4 h-4" />
                                                </Button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* 1. ESTATE INFO */}
                                {stepId === "estate_info" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-slate-900">The basics.</h2>
                                            <p className="text-slate-500">Tell us about the person who passed away.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input
                                                    placeholder="e.g. John Smith"
                                                    value={formData.deceasedName}
                                                    onChange={e => setFormData({ ...formData, deceasedName: e.target.value })}
                                                    className="h-12 bg-slate-50 border-slate-200"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Date of Death</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.dateOfDeath}
                                                        onChange={e => setFormData({ ...formData, dateOfDeath: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Deceased's State of Residence</Label>
                                                    <Select
                                                        value={formData.location}
                                                        onValueChange={val => setFormData({ ...formData, location: val })}
                                                    >
                                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {US_STATES.map((state) => (
                                                                <SelectItem key={state.abbr} value={state.abbr}>
                                                                    {state.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Probate County <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></Label>
                                                <Input
                                                    placeholder="e.g. Los Angeles, Cook, Harris"
                                                    value={formData.probateCounty}
                                                    onChange={e => setFormData({ ...formData, probateCounty: e.target.value })}
                                                    className="h-12 bg-slate-50 border-slate-200"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 italic">If known, this helps us show county-specific tasks and forms.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex justify-between">
                                                    Approximate Estate Value
                                                    <span className="text-[10px] text-slate-400 font-normal">Banks & Real Estate</span>
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 250000"
                                                        value={formData.estimatedValue}
                                                        onChange={e => setFormData({ ...formData, estimatedValue: e.target.value })}
                                                        className="h-12 pl-8 bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 italic">A rough estimate is fine; we use this to suggest shortcuts.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex justify-between">
                                                    Estimated Total Debt
                                                    <span className="text-[10px] text-slate-400 font-normal">Mortgages, Loans, Credit Cards</span>
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 50000"
                                                        value={formData.estimatedDebt}
                                                        onChange={e => setFormData({ ...formData, estimatedDebt: e.target.value })}
                                                        className="h-12 pl-8 bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 italic">Used to detect potential insolvency risks early.</p>
                                            </div>

                                            <div className="pt-4 space-y-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm font-bold">Transfer-on-Death Deed?</Label>
                                                        <p className="text-[10px] text-slate-500">Is there a recorded TOD deed for real property?</p>
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("hasTODDeed", true)}
                                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasTODDeed.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Yes </button>
                                                        <button
                                                            onClick={() => updateField("hasTODDeed", false)}
                                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasTODDeed.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > No </button>
                                                        <button
                                                            onClick={() => updateField("hasTODDeed", null)}
                                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasTODDeed.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm font-bold">Is the estate contested?</Label>
                                                        <p className="text-[10px] text-slate-500">Are there any active disputes or will contests?</p>
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("hasContest", true)}
                                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasContest.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Yes </button>
                                                        <button
                                                            onClick={() => updateField("hasContest", false)}
                                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasContest.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > No </button>
                                                        <button
                                                            onClick={() => updateField("hasContest", null)}
                                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasContest.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                size="lg"
                                                onClick={handleNext}
                                                disabled={!formData.deceasedName || !formData.dateOfDeath || !formData.location || isLoading}
                                                className="w-full rounded-2xl h-12 font-bold mt-4"
                                            >
                                                {isLoading ? "Saving..." : "Continue to Quick Assessment"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* 2. GUIDED ASSESSMENT */}
                                {stepId === "guided_assessment" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Sparkles className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Quick Assessment</h2>
                                            <p className="text-slate-500">Answer 5 simple questions to determine your path.</p>
                                            {confidenceScore !== null && (
                                                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-600">Confidence Score</span>
                                                        <span className={`font-bold ${confidenceScore >= 80 ? 'text-emerald-600' : confidenceScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {confidenceScore}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${confidenceScore >= 80 ? 'bg-emerald-500' : confidenceScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${confidenceScore}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            {/* Question 1: Will */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <FileCheck className="w-4 h-4 text-slate-500" />
                                                            <h3 className="font-bold text-slate-900">Was there a Will?</h3>
                                                            <button
                                                                onClick={() => toggleClarification("hasWill")}
                                                                className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <HelpCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-slate-500">Determines if it's Intestate or Probate.</p>
                                                        {formData.hasWill.clarificationOpen && (
                                                            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                                                <p className="text-xs text-slate-600">
                                                                    <strong>What is a will?</strong> A legal document that specifies how a person's assets should be distributed after death.
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    <strong>Common signs:</strong> You have a document titled "Last Will and Testament" or similar.
                                                                </p>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Describe what you found or what you're looking for..."
                                                                        value={formData.hasWill.clarificationAnswer}
                                                                        onChange={(e) => handleClarificationAnswer("hasWill", e.target.value)}
                                                                        className="text-xs"
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            // Auto-detect based on answer
                                                                            const answer = formData.hasWill.clarificationAnswer.toLowerCase();
                                                                            if (answer.includes("will") || answer.includes("testament")) {
                                                                                updateField("hasWill", true);
                                                                            } else if (answer.includes("no") || answer.includes("don't")) {
                                                                                updateField("hasWill", false);
                                                                            }
                                                                            toggleClarification("hasWill");
                                                                        }}
                                                                    >
                                                                        Analyze
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("hasWill", true)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasWill.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Yes </button>
                                                        <button
                                                            onClick={() => updateField("hasWill", false)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasWill.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > No </button>
                                                        <button
                                                            onClick={() => updateField("hasWill", null)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasWill.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Question 2: Trust */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4 text-slate-500" />
                                                            <h3 className="font-bold text-slate-900">Did the deceased place assets into a living trust before death?</h3>
                                                            <button
                                                                onClick={() => toggleClarification("isTrustRevocable")}
                                                                className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <HelpCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-slate-500">Revocable or Irrevocable living trust.</p>
                                                        {formData.isTrustRevocable.clarificationOpen && (
                                                            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                                                <p className="text-xs text-slate-600">
                                                                    <strong>What is a trust?</strong> A legal arrangement where a trustee holds and manages assets for beneficiaries.
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    <strong>Common signs:</strong> You have a document titled "Living Trust" or "Revocable Trust".
                                                                </p>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Describe what you found..."
                                                                        value={formData.isTrustRevocable.clarificationAnswer}
                                                                        onChange={(e) => handleClarificationAnswer("isTrustRevocable", e.target.value)}
                                                                        className="text-xs"
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            const answer = formData.isTrustRevocable.clarificationAnswer.toLowerCase();
                                                                            if (answer.includes("trust") || answer.includes("revocable")) {
                                                                                updateField("isTrustRevocable", true);
                                                                            } else if (answer.includes("irrevocable")) {
                                                                                updateField("isTrustRevocable", false);
                                                                            } else if (answer.includes("no") || answer.includes("don't")) {
                                                                                updateField("isTrustRevocable", false);
                                                                            }
                                                                            toggleClarification("isTrustRevocable");
                                                                        }}
                                                                    >
                                                                        Analyze
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("isTrustRevocable", true)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isTrustRevocable.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Revocable </button>
                                                        <button
                                                            onClick={() => updateField("isTrustRevocable", false)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isTrustRevocable.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Irrevocable </button>
                                                        <button
                                                            onClick={() => updateField("isTrustRevocable", null)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isTrustRevocable.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Question 3: Spouse */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Users2 className="w-4 h-4 text-slate-500" />
                                                            <h3 className="font-bold text-slate-900">Are you the surviving spouse?</h3>
                                                            <button
                                                                onClick={() => toggleClarification("isSpouse")}
                                                                className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <HelpCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-slate-500">May qualify for Spousal Property Petition.</p>
                                                        {formData.isSpouse.clarificationOpen && (
                                                            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                                                <p className="text-xs text-slate-600">
                                                                    <strong>What does this mean?</strong> If you were legally married to the deceased at the time of death.
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    <strong>Example:</strong> You have a marriage certificate and were living together.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("isSpouse", true)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isSpouse.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Yes </button>
                                                        <button
                                                            onClick={() => updateField("isSpouse", false)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isSpouse.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > No </button>
                                                        <button
                                                            onClick={() => updateField("isSpouse", null)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isSpouse.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Question 4: Out of State Property */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Home className="w-4 h-4 text-slate-500" />
                                                            <h3 className="font-bold text-slate-900">Any out-of-state property?</h3>
                                                            <button
                                                                onClick={() => toggleClarification("isOutOfState")}
                                                                className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <HelpCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-slate-500">Real estate outside of {formData.location || 'home state'}.</p>
                                                        {formData.isOutOfState.clarificationOpen && (
                                                            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                                                <p className="text-xs text-slate-600">
                                                                    <strong>What does this mean?</strong> Property ownership in a different state from where the deceased lived.
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    <strong>Example:</strong> Primary residence in California, vacation home in Nevada.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("isOutOfState", true)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isOutOfState.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Yes </button>
                                                        <button
                                                            onClick={() => updateField("isOutOfState", false)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isOutOfState.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > No </button>
                                                        <button
                                                            onClick={() => updateField("isOutOfState", null)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.isOutOfState.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Question 5: Unknown Heirs */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-slate-500" />
                                                            <h3 className="font-bold text-slate-900">I am not sure who all the legal heirs are.</h3>
                                                            <button
                                                                onClick={() => toggleClarification("hasUnknownHeirs")}
                                                                className="ml-2 p-1 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <HelpCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-slate-500">May require heir search or legal determination.</p>
                                                        {formData.hasUnknownHeirs.clarificationOpen && (
                                                            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                                                <p className="text-xs text-slate-600">
                                                                    <strong>What does this mean?</strong> You're unsure about all potential beneficiaries or legal heirs.
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    <strong>Common scenarios:</strong> Estranged family members, unknown children, unclear family tree.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => updateField("hasUnknownHeirs", true)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasUnknownHeirs.value === true ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Yes </button>
                                                        <button
                                                            onClick={() => updateField("hasUnknownHeirs", false)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasUnknownHeirs.value === false ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > No </button>
                                                        <button
                                                            onClick={() => updateField("hasUnknownHeirs", null)}
                                                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", formData.hasUnknownHeirs.value === null ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                                                        > Not Sure </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Button
                                                size="lg"
                                                onClick={() => setCurrentStep(3)}
                                                disabled={isLoading}
                                                className="w-full rounded-2xl h-12 font-bold"
                                            >
                                                Calculate My Path
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentStep(1)}
                                                className="text-slate-400 text-xs"
                                            >
                                                Go Back to Basics
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* 3. TRACK SCOUT */}
                                {stepId === "track_scout" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Your Path</h2>
                                            <p className="text-slate-500">Based on your answers, here is your recommended path.</p>
                                            {confidenceScore !== null && (
                                                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-600">Confidence Score</span>
                                                        <span className={`font-bold ${confidenceScore >= 80 ? 'text-emerald-600' : confidenceScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {confidenceScore}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${confidenceScore >= 80 ? 'bg-emerald-500' : confidenceScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${confidenceScore}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        {confidenceScore >= 80 ? "High confidence - your path is clear!" :
                                                            confidenceScore >= 60 ? "Medium confidence - we may need more details as we go." :
                                                                "Low confidence - we'll help clarify as we proceed."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 rounded-2xl bg-indigo-50 border-2 border-indigo-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                                                    <Scale className="w-5 h-5" />
                                                </div>
                                                <h3 className="font-bold text-indigo-900 text-lg uppercase tracking-tight">
                                                    {recommendation.type.replace('_', ' ')}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-indigo-800 leading-relaxed">
                                                {recommendation.reason}
                                            </p>
                                            <div className="p-4 rounded-xl bg-white/50 border border-indigo-100">
                                                <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold text-xs uppercase">
                                                    <Info className="w-3.5 h-3.5" /> Next Legal Move
                                                </div>
                                                <p className="text-xs text-indigo-700">
                                                    {recommendation.type === 'SMALL_ESTATE'
                                                        ? (formData.location === 'CA' ? 'Wait 40 days, then prepare and notarize the 13100 Affidavit (DE-310).' :
                                                            formData.location === 'TX' ? 'Prepare and file the Small Estate Affidavit (SEA) with the court.' :
                                                                formData.location === 'FL' ? 'Prepare the Petition for Summary Administration.' :
                                                                    'Prepare and notarize a Small Estate Affidavit.')
                                                        : recommendation.type === 'SPOUSAL_PETITION'
                                                            ? (formData.location === 'CA' ? 'Prepare the DE-221 petition and file it with the local court.' : 'File a Spousal Property Petition.')
                                                            : (formData.location === 'FL' ? 'Lodge the original Will within 10 days of the death.' :
                                                                formData.location === 'TX' ? 'File the Application for Probate with the county clerk.' :
                                                                    'Gather the Death Certificate and Original Will to prepare your court filing.')}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            className="w-full rounded-2xl h-12 font-bold"
                                        >
                                            Understood, Continue
                                        </Button>
                                    </div>
                                )}

                                {/* 4. HEIRS */}
                                {stepId === "heirs" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <UserCircle className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Heirs & Beneficiaries</h2>
                                            <p className="text-slate-500">Who are the key people involved in this estate?</p>
                                        </div>

                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {heirs.map((heir, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative group">
                                                    {heirs.length > 1 && (
                                                        <button
                                                            onClick={() => setHeirs(heirs.filter((_, i) => i !== idx))}
                                                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4 rotate-45" />
                                                        </button>
                                                    )}
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Full Name</Label>
                                                        <Input
                                                            placeholder="e.g. Jane Doe"
                                                            value={heir.name}
                                                            onChange={e => {
                                                                const newHeirs = [...heirs];
                                                                newHeirs[idx].name = e.target.value;
                                                                setHeirs(newHeirs);
                                                            }}
                                                            className="h-10 bg-white"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Relationship</Label>
                                                            <Select
                                                                value={heir.relationship}
                                                                onValueChange={val => {
                                                                    const newHeirs = [...heirs];
                                                                    newHeirs[idx].relationship = val;
                                                                    setHeirs(newHeirs);

                                                                    if (val === "SPOUSE") {
                                                                        updateField("isSpouse", true);
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-10 bg-white">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="SPOUSE">Spouse</SelectItem>
                                                                    <SelectItem value="CHILD">Child</SelectItem>
                                                                    <SelectItem value="PARENT">Parent</SelectItem>
                                                                    <SelectItem value="SIBLING">Sibling</SelectItem>
                                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 mt-6">
                                                                <Checkbox
                                                                    id={`minor-${idx}`}
                                                                    checked={heir.isMinor}
                                                                    onCheckedChange={(val) => {
                                                                        const newHeirs = [...heirs];
                                                                        newHeirs[idx].isMinor = val === true;
                                                                        setHeirs(newHeirs);
                                                                    }}
                                                                />
                                                                <Label htmlFor={`minor-${idx}`} className="text-[10px] uppercase font-bold text-slate-400 cursor-pointer">Minor Heir?</Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                                            <Checkbox
                                                id="unknown_heirs"
                                                checked={formData.hasUnknownHeirs.value === true}
                                                onCheckedChange={(val) => updateField("hasUnknownHeirs", val === true ? true : null)}
                                            />
                                            <Label htmlFor="unknown_heirs" className="text-xs font-bold text-slate-600 cursor-pointer">
                                                I am not sure who all the legal heirs are.
                                            </Label>
                                        </div>

                                        {!formData.hasWill.value && heirs.some(h => h.name && h.relationship) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <IntestacyDistributionPreview
                                                    state={formData.location}
                                                    heirs={heirs.map((h, i) => ({ id: `h-${i}`, name: h.name, relationship: h.relationship }))}
                                                />
                                            </motion.div>
                                        )}

                                        <Button
                                            variant="outline"
                                            onClick={() => setHeirs([...heirs, { name: "", relationship: "", email: "", isMinor: false }])}
                                            className="w-full border-dashed border-slate-300 text-slate-500 rounded-xl"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Another Heir
                                        </Button>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            className="w-full rounded-2xl h-12 font-bold"
                                        >
                                            {isLoading ? "Saving Heirs..." : "Continue"}
                                        </Button>
                                    </div>
                                )}

                                {/* 5. DEATH CERTIFICATE */}
                                {stepId === "documents" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Upload Vital Document</h2>
                                            <p className="text-slate-500 font-medium">The Death Certificate is required for every institution.</p>
                                        </div>

                                        <div
                                            className="border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer relative"
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const file = e.dataTransfer.files?.[0];
                                                if (file) setUploadedFile(file);
                                            }}
                                        >
                                            <input
                                                type="file"
                                                accept=".pdf,image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                                onChange={e => setUploadedFile(e.target.files?.[0] || null)}
                                            />
                                            <div className="relative z-0 pointer-events-none flex flex-col items-center">
                                                {uploadedFile ? (
                                                    <>
                                                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-4" />
                                                        <p className="font-bold text-slate-900">{uploadedFile.name}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Ready to sync with all assets</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-slate-400 mb-4" />
                                                        <p className="font-bold text-slate-700">Click to upload PDF or Image</p>
                                                        <p className="text-xs text-slate-400 mt-2">Private & Encrypted Storage</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Button
                                                size="lg"
                                                onClick={handleNext}
                                                disabled={!uploadedFile || isLoading}
                                                className="w-full rounded-2xl h-12 font-bold"
                                            >
                                                {isLoading ? "Uploading..." : "Sync & Continue"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setCurrentStep(prev => prev + 1)} className="text-slate-400 text-xs">
                                                I don't have it yet, skip for now
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* 6. ASSETS */}
                                {stepId === "assets" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Landmark className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Key Assets</h2>
                                            <p className="text-slate-500">Search for the primary banks or institutions involved.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {assets.map((asset, idx) => (
                                                <div key={idx} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                                    {assets.length > 1 && (
                                                        <button
                                                            onClick={() => setAssets(assets.filter((_, i) => i !== idx))}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                        >
                                                            <Plus className="w-3 h-3 rotate-45" />
                                                        </button>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">Institution</Label>
                                                            <InstitutionSelect
                                                                value={asset.name}
                                                                onSelect={(inst) => {
                                                                    const newAssets = [...assets];
                                                                    newAssets[idx].name = inst.name;
                                                                    newAssets[idx].institutionId = inst.id;
                                                                    setAssets(newAssets);
                                                                }}
                                                                onChange={(val) => {
                                                                    const newAssets = [...assets];
                                                                    newAssets[idx].name = val;
                                                                    setAssets(newAssets);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="w-[140px]">
                                                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">Type</Label>
                                                            <Select
                                                                value={asset.type}
                                                                onValueChange={val => {
                                                                    const newAssets = [...assets];
                                                                    newAssets[idx].type = val;
                                                                    setAssets(newAssets);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-11 bg-white rounded-xl">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="financial">Bank Account</SelectItem>
                                                                    <SelectItem value="retirement">Retirement/401k</SelectItem>
                                                                    <SelectItem value="business">Business / LLC</SelectItem>
                                                                    <SelectItem value="property">Real Estate</SelectItem>
                                                                    <SelectItem value="insurance">Life Insurance</SelectItem>
                                                                    <SelectItem value="crypto">Crypto/Digital</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {assets.length < 5 && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAssets([...assets, { name: "", type: "financial" }])}
                                                    className="w-full border-dashed border-slate-300 text-slate-500 rounded-2xl h-12"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Add Another Asset
                                                </Button>
                                            )}
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            disabled={assets.every(a => !a.name) || isLoading}
                                            className="w-full rounded-2xl h-12 font-bold"
                                        >
                                            {isLoading ? "Saving..." : "Continue to Team"}
                                        </Button>
                                    </div>
                                )}

                                {/* 7. THE TEAM */}
                                {stepId === "team" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Assemble Your Team</h2>
                                            <p className="text-slate-500">Invite co-executors, attorneys, or family members to help.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {collaborators.map((collab, idx) => (
                                                <div key={idx} className="flex gap-2 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                                                    <button
                                                        onClick={() => setCollaborators(collaborators.filter((_, i) => i !== idx))}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                    >
                                                        <Plus className="w-3 h-3 rotate-45" />
                                                    </button>
                                                    <div className="flex-1 space-y-1.5">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Email Address</Label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                                            <Input
                                                                placeholder="email@example.com"
                                                                className="pl-9 h-11 bg-white"
                                                                value={collab.email}
                                                                onChange={e => {
                                                                    const newCollabs = [...collaborators];
                                                                    newCollabs[idx].email = e.target.value;
                                                                    setCollaborators(newCollabs);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-[140px] space-y-1.5">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Role</Label>
                                                        <Select
                                                            value={collab.role}
                                                            onValueChange={val => {
                                                                const newCollabs = [...collaborators];
                                                                newCollabs[idx].role = val;
                                                                setCollaborators(newCollabs);
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-11 bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="CO_EXECUTOR">Co-Executor</SelectItem>
                                                                <SelectItem value="ATTORNEY">Attorney</SelectItem>
                                                                <SelectItem value="VIEWER">Heir/Viewer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                variant="outline"
                                                onClick={() => setCollaborators([...collaborators, { email: "", role: "VIEWER" }])}
                                                className="w-full border-dashed border-slate-300 text-slate-500 rounded-2xl h-12"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Add Team Member
                                            </Button>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Button
                                                size="lg"
                                                onClick={handleNext}
                                                disabled={isLoading}
                                                className="w-full rounded-2xl h-12 font-bold"
                                            >
                                                {isLoading ? "Sending Invites..." : collaborators.length > 0 ? "Send Invites & Finish" : "Finish Setup"}
                                            </Button>
                                            <Button variant="ghost" onClick={handleNext} className="text-slate-400 text-xs">
                                                Skip for now
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* 8. COMPLETION */}
                                {stepId === "completion" && (
                                    <div className="text-center space-y-8 py-4">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                            <ShieldCheck className="w-10 h-10 text-primary" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-slate-900 mb-2">You're all set.</h1>
                                            <p className="text-slate-600">
                                                We've set up your secure dashboard on the **{recommendation.type.replace(/_/g, ' ')}** track.
                                                <br />
                                                Welcome to ExpectedEstate.
                                            </p>
                                            {confidenceScore !== null && (
                                                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        Path Confidence: {confidenceScore}%
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {confidenceScore >= 80 ? "Your path is clear and well-defined." :
                                                            confidenceScore >= 60 ? "Your path is mostly clear with minor clarifications needed." :
                                                                "We'll help clarify your path as we proceed together."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <Button size="lg" onClick={handleNext} className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/20">
                                            Go to My Dashboard
                                        </Button>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-between items-center px-4 mt-8">
                    {currentStep > 0 && currentStep < STEPS.length - 1 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                        Step {currentStep + 1} of {STEPS.length}
                    </p>
                </div>
            </div>
        </div>
    );
}