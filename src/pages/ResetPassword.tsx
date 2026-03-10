import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { SEO } from '@/components/SEO';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (!token || !email) {
            toast({
                title: 'Invalid Link',
                description: 'This password reset link is invalid or expired.',
                variant: 'destructive',
            });
            navigate('/auth');
        }
    }, [token, email, navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const result = passwordSchema.safeParse(password);
        if (!result.success) {
            setError(result.error.errors[0].message);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.resetPassword({ email, token, newPassword: password });
            setSuccess(true);
            toast({
                title: 'Password Reset',
                description: 'Your password has been successfully reset.',
            });
            setTimeout(() => navigate('/auth'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
                <SEO
                    title="Reset Password"
                    description="Reset your ExpectedEstate password."
                    canonical="https://www.expectedestate.com/reset-password"
                    noindex
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md card-elevated p-8 text-center"
                >
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Password Updated</h1>
                    <p className="text-muted-foreground mb-8">
                        Your password has been reset successfully. You will be redirected to the sign-in page in a few seconds.
                    </p>
                    <Button onClick={() => navigate('/auth')} className="w-full">
                        Sign In Now
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex flex-col">
            <SEO
                title="Reset Password"
                description="Reset your ExpectedEstate password."
                canonical="https://www.expectedestate.com/reset-password"
                noindex
            />
            <header className="p-6">
                <div className="inline-flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                        <Heart className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-foreground">ExpectedEstate</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="card-elevated p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-foreground mb-2">Create new password</h1>
                            <p className="text-muted-foreground">Please choose a secure new password.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive font-medium">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        Reset Password
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

