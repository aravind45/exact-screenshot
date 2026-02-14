import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Calendar,
    DollarSign,
    Settings,
    LogOut,
    Briefcase,
    Menu,
    X,
    User,
    Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdvisorLayout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/advisor/dashboard', icon: LayoutDashboard },
        { name: 'Bookings', href: '/advisor/bookings', icon: Calendar },
        { name: 'Earnings', href: '/advisor/payouts', icon: DollarSign },
        { name: 'Profile', href: '/advisor/profile', icon: User },
        { name: 'Settings', href: '/advisor/settings', icon: Settings },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col fixed h-full z-30">
                <div className="p-6 border-b border-slate-800">
                    <Link to="/advisor/dashboard" className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="font-['Outfit'] font-black text-xl tracking-tight">ExpectedEstate</span>
                    </Link>
                    <div className="mt-2 text-xs text-slate-400 font-medium px-1">ADVISOR PORTAL</div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <Avatar className="w-8 h-8 ring-2 ring-slate-800">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.fullName}&background=0D8ABC&color=fff`} />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user?.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-40 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <Link to="/advisor/dashboard" className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-primary text-primary-foreground">
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <span className="font-['Outfit'] font-bold text-lg">ExpectedEstate</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300">
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-slate-900 z-30 pt-20 px-4 pb-6 flex flex-col">
                    <nav className="flex-1 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium",
                                    location.pathname === item.href
                                        ? "bg-primary text-white"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className="w-6 h-6" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-red-400 rounded-xl text-lg font-medium"
                    >
                        <LogOut className="w-6 h-6" />
                        Sign Out
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen">
                <div className="p-4 lg:p-8 pt-20 lg:pt-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
