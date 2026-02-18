import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    User, Briefcase, MapPin, Languages, Clock, DollarSign,
    Plus, Trash2, Save, Loader2, Star, Shield, CheckCircle2,
    Calendar, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ADVISOR_TYPES = ['ATTORNEY', 'CPA', 'FINANCIAL_ADVISOR', 'REAL_ESTATE_AGENT', 'PARALEGAL', 'OTHER'];
const SPECIALTIES = [
    'Probate Administration', 'Estate Planning', 'Trust Administration',
    'Real Estate Transfers', 'Tax Filing', 'Asset Discovery',
    'Creditor Claims', 'Court Filings', 'Small Estate Affidavit',
    'Spousal Petitions', 'Guardianship'
];
const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC'
];
const LANGUAGES = ['English', 'Spanish', 'French', 'Mandarin', 'Cantonese', 'Vietnamese', 'Korean', 'Arabic', 'Portuguese'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
               '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];

export default function AdvisorProfileSettings() {
    const queryClient = useQueryClient();

    // ── Profile state ──────────────────────────────────────────────────────────
    const [bio, setBio] = useState('');
    const [advisorType, setAdvisorType] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [statesServed, setStatesServed] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [hourlyRate, setHourlyRate] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [profileLoaded, setProfileLoaded] = useState(false);

    // ── Rate plan state ────────────────────────────────────────────────────────
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDuration, setNewPlanDuration] = useState('60');
    const [newPlanPrice, setNewPlanPrice] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [showPlanForm, setShowPlanForm] = useState(false);

    // ── Availability state ─────────────────────────────────────────────────────
    const [availRules, setAvailRules] = useState<Array<{
        dayOfWeek: number; startTime: string; endTime: string; isActive: boolean;
    }>>(
        DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: i >= 1 && i <= 5 }))
    );

    // ── Queries ────────────────────────────────────────────────────────────────
    const { isLoading: profileLoading } = useQuery({
        queryKey: ['advisor-profile-me'],
        queryFn: () => api.advisors.getMe(),
        onSuccess: (data: any) => {
            if (data && !profileLoaded) {
                setBio(data.bio || '');
                setAdvisorType(data.advisorType || '');
                setSpecialties(data.specialties || data.expertise || []);
                setStatesServed(data.statesServed || []);
                setLanguages(data.languages?.length ? data.languages : ['English']);
                setHourlyRate(data.hourlyRate ? String(data.hourlyRate) : '');
                setLicenseNumber(data.licenseNumber || '');
                setProfileLoaded(true);
            }
        }
    } as any);

    const { data: ratePlans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['advisor-rate-plans'],
        queryFn: () => api.marketplace.getRatePlans(),
    });

    const { isLoading: rulesLoading } = useQuery({
        queryKey: ['advisor-avail-rules'],
        queryFn: () => api.marketplace.getAvailabilityRules(),
        onSuccess: (data: any) => {
            if (Array.isArray(data) && data.length > 0) {
                setAvailRules(
                    DAYS.map((_, i) => {
                        const existing = data.find((r: any) => r.dayOfWeek === i);
                        return existing
                            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, isActive: existing.isActive !== false }
                            : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: i >= 1 && i <= 5 };
                    })
                );
            }
        }
    } as any);

    // ── Mutations ──────────────────────────────────────────────────────────────
    const saveBioMutation = useMutation({
        mutationFn: () => api.advisors.updateProfile({
            bio,
            expertise: specialties,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
            licenseNumber,
        }),
        onSuccess: () => {
            toast.success('Profile saved');
            queryClient.invalidateQueries({ queryKey: ['advisor-profile-me'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to save profile'),
    });

    const saveExtendedMutation = useMutation({
        mutationFn: () => {
            const body: any = {
                bio, advisorType,
                specialties, statesServed, languages,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                licenseNumber,
            };
            return fetch('/api/advisor/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${api.getToken()}`,
                },
                body: JSON.stringify(body),
            }).then(r => r.json());
        },
        onSuccess: () => {
            toast.success('Profile saved successfully');
            queryClient.invalidateQueries({ queryKey: ['advisor-profile-me'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to save profile'),
    });

    const createPlanMutation = useMutation({
        mutationFn: () => api.marketplace.createRatePlan({
            label: newPlanName,
            durationMinutes: parseInt(newPlanDuration),
            amountCents: Math.round(parseFloat(newPlanPrice) * 100),
            description: newPlanDesc,
        }),
        onSuccess: () => {
            toast.success('Rate plan created');
            setNewPlanName(''); setNewPlanDuration('60'); setNewPlanPrice(''); setNewPlanDesc('');
            setShowPlanForm(false);
            queryClient.invalidateQueries({ queryKey: ['advisor-rate-plans'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to create rate plan'),
    });

    const deletePlanMutation = useMutation({
        mutationFn: (id: string) => api.marketplace.deleteRatePlan(id),
        onSuccess: () => {
            toast.success('Rate plan removed');
            queryClient.invalidateQueries({ queryKey: ['advisor-rate-plans'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to delete rate plan'),
    });

    const saveAvailMutation = useMutation({
        mutationFn: () => api.marketplace.setAvailabilityRules(
            availRules.filter(r => r.isActive).map(r => ({
                dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime
            }))
        ),
        onSuccess: () => {
            toast.success('Availability schedule saved');
            queryClient.invalidateQueries({ queryKey: ['advisor-avail-rules'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to save availability'),
    });

    // ── Helpers ────────────────────────────────────────────────────────────────
    const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) => {
        setter(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
    };

    const updateAvailRule = (day: number, field: 'startTime' | 'endTime' | 'isActive', value: any) => {
        setAvailRules(rules => rules.map(r => r.dayOfWeek === day ? { ...r, [field]: value } : r));
    };

    if (profileLoading || rulesLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-['Outfit'] font-bold text-slate-900">Profile Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your public advisor profile, rates, and availability.</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList className="mb-6">
                    <TabsTrigger value="profile" className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />Profile
                    </TabsTrigger>
                    <TabsTrigger value="rates" className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />Service Rates
                    </TabsTrigger>
                    <TabsTrigger value="availability" className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />Availability
                    </TabsTrigger>
                </TabsList>

                {/* ── PROFILE TAB ── */}
                <TabsContent value="profile" className="space-y-5">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                Professional Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Advisor Type</Label>
                                    <Select value={advisorType} onValueChange={setAdvisorType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ADVISOR_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>
                                                    {t.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>License / Bar Number</Label>
                                    <Input
                                        value={licenseNumber}
                                        onChange={e => setLicenseNumber(e.target.value)}
                                        placeholder="e.g. CA-123456"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Bio <span className="text-slate-400 text-xs">(shown to clients)</span></Label>
                                <Textarea
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    rows={4}
                                    placeholder="Describe your experience, approach, and what makes you the right advisor for estate matters..."
                                    className="resize-none"
                                />
                                <p className="text-xs text-slate-400">{bio.length} / 1000 characters</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Default Hourly Rate (USD)
                                </Label>
                                <div className="relative max-w-[180px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                    <Input
                                        value={hourlyRate}
                                        onChange={e => setHourlyRate(e.target.value)}
                                        className="pl-7"
                                        type="number"
                                        min={0}
                                        placeholder="250"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specialties */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Star className="w-4 h-4 text-primary" />
                                Specialties
                            </CardTitle>
                            <CardDescription className="text-xs">Select all areas you specialize in</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {SPECIALTIES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleChip(s, specialties, setSpecialties)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                            specialties.includes(s)
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* States Served */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                States Served
                            </CardTitle>
                            <CardDescription className="text-xs">Select all states where you are licensed to practice</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1.5">
                                {US_STATES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleChip(s, statesServed, setStatesServed)}
                                        className={cn(
                                            'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all',
                                            statesServed.includes(s)
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Languages */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Languages className="w-4 h-4 text-primary" />
                                Languages
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => toggleChip(l, languages, setLanguages)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                            languages.includes(l)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                        )}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={() => saveExtendedMutation.mutate()}
                            disabled={saveExtendedMutation.isPending}
                            className="h-9 px-5"
                        >
                            {saveExtendedMutation.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                : <Save className="w-4 h-4 mr-2" />
                            }
                            Save Profile
                        </Button>
                    </div>
                </TabsContent>

                {/* ── RATES TAB ── */}
                <TabsContent value="rates" className="space-y-5">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Service Packages</CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Clients choose from these when booking you. At least one plan is required.
                                    </CardDescription>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowPlanForm(v => !v)}>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                    Add Plan
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Add Plan Form */}
                            {showPlanForm && (
                                <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
                                    <p className="text-sm font-semibold text-slate-900">New Service Plan</p>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Plan Name</Label>
                                            <Input
                                                value={newPlanName}
                                                onChange={e => setNewPlanName(e.target.value)}
                                                placeholder="e.g. 30-min Consultation"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Duration (minutes)</Label>
                                            <Select value={newPlanDuration} onValueChange={setNewPlanDuration}>
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[30,45,60,90,120,180].map(d => (
                                                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Price (USD)</Label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                <Input
                                                    value={newPlanPrice}
                                                    onChange={e => setNewPlanPrice(e.target.value)}
                                                    className="h-8 text-sm pl-6"
                                                    type="number"
                                                    min={0}
                                                    placeholder="150"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Description (optional)</Label>
                                            <Input
                                                value={newPlanDesc}
                                                onChange={e => setNewPlanDesc(e.target.value)}
                                                className="h-8 text-sm"
                                                placeholder="What's included..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowPlanForm(false)}>Cancel</Button>
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs"
                                            disabled={!newPlanName || !newPlanPrice || createPlanMutation.isPending}
                                            onClick={() => createPlanMutation.mutate()}
                                        >
                                            {createPlanMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                            Create Plan
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Existing Plans */}
                            {plansLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                                </div>
                            ) : Array.isArray(ratePlans) && ratePlans.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No service plans yet. Add at least one so clients can book you.</p>
                                </div>
                            ) : (
                                Array.isArray(ratePlans) && ratePlans.map((plan: any) => (
                                    <div key={plan.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-900">{plan.serviceName || plan.label}</p>
                                                <p className="text-xs text-slate-500">
                                                    {plan.durationMinutes} min
                                                    {plan.description && ` · ${plan.description}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">
                                                    ${((plan.priceCents || plan.amountCents || 0) / 100).toFixed(0)}
                                                </p>
                                                {plan.isActive === false && (
                                                    <Badge variant="secondary" className="text-[10px] h-4">Inactive</Badge>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => deletePlanMutation.mutate(plan.id)}
                                                disabled={deletePlanMutation.isPending}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                        <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900">Platform fee: 20%</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                ExpectedEstate retains 20% of each booking. Your earnings are released after a 90-day escrow period once the session is confirmed complete.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* ── AVAILABILITY TAB ── */}
                <TabsContent value="availability" className="space-y-5">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Weekly Schedule
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Set your regular working hours. Clients can only book during these windows.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {DAYS.map((day, idx) => {
                                const rule = availRules[idx];
                                return (
                                    <div
                                        key={day}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                                            rule.isActive ? 'bg-slate-50 border border-slate-200' : 'border border-dashed border-slate-200 opacity-60'
                                        )}
                                    >
                                        {/* Day toggle */}
                                        <div className="flex items-center gap-2.5 w-[90px] flex-shrink-0">
                                            <Switch
                                                checked={rule.isActive}
                                                onCheckedChange={v => updateAvailRule(idx, 'isActive', v)}
                                            />
                                            <span className="text-sm font-medium text-slate-700 w-8">{day}</span>
                                        </div>

                                        {rule.isActive ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Select
                                                    value={rule.startTime}
                                                    onValueChange={v => updateAvailRule(idx, 'startTime', v)}
                                                >
                                                    <SelectTrigger className="h-7 text-xs w-[90px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIMES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-xs text-slate-400">to</span>
                                                <Select
                                                    value={rule.endTime}
                                                    onValueChange={v => updateAvailRule(idx, 'endTime', v)}
                                                >
                                                    <SelectTrigger className="h-7 text-xs w-[90px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIMES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-xs text-slate-400 ml-1">
                                                    {(() => {
                                                        const [sh, sm] = rule.startTime.split(':').map(Number);
                                                        const [eh, em] = rule.endTime.split(':').map(Number);
                                                        const mins = (eh * 60 + em) - (sh * 60 + sm);
                                                        return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}` : '';
                                                    })()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Unavailable</span>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-xs text-blue-800">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p>All times are shown to clients in their local timezone. Your schedule is based on your account timezone set in <strong>Settings</strong>.</p>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={() => saveAvailMutation.mutate()}
                            disabled={saveAvailMutation.isPending}
                            className="h-9 px-5"
                        >
                            {saveAvailMutation.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                : <Save className="w-4 h-4 mr-2" />
                            }
                            Save Schedule
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
