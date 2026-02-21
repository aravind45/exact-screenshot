import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PathResultCardProps {
    path: {
        pathId: string;
        pathLabel: string;
        complexity: 'Simple' | 'Medium' | 'Complex';
        timeline: string;
        confidence: number;
        modifiers: string[];
        nextSteps: string[];
    };
    onConfirm: () => void;
    onReassess?: () => void;
    className?: string;
}

export function PathResultCard({
    path,
    onConfirm,
    onReassess,
    className
}: PathResultCardProps) {
    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'Simple': return 'bg-green-100 text-green-800 border-green-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Complex': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getComplexityIcon = (complexity: string) => {
        switch (complexity) {
            case 'Simple': return '🟢';
            case 'Medium': return '🟡';
            case 'Complex': return '🔴';
            default: return '⚪';
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {getComplexityIcon(path.complexity)} {path.pathLabel}
                    </h3>
                    <p className="text-sm text-gray-600">Recommended path for your situation</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("border-2", getComplexityColor(path.complexity))}>
                        {path.complexity} Complexity
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-100">
                        {path.timeline}
                    </Badge>
                </div>
            </div>

            {/* Confidence Score */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                    <span className="text-sm font-bold text-gray-900">{path.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            path.confidence >= 80 ? "bg-green-500" :
                            path.confidence >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${path.confidence}%` }}
                    ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                    {path.confidence >= 80 ? "High confidence - clear path" :
                     path.confidence >= 60 ? "Medium confidence - some uncertainty" : "Low confidence - more information needed"}
                </p>
            </div>

            {/* Modifiers */}
            {path.modifiers.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Special Considerations</h4>
                    <div className="flex flex-wrap gap-2">
                        {path.modifiers.map((modifier, index) => (
                            <Badge key={index} variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                {modifier}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Steps */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recommended Next Steps</h4>
                <div className="space-y-2">
                    {path.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                            </div>
                            <p className="text-sm text-gray-700">{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                    onClick={onConfirm}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Continue with {path.pathLabel}
                </Button>
                {onReassess && (
                    <Button
                        onClick={onReassess}
                        variant="outline"
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Reassess My Situation
                    </Button>
                )}
            </div>
        </div>
    );
}