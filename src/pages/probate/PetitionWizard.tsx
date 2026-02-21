
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Save, Download, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

export default function PetitionWizard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);

    // Fetch Estate Data
    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate, // This includes heirs now
    });

    const updateEst = useMutation({
        mutationFn: api.updateMyEstate,
        onSuccess: () => {
            toast({ title: "Saved", description: "Progress saved." });
            queryClient.invalidateQueries({ queryKey: ["estate"] });
        }
    });

    const createHeir = useMutation({
        mutationFn: api.createHeir,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast({ title: "Heir Added" });
        }
    });

    const deleteHeir = useMutation({
        mutationFn: api.deleteHeir,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast({ title: "Heir Removed" });
        }
    });

    // Local state for Heir Form
    const [newHeir, setNewHeir] = useState({ name: "", relationship: "", isAdult: true, age: "" });

    if (isLoading) return <div className="p-8 text-center">Loading Petition...</div>;
    if (!estate) return <div className="p-8 text-center">Estate not found.</div>;

    const totalSteps = 5;

    const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleDownload = async () => {
        try {
            await api.getPetitionPdf("DE-111_Petition.pdf");
            toast({ title: "Downloaded", description: "Form DE-111 has been generated." });
        } catch (e) {
            toast({ variant: "destructive", title: "Download Failed", description: "Could not generate PDF." });
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/probate")}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Petition for Probate (DE-111)</h1>
                            <p className="text-sm text-slate-500">Step {step} of {totalSteps}: {
                                ["Decedent Info", "Petitioner Info", "Will details", "Heirs", "Review & Sign"][step - 1]
                            }</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-500 ease-in-out"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>

                    <Card className="min-h-[400px] flex flex-col">
                        <CardContent className="flex-1 p-6">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                        <h3 className="text-lg font-semibold">Decedent Information</h3>
                                        <p className="text-sm text-slate-500 mb-4">Confirm basic details about the deceased person.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>First Name</Label>
                                                <Input defaultValue={estate.deceasedFirstName} onBlur={(e) => updateEst.mutate({ deceasedFirstName: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Last Name</Label>
                                                <Input defaultValue={estate.deceasedLastName} onBlur={(e) => updateEst.mutate({ deceasedLastName: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date of Death</Label>
                                                <Input
                                                    type="date"
                                                    defaultValue={estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toISOString().split('T')[0] : ""}
                                                    onChange={(e) => updateEst.mutate({ deceasedDateOfDeath: new Date(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Residence at Death (State)</Label>
<Input defaultValue={estate.deceasedState || ""} placeholder="e.g. GA" onBlur={(e) => updateEst.mutate({ deceasedState: e.target.value })} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                        <h3 className="text-lg font-semibold">Petitioner Information</h3>
                                        <p className="text-sm text-slate-500 mb-4">You are the petitioner. Verify your contact info for the court.</p>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Your Phone Number</Label>
                                                <Input
                                                    placeholder="555-0123"
                                                    defaultValue={estate.petitionerPhone || ""}
                                                    onBlur={(e) => updateEst.mutate({ petitionerPhone: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 p-4 border rounded-lg">
                                                <Checkbox
                                                    id="attorney"
                                                    checked={estate.petitionerIsAttorney}
                                                    onCheckedChange={(checked) => updateEst.mutate({ petitionerIsAttorney: !!checked })}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor="attorney" className="font-bold">I am an attorney representing the estate</Label>
                                                    <p className="text-xs text-slate-500">Uncheck if you are filing "In Pro Per" (representing yourself).</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                        <h3 className="text-lg font-semibold">The Will & Bond</h3>
                                        <div className="space-y-6">
                                            {/* Will Logic */}
                                            <div className="p-4 border rounded-lg space-y-4 bg-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base">Did the decedent leave a distinct Will?</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant={estate.hasWill ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => updateEst.mutate({ hasWill: true })}
                                                        >Yes</Button>
                                                        <Button
                                                            variant={!estate.hasWill ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => updateEst.mutate({ hasWill: false })}
                                                        >No</Button>
                                                    </div>
                                                </div>
                                                {estate.hasWill && (
                                                    <div className="pt-2 border-t border-slate-200">
                                                        <Label>Date of Will</Label>
                                                        <Input
                                                            type="date"
                                                            className="mt-1"
                                                            defaultValue={estate.willDate ? new Date(estate.willDate).toISOString().split('T')[0] : ""}
                                                            onChange={(e) => updateEst.mutate({ willDate: new Date(e.target.value) })}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bond Logic */}
                                            <div className="space-y-2">
                                                <Label className="text-base font-semibold">Bond Requirement</Label>
                                                <p className="text-sm text-slate-500">The court requires a bond to protect assets unless waived by the Will or all heirs.</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <Checkbox
                                                        id="waiver"
                                                        checked={estate.bondWaived}
                                                        onCheckedChange={(c) => updateEst.mutate({ bondWaived: !!c })}
                                                    />
                                                    <Label htmlFor="waiver">Bond is waived (in Will or by all heirs)</Label>
                                                </div>
                                                {!estate.bondWaived && (
                                                    <div className="mt-2">
                                                        <Label>Bond Amount Request ($)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Autocalculated if left empty"
                                                            defaultValue={estate.bondAmount}
                                                            onBlur={(e) => updateEst.mutate({ bondAmount: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 4 && (
                                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">Heirs & Beneficiaries</h3>
                                            <p className="text-sm text-slate-500">List all persons named in Will or eligible by law.</p>
                                        </div>

                                        {/* Existing Heirs */}
                                        <div className="border rounded-lg divide-y">
                                            {estate.heirs?.length === 0 && <div className="p-4 text-center text-slate-500 italic">No heirs listed yet.</div>}
                                            {estate.heirs?.map((heir: any) => (
                                                <div key={heir.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{heir.name}</div>
                                                        <div className="text-xs text-slate-500">{heir.relationship} • {heir.isAdult ? "Adult" : "Minor"}</div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteHeir.mutate(heir.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Heir Form */}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                            <h4 className="text-sm font-bold text-slate-700 uppercase">Add New Heir</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Full Name"
                                                    value={newHeir.name}
                                                    onChange={(e) => setNewHeir({ ...newHeir, name: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Relationship (e.g. Son)"
                                                    value={newHeir.relationship}
                                                    onChange={(e) => setNewHeir({ ...newHeir, relationship: e.target.value })}
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                disabled={!newHeir.name}
                                                onClick={() => {
                                                    createHeir.mutate({
                                                        name: newHeir.name,
                                                        relationship: newHeir.relationship,
                                                        isAdult: true
                                                    });
                                                    setNewHeir({ name: "", relationship: "", isAdult: true, age: "" });
                                                }}
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Add Heir
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 5 && (
                                    <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900">Ready to Generate</h3>
                                        <p className="text-slate-600 max-w-md mx-auto">
                                            We have gathered all required information. Click below to generate your official California DE-111 Petition for Probate.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto mt-8">
                                            <div className="p-4 border rounded bg-slate-50">
                                                <div className="text-xs font-bold text-slate-500 uppercase">Will Status</div>
                                                <div className="font-medium">{estate.hasWill ? "Has Will" : "Intestate"}</div>
                                            </div>
                                            <div className="p-4 border rounded bg-slate-50">
                                                <div className="text-xs font-bold text-slate-500 uppercase">Bond Request</div>
                                                <div className="font-medium">{estate.bondWaived ? "Waived" : `$${estate.bondAmount || "Auto"}`}</div>
                                            </div>
                                            <div className="p-4 border rounded bg-slate-50">
                                                <div className="text-xs font-bold text-slate-500 uppercase">Heirs Count</div>
                                                <div className="font-medium">{estate.heirs?.length || 0}</div>
                                            </div>
                                        </div>

                                        <div className="pt-8">
                                            <Button size="lg" className="h-12 px-8 text-lg shadow-xl shadow-primary/20" onClick={handleDownload}>
                                                <Download className="w-5 h-5 mr-2" />
                                                Download Form DE-111
                                            </Button>
                                            <p className="text-xs text-slate-400 mt-4">
                                                This is a fillable PDF. You can edit it further in Adobe Acrobat if needed.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

                        <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-between">
                            <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                                Back
                            </Button>
                            {step < totalSteps ? (
                                <Button onClick={nextStep}>
                                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <div></div>
                            )}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
