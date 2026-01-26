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
    FileText
} from "lucide-react";

const STEPS = [
    { id: "welcome", title: "Welcome" },
    { id: "estate_info", title: "Estate Basics" },
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
    const [estateData, setEstateData] = useState({
        deceasedName: "",
        dateOfDeath: "",
        location: ""
    });
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
                    deceasedState: estateData.location
                });
            } else if (currentStep === 2) {
                // Upload Document
                if (uploadedFile) {
                    await api.uploadEstateDocument("DEATH_CERTIFICATE", "Death Certificate.pdf", uploadedFile);
                }
            } else if (currentStep === 3) {
                // Create Assets
                const validAssets = assets.filter(a => a.name.trim() !== "");
                for (const asset of validAssets) {
                    await api.createAsset({
                        institution: asset.name,
                        category: asset.type,
                        status: "discovered",
                        priority: "medium",
                        assetType: "bank_account" // Default to generic
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

                                {/* 0. WELCOME */}
                                {stepId === "welcome" && (
                                    <div className="text-center space-y-6">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-slate-900">We're so sorry for your loss.</h1>
                                        <p className="text-lg text-slate-600 leading-relaxed">
                                            Settling an estate is hard, but you don't have to do it alone.
                                            <br />
                                            Let's take a few minutes to get everything organized for you.
                                        </p>
                                        <Button size="lg" onClick={() => setCurrentStep(1)} className="w-full rounded-2xl h-14 text-lg font-bold mt-8 shadow-lg shadow-primary/20">
                                            Let's Get Started <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                )}

                                {/* 1. ESTATE INFO */}
                                {stepId === "estate_info" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-slate-900">First, the basics.</h2>
                                            <p className="text-slate-500">We'll tailor the workflow based on where they lived.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Name of Deceased</Label>
                                                <Input
                                                    placeholder="e.g. John Smith"
                                                    value={estateData.deceasedName}
                                                    onChange={e => setEstateData({ ...estateData, deceasedName: e.target.value })}
                                                    className="h-12 bg-slate-50 border-slate-200"
                                                />
                                            </div>
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
                                                <Label>State of Residence</Label>
                                                <Select
                                                    value={estateData.location}
                                                    onValueChange={val => setEstateData({ ...estateData, location: val })}
                                                >
                                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                                                        <SelectValue placeholder="Select State" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CA">California</SelectItem>
                                                        <SelectItem value="NY">New York</SelectItem>
                                                        <SelectItem value="TX">Texas</SelectItem>
                                                        <SelectItem value="FL">Florida</SelectItem>
                                                        {/* Add more as needed */}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            disabled={!estateData.deceasedName || !estateData.dateOfDeath || isLoading}
                                            className="w-full rounded-2xl h-12 font-bold mt-4"
                                        >
                                            {isLoading ? "Saving..." : "Continue"}
                                        </Button>
                                    </div>
                                )}

                                {/* 2. DEATH CERTIFICATE */}
                                {stepId === "documents" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Do you have the Death Certificate?</h2>
                                            <p className="text-slate-500">Every bank will ask for this. Upload it once here.</p>
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
                                                        <p className="text-xs text-slate-500 mt-1">Ready to upload</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-slate-400 mb-4" />
                                                        <p className="font-bold text-slate-700">Click to upload PDF or Image</p>
                                                        <p className="text-xs text-slate-400 mt-2">or drag and drop here</p>
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
                                                {isLoading ? "Uploading..." : "Upload & Continue"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setCurrentStep(prev => prev + 1)} className="text-slate-400">
                                                I don't have it yet, skip for now
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* 3. ASSETS */}
                                {stepId === "assets" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Landmark className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Where did they bank?</h2>
                                            <p className="text-slate-500">List 1-3 institutions you know about. You can add more later.</p>
                                        </div>

                                        <div className="space-y-3">
                                            {assets.map((asset, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <Input
                                                        placeholder="Bank or Brokerage Name"
                                                        value={asset.name}
                                                        onChange={e => {
                                                            const newAssets = [...assets];
                                                            newAssets[idx].name = e.target.value;
                                                            setAssets(newAssets);
                                                        }}
                                                        className="h-11 bg-slate-50"
                                                    />
                                                    <Select
                                                        value={asset.type}
                                                        onValueChange={val => {
                                                            const newAssets = [...assets];
                                                            newAssets[idx].type = val;
                                                            setAssets(newAssets);
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-11 bg-slate-50">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="financial">Financial</SelectItem>
                                                            <SelectItem value="retirement">Retirement</SelectItem>
                                                            <SelectItem value="property">Property</SelectItem>
                                                            <SelectItem value="insurance">Insurance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                            {assets.length < 3 && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAssets([...assets, { name: "", type: "financial" }])}
                                                    className="w-full border-dashed border-slate-300 text-slate-500"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Add Another
                                                </Button>
                                            )}
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            disabled={assets.every(a => !a.name) || isLoading}
                                            className="w-full rounded-2xl h-12 font-bold mt-4"
                                        >
                                            {isLoading ? "Saving..." : "Continue"}
                                        </Button>
                                    </div>
                                )}

                                {/* 4. COMPLETION */}
                                {stepId === "completion" && (
                                    <div className="text-center space-y-8 py-4">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                            <ShieldCheck className="w-10 h-10 text-primary" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-slate-900 mb-2">You're all set.</h1>
                                            <p className="text-slate-600">
                                                We've set up your secure dashboard.
                                                <br />
                                                You can now start contacting institutions and tracking your progress.
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

                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="mx-auto block mt-8 text-slate-400 hover:text-slate-600"
                    >
                        Back
                    </Button>
                )}
            </div>
        </div>
    );
}
