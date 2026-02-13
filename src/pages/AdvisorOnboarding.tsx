import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileText, Upload, ShieldCheck, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function AdvisorOnboarding() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        bio: '',
        expertise: '',
        hourlyRate: '',
        licenseNumber: '',
        profileImage: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['advisor-profile'],
        queryFn: async () => {
            const res = await fetch('/api/advisors/me');
            if (res.status === 404) return null;
            const data = await res.json();
            if (data?.profileImage) setImagePreview(data.profileImage);
            return data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/advisors/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advisor-profile'] });
            toast.success("Profile updated successfully!");
        }
    });

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            ...formData,
            bio: formData.bio || profile?.bio,
            expertise: (formData.expertise || profile?.expertise?.join(', ') || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            hourlyRate: parseFloat(formData.hourlyRate) || parseFloat(profile?.hourlyRate),
            licenseNumber: formData.licenseNumber || profile?.licenseNumber,
            profileImage: formData.profileImage || profile?.profileImage,
            // In a real app, we'd upload the file to S3 first and pass the URL
            licenseDocument: file ? 'https://placeholder-url.com/doc.pdf' : profile?.licenseDocument
        });
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground"><Clock className="w-8 h-8 animate-spin mx-auto mb-2" />Loading profile...</div>;

    const isVerified = profile?.verificationStatus === 'VERIFIED';
    const isPending = profile?.verificationStatus === 'PENDING';

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <div className="mb-8 flex justify-between items-start">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        Advisor Onboarding
                        {isVerified && <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>}
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Join our marketplace and help estates navigate their settlement process.
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/")} className="text-slate-500 bg-white shadow-sm border-slate-200">
                    Cancel & Exit
                </Button>
            </div>

            {(isPending || !profile) && (
                <Alert className="mb-8 border-amber-200 bg-amber-50">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-bold">Verification Required</AlertTitle>
                    <AlertDescription className="text-amber-700">
                        {isPending
                            ? "Your application is currently under review by our team. This usually takes 24-48 hours."
                            : "To protect our users, all advisors must undergo identity and professional license verification."}
                    </AlertDescription>
                </Alert>
            )}

            {isVerified && (
                <Alert className="mb-8 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 font-bold">You are Verified!</AlertTitle>
                    <AlertDescription className="text-green-700">
                        Your profile is now live on the marketplace. You can now accept bookings and help users.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="shadow-xl border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-2xl font-bold">Advisor Profile Settings</CardTitle>
                        <CardDescription>Set up your expertise and rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                        {/* Profile Image Section */}
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
                                    <Upload className="w-4 h-4 text-white" />
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
                                <h4 className="font-bold text-slate-900">Profile Picture</h4>
                                <p className="text-sm text-slate-500">
                                    A professional photo helps build trust with potential clients.
                                    JPG, PNG, or GIF. Max 2MB.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Tell users about your experience with estate settlement..."
                                defaultValue={profile?.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="min-h-[120px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="expertise">Expertise (comma separated)</Label>
                                <Input
                                    id="expertise"
                                    name="expertise"
                                    placeholder="Probate, Tax, Real Estate, Trusts"
                                    defaultValue={profile?.expertise?.join(', ')}
                                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                                <Input
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    type="number"
                                    placeholder="150"
                                    defaultValue={profile?.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Professional License Verification</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    id="licenseNumber"
                                    name="licenseNumber"
                                    placeholder="License Number (e.g. Bar ID #12345)"
                                    defaultValue={profile?.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    required
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full flex items-center gap-2"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <Upload className="w-4 h-4" />
                                        {file ? file.name : "Upload License Document"}
                                    </Button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Supported formats: PDF, JPG, PNG. Max size 5MB.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 py-6 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <ShieldCheck className="w-4 h-4" />
                            Secure verification process
                        </div>
                        <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-200"
                            disabled={mutation.isPending}
                        >
                            {profile ? "Update Profile" : "Submit for Verification"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <div className="mt-12 space-y-4">
                <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
                    <div className="space-y-2">
                        <p className="font-bold text-slate-900">How do I get paid?</p>
                        <p>Payments are held in escrow for 90 days after service completion. They are automatically transferred to your linked Stripe account after the waiting period.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-slate-900">What are the platform fees?</p>
                        <p>ExpectedEstate takes a 20% platform fee from each transaction to cover infrastructure, marketing, and support costs.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
