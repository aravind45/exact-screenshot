import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    ArrowLeft,
    Users,
    Database,
    DollarSign,
    Building2,
    ShieldCheck,
    Search,
    CheckCircle2,
    MoreVertical,
    Filter,
    Save,
    X,
    Loader2,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "stats"],
        queryFn: () => api.getAdminStats(),
    });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: () => api.getAdminUsers(),
    });

    const { data: institutions, isLoading: institutionsLoading } = useQuery({
        queryKey: ["admin", "institutions"],
        queryFn: () => api.getAdminInstitutions(),
    });

    const filteredUsers = users?.filter((u: any) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="sticky top-0 z-40 glass border-b border-border/50">
                    <div className="section-container">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Exit Admin
                                </Button>
                                <div className="h-6 w-px bg-border mx-2" />
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                                    <h1 className="font-bold text-lg tracking-tight">Admin Console</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="section-container py-8 space-y-8">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="card-elevated border-none bg-primary/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Total Users
                                </CardDescription>
                                <CardTitle className="text-3xl font-bold">
                                    {statsLoading ? "..." : stats?.users || 0}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="card-elevated border-none">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Database className="w-4 h-4" /> Managed Assets
                                </CardDescription>
                                <CardTitle className="text-3xl font-bold">
                                    {statsLoading ? "..." : stats?.assets || 0}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="card-elevated border-none">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Platform Value
                                </CardDescription>
                                <CardTitle className="text-3xl font-bold">
                                    {statsLoading ? "..." : formatCurrency(stats?.totalValue || 0)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="card-elevated border-none">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Institutions
                                </CardDescription>
                                <CardTitle className="text-3xl font-bold">
                                    {statsLoading ? "..." : stats?.institutions || 0}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="overview">System Users</TabsTrigger>
                            <TabsTrigger value="institutions">Institution Master</TabsTrigger>
                            <TabsTrigger value="templates">Form Templates</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-0 space-y-4">
                            <div className="card-elevated overflow-hidden border-none">
                                <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users..."
                                            className="pl-9 bg-muted/30"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                                            <tr>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Location</th>
                                                <th className="px-6 py-4">Estates</th>
                                                <th className="px-6 py-4">Logs</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {filteredUsers?.map((user: any) => (
                                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{user.fullName}</span>
                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono uppercase font-bold text-primary">
                                                        {user.role}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {user.state || "Not set"}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">
                                                        {user._count.estates}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                                        {user._count.communications}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-green-600">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span className="text-[11px] font-medium">Active</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="institutions" className="mt-0">
                            <div className="card-elevated border-none overflow-hidden p-8 flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-amber-100 rounded-full text-amber-600">
                                    <Building2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Institution Directory</h3>
                                    <p className="text-slate-500 max-w-md mx-auto">Access the centralized database of contact details (emails, phone numbers) for banks and brokerages.</p>
                                </div>
                                <Button onClick={() => navigate("/admin/institutions")} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                                    Manage Directory <ExternalLink className="w-4 h-4" />
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="templates" className="mt-0">
                            <TemplateManager />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div >
    );
}

function InstitutionRow({ institution }: { institution: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: institution.phone || "",
        email: institution.email || "",
        fax: institution.fax || "",
        website: institution.website || "",
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateAdminInstitution(institution.id, data),
        onSuccess: () => {
            toast({ title: "Institution Updated", description: `${institution.name} has been updated globally.` });
            queryClient.invalidateQueries({ queryKey: ["admin", "institutions"] });
            setIsEditing(false);
        },
    });

    if (isEditing) {
        return (
            <tr className="bg-primary/5">
                <td className="px-6 py-4 font-bold">{institution.name}</td>
                <td className="px-6 py-4">
                    <Input
                        size={1}
                        className="h-8 py-0 px-2 text-xs"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </td>
                <td className="px-6 py-4">
                    <Input
                        size={1}
                        className="h-8 py-0 px-2 text-xs"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </td>
                <td className="px-6 py-4">
                    <Input
                        size={1}
                        className="h-8 py-0 px-2 text-xs"
                        value={formData.fax}
                        onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    />
                </td>
                <td className="px-6 py-4">
                    <Input
                        size={1}
                        className="h-8 py-0 px-2 text-xs"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-6 py-4 font-semibold">{institution.name}</td>
            <td className="px-6 py-4 text-muted-foreground">{institution.phone || "—"}</td>
            <td className="px-6 py-4 text-muted-foreground">{institution.email || "—"}</td>
            <td className="px-6 py-4 text-muted-foreground">{institution.fax || "—"}</td>
            <td className="px-6 py-4">
                {institution.website ? (
                    <a href={institution.website} target="_blank" className="text-primary hover:underline flex items-center gap-1">
                        Link <ExternalLink className="w-3 h-3" />
                    </a>
                ) : "—"}
            </td>
            <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
            </td>
        </tr>
    );
}

function TemplateManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    const { data: templates } = useQuery({
        queryKey: ["admin", "templates"],
        queryFn: api.getTemplates
    });

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const file = formData.get("file") as File;

        if (!name || !file) return;

        setUploading(true);
        try {
            await api.uploadTemplate(name, file);
            toast({ title: "Template Uploaded", description: `Updated ${name} successfully.` });
            queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="card-elevated border-none">
                <CardHeader>
                    <CardTitle>Upload PDF Template</CardTitle>
                    <CardDescription>Upload official court forms (e.g. DE-111.pdf) to be used by the generator.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">Template Code</label>
                            <Input name="name" placeholder="e.g. DE-111" defaultValue="DE-111" required />
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">PDF File</label>
                            <Input name="file" type="file" accept=".pdf" required />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Upload
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="card-elevated border-none">
                <CardHeader><CardTitle>Existing Templates</CardTitle></CardHeader>
                <CardContent>
                    <div className="border rounded-lg divide-y">
                        {templates?.map((t: any) => (
                            <div key={t.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-bold">{t.name}</div>
                                    <div className="text-xs text-muted-foreground">Last updated: {new Date(t.updatedAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Active
                                </div>
                            </div>
                        ))}
                        {templates?.length === 0 && <div className="p-4 text-muted-foreground text-center">No templates found.</div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
