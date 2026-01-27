
import React from "react";
import {
    Landmark,
    Plus,
    Search,
    User,
    LogOut,
    LayoutDashboard,
    FileText,
    Scale,
    Zap,
    ShieldCheck,
    Mail,
    Inbox,
    History,
    Bell,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    // Auto-sync data to the Extension Bridge
    React.useEffect(() => {
        if (estate) {
            const syncData = {
                deceasedFirstName: estate.deceasedFirstName,
                deceasedLastName: estate.deceasedLastName,
                deceasedSSN: estate.deceasedSsn,
                deceasedDOB: estate.deceasedDateOfBirth?.split('T')[0],
                dateOfDeath: estate.deceasedDateOfDeath?.split('T')[0],
            };
            window.postMessage({ type: "EE_SYNC_DATA", payload: syncData }, "*");
        }
    }, [estate]);

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Probate", icon: Scale, path: "/probate" },
        { label: "Assets", icon: Landmark, path: "/dashboard" },
        { label: "Follow-Ups", icon: Bell, path: "/follow-ups" },
        { label: "Settlement Trail", icon: History, path: "/inbox" },
        { label: "Discovery", icon: Search, path: "/discovery" },
        { label: "Vault", icon: FileText, path: "/documents" },
        { label: "Profile", icon: User, path: "/profile" },
    ];

    // For demo/dev purposes, showing Admin Console to all users or ensure checking DB role
    // if (user?.role === 'ADMIN') {
    navItems.push({ label: "Admin Console", icon: ShieldCheck, path: "/admin" });
    // }

    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-50 border-r border-slate-800">
            {/* Brand */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                        <Landmark className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">ExpectedEstate</span>
                </div>
                {estate?.estateType && (
                    <div className="pl-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {estate.estateType.replace(/_/g, " ")}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Primary Actions */}
            <div className="px-4 mb-8 space-y-2">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Command actions</p>
                <Button
                    onClick={() => navigate('/add-asset')}
                    className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 border-none text-white font-semibold h-11"
                >
                    <Plus className="w-4 h-4" />
                    Add New Asset
                </Button>
                <Button
                    onClick={() => navigate('/upload')}
                    className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 border-none text-white font-semibold h-11"
                >
                    <FileText className="w-4 h-4" />
                    Upload Statement
                </Button>
                <Button
                    onClick={() => navigate('/discovery')}
                    className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 shadow-lg shadow-primary/20"
                >
                    <Zap className="w-4 h-4" />
                    Detective Scan
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Navigation</p>
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`
              w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group
              ${isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-white/5"}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${isActive(item.path) ? "text-primary" : "text-slate-500 group-hover:text-slate-300"}`} />
                            <span className={`text-sm font-medium ${isActive(item.path) ? "text-white" : ""}`}>{item.label}</span>
                        </div>
                        {isActive(item.path) && <motion.div layoutId="nav-acc" className="w-1 h-4 bg-primary rounded-full" />}
                    </button>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">{user?.fullName || "User"}</span>
                        <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all font-medium text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
