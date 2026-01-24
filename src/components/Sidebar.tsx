
import React from "react";
import {
    Landmark,
    Plus,
    Search,
    User,
    LogOut,
    LayoutDashboard,
    FileText,
    ShieldCheck,
    Zap,
    ChevronRight,
    MousePointerClick
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { generateBookmarklet } from "@/lib/autofill";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Download, ExternalLink } from "lucide-react";

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const bookmarklet = estate ? generateBookmarklet({
        deceasedFirstName: estate.deceasedName?.split(' ')[0],
        deceasedLastName: estate.deceasedName?.split(' ').slice(1).join(' '),
        deceasedSSN: estate.deceasedSsn || "XXX-XX-XXXX",
        deceasedDOB: estate.deceasedDob || "01/01/1950",
        dateOfDeath: estate.dateOfDeath || "01/01/2024",
    }) : "#";

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Assets", icon: Landmark, path: "/dashboard" }, // Can split later
        { label: "Discovery", icon: Search, path: "/discovery" },
        { label: "Profile", icon: User, path: "/profile" },
    ];

    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-50 border-r border-slate-800">
            {/* Brand */}
            <div className="p-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                    <Landmark className="w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">ExpectedEstate</span>
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

            {/* Utilities: Fill Bridge */}
            <div className="px-4 mb-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700 shadow-xl overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Fill Assistant</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                        Seamlessly autofill forms on Robinhood, Fidelity, etc.
                    </p>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full h-9 text-[10px] font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <Zap className="w-3 h-3 mr-2" />
                                Install Bridge
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                    ExpectedEstate Bridge
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Install our browser extension to automate form filling.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</div>
                                        Download Extension Files
                                    </h4>
                                    <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                                        The extension files have been created in your project's <code className="bg-slate-800 px-1 rounded text-primary">/extension</code> directory.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</div>
                                        Load into Chrome
                                    </h4>
                                    <ul className="text-xs text-slate-400 pl-7 space-y-2 list-disc">
                                        <li>Open <code className="bg-slate-800 px-1 rounded">chrome://extensions</code> in a new tab</li>
                                        <li>Enable <strong>Developer mode</strong> (top right)</li>
                                        <li>Click <strong>Load unpacked</strong></li>
                                        <li>Select the <code className="bg-slate-800 px-1 rounded">/extension</code> folder</li>
                                    </ul>
                                </div>

                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl space-y-2">
                                    <p className="text-xs font-bold text-primary flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Magic Fill Enabled
                                    </p>
                                    <p className="text-[10px] text-slate-300 leading-relaxed">
                                        Once installed, a ✨ <strong>Fill with ExpectedEstate</strong> button will appear automatically when you visit claim forms on Robinhood or Fidelity.
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

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
