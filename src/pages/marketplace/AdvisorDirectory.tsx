import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Star, ShieldCheck, MapPin, SlidersHorizontal, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { US_STATES } from '@/lib/states';
import { cn } from '@/lib/utils';
type Specialty = 'PROBATE' | 'ESTATE_TAX' | 'TRUST_ADMIN' | 'DOCUMENT_REVIEW' | 'LITIGATION' | 'TAX_PLANNING';
type AdvisorType = 'ATTORNEY' | 'CPA' | 'PARALEGAL' | 'COACH';

interface MarketplaceAdvisor {
  id: string; bio: string; advisorType: AdvisorType; specialties: Specialty[];
  statesServed: string[]; hourlyRate: number; averageRating: number;
  totalReviews: number; verificationStatus: string;
  user: { fullName: string; email: string }; profileImage?: string;
}
interface Filters {
  search: string; specialties: Specialty[]; state: string;
  advisorType: string; minRate: number; maxRate: number; minRating: number;
}

const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: 'PROBATE', label: 'Probate' }, { value: 'ESTATE_TAX', label: 'Estate Tax' },
  { value: 'TRUST_ADMIN', label: 'Trust Administration' },
  { value: 'DOCUMENT_REVIEW', label: 'Document Review' },
  { value: 'LITIGATION', label: 'Litigation' },
  { value: 'TAX_PLANNING', label: 'Tax Planning' },
];
const ADVISOR_TYPES: { value: AdvisorType; label: string }[] = [
  { value: 'ATTORNEY', label: 'Attorney' }, { value: 'CPA', label: 'CPA' },
  { value: 'PARALEGAL', label: 'Paralegal' }, { value: 'COACH', label: 'Estate Coach' },
];
const ADVISOR_TYPE_COLORS: Record<AdvisorType, string> = {
  ATTORNEY: 'bg-purple-100 text-purple-700', CPA: 'bg-blue-100 text-blue-700',
  PARALEGAL: 'bg-teal-100 text-teal-700', COACH: 'bg-amber-100 text-amber-700',
};
const PAGE_SIZE = 9;
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('flex items-center gap-0.5', size === 'md' && 'gap-1')}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
          i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200')} />
      ))}
    </div>
  );
}

function AdvisorCard({ advisor }: { advisor: MarketplaceAdvisor }) {
  const navigate = useNavigate();
  const initials = advisor.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 rounded-xl flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0 overflow-hidden">
              {advisor.profileImage ? <img src={advisor.profileImage} alt={advisor.user.fullName} className="w-full h-full object-cover" /> : <span>{initials}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-base font-bold truncate">{advisor.user.fullName}</CardTitle>
                {advisor.verificationStatus === 'APPROVED' && <ShieldCheck className="w-4 h-4 text-indigo-600" />}
              </div>              <div className="mt-1">
                <Badge className={cn('text-xs px-2 py-0 rounded-full border-0', ADVISOR_TYPE_COLORS[advisor.advisorType] ?? 'bg-slate-100 text-slate-600')}>
                  {ADVISOR_TYPES.find(t => t.value === advisor.advisorType)?.label ?? advisor.advisorType}
                </Badge>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <StarRating rating={advisor.averageRating ?? 0} />
                <span className="text-xs text-slate-500">{(advisor.averageRating ?? 0).toFixed(1)} ({advisor.totalReviews ?? 0})</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-black text-indigo-600">${advisor.hourlyRate}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">/hr</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 pt-0">
          <p className="text-sm text-slate-600 line-clamp-2">{advisor.bio || 'No bio provided.'}</p>
          <div className="flex flex-wrap gap-1">
            {(advisor.specialties ?? []).slice(0, 3).map(s => (
              <Badge key={s} variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">{SPECIALTIES.find(sp => sp.value === s)?.label ?? s}</Badge>
            ))}
            {(advisor.specialties ?? []).length > 3 && <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500 border-0">+{(advisor.specialties ?? []).length - 3}</Badge>}
          </div>
          {(advisor.statesServed ?? []).length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              <span>{advisor.statesServed.slice(0, 3).join(', ')}{advisor.statesServed.length > 3 ? ` +${advisor.statesServed.length - 3} more` : ''}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg" onClick={() => navigate(`/marketplace/${advisor.id}`)}>Book Now</Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
function AdvisorCardSkeleton() {
  return (
    <Card className="rounded-xl border-slate-200">
      <CardHeader className="pb-3"><div className="flex items-start gap-3"><Skeleton className="w-14 h-14 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></CardHeader>
      <CardContent className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /><div className="flex gap-1"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-16" /></div></CardContent>
      <CardFooter><Skeleton className="h-9 w-full rounded-lg" /></CardFooter>
    </Card>
  );
}

function FiltersPanel({ filters, onFiltersChange }: { filters: Filters; onFiltersChange: (f: Filters) => void }) {
  const toggle = (value: Specialty) => {
    const updated = filters.specialties.includes(value) ? filters.specialties.filter(v => v !== value) : [...filters.specialties, value];
    onFiltersChange({ ...filters, specialties: updated });
  };
  return (
    <div className="space-y-6">
      <div>
        <Label className="font-semibold text-slate-700 text-sm mb-3 block">Specialty</Label>
        <div className="space-y-2">
          {SPECIALTIES.map(s => (
            <div key={s.value} className="flex items-center gap-2">
              <Checkbox id={`spec-${s.value}`} checked={filters.specialties.includes(s.value)} onCheckedChange={() => toggle(s.value)} />
              <Label htmlFor={`spec-${s.value}`} className="text-sm text-slate-600 cursor-pointer">{s.label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label className="font-semibold text-slate-700 text-sm mb-2 block">State</Label>
        <Select value={filters.state || 'ALL'} onValueChange={v => onFiltersChange({ ...filters, state: v === 'ALL' ? '' : v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All States" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All States</SelectItem>
            {US_STATES.map(s => <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>      <div>
        <Label className="font-semibold text-slate-700 text-sm mb-2 block">Advisor Type</Label>
        <Select value={filters.advisorType || 'ALL'} onValueChange={v => onFiltersChange({ ...filters, advisorType: v === 'ALL' ? '' : v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {ADVISOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="font-semibold text-slate-700 text-sm mb-3 block">Price: ${filters.minRate} – ${filters.maxRate >= 1000 ? '1000+' : filters.maxRate}/hr</Label>
        <div className="px-1 space-y-4">
          <div><Label className="text-xs text-slate-500 mb-1 block">Min ($/hr)</Label><Slider min={0} max={500} step={25} value={[filters.minRate]} onValueChange={([v]) => onFiltersChange({ ...filters, minRate: v })} /><div className="text-xs text-slate-400 mt-1">${filters.minRate}</div></div>
          <div><Label className="text-xs text-slate-500 mb-1 block">Max ($/hr)</Label><Slider min={50} max={1000} step={25} value={[filters.maxRate]} onValueChange={([v]) => onFiltersChange({ ...filters, maxRate: v })} /><div className="text-xs text-slate-400 mt-1">${filters.maxRate}</div></div>
        </div>
      </div>
      <div>
        <Label className="font-semibold text-slate-700 text-sm mb-3 block">Min Rating: {filters.minRating} star{filters.minRating !== 1 ? 's' : ''}</Label>
        <Slider min={1} max={5} step={1} value={[filters.minRating]} onValueChange={([v]) => onFiltersChange({ ...filters, minRating: v })} />
        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>1★</span><span>5★</span></div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => onFiltersChange({ search: filters.search, specialties: [], state: '', advisorType: '', minRate: 0, maxRate: 1000, minRating: 1 })}>
        <X className="w-4 h-4 mr-2" />Reset Filters
      </Button>
    </div>
  );
}
export default function AdvisorDirectory() {
  const [filters, setFilters] = useState<Filters>({ search: '', specialties: [], state: '', advisorType: '', minRate: 0, maxRate: 1000, minRating: 1 });
  const [page, setPage] = useState(1);
  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (filters.state) p.state = filters.state;
    if (filters.advisorType) p.advisorType = filters.advisorType;
    if (filters.specialties.length) p.specialties = filters.specialties.join(',');
    if (filters.minRate > 0) p.minRate = String(filters.minRate);
    if (filters.maxRate < 1000) p.maxRate = String(filters.maxRate);
    if (filters.minRating > 1) p.minRating = String(filters.minRating);
    return p;
  }, [filters]);
  const { data, isLoading, isError } = useQuery<MarketplaceAdvisor[]>({
    queryKey: ['marketplace-directory', queryParams],
    queryFn: async () => {
      const url = new URL('/api/marketplace', window.location.origin);
      Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json', ...(api.getToken() ? { Authorization: `Bearer ${api.getToken()}` } : {}) } });
      if (!res.ok) throw new Error('Failed to load advisors');
      const json = await res.json();
      // API returns { advisors: [...], total, page, totalPages } — extract the array
      return Array.isArray(json) ? json : (json.advisors ?? []);
    },
    placeholderData: [],
  });
  const advisors = Array.isArray(data) ? data : [];
  const filtered = useMemo(() => advisors.filter(a => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return a.user.fullName.toLowerCase().includes(q) || (a.bio ?? '').toLowerCase().includes(q) || a.specialties.some(s => s.toLowerCase().includes(q));
  }), [advisors, filters.search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeFilterCount = [filters.specialties.length > 0, !!filters.state, !!filters.advisorType, filters.minRate > 0, filters.maxRate < 1000, filters.minRating > 1].filter(Boolean).length;  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><strong>Disclaimer:</strong> ExpectedEstate advisors are independent contractors and do not provide legal advice through this platform.</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><h1 className="text-3xl font-black tracking-tight text-slate-900">Advisor Marketplace</h1><p className="mt-1 text-slate-500">Find verified estate professionals to guide you through the settlement process.</p></div>
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by name, specialty..." className="pl-10 bg-white" value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} /></div>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" className="relative bg-white flex-shrink-0 lg:hidden"><SlidersHorizontal className="w-4 h-4 mr-2" />Filters{activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>}</Button></SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto"><SheetHeader><SheetTitle>Filter Advisors</SheetTitle></SheetHeader><div className="mt-6"><FiltersPanel filters={filters} onFiltersChange={f => { setFilters(f); setPage(1); }} /></div></SheetContent>
          </Sheet>
        </div>
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Filter className="w-4 h-4" />Filters{activeFilterCount > 0 && <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs ml-auto">{activeFilterCount} active</Badge>}</h3>
              <FiltersPanel filters={filters} onFiltersChange={f => { setFilters(f); setPage(1); }} />
            </div>
          </aside>          <div className="flex-1 min-w-0">
            <div className="mb-4 text-sm text-slate-500">{isLoading ? 'Loading advisors…' : `${filtered.length} advisor${filtered.length !== 1 ? 's' : ''} found`}</div>
            {isError && <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 mb-6">Failed to load advisors. Please try again.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {isLoading ? Array.from({ length: PAGE_SIZE }).map((_, i) => <AdvisorCardSkeleton key={i} />) : paged.length === 0 ? (
                <div className="col-span-full py-20 text-center"><Search className="w-12 h-12 text-slate-200 mx-auto mb-4" /><h3 className="text-xl font-bold text-slate-700">No advisors found</h3><p className="text-slate-500 mt-1">Try adjusting your filters.</p></div>
              ) : paged.map(a => <AdvisorCard key={a.id} advisor={a} />)}
            </div>
            {!isLoading && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <Button key={pg} variant={pg === page ? 'default' : 'outline'} size="sm" className={cn(pg === page && 'bg-indigo-600 hover:bg-indigo-700')} onClick={() => setPage(pg)}>{pg}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}