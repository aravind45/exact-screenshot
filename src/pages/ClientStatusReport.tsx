import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    FileCheck,
    Clock,
    Landmark,
    ShieldAlert,
    ArrowLeft,
    Download,
    Printer,
    Calendar,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

export default function ClientStatusReport() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const estateId = searchParams.get('estateId');

    // For the pilot, we assume this endpoint returns the specific estate
    // In a real app, we'd have api.getEstate(estateId)
    const { data: estate, isLoading } = useQuery({
        queryKey: ['estate', estateId],
        queryFn: async () => {
            // Mocking the fetch of a specific estate if ID is provided
            // In this implementation, we'll just use getMyEstate if no ID, 
            // but normally we'd fetch the specific one.
            return api.getMyEstate();
        }
    });

    if (isLoading) return <div className="p-20 text-center uppercase tracking-widest font-black text-slate-400 animate-pulse">Generating Status Report...</div>;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="font-bold text-slate-500 hover:text-indigo-600"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl font-bold border-slate-200">
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Report Header */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 mb-4">
                                Texas Probate Status Report
                            </Badge>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                {estate?.deceasedFirstName} {estate?.deceasedLastName}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Case Number: <span className="text-slate-900 font-bold">{estate?.courtCaseNumber || 'PENDING'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated On</p>
                            <p className="text-sm font-black text-slate-900">{format(new Date(), 'MMMM d, yyyy')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administration Type</p>
                            <p className="text-lg font-black text-slate-900">{estate?.administrationType || 'Independent'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Phase</p>
                            <p className="text-lg font-black text-indigo-600">{estate?.probateStatus?.replace(/_/g, ' ') || 'INITIAL DISCOVERY'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiduciary</p>
                            <p className="text-lg font-black text-slate-900">Aravind (Executor)</p>
                        </div>
                    </div>
                </div>

                {/* Health Meters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Authority', score: 85, icon: FileCheck, color: 'indigo' },
                        { label: 'Accounting', score: 42, icon: Landmark, color: 'amber' },
                        { label: 'Compliance', score: 92, icon: ShieldAlert, color: 'emerald' },
                        { label: 'Risk Info', score: 12, icon: Clock, color: 'slate' }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                                <span className="text-2xl font-black text-slate-900">{stat.score}%</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label} Status</p>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${stat.color}-500`} style={{ width: `${stat.score}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Estate Summary */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-indigo-600" />
                                Asset & Liability Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-slate-600">Total Assets Identified</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">$1,245,000.00</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-slate-600">Outstanding Claims</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">$12,450.00</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">Recent Notifications</p>
                                <div className="space-y-3">
                                    {[
                                        'Notice to Creditors published in Texas Legal News',
                                        'Medicaid recovery notice received (No claim)',
                                        'IRS Form 56 filed'
                                    ].map((note, i) => (
                                        <div key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                                            {note}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        {/* Upcoming Deadlines */}
                        <div className="bg-indigo-600 p-8 rounded-3xl border border-indigo-500 shadow-xl shadow-indigo-100 text-white space-y-6">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Next Deadlines
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Inventory & Appraisement</p>
                                    <p className="text-lg font-black">December 15, 2024</p>
                                    <Badge className="bg-white/20 text-white border-none font-bold text-[10px]">Due in 14 days</Badge>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Notice to Creditors (Texas)</p>
                                    <p className="text-lg font-black font-strike text-indigo-300">Completed</p>
                                </div>
                            </div>

                            <Button className="w-full bg-white text-indigo-600 font-black uppercase tracking-widest h-12 rounded-2xl hover:bg-slate-50">
                                View Full Roadmap
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
