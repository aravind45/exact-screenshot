import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Clock,
    FileText,
    Landmark,
    History,
    Search,
    ChevronRight,
    ArrowRight,
    MapPin,
    Calendar,
    User,
    ArrowUpRight,
    FileCheck2,
    Scale,
    Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SettlementTrail() {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: activities = [], isLoading } = useQuery({
        queryKey: ["activities"],
        queryFn: api.getActivities,
    });

    const filteredActivities = activities.filter(a =>
        a.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.action?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'DOCUMENT': return FileText;
            case 'ASSET': return Landmark;
            case 'ROADMAP': return MapPin;
            case 'COMMUNICATION': return Activity;
            default: return History;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'DOCUMENT': return "text-indigo-600 bg-indigo-50 border-indigo-100";
            case 'ASSET': return "text-emerald-600 bg-emerald-50 border-emerald-100";
            case 'ROADMAP': return "text-amber-600 bg-amber-50 border-amber-100";
            case 'COMMUNICATION': return "text-violet-600 bg-violet-50 border-violet-100";
            default: return "text-slate-600 bg-slate-50 border-slate-100";
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <main className="flex-1 pl-64">
                <div className="p-8 max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                                <History className="w-3.5 h-3.5" />
                                Audit Trail
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settlement Trail</h1>
                            <p className="text-slate-500 font-medium max-w-2xl">
                                Real-time chronological history of every legal action, document upload, and asset revision.
                            </p>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search actions..."
                                className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </header>

                    {/* Timeline */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center text-slate-400 font-medium">
                                Loading chronological history...
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                                <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto">
                                    <Search className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">No matching activities</p>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8 py-4">
                                {filteredActivities.map((activity, idx) => {
                                    const Icon = getActivityIcon(activity.type);
                                    const colorClasses = getActivityColor(activity.type);

                                    return (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="relative"
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`absolute -left-[41px] top-1 p-1.5 rounded-full border-2 border-white shadow-sm z-10 ${colorClasses.split(' ')[1]}`}>
                                                <div className={`w-2 h-2 rounded-full ${colorClasses.split(' ')[0].replace('text-', 'bg-')}`} />
                                            </div>

                                            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                                {/* Background Accent */}
                                                <div className={`absolute right-0 top-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rotate-12 pointer-events-none`}>
                                                    <Icon className="w-32 h-32" />
                                                </div>

                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-3 flex-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border ${colorClasses}`}>
                                                                {activity.type}
                                                            </Badge>
                                                            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 capitalize">
                                                                <Clock className="w-3 h-3" />
                                                                {format(new Date(activity.occurredAt), "MMM d, h:mm a")}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <h3 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-primary transition-colors">
                                                                {activity.action}
                                                            </h3>
                                                            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                                                                {activity.notes}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <div className={`p-3 rounded-xl ${colorClasses.split(' ')[1]}`}>
                                                            <Icon className={`w-5 h-5 ${colorClasses.split(' ')[0]}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
