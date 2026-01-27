
import { Button } from "@/components/ui/button";
import { MessageSquare, FileSearch, Plus, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function QuickActions() {
    const navigate = useNavigate();

    const actions = [
        {
            title: "Log Communication",
            desc: "Phone, Email, or Mail",
            icon: MessageSquare,
            color: "bg-indigo-50 text-indigo-600",
            hover: "hover:bg-indigo-100/50 hover:border-indigo-200",
            onClick: () => navigate("/assets") // User usually logs comms on specific assets
        },
        {
            title: "Scan Discovery",
            desc: "Find hidden assets",
            icon: FileSearch,
            color: "bg-amber-50 text-amber-600",
            hover: "hover:bg-amber-100/50 hover:border-amber-200",
            onClick: () => navigate("/discovery")
        },
        {
            title: "Add Asset",
            desc: "Register account",
            icon: Plus,
            color: "bg-emerald-50 text-emerald-600",
            hover: "hover:bg-emerald-100/50 hover:border-emerald-200",
            onClick: () => navigate("/assets")
        },
        {
            title: "Generate Letter",
            desc: "Notice to creditors",
            icon: FileText,
            color: "bg-violet-50 text-violet-600",
            hover: "hover:bg-violet-100/50 hover:border-violet-200",
            onClick: () => navigate("/roadmap")
        }
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        className={cn(
                            "flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-3xl text-left transition-all duration-200",
                            action.hover
                        )}
                    >
                        <div className={cn("p-3 rounded-2xl", action.color)}>
                            <action.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{action.title}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{action.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>
        </div>
    );
}
