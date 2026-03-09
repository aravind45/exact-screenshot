import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, DollarSign, Upload, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function AdvisorOnboarding() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        bio: '',
        expertise: [] as string[],
        hourlyRate: '',
        licenseNumber: '',
        yearsExperience: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleExpertiseToggle = (area: string) => {
        setFormData(prev => {
            const current = prev.expertise;
            if (current.includes(area)) {
                return { ...prev, expertise: current.filter(a => a !== area) };
            } else {
                if (current.length >= 5) return prev; // Max 5
                return { ...prev, expertise: [...current, area] };
            }
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.marketplace.upsertMyProfile({
                bio: formData.bio,
                specialties: formData.expertise,
                hourlyRate: Number(formData.hourlyRate) || 0,
                licenseNumber: formData.licenseNumber,
            });
            await api.marketplace.submitForReview();

            toast({
                title: "Profile Submitted",
                description: "Your advisor profile has been submitted for admin review."
            });

            navigate('/advisor/dashboard');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Professional Bio</Label>
                <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell clients about your background and approach..."
                    className="h-32"
                />
                <p className="text-xs text-slate-500">Min 100 characters recommended.</p>
            </div>

            <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input
                    type="number"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    placeholder="e.g. 8"
                />
            </div>

            <div className="space-y-2">
                <Label>License / Bar Number</Label>
                <Input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="Required for verification"
                />
            </div>

            <Button onClick={() => setStep(2)} className="w-full">Continue</Button>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label>Areas of Expertise (Select up to 5)</Label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        'Probate Law', 'Tax Planning', 'Real Estate', 'Accounting',
                        'Estate Litigation', 'Trust Administration', 'Mediation',
                        'Asset Appraisal', 'Financial Planning'
                    ].map((area) => (
                        <div
                            key={area}
                            onClick={() => handleExpertiseToggle(area)}
                            className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${formData.expertise.includes(area)
                                    ? 'bg-primary/5 border-primary text-primary font-medium'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
              `}
                        >
                            <div className="flex items-center gap-2">
                                {formData.expertise.includes(area) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                                <span className="text-sm">{area}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleInputChange}
                        className="pl-9"
                        placeholder="250"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                    {loading ? 'Creating Profile...' : 'Complete Setup'}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-4 shadow-lg shadow-primary/25">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-['Outfit'] font-bold text-slate-900">Advisor Profile</h1>
                    <p className="text-slate-500 mt-2">Let's set up your professional presence on ExpectedEstate.</p>
                </div>

                <Card className="border-0 shadow-xl shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle>{step === 1 ? 'Professional Details' : 'Expertise & Rates'}</CardTitle>
                        <CardDescription>Step {step} of 2</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 ? renderStep1() : renderStep2()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
