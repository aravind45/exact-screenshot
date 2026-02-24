import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Shield, Clock, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PilotAccessForm } from '@/components/PilotAccessForm';
import { useAuth } from '@/contexts/AuthContext';

const LandingTexasLawyer = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            const { user, error } = await signIn(loginData.email, loginData.password);
            if (error) {
                toast.error('Login Failed', {
                    description: error.message || 'Invalid credentials. Please try again.'
                });
            } else {
                toast.success('Welcome back!', {
                    description: 'Redirecting to your dashboard...'
                });
                navigate('/dashboard');
            }
        } catch (error: any) {
            toast.error('Login Failed', {
                description: error.message || 'Invalid credentials. Please try again.'
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation Bar */}
            <nav className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Scale className="w-6 h-6 text-amber-500" />
                        <span className="font-serif font-bold text-lg">ExpectedEstate</span>
                        <span className="text-slate-400 text-sm ml-2">Texas Edition</span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                        onClick={() => setIsLoginOpen(!isLoginOpen)}
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        Pilot Login
                    </Button>
                </div>
            </nav>

            {/* Login Dropdown */}
            {isLoginOpen && (
                <div className="bg-slate-800 text-white px-6 py-6 border-b border-slate-700">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-semibold mb-4 text-center">Pilot User Login</h3>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    required
                                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    required
                                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                        <p className="text-center text-slate-400 text-sm mt-4">
                            Don't have pilot access?{' '}
                            <a href="#request-access" className="text-amber-500 hover:underline" onClick={() => setIsLoginOpen(false)}>
                                Request access
                            </a>
                        </p>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <header className="bg-slate-900 text-white py-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
                        Texas Probate Workflow OS
                        <span className="block text-amber-500 mt-2">Built for Estate Attorneys</span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                        Standardize Independent, Dependent, and Small Estate Administration with structured
                        case tracking, deadline control, and client status reporting.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-6 text-lg" asChild>
                            <a href="#request-access">Request Pilot Access</a>
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg" onClick={() => setIsLoginOpen(true)}>
                            <LogIn className="w-5 h-5 mr-2" />
                            Pilot User Sign In
                        </Button>
                    </div>
                    <p className="mt-8 text-amber-400 font-medium animate-pulse">
                        Limited Texas firm pilot. Invite only.
                    </p>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-center text-slate-900 mb-16">
                    A Unified System for Texas Probate Firms
                </h2>
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-sky-100 text-sky-900 rounded-lg flex items-center justify-center mb-6">
                            <Scale className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Statutory Deadline Control</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Roadmaps mapped to Texas Estates Code. Automate notices, inventory deadlines, and creditor periods.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-lg flex items-center justify-center mb-6">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Client Status Reporting</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Generate one-click progress reports for heirs and clients. Show value through transparency.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-center mb-6">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Firm Efficiency</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Standardize workflows across your team. Scale your probate practice without adding headcount.
                        </p>
                    </div>
                </div>
            </section>

            {/* Request Pilot Access Section */}
            <section id="request-access" className="bg-slate-50 py-24 px-6">
                <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-4 text-slate-900">
                        Request Pilot Access
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Join a limited group of Texas firms selected for our validation sprint.
                    </p>
                    <PilotAccessForm />
                </div>
            </section>

            {/* Existing User Login Section */}
            <section className="bg-slate-100 py-16 px-6">
                <div className="max-w-md mx-auto text-center">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        Already have pilot access?
                    </h3>
                    <Button
                        size="lg"
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8"
                        onClick={() => setIsLoginOpen(true)}
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In to Dashboard
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm">
                    <p>© 2026 Expected Estate - Texas Lawyer Edition. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link to="/terms" className="hover:text-slate-600">Terms</Link>
                        <Link to="/privacy" className="hover:text-slate-600">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingTexasLawyer;