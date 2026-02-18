import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Loader2, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { US_STATES } from '@/lib/states';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────
type AdvisorType = 'ATTORNEY' | 'CPA' | 'PARALEGAL' | 'COACH';
type Specialty = 'PROBATE' | 'ESTATE_TAX' | 'TRUST_ADMIN' | 'DOCUMENT_REVIEW' | 'TAX_PLANNING' | 'LITIGATION';
type DocType = 'BAR_CARD' | 'CPA_LICENSE' | 'GOVERNMENT_ID' | 'OTHER';

interface ServicePackage { id: string; name: string; durationMinutes: number; price: number; }
interface DaySchedule { active: boolean; start: string; end: string; }
interface LicenseDoc { id: string; docType: DocType; fileName: string; licenseNumber: string; issuingState: string; expirationDate: string; }

interface OnboardingData {
  bio: string; advisorType: AdvisorType | ''; specialties: Specialty[];
  statesServed: string[]; languages: string[]; timezone: string; meetingLink: string;
  hourlyRate: number; packages: ServicePackage[];
  schedule: Record<string, DaySchedule>;
  bufferMinutes: number; maxSessionsPerDay: number;
  documents: LicenseDoc[];
  agreedDisclaimer: boolean;
}
const SPECIALTIES: Specialty[] = ['PROBATE','ESTATE_TAX','TRUST_ADMIN','DOCUMENT_REVIEW','TAX_PLANNING','LITIGATION'];
const SPECIALTY_LABELS: Record<Specialty,string> = { PROBATE:'Probate', ESTATE_TAX:'Estate Tax', TRUST_ADMIN:'Trust Administration', DOCUMENT_REVIEW:'Document Review', TAX_PLANNING:'Tax Planning', LITIGATION:'Litigation' };
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TIMEZONES = ['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu'];
const STEPS = ['Profile','Rates','Availability','Documents','Review & Submit'];
const DOC_TYPES: { value: DocType; label: string }[] = [{ value:'BAR_CARD',label:'Bar Card'},{value:'CPA_LICENSE',label:'CPA License'},{value:'GOVERNMENT_ID',label:'Government ID'},{value:'OTHER',label:'Other'}];

const INITIAL_SCHEDULE: Record<string, DaySchedule> = Object.fromEntries(DAYS.map(d => [d, { active: ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(d), start: '09:00', end: '17:00' }]));

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={cn('flex flex-col items-center gap-1 min-w-0')}>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
              i < current ? 'bg-indigo-600 border-indigo-600 text-white' : i === current ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-200 text-slate-400 bg-white')}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-xs font-medium truncate max-w-16 text-center', i <= current ? 'text-indigo-700' : 'text-slate-400')}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-1', i < current ? 'bg-indigo-600' : 'bg-slate-200')} />}
        </React.Fragment>
      ))}
    </div>
  );
}
export default function AdvisorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    bio: '', advisorType: '', specialties: [], statesServed: [], languages: [], timezone: 'America/New_York', meetingLink: '',
    hourlyRate: 0, packages: [],
    schedule: INITIAL_SCHEDULE,
    bufferMinutes: 15, maxSessionsPerDay: 5,
    documents: [],
    agreedDisclaimer: false,
  });
  const [langInput, setLangInput] = useState('');

  const saveMutation = useMutation({
    mutationFn: async (payload: any) =      const res = await fetch('/api/advisor/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(api.getToken() ? { Authorization: 'Bearer ' + api.getToken() } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: () => { toast.success('Profile submitted for review!'); navigate('/advisor/dashboard'); },
    onError: (e: any) => toast.error(e.message || 'Failed to submit'),
  });

  const update = (patch: Partial<OnboardingData>) => setData(d => ({ ...d, ...patch }));

  // Language tag management
  const addLang = () => { const l = langInput.trim(); if (l && !data.languages.includes(l)) { update({ languages: [...data.languages, l] }); setLangInput(''); } };
  const removeLang = (l: string) => update({ languages: data.languages.filter(x => x !== l) });

  // Package management
  const addPackage = () => update({ packages: [...data.packages, { id: Date.now().toString(), name: '', durationMinutes: 30, price: 0 }] });
  const updatePackage = (id: string, patch: Partial<ServicePackage>) => update({ packages: data.packages.map(p => p.id === id ? { ...p, ...patch } : p) });
  const removePackage = (id: string) => update({ packages: data.packages.filter(p => p.id !== id) });

  // Document management
  const addDoc = () => update({ documents: [...data.documents, { id: Date.now().toString(), docType: 'GOVERNMENT_ID', fileName: '', licenseNumber: '', issuingState: '', expirationDate: '' }] });
  const updateDoc = (id: string, patch: Partial<LicenseDoc>) => update({ documents: data.documents.map(d => d.id === id ? { ...d, ...patch } : d) });
  const removeDoc = (id: string) => update({ documents: data.documents.filter(d => d.id !== id) });

  const canNext = () => {
    if (step === 0) return !!data.bio.trim() && !!data.advisorType && data.specialties.length > 0;
    if (step === 4) return data.agreedDisclaimer;
    return true;
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6 text-center"><h1 className="text-3xl font-black text-slate-900">Advisor Onboarding</h1><p className="text-slate-500 mt-1">Complete your profile to join the marketplace.</p></div>
        <StepIndicator current={step} />
        <AnimatePresence mode="wait">

          {/* STEP 1: Profile */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
              <Card className="rounded-xl border-slate-200"><CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div><Label className="font-semibold">Professional Bio *</Label><Textarea className="mt-1" placeholder="Describe your expertise and experience..." rows={4} value={data.bio} onChange={e => update({ bio: e.target.value })} /></div>
                <div><Label className="font-semibold">Advisor Type *</Label><Select value={data.advisorType} onValueChange={v => update({ advisorType: v as AdvisorType })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="ATTORNEY">Attorney</SelectItem><SelectItem value="CPA">CPA</SelectItem><SelectItem value="PARALEGAL">Paralegal</SelectItem><SelectItem value="COACH">Estate Coach</SelectItem></SelectContent></Select></div>
                <div><Label className="font-semibold">Specialties *</Label><div className="mt-2 grid grid-cols-2 gap-2">{SPECIALTIES.map(s => (<div key={s} className="flex items-center gap-2"><Checkbox id={s} checked={data.specialties.includes(s)} onCheckedChange={c => update({ specialties: c ? [...data.specialties, s] : data.specialties.filter(x => x !== s) })} /><Label htmlFor={s} className="cursor-pointer text-sm">{SPECIALTY_LABELS[s]}</Label></div>))}</div></div>
                <div><Label className="font-semibold">States Served</Label><Select onValueChange={v => { if (!data.statesServed.includes(v)) update({ statesServed: [...data.statesServed, v] }); }}><SelectTrigger className="mt-1"><SelectValue placeholder="Add a state" /></SelectTrigger><SelectContent>{US_STATES.map(s => <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>)}</SelectContent></Select><div className="mt-2 flex flex-wrap gap-1">{data.statesServed.map(s => <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => update({ statesServed: data.statesServed.filter(x => x !== s) })}>{s} ×</Badge>)}</div></div>
                <div><Label className="font-semibold">Languages</Label><div className="mt-1 flex gap-2"><Input placeholder="Add language" value={langInput} onChange={e => setLangInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLang())} /><Button type="button" variant="outline" size="sm" onClick={addLang}>Add</Button></div><div className="mt-2 flex flex-wrap gap-1">{data.languages.map(l => <Badge key={l} variant="secondary" className="cursor-pointer" onClick={() => removeLang(l)}>{l} ×</Badge>)}</div></div>
                <div className="grid grid-cols-2 gap-4"><div><Label className="font-semibold">Timezone</Label><Select value={data.timezone} onValueChange={v => update({ timezone: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t.replace('America/','').replace('Pacific/','').replace('_',' ')}</SelectItem>)}</SelectContent></Select></div><div><Label className="font-semibold">Meeting Link (optional)</Label><Input className="mt-1" placeholder="https://zoom.us/..." value={data.meetingLink} onChange={e => update({ meetingLink: e.target.value })} /></div></div>
              </CardContent></Card>
            </motion.div>
          )}          {/* STEP 2: Rates */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
              <Card className="rounded-xl border-slate-200"><CardHeader><CardTitle>Rates & Packages</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div><Label className="font-semibold">Base Hourly Rate ($)</Label><Input className="mt-1" type="number" min={0} placeholder="e.g. 150" value={data.hourlyRate || ''} onChange={e => update({ hourlyRate: parseFloat(e.target.value) || 0 })} /></div>
                <div>
                  <div className="flex items-center justify-between mb-3"><Label className="font-semibold">Service Packages</Label><Button size="sm" variant="outline" onClick={addPackage}><Plus className="w-4 h-4 mr-1" />Add Package</Button></div>
                  {data.packages.length === 0 && <p className="text-sm text-slate-500">No packages yet. Add one above.</p>}
                  <div className="space-y-3">{data.packages.map(pkg => (
                    <div key={pkg.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2"><Label className="text-xs">Package Name</Label><Input className="mt-1" placeholder="e.g. Quick Review" value={pkg.name} onChange={e => updatePackage(pkg.id, { name: e.target.value })} /></div>
                        <div><Label className="text-xs">Price ($)</Label><Input className="mt-1" type="number" min={0} value={pkg.price || ''} onChange={e => updatePackage(pkg.id, { price: parseFloat(e.target.value) || 0 })} /></div>
                      </div>
                      <div className="flex items-center gap-3"><div className="flex-1"><Label className="text-xs">Duration</Label><Select value={String(pkg.durationMinutes)} onValueChange={v => updatePackage(pkg.id, { durationMinutes: parseInt(v) })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 min</SelectItem><SelectItem value="30">30 min</SelectItem><SelectItem value="45">45 min</SelectItem><SelectItem value="60">60 min</SelectItem><SelectItem value="90">90 min</SelectItem></SelectContent></Select></div><Button variant="ghost" size="icon" className="mt-4 text-red-500 hover:text-red-600" onClick={() => removePackage(pkg.id)}><Trash2 className="w-4 h-4" /></Button></div>
                    </div>
                  ))}</div>
                </div>
              </CardContent></Card>
            </motion.div>
          )}          {/* STEP 3: Availability */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
              <Card className="rounded-xl border-slate-200"><CardHeader><CardTitle>Weekly Availability</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">{DAYS.map(day => { const d = data.schedule[day]; return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-28"><Switch checked={d.active} onCheckedChange={v => update({ schedule: { ...data.schedule, [day]: { ...d, active: v } } })} /><Label className={cn('text-sm font-medium', !d.active && 'text-slate-400')}>{day.slice(0,3)}</Label></div>
                    {d.active && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input type="time" className="w-28" value={d.start} onChange={e => update({ schedule: { ...data.schedule, [day]: { ...d, start: e.target.value } } })} />
                        <span className="text-slate-400">to</span>
                        <Input type="time" className="w-28" value={d.end} onChange={e => update({ schedule: { ...data.schedule, [day]: { ...d, end: e.target.value } } })} />
                      </div>
                    )}
                  </div>
                ); })}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="font-semibold">Buffer Between Sessions</Label><Select value={String(data.bufferMinutes)} onValueChange={v => update({ bufferMinutes: parseInt(v) })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">None</SelectItem><SelectItem value="10">10 min</SelectItem><SelectItem value="15">15 min</SelectItem><SelectItem value="30">30 min</SelectItem></SelectContent></Select></div>
                  <div><Label className="font-semibold">Max Sessions/Day</Label><Select value={String(data.maxSessionsPerDay)} onValueChange={v => update({ maxSessionsPerDay: parseInt(v) })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </CardContent></Card>
            </motion.div>
          )}          {/* STEP 4: Documents */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
              <Card className="rounded-xl border-slate-200"><CardHeader><CardTitle>License Documents</CardTitle><CardDescription>Upload documents to verify your credentials.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <Button variant="outline" onClick={addDoc}><Plus className="w-4 h-4 mr-2" />Add Document</Button>
                {data.documents.length === 0 && <p className="text-sm text-slate-500">No documents uploaded. Add at least one credential.</p>}
                <div className="space-y-4">{data.documents.map(doc => (
                  <div key={doc.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center"><p className="font-medium text-sm">Document</p><Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => removeDoc(doc.id)}><Trash2 className="w-4 h-4" /></Button></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Document Type</Label><Select value={doc.docType} onValueChange={v => updateDoc(doc.id, { docType: v as DocType })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label className="text-xs">License Number</Label><Input className="mt-1" placeholder="License #" value={doc.licenseNumber} onChange={e => updateDoc(doc.id, { licenseNumber: e.target.value })} /></div>
                      <div><Label className="text-xs">Issuing State</Label><Select value={doc.issuingState || ''} onValueChange={v => updateDoc(doc.id, { issuingState: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="State" /></SelectTrigger><SelectContent>{US_STATES.map(s => <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label className="text-xs">Expiration Date</Label><Input className="mt-1" type="date" value={doc.expirationDate} onChange={e => updateDoc(doc.id, { expirationDate: e.target.value })} /></div>
                    </div>
                    <div><Button variant="outline" size="sm" onClick={() => { const el = document.createElement('input'); el.type='file'; el.accept='.pdf,.jpg,.jpeg,.png'; el.onchange = ev => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) updateDoc(doc.id, { fileName: f.name }); }; el.click(); }}><Upload className="w-4 h-4 mr-2" />{doc.fileName || 'Upload File'}</Button>{doc.fileName && <span className="text-xs text-slate-500 ml-2">{doc.fileName}</span>}</div>
                  </div>
                ))}</div>
              </CardContent></Card>
            </motion.div>
          )}          {/* STEP 5: Review & Submit */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
              <Card className="rounded-xl border-slate-200"><CardHeader><CardTitle>Review & Submit</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 bg-slate-50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Advisor Type</span><strong>{data.advisorType || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Specialties</span><span className="text-right">{data.specialties.map(s => SPECIALTY_LABELS[s]).join(', ') || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">States Served</span><span className="text-right">{data.statesServed.join(', ') || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Hourly Rate</span><strong>${data.hourlyRate}/hr</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Packages</span><span>{data.packages.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Documents</span><span>{data.documents.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Languages</span><span>{data.languages.join(', ') || '—'}</span></div>
                </div>
                <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Independent Contractor Agreement</p>
                  <p>By submitting, you confirm you are an independent contractor. ExpectedEstate does not employ you and you are solely responsible for the advice you provide. You will comply with all applicable laws and regulations.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="disclaimer" checked={data.agreedDisclaimer} onCheckedChange={v => update({ agreedDisclaimer: !!v })} />
                  <Label htmlFor="disclaimer" className="text-sm cursor-pointer">I agree to the terms above and confirm all information is accurate.</Label>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!data.agreedDisclaimer || saveMutation.isPending} onClick={() => saveMutation.mutate(data)}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit for Review
                </Button>
                {saveMutation.isError && <p className="text-red-600 text-sm">{(saveMutation.error as any)?.message}</p>}
              </CardContent></Card>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex gap-3 mt-6">
            {step > 0 && <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>Back</Button>}
            <Button className={cn('flex-1 bg-indigo-600 hover:bg-indigo-700', step === 0 && 'w-full')} disabled={!canNext()} onClick={() => setStep(s => s + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}