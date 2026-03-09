import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, Loader2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { US_STATES } from '@/lib/states';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';
import { format } from 'date-fns';

interface IntakeForm {
  estateState: string;
  estateSituation: string;
  hasWill: 'yes' | 'no' | '';
  primaryGoals: string;
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | '';
}

interface CheckoutRatePlan {
  id: string;
  name?: string;
  serviceName?: string;
  price?: number;
  priceCents?: number;
}

const STEPS = ['Confirm', 'Intake', 'Payment', 'Confirmed'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={cn('flex items-center gap-2', i <= current ? 'text-indigo-600' : 'text-slate-400')}>
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
              i < current ? 'bg-indigo-600 border-indigo-600 text-white' : i === current ? 'border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-400')}>
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="hidden sm:block text-sm font-medium">{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 max-w-12', i < current ? 'bg-indigo-600' : 'bg-slate-200')} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BookingCheckout() {
  const { advisorId } = useParams<{ advisorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);
  const [intake, setIntake] = useState<IntakeForm>({ estateState: '', estateSituation: '', hasWill: '', primaryGoals: '', urgency: '' });
  const [paymentData, setPaymentData] = useState({ cardNumber: '', expiry: '', cvc: '' });

  const ratePlanId = searchParams.get('ratePlanId');
  const startTime = searchParams.get('startTime');

  const { data: advisorPayload, isLoading } = useQuery({
    queryKey: ['advisor-checkout', advisorId],
    queryFn: async () => api.marketplace.getAdvisorProfile(advisorId!),
    enabled: !!advisorId,
  });

  const advisor: any = (advisorPayload as any)?.data ?? advisorPayload ?? null;
  const advisorName = advisor?.user?.fullName || 'Advisor';

  const ratePlans: CheckoutRatePlan[] = useMemo(() => {
    if (!Array.isArray(advisor?.ratePlans)) return [];
    return advisor.ratePlans;
  }, [advisor]);

  const selectedRatePlan: CheckoutRatePlan | null = useMemo(() => {
    if (ratePlans.length === 0) return null;
    if (ratePlanId) {
      const matched = ratePlans.find((plan) => plan.id === ratePlanId);
      if (matched) return matched;
    }
    return ratePlans[0] ?? null;
  }, [ratePlanId, ratePlans]);

  const selectedRatePlanId = selectedRatePlan?.id ?? null;
  const canProceedToIntake = Boolean(selectedRatePlanId && startTime);

  const displayPrice = selectedRatePlan
    ? `$${Number(selectedRatePlan.price ?? ((selectedRatePlan.priceCents ?? 0) / 100)).toFixed(2)}`
    : `$${advisor?.hourlyRate ?? '—'}/hr`;
  const displayService = selectedRatePlan ? (selectedRatePlan.serviceName || selectedRatePlan.name || 'Consultation') : 'Consultation';
  const displayTime = startTime ? format(new Date(startTime), 'EEEE, MMMM d, yyyy h:mm a') : '—';

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!advisorId || !selectedRatePlanId || !startTime) {
        throw new Error('Please go back and select an available time slot before continuing');
      }
      return api.marketplace.createBooking({
        advisorId,
        ratePlanId: selectedRatePlanId,
        startTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
        intakeAnswers: intake as unknown as Record<string, string>,
        idempotencyKey: `${advisorId}:${selectedRatePlanId}:${startTime}`,
      });
    },
    onSuccess: (data: any) => {
      setBookingId(data.id);
      setStep(2);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('No booking');
      return api.marketplace.createBookingPaymentIntent(bookingId);
    },
    onSuccess: () => setStep(3),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 md:ml-64 py-8">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">Book Consultation</h1>
        <p className="text-slate-500 text-center mb-6 text-sm">{advisorName}</p>
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">

          {/* STEP 1: Confirm */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="rounded-xl border-slate-200">
                <CardHeader><CardTitle>Confirm Selection</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Advisor</span><span className="font-medium text-sm">{advisorName}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Service</span><span className="font-medium text-sm">{displayService}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Date/Time</span><span className="font-medium text-sm">{displayTime}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 mt-2"><span className="font-semibold">Total</span><span className="font-black text-indigo-600 text-lg">{displayPrice}</span></div>
                  </div>

                  {!canProceedToIntake && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      A valid service plan and time slot are required. Go back to the advisor profile and choose an available slot.
                    </p>
                  )}

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setStep(1)}
                    disabled={!canProceedToIntake}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Intake */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="rounded-xl border-slate-200">
                <CardHeader><CardTitle>Intake Questions</CardTitle><CardDescription>Help your advisor prepare for the consultation.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                  <div><Label className="font-semibold">Estate State</Label><Select value={intake.estateState} onValueChange={v => setIntake(i => ({ ...i, estateState: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger><SelectContent>{US_STATES.map(s => <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="font-semibold">Describe the Estate Situation</Label><Textarea className="mt-1" placeholder="Brief description..." value={intake.estateSituation} onChange={e => setIntake(i => ({ ...i, estateSituation: e.target.value }))} /></div>
                  <div><Label className="font-semibold">Do you have a will?</Label><div className="mt-2 flex gap-3">{[{v:'yes',l:'Yes'},{v:'no',l:'No'}].map(o => <Button key={o.v} variant={intake.hasWill === o.v ? 'default' : 'outline'} size="sm" className={cn(intake.hasWill === o.v && 'bg-indigo-600')} onClick={() => setIntake(i => ({ ...i, hasWill: o.v as any }))}>{o.l}</Button>)}</div></div>
                  <div><Label className="font-semibold">Primary Goals</Label><Textarea className="mt-1" placeholder="What do you hope to accomplish?" value={intake.primaryGoals} onChange={e => setIntake(i => ({ ...i, primaryGoals: e.target.value }))} /></div>
                  <div><Label className="font-semibold">Urgency Level</Label><Select value={intake.urgency} onValueChange={v => setIntake(i => ({ ...i, urgency: v as any }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select urgency" /></SelectTrigger><SelectContent><SelectItem value="ROUTINE">Routine</SelectItem><SelectItem value="SOON">Soon</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div>
                  <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button><Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={bookingMutation.isPending} onClick={() => bookingMutation.mutate()}>{bookingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}<ArrowRight className="w-4 h-4 ml-2" /></Button></div>
                  {bookingMutation.isError && <p className="text-red-600 text-sm">{(bookingMutation.error as any)?.message}</p>}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Payment */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="rounded-xl border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Payment</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2 text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>This is a scheduling service only. Advisors are not employees of ExpectedEstate.</span>
                  </div>
                  <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Card Details (Powered by Stripe)</p>
                    <div><Label className="text-sm">Card Number</Label><Input className="mt-1 font-mono" placeholder="1234 5678 9012 3456" maxLength={19} value={paymentData.cardNumber} onChange={e => setPaymentData(d => ({ ...d, cardNumber: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-4"><div><Label className="text-sm">Expiry</Label><Input className="mt-1 font-mono" placeholder="MM/YY" maxLength={5} value={paymentData.expiry} onChange={e => setPaymentData(d => ({ ...d, expiry: e.target.value }))} /></div><div><Label className="text-sm">CVC</Label><Input className="mt-1 font-mono" placeholder="123" maxLength={4} type="password" value={paymentData.cvc} onChange={e => setPaymentData(d => ({ ...d, cvc: e.target.value }))} /></div></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="disclaimer" checked={agreedDisclaimer} onCheckedChange={v => setAgreedDisclaimer(!!v)} />
                    <Label htmlFor="disclaimer" className="text-xs text-slate-600 leading-relaxed cursor-pointer">I understand this platform connects me with independent advisors. ExpectedEstate does not provide legal advice and advisors are not employees of ExpectedEstate.</Label>
                  </div>
                  <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button><Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={paymentMutation.isPending || !agreedDisclaimer} onClick={() => paymentMutation.mutate()}>{paymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${displayPrice}`}</Button></div>
                  {paymentMutation.isError && <p className="text-red-600 text-sm">{(paymentMutation.error as any)?.message}</p>}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: Confirmation */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="rounded-xl border-slate-200">
                <CardContent className="pt-10 pb-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-emerald-600" /></div>
                  <h2 className="text-2xl font-black text-slate-900">Booking Confirmed!</h2>
                  <p className="text-slate-600">Your consultation with <strong>{advisorName}</strong> has been booked.</p>
                  {bookingId && <p className="text-xs text-slate-400">Booking ID: {bookingId}</p>}
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/my-bookings')}>View My Bookings</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}

