
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
    Users,
    Eye,
    Menu,
    X,
    Briefcase,
    FileText,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTerminology } from "@/hooks/useTerminology";
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
    const { t, isB2BTexas } = useTerminology();
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportTab, setSupportTab] = useState<"feedback" | "contact">("feedback");
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close sidebar on route change (mobile)
    React.useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

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
    const isHeir = user?.role === 'HEIR' || (user as any)?.userType === 'HEIR';
    // ─── ADMIN SIDEBAR (operations console) ──────────────────────────────────
    if (isAdmin) {
        const ADMIN_NAV: { title: string; items: NavItem[] }[] = [
            {
                title: "Admin Console",
                items: [
                    { label: "System Users", icon: Users, path: "/admin/system-users" },
                    { label: "Billing & Ledger", icon: CreditCard, path: "/admin/billing-ledger" },
                    { label: "Institution Master", icon: Landmark, path: "/admin/institution-master" },
                    { label: "Form Templates", icon: FileText, path: "/admin/form-templates" },
                    { label: "Knowledge Base", icon: HelpCircle, path: "/admin/knowledge-base" },
                    { label: "Communications", icon: MessageSquare, path: "/admin/communications" },
                    { label: "Marketing & Leads", icon: Zap, path: "/admin/marketing-leads" },
                    { label: "Advisor Verification", icon: Briefcase, path: "/admin/advisor-verification" },
                    { label: "State Rules", icon: ScrollText, path: "/admin/state-rules" },
                ]
            },
            {
                title: "Marketplace Ops",
                items: [
                    { label: "Advisor Queue", icon: Users, path: "/admin/advisors" },
                    { label: "Institution Directory", icon: Landmark, path: "/admin/institutions" },
                ]
            },
            {
                title: "Rules & Data",
                items: [
                    { label: "Jurisdiction Health", icon: Map, path: "/admin/jurisdiction-health" },
                    { label: "SSOT Probate Engine", icon: ScrollText, path: "/admin/probate-engine" },
                ]
            },
            {
                title: "Support",
                items: [
                    {
                        label: "Support & Feedback",
                        icon: MessageSquare,
                        onClick: () => {
                            setSupportTab("contact");
                            setSupportOpen(true);
                        }
                    },
                ]
            }
        ];

        return (
            <>
                {/* ── Mobile hamburger toggle (only on small screens) ── */}
                <button
                    className="md:hidden fixed top-3 left-3 z-[70] p-2.5 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    onClick={() => setIsMobileOpen(prev => !prev)}
                    aria-label="Toggle navigation"
                >
                    {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* ── Backdrop (mobile only, closes sidebar when tapped) ── */}
                {isMobileOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-[65] backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}

                {/* ── Sidebar panel ── */}
                <div className={cn(
                    "w-64 h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 border-r border-slate-200 shadow-sm",
                    "transition-transform duration-300 ease-in-out",
                    "z-[68] md:z-50 md:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    {/* Brand */}
                    <div className="p-4 pb-3">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-amber-600 shadow-sm">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-['Outfit'] font-black text-xl tracking-tight text-slate-900 antialiased">ExpectedEstate</span>
                        </div>
                        <div className="pl-0.5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                                    Admin Access
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Admin Navigation */}
                    <nav className="flex-1 px-2.5 space-y-4 overflow-y-auto pt-2 pb-4 custom-scrollbar scroll-smooth">
                        {ADMIN_NAV.map((category) => (
                            <div key={category.title} className="space-y-0.5">
                                <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 antialiased">
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
                                                active ? "bg-amber-50 shadow-sm" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 relative z-10">
                                                <item.icon className={cn(
                                                    "w-4.5 h-4.5 transition-colors duration-200",
                                                    active ? "text-amber-600" : "text-slate-400 group-hover:text-slate-600"
                                                )} />
                                                <span className={cn(
                                                    "text-[13px] font-bold tracking-tight transition-colors duration-200 antialiased whitespace-nowrap",
                                                    active ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            {active && (
                                                <div className="w-1 h-4 bg-amber-600 rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* User Footer */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <div className="flex items-center gap-2.5 mb-2.5 px-1.5">
                            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                                <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-bold text-slate-900 truncate antialiased">{user?.fullName || "Admin"}</span>
                                <span className="text-[10px] font-medium text-amber-700 truncate tracking-tight uppercase">Administrator</span>
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
            </>
        );
    }

    // ─── HEIR SIDEBAR (read-only) ────────────────────────────────────────────
    if (isHeir) {
        const HEIR_NAV: { title: string; items: NavItem[] }[] = [
            {
                title: "Dashboard",
                items: [
                    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                ]
            },
            {
                title: "Case Setup",
                items: [
                    { label: "Case Setup", icon: User, path: "/profile?tab=case-setup" },
                    { label: "Track Decision", icon: Map, path: "/roadmap" },
                ]
            },
            {
                title: "Settlement",
                items: [
                    { label: "Asset Ledger", icon: Landmark, path: "/assets" },
                    { label: "Liabilities", icon: AlertCircle, path: "/liabilities" },
                    { label: "Accounting", icon: Calculator, path: "/accounting" },
                    { label: "Final Distribution", icon: CheckCircle2, path: "/distribution" },
                ]
            },
            {
                title: "Deadlines & Records",
                items: [
                    { label: "Deadlines & Follow-Ups", icon: Bell, path: "/follow-ups" },
                    { label: "Document Vault", icon: Inbox, path: "/documents" },
                    { label: "Settlement Trail", icon: History, path: "/settlement-trail" },
                ]
            },
            {
                title: "Team",
                items: [
                    { label: "Heirs & Benes", icon: Users, path: "/heirs" },
                ]
            }
        ];

        return (
            <div className="w-[220px] h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 z-50 border-r border-slate-200 shadow-sm">
                {/* Brand */}
                <div className="p-4 pb-3">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 rounded-xl bg-emerald-600 shadow-sm">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-['Outfit'] font-black text-xl tracking-tight text-slate-900 antialiased">ExpectedEstate</span>
                    </div>
                    {/* Read-only badge */}
                    <div className="pl-0.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                                Beneficiary View
                            </span>
                        </div>
                    </div>
                </div>

                {/* Heir Nav */}
                <nav className="flex-1 px-2.5 space-y-4 overflow-y-auto pt-2 pb-4 custom-scrollbar scroll-smooth">
                    {HEIR_NAV.map((category) => (
                        <div key={category.title} className="space-y-0.5">
                            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 antialiased">
                                {category.title}
                            </p>
                            {category.items.map((item) => {
                                const active = item.path && isActive(item.path);
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => item.path && navigate(item.path)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group relative",
                                            active ? "bg-emerald-50 shadow-sm" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <item.icon className={cn(
                                                "w-4.5 h-4.5 transition-colors duration-200",
                                                active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                                            )} />
                                            <span className={cn(
                                                "text-[13px] font-bold tracking-tight transition-colors duration-200 antialiased whitespace-nowrap",
                                                active ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                                            )}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {active && (
                                            <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="p-3 bg-white border-t border-slate-100">
                    <div className="flex items-center gap-2.5 mb-2.5 px-1.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <Users className="w-4.5 h-4.5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-900 truncate antialiased">{user?.fullName || "Heir"}</span>
                            <span className="text-[10px] font-medium text-emerald-600 truncate tracking-tight">Beneficiary</span>
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
            </div>
        );
    }
    // ────────────────────────────────────────────────────────────────────────────

    const NAV_CATEGORIES: { title: string; items: NavItem[] }[] = [
        ...(isB2BTexas ? [{
            title: "Firm Management",
            items: [
                { label: t('firmDashboard') as string, icon: Briefcase, path: "/firm/dashboard" },
                { label: t('clientStatusReport') as string, icon: FileText, path: "/reports/client-status" },
            ]
        }] : []),
        {
            title: "Dashboard",
            items: [
                { label: t('executorDashboard') as string, icon: LayoutDashboard, path: "/dashboard" },
            ]
        },
        {
            title: "Case Setup",
            items: [
                { label: "Case Setup", icon: User, path: "/profile?tab=case-setup" },
                { label: "Track Decision", icon: Map, path: "/roadmap" },
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
                ...(estate?.id && !isViewer ? [{ label: "Legal Research", icon: Zap, path: `/estates/${estate.id}/agents` }] : []),
            ]
        },
        {
            title: "Deadlines & Records",
            items: [
                { label: "Deadlines & Follow-Ups", icon: Bell, path: "/follow-ups" },
                { label: "Document Vault", icon: Inbox, path: "/documents" },
                { label: "Settlement Trail", icon: History, path: "/settlement-trail" },
                ...(!isViewer ? [{ label: "Discovery", icon: Search, path: "/discovery" }] : []),
            ]
        },
        {
            title: "Team",
            items: [
                { label: "Heirs & Benes", icon: Users, path: "/heirs" },
            ]
        },
        ...(!isB2BTexas ? [{
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
        }] : []),
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
                ...(isAdmin ? [{ label: "Admin Console", icon: ShieldCheck, path: "/admin" }] : []),
                ...(!isViewer ? [{ label: "Billing & Plans", icon: Zap, path: "/pricing" }] : []),
            ]
        }
    ];

    return (
        <>
            {/* ── Mobile hamburger toggle (only on small screens) ── */}
            <button
                className="md:hidden fixed top-3 left-3 z-[70] p-2.5 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                onClick={() => setIsMobileOpen(prev => !prev)}
                aria-label="Toggle navigation"
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* ── Backdrop (mobile only, closes sidebar when tapped) ── */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-[65] backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* ── Sidebar panel ── */}
            <div className={cn(
                "w-[220px] h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 border-r border-slate-200 shadow-sm",
                "transition-transform duration-300 ease-in-out",
                // Desktop: always visible. Mobile: slide in/out.
                "z-[68] md:z-50 md:translate-x-0",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Brand */}
                <div className="p-4 pb-3">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 rounded-xl bg-indigo-600 shadow-sm">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-['Outfit'] font-black text-xl tracking-tight text-slate-900 antialiased">ExpectedEstate</span>
                    </div>
                    {estate?.estateType && (
                        <div className="pl-0.5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-800">
                                    {estate.estateType.replace(/_/g, " ")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Categories */}
                <nav className="flex-1 px-2.5 space-y-4 overflow-y-auto pt-2 pb-4 custom-scrollbar scroll-smooth">
                    {NAV_CATEGORIES.map((category) => (
                        <div key={category.title} className="space-y-0.5">
                            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 antialiased">
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
                                            active ? "bg-indigo-50 shadow-sm" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <item.icon className={cn(
                                                "w-4.5 h-4.5 transition-colors duration-200",
                                                active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                                            )} />
                                            <span className={cn(
                                                "text-[13px] font-bold tracking-tight transition-colors duration-200 antialiased whitespace-nowrap",
                                                active ? "text-primary" : "text-slate-600 group-hover:text-slate-900"
                                            )}>
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {active && (
                                                <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                            )}
                                            {item.path === "/roadmap" && !isActive(item.path) && (
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
                <div className="p-3 bg-white border-t border-slate-100">
                    <div className="flex items-center gap-2.5 mb-2.5 px-1.5">
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
        </>
    );
}

