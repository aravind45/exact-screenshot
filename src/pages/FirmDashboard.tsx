import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    Briefcase,
    Search,
    Plus,
    ChevronRight,
    Clock,
    Landmark,
    Activity,
    User,
    FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function FirmDashboard() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: estates, isLoading } = useQuery({
        queryKey: ['estates'],
        queryFn: api.getEstates
    });

    const filtered = estates?.filter((e: any) =>
        `${e.deceasedFirstName} ${e.deceasedLastName}`.toLowerCase().includes(search.toLowerCase()) ||
        e.courtCaseNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-indigo-600" />
                            Firm Dashboard
                        </h1>
                        <p className="text-slate-500 font-medium">Manage your active Texas probate cases</p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-12 rounded-2xl shadow-lg shadow-indigo-100">
                        <Plus className="w-5 h-5 mr-2" />
                        New Case
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search cases by name or case number..."
                        className="pl-12 h-14 rounded-2xl border-slate-200 focus:ring-indigo-500 shadow-sm text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Case Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Activity className="w-8 h-8 animate-pulse text-indigo-300" />
                                            <span className="font-bold text-sm tracking-widest uppercase">Loading Case Records...</span>
                                        </div>
                                    </td></tr>
                                ) : filtered?.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-400">No cases found matches your search.</td></tr>
                                ) : filtered?.map((estate: any) => (
                                    <tr
                                        key={estate.id}
                                        className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/dashboard?estateId=${estate.id}`)}
                                    >
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                                                    {estate.deceasedFirstName[0]}{estate.deceasedLastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-none mb-1">
                                                        {estate.deceasedFirstName} {estate.deceasedLastName}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                                                        {estate.courtCaseNumber || 'NO CASE NUMBER'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-wide">
                                                {estate.probateStatus?.replace(/_/g, ' ') || 'NOT STARTED'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-sm font-semibold text-slate-600">
                                                {estate.administrationType || 'Independent'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900">45%</span>
                                                    <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: '45%' }} />
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Roadmap Progress</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 transition-transform group-hover:translate-x-1">
                                            <div className="flex items-center justify-end gap-3 font-black text-slate-400">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/reports/client-status?estateId=${estate.id}`);
                                                    }}
                                                >
                                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                    Report
                                                </Button>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
