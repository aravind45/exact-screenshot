import { useState, useEffect } from "react";
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
    ExternalLink,
    Mail,
    FileCheck,
    CreditCard,
    Ban,
    RefreshCcw,
    BookOpen,
    Trash2,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { BillingManager } from "@/components/BillingManager";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Reset State
    const [resetEstateId, setResetEstateId] = useState<string | null>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "stats"],
        queryFn: () => api.admin.getStats(),
    });

    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: userData, isLoading: usersLoading } = useQuery({
        queryKey: ["admin", "users", page, debouncedSearch],
        queryFn: () => api.admin.getUsers({ page, limit: pageSize, search: debouncedSearch }),
    });

    const users = userData?.data;
    const totalUsers = userData?.total;
    const totalPages = userData?.totalPages;

    const resetMutation = useMutation({
        mutationFn: (estateId: string) => api.admin.resetEstate(estateId),
        onSuccess: () => {
            toast({
                title: "Estate Reset Successful",
                description: "The settlement track and roadmap data have been cleared.",
            });
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setIsResetDialogOpen(false);
            setResetEstateId(null);
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Reset Failed",
                description: error.message || "An error occurred while resetting the estate.",
            });
        },
    });

    const waiveFeesMutation = useMutation({
        mutationFn: (userId: string) => api.admin.waiveFees(userId, "Admin granted premium status"),
        onSuccess: () => {
            toast({
                title: "Fees Waived",
                description: "User has been granted premium access.",
            });
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Action Failed",
                description: error.message,
            });
        },
    });

    const handleResetConfirm = () => {
        if (resetEstateId) {
            resetMutation.mutate(resetEstateId);
        }
    };

    const { data: institutions, isLoading: institutionsLoading } = useQuery({
        queryKey: ["admin", "institutions"],
        queryFn: () => api.admin.getInstitutions(),
    });

    // Server-side filtering now handled by useQuery
    const filteredUsers = users;

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
                        <Card className="card-elevated border-none bg-indigo-600 text-white shadow-indigo-200">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2 text-indigo-100">
                                    <TrendingUp className="w-4 h-4" /> Marketing Leads
                                </CardDescription>
                                <CardTitle className="text-3xl font-bold">
                                    {statsLoading ? "..." : stats?.leads || 0}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="overview">System Users</TabsTrigger>
                            <TabsTrigger value="billing">Billing & Ledger</TabsTrigger>
                            <TabsTrigger value="institutions">Institution Master</TabsTrigger>
                            <TabsTrigger value="templates">Form Templates</TabsTrigger>
                            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                            <TabsTrigger value="communications">Communications</TabsTrigger>
                            <TabsTrigger value="marketing">Marketing & Leads</TabsTrigger>
                            <TabsTrigger value="advisors">Advisors</TabsTrigger>
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
                                                <th className="px-6 py-4">Subscription</th>
                                                <th className="px-6 py-4">Estates</th>
                                                <th className="px-6 py-4">Registered</th>
                                                <th className="px-6 py-4">Logs</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {usersLoading ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-20 text-center text-muted-foreground">
                                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                        Loading users...
                                                    </td>
                                                </tr>
                                            ) : filteredUsers?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-20 text-center text-muted-foreground font-medium">
                                                        No users found matching your search.
                                                    </td>
                                                </tr>
                                            ) : filteredUsers?.map((user: any) => (
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
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col text-sm">
                                                            <span className="font-medium">{user.state || "—"}</span>
                                                            {user.city && <span className="text-xs text-muted-foreground">{user.city}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={user.subscriptionStatus === 'ACTIVE' ? 'default' : 'outline'} className="text-[10px]">
                                                            {user.subscriptionStatus || 'FREE'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">
                                                        {user._count.estates}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(user.createdAt).toLocaleDateString()}
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
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => { /* View details logic */ }}>
                                                                    View Profile
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-indigo-600 focus:text-indigo-600"
                                                                    onClick={() => waiveFeesMutation.mutate(user.id)}
                                                                >
                                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                                    Grant Premium (Waive)
                                                                </DropdownMenuItem>
                                                                {user.estates && user.estates.map((estate: any) => (
                                                                    <DropdownMenuItem
                                                                        key={estate.id}
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => {
                                                                            setResetEstateId(estate.id);
                                                                            setIsResetDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                                                        Reset Estate Track
                                                                    </DropdownMenuItem>
                                                                ))}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                    <Ban className="w-4 h-4 mr-2" />
                                                                    Suspend Account
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {users?.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalUsers || 0)} of {totalUsers || 0} users
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="h-8 text-xs"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-medium px-2 text-muted-foreground">
                                                Page <span className="text-foreground">{page}</span> of {totalPages || 1}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                                            disabled={page >= (totalPages || 1)}
                                            className="h-8 text-xs"
                                        >
                                            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="billing" className="mt-0">
                            <BillingManager />
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

                        <TabsContent value="knowledge" className="mt-0">
                            <KnowledgeManager />
                        </TabsContent>

                        <TabsContent value="communications" className="mt-0">
                            <CommunicationsManager />
                        </TabsContent>

                        <TabsContent value="marketing" className="mt-0">
                            <MarketingManager />
                        </TabsContent>

                        <TabsContent value="advisors" className="mt-0">
                            <AdvisorManager />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will completely reset the estate settlement track, roadmap progress, and authority decisions.
                            The user will have to start their intake process over. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleResetConfirm}
                            disabled={resetMutation.isPending}
                        >
                            {resetMutation.isPending ? "Resetting..." : "Reset Estate Track"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
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
        const state = formData.get("state") as string;
        const category = formData.get("category") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const icon = formData.get("icon") as string;
        const file = formData.get("file") as File;

        if (!name || !file) return;

        setUploading(true);
        try {
            await api.uploadTemplate(name, file, { state, category, title, description, icon });
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
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Code</label>
                                <Input name="name" placeholder="e.g. DE-111" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Display Title</label>
                                <Input name="title" placeholder="e.g. Petition for Probate" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Icon (Lucide Name)</label>
                                <Input name="icon" placeholder="e.g. ScrollText" defaultValue="FileText" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">State</label>
                                <Input name="state" placeholder="e.g. CA" defaultValue="CA" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Input name="category" placeholder="e.g. Probate" defaultValue="General" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input name="description" placeholder="Short description of the form's purpose" required />
                        </div>
                        <div className="flex gap-4 items-end">
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-medium">PDF File</label>
                                <Input name="file" type="file" accept=".pdf" required />
                            </div>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Upload Template
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="card-elevated border-none">
                <CardHeader><CardTitle>Existing Templates</CardTitle></CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Code / Title</th>
                                    <th className="px-4 py-3">State</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Last Updated</th>
                                    <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {templates?.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold">{t.name}</div>
                                            <div className="text-xs text-muted-foreground">{t.title || 'No Title'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="text-[10px]">{t.state}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(t.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {templates?.length === 0 && (
                            <div className="p-8 text-muted-foreground text-center">No templates found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function KnowledgeManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [ingesting, setIngesting] = useState(false);
    const [sourceName, setSourceName] = useState("");
    const [rawText, setRawText] = useState("");

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "knowledge", "stats"],
        queryFn: () => api.adminKnowledge.getStats()
    });

    const { data: documents, isLoading: documentsLoading } = useQuery({
        queryKey: ["admin", "knowledge", "documents"],
        queryFn: () => api.adminKnowledge.getDocuments()
    });

    const ingestMutation = useMutation({
        mutationFn: () => api.adminKnowledge.ingestText(rawText, sourceName),
        onSuccess: (data) => {
            toast({
                title: "Ingestion Complete",
                description: `Successfully processed ${data.successfullyIngested}/${data.totalChunks} chunks.`
            });
            setRawText("");
            setSourceName("");
            setSourceName("");
            queryClient.invalidateQueries({ queryKey: ["admin", "knowledge"] });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: "Ingestion Failed", description: err.message });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.adminKnowledge.deleteDocument(id),
        onSuccess: () => {
            toast({ title: "Document Deleted" });
            queryClient.invalidateQueries({ queryKey: ["admin", "knowledge"] });
        }
    });

    const ingestMatrixMutation = useMutation({
        mutationFn: (file: File) => api.adminKnowledge.ingestMatrixXlsx(file),
        onSuccess: () => {
            toast({
                title: "Matrix Ingestion Complete",
                description: "Matrix data has been successfully imported and processed.",
            });
            queryClient.invalidateQueries({ queryKey: ["admin", "knowledge"] });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: "Matrix Ingestion Failed", description: err.message });
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setRawText(text);
            if (!sourceName) setSourceName(file.name.replace(".txt", ""));
        };
        reader.readAsText(file);
    };

    const handleMatrixFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast({
            title: "Ingesting Matrix",
            description: "Please wait while the matrix file is processed...",
        });

        ingestMatrixMutation.mutate(file);

        // Reset file input
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100 flex items-center gap-2">
                            <Database className="w-4 h-4" /> Total Chunks
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {statsLoading ? "..." : stats?.totalChunks || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Primary Sources
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {statsLoading ? "..." : stats?.totalDocs || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-indigo-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2 text-xs">
                        {stats?.documents?.slice(0, 5).map((d: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-white/10 last:border-0 uppercase tracking-tighter">
                                <span className="truncate mr-2 text-[10px]">{d.title}</span>
                                <span className="font-bold text-xs">{d._count?.chunks || 0}</span>
                            </div>
                        ))}
                    </CardHeader>
                </Card>
            </div>

            {/* Ingestion Area */}
            <Card className="card-elevated border-none overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Add Legal Material</CardTitle>
                            <CardDescription>Upload a .txt file or paste raw text to train the RAG bot.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="file"
                                accept=".txt"
                                className="hidden"
                                id="rag-file-upload"
                                onChange={handleFileUpload}
                            />
                            <Input
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                id="matrix-file-upload"
                                onChange={handleMatrixFileUpload}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <label htmlFor="rag-file-upload" className="cursor-pointer">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Import .txt
                                    </label>
                                </Button>
                                <Button variant="secondary" size="sm" asChild>
                                    <label htmlFor="matrix-file-upload" className="cursor-pointer">
                                        <Database className="w-4 h-4 mr-2" />
                                        Import Matrix (.xlsx)
                                    </label>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Name</label>
                            <Input
                                placeholder="e.g., Probate Code Section 13000"
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content (Text)</label>
                            <textarea
                                className="w-full h-40 bg-muted/50 border rounded-md p-4 text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Paste legal text here..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={() => ingestMutation.mutate()}
                                disabled={!rawText || !sourceName || ingestMutation.isPending}
                                className="h-10 px-8"
                            >
                                {ingestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Start Ingestion
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Manage Chunks */}
            <Card className="card-elevated border-none overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle>Recent Knowledge Documents</CardTitle>
                    <CardDescription>The source documents ingested into the RAG system.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Document Title</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Chunks</th>
                                <th className="px-6 py-4">Ingested</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {documentsLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading documents...
                                    </td>
                                </tr>
                            ) : documents?.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm truncate max-w-[200px]" title={doc.title}>{doc.title}</span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={doc.sourceUri}>{doc.sourceUri}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="text-[10px] font-bold">
                                            {doc.docType}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono">
                                        {doc._count?.chunks || 0}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {new Date(doc.ingestedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => deleteMutation.mutate(doc.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {documents?.length === 0 && !documentsLoading && (
                        <div className="p-20 text-center text-muted-foreground">
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="font-medium">No knowledge documents found.</p>
                            <p className="text-sm">Start by uploading legal materials above.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

function CommunicationsManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState<string | null>(null);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["admin", "settings"],
        queryFn: () => api.getAdminSettings()
    });

    const updateSetting = useMutation({
        mutationFn: ({ key, value, isSecret }: { key: string; value: string; isSecret: boolean }) =>
            api.updateAdminSetting(key, value, isSecret),
        onSuccess: (_, variables) => {
            toast({ title: "Setting Saved", description: `${variables.key} has been updated.` });
            queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
            setSaving(null);
        },
        onError: () => {
            toast({ variant: "destructive", title: "Save Failed" });
            setSaving(null);
        }
    });

    const getVal = (key: string) => settings?.find((s: any) => s.key === key)?.value || "";

    const handleSave = (key: string, value: string, isSecret: boolean = false) => {
        setSaving(key);
        updateSetting.mutate({ key, value, isSecret });
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <Card className="card-elevated border-none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Application Settings</CardTitle>
                            <CardDescription>Global configuration for the application and links.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">Application Base URL</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="http://localhost:5173"
                                defaultValue={getVal("APP_URL")}
                                onBlur={(e) => handleSave("APP_URL", e.target.value)}
                            />
                            {saving === "APP_URL" && <Loader2 className="w-4 h-4 animate-spin self-center" />}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Used for password reset links and invitation emails.</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="card-elevated border-none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Email Infrastructure (Mailgun)</CardTitle>
                            <CardDescription>Configure outbound and inbound email routing for estates.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Mailgun Domain</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="mg.expectedestate.com"
                                    defaultValue={getVal("MAILGUN_DOMAIN")}
                                    onBlur={(e) => handleSave("MAILGUN_DOMAIN", e.target.value)}
                                />
                                {saving === "MAILGUN_DOMAIN" && <Loader2 className="w-4 h-4 animate-spin self-center" />}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Mailgun API Key</label>
                            <div className="flex gap-2">
                                <Input
                                    type="password"
                                    placeholder="key-xxxxxxxxxxxx"
                                    defaultValue={getVal("MAILGUN_API_KEY")}
                                    onBlur={(e) => handleSave("MAILGUN_API_KEY", e.target.value, true)}
                                />
                                {saving === "MAILGUN_API_KEY" && <Loader2 className="w-4 h-4 animate-spin self-center" />}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="card-elevated border-none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Digital Fax Provider (PamFax)</CardTitle>
                            <CardDescription>Setup secure faxing for HIPAA/Legal document submission.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">PamFax API Key</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. AravindThiyagarajan"
                                    defaultValue={getVal("PAMFAX_API_KEY")}
                                    onBlur={(e) => handleSave("PAMFAX_API_KEY", e.target.value)}
                                />
                                {saving === "PAMFAX_API_KEY" && <Loader2 className="w-4 h-4 animate-spin self-center" />}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">PamFax Secret Word</label>
                            <div className="flex gap-2">
                                <Input
                                    type="password"
                                    placeholder="e.g. secret_word"
                                    defaultValue={getVal("PAMFAX_API_SECRET")}
                                    onBlur={(e) => handleSave("PAMFAX_API_SECRET", e.target.value, true)}
                                />
                                {saving === "PAMFAX_API_SECRET" && <Loader2 className="w-4 h-4 animate-spin self-center" />}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MarketingManager() {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);

    const { data: eventsData, isLoading } = useQuery({
        queryKey: ["admin", "marketing", "events", page],
        queryFn: () => api.admin.getMarketingEvents({ page, limit: pageSize })
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading marketing events...</div>;

    const events = eventsData?.data || [];
    const totalEvents = eventsData?.total || 0;
    const totalPages = eventsData?.totalPages || 1;
    const leads = events?.filter((e: any) => e.email) || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-elevated border-none">
                    <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                        <CardDescription>Latest email captures from the checklist landing page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {leads.slice(0, 5).map((lead: any) => (
                                <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{lead.email}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(lead.createdAt).toLocaleDateString()} via {lead.utmSource || 'direct'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">NEW</Badge>
                                </div>
                            ))}
                            {leads.length === 0 && <p className="text-center py-4 text-muted-foreground">No leads found yet.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-elevated border-none">
                    <CardHeader>
                        <CardTitle>Campaign Performance</CardTitle>
                        <CardDescription>Top sources for marketing events (current page).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {/* Simplified source breakdown */}
                            {Array.from(new Set(events?.map((e: any) => e.utmSource || 'direct'))).map((source: any) => {
                                const count = events?.filter((e: any) => (e.utmSource || 'direct') === source).length;
                                const percentage = Math.round((count / (events?.length || 1)) * 100);
                                return (
                                    <div key={source} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="capitalize">{source}</span>
                                            <span>{count} events</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="card-elevated border-none overflow-hidden">
                <CardHeader className="border-b bg-muted/10">
                    <CardTitle>Marketing Event Log</CardTitle>
                    <CardDescription>Raw stream of all captured marketing data.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Campaign</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {events?.map((event: any) => (
                                <tr key={event.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="text-[10px] font-mono">
                                            {event.event}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{event.email || "—"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs">{event.utmSource || event.source || "—"}</span>
                                            <span className="text-[10px] text-muted-foreground">{event.utmMedium || "—"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {event.utmCampaign || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {new Date(event.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                        Showing {events?.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalEvents || 0)} of {totalEvents || 0} events
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-8 text-xs"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-medium px-2 text-muted-foreground">
                                Page <span className="text-foreground">{page}</span> of {totalPages || 1}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                            disabled={page >= (totalPages || 1)}
                            className="h-8 text-xs"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function AdvisorManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: advisors, isLoading } = useQuery({
        queryKey: ["admin", "advisors"],
        queryFn: () => api.advisors.adminList()
    });
    const verifyMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'VERIFIED' | 'REJECTED' }) =>
            api.advisors.adminVerify(id, status),
        onSuccess: () => {
            toast({ title: "Advisor Updated" });
            queryClient.invalidateQueries({ queryKey: ["admin", "advisors"] });
        }
    });

    return (
        <Card className="card-elevated border-none overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle>Advisor Verification Queue</CardTitle>
                <CardDescription>Review and verify professional credentials of advisor marketplace applicants.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="px-6 py-4">Advisor</th>
                            <th className="px-6 py-4">Expertise</th>
                            <th className="px-6 py-4">License</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">Loading advisors...</td>
                            </tr>
                        ) : advisors?.map((advisor: any) => (
                            <tr key={advisor.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                            {advisor.profileImage ? (
                                                <img src={advisor.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{advisor.user.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{advisor.user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {advisor.expertise.map((e: string) => (
                                            <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono">{advisor.licenseNumber}</span>
                                        {advisor.licenseDocument && (
                                            <a href={advisor.licenseDocument} target="_blank" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                                View Document <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={advisor.verificationStatus === 'VERIFIED' ? 'default' : (advisor.verificationStatus === 'REJECTED' ? 'destructive' : 'secondary')} className="text-[10px]">
                                        {advisor.verificationStatus}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                                            onClick={() => verifyMutation.mutate({ id: advisor.id, status: 'VERIFIED' })}
                                            disabled={advisor.verificationStatus === 'VERIFIED' || verifyMutation.isPending}
                                        >
                                            Verify
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="h-8"
                                            onClick={() => verifyMutation.mutate({ id: advisor.id, status: 'REJECTED' })}
                                            disabled={advisor.verificationStatus === 'REJECTED' || verifyMutation.isPending}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
