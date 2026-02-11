import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormFillingAgent } from '../components/agents/FormFillingAgent';
import { ChecklistAgent } from '../components/agents/ChecklistAgent';
import { TimelineAgent } from '../components/agents/TimelineAgent';
import { Bot, FileText, CheckSquare, Calendar } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function EstateAgents() {
    const { estateId } = useParams<{ estateId: string }>();
    const [activeTab, setActiveTab] = useState<'forms' | 'checklist' | 'timeline'>('checklist');

    if (!estateId) {
        return <div>Estate not found</div>;
    }

    const tabs = [
        { id: 'checklist' as const, label: 'Checklist', icon: CheckSquare },
        { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
        { id: 'forms' as const, label: 'Form Assistant', icon: FileText },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Bot className="w-8 h-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">AI Assistants</h1>
                        </div>
                        <p className="text-gray-600">
                            Let AI help you navigate the estate settlement process with personalized guidance
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${isActive
                                                    ? 'border-blue-600 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'checklist' && (
                            <ChecklistAgent estateId={estateId} />
                        )}

                        {activeTab === 'timeline' && (
                            <TimelineAgent estateId={estateId} />
                        )}

                        {activeTab === 'forms' && (
                            <FormFillingAgent
                                estateId={estateId}
                                onFormFilled={(data) => {
                                    console.log('Form filled:', data);
                                    // Navigate to form editor or show success message
                                }}
                            />
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                            <Bot className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-blue-900 mb-2">How AI Assistants Work</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• <strong>Checklist:</strong> AI analyzes your estate and creates a personalized action plan</li>
                                    <li>• <strong>Timeline:</strong> Calculates all statutory deadlines based on California law</li>
                                    <li>• <strong>Form Assistant:</strong> Automatically fills probate forms using your estate data</li>
                                </ul>
                                <p className="text-xs text-blue-700 mt-3">
                                    AI-generated content provides educational guidance to help you navigate the process. For personalized advice, consider consulting with a qualified professional.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
