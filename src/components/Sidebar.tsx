
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
    Home,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SupportDialog } from "./SupportDialog";
import { cn } from "@/lib/utils";

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

    const userRole = (estate as any)?.userRole;
    const isViewer = userRole === 'VIEWER';

    const NAV_CATEGORIES: { title: string; items: NavItem[] }[] = [
        {
            title: "Navigation",
            items: [
                { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
            { label: "Action Plan", icon: Map, path: "/roadmap" },
            ]
        },
        {
            title: "Settlement",
            items: [
                { label: "Asset Ledger", icon: Landmark, path: "/assets" },
                { label: "Liabilities", icon: AlertCircle, path: "/liabilities" },
                { label: "Accounting", icon: Calculator, path: "/accounting" },
                { label: "Final Distribution", icon: CheckCircle2, path: "/distribution" },
                ...(!isViewer ? [{ label: "Official Forms", icon: ScrollText, path: "/forms" }] : []),
                ...(estate?.id && !isViewer ? [{ label: "AI Assistants", icon: Zap, path: `/estates/${estate.id}/agents` }] : []),
            ]
        },
        {
            title: "Records",
            items: [
                ...(!isViewer ? [{ label: "Discovery Assistant", icon: Search, path: "/discovery" }] : []),
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
        ...(!isViewer ? [{
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
        }] : []),
        {
            title: "System",
            items: [
                { label: "Profile", icon: User, path: "/profile" },
                ...(isAdmin ? [{ label: "Admin Console", icon: ShieldCheck, path: "/admin" }] : []),
                ...(!isViewer ? [{ label: "Billing & Plans", icon: Zap, path: "/pricing" }] : []),
            ]
        }
    ];

    return (
        <div className="w-[240px] h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 z-50 border-r border-slate-200 shadow-sm">
            {/* Brand */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-indigo-600 shadow-sm">
                        <Home className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-['Outfit'] font-black text-xl tracking-tight text-slate-900 antialiased">ExpectedEstate</span>
                </div>
                {estate?.estateType && (
                    <div className="pl-0.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-700">
                                {estate.estateType.replace(/_/g, " ")}
                            </span>
                        </div>
                    </div>
                )}
            </div>


            {/* Navigation Categories */}
            <nav className="flex-1 px-3 space-y-6 overflow-y-auto pt-4 pb-6 custom-scrollbar scroll-smooth">
                {NAV_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-1">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 antialiased">
                            {category.title}
                        </p>
                        {category.items.map((item) => {
                            const active = item.path && isActive(item.path);
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => (item.onClick ? item.onClick() : item.path && navigate(item.path))}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group relative",
                                        active ? "bg-indigo-50/50" : "hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <item.icon className={cn(
                                            "w-4.5 h-4.5 transition-colors duration-200",
                                            active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-semibold tracking-tight transition-colors duration-200 antialiased",
                                            active ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                                        )}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {active && (
                                            <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                        )}
                                        {item.label === "Action Plan" && item.path && !isActive(item.path) && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <User className="w-4.5 h-4.5 text-slate-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold text-slate-900 truncate antialiased">{user?.fullName || "User"}</span>
                        <span className="text-[10px] font-medium text-slate-500 truncate lowercase tracking-tight">{user?.email}</span>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                    <LogOut className="w-3.5 h-3.5" />
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
