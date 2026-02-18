import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Save, User, Gavel, FileText, AlertTriangle, ShieldCheck, CheckCircle2, Mail, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserManagement } from "@/components/UserManagement";

export default function Settings() {
    const queryClient = useQueryClient();
    const { data: estate } = useQuery({ queryKey: ["estate"], queryFn: api.getMyEstate });
    const { data: heirs = [] } = useQuery({ queryKey: ["heirs"], queryFn: api.getHeirs });
    const { data: user } = useQuery({ queryKey: ["user"], queryFn: api.getProfile });

    // General Estate Form
    const updateEstateMutation = useMutation({
        mutationFn: (data: any) => api.updateMyEstate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast.success("Estate details updated");
        }
    });

    const handleEstateSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const updates = Object.fromEntries(formData);
        updateEstateMutation.mutate(updates);
    };

    // Heir Management
    const [isHeirDialogOpen, setIsHeirDialogOpen] = useState(false);

    const createHeirMutation = useMutation({
        mutationFn: api.createHeir,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["heirs"] });
            setIsHeirDialogOpen(false);
            toast.success("Heir added");
        }
    });

    const deleteHeirMutation = useMutation({
        mutationFn: api.deleteHeir,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["heirs"] });
            toast.success("Heir removed");
        }
    });

    const inviteHeirMutation = useMutation({
        mutationFn: api.inviteHeir,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["heirs"] });
            queryClient.invalidateQueries({ queryKey: ["collaborators", estate?.id] });

            if (data.limitExceeded) {
                toast.error("Collaborator limit (5) reached. Please manage your team in the 'Team' tab.", {
                    duration: 5000,
                    action: {
                        label: "Go to Team",
                        onClick: () => {
                            const teamTab = document.querySelector('[value="team"]') as HTMLElement;
                            if (teamTab) teamTab.click();
                        }
                    }
                });
                return;
            }

            if (data.reused) {
                if (data.emailSent) {
                    toast.success("Existing invitation resent to heir");
                } else {
                    toast.warning("Existing invitation updated, but email failed. Share the link manually from the Team tab.");
                }
                return;
            }

            if (data.emailSent) {
                toast.success("Invitation email sent to heir");
            } else if (data.emailError) {
                toast.warning(data.emailError);
            } else {
                toast.success("Heir invited");
            }
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to send invitation");
        }
    });

    const handleAddHeir = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        createHeirMutation.mutate(Object.fromEntries(formData));
    };

    if (!estate) return null;

    const isCaseDataComplete = !!(
        estate.deceasedFirstName &&
        estate.deceasedLastName &&
        estate.deceasedDateOfDeath &&
        estate.deceasedState &&
        estate.probateCounty &&
        estate.courtCaseNumber
    );

    const isConfigurationComplete = isCaseDataComplete && heirs.length > 0;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-start justify-between gap-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings & Configuration</h1>
                        <p className="text-slate-500 mt-1">
                            Manage case details, beneficiaries, and legal team.
                        </p>
                    </div>

                    {/* Readiness Banner */}
                    <Card className={cn(
                        "border-none shadow-sm px-6 py-4 flex items-center gap-4 transition-all duration-500",
                        isConfigurationComplete ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isConfigurationComplete ? "bg-emerald-100" : "bg-amber-100"
                        )}>
                            {isConfigurationComplete ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-tight leading-none mb-1">
                                {isConfigurationComplete ? "Configuration Complete" : "Incomplete Configuration"}
                            </h3>
                            <p className="text-[10px] font-bold opacity-70 leading-none">
                                {isConfigurationComplete
                                    ? "Required case details and beneficiaries are configured."
                                    : "Beneficiaries must be added before final distribution can proceed."}
                            </p>
                        </div>
                    </Card>
                </header>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">Data & Case Info</TabsTrigger>
                        <TabsTrigger value="heirs">Heirs & Beneficiaries</TabsTrigger>
                        <TabsTrigger value="team">Executor & Team</TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Case Information</CardTitle>
                                <CardDescription>
                                    This data appears on all court forms (DE-111, DE-150, etc.).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleEstateSave} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="deceasedFirstName">Deceased First Name</Label>
                                            <Input id="deceasedFirstName" name="deceasedFirstName" defaultValue={estate.deceasedFirstName} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="deceasedLastName">Deceased Last Name</Label>
                                            <Input id="deceasedLastName" name="deceasedLastName" defaultValue={estate.deceasedLastName} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="deceasedDateOfBirth">Date of Birth (Optional)</Label>
                                            <Input
                                                id="deceasedDateOfBirth"
                                                name="deceasedDateOfBirth"
                                                type="date"
                                                defaultValue={estate.deceasedDateOfBirth ? new Date(estate.deceasedDateOfBirth).toISOString().split('T')[0] : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="deceasedState">Deceased State of Residence</Label>
                                            <Input id="deceasedState" name="deceasedState" defaultValue={estate.deceasedState} placeholder="e.g. CA" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="deceasedDateOfDeath">Date of Death</Label>
                                            <Input
                                                id="deceasedDateOfDeath"
                                                name="deceasedDateOfDeath"
                                                type="date"
                                                defaultValue={estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toISOString().split('T')[0] : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="courtCaseNumber">Court Case Number</Label>
                                            <Input id="courtCaseNumber" name="courtCaseNumber" defaultValue={estate.courtCaseNumber} placeholder="e.g. PRO-24-00123" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="probateCounty">County of Filing</Label>
                                        <Input id="probateCounty" name="probateCounty" defaultValue={estate.probateCounty} placeholder="e.g. Los Angeles" />
                                    </div>

                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                                        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                            <span className="font-black uppercase">Fiduciary Warning:</span> Changes to Case Information affect all generated court documents and the distribution ledger. Ensure accuracy to avoid re-filing fees.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <Button type="submit">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Case Details
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Heirs Tab */}
                    <TabsContent value="heirs">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Beneficiaries</CardTitle>
                                    <CardDescription className="text-slate-500">
                                        People receiving assets. All updates are recorded in the Settlement Trail for legal defensibility.
                                    </CardDescription>
                                </div>
                                <Dialog open={isHeirDialogOpen} onOpenChange={setIsHeirDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Heir</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Heir</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddHeir} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input name="name" required placeholder="John Doe" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Relationship</Label>
                                                <Input name="relationship" required placeholder="Son, Spouse, etc." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email (Optional)</Label>
                                                <Input name="email" type="email" placeholder="john@example.com" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Address</Label>
                                                <Input name="address" placeholder="123 Main St..." />
                                            </div>
                                            <Button type="submit" className="w-full">Create Heir</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {heirs.length === 0 && (
                                        <div className="text-center py-12 px-6 text-slate-500 border-2 border-dashed border-amber-200 bg-amber-50/30 rounded-2xl">
                                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <h3 className="font-black text-amber-900 uppercase tracking-tight mb-2">No Beneficiaries Added</h3>
                                            <p className="text-xs text-amber-800/70 max-w-xs mx-auto leading-relaxed">
                                                <span className="font-black">Final Distribution cannot be completed</span> until beneficiaries are defined. This is a legally mandatory step.
                                            </p>
                                        </div>
                                    )}
                                    {heirs.map((heir: any) => (
                                        <div key={heir.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                                                    {heir.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-slate-900">{heir.name}</div>
                                                        {heir.userId ? (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-[10px] py-0">
                                                                <ShieldCheck className="w-3 h-3" /> Joined
                                                            </Badge>
                                                        ) : heir.hasPendingInvite && (
                                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 text-[10px] py-0">
                                                                <Clock className="w-3 h-3" /> Pending
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-500 font-medium">{heir.relationship}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <div className="text-sm text-slate-600 font-medium truncate max-w-[200px]">
                                                        {heir.email || heir.address || "No contact info"}
                                                    </div>
                                                    {heir.email && !heir.userId && (
                                                        <div className="text-[10px] text-slate-400 italic">Not joined yet</div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 border-l pl-4 ml-2">
                                                    <div className="flex items-center gap-2">
                                                        {heir.hasPendingInvite && (
                                                            <>
                                                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 gap-1 anime-pulse">
                                                                    <Clock className="w-3 h-3" /> PENDING
                                                                </Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                                                                    title="Copy Invite Link"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const url = `${window.location.origin}/invite/${heir.pendingInviteToken}`;
                                                                        navigator.clipboard.writeText(url);
                                                                        toast.success("Invitation link copied!");
                                                                    }}
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {heir.userId ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px]">
                                                                JOINED
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    inviteHeirMutation.mutate(heir.id);
                                                                }}
                                                                disabled={inviteHeirMutation.isPending || heir.hasPendingInvite}
                                                            >
                                                                {inviteHeirMutation.isPending ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                                ) : (
                                                                    <Mail className="w-3 h-3 mr-1" />
                                                                )}
                                                                {heir.hasPendingInvite ? "Invited" : "Invite"}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={() => deleteHeirMutation.mutate(heir.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Team Tab */}
                    <TabsContent value="team" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Case Executor</CardTitle>
                                <CardDescription>
                                    The primary person responsible for this estate.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-slate-50 rounded-lg border">
                                    <h3 className="font-bold flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-indigo-600" /> Primary Petitioner
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 block">Name</span>
                                            {user?.fullName || "Not set"}
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Email</span>
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <UserManagement estateId={estate.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
