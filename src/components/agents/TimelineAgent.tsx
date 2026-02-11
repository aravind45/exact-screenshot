import { useState, useEffect } from 'react';
import { Loader2, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface TimelineAgentProps {
    estateId: string;
}

interface TimelineMilestone {
    date: string;
    milestone: string;
    type: 'mandatory' | 'recommended';
    days_from_death: number;
    description: string;
    consequence?: string;
}

export function TimelineAgent({ estateId }: TimelineAgentProps) {
    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState<TimelineMilestone[]>([]);
    const [criticalDeadlines, setCriticalDeadlines] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTimeline();
    }, [estateId]);

    const loadTimeline = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await api.agents.getTimeline(estateId);
            setTimeline(data.timeline || []);
            setCriticalDeadlines(data.critical_deadlines || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isUpcoming = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        return date > now;
    };

    const isPast = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        return date < now;
    };

    const isCritical = (dateString: string) => {
        return criticalDeadlines.includes(dateString);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">AI is calculating your deadlines...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="font-medium text-red-900">Failed to load timeline</div>
                        <div className="text-sm text-red-700">{error}</div>
                        <button
                            onClick={loadTimeline}
                            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Estate Settlement Timeline
                    </h3>
                    <button
                        onClick={loadTimeline}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Refresh
                    </button>
                </div>

                {/* Critical Deadlines Alert */}
                {criticalDeadlines.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium text-red-900 mb-1">
                                    {criticalDeadlines.length} Critical Deadline{criticalDeadlines.length > 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-red-700">
                                    Missing these deadlines may have serious legal consequences
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                    {/* Timeline Items */}
                    <div className="space-y-6">
                        {timeline.map((item, index) => {
                            const upcoming = isUpcoming(item.date);
                            const past = isPast(item.date);
                            const critical = isCritical(item.date);
                            const mandatory = item.type === 'mandatory';

                            return (
                                <div key={index} className="relative pl-12">
                                    {/* Timeline Dot */}
                                    <div
                                        className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${critical
                                            ? 'bg-red-600'
                                            : mandatory
                                                ? 'bg-orange-500'
                                                : upcoming
                                                    ? 'bg-blue-600'
                                                    : 'bg-gray-400'
                                            }`}
                                    >
                                        {critical ? (
                                            <AlertTriangle className="w-4 h-4 text-white" />
                                        ) : (
                                            <Clock className="w-4 h-4 text-white" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div
                                        className={`border rounded-lg p-4 ${critical
                                            ? 'border-red-300 bg-red-50'
                                            : mandatory
                                                ? 'border-orange-300 bg-orange-50'
                                                : upcoming
                                                    ? 'border-blue-300 bg-blue-50'
                                                    : 'border-gray-300 bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${mandatory
                                                            ? 'bg-orange-200 text-orange-800'
                                                            : 'bg-blue-200 text-blue-800'
                                                            }`}
                                                    >
                                                        {item.type}
                                                    </span>
                                                    {critical && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-200 text-red-800">
                                                            CRITICAL
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-medium text-gray-900">{item.milestone}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-gray-900">{formatDate(item.date)}</div>
                                                <div className="text-xs text-gray-500">
                                                    {item.days_from_death} days from death
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700 mb-2">{item.description}</p>

                                        {item.consequence && (
                                            <div className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                                <span className="font-medium">Consequence:</span> {item.consequence}
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        {past && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                ⏱️ This deadline has passed
                                            </div>
                                        )}
                                        {upcoming && (
                                            <div className="mt-2 text-xs text-blue-600">
                                                📅 Upcoming
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Empty State */}
                {timeline.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No timeline milestones available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
