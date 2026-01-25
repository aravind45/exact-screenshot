# California Probate DE-111 Auto-Fill Strategy

## 1. Executive Summary
This document outlines the technical architecture to automate the generation of **Form DE-111 (Petition for Probate)**. The goal is to reduce user cognitive load by transforming a complex legal form into a series of plain-English questions, backed by a deterministic data mapping engine.

## 2. Canonical Data Model (Schema)
To support DE-111 and future forms (DE-121, DE-150), we must expand the `Estate` schema.

### New / Expanded Entities
*   **`Heir`**: Represents beneficiaries and family members.
    *   Fields: `name`, `relationship`, `age`, `isAdult`, `address`.
*   **`Petitioner`**: Metadata about the person filing (if different from generic User).
    *   Fields: `isAttorney`, `phone`, `qualification` (e.g., "Nominated in Will").
*   **`WillDetails`**: Specifics about the will.
    *   Fields: `hasWill`, `dateOfWill`, `isSelfProving`, `codicilDates`.
*   **`ProbateConfig`**: Configuration for the legal process.
    *   Fields: `bondAmount`, `bondWaiverSubmitted`, `publicationNewspaper`.

### Database Schema Projection (Prisma)
```prisma
model Estate {
  // ... existing fields ...
  
  // Expanded Petitioner Info
  petitionerPhone   String?
  petitionerIsAttorney Boolean @default(false)
  
  // Will Info
  hasWill           Boolean @default(false)
  willDate          DateTime?
  codicilDates      String[] // JSON array of dates
  
  // Financials (Auto-calculated from Assets but overridable)
  estimatedPersonalProperty Decimal?
  estimatedRealProperty     Decimal?
  estimatedAnnualIncome     Decimal?
  
  bondAmount        Decimal?
  bondWaived        Boolean @default(false)
  
  heirs             Heir[]
  
  // Form Status
  de111Status       String @default("NOT_STARTED") // DRAFT, REVIEW, SIGNED
}

model Heir {
  id          String @id @default(uuid())
  estateId    String
  name        String
  relationship String // "Spouse", "Child", "Grandchild"
  isAdult     Boolean @default(true)
  address     String?
  
  estate      Estate @relation(fields: [estateId], references: [id])
}
```

## 3. Auto-Mapping Logic
We map `Estate` data to PDF Fields (AcroFields).

| DE-111 Section | Source Data | Logic / Rules |
| :--- | :--- | :--- |
| **1. Petitioner** | `User` Profile | Map `fullName`, `address`. If `isAttorney` is true, fill Attorney box. |
| **2. Decedent** | `Estate` Core | Map `deceasedName`, `dateOfDeath`, `deceasedAddress`. |
| **3. Character of Case** | `Assets` Aggregation | Sum `Asset.value` where `probateType != NON_PROBATE`.<br>If `total < 184500`, flag strictly as warning (Small Estate?). |
| **4. Bond** | `WillDetails` + Rules | If `will.waivesBond` = true, check box 3d.<br>Else, calc value: `PersonalProp + AnnualIncome`. |
| **5. Heirs** | `Heir` Table | Generate "Attachment 8" if count > space on form.<br>Format: "Name (Relationship, Age)". |

## 4. Progressive Disclosure UX
We avoid showing the PDF until the end.

### Phase 1: Intake (The "Interview")
*   **Question**: "Did [Decedent] leave a will?" (Updates `hasWill`).
*   **Question**: "Who are the heirs?" (Updates `Heir` table).
*   **Question**: "Estimate total cash and personal property?" (Pre-filled from `Asset` ledger, user confirms).

### Phase 2: Silent Generation
*   Backend service uses `pdf-lib` to load `DE-111_Template.pdf`.
*   Injects data.
*   Handles "Overflow": If Heirs list is too long, generate `Attachment 8` page and merge.

### Phase 3: Review & Finalize
*   **Diff View**: Show summary of critical fields: "Bond Request: $0 (Waived)".
*   **Preview**: Render specific pages of the generated PDF for visual confirmation.
*   **Validation**: Block if "Bond" is required but calculated as $0 without waiver.

## 5. Technical Constraints & Mitigations
*   **PDF Coordinates**: Avoid coordinate-based filling. We must use **AcroFields** (Named fields).
    *   *Action*: We will use the officially labeled Judicial Council PDF.
    *   *Mitigation*: Write a script to dump all field names from the template to ensure mapping accuracy.
*   **Attachments**: Determining when to attach extra pages is complex.
    *   *Strategy*: MVP will limit Heirs to the space available on Form (usually 6-8). Large estates trigger "Download Attachment Template" manual step for V1.

## 6. Implementation Plan
1.  **Schema Migration**: Add `Heir` table and `Estate` fields.
2.  **PDF Service**: Create `src/lib/pdf/generator.ts` using `pdf-lib`.
3.  **UI Wizards**: Create `src/pages/probate/PetitionWizard.tsx`.
