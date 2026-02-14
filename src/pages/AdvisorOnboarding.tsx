import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Upload,
    ShieldCheck,
    Clock,
    CreditCard,
    ArrowRight,
    Loader2,
    Banknote,
    ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function AdvisorOnboarding() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [stripeLoading, setStripeLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        bio: '',
        expertise: '',
        hourlyRate: '',
        licenseNumber: '',
        profileImage: '',
        licenseDocument: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    // Fetch advisor profile and stripe status
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['advisor-profile'],
        queryFn: async () => {
            const data = await api.advisors.getMe();
            if (data?.profileImage) setImagePreview(data.profileImage);
            return data;
        },
        retry: false
    });

    const { data: stripeStatus, isLoading: isStripeLoading } = useQuery({
        queryKey: ['stripe-status'],
        queryFn: () => api.advisors.getStripeStatus(),
        retry: 2
    });

    // Mutations
    const profileMutation = useMutation({
        mutationFn: (data: any) => api.advisors.updateProfile(data),
        onSuccess: async () => {
            await refreshUser();
            queryClient.invalidateQueries({ queryKey: ['advisor-profile'] });
            toast.success("Profile updated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update profile");
        }
    });

    const handleStartStripe = async () => {
        setStripeLoading(true);
        try {
            const returnUrl = `${window.location.origin}/advisor/onboarding?success=true`;
            const refreshUrl = `${window.location.origin}/advisor/onboarding?refresh=true`;

            const { url } = await api.advisors.startStripeOnboarding({
                returnUrl,
                refreshUrl
            });

            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No onboarding URL returned");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start Stripe onboarding");
            setStripeLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setFormData(prev => ({ ...prev, profileImage: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDocumentFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, licenseDocument: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitProfile = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct payload with fallbacks and basic validation
        const payload = {
            bio: formData.bio || profile?.bio || '',
            expertise: (formData.expertise || profile?.expertise?.join(', ') || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            hourlyRate: parseFloat(formData.hourlyRate) || parseFloat(profile?.hourlyRate) || 0,
            licenseNumber: formData.licenseNumber || profile?.licenseNumber || '',
            profileImage: formData.profileImage || profile?.profileImage || '',
            licenseDocument: formData.licenseDocument || profile?.licenseDocument || '',
        };

        profileMutation.mutate(payload);
    };

    if (isProfileLoading || isStripeLoading) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading onboarding journey...</p>
            </div>
        );
    }

    const isStripeComplete = stripeStatus?.stripeOnboardingComplete;
    const isStripeDetailsSubmitted = stripeStatus?.stripeDetailsSubmitted;
    const isVerified = profile?.verificationStatus === 'VERIFIED';
    const isPending = profile?.verificationStatus === 'PENDING';

    return (
        <div className="container mx-auto py-12 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        Advisor Onboarding
                        {isVerified && <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1">Verified</Badge>}
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Complete these steps to start accepting consultations on the marketplace.
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/")} className="text-slate-500 bg-white">
                    Cancel & Exit
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Step 1: Professional Profile */}
                    <Card className="relative transition-all duration-300 border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                                            isVerified ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                                        )}>
                                            1
                                        </div>
                                        <CardTitle className="text-xl">Marketplace Profile</CardTitle>
                                    </div>
                                    <CardDescription className="pl-13">
                                        Start by setting up your professional profile and expertise.
                                    </CardDescription>
                                </div>
                                {isVerified && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleSubmitProfile} className="space-y-8">
                                <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-slate-300" />
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 bg-indigo-600 hover:bg-indigo-700 shadow-md"
                                            onClick={() => document.getElementById('profile-upload')?.click()}
                                        >
                                            <Upload className="w-3 h-3 text-white" />
                                        </Button>
                                        <input
                                            id="profile-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1 text-center md:text-left">
                                        <h4 className="font-bold text-slate-900 text-sm">Profile Picture</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            A professional photo helps build trust.<br />
                                            JPG, PNG, or GIF. Max 2MB.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="font-bold text-slate-700">Professional Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Experience with probate, tax planning, etc..."
                                        defaultValue={profile?.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="min-h-[100px] bg-slate-50/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="expertise" className="font-bold text-slate-700">Expertise (comma separated)</Label>
                                        <Input
                                            id="expertise"
                                            placeholder="Tax, Trusts, Real Estate"
                                            defaultValue={profile?.expertise?.join(', ')}
                                            onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                                            className="bg-slate-50/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hourlyRate" className="font-bold text-slate-700">Hourly Rate ($)</Label>
                                        <Input
                                            id="hourlyRate"
                                            type="number"
                                            placeholder="150"
                                            defaultValue={profile?.hourlyRate}
                                            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                            className="bg-slate-50/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                                    <Label className="font-bold text-slate-700">Professional Verification</Label>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="License Number (e.g. Bar ID)"
                                            className="bg-white"
                                            defaultValue={profile?.licenseNumber}
                                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        />
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="bg-white whitespace-nowrap flex-1"
                                                onClick={() => document.getElementById('license-upload')?.click()}
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                {documentFile ? 'Change Document' : 'Upload Document'}
                                            </Button>
                                            <input
                                                id="license-upload"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={handleDocumentChange}
                                            />
                                            {documentFile && (
                                                <span className="text-xs text-slate-600 truncate max-w-[200px]">
                                                    {documentFile.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">Verification ensures marketplace integrity. Submitted documents are encrypted.</p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-black text-white font-bold h-11"
                                    disabled={profileMutation.isPending}
                                >
                                    {profileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Save Profile Details
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Final Completion Action */}
                    {isVerified && (
                        <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-50">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-emerald-900">Registration Complete!</h3>
                                <p className="text-emerald-700">You are now a verified ExpectedEstate Advisor. Ready to accept clients?</p>
                            </div>
                            <Button
                                onClick={() => navigate('/advisor/dashboard')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 h-14 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                            >
                                Go to Dashboard
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
