import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, MapPin, Globe, Clock, DollarSign, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { normalizeAdvisorStatus, toStringArray } from '@/lib/advisorData';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, startOfDay } from 'date-fns';

type AdvisorType = 'ATTORNEY' | 'CPA' | 'PARALEGAL' | 'COACH';
type Specialty = 'PROBATE' | 'ESTATE_TAX' | 'TRUST_ADMIN' | 'DOCUMENT_REVIEW' | 'LITIGATION' | 'TAX_PLANNING';

interface RatePlan { id: string; name?: string; serviceName?: string; durationMinutes: number; price?: number; priceCents?: number; }
interface Review { id: string; rating: number; comment?: string; createdAt: string; user: { fullName: string }; }
interface AdvisorProfile {
  id: string; bio: string; advisorType: AdvisorType; specialties: Specialty[];
  statesServed: string[]; languages: string[]; hourlyRate: number;
  averageRating: number; totalReviews: number; verificationStatus: string;
  user: { fullName: string; email: string }; profileImage?: string;
  ratePlans?: RatePlan[];
}

const SPECIALTY_LABELS: Record<string, string> = {
  PROBATE: 'Probate', ESTATE_TAX: 'Estate Tax', TRUST_ADMIN: 'Trust Administration',
  DOCUMENT_REVIEW: 'Document Review', LITIGATION: 'Litigation', TAX_PLANNING: 'Tax Planning',
};
const ADVISOR_TYPE_COLORS: Record<AdvisorType, string> = {
  ATTORNEY: 'bg-purple-100 text-purple-700', CPA: 'bg-blue-100 text-blue-700',
  PARALEGAL: 'bg-teal-100 text-teal-700', COACH: 'bg-amber-100 text-amber-700',
};
function StarRating({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i}
          className={cn('w-4 h-4 cursor-default', interactive && 'cursor-pointer',
            i <= (hovered || Math.round(rating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200')}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(i)}
        />
      ))}
    </div>
  );
}

function AvailabilityCalendar({ advisorId, ratePlan, onSlotSelect }: { advisorId: string; ratePlan: RatePlan | null; onSlotSelect: (iso: string) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dayOfWeek = monthStart.getDay();

  const { data: slots, isLoading: slotsLoading } = useQuery<string[]>({
    queryKey: ['advisor-slots', advisorId, selectedDate?.toISOString(), ratePlan?.id],
    queryFn: async () => {
      if (!selectedDate || !ratePlan) return [];
      return api.marketplace.getSlots(advisorId, format(selectedDate, 'yyyy-MM-dd'), ratePlan.id);
    },
    enabled: !!selectedDate && !!ratePlan,
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <h3 className="font-semibold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: dayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const past = isPast(startOfDay(day)) && !isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button key={day.toISOString()} disabled={past}
              className={cn('w-full aspect-square rounded-lg text-sm font-medium transition-colors',
                past ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-indigo-50',
                selected ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-700',
                isToday(day) && !selected && 'ring-1 ring-indigo-300')}
              onClick={() => setSelectedDate(day)}>
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
      {selectedDate && ratePlan && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">{format(selectedDate, 'EEEE, MMMM d')} – Available Slots</p>
          {slotsLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div> : !slots || slots.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No slots available for this day.</p> : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(slot => <Button key={slot} variant="outline" size="sm" className="text-xs" onClick={() => onSlotSelect(slot)}>{format(new Date(slot), 'h:mm a')}</Button>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default function AdvisorProfile() {
  const { advisorId } = useParams<{ advisorId: string }>();
  const navigate = useNavigate();
  const [selectedRatePlan, setSelectedRatePlan] = useState<RatePlan | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: advisor, isLoading, isError } = useQuery<AdvisorProfile>({
    queryKey: ['advisor-profile', advisorId],
    queryFn: async () => {
      const payload = await api.marketplace.getAdvisorProfile(advisorId!);
      const source = ((payload as any)?.data ?? payload ?? {}) as any;
      const user = source?.user ?? {};

      return {
        id: source?.id || '',
        bio: source?.bio || '',
        advisorType: source?.advisorType || 'ATTORNEY',
        specialties: toStringArray(source?.specialties ?? source?.expertise),
        statesServed: toStringArray(source?.statesServed),
        languages: toStringArray(source?.languages),
        hourlyRate: Number(source?.hourlyRate || 0),
        averageRating: Number(source?.averageRating ?? source?.avgRating ?? 0),
        totalReviews: Number(source?.totalReviews || 0),
        verificationStatus: normalizeAdvisorStatus(source?.verificationStatus || source?.status),
        user: {
          fullName: user?.fullName || 'Unknown Advisor',
          email: user?.email || '',
        },
        profileImage: source?.profileImage,
        ratePlans: Array.isArray(source?.ratePlans) ? source.ratePlans : [],
      } as AdvisorProfile;
    },
    enabled: !!advisorId,
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ['advisor-reviews', advisorId],
    queryFn: async () => {
      const payload = await api.reviews.getAdvisorReviews(advisorId!);
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.reviews)) return (payload as any).reviews;
      if (Array.isArray((payload as any)?.data)) return (payload as any).data;
      if (Array.isArray((payload as any)?.data?.reviews)) return (payload as any).data.reviews;
      return [];
    },
    enabled: !!advisorId,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  if (isError || !advisor) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-600">Advisor not found.</p></div>;

  const ratePlans: RatePlan[] = Array.isArray(advisor.ratePlans) ? advisor.ratePlans : [];
  const initials = advisor.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 md:ml-64">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate('/marketplace')}><ChevronLeft className="w-4 h-4 mr-1" />Back to Directory</Button>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-xl border-slate-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-20 h-20 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl flex-shrink-0 overflow-hidden">
                  {advisor.profileImage ? <img src={advisor.profileImage} alt={advisor.user.fullName} className="w-full h-full object-cover" /> : <span>{initials}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl font-black text-slate-900">{advisor.user.fullName}</h1>
                    {advisor.verificationStatus === 'APPROVED' && <Badge className="bg-indigo-100 text-indigo-700 border-0 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />Verified</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={cn('border-0', ADVISOR_TYPE_COLORS[advisor.advisorType] ?? 'bg-slate-100 text-slate-600')}>{advisor.advisorType}</Badge>
                    {(advisor.specialties ?? []).map(s => <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-xs">{SPECIALTY_LABELS[s] ?? s}</Badge>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span className="font-semibold text-slate-800">{(advisor.averageRating ?? 0).toFixed(1)}</span><span>({advisor.totalReviews ?? 0} reviews)</span></div>
                    <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /><span>${advisor.hourlyRate}/hr</span></div>
                    {(advisor.statesServed ?? []).length > 0 && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>{advisor.statesServed.join(', ')}</span></div>}
                    {(advisor.languages ?? []).length > 0 && <div className="flex items-center gap-1"><Globe className="w-4 h-4" /><span>{advisor.languages.join(', ')}</span></div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <Card className="rounded-xl border-slate-200"><CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader><CardContent><p className="text-slate-600 leading-relaxed">{advisor.bio || 'No bio provided.'}</p></CardContent></Card>
            {/* Rate Plans */}
            <Card className="rounded-xl border-slate-200">
              <CardHeader><CardTitle className="text-lg">Rate Plans</CardTitle></CardHeader>
              <CardContent>
                {ratePlans.length === 0 ? <p className="text-slate-500 text-sm">Hourly rate: ${advisor.hourlyRate}/hr</p> : (
                  <div className="space-y-3">
                    {ratePlans.map(plan => (
                      <div key={plan.id} className={cn('flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer', selectedRatePlan?.id === plan.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200')} onClick={() => setSelectedRatePlan(plan)}>
                        <div>
                          <p className="font-semibold text-slate-800">{plan.serviceName || plan.name || 'Consultation'}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{plan.durationMinutes} min</p>
                        </div>
                        <div className="text-right"><p className="text-lg font-black text-indigo-600">${(plan.price ?? ((plan.priceCents ?? 0) / 100)).toFixed(2)}</p><Button size="sm" className="mt-1 bg-indigo-600 hover:bg-indigo-700" onClick={e => { e.stopPropagation(); setSelectedRatePlan(plan); }}>Select</Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Reviews */}
            <Card className="rounded-xl border-slate-200">
              <CardHeader><CardTitle className="text-lg">Reviews ({reviews?.length ?? 0})</CardTitle></CardHeader>
              <CardContent>
                {!reviews || reviews.length === 0 ? <p className="text-slate-500 text-sm">No reviews yet.</p> : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.user.fullName}</span><span className="text-xs text-slate-400">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span></div>
                        <StarRating rating={r.rating} />
                        {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>          {/* Sidebar: Booking */}
          <div className="space-y-4">
            <Card className="rounded-xl border-slate-200">
              <CardHeader><CardTitle className="text-lg">Book a Consultation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!selectedRatePlan && ratePlans.length > 0 && <p className="text-sm text-slate-500">Select a rate plan to see availability.</p>}
                {(selectedRatePlan || ratePlans.length === 0) && (
                  <AvailabilityCalendar advisorId={advisorId!} ratePlan={selectedRatePlan} onSlotSelect={slot => setSelectedSlot(slot)} />
                )}
                {selectedSlot && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600 mb-3">Selected: <strong>{format(new Date(selectedSlot), "EEEE, MMM d, h:mm a")}</strong></p>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                      if (!advisorId || !selectedRatePlan) return;
                      const params = new URLSearchParams({ ratePlanId: selectedRatePlan.id, startTime: selectedSlot });
                      navigate(`/marketplace/${advisorId}/book?${params.toString()}`);
                    }}>
                      Book Consultation
                    </Button>
                  </div>
                )}
                {ratePlans.length === 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    This advisor has not published a bookable service plan yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}


