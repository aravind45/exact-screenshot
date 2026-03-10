import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Landmark, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'success' | 'error' | 'verifying'>('verifying');
    const [message, setMessage] = useState('');
    const { refreshUser, user } = useAuth();
    const navigate = useNavigate();

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        async function verify() {
            if (!email || !token) {
                setStatus('error');
                setMessage('Missing verification link details.');
                setLoading(false);
                return;
            }

            try {
                await api.verifyEmail({ email, token });
                setStatus('success');
                setMessage('Your email has been verified successfully.');
                // Refresh user state to update emailVerifiedAt
                await refreshUser();
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Failed to verify email. The link may be invalid or expired.');
            } finally {
                setLoading(false);
            }
        }

        verify();
    }, [email, token]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <SEO
                title="Verify Email"
                description="Email verification flow for ExpectedEstate accounts."
                canonical="https://www.expectedestate.com/verify-email"
                noindex
            />
            <div className="w-full max-w-[440px]">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Landmark className="w-6 h-6" />
                        </div>
                        <span className="font-['Outfit'] font-black text-2xl text-slate-900 tracking-tighter">ExpectedEstate</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/60 border border-slate-100"
                >
                    <div className="text-center">
                        {status === 'verifying' ? (
                            <div className="flex flex-col items-center py-4">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                                <h1 className="text-2xl font-['Outfit'] font-black text-slate-900 mb-2">Verifying Email</h1>
                                <p className="text-slate-500 font-medium">Please wait while we secure your account...</p>
                            </div>
                        ) : status === 'success' ? (
                            <div data-testid="verify-email-success" className="flex flex-col items-center py-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h1 className="text-2xl font-['Outfit'] font-black text-slate-900 mb-2">Email Verified!</h1>
                                <p className="text-slate-500 font-medium mb-8">
                                    {message}
                                </p>
                                <Button
                                    onClick={() => navigate(user ? '/dashboard' : '/auth')}
                                    className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold"
                                >
                                    {user ? 'Go to Dashboard' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-4">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                                    <XCircle className="w-10 h-10" />
                                </div>
                                <h1 className="text-2xl font-['Outfit'] font-black text-slate-900 mb-2">Verification Failed</h1>
                                <p className="text-slate-500 font-medium mb-8">
                                    {message}
                                </p>
                                <Button
                                    onClick={() => navigate('/auth')}
                                    variant="outline"
                                    className="w-full h-12 rounded-2xl border-2 font-bold"
                                >
                                    Return to Sign In
                                </Button>
                                {user && !user.emailVerifiedAt && (
                                    <p className="mt-6 text-sm text-slate-400">
                                        You can request a new link from your dashboard.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                <p className="text-center mt-12 text-xs font-black uppercase tracking-widest text-slate-400">
                    Secure Fiduciary Access Control
                </p>
            </div>
        </div>
    );
}

