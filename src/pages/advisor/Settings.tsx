import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    Settings, Bell, Clock, Link2, Shield, User, Save, Loader2,
    Video, Info, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TIMEZONES = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix',
    'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney',
];

const CANCELLATION_HOURS = [
    { label: '2 hours', value: 2 },
    { label: '4 hours', value: 4 },
    { label: '12 hours', value: 12 },
    { label: '24 hours', value: 24 },
    { label: '48 hours', value: 48 },
    { label: '72 hours (3 days)', value: 72 },
];

export default function AdvisorAccountSettings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // ── State ──────────────────────────────────────────────────────────────────
    const [timezone, setTimezone] = useState('America/Chicago');
    const [cancellationHours, setCancellationHours] = useState('24');
    const [maxSessionsPerDay, setMaxSessionsPerDay] = useState('5');
    const [bufferMinutes, setBufferMinutes] = useState('15');
    const [meetingLink, setMeetingLink] = useState('');
    const [publicNotes, setPublicNotes] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [profileLoaded, setProfileLoaded] = useState(false);

    // Account info
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [email] = useState(user?.email || '');

    // ── Load existing profile settings ────────────────────────────────────────
    useQuery({
        queryKey: ['advisor-profile-settings'],
        queryFn: () => api.advisors.getMe(),
        onSuccess: (data: any) => {
            if (data && !profileLoaded) {
                setTimezone(data.timezone || 'America/Chicago');
                setCancellationHours(String(data.cancellationHours ?? 24));
                setMaxSessionsPerDay(String(data.maxSessionsPerDay ?? 5));
                setBufferMinutes(String(data.bufferMinutes ?? 15));
                setMeetingLink(data.meetingLink || '');
                setPublicNotes(data.publicNotes || '');
                setRequiresApproval(data.requiresApproval !== false);
                setProfileLoaded(true);
            }
        }
    } as any);

    // ── Save scheduling settings ──────────────────────────────────────────────
    const saveSchedulingMutation = useMutation({
        mutationFn: () =>
            fetch('/api/advisor/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${api.getToken()}`,
                },
                body: JSON.stringify({
                    timezone,
                    cancellationHours: parseInt(cancellationHours),
                    maxSessionsPerDay: parseInt(maxSessionsPerDay),
                    bufferMinutes: parseInt(bufferMinutes),
                    meetingLink,
                    publicNotes,
                    requiresApproval,
                }),
            }).then(r => r.json()),
        onSuccess: () => {
            toast.success('Settings saved');
            queryClient.invalidateQueries({ queryKey: ['advisor-profile-settings'] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to save settings'),
    });

    // ── Save account info ─────────────────────────────────────────────────────
    const saveAccountMutation = useMutation({
        mutationFn: () => api.updateProfile({ fullName }),
        onSuccess: () => toast.success('Account info updated'),
        onError: (e: any) => toast.error(e.message || 'Failed to update account'),
    });

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-['Outfit'] font-bold text-slate-900">Account Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account preferences, scheduling rules, and meeting setup.</p>
            </div>

            {/* ── Account Info ── */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Account Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Full Name</Label>
                            <Input
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email Address</Label>
                            <Input value={email} disabled className="bg-slate-50 text-slate-500" />
                            <p className="text-[11px] text-slate-400">Email cannot be changed. Contact support if needed.</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            className="h-8 px-4 text-xs"
                            onClick={() => saveAccountMutation.mutate()}
                            disabled={saveAccountMutation.isPending}
                        >
                            {saveAccountMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Scheduling Rules ── */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Scheduling Rules
                    </CardTitle>
                    <CardDescription className="text-xs">
                        These settings control how clients book sessions with you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Timezone */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Your Timezone</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map(tz => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz.replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400">Availability slots are displayed in this timezone</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Cancellation Notice</Label>
                            <Select value={cancellationHours} onValueChange={setCancellationHours}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CANCELLATION_HOURS.map(h => (
                                        <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400">Minimum notice required to cancel a booking</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Max Sessions per Day</Label>
                            <Select value={maxSessionsPerDay} onValueChange={setMaxSessionsPerDay}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1,2,3,4,5,6,7,8,10].map(n => (
                                        <SelectItem key={n} value={String(n)}>{n} session{n !== 1 ? 's' : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400">Prevent overbooking on busy days</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Buffer Between Sessions</Label>
                            <Select value={bufferMinutes} onValueChange={setBufferMinutes}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[0,5,10,15,20,30,45,60].map(n => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n === 0 ? 'No buffer' : `${n} minutes`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400">Break time automatically added between bookings</p>
                        </div>
                    </div>

                    {/* Requires Approval Toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-900">Manual booking approval</p>
                            <p className="text-xs text-slate-500">
                                When on, you review and accept each booking request before it's confirmed.
                                When off, bookings are auto-confirmed after payment.
                            </p>
                        </div>
                        <Switch
                            checked={requiresApproval}
                            onCheckedChange={setRequiresApproval}
                            className="ml-4 flex-shrink-0"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Meeting Setup ── */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        Meeting Setup
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Provide your video call link so clients can join your sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            Default Meeting Link
                        </Label>
                        <Input
                            value={meetingLink}
                            onChange={e => setMeetingLink(e.target.value)}
                            placeholder="https://zoom.us/j/your-meeting-id"
                            type="url"
                        />
                        <p className="text-[11px] text-slate-400">
                            Clients will see this link after their booking is confirmed. Works with Zoom, Google Meet, Microsoft Teams, or any video platform.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Public Notes</Label>
                        <Input
                            value={publicNotes}
                            onChange={e => setPublicNotes(e.target.value)}
                            placeholder="e.g. Please have your documents ready 10 minutes before the session"
                        />
                        <p className="text-[11px] text-slate-400">Shown to clients in their booking confirmation email</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex gap-2.5">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-blue-800">
                            Use a <strong>personal meeting room link</strong> (not a per-meeting URL) so it's the same for all sessions. You can set per-booking links from the Bookings page.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* ── Payout Settings shortcut ── */}
            <button
                onClick={() => navigate('/advisor/payouts')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900">Payout & Banking</p>
                        <p className="text-xs text-slate-500">Manage your Stripe Connect account and payout settings</p>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* Save Button */}
            <div className="flex justify-end pb-6">
                <Button
                    onClick={() => saveSchedulingMutation.mutate()}
                    disabled={saveSchedulingMutation.isPending}
                    className="h-9 px-5"
                >
                    {saveSchedulingMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        : <Save className="w-4 h-4 mr-2" />
                    }
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
