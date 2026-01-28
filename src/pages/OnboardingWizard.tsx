import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Heart,
    ArrowRight,
    Upload,
    Plus,
    Landmark,
    CheckCircle2,
    ChevronRight,
    ShieldCheck,
    FileText,
    UserCircle,
    Scale,
    Zap,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    { id: "welcome", title: "Welcome" },
    { id: "estate_info", title: "Estate Basics" },
    { id: "track_scout", title: "Estate Track" },
    { id: "heirs", title: "Heirs & Beneficiaries" },
    { id: "documents", title: "Death Certificate" },
    { id: "assets", title: "Key Assets" },
    { id: "completion", title: "All Set" }
];

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [role, setRole] = useState<"executor" | "heir" | null>(null);
    const [estateData, setEstateData] = useState({
        deceasedName: "",
        dateOfDeath: "",
        location: "",
        estimatedValue: ""
    });
    const [heirs, setHeirs] = useState<Array<{ name: string; relationship: string; email: string }>>([
        { name: "", relationship: "", email: "" }
    ]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [assets, setAssets] = useState<Array<{ name: string; type: string }>>([
        { name: "", type: "financial" }
    ]);

    const handleNext = async () => {
        setIsLoading(true);
        try {
            if (currentStep === 1) {
                // Update Estate (Created on registration)
                const [firstName, ...lastNameParts] = estateData.deceasedName.split(" ");
                await api.updateMyEstate({
                    deceasedFirstName: firstName,
                    deceasedLastName: lastNameParts.join(" ") || "",
                    deceasedDateOfDeath: new Date(estateData.dateOfDeath),
                    deceasedState: estateData.location,
                    estimatedPersonalProperty: parseFloat(estateData.estimatedValue) || 0
                });
            } else if (currentStep === 3) { // Heirs
                const validHeirs = heirs.filter(h => h.name.trim() !== "");
                for (const heir of validHeirs) {
                    await api.createHeir(heir);
                }
            } else if (currentStep === 4) { // Documents
                if (uploadedFile) {
                    await api.uploadEstateDocument("DEATH_CERTIFICATE", "Death Certificate.pdf", uploadedFile);
                }
            } else if (currentStep === 5) { // Assets
                const validAssets = assets.filter(a => a.name.trim() !== "");
                for (const asset of validAssets) {
                    await api.createAsset({
                        institution: asset.name,
                        category: asset.type,
                        status: "discovered",
                        priority: "medium",
                        assetType: "bank_account"
                    });
                }
            }

            if (currentStep < STEPS.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
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
                                    <div className="text-center space-y-6">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-slate-900">We're so sorry for your loss.</h1>
                                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                            Settling an estate is a heavy burden. We're here to help you organize everything in one place.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                            <button
                                                onClick={() => setRole("executor")}
                                                className={cn(
                                                    "p-6 rounded-2xl border-2 transition-all text-left space-y-2",
                                                    role === "executor" ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-primary/10 w-fit">
                                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                                </div>
                                                <h3 className="font-bold text-slate-900">I am the Executor</h3>
                                                <p className="text-xs text-slate-500">I am responsible for managing and distributing the assets.</p>
                                            </button>

                                            <button
                                                onClick={() => setRole("heir")}
                                                className={cn(
                                                    "p-6 rounded-2xl border-2 transition-all text-left space-y-2",
                                                    role === "heir" ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-indigo-100 w-fit">
                                                    <UserCircle className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <h3 className="font-bold text-slate-900">I am an Heir</h3>
                                                <p className="text-xs text-slate-500">I am a beneficiary and want to track the progress.</p>
                                            </button>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={() => setCurrentStep(1)}
                                            disabled={!role}
                                            className="w-full rounded-2xl h-14 text-lg font-bold mt-8 shadow-lg shadow-primary/20"
                                        >
                                            Next Step <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
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
                                                    value={estateData.deceasedName}
                                                    onChange={e => setEstateData({ ...estateData, deceasedName: e.target.value })}
                                                    className="h-12 bg-slate-50 border-slate-200"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Date of Death</Label>
                                                    <Input
                                                        type="date"
                                                        value={estateData.dateOfDeath}
                                                        onChange={e => setEstateData({ ...estateData, dateOfDeath: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Residence (State)</Label>
                                                    <Select
                                                        value={estateData.location}
                                                        onValueChange={val => setEstateData({ ...estateData, location: val })}
                                                    >
                                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CA">California</SelectItem>
                                                            <SelectItem value="NY">New York</SelectItem>
                                                            <SelectItem value="TX">Texas</SelectItem>
                                                            <SelectItem value="FL">Florida</SelectItem>
                                                            <SelectItem value="WA">Washington</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
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
                                                        value={estateData.estimatedValue}
                                                        onChange={e => setEstateData({ ...estateData, estimatedValue: e.target.value })}
                                                        className="h-12 pl-8 bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 italic">A rough estimate is fine; we use this to suggest shortcuts.</p>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            disabled={!estateData.deceasedName || !estateData.dateOfDeath || !estateData.location || isLoading}
                                            className="w-full rounded-2xl h-12 font-bold mt-4"
                                        >
                                            {isLoading ? "Saving..." : "Calculate My Track"}
                                        </Button>
                                    </div>
                                )}

                                {/* 2. TRACK SCOUT */}
                                {stepId === "track_scout" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Track Identified!</h2>
                                            <p className="text-slate-500">Based on the value in {estateData.location}, here is your path.</p>
                                        </div>

                                        {parseFloat(estateData.estimatedValue) < 166250 ? (
                                            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-100 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                                                        <Zap className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="font-bold text-emerald-900 text-lg uppercase tracking-tight">Small Estate Track</h3>
                                                </div>
                                                <p className="text-sm text-emerald-800 leading-relaxed">
                                                    Good news! Because the estate is under the statutory limit, you may qualify for the **Affidavit Process**.
                                                </p>
                                                <ul className="space-y-2">
                                                    <li className="flex items-start gap-2 text-xs text-emerald-700">
                                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <span>**No court hearings** required in many cases.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2 text-xs text-emerald-700">
                                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <span>**Wait 40 days**, then present an affidavit to banks.</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="p-6 rounded-2xl bg-indigo-50 border-2 border-indigo-100 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                                                        <Scale className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="font-bold text-indigo-900 text-lg uppercase tracking-tight">Full Probate Track</h3>
                                                </div>
                                                <p className="text-sm text-indigo-800 leading-relaxed">
                                                    The estate exceeds the threshold for a shortcut. You will likely need to file a **Petition for Probate**.
                                                </p>
                                                <div className="p-4 rounded-xl bg-white/50 border border-indigo-100">
                                                    <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold text-xs uppercase">
                                                        <Info className="w-3.5 h-3.5" /> Next Legal Move
                                                    </div>
                                                    <p className="text-xs text-indigo-700">
                                                        You'll need a "Certified Death Certificate" and the "Original Will" (if one exists) to begin.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            size="lg"
                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                            className="w-full rounded-2xl h-12 font-bold mt-4"
                                        >
                                            Understood, Continue
                                        </Button>
                                    </div>
                                )}

                                {/* 3. HEIRS */}
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
                                                            <Input
                                                                placeholder="e.g. Daughter"
                                                                value={heir.relationship}
                                                                onChange={e => {
                                                                    const newHeirs = [...heirs];
                                                                    newHeirs[idx].relationship = e.target.value;
                                                                    setHeirs(newHeirs);
                                                                }}
                                                                className="h-10 bg-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Email (Optional)</Label>
                                                            <Input
                                                                placeholder="jane@example.com"
                                                                value={heir.email}
                                                                onChange={e => {
                                                                    const newHeirs = [...heirs];
                                                                    newHeirs[idx].email = e.target.value;
                                                                    setHeirs(newHeirs);
                                                                }}
                                                                className="h-10 bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={() => setHeirs([...heirs, { name: "", relationship: "", email: "" }])}
                                            className="w-full border-dashed border-slate-300 text-slate-500 rounded-xl"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Another Heir
                                        </Button>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            className="w-full rounded-2xl h-12 font-bold mt-4"
                                        >
                                            {isLoading ? "Saving Heirs..." : "Continue"}
                                        </Button>
                                    </div>
                                )}

                                {/* 4. DEATH CERTIFICATE */}
                                {stepId === "documents" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Upload the "Magic Key"</h2>
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

                                {/* 5. ASSETS */}
                                {stepId === "assets" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Landmark className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Initial Asset List</h2>
                                            <p className="text-slate-500">List 1-3 institutions. We'll set up their checklists for you.</p>
                                        </div>

                                        <div className="space-y-3">
                                            {assets.map((asset, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Bank or Brokerage Name"
                                                            value={asset.name}
                                                            onChange={e => {
                                                                const newAssets = [...assets];
                                                                newAssets[idx].name = e.target.value;
                                                                setAssets(newAssets);
                                                            }}
                                                            className="h-11 bg-slate-50 rounded-xl"
                                                        />
                                                        <Select
                                                            value={asset.type}
                                                            onValueChange={val => {
                                                                const newAssets = [...assets];
                                                                newAssets[idx].type = val;
                                                                setAssets(newAssets);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-[140px] h-11 bg-slate-50 rounded-xl">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="financial">Bank Account</SelectItem>
                                                                <SelectItem value="retirement">Retirement/401k</SelectItem>
                                                                <SelectItem value="property">Real Estate</SelectItem>
                                                                <SelectItem value="insurance">Life Insurance</SelectItem>
                                                                <SelectItem value="crypto">Crypto/Digital</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {asset.name && asset.name.length > 3 && (
                                                        <button
                                                            onClick={async () => {
                                                                toast({ title: "AI Discovery", description: `Searching for settlement process at ${asset.name}...` });
                                                                // Future: Call HyperAgent here
                                                            }}
                                                            className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors ml-1"
                                                        >
                                                            <Zap className="w-3 h-3 fill-primary" /> DISCOVER REQUIREMENTS
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {assets.length < 5 && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAssets([...assets, { name: "", type: "financial" }])}
                                                    className="w-full border-dashed border-slate-300 text-slate-500 rounded-xl"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Add Another
                                                </Button>
                                            )}
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-100/50 border border-slate-200">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-white shadow-sm">
                                                    <Zap className="w-4 h-4 text-primary fill-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-900">AI-Powered Discovery</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                                        Enter an institution above and click **Discover** to automatically pull their forms and settlement requirements.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            disabled={assets.every(a => !a.name) || isLoading}
                                            className="w-full rounded-2xl h-12 font-bold mt-4"
                                        >
                                            {isLoading ? "Saving Ledger..." : "Finish Onboarding"}
                                        </Button>
                                    </div>
                                )}

                                {/* 6. COMPLETION */}
                                {stepId === "completion" && (
                                    <div className="text-center space-y-8 py-4">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                            <ShieldCheck className="w-10 h-10 text-primary" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-slate-900 mb-2">You're all set.</h1>
                                            <p className="text-slate-600">
                                                We've set up your secure dashboard on the **{parseFloat(estateData.estimatedValue) < 166250 ? 'Small Estate' : 'Full Probate'}** track.
                                                <br />
                                                Welcome to Pilar.
                                            </p>
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
