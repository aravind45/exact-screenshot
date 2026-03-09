import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

export default function AdvisorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await api.advisors.getDashboardStats();
                if (data) {
                    setStats(data?.stats ?? data);
                    const rawUpcoming = Array.isArray(data?.upcomingSessions)
                        ? data.upcomingSessions
                        : Array.isArray(data?.upcomingBookings)
                            ? data.upcomingBookings
                            : [];
                    setUpcomingSessions(rawUpcoming.map((session: any) => ({
                        ...session,
                        sessionDate: session?.sessionDate || session?.startTime,
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const statCards = [
        {
            title: "Active Bookings",
            value: stats?.pendingBookings || 0,
            icon: Users,
            trend: "+12%",
            trendUp: true
        },
        {
            title: "Total Earnings",
            value: `$${(stats?.totalEarnings || 0).toLocaleString()}`,
            icon: DollarSign,
            trend: "+8%",
            trendUp: true
        },
        {
            title: "Pending Payouts",
            value: `$${(stats?.pendingEarnings || 0).toLocaleString()}`,
            icon: TrendingUp,
            trend: "Available soon",
            trendUp: true
        },
        {
            title: "Sessions Completed",
            value: stats?.completedBookings || 0,
            icon: Calendar,
            trend: "cnt",
            trendUp: true
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-['Outfit'] font-bold text-slate-900">Welcome back, {user?.fullName}</h1>
                <p className="text-slate-500 mt-2">Here's what's happening with your advisory business today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="border border-slate-200 shadow-none hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-['Outfit'] text-slate-900">{stat.value}</div>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <span className="text-green-600 font-medium">{stat.trend}</span>
                                {i < 2 && "from last month"}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Upcoming Sessions */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Upcoming Sessions</h2>
                        <Link to="/advisor/bookings">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View All</Button>
                        </Link>
                    </div>

                    {upcomingSessions.length === 0 ? (
                        <Card className="border-dashed border-2 bg-slate-50/50">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                                <h3 className="font-bold text-slate-900">No upcoming sessions</h3>
                                <p className="text-slate-500 text-sm max-w-xs mt-2">
                                    When clients book time with you, their sessions will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {upcomingSessions.map((session: any) => (
                                <Card key={session.id} className="border hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {session?.sessionDate ? new Date(session.sessionDate).getDate() : "-"}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{session?.user?.fullName || "Client"}</h3>
                                                <p className="text-sm text-slate-500">{session?.estate?.name || "Estate"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-slate-900">
                                                {session?.sessionDate ? new Date(session.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                            </div>
                                            <Button size="sm" className="mt-2 h-8">Join Call</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions / Status */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900">Profile Status</h2>
                    <Card className="bg-slate-900 text-white border-none">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-2 py-1 rounded bg-green-400/20 text-green-400 text-xs font-bold uppercase tracking-wider">
                                    Verified
                                </span>
                                <Link to="/advisor/profile">
                                    <Settings className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                                </Link>
                            </div>

                            <h3 className="font-bold text-lg mb-2">Complete Profile</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Your profile is 85% complete. Add a video introduction to increase booking rates.
                            </p>

                            <Link to="/advisor/profile">
                                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
                                    Edit Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start h-10"
                                onClick={() => navigate('/advisor/payouts')}
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Update Payout Method
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-10"
                                onClick={() => navigate('/advisor/profile')}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Manage Availability
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
