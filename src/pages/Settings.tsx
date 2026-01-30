import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Save, User, Gavel, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function Settings() {
    const queryClient = useQueryClient();
    const { data: estate } = useQuery({ queryKey: ["estate"], queryFn: api.getMyEstate });
    const { data: heirs = [] } = useQuery({ queryKey: ["heirs"], queryFn: api.getHeirs });
    const { data: user } = useQuery({ queryKey: ["user"], queryFn: api.getProfile });

    // General Estate Form
    const updateEstateMutation = useMutation({
        mutationFn: (data: any) => api.updateEstate(estate.id, data),
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

    const handleAddHeir = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        createHeirMutation.mutate(Object.fromEntries(formData));
    };

    if (!estate) return null;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings & Configuration</h1>
                        <p className="text-slate-500 mt-1">
                            Manage case details, beneficiaries, and legal team.
                        </p>
                    </div>

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
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="deceasedFirstName">Deceased First Name</Label>
                                                <Input id="deceasedFirstName" name="deceasedFirstName" defaultValue={estate.deceasedFirstName} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="deceasedLastName">Deceased Last Name</Label>
                                                <Input id="deceasedLastName" name="deceasedLastName" defaultValue={estate.deceasedLastName} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="dateOfDeath">Date of Death</Label>
                                                <Input
                                                    id="dateOfDeath"
                                                    name="dateOfDeath"
                                                    type="date"
                                                    defaultValue={estate.dateOfDeath ? new Date(estate.dateOfDeath).toISOString().split('T')[0] : ''}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="courtCaseNumber">Court Case Number</Label>
                                                <Input id="courtCaseNumber" name="courtCaseNumber" defaultValue={estate.courtCaseNumber} placeholder="e.g. PRO-24-00123" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="county">County of Filing</Label>
                                            <Input id="county" name="county" defaultValue={estate.county} placeholder="e.g. Los Angeles" />
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
                                        <CardDescription>
                                            People receiving assets. Required for Final Distribution.
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
                                            <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-lg">
                                                No heirs added yet.
                                            </div>
                                        )}
                                        {heirs.map((heir: any) => (
                                            <div key={heir.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                        {heir.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{heir.name}</div>
                                                        <div className="text-sm text-slate-500">{heir.relationship}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-sm text-slate-400 max-w-[200px] truncate hidden md:block">
                                                        {heir.address || heir.email || "No contact info"}
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteHeirMutation.mutate(heir.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Team Tab */}
                        <TabsContent value="team">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Legal Team & Executor</CardTitle>
                                    <CardDescription>
                                        Contact info used for the bottom of court forms.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-slate-50 rounded-lg border">
                                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4" /> Executor / Petitioner
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
                                                <div className="col-span-2">
                                                    <span className="text-slate-500 block">Address</span>
                                                    {user?.streetAddress ? `${user.streetAddress}, ${user.city}, ${user.state} ${user.zipCode}` : "Not set (Go to Profile to edit)"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-lg border opacity-50 cursor-not-allowed">
                                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                                <Gavel className="w-4 h-4" /> Attorney (Pro Per)
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                Currently operating as "Pro Per" (Self-Represented).
                                                Attorney management coming soon.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
