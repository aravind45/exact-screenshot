import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { determinePath } from '@/lib/pathEngine';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { GuidedQuestion } from './GuidedQuestion';
import { PathResultCard } from './PathResultCard';

interface EnhancedOnboardingWizardProps {
    onComplete?: () => void;
    className?: string;
}

export function EnhancedOnboardingWizard({ onComplete, className }: EnhancedOnboardingWizardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // State for user answers using tristate values
    const [answers, setAnswers] = useState<{
        hasWill: 'yes' | 'no' | 'not_sure';
        hasTrust: 'yes' | 'no' | 'not_sure';
        trustType?: 'revocable' | 'irrevocable' | 'none' | 'not_sure';
        hasTODDeed: 'yes' | 'no' | 'not_sure';
        hasContest: 'yes' | 'no' | 'not_sure';
        isOutOfState: 'yes' | 'no' | 'not_sure';
        isSpouse: 'yes' | 'no' | 'not_sure';
        debtStatus: 'solvent' | 'insolvent' | 'not_sure';
    }>({
        hasWill: 'not_sure',
        hasTrust: 'not_sure',
        trustType: 'not_sure',
        hasTODDeed: 'not_sure',
        hasContest: 'not_sure',
        isOutOfState: 'not_sure',
        isSpouse: 'not_sure',
        debtStatus: 'not_sure'
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [pathResult, setPathResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get state from location state or default
    const state = location.state?.state || user?.state || 'CA';

    // Questions configuration
    const questions = [
        {
            id: 'hasWill',
            question: 'Was there a valid will?',
            subtext: 'A legal document that specifies how assets should be distributed',
            options: [
                { value: 'yes', label: 'Yes', description: 'Will exists and is valid' },
                { value: 'no', label: 'No', description: 'No will exists' },
                { value: 'not_sure', label: "I'm not sure", description: "We'll assume intestate for safety" }
            ],
            helpText: 'A will is a legal document that specifies how a person\'s assets should be distributed after death. If you\'re not sure, select "I\'m not sure" and we\'ll use conservative defaults.'
        },
        {
            id: 'hasTrust',
            question: 'Was there a trust?',
            subtext: 'A legal arrangement for managing assets outside of probate',
            options: [
                { value: 'yes', label: 'Yes', description: 'Trust exists' },
                { value: 'no', label: 'No', description: 'No trust exists' },
                { value: 'not_sure', label: "I'm not sure", description: "We'll assume no trust for safety" }
            ],
            helpText: 'A trust is a legal arrangement where a trustee manages assets for beneficiaries. Trusts can avoid probate and provide more control over asset distribution.'
        },
        {
            id: 'hasTODDeed',
            question: 'Are there Transfer-on-Death deeds?',
            subtext: 'Property transfers that bypass probate through beneficiary designation',
            options: [
                { value: 'yes', label: 'Yes', description: 'TOD deeds exist' },
                { value: 'no', label: 'No', description: 'No TOD deeds' },
                { value: 'not_sure', label: "I'm not sure", description: "We'll assume none exist" }
            ],
            helpText: 'Transfer-on-Death (TOD) deeds allow real estate to transfer directly to named beneficiaries without going through probate.'
        },
        {
            id: 'hasContest',
            question: 'Is there any dispute or contest?',
            subtext: 'Challenges to the will, trust, or asset distribution',
            options: [
                { value: 'yes', label: 'Yes', description: 'Legal challenges exist' },
                { value: 'no', label: 'No', description: 'No disputes' },
                { value: 'not_sure', label: "I'm not sure", description: "We'll assume no contest" }
            ],
            helpText: 'Contests include challenges to the validity of a will, trust disputes, or disagreements among heirs about asset distribution.'
        },
        {
            id: 'isOutOfState',
            question: 'Are there out-of-state assets?',
            subtext: 'Property or assets located in a different state than the deceased',
            options: [
                { value: 'yes', label: 'Yes', description: 'Assets in other states' },
                { value: 'no', label: 'No', description: 'All assets in home state' },
                { value: 'not_sure', label: "I'm not sure", description: "We'll assume all in-state" }
            ],
            helpText: 'Out-of-state assets may require additional legal proceedings in those states, known as ancillary probate.'
        }
    ];

    // Calculate path in real-time as user answers questions
    useEffect(() => {
        if (currentStep > 0 && currentStep < questions.length) {
            const result = determinePath(answers, state);
            setPathResult(result);
        }
    }, [answers, currentStep, state, questions.length]);

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
        setError(null);
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Final step - show results
            const result = determinePath(answers, state);
            setPathResult(result);
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleConfirmPath = async () => {
        if (!pathResult) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Update estate with the determined path
            await api.updateMyEstate({
                authorityType: pathResult.pathId,
                hasWill: answers.hasWill === 'yes',
                isTrustRevocable: answers.trustType === 'revocable',
                hasTODDeed: answers.hasTODDeed === 'yes',
                hasContest: answers.hasContest === 'yes',
                isOutOfState: answers.isOutOfState === 'yes',
                isSpouse: answers.isSpouse === 'yes',
                hasInsolvencyRisk: answers.debtStatus === 'insolvent'
            });

            // Invalidate relevant queries
            await queryClient.invalidateQueries({ queryKey: ['estate'] });
            await queryClient.invalidateQueries({ queryKey: ['roadmap'] });

            // Navigate to dashboard
            navigate('/dashboard', {
                state: {
                    message: `Your path has been set to: ${pathResult.pathLabel}`,
                    messageType: 'success'
                }
            });

            onComplete?.();
        } catch (err) {
            console.error('Error updating estate:', err);
            setError('Failed to save your selections. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReassess = () => {
        setCurrentStep(0);
        setPathResult(null);
        setError(null);
    };

    const progress = Math.round((currentStep / questions.length) * 100);

    if (currentStep === questions.length + 1) {
        // Results view
        return (
            <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
                <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Path Assessment Complete
                    </h1>
                    <p className="text-gray-600">
                        Based on your answers, we've determined the best path for your situation.
                    </p>
                </div>

                {pathResult && (
                    <PathResultCard
                        path={pathResult}
                        onConfirm={handleConfirmPath}
                        onReassess={handleReassess}
                    />
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Error:</span>
                        </div>
                        <p className="text-red-700 mt-1">{error}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
            {/* Progress Header */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {currentStep === questions.length
                                    ? "Review Your Path"
                                    : `Question ${currentStep + 1} of ${questions.length}`}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                {currentStep === questions.length
                                    ? "Based on your answers, here's your recommended path"
                                    : "Answer these questions to determine your best path"}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                                {pathResult?.pathLabel || 'Path TBD'}
                            </div>
                            <div className="text-xs text-gray-500">
                                Confidence: {pathResult?.confidence || 0}%
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Start</span>
                        <span>Complete</span>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Card>
                <CardContent className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 text-red-800">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium">Error:</span>
                            </div>
                            <p className="text-red-700 mt-1">{error}</p>
                        </div>
                    )}

                    {currentStep < questions.length ? (
                        // Question view
                        <GuidedQuestion
                            question={questions[currentStep].question}
                            subtext={questions[currentStep].subtext}
                            options={questions[currentStep].options}
                            value={answers[questions[currentStep].id as keyof typeof answers]}
                            onChange={(value) => handleAnswer(questions[currentStep].id, value)}
                            helpText={questions[currentStep].helpText}
                        />
                    ) : (
                        // Summary view
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-700">
                                <HelpCircle className="w-5 h-5" />
                                <span className="font-medium">Summary</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Your Answers</h4>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <div>Will: <span className="font-medium">{answers.hasWill}</span></div>
                                        <div>Trust: <span className="font-medium">{answers.hasTrust}</span></div>
                                        <div>TOD Deed: <span className="font-medium">{answers.hasTODDeed}</span></div>
                                        <div>Contest: <span className="font-medium">{answers.hasContest}</span></div>
                                        <div>Out-of-State: <span className="font-medium">{answers.isOutOfState}</span></div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">Recommended Path</h4>
                                    {pathResult ? (
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <div>Path: <span className="font-medium">{pathResult.pathLabel}</span></div>
                                            <div>Complexity: <span className="font-medium">{pathResult.complexity}</span></div>
                                            <div>Timeline: <span className="font-medium">{pathResult.timeline}</span></div>
                                            <div>Confidence: <span className="font-medium">{pathResult.confidence}%</span></div>
                                        </div>
                                    ) : (
                                        <div className="text-blue-600">Calculating...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0 || isSubmitting}
                >
                    Back
                </Button>

                <div className="flex gap-3">
                    {currentStep < questions.length && (
                        <Button
                            variant="outline"
                            onClick={handleReassess}
                            disabled={isSubmitting}
                        >
                            Start Over
                        </Button>
                    )}

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {currentStep === questions.length ? 'Review Path' : 'Next Question'}
                    </Button>
                </div>
            </div>
        </div>
    );
}