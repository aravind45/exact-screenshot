import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ArrowLeft, Save, User, UserCircle, Briefcase, MapPin, Mail, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

export default function ProfileSettings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        fullName: "",
        state: "",
        role: "",
    });

    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => api.getProfile(),
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.fullName || "",
                state: profile.state || "",
                role: profile.role || "EXECUTOR",
            });
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateProfile(data),
        onSuccess: () => {
            toast({ title: "Profile Updated", description: "Your settings have been saved." });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: "Update Failed", description: err.message });
        },
    });

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (isLoading) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="section-container">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <h1 className="font-bold text-lg">My Profile</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="section-container py-8 max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="card-elevated border-none">
                            <CardContent className="pt-6 text-center">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserCircle className="w-16 h-16 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold">{formData.fullName || "User Name"}</h2>
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                                    <Mail className="w-3 h-3" />
                                    {profile?.email}
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                        {formData.role}
                                    </div>
                                    {formData.role === "ADMIN" && (
                                        <div className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" />
                                            Administrator
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="card-elevated p-5 space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Account Overview</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Joined</span>
                                    <span>{new Date(profile?.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Location</span>
                                    <span>{formData.state || "Not set"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="card-elevated border-none">
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your name and primary location for legal document generation.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="fullName"
                                                    className="pl-9"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State of Residence</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                                <Select
                                                    value={formData.state}
                                                    onValueChange={(val) => setFormData({ ...formData, state: val })}
                                                >
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select State" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {US_STATES.map((state) => (
                                                            <SelectItem key={state} value={state}>
                                                                {state}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Your Primary Role</Label>
                                        <CardDescription className="mb-2">Choose the role that best describes your relationship to the estate.</CardDescription>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setFormData({ ...formData, role: "EXECUTOR" })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.role === "EXECUTOR"
                                                        ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                                                        : "border-border hover:border-border-hover bg-card"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <User className={`w-5 h-5 ${formData.role === "EXECUTOR" ? "text-primary" : "text-muted-foreground"}`} />
                                                    <span className="font-bold">Executor / Heir</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Personal representative of the estate handling settlement for a loved one.
                                                </p>
                                            </button>

                                            <button
                                                onClick={() => setFormData({ ...formData, role: "ATTORNEY" })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.role === "ATTORNEY"
                                                        ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                                                        : "border-border hover:border-border-hover bg-card"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Briefcase className={`w-5 h-5 ${formData.role === "ATTORNEY" ? "text-primary" : "text-muted-foreground"}`} />
                                                    <span className="font-bold">Legal Professional</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Attorney, Paralegal, or Professional Fiduciary managing multiple estates.
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t flex justify-end">
                                        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Profile Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {profile?.role === "ADMIN" && (
                            <Card className="border-amber-500/20 bg-amber-500/5">
                                <CardHeader>
                                    <CardTitle className="text-amber-800 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5" />
                                        Admin Actions
                                    </CardTitle>
                                    <CardDescription className="text-amber-700/70">
                                        You have administrative access to the platform.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        variant="outline"
                                        className="border-amber-200 text-amber-700 hover:bg-amber-100"
                                        onClick={() => navigate("/admin")}
                                    >
                                        Open Admin Dashboard
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
