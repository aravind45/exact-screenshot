import { useState, useEffect } from 'react';
import { Loader2, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface ChecklistAgentProps {
    estateId: string;
    currentPhase?: string;
}

interface ChecklistItem {
    priority: number;
    category: string;
    task: string;
    description: string;
    estimated_time: string;
    deadline?: string;
    dependencies?: string[];
}

export function ChecklistAgent({ estateId, currentPhase = 'discovery' }: ChecklistAgentProps) {
    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [summary, setSummary] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadChecklist();
    }, [estateId, currentPhase]);

    const loadChecklist = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await api.agents.getChecklist(estateId, currentPhase);
            setChecklist(data.checklist || []);
            setSummary(data.summary || '');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = (priority: number) => {
        setCompletedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(priority)) {
                newSet.delete(priority);
            } else {
                newSet.add(priority);
            }
            return newSet;
        });
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Court Filing': 'bg-purple-100 text-purple-800',
            'Information Gathering': 'bg-blue-100 text-blue-800',
            'Asset Management': 'bg-green-100 text-green-800',
            'Creditor Claims': 'bg-yellow-100 text-yellow-800',
            'Distribution': 'bg-pink-100 text-pink-800',
            'Authority and Ownership': 'bg-indigo-100 text-indigo-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">AI is creating your personalized checklist...</span>
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
                        <div className="font-medium text-red-900">Failed to load checklist</div>
                        <div className="text-sm text-red-700">{error}</div>
                        <button
                            onClick={loadChecklist}
                            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const completedCount = completedTasks.size;
    const totalCount = checklist.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        Your Estate Settlement Checklist
                    </h3>
                    <button
                        onClick={loadChecklist}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Refresh
                    </button>
                </div>

                {/* Summary */}
                {summary && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">{summary}</p>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{completedCount} of {totalCount} completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-3">
                    {checklist.map((item) => {
                        const isCompleted = completedTasks.has(item.priority);

                        return (
                            <div
                                key={item.priority}
                                className={`border rounded-lg p-4 transition-all ${isCompleted ? 'bg-gray-50 opacity-75' : 'bg-white'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleTask(item.priority)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isCompleted
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300 hover:border-blue-500'
                                            }`}
                                    >
                                        {isCompleted && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium text-gray-500">#{item.priority}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                                    {item.task}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                {item.estimated_time}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                                        {/* Deadline */}
                                        {item.deadline && (
                                            <div className="text-xs text-orange-600 mb-2">
                                                ⏰ {item.deadline}
                                            </div>
                                        )}

                                        {/* Dependencies */}
                                        {item.dependencies && item.dependencies.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                                <span className="font-medium">Requires:</span> {item.dependencies.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {checklist.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No checklist items available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
