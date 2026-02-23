import { useState, useEffect, useMemo } from 'react';
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
import { OnboardingPersistence } from '@/lib/onboardingPersistence';

interface EnhancedOnboardingWizardProps {
    onComplete?: () => void;
    className?: string;
}

/**
 * All dimensions captured from Estate_Path_Combinations_All_50_States.xlsx:
 *   Will (hasWill)
 *   Trust Type (hasTrust + trustType: revocable/irrevocable)
 *   TOD Deed (hasTODDeed)
 *   Contested (hasContest)
 *   Surviving Spouse (isSpouse)
 *   Out of State Property (isOutOfState)
 *   Debt Status (debtStatus: solvent/insolvent)
 *
 * These 7 dimensions produce 7 primary path outcomes:
 *   1. General Probate Administration
 *   2. Intestate Probate
 *   3. Trust Administration (Revocable Living Trust)
 *   4. Irrevocable Trust Administration
 *   5. Ancillary Probate Required
 *   6. Contested Probate Litigation
 *   7. Insolvent Estate Administration
 */

type AnswerTristate = 'yes' | 'no' | 'not_sure';
type TrustTypeValue = 'revocable' | 'irrevocable' | 'not_sure';
type DebtStatusValue = 'solvent' | 'insolvent' | 'not_sure';

interface WizardAnswers {
    hasWill: AnswerTristate;
    hasTrust: AnswerTristate;
    trustType: TrustTypeValue;
    hasTODDeed: AnswerTristate;
    hasContest: AnswerTristate;
    isSpouse: AnswerTristate;
    isOutOfState: AnswerTristate;
    debtStatus: DebtStatusValue;
}

interface QuestionDef {
    id: keyof WizardAnswers;
    question: string;
    subtext: string;
    options: { value: string; label: string; description: string }[];
    helpText: string;
}

const BASE_QUESTIONS: QuestionDef[] = [
    {
        id: 'hasWill',
        question: 'Was there a valid will?',
        subtext: 'A legal document that specifies how assets should be distributed',
        options: [
            { value: 'yes', label: 'Yes', description: 'A signed, witnessed will exists' },
            { value: 'no', label: 'No', description: 'No will was found (intestate estate)' },
            { value: 'not_sure', label: "Not sure", description: "We'll assume no will (conservative)" }
        ],
        helpText: 'A will is a legal document specifying how assets should be distributed after death. Without a will the estate is "intestate" and follows state succession laws.'
    },
    {
        id: 'hasTrust',
        question: 'Was there a trust?',
        subtext: 'A legal arrangement allowing assets to pass outside of probate',
        options: [
            { value: 'yes', label: 'Yes', description: 'A trust document exists' },
            { value: 'no', label: 'No', description: 'No trust exists' },
            { value: 'not_sure', label: "Not sure", description: "We'll assume no trust for safety" }
        ],
        helpText: 'A trust is a legal arrangement where a trustee manages assets for beneficiaries, usually avoiding probate. If a trust exists, knowing whether it is revocable or irrevocable significantly changes the process.'
    },
    // trustType is injected conditionally AFTER hasTrust when hasTrust === 'yes'
    {
        id: 'hasTODDeed',
        question: 'Are there Transfer-on-Death (TOD) deeds on any real property?',
        subtext: 'Deeds that transfer property directly to named beneficiaries at death',
        options: [
            { value: 'yes', label: 'Yes', description: 'TOD deeds exist on one or more properties' },
            { value: 'no', label: 'No', description: 'No TOD deeds recorded' },
            { value: 'not_sure', label: "Not sure", description: "We'll assume none exist" }
        ],
        helpText: 'Transfer-on-Death deeds let real estate transfer directly to named beneficiaries without going through probate. Many states now recognize them. Check the recorded deeds for the property.'
    },
    {
        id: 'isSpouse',
        question: 'Is there a surviving spouse?',
        subtext: 'A living husband or wife at the time of death',
        options: [
            { value: 'yes', label: 'Yes', description: 'Deceased was married and spouse survived' },
            { value: 'no', label: 'No', description: 'No surviving spouse' },
            { value: 'not_sure', label: "Not sure", description: "We'll assume no surviving spouse" }
        ],
        helpText: 'A surviving spouse often has special rights: spousal petitions, elective share, community property rights, homestead rights, and family allowances. This significantly affects the process and timeline.'
    },
    {
        id: 'hasContest',
        question: 'Is there any dispute or contest?',
        subtext: 'Legal challenges to the will, trust, or asset distribution',
        options: [
            { value: 'yes', label: 'Yes', description: 'Challenges or disputes exist or are anticipated' },
            { value: 'no', label: 'No', description: 'No disputes among heirs or creditors' },
            { value: 'not_sure', label: "Not sure", description: "We'll assume no contest for now" }
        ],
        helpText: 'Contests include will validity challenges, trust disputes, heir disagreements, or creditor conflicts. A contested estate requires probate litigation and significantly extends the timeline to 12–24+ months.'
    },
    {
        id: 'isOutOfState',
        question: 'Are there assets located in other states?',
        subtext: 'Property or accounts in a different state than where the deceased lived',
        options: [
            { value: 'yes', label: 'Yes', description: 'Real estate or assets in other states' },
            { value: 'no', label: 'No', description: 'All assets are in the home state' },
            { value: 'not_sure', label: "Not sure", description: "We'll assume all assets are in-state" }
        ],
        helpText: 'Out-of-state real property (land, houses) usually requires an ancillary probate proceeding in that state in addition to the primary proceeding in the home state. Bank accounts and financial assets can often be handled through the primary proceeding.'
    },
    {
        id: 'debtStatus',
        question: 'Does the estate have more debts than assets?',
        subtext: 'Whether total liabilities exceed total assets (insolvent estate)',
        options: [
            { value: 'solvent', label: 'No — assets exceed debts', description: 'Estate appears solvent' },
            { value: 'insolvent', label: 'Yes — debts exceed assets', description: 'Estate may be insolvent' },
            { value: 'not_sure', label: "Not sure yet", description: "We'll assume solvent; you can update this later" }
        ],
        helpText: 'An insolvent estate (debts exceed assets) requires a completely different process: creditors must be paid in a specific legal priority order, distributions to heirs are suspended, and court oversight is typically required. This is critical to identify early.'
    },
];

// Conditional trust type question injected after hasTrust when answer is 'yes'
const TRUST_TYPE_QUESTION: QuestionDef = {
    id: 'trustType',
    question: 'Is the trust revocable or irrevocable?',
    subtext: 'The trust type determines the administration process and tax treatment',
    options: [
        { value: 'revocable', label: 'Revocable (Living Trust)', description: 'Could be changed or revoked during lifetime' },
        { value: 'irrevocable', label: 'Irrevocable', description: 'Could NOT be changed after signing' },
        { value: 'not_sure', label: "Not sure", description: "We'll treat it as revocable (conservative)" }
    ],
    helpText: 'Revocable living trusts are the most common and become irrevocable at death. Irrevocable trusts were fixed during the grantor\'s lifetime. The trust document will state which type it is. This distinction affects taxes, court involvement, and distribution rules.'
};

export function EnhancedOnboardingWizard({ onComplete, className }: EnhancedOnboardingWizardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [answers, setAnswers] = useState<WizardAnswers>({
        hasWill: 'not_sure',
        hasTrust: 'not_sure',
        trustType: 'not_sure',
        hasTODDeed: 'not_sure',
        hasContest: 'not_sure',
        isSpouse: 'not_sure',
        isOutOfState: 'not_sure',
        debtStatus: 'not_sure',
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [pathResult, setPathResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: estateForState } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        retry: false,
    });
    const state = estateForState?.deceasedState || location.state?.state || user?.state || '';

    // Build adaptive question list based on current answers.
    // The trust type question is injected ONLY when hasTrust === 'yes'.
    const questions = useMemo<QuestionDef[]>(() => {
        const list: QuestionDef[] = [];
        for (const q of BASE_QUESTIONS) {
            list.push(q);
            // Inject trust type question immediately after hasTrust if answer is yes
            if (q.id === 'hasTrust' && answers.hasTrust === 'yes') {
                list.push(TRUST_TYPE_QUESTION);
            }
        }
        return list;
    }, [answers.hasTrust]);

    // Restore saved session on mount
    useEffect(() => {
        const savedSession = OnboardingPersistence.getSession();
        if (savedSession) {
            setAnswers(savedSession.answers as WizardAnswers);
            setCurrentStep(savedSession.currentStep);
            setPathResult(savedSession.pathResult);
        }
    }, []);

    // Save session whenever state changes
    useEffect(() => {
        OnboardingPersistence.saveSession({ answers, currentStep, pathResult });
    }, [answers, currentStep, pathResult]);

    // Calculate path in real-time as user progresses
    useEffect(() => {
        if (currentStep > 0) {
            const result = determinePath(answers as any, state);
            setPathResult(result);
        }
    }, [answers, currentStep, state]);

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        setError(null);

        // When hasTrust changes away from 'yes', reset trustType
        if (questionId === 'hasTrust' && value !== 'yes') {
            setAnswers(prev => ({ ...prev, hasTrust: value as AnswerTristate, trustType: 'not_sure' }));
        }
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Final step — show results
            const result = determinePath(answers as any, state);
            setPathResult(result);
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    /**
     * Resolve isTrustRevocable:
     * - undefined  when no trust (hasTrust !== 'yes')
     * - true       when trust is explicitly revocable
     * - false      when trust is explicitly irrevocable
     * - undefined  when trust type is not_sure (conservative: treated as revocable in engine)
     */
    const resolveIsTrustRevocable = (): boolean | undefined => {
        if (answers.hasTrust !== 'yes') return undefined;
        if (answers.trustType === 'revocable') return true;
        if (answers.trustType === 'irrevocable') return false;
        return undefined; // not_sure → engine defaults to revocable (conservative)
    };

    const handleConfirmPath = async () => {
        if (!pathResult) return;
        setIsSubmitting(true);
        setError(null);

        try {
            await api.updateMyEstate({
                authorityType: pathResult.pathId,
                hasWill: answers.hasWill === 'yes',
                isTrustRevocable: resolveIsTrustRevocable(),
                hasTODDeed: answers.hasTODDeed === 'yes',
                hasContest: answers.hasContest === 'yes',
                isOutOfState: answers.isOutOfState === 'yes',
                // Surviving spouse — maps to isSurvivingSpouse in estate schema
                isSurvivingSpouse: answers.isSpouse === 'yes',
                // Insolvency risk stored on estate
                hasInsolvencyRisk: answers.debtStatus === 'insolvent',
                // CRITICAL: Save the jurisdiction state so roadmap, forms, and deadlines use the correct state
                deceasedState: state,
                name: `${user?.fullName || 'User'}'s Estate`,
                deceasedDateOfDeath: new Date().toISOString(),
            });

            await queryClient.invalidateQueries({ queryKey: ['estate'] });
            await queryClient.invalidateQueries({ queryKey: ['roadmap'] });

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

    // Results view
    if (currentStep === questions.length + 1) {
        return (
            <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
                <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Path Assessment Complete</h1>
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
                                    : "Answer these questions to determine your best path forward"}
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
                        <GuidedQuestion
                            question={questions[currentStep].question}
                            subtext={questions[currentStep].subtext}
                            options={questions[currentStep].options}
                            value={answers[questions[currentStep].id as keyof WizardAnswers]}
                            onChange={(value) => handleAnswer(questions[currentStep].id, value)}
                            helpText={questions[currentStep].helpText}
                        />
                    ) : (
                        // Summary view before final confirmation
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-700">
                                <HelpCircle className="w-5 h-5" />
                                <span className="font-medium">Your Answers Summary</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Estate Details</h4>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <div className="flex justify-between">
                                            <span>Will:</span>
                                            <span className="font-medium capitalize">{answers.hasWill.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Trust:</span>
                                            <span className="font-medium capitalize">{answers.hasTrust.replace('_', ' ')}</span>
                                        </div>
                                        {answers.hasTrust === 'yes' && (
                                            <div className="flex justify-between pl-4 text-xs text-gray-500">
                                                <span>Trust Type:</span>
                                                <span className="font-medium capitalize">{answers.trustType.replace('_', ' ')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>TOD Deed:</span>
                                            <span className="font-medium capitalize">{answers.hasTODDeed.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Surviving Spouse:</span>
                                            <span className="font-medium capitalize">{answers.isSpouse.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Contested:</span>
                                            <span className="font-medium capitalize">{answers.hasContest.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Out-of-State Assets:</span>
                                            <span className="font-medium capitalize">{answers.isOutOfState.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Debt Status:</span>
                                            <span className={cn("font-medium capitalize", answers.debtStatus === 'insolvent' && "text-red-600")}>
                                                {answers.debtStatus.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-3">Recommended Path</h4>
                                    {pathResult ? (
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <div className="flex justify-between">
                                                <span>Path:</span>
                                                <span className="font-medium">{pathResult.pathLabel}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Complexity:</span>
                                                <span className={cn("font-medium",
                                                    pathResult.complexity === 'Complex' && "text-red-700",
                                                    pathResult.complexity === 'Simple' && "text-green-700"
                                                )}>
                                                    {pathResult.complexity}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Timeline:</span>
                                                <span className="font-medium">{pathResult.timeline}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Confidence:</span>
                                                <span className="font-medium">{pathResult.confidence}%</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-blue-600">Calculating...</div>
                                    )}

                                    {/* Warn on insolvent */}
                                    {answers.debtStatus === 'insolvent' && (
                                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                            ⚠️ Insolvent estate detected. Creditor priority rules apply. No distributions until debts are resolved.
                                        </div>
                                    )}
                                    {/* Warn on contest */}
                                    {answers.hasContest === 'yes' && (
                                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                            ⚠️ Contested estate. Litigation may extend the timeline to 12–24+ months.
                                        </div>
                                    )}
                                    {/* Warn on out of state */}
                                    {answers.isOutOfState === 'yes' && (
                                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                            ⚠️ Out-of-state assets may require ancillary probate proceedings in each state.
                                        </div>
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
                        {currentStep === questions.length ? 'Confirm Path' : 'Next →'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
