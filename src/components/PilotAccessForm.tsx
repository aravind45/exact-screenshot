import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const PilotAccessForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firmName: '',
        attorneyName: '',
        email: '',
        casesPerYear: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/marketing/pilot-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: 'pilot_request',
                    email: formData.email,
                    metadata: formData,
                }),
            });

            if (!response.ok) throw new Error('Submission failed');

            toast.success('Request Received!', {
                description: "Our team will contact you shortly to provision your account.",
            });

            setFormData({
                firmName: '',
                attorneyName: '',
                email: '',
                casesPerYear: '',
            });
        } catch (error) {
            toast.error('Submission Failed', {
                description: "Please try again or contact support at support@expectedestate.com",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name</Label>
                <Input
                    id="firmName"
                    placeholder="e.g. Austin Probate Law Group"
                    value={formData.firmName}
                    onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="attorneyName">Attorney Name</Label>
                <Input
                    id="attorneyName"
                    placeholder="e.g. Sarah Jennings, J.D."
                    value={formData.attorneyName}
                    onChange={(e) => setFormData({ ...formData, attorneyName: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="sarah@yourfirm.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="casesPerYear">Average Probate Cases Per Year</Label>
                <Input
                    id="casesPerYear"
                    placeholder="e.g. 20-50"
                    value={formData.casesPerYear}
                    onChange={(e) => setFormData({ ...formData, casesPerYear: e.target.value })}
                    required
                />
            </div>

            <Button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-6 text-lg hover:bg-slate-800"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    'Request Pilot Access'
                )}
            </Button>
        </form>
    );
};

export default PilotAccessForm;
