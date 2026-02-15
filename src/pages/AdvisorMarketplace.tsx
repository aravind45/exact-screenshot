import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, ShieldCheck, MapPin, DollarSign, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingModal } from "@/components/advisor/BookingModal";
import ReviewList from "@/components/advisor/ReviewList";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export default function AdvisorMarketplace() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [expertiseFilter, setExpertiseFilter] = useState('');
    const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [expandedReviews, setExpandedReviews] = useState<string | null>(null);

    const { data: advisors, isLoading } = useQuery({
        queryKey: ['marketplace-advisors', expertiseFilter],
        queryFn: async () => {
            return await api.advisors.getMarketplace({ expertise: expertiseFilter });
        }
    });

    const filteredAdvisors = advisors?.filter((a: any) =>
        a.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.expertise.some((e: string) => e.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleBook = (advisor: any) => {
        setSelectedAdvisor(advisor);
        setIsBookingOpen(true);
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <main className="max-w-[1240px] w-full mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                                Estate Advisor Marketplace
                            </h1>
                            <p className="text-slate-500 text-lg">
                                Find verified professionals to help you navigate the settlement journey.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or expertise..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Filters
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            Array(6)
                                .fill(0)
                                .map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <CardHeader className="space-y-2">
                                            <Skeleton className="h-6 w-1/2" />
                                            <Skeleton className="h-4 w-1/3" />
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Skeleton className="h-20 w-full" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-6 w-16" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                        ) : filteredAdvisors?.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                    <Search className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold">No advisors found</h3>
                                <p className="text-slate-500">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            filteredAdvisors?.map((advisor: any) => (
                                <Card key={advisor.id} className="group hover:shadow-2xl transition-all duration-300 border-slate-200 overflow-hidden flex flex-col">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                                                    {advisor.profileImage ? (
                                                        <img src={advisor.profileImage} alt={advisor.user.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <ShieldCheck className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                                        {advisor.user.fullName}
                                                        <ShieldCheck className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                        <span className="font-bold text-slate-900">{advisor.averageRating?.toFixed(1) || "5.0"}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedReviews(expandedReviews === advisor.id ? null : advisor.id);
                                                            }}
                                                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                                                        >
                                                            ({advisor.totalReviews || 0} reviews)
                                                            {expandedReviews === advisor.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-indigo-600">${advisor.hourlyRate}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">per hour</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 flex-1 space-y-4">
                                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                                            {advisor.bio || "No professional bio provided."}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {advisor.expertise.map((exp: string) => (
                                                <Badge key={exp} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                    {exp}
                                                </Badge>
                                            ))}
                                        </div>

                                        {expandedReviews === advisor.id && (
                                            <div className="mt-6 pt-6 border-t border-slate-100">
                                                <ReviewList advisorId={advisor.id} />
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-4">
                                        <Button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                                            onClick={() => handleBook(advisor)}
                                        >
                                            Book a Consultation
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>

                    <BookingModal
                        isOpen={isBookingOpen}
                        onClose={() => setIsBookingOpen(false)}
                        advisor={selectedAdvisor}
                        user={user}
                    />

                    {!user && (
                        <div className="mt-20 p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                    Are you an Estate Professional?
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none">We're hiring</Badge>
                                </h3>
                                <p className="text-indigo-700/80">Join our marketplace to help families navigate their settlement journey and earn competitive rates.</p>
                            </div>
                            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">
                                <a href="/advisor/onboarding">Join as an Advisor</a>
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
