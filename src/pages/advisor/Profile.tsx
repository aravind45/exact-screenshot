import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { normalizeAdvisorStatus, toStringArray } from '@/lib/advisorData';
import { toast } from 'sonner';
import {
    User, Briefcase, MapPin, Languages, Clock, DollarSign,
    Plus, Trash2, Save, Loader2, Star, Shield, CheckCircle2, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ADVISOR_TYPES = ['ATTORNEY', 'CPA', 'FINANCIAL_ADVISOR', 'REAL_ESTATE_AGENT', 'PARALEGAL', 'OTHER'];
const SPECIALTIES = ['Probate Administration', 'Estate Planning', 'Trust Administration', 'Real Estate Transfers', 'Tax Filing', 'Asset Discovery', 'Creditor Claims', 'Court Filings', 'Small Estate Affidavit', 'Spousal Petitions', 'Guardianship'];
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Mandarin', 'Cantonese', 'Vietnamese', 'Korean', 'Arabic', 'Portuguese'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];

export default function AdvisorProfileSettings() {
    const queryClient = useQueryClient();
    const [bio, setBio] = useState('');
    const [advisorType, setAdvisorType] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [statesServed, setStatesServed] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [hourlyRate, setHourlyRate] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [profileStatus, setProfileStatus] = useState<string>('DRAFT');
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDuration, setNewPlanDuration] = useState('60');
    const [newPlanPrice, setNewPlanPrice] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [availRules, setAvailRules] = useState<Array<{dayOfWeek: number; startTime: string; endTime: string; isActive: boolean;}>>(DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: i >= 1 && i <= 5 })));

    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['advisor-profile-me'],
        queryFn: () => api.marketplace.getMyProfile(),
    });

    useEffect(() => {
        if (!profileData || profileLoaded) return;

        const specialtyList = toStringArray((profileData as any)?.specialties ?? (profileData as any)?.expertise);
        const stateList = toStringArray((profileData as any)?.statesServed);
        const languageList = toStringArray((profileData as any)?.languages);

        setBio((profileData as any)?.bio || '');
        setAdvisorType((profileData as any)?.advisorType || '');
        setSpecialties(specialtyList);
        setStatesServed(stateList);
        setLanguages(languageList.length > 0 ? languageList : ['English']);
        setHourlyRate((profileData as any)?.hourlyRate ? String((profileData as any).hourlyRate) : '');
        setLicenseNumber((profileData as any)?.licenseNumber || '');
        setProfileStatus(normalizeAdvisorStatus((profileData as any)?.status || (profileData as any)?.verificationStatus));
        setProfileLoaded(true);
    }, [profileData, profileLoaded]);

    const { data: ratePlans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['advisor-rate-plans'],
        queryFn: () => api.marketplace.getRatePlans(),
    });

    const { data: availabilityRules, isLoading: rulesLoading } = useQuery({
        queryKey: ['advisor-avail-rules'],
        queryFn: () => api.marketplace.getAvailabilityRules(),
    });

    useEffect(() => {
        if (!Array.isArray(availabilityRules) || availabilityRules.length === 0) return;

        setAvailRules(DAYS.map((_, i) => {
            const existing = availabilityRules.find((rule: any) => Number(rule?.dayOfWeek) === i);
            return existing
                ? {
                    dayOfWeek: i,
                    startTime: String(existing.startTime || '09:00'),
                    endTime: String(existing.endTime || '17:00'),
                    isActive: existing.isActive !== false,
                }
                : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: i >= 1 && i <= 5 };
        }));
    }, [availabilityRules]);

    const saveExtendedMutation = useMutation({
        mutationFn: () => api.marketplace.upsertMyProfile({
            bio,
            advisorType: advisorType || undefined,
            specialties,
            statesServed,
            languages,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
            licenseNumber: licenseNumber || undefined,
        }),
        onSuccess: () => { toast.success('Profile saved successfully'); queryClient.invalidateQueries({ queryKey: ['advisor-profile-me'] }); },
        onError: (e: any) => toast.error(e.message || 'Failed to save profile'),
    });


    const submitReviewMutation = useMutation({
        mutationFn: () => api.marketplace.submitForReview(),
        onSuccess: () => {
            toast.success('Profile submitted for admin review');
            setProfileStatus('PENDING_REVIEW');
            queryClient.invalidateQueries({ queryKey: ['advisor-profile-me'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to submit profile for review'),
    });
    const createPlanMutation = useMutation({
        mutationFn: () => api.marketplace.createRatePlan({ label: newPlanName, durationMinutes: parseInt(newPlanDuration), amountCents: Math.round(parseFloat(newPlanPrice) * 100), description: newPlanDesc }),
        onSuccess: () => { toast.success('Rate plan created'); setNewPlanName(''); setNewPlanDuration('60'); setNewPlanPrice(''); setNewPlanDesc(''); setShowPlanForm(false); queryClient.invalidateQueries({ queryKey: ['advisor-rate-plans'] }); },
        onError: (e: any) => toast.error(e.message || 'Failed to create rate plan'),
    });

    const deletePlanMutation = useMutation({
        mutationFn: (id: string) => api.marketplace.deleteRatePlan(id),
        onSuccess: () => { toast.success('Rate plan removed'); queryClient.invalidateQueries({ queryKey: ['advisor-rate-plans'] }); },
        onError: (e: any) => toast.error(e.message || 'Failed to delete rate plan'),
    });

    const saveAvailMutation = useMutation({
        mutationFn: () => api.marketplace.setAvailabilityRules(availRules.filter(r => r.isActive).map(r => ({ dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime }))),
        onSuccess: () => { toast.success('Availability schedule saved'); queryClient.invalidateQueries({ queryKey: ['advisor-avail-rules'] }); },
        onError: (e: any) => toast.error(e.message || 'Failed to save availability'),
    });

    const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) => { setter(list.includes(val) ? list.filter(x => x !== val) : [...list, val]); };
    const updateAvailRule = (day: number, field: 'startTime' | 'endTime' | 'isActive', value: any) => { setAvailRules(rules => rules.map(r => r.dayOfWeek === day ? { ...r, [field]: value } : r)); };

    if (profileLoading || rulesLoading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-3 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">Profile Settings</h1>
                    <p className="text-xs text-slate-500">Manage your public advisor profile, rates, and availability.</p>
                </div>
                <div className="flex items-center gap-2">
                    {profileStatus !== 'APPROVED' && profileStatus !== 'PENDING_REVIEW' && (
                        <Button
                            variant="outline"
                            onClick={() => submitReviewMutation.mutate()}
                            disabled={submitReviewMutation.isPending}
                            className="h-7 px-3 text-xs"
                        >
                            {submitReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                            Submit For Review
                        </Button>
                    )}
                    <Button onClick={() => saveExtendedMutation.mutate()} disabled={saveExtendedMutation.isPending} className="h-7 px-3 text-xs">
                        {saveExtendedMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Save className="w-3 h-3 mr-1.5" />}Save
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="profile">
                <TabsList className="mb-3 h-8">
                    <TabsTrigger value="profile" className="text-xs px-3 h-7"><User className="w-3 h-3 mr-1" />Profile</TabsTrigger>
                    <TabsTrigger value="rates" className="text-xs px-3 h-7"><DollarSign className="w-3 h-3 mr-1" />Rates</TabsTrigger>
                    <TabsTrigger value="availability" className="text-xs px-3 h-7"><Calendar className="w-3 h-3 mr-1" />Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-2 mt-0">
                    {/* Professional Info */}
                    <Card className="border-slate-200">
                        <CardHeader className="py-2 px-3"><CardTitle className="text-sm flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-primary" />Professional Info</CardTitle></CardHeader>
                        <CardContent className="py-2 px-3 space-y-2">
                            <div className="grid md:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">Advisor Type</Label>
                                    <Select value={advisorType} onValueChange={setAdvisorType}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>{ADVISOR_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">License #</Label>
                                    <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="CA-123456" className="h-7 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wide text-slate-500">Hourly Rate</Label>
                                    <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span><Input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="pl-5 h-7 text-xs" type="number" placeholder="250" /></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wide text-slate-500">Bio ({bio.length}/1000)</Label>
                                <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Describe your experience..." className="text-xs resize-none" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* States Served - ALWAYS VISIBLE */}
                    <Card className="border-slate-200 border-primary/30 bg-primary/5">
                        <CardHeader className="py-2 px-3"><CardTitle className="text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />States Served <Badge variant="secondary" className="ml-2 text-[10px] h-4">{statesServed.length} selected</Badge></CardTitle></CardHeader>
                        <CardContent className="py-2 px-3">
                            <p className="text-[10px] text-slate-500 mb-2">Select all states where you are licensed to practice</p>
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
                                {US_STATES.map(s => (
                                    <button key={s} onClick={() => toggleChip(s, statesServed, setStatesServed)} className={cn('px-1.5 py-1 rounded text-[10px] font-semibold border transition-all', statesServed.includes(s) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50')}>{s}</button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specialties */}
                    <Card className="border-slate-200">
                        <CardHeader className="py-2 px-3"><CardTitle className="text-sm flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-primary" />Specialties</CardTitle></CardHeader>
                        <CardContent className="py-2 px-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                {SPECIALTIES.map(s => (
                                    <button key={s} onClick={() => toggleChip(s, specialties, setSpecialties)} className={cn('px-2 py-1 rounded text-xs font-medium border transition-all text-left', specialties.includes(s) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50')}>{s}</button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Languages */}
                    <Card className="border-slate-200">
                        <CardHeader className="py-2 px-3"><CardTitle className="text-sm flex items-center gap-1.5"><Languages className="w-3.5 h-3.5 text-primary" />Languages</CardTitle></CardHeader>
                        <CardContent className="py-2 px-3">
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
                                {LANGUAGES.map(l => (
                                    <button key={l} onClick={() => toggleChip(l, languages, setLanguages)} className={cn('px-2 py-1 rounded text-xs font-medium border transition-all', languages.includes(l) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300')}>{l}</button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rates" className="space-y-2 mt-0">
                    <Card className="border-slate-200">
                        <CardHeader className="py-2 px-3"><CardTitle className="text-sm flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-primary" />Service Packages</CardTitle></CardHeader>
                        <CardContent className="py-2 px-3 space-y-2">
                            {showPlanForm && (
                                <div className="border border-primary/30 rounded-lg p-2 bg-primary/5 space-y-2">
                                    <div className="grid md:grid-cols-4 gap-2">
                                        <Input value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="Plan name" className="h-7 text-xs" />
                                        <Select value={newPlanDuration} onValueChange={setNewPlanDuration}>
                                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>{[30,45,60,90,120].map(d => <SelectItem key={d} value={String(d)} className="text-xs">{d} min</SelectItem>)}</SelectContent>
                                        </Select>
                                        <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span><Input value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} className="pl-5 h-7 text-xs" type="number" placeholder="Price" /></div>
                                        <Input value={newPlanDesc} onChange={e => setNewPlanDesc(e.target.value)} placeholder="Description" className="h-7 text-xs" />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowPlanForm(false)}>Cancel</Button>
                                        <Button size="sm" className="h-6 text-xs" disabled={!newPlanName || !newPlanPrice} onClick={() => createPlanMutation.mutate()}>Create</Button>
                                    </div>
                                </div>
                            )}
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setShowPlanForm(v => !v)}><Plus className="w-3 h-3 mr-1" />Add Plan</Button>
                            {plansLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : Array.isArray(ratePlans) && ratePlans.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No service plans yet. Add one so clients can book you.</p> : (
                                <div className="space-y-1">
                                    {Array.isArray(ratePlans) && ratePlans.map((plan: any) => (
                                        <div key={plan.id} className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-primary" />
                                                <span className="text-xs font-medium">{plan.serviceName || plan.label}</span>
                                                <span className="text-[10px] text-slate-400">{plan.durationMinutes}m</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold">${((plan.priceCents || plan.amountCents || 0) / 100).toFixed(0)}</span>
                                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-slate-400 hover:text-red-500" onClick={() => deletePlanMutation.mutate(plan.id)}><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex gap-2">
                        <Shield className="w-3 h-3 text-amber-600 mt-0.5" />
                        <p className="text-[10px] text-amber-700"><strong>20% platform fee.</strong> Your earnings are released after a 90-day escrow period.</p>
                    </div>
                </TabsContent>

                <TabsContent value="availability" className="space-y-2 mt-0">
                    <Card className="border-slate-200">
                        <CardHeader className="py-2 px-3"><CardTitle className="text-sm flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" />Weekly Schedule</CardTitle></CardHeader>
                        <CardContent className="py-2 px-3 space-y-1">
                            {DAYS.map((day, idx) => {
                                const rule = availRules[idx];
                                return (
                                    <div key={day} className={cn('flex items-center gap-2 px-2 py-1 rounded transition-all', rule.isActive ? 'bg-slate-50 border border-slate-200' : 'border border-dashed border-slate-200 opacity-50')}>
                                        <div className="flex items-center gap-1.5 w-16">
                                            <Switch checked={rule.isActive} onCheckedChange={v => updateAvailRule(idx, 'isActive', v)} className="scale-75" />
                                            <span className="text-xs font-medium w-6">{day}</span>
                                        </div>
                                        {rule.isActive ? (
                                            <div className="flex items-center gap-1 flex-1">
                                                <Select value={rule.startTime} onValueChange={v => updateAvailRule(idx, 'startTime', v)}><SelectTrigger className="h-6 text-xs w-16"><SelectValue /></SelectTrigger><SelectContent>{TIMES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent></Select>
                                                <span className="text-[10px] text-slate-400">–</span>
                                                <Select value={rule.endTime} onValueChange={v => updateAvailRule(idx, 'endTime', v)}><SelectTrigger className="h-6 text-xs w-16"><SelectValue /></SelectTrigger><SelectContent>{TIMES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent></Select>
                                            </div>
                                        ) : <span className="text-[10px] text-slate-400 italic">Unavailable</span>}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                        <Button onClick={() => saveAvailMutation.mutate()} disabled={saveAvailMutation.isPending} className="h-7 px-3 text-xs">
                            {saveAvailMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save Schedule
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}



