import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, ArrowRight, Loader2, ShieldCheck, Clock, FileCheck, ChevronLeft, Briefcase, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useTracking } from '@/hooks/useTracking';
import { SEO } from "@/components/SEO";

// Validation schemas
const emailSchema = z.string().trim().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const nameSchema = z.string().trim().min(1, 'Name is required').max(100, 'Name is too long');

type UserType = 'EXECUTOR' | 'ADVISOR' | 'HEIR';

// Helper function to determine default dashboard based on user role/type
const getDefaultDashboard = (user: { role?: string; userType?: string } | null): string => {
  if (!user) return '/dashboard';

  if (user.role === 'ADVISOR' || user.userType === 'ADVISOR') {
    return '/advisor/dashboard';
  } else if (user.role === 'ADMIN') {
    return '/admin';
  }

  return '/dashboard';
};

// Helper function to validate redirect path matches user type
const validateRedirectPath = (
  redirect: string | null,
  user: { role?: string; userType?: string } | null
): string | null => {
  if (!redirect || !user) return null;

  const isAdvisorPath = redirect.startsWith('/advisor');
  const isAdminPath = redirect.startsWith('/admin');
  const isExecutorPath = !isAdvisorPath && !isAdminPath;
  const isAdvisor = user.role === 'ADVISOR' || user.userType === 'ADVISOR';
  const isAdmin = user.role === 'ADMIN';

  // Validate path matches user type
  if (isAdvisorPath && isAdvisor) return redirect;
  if (isAdminPath && isAdmin) return redirect;
  if (isExecutorPath && !isAdvisor && !isAdmin) return redirect;

  return null;
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const buyMode = searchParams.get('mode') === 'buy';
  const signupMode = searchParams.get('mode') === 'signup';
  const initialRole = searchParams.get('role');

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>(signupMode ? 'signup' : 'login');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [step, setStep] = useState<'type-selection' | 'form'>('form');

  // Initialize user type from various sources
  useEffect(() => {
    // 1. Check URL parameter first
    if (initialRole === 'ADVISOR') {
      setUserType('ADVISOR');
      setStep('form');
      return;
    }

    // 2. Check invite flow hint
    const pendingRedirect = sessionStorage.getItem("after_login_redirect");
    const signupRole = sessionStorage.getItem("signup_role");
    if (pendingRedirect?.includes('/invite/') || signupRole === 'HEIR') {
      setUserType('HEIR');
      setStep('form');
      return;
    }

    // 3. Check discovery data
    try {
      const saved = sessionStorage.getItem("discovery_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        const role = parsed.role?.toUpperCase();
        if (['ADVISOR', 'EXECUTOR', 'HEIR'].includes(role)) {
          setUserType(role as UserType);
          setStep('form');
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load discovery data", e);
    }

    // 4. If signing up and no user type determined, show selection screen
    if (authMode === 'signup' && !userType) {
      setStep('type-selection');
    } else {
      setStep('form');
    }
  }, [authMode, userType, initialRole]);

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
        const { user: authedUser, error } = await signIn(email, password);
        if (error) {
          const errorMessage = error.message?.toLowerCase() || '';
          if (errorMessage.includes('invalid') && (errorMessage.includes('credentials') || errorMessage.includes('email') || errorMessage.includes('password'))) {
            toast({
              title: 'Invalid credentials',
              description: 'Please check your email and password and try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign in failed',
              description: error.message || 'An unexpected error occurred during sign in.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });

          // Get stored redirect and validate it
          const redirect = sessionStorage.getItem("after_login_redirect");
          if (redirect) {
            sessionStorage.removeItem("after_login_redirect");
          }

          // Validate redirect path matches user type
          const validatedRedirect = validateRedirectPath(redirect, authedUser);

          if (validatedRedirect) {
            navigate(validatedRedirect);
          } else {
            // Use default dashboard based on role/userType
            const defaultPath = getDefaultDashboard(authedUser);
            navigate(buyMode && defaultPath === '/dashboard' ? '/pricing?mode=buy' : defaultPath);
          }
        }
      } else if (authMode === 'signup') {
        // Use selected user type or default to EXECUTOR
        const selectedType = userType || 'EXECUTOR';

        // Extract discovery data if available to pre-populate the new account
        let discoveryFields: any = {};
        try {
          const saved = sessionStorage.getItem("discovery_data");
          if (saved) {
            discoveryFields = JSON.parse(saved);
          }
        } catch (e) {
          console.warn("Failed to load discovery data for signup", e);
        }

        const { user: newUser, error } = await signUp(
          email,
          password,
          fullName,
          selectedType === 'ADVISOR' ? 'ADVISOR' : undefined,
          selectedType,
          discoveryFields.deceasedName,
          discoveryFields.state,
          discoveryFields.estimatedValue
        );

        if (error) {
          if (error.message.includes('User already registered') || error.message.includes('Email already registered')) {
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
            description: 'Welcome to ExpectedEstate.',
          });

          // ── GA4 sign_up conversion event ────────────────────────
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'sign_up', {
              method: 'email',
              user_type: userType || 'EXECUTOR',
            });
          }

          // Get stored redirect and clear it
          const redirect = sessionStorage.getItem("after_login_redirect");
          if (redirect) {
            sessionStorage.removeItem("after_login_redirect");
          }

          // Debug: Log user data to see what we received
          console.log('[AUTH] Registration successful. User data:', {
            userType: newUser?.userType,
            role: newUser?.role,
            id: newUser?.id
          });

          // Route to appropriate onboarding based on user type
          if (newUser?.userType === 'ADVISOR' || newUser?.role === 'ADVISOR') {
            trackEvent('intake_started', { role: 'ADVISOR', email });
            console.log('[AUTH] Routing advisor to /advisor/onboarding');
            navigate('/advisor/onboarding');
          } else if (selectedType === 'HEIR' || newUser?.role === 'HEIR' || newUser?.userType === 'HEIR') {
            // Heir: go back to the invite link if present, otherwise dashboard
            trackEvent('intake_started', { role: 'HEIR', email });
            // Clear signup_role hint
            sessionStorage.removeItem("signup_role");
            console.log('[AUTH] Routing heir to invite or dashboard');
            if (redirect?.includes('/invite/')) {
              navigate(redirect);
            } else {
              navigate('/dashboard');
            }
          } else {
            trackEvent('intake_started', { role: 'EXECUTOR', email });
            console.log('[AUTH] Routing executor to /onboarding');
            // Validate redirect for executors (must not be advisor or admin routes)
            const validatedRedirect = validateRedirectPath(redirect, newUser);

            // Funnel guard: executors who signed up cold (no discovery quiz
            // data) get routed through the quiz first so their dashboard has
            // context instead of empty widgets.
            const hasDiscoveryData = (() => {
              try {
                return !!sessionStorage.getItem("discovery_data");
              } catch { return false; }
            })();

            if (validatedRedirect) {
              navigate(validatedRedirect);
            } else if (buyMode) {
              navigate('/pricing?mode=buy');
            } else if (!hasDiscoveryData) {
              navigate('/start');
            } else {
              navigate('/onboarding');
            }
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
      <SEO
        title={authMode === 'login'
          ? 'Sign In | ExpectedEstate — Probate & Estate Settlement Software'
          : 'Free Probate Software for Executors | Start ExpectedEstate'
        }
        description={authMode === 'login'
          ? 'Sign in to ExpectedEstate — your AI-powered estate settlement dashboard. Track assets, manage probate deadlines, and connect with verified estate advisors.'
          : 'Start settling your loved one\'s estate for free. ExpectedEstate gives executors a step-by-step AI action plan, deadline tracker, document vault, and probate forms — in one place.'
        }
        canonical={authMode === 'login'
          ? 'https://www.expectedestate.com/login'
          : 'https://www.expectedestate.com/register'
        }
        ogTitle={authMode === 'login'
          ? 'Sign In to ExpectedEstate'
          : 'Free Estate Settlement Software — No Attorney Required'
        }
        ogDescription="Get a personalized probate action plan in minutes. ExpectedEstate helps executors navigate every legal deadline, form, and decision — free to start."
        noindex
        structuredData={authMode === 'signup' ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareApplication",
              "name": "ExpectedEstate",
              "applicationCategory": "LegalApplication",
              "operatingSystem": "Web",
              "url": "https://www.expectedestate.com",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free to start — no credit card required"
              },
              "description": "AI-powered probate and estate settlement software for executors. Get a step-by-step action plan, track assets, manage deadlines, and connect with verified estate attorneys.",
              "featureList": [
                "AI-powered probate action plan",
                "Asset discovery and inventory",
                "Statutory deadline tracker",
                "Document vault",
                "Creditor notice management",
                "Verified advisor marketplace"
              ],
              "screenshot": "https://www.expectedestate.com/modern_roadmap_banner.png",
              "provider": {
                "@type": "Organization",
                "name": "ExpectedEstate",
                "url": "https://www.expectedestate.com"
              }
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How long does probate take in California?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most California probate cases take 9–18 months from filing to final distribution. Simple estates under $208,850 may qualify for a small estate affidavit, which can be completed in 30–60 days. Contested estates with disputes can take 2–5 years."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What does an executor of an estate have to do?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An executor must: file the deceased's will with probate court, obtain Letters Testamentary, inventory all estate assets, notify creditors and heirs, pay valid debts and taxes, file the final income tax return, and distribute remaining assets to heirs — all while meeting court-mandated legal deadlines."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need an attorney to settle an estate in California?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In California, you are not legally required to hire an attorney to serve as executor, but probate involves complex legal procedures and strict deadlines. Software like ExpectedEstate provides step-by-step guidance, forms, and access to verified estate attorneys when needed — typically saving executors $5,000–$15,000 in legal fees."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the deadline to file for probate after someone dies in California?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "California does not have a strict statutory deadline to file for probate, but executors should file the petition within 30 days of the decedent's death. Creditor claims must be filed within 60 days of the first notice to creditors. Delays can complicate asset management and expose the executor to personal liability."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is probate software and how does it help executors?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Probate software like ExpectedEstate helps executors manage the estate settlement process from start to finish. It provides a customized action plan based on the estate's legal track, tracks statutory deadlines, generates court-required forms, manages asset inventory, coordinates creditor notices, and connects executors with vetted legal advisors — all in one platform."
                  }
                }
              ]
            }
          ]
        } : undefined}
      />
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
                  key={authMode + step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-4xl font-['Outfit'] font-black text-slate-900 mb-3 tracking-tight">
                    {step === 'type-selection' ? 'Choose Account Type' :
                      authMode === 'login' ? 'Welcome Back' :
                        authMode === 'signup'
                          ? userType === 'ADVISOR' ? 'Advisor Registration'
                            : userType === 'HEIR' ? 'Heir Registration'
                              : 'Executor Registration'
                          : 'Reset Password'}
                  </h1>
                  <p className="text-slate-500 font-medium">
                    {step === 'type-selection'
                      ? 'Select how you will be using ExpectedEstate.'
                      : authMode === 'login'
                        ? 'Select your access method below to continue.'
                        : authMode === 'signup' && userType === 'HEIR'
                          ? 'Create your beneficiary account to view your estate share.'
                          : authMode === 'signup'
                            ? `Create your ${userType?.toLowerCase() || 'account'} profile to get started.`
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
              {step === 'type-selection' ? (
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => { setUserType('EXECUTOR'); setStep('form'); }}
                    className="p-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="font-['Outfit'] font-bold text-base text-slate-900">I am an Executor</h3>
                    </div>
                    <p className="text-slate-500 text-xs ml-[44px] leading-relaxed">
                      I need to settle an estate, manage assets, and distribute inheritance.
                    </p>
                  </button>

                  <button
                    onClick={() => { setUserType('ADVISOR'); setStep('form'); }}
                    className="p-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="font-['Outfit'] font-bold text-base text-slate-900">I am an Advisor</h3>
                    </div>
                    <p className="text-slate-500 text-xs ml-[44px] leading-relaxed">
                      I'm a professional offering services to estates (Attorney, CPA, Realtor).
                    </p>
                  </button>

                  <button
                    onClick={() => { setUserType('HEIR'); setStep('form'); }}
                    className="p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="font-['Outfit'] font-bold text-base text-slate-900">I am an Heir / Beneficiary</h3>
                    </div>
                    <p className="text-slate-500 text-xs ml-[44px] leading-relaxed">
                      I was invited by an executor to view my inheritance and estate progress.
                    </p>
                  </button>

                  <div className="mt-4 text-center">
                    <p className="text-xs font-medium text-slate-500">
                      Already have an account?{' '}
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setStep('form');
                        }}
                        className="font-black text-primary hover:text-blue-700 transition-colors underline decoration-2 underline-offset-4 decoration-primary/20 hover:decoration-primary"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
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
                        {authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="mt-10 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      {authMode === 'login' ? "New to the platform?" : authMode === 'signup' ? 'Already using ExpectedEstate?' : 'Remember your password?'}
                      {' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (authMode === 'forgot-password') {
                            setAuthMode('login');
                            setStep('form');
                          } else {
                            if (authMode === 'login') {
                              setAuthMode('signup');
                              setStep('type-selection');
                              setUserType(null);
                            } else {
                              setAuthMode('login');
                              setStep('form');
                            }
                          }
                          setErrors({});
                        }}
                        className="font-black text-primary hover:text-blue-700 transition-colors underline decoration-2 underline-offset-4 decoration-primary/20 hover:decoration-primary"
                      >
                        {authMode === 'login' ? 'Register Now' : 'Sign in here'}
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </motion.div>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                Safe & Secure Fiduciary Access
              </p>
              <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                By continuing, you acknowledge that access is restricted to authorized fiduciaries.
                Read our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


