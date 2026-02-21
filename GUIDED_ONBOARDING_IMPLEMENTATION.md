# Guided Onboarding Implementation

## Overview

This implementation transforms the existing onboarding wizard into a **Guided Clarification Layer** that replaces raw legal terms with decision prompts, adds "I'm Not Sure" options, implements progressive disclosure, and provides contextual examples to help users who don't understand legal intake fields.

## Key Features Implemented

### 1. ✅ Replace Raw Legal Terms With Decision Prompts

**Before:**
- "Was there a Trust?"
- "TOD Deed?"
- "Contested?"

**After:**
- "Did the deceased place assets into a living trust before death?"
- "Is there a recorded TOD deed for real property?"
- "Are there any active disputes or will contests?"

### 2. ✅ Add "I'm Not Sure" Option

Every critical field now includes three options:
- **Yes**
- **No** 
- **Not Sure**

**Engine behavior when "Not Sure":**
- Trust = Not Sure → Asks: "Do you have a trust document?"
- TOD = Not Sure → Asks: "Is the property deed labeled 'Transfer on Death'?"
- Will = Not Sure → Asks: "Was a signed will found?"
- Contested = Not Sure → Assumes No (until dispute arises)

### 3. ✅ Progressive Disclosure

Instead of showing all 7 parameters at once, the wizard now uses a **Quick Assessment** step that branches dynamically:

**Step 1:** Core Fork
- Was there a will?
- Was there a trust?

**Step 2:** Conditional Questions
- Only shows relevant follow-up questions
- Hides irrelevant fields

**Example:**
If Trust = Revocable → Hides Probate questions → Moves to Trust Admin track

### 4. ✅ Contextual Examples (Micro-Help)

Each question includes expandable explanations:

**TOD Deed?**
"Example: Some states allow real estate to pass automatically without probate if a TOD deed was recorded."

**Out-of-state property?**
"Example: A house in Nevada while primary residence is California."

### 5. ✅ Quick Assessment Mode

Users answer 5 simple questions to determine their path:
1. Was there a Will?
2. Did the deceased place assets into a living trust before death?
3. Are you the surviving spouse?
4. Any out-of-state property?
5. I am not sure who all the legal heirs are.

The system maps responses to the 13 canonical paths from the Excel matrix.

### 6. ✅ Conservative Routing Fallback

If users are unclear or select "Not Sure":
- System defaults to: "Likely Probate — we'll confirm as we go"
- Never blocks user progression due to legal nuance uncertainty
- Provides guidance and clarification prompts

### 7. ✅ Confidence Score Display

Shows users how confident the system is in their path:
- **80%+**: "High confidence - your path is clear!"
- **60-79%**: "Medium confidence - we may need more details as we go"
- **<60%**: "Low confidence - we'll help clarify as we proceed"

### 8. ✅ Document Upload-Based Auto-Detection (Framework)

The system is structured to support future auto-detection:
- Trust document → Auto detect trust administration
- Will → Flag testate probate
- Deed → Parse for TOD language

## Technical Implementation

### Enhanced Data Structure

```typescript
interface ClarificationField {
    value: boolean | null;        // true/false/null for "Not Sure"
    clarificationOpen: boolean;   // Toggle for help content
    clarificationAnswer: string;  // User's clarification input
}

interface GuidedFormData {
    hasWill: ClarificationField;
    isSpouse: ClarificationField;
    isOutOfState: ClarificationField;
    hasUnknownHeirs: ClarificationField;
    isTrustRevocable: ClarificationField;
    hasTODDeed: ClarificationField;
    hasContest: ClarificationField;
}
```

### New Wizard Steps

1. **Welcome & Role Selection** - Executor vs Heir
2. **Estate Basics** - Basic information collection
3. **Quick Assessment** - 5 guided questions with clarifications
4. **Your Path** - Shows recommendation with confidence score
5. **Heirs & Beneficiaries** - Family information
6. **Death Certificate** - Document upload
7. **Key Assets** - Asset discovery
8. **The Team** - Collaborator invitations
9. **Completion** - Final confirmation

### User Experience Flow

```
Welcome → Estate Basics → Quick Assessment → Path Recommendation → Completion
```

The Quick Assessment step is the core innovation, providing:
- **Decision prompts** instead of legal jargon
- **"Not Sure" options** for uncertain users
- **Expandable help** with examples
- **Confidence scoring** for transparency
- **Progressive disclosure** to avoid overwhelm

## Benefits

1. **Reduced Abandonment**: Users who don't understand legal terms can still proceed
2. **Improved Accuracy**: Clarification prompts help users provide better information
3. **Enhanced UX**: Progressive disclosure prevents information overload
4. **Increased Confidence**: Users see how confident the system is in their path
5. **Better Support**: Micro-help provides context without overwhelming

## Files Created/Modified

- **New**: `src/components/OnboardingGuidedWizard.tsx` - Complete guided onboarding implementation
- **New**: `src/components/__tests__/OnboardingGuidedWizard.test.tsx` - Comprehensive test suite
- **Reference**: `Estate_Path_Combinations_With_Complexity_Time.xlsx` - Used for path mapping logic

## Future Enhancements

The implementation provides a foundation for:
1. **Document Auto-Detection**: Upload analysis for automatic field population
2. **AI-Powered Clarification**: Natural language processing for user answers
3. **State-Specific Guidance**: Enhanced legal guidance based on jurisdiction
4. **Integration with Existing System**: Can replace or complement current onboarding

This implementation successfully addresses all requirements from the user specification while maintaining the existing system architecture and providing a superior user experience for estate settlement onboarding.