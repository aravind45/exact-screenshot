
import React, { useState } from "react";
import {
    Landmark,
    Search,
    User,
    LogOut,
    LayoutDashboard,
    Zap,
    ShieldCheck,
    Inbox,
    History,
    Bell,
    Map,
    Calculator,
    AlertCircle,
    CheckCircle2,
    Settings,
    HelpCircle,
    ScrollText,
    MessageSquare,
    CreditCard,
    ExternalLink,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SupportDialog } from "./SupportDialog";

type NavItem = {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    path?: string;
    onClick?: () => void;
};

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAdmin, signOut } = useAuth();
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

    const NAV_CATEGORIES: { title: string; items: NavItem[] }[] = [
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
                ...(estate?.id ? [{ label: "AI Assistants", icon: Zap, path: `/estates/${estate.id}/agents` }] : []),
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
            title: "Advisor Marketplace",
            items: [
                { label: "Marketplace", icon: Search, path: "/marketplace" },
                { label: "My Consultations", icon: MessageSquare, path: "/my-bookings" },
                ...(user?.role === 'ADVISOR'
                    ? [
                        { label: "Advisor Dashboard", icon: LayoutDashboard, path: "/advisor/dashboard" },
                        { label: "Payout Settings", icon: CreditCard, path: "/advisor/payouts" }
                    ]
                    : []
                ),
            ]
        },
        {
            title: "Support",
            items: [
                { label: "Help Center", icon: HelpCircle, path: "/help" },
                {
                    label: "Support & Feedback",
                    icon: MessageSquare,
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
                ...(isAdmin ? [{ label: "Admin Console", icon: ShieldCheck, path: "/admin" }] : []),
                { label: "Billing & Plans", icon: Zap, path: "/pricing" },
            ]
        }
    ];

    return (
        <div className="w-64 h-screen bg-slate-950 text-slate-400 flex flex-col fixed left-0 top-0 z-50 border-r border-white/5">
            {/* Brand */}
            <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        <Landmark className="w-6 h-6" />
                    </div>
                    <span className="font-['Outfit'] font-black text-2xl tracking-tighter text-white">ExpectedEstate</span>
                </div>
                {estate?.estateType && (
                    <div className="pl-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
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
                        <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4">
                            {category.title}
                        </p>
                        {category.items.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => (item.onClick ? item.onClick() : item.path && navigate(item.path))}
                                className={`
                                    w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group
                                    ${item.path && isActive(item.path) ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]" : "hover:bg-white/5"}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`w-4 h-4 transition-colors ${item.path && isActive(item.path) ? "text-primary" : "text-slate-500 group-hover:text-slate-300"}`} />
                                    <span className={`text-[13px] font-bold tracking-tight transition-colors ${item.path && isActive(item.path) ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.label === "Settlement Path" && item.path && !isActive(item.path) && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                    )}
                                    {item.path && isActive(item.path) && (
                                        <motion.div
                                            layoutId="nav-acc"
                                            className="w-1 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"
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
