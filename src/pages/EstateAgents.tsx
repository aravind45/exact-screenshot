import { useParams } from 'react-router-dom';
import { Bot, Search } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AIChat } from '../components/chat/AIChat';

export default function EstateAgents() {
    const { estateId } = useParams<{ estateId: string }>();

    if (!estateId) {
        return <div>Estate not found</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Bot className="w-8 h-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">Legal Research Assistant</h1>
                        </div>
                        <p className="text-gray-600">
                            Ask anything about probate, taxes, or creditor claims and get expert guidance from our legal library.
                        </p>
                    </div>

                    {/* Chat Content */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                        <AIChat />
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                            <Bot className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-blue-900 mb-2">How this Assistant Works</h3>
                                <p className="text-sm text-blue-800 leading-relaxed mb-3">
                                    Our Legal Research Assistant uses RAG (Retrieval-Augmented Generation) to access a curated library of California probate statutes, expert executor guides, and tax compliance resources.
                                </p>
                                <p className="text-xs text-blue-700">
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
