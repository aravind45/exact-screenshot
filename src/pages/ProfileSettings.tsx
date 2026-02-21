import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
import { ArrowLeft, Save, User, UserCircle, Briefcase, MapPin, Mail, Loader2, ShieldCheck, Share2, Copy, Check, CreditCard, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { US_STATES } from "@/lib/states";
import { determinePath, UserAnswers } from "@/lib/pathEngine";
import { Scale, Clock, AlertTriangle, HelpCircle, FileCheck, Landmark, Shield } from "lucide-react";

export default function ProfileSettings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: estate, isLoading: isEstateLoading } = useQuery({
        queryKey: ["my-estate"],
        queryFn: () => api.getMyEstate(),
    });
    const [formData, setFormData] = useState({
        fullName: "",
        state: "",
        role: "",
        personalEmail: "",
    });
    const [portalLoading, setPortalLoading] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => api.getProfile(),
    });

    const { data: billingStatus } = useQuery({
        queryKey: ["billing-status"],
        queryFn: () => api.billing.getStatus(),
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.fullName || "",
                state: profile.state || "",
                role: profile.role || "EXECUTOR",
                personalEmail: profile.personalEmail || "",
                address: profile.address || "",
                city: profile.city || "",
                zip: profile.zip || "",
                country: profile.country || "",
                phoneNumber: profile.phoneNumber || "",
            } as any);
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

    const handleManageBilling = async () => {
        setPortalLoading(true);
        try {
            const { url } = await api.billing.createPortalSession();
            window.location.href = url;
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Portal Failed",
                description: error.message || "Unable to open billing portal"
            });
        } finally {
            setPortalLoading(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-background">
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
                                    {profile?.lastLoginAt && (
                                        <div className="pt-2 mt-2 border-t border-dashed">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    <span>Last Login</span>
                                                </div>
                                                <span className="text-muted-foreground font-mono bg-muted px-1 rounded">
                                                    {new Date(profile.lastLoginAt).toLocaleString()}
                                                </span>
                                            </div>
                                            {profile.lastIp && (
                                                <div className="flex items-center justify-between text-xs mt-1">
                                                    <span className="text-muted-foreground ml-4">IP Address</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">{profile.lastIp}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                                                <SelectItem key={state.abbr} value={state.name}>
                                                                    {state.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="font-semibold text-sm text-foreground">Contact Details</h3>

                                            <div className="space-y-2">
                                                <Label htmlFor="address">Street Address</Label>
                                                <Input
                                                    id="address"
                                                    value={(formData as any).address || ""}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value } as any)}
                                                    placeholder="123 Main St"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="col-span-1 md:col-span-2 space-y-2">
                                                    <Label htmlFor="city">City</Label>
                                                    <Input
                                                        id="city"
                                                        value={(formData as any).city || ""}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value } as any)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="zip">Zip Code</Label>
                                                    <Input
                                                        id="zip"
                                                        value={(formData as any).zip || ""}
                                                        onChange={(e) => setFormData({ ...formData, zip: e.target.value } as any)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="country">Country</Label>
                                                    <Input
                                                        id="country"
                                                        value={(formData as any).country || "USA"}
                                                        onChange={(e) => setFormData({ ...formData, country: e.target.value } as any)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                                <Input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    value={(formData as any).phoneNumber || ""}
                                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value } as any)}
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="personalEmail">Personal Email (for CC)</Label>
                                            <CardDescription className="mb-2">This email will be CC'd on all institutional correspondence for your records.</CardDescription>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="personalEmail"
                                                    type="email"
                                                    className="pl-9"
                                                    placeholder="your.email@example.com"
                                                    value={formData.personalEmail}
                                                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                                                />
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

                            {/* Estate Case Configuration Section */}
                            {!isEstateLoading && estate && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    <Card className="card-elevated border-none overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-5">
                                            <Scale className="w-24 h-24 text-primary -rotate-12" />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Shield className="w-5 h-5 text-primary" />
                                                Estate Case Configuration
                                            </CardTitle>
                                            <CardDescription>
                                                The signals below drive your unique settlement roadmap and legal requirements.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <SignalCard
                                                    icon={<FileCheck className="w-4 h-4" />}
                                                    label="Will"
                                                    value={estate.hasWill ? "Present" : "None Found"}
                                                    active={estate.hasWill}
                                                />
                                                <SignalCard
                                                    icon={<Landmark className="w-4 h-4" />}
                                                    label="Trust"
                                                    value={estate.isTrustRevocable !== null ? (estate.isTrustRevocable ? "Living Trust" : "Irrevocable") : "None"}
                                                    active={estate.isTrustRevocable !== null}
                                                />
                                                <SignalCard
                                                    icon={<UserCircle className="w-4 h-4" />}
                                                    label="Spouse"
                                                    value={estate.isSurvivingSpouse ? "Yes" : "No"}
                                                    active={estate.isSurvivingSpouse}
                                                />
                                                <SignalCard
                                                    icon={<MapPin className="w-4 h-4" />}
                                                    label="Ancillary"
                                                    value={estate.hasOutOfStateProperty ? "Multi-State" : "Single State"}
                                                    active={estate.hasOutOfStateProperty}
                                                />
                                                <SignalCard
                                                    icon={<AlertTriangle className="w-4 h-4" />}
                                                    label="Debt Risk"
                                                    value={(Number(estate.estimatedLiabilities || 0) > Number(estate.estimatedPersonalProperty || 0)) ? "High Risk" : "Normal"}
                                                    variant={(Number(estate.estimatedLiabilities || 0) > Number(estate.estimatedPersonalProperty || 0)) ? "danger" : "default"}
                                                    active={(Number(estate.estimatedLiabilities || 0) > Number(estate.estimatedPersonalProperty || 0))}
                                                />
                                                <SignalCard
                                                    icon={<Scale className="w-4 h-4" />}
                                                    label="Contest"
                                                    value={estate.hasContest ? "Disputed" : "No Conflict"}
                                                    variant={estate.hasContest ? "danger" : "default"}
                                                    active={estate.hasContest}
                                                />
                                                <SignalCard
                                                    icon={<FileCheck className="w-4 h-4" />}
                                                    label="TOD Deed"
                                                    value={estate.hasTODDeed ? "Active" : "None"}
                                                    active={estate.hasTODDeed}
                                                />
                                                <SignalCard
                                                    icon={<AlertTriangle className="w-4 h-4" />}
                                                    label="Heirs"
                                                    value={estate.hasUnknownHeirs ? "Unknown" : "Verified"}
                                                    active={!estate.hasUnknownHeirs}
                                                />
                                            </div>

                                            {(() => {
                                                const userAnswers: UserAnswers = {
                                                    hasWill: estate.hasWill ? 'yes' : 'no',
                                                    hasTrust: estate.isTrustRevocable !== null ? 'yes' : 'no',
                                                    trustType: estate.isTrustRevocable === true ? 'revocable' :
                                                        estate.isTrustRevocable === false ? 'irrevocable' : 'none',
                                                    hasTODDeed: estate.hasTODDeed ? 'yes' : 'no',
                                                    hasContest: estate.hasContest ? 'yes' : 'no',
                                                    isOutOfState: estate.hasOutOfStateProperty ? 'yes' : 'no',
                                                    isSpouse: estate.isSurvivingSpouse ? 'yes' : 'no',
                                                    debtStatus: (Number(estate.estimatedLiabilities || 0) > Number(estate.estimatedPersonalProperty || 0)) ? 'insolvent' : 'solvent'
                                                };
                                                const pathResult = determinePath(userAnswers, estate.deceasedState || "CA");

                                                return (
                                                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Recommended Settlement Path</p>
                                                            <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                                                                <Scale className="w-5 h-5" />
                                                                {pathResult.pathLabel}
                                                            </h4>
                                                            <div className="flex flex-wrap gap-4 mt-2">
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded-md border">
                                                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                                    Est. {pathResult.timeline}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded-md border">
                                                                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                                                                    {pathResult.complexity} Complexity
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate("/onboarding?step=1")}
                                                            className="border-primary/20 text-primary hover:bg-primary/5 font-bold h-10 px-6 rounded-xl"
                                                        >
                                                            Refine Situation
                                                        </Button>
                                                    </div>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <Card className="card-elevated border-none overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <CreditCard className="w-20 h-20 text-primary -rotate-12" />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-primary" />
                                            Billing & Subscription
                                        </CardTitle>
                                        <CardDescription>
                                            Manage your payment methods, view invoices, and update your subscription details.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-6 font-sans">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Plan</p>
                                                    <p className="font-bold text-foreground">{billingStatus?.planName || profile?.subscriptionPlan || "Executor Pro Plan"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                                                    <p className={cn("font-bold capitalize",
                                                        billingStatus?.status === 'active' ? "text-emerald-600" : "text-amber-600"
                                                    )}>
                                                        {billingStatus?.status || profile?.subscriptionStatus || "Active"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 gap-2 font-bold border-2"
                                            onClick={handleManageBilling}
                                            disabled={portalLoading}
                                        >
                                            {portalLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Manage Billing via Stripe
                                                    <ExternalLink className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="border-indigo-100 bg-indigo-50/20 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Share2 className="w-24 h-24 text-indigo-600 rotate-12" />
                                    </div>
                                    <CardHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                                <Share2 className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-indigo-900">Refer a Friend</CardTitle>
                                        </div>
                                        <CardDescription className="text-indigo-700/70 max-w-md">
                                            Know someone else navigating the probate process? Share ExpectedEstate to help them simplify their estate settlement protocol.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white border border-indigo-100 rounded-xl h-11 flex items-center px-4 font-mono text-[10px] text-indigo-900/60 overflow-hidden select-all">
                                                {window.location.origin}/join?ref={profile?.id?.substring(0, 8)}
                                            </div>
                                            <ReferralCopyButton referralLink={`${window.location.origin}/join?ref=${profile?.id?.substring(0, 8)}`} />
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                            Empowering heirs through forensic diligence
                                        </p>
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
        </div>
    );
}

function SignalCard({ icon, label, value, active, variant = "default" }: {
    icon: React.ReactNode,
    label: string,
    value: string,
    active: boolean,
    variant?: "default" | "danger"
}) {
    return (
        <div className={cn(
            "p-3 rounded-xl border flex flex-col gap-1 transition-all",
            active
                ? (variant === "danger" ? "bg-rose-50 border-rose-100 ring-4 ring-rose-50/50" : "bg-primary/5 border-primary/10 ring-4 ring-primary/5")
                : "bg-muted/30 border-border/50 grayscale opacity-70"
        )}>
            <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center mb-1",
                active
                    ? (variant === "danger" ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary")
                    : "bg-muted text-muted-foreground"
            )}>
                {icon}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={cn(
                "text-xs font-bold leading-none truncate",
                active ? (variant === "danger" ? "text-rose-700" : "text-primary") : "text-muted-foreground"
            )}>{value}</p>
        </div>
    );
}

function ReferralCopyButton({ referralLink }: { referralLink: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            onClick={handleCopy}
            className={cn(
                "rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest transition-all",
                copied ? "bg-emerald-600 hover:bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
            )}
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 mr-2" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copy Link
                </>
            )}
        </Button>
    );
}
