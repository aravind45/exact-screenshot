import { useState } from 'react';
import { cn } from '@/lib/utils';

interface GuidedQuestionProps {
    question: string;
    subtext?: string;
    options: Array<{
        value: string;
        label: string;
        description?: string;
    }>;
    value: string;
    onChange: (value: string) => void;
    isRequired?: boolean;
    helpText?: string;
    className?: string;
}

export function GuidedQuestion({
    question,
    subtext,
    options,
    value,
    onChange,
    isRequired = false,
    helpText,
    className
}: GuidedQuestionProps) {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">
                            {question}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        {helpText && (
                            <button
                                type="button"
                                onClick={() => setShowHelp(!showHelp)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Show help"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {subtext && (
                        <p className="text-sm text-gray-600">{subtext}</p>
                    )}
                </div>
            </div>

            {helpText && showHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{helpText}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                            value === option.value
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div
                                    className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                        value === option.value
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300"
                                    )}
                                >
                                    {value === option.value && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                </div>
                                <span className="font-medium text-gray-900">
                                    {option.label}
                                </span>
                            </div>
                        </div>
                        {option.description && (
                            <p className="mt-2 text-sm text-gray-600">
                                {option.description}
                            </p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}