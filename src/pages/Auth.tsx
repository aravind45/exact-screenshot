import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, ArrowRight, Loader2, ShieldCheck, Clock, FileCheck, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTracking } from '@/hooks/useTracking';
import { useEffect } from 'react';

// Validation schemas
const emailSchema = z.string().trim().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().trim().min(1, 'Name is required').max(100, 'Name is too long');

export default function Auth() {
  const [searchParams] = useSearchParams();
  const buyMode = searchParams.get('mode') === 'buy';
  const signupMode = searchParams.get('mode') === 'signup';
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>(signupMode ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent('intake_started');
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (authMode !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (authMode === 'signup') {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Invalid credentials',
              description: 'Please check your email and password and try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign in failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
          const redirect = sessionStorage.getItem("after_login_redirect");
          if (redirect) {
            sessionStorage.removeItem("after_login_redirect");
            navigate(redirect);
          } else {
            navigate(buyMode ? '/pricing?mode=buy' : '/dashboard');
          }
        }
      } else if (authMode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to ExpectedEstate. Let\'s get started.',
          });
          const redirect = sessionStorage.getItem("after_login_redirect");
          if (redirect) {
            sessionStorage.removeItem("after_login_redirect");
            navigate(redirect);
          } else {
            navigate(buyMode ? '/pricing?mode=buy' : '/onboarding');
          }
        }
      } else if (authMode === 'forgot-password') {
        try {
          await api.forgotPassword(email);
          toast({
            title: 'Reset link sent!',
            description: 'If an account exists with this email, you will receive a reset link shortly.',
          });
          setAuthMode('login');
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to send reset link.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const valueProps = [
    {
      icon: ShieldCheck,
      title: "Fiduciary Security",
      description: "Enterprise-grade encryption for all sensitive estate documents and records."
    },
    {
      icon: Clock,
      title: "Time-Saving Roadmap",
      description: "Automated deadlines and task flows to keep probate moving efficiently."
    },
    {
      icon: FileCheck,
      title: "Compliant Evidence",
      description: "Build a defensible audit trail of every fiduciary action and communication."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left side: branding and value propositions (Visual) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        {/* Soft aesthetic background accents */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none opacity-30" />

        <div className="relative z-10 max-w-lg w-full">
          <Link to="/" className="inline-flex items-center gap-3 mb-16 group">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform duration-300">
              <Landmark className="w-8 h-8" />
            </div>
            <span className="font-['Outfit'] font-black text-3xl text-white tracking-tighter">ExpectedEstate</span>
          </Link>

          <div className="space-y-12">
            <h2 className="text-5xl font-['Outfit'] font-black text-white leading-tight tracking-tighter">
              Navigating <span className="text-primary">complexity</span> with complete confidence.
            </h2>

            <div className="space-y-8">
              {valueProps.map((prop, idx) => (
                <motion.div
                  key={prop.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="flex gap-4 items-start"
                >
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary shrink-0">
                    <prop.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{prop.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{prop.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating background element */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20"
        />
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex flex-col relative">
        <div className="lg:hidden p-6 absolute top-0 left-0 z-20">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="font-['Outfit'] font-black text-lg text-slate-900">ExpectedEstate</span>
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 lg:mb-12">
              <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-8 group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to home
              </Link>

              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-4xl font-['Outfit'] font-black text-slate-900 mb-3 tracking-tight">
                    {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
                  </h1>
                  <p className="text-slate-500 font-medium">
                    {authMode === 'login'
                      ? 'Select your access method below to continue.'
                      : authMode === 'signup'
                        ? 'Join our platform for structured estate settlement.'
                        : 'Enter your email to receive a secure reset link.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-5">
                  {authMode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={cn(
                          "h-14 rounded-2xl border-slate-200 focus:ring-primary focus:border-primary px-6 transition-all",
                          errors.name && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.name && (
                        <p className="text-xs font-bold text-destructive mt-1 ml-1 leading-none">{errors.name}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "h-14 rounded-2xl border-slate-200 focus:ring-primary focus:border-primary px-6 transition-all",
                        errors.email && "border-destructive focus:ring-destructive"
                      )}
                    />
                    {errors.email && (
                      <p className="text-xs font-bold text-destructive mt-1 ml-1 leading-none">{errors.email}</p>
                    )}
                  </div>

                  {authMode !== 'forgot-password' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500">Password</Label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot-password');
                              setErrors({});
                            }}
                            className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-blue-700 transition-colors"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(
                          "h-14 rounded-2xl border-slate-200 focus:ring-primary focus:border-primary px-6 transition-all",
                          errors.password && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.password && (
                        <p className="text-xs font-bold text-destructive mt-1 ml-1 leading-none">{errors.password}</p>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {authMode === 'login' ? 'Sign In to Estate' : authMode === 'signup' ? 'Create My Account' : 'Send Reset Link'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-sm font-medium text-slate-500">
                  {authMode === 'login' ? "New to the platform?" : authMode === 'signup' ? 'Already using ExpectedEstate?' : 'Remember your password?'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      if (authMode === 'forgot-password') {
                        setAuthMode('login');
                      } else {
                        setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      }
                      navigate({
                        pathname: '/auth',
                        search: params.toString()
                      }, { replace: true });
                      setErrors({});
                    }}
                    className="font-black text-primary hover:text-blue-700 transition-colors underline decoration-2 underline-offset-4 decoration-primary/20 hover:decoration-primary"
                  >
                    {authMode === 'login' ? 'Register Now' : 'Sign in here'}
                  </button>
                </p>
              </div>
            </motion.div>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                Safe & Secure Fiduciary Access
              </p>
              <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                By continuing, you acknowledge that access is restricted to authorized fiduciaries.
                Read our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
