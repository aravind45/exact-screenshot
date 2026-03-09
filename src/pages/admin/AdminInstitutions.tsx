import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, Trash2, Building, Mail, Phone } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export default function AdminInstitutions() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        fax: "",
        address: "",
        website: ""
    });

    const { data: institutions, isLoading } = useQuery({
        queryKey: ["admin", "institutions"],
        queryFn: api.admin.getInstitutions
    });

    const createMutation = useMutation({
        mutationFn: api.admin.createInstitution,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "institutions"] });
            toast({ title: "Created", description: "Institution added to directory." });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.admin.updateInstitution(editingId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "institutions"] });
            toast({ title: "Updated", description: "Institution details updated." });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });

    const deleteMutation = useMutation({
        mutationFn: api.admin.deleteInstitution,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "institutions"] });
            toast({ title: "Deleted", description: "Institution removed." });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (inst: any) => {
        setEditingId(inst.id);
        setFormData({
            name: inst.name,
            email: inst.email || "",
            phone: inst.phone || "",
            fax: inst.fax || "",
            address: inst.address || "",
            website: inst.website || ""
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: "", email: "", phone: "", fax: "", address: "", website: "" });
    };

    const institutionList = Array.isArray(institutions)
        ? institutions
        : Array.isArray((institutions as any)?.data)
            ? (institutions as any).data
            : Array.isArray((institutions as any)?.institutions)
                ? (institutions as any).institutions
                : [];

    const filteredInstitutions = institutionList.filter((inst: any) =>
        String(inst?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="p-8">Loading directory...</div>;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <div className="container mx-auto p-6 max-w-6xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Institution Directory</h1>
                            <p className="text-slate-500">Manage centralized contact details for banks, brokerages, and insurance companies.</p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
                                    <Plus className="w-4 h-4" /> Add Institution
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingId ? "Edit Institution" : "Add New Institution"}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Institution Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Robinhood Financial"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Estate Email</Label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="estates@company.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estate Phone</Label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(800) 555-0199"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Fax (for Letters)</Label>
                                            <Input
                                                value={formData.fax}
                                                onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                                                placeholder="(888) 555-0123"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Website / Portal</Label>
                                            <Input
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mailing Address</Label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="P.O. Box 123..."
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-slate-900" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {editingId ? "Update Details" : "Add to Directory"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search directory..."
                                    className="pl-8 max-w-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Institution</TableHead>
                                        <TableHead>Contact Info</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInstitutions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                                No institutions found. Add one to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInstitutions.map((inst: any) => (
                                            <TableRow key={inst.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-slate-100 rounded-md text-slate-500">
                                                            <Building className="w-4 h-4" />
                                                        </div>
                                                        {inst.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                                                        {inst.email && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="w-3 h-3 text-blue-500" />
                                                                {inst.email}
                                                            </div>
                                                        )}
                                                        {inst.phone && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="w-3 h-3 text-green-600" />
                                                                {inst.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                                                    {inst.address || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(inst)}>
                                                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50" onClick={() => deleteMutation.mutate(inst.id)}>
                                                            <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

