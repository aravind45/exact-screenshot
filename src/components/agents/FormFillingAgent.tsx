import { useState } from 'react';
import { Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface FormFillingAgentProps {
    estateId: string;
    onFormFilled?: (data: any) => void;
}

export function FormFillingAgent({ estateId, onFormFilled }: FormFillingAgentProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [availableForms, setAvailableForms] = useState<any[]>([]);
    const [selectedForm, setSelectedForm] = useState<string>('');

    // Load available forms on mount
    useState(() => {
        api.agents.getAvailableForms(estateId)
            .then(data => setAvailableForms(data.forms))
            .catch(err => console.error('Failed to load forms:', err));
    });

    const handleFillForm = async (formType: string) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.agents.fillForm(estateId, formType);
            setResult(data);
            onFormFilled?.(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    AI Form Assistant
                </h3>

                <p className="text-gray-600 mb-4">
                    Let AI automatically fill out probate forms using your estate information.
                </p>

                {/* Form Selection */}
                <div className="space-y-3">
                    {availableForms.map((form) => (
                        <button
                            key={form.code}
                            onClick={() => handleFillForm(form.code)}
                            disabled={loading}
                            className="w-full text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-medium">{form.code}: {form.name}</div>
                                    <div className="text-sm text-gray-600">{form.description}</div>
                                    {form.required && (
                                        <span className="text-xs text-red-600 mt-1 inline-block">Required</span>
                                    )}
                                </div>
                                {loading && selectedForm === form.code ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                ) : (
                                    <FileText className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-blue-900">AI is analyzing your estate data and filling the form...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium text-red-900">Failed to fill form</div>
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {result && (
                    <div className="mt-4 space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="font-medium text-green-900">Form data extracted successfully!</div>
                                <div className="text-sm text-green-700 mt-1">
                                    {result.success
                                        ? 'All required fields filled'
                                        : `${result.missing_fields?.length || 0} fields need manual input`}
                                </div>
                                <div className="text-sm text-green-700">
                                    Confidence: {((result.confidence || 0) * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>

                        {/* Extracted Data Preview */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Extracted Data:</h4>
                            <div className="space-y-2 text-sm">
                                {Object.entries(result.extracted_data || {}).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex justify-between py-2 border-b last:border-0">
                                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="font-medium">{value || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Missing Fields Warning */}
                        {result.missing_fields && result.missing_fields.length > 0 && (
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <div className="font-medium text-yellow-900 mb-2">Missing Required Fields:</div>
                                <ul className="text-sm text-yellow-700 list-disc list-inside">
                                    {result.missing_fields.map((field: string) => (
                                        <li key={field} className="capitalize">
                                            {field.replace(/([A-Z])/g, ' $1').trim()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {/* Navigate to form editor */ }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Edit & Complete Form
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Try Another Form
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
