
import React, { useState } from "react";
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
    Map,
    BookOpen,
    Calculator,
    AlertCircle,
    CheckCircle2,
    Settings,
    Gavel,
    CheckSquare,
    Heart,
    HelpCircle,
    ScrollText,
    MessageSquare,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SupportDialog } from "./SupportDialog";

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportTab, setSupportTab] = useState<"feedback" | "contact">("feedback");

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

    const NAV_CATEGORIES = [
        {
            title: "Navigation",
            items: [
                { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                { label: "Settlement Path", icon: Map, path: "/roadmap" },
            ]
        },
        {
            title: "Settlement",
            items: [
                { label: "Asset Ledger", icon: Landmark, path: "/assets" },
                { label: "Liabilities", icon: AlertCircle, path: "/liabilities" },
                { label: "Accounting", icon: Calculator, path: "/accounting" },
                { label: "Final Distribution", icon: CheckCircle2, path: "/distribution" },
                { label: "Official Forms", icon: ScrollText, path: "/forms" },
            ]
        },
        {
            title: "Records",
            items: [
                { label: "Discovery Assistant", icon: Search, path: "/discovery" },
                { label: "Document Vault", icon: Inbox, path: "/documents" },
                { label: "Settlement Trail", icon: History, path: "/settlement-trail" },
                { label: "Follow-Ups", icon: Bell, path: "/follow-ups" },
            ]
        },
        {
            title: "Support",
            items: [
                { label: "Help Center", icon: HelpCircle, path: "/help" },
                {
                    label: "Send Feedback",
                    icon: MessageSquare,
                    onClick: () => {
                        setSupportTab("feedback");
                        setSupportOpen(true);
                    }
                },
                {
                    label: "Contact Support",
                    icon: Mail,
                    onClick: () => {
                        setSupportTab("contact");
                        setSupportOpen(true);
                    }
                },
                { label: "Settings", icon: Settings, path: "/settings" },
            ]
        },
        {
            title: "System",
            items: [
                { label: "Profile", icon: User, path: "/profile" },
                ...(user?.email === 'aravind45@gmail.com' ? [{ label: "Admin Console", icon: ShieldCheck, path: "/admin" }] : []),
                { label: "Billing & Plans", icon: Zap, path: "/pricing" },
            ]
        }
    ];

    const { data: estateData } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const hasPendingDocs = estateData?.roadmapProgress?.completedTaskIds?.length === 0 || false; // Simple logic for demo

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


            {/* Navigation Categories */}
            <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-4 custom-scrollbar">
                {NAV_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-1">
                        <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 opacity-60">
                            {category.title}
                        </p>
                        {category.items.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => (item as any).onClick ? (item as any).onClick() : navigate(item.path!)}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group
                                    ${item.path && isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-white/5"}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`w-4 h-4 ${item.path && isActive(item.path) ? "text-primary" : "text-slate-500 group-hover:text-slate-300"}`} />
                                    <span className={`text-[13px] font-semibold ${item.path && isActive(item.path) ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.label === "Settlement Path" && item.path && !isActive(item.path) && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                    )}
                                    {item.path && isActive(item.path) && (
                                        <motion.div
                                            layoutId="nav-acc"
                                            className="w-1 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                                        />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
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

            <SupportDialog
                open={supportOpen}
                onOpenChange={setSupportOpen}
                defaultTab={supportTab}
            />
        </div>
    );
}
