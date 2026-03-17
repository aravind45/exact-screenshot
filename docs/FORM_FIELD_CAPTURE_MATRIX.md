# Form Field Capture Matrix

Date: 2026-03-17

## Purpose

This document is the current single source of truth for which probate form fields are:

- already captured in the application
- derived/computed from existing data
- still handled as manual overrides
- blocked by schema or model mismatches

It is based on:

- `prisma/schema.prisma`
- `server/routes/estateRoutes.ts`
- `server/services/*FormRegistry.ts`
- `server/services/DocumentService.ts`
- `src/lib/api.ts`
- key UI entry points such as `src/pages/ProbatePetition.tsx`

## Status Legend

- `captured`: persisted and available in the current app model
- `computed`: not directly stored, but derived from stored assets, heirs, or estate data
- `manual override`: intentionally supplied per-form at generation time
- `gap`: expected by a form flow but not cleanly captured/persisted today
- `migration pending`: implemented in code, but requires the new database migration to be applied
- `audit pending`: legacy form exists, but field-level capture has not yet been normalized into this matrix

## Scope

Included in this first pass:

- California registry-backed forms: `DE-111`, `DE-160`, `DE-310`
- California key legacy generators: `DE-121`, `DE-120`, `DE-150`, `DE-221`, `DE-226`, `DE-174`
- New York registry-backed forms: `ET-1`, `ET-2`, `ET-3`, `ET-8`, `ET-13`
- Texas registry-backed forms: `TX-1` through `TX-12`
- Florida registry-backed forms: `FL-1` through `FL-15`
- New Jersey registry-backed forms: `NJ-1`, `NJ-2`

Legacy California generators still needing a second-pass field audit:

- `DE-315`, `DE-350`, `DE-351`, `DE-142`, `DE-143`, `DE-154`, `DE-115`, `DE-116`, `DE-295`, `DE-165`, `DE-260`, `DE-265`

## Shared Foundation Fields

These fields are reused across most modern form registries and should be treated as the baseline capture layer.

| Field | Source | Status | Backing model / path | Notes |
| --- | --- | --- | --- | --- |
| `user.fullName` | User | captured | `User.fullName` | Shared petitioner/applicant name |
| `user.address` | User | captured | `User.address` | Used by CA, NY, TX, FL, NJ headers |
| `user.city` | User | captured | `User.city` | Used by NY, TX, FL headers |
| `user.state` | User | captured | `User.state` | Used by NY, TX, FL headers |
| `user.zip` | User | captured | `User.zip` | Used by NY, TX, FL headers |
| `user.personalEmail` | User | captured | `User.personalEmail` | Used by NY, TX, FL headers |
| `estate.petitionerPhone` | Estate | captured | `Estate.petitionerPhone` | Shared phone field |
| `estate.deceasedFirstName` | Estate | captured | `Estate.deceasedFirstName` | Combined into decedent name |
| `estate.deceasedLastName` | Estate | captured | `Estate.deceasedLastName` | Combined into decedent name |
| `decedentName` | computed | computed | first + last name | Shared computed field |
| `estate.deceasedDateOfDeath` | Estate | captured | `Estate.deceasedDateOfDeath` | Shared date of death |
| `estate.deceasedState` | Estate | captured | `Estate.deceasedState` | Used directly by NY and generic flows |
| `estate.probateCounty` | Estate | captured | `Estate.probateCounty` | Shared county / court county |
| `estate.courtCaseNumber` | Estate | captured | `Estate.courtCaseNumber` | Shared case number |
| `estate.hasWill` | Estate | captured | `Estate.hasWill` | Shared will logic |
| `estate.willDate` | Estate | captured | `Estate.willDate` | Used by CA, NY, TX |
| `estate.estimatedPersonalProperty` | Estate | captured | `Estate.estimatedPersonalProperty` | Used directly and in computed totals |
| `estate.estimatedRealProperty` | Estate | captured | `Estate.estimatedRealProperty` | Used directly and in computed totals |
| `estate.estimatedAnnualIncome` | Estate | captured | `Estate.estimatedAnnualIncome` | Used by DE-111 |
| `estate.bondAmount` | Estate | captured | `Estate.bondAmount` | Used by DE-111 |
| `estate.bondWaived` | Estate | captured | `Estate.bondWaived` | Used by DE-111 |
| `estate.estimatedLiabilities` | Estate | captured | `Estate.estimatedLiabilities` | Used by TX-7 |
| `estate.administrationType` | Estate | captured | `Estate.administrationType` | Used by Texas forms |
| `estate.isSurvivingSpouse` | Estate | captured | `Estate.isSurvivingSpouse` | Current spouse/survivor flag |
| `assets` | Asset | captured | `Asset[]` | Drives inventory/accounting totals |
| `heirs` | Heir | captured | `Heir[]` | Drives heir summaries and beneficiary lists |
| `inventory totals` | computed | computed | from assets | Used by DE-160, DE-310, ET-8, TX-7, FL inventory/accounting flows |
| `heir summary` | computed | computed | from heirs | Used by ET-2, TX-2, TX-11, FL-2, generic forms |
| `hearingDate` | Estate | captured | `Estate.hearingDate` | Used by DE-121, DE-120 |
| `hearingTime` | Estate | captured | `Estate.hearingTime` | Used by DE-121, DE-120 |
| `hearingDept` | Estate | captured | `Estate.hearingDept` | Used by DE-121, DE-120 |
| `hearingAddress` | Estate | captured | `Estate.hearingAddress` | Used by DE-121, DE-120 |

## Cross-Form Gaps And Mismatches

These show up in multiple forms and should be prioritized before model tuning or annotation.

| Field / concept | Current state | Status | Affected forms | Notes |
| --- | --- | --- | --- | --- |
| `publicationNewspaper` | Added to Prisma, route schema, and client typing | migration pending | `DE-111`, notices flow | Requires the new estate migration to be applied |
| `hasCodicil` / `codicilDate` | Normalized from canonical `codicilDates[]` in server responses and updates | captured | `DE-111` | Singular UI fields now map to stored array format |
| `petitionerEmail` on estate | Legacy generators now fall back to `user.personalEmail` | captured | `DE-111`, `DE-221` | Dedicated estate-level field still not normalized, but runtime fallback now exists |
| Attorney detail fields | Used by legacy CA generators | gap | `DE-111`, `DE-221` | `attorneyName`, `attorneyFirm`, `attorneyAddress`, `attorneyPhone`, `attorneyBarNumber` are not normalized on `Estate` |
| Surviving spouse alias | Server normalization now exposes `isSpouse` from `isSurvivingSpouse` | captured | `DE-221` | Canonical stored field remains `isSurvivingSpouse` |
| `deceasedAddress` | Added to Prisma and route schema | migration pending | `NJ-1` | Requires the new estate migration to be applied |
| `administrationType` client typing | Added to the main client `Estate` type | captured | `TX-1`, `TX-3` | Prisma and client typing are now aligned |

## California

### Registry-backed forms

| Form | Additional fields beyond shared foundation | Status |
| --- | --- | --- |
| `DE-111` | `valuePersonalProperty`, `valueRealProperty`, `valueAnnualIncome`, `bondWaived`, `bondAmount` | captured |
| `DE-111` | `publicationNewspaper` | migration pending |
| `DE-111` | `hasCodicil`, `codicilDate` | captured |
| `DE-111` | attorney contact block | gap |
| `DE-160` | `inventoryType` | manual override |
| `DE-160` | `totalAttachment1`, `totalAttachment2`, `totalInventory`, `appraisalDate` | computed |
| `DE-310` | `realPropertyDescription` | manual override |
| `DE-310` | `realPropertyValue` | manual override |
| `DE-310` | `successionBasis` | manual override |
| `DE-310` | `totalInventoryValue`, `statutoryFee` | computed |

### Key legacy California forms

| Form | Important fields | Status |
| --- | --- | --- |
| `DE-121` | hearing date, time, department, address | captured |
| `DE-120` | hearing date, time, department, address | captured |
| `DE-150` | `iaeaType`, `appointedDate` | captured |
| `DE-221` | `isSurvivingSpouse` / spouse indicator | captured |
| `DE-221` | petitioner email fallback | captured |
| `DE-221` | attorney block | gap |
| `DE-226` | no special additional capture beyond baseline spouse/property context | partially captured |
| `DE-174` | liability name, amount, filed date, allowed amount, rejection reason, status | captured on `Liability` |

## New York

| Form | Additional fields beyond shared foundation | Status |
| --- | --- | --- |
| `ET-1` | `domicileCounty`, `domicileState`, `willDate` | captured |
| `ET-1` | `executorName`, `estimatedEstateValue` | computed |
| `ET-2` | `domicileCounty`, `domicileState` | captured |
| `ET-2` | `administratorName`, `heirSummary` | computed |
| `ET-3` | `foreignWillState` | manual override required |
| `ET-3` | `foreignCaseNumber` | manual override |
| `ET-3` | `ancillaryExecutor` | computed |
| `ET-8` | `inventoryDate`, `inventoryPreparedBy`, `totalRealProperty`, `totalPersonalProperty`, `totalEstateValue` | computed |
| `ET-13` | `distributionDate` | manual override |
| `ET-13` | `distributionPlan` | manual override required |
| `ET-13` | `totalEstateValue` | computed |

## Texas

| Form | Additional fields beyond shared foundation | Status |
| --- | --- | --- |
| `TX-1` | `willDate` | captured |
| `TX-1` | `independentAdministration` from `administrationType` | captured, but client typing gap |
| `TX-1` | `executorName`, `estimatedEstateValue` | computed |
| `TX-2` | `administratorName`, `heirSummary` | computed |
| `TX-3` | `independentAdministration` from `administrationType` | captured, but client typing gap |
| `TX-3` | `willDate` | captured |
| `TX-3` | `executorName` | computed |
| `TX-4` | `orderDate`, `executorName` | computed |
| `TX-5` | `executorName` | computed |
| `TX-6` | `administratorName` | computed |
| `TX-7` | `inventoryDate`, `totalRealProperty`, `totalPersonalProperty`, `totalEstateValue` | computed |
| `TX-7` | `claimsOwed` from `estimatedLiabilities` | captured |
| `TX-8` | `accountPeriodStart`, `accountPeriodEnd`, `totalReceipts`, `totalDisbursements`, `netBalance` | manual override |
| `TX-9` | `finalDistributionDate` | manual override |
| `TX-9` | `distributionPlan` | manual override required |
| `TX-9` | `totalEstateValue` | computed |
| `TX-10` | `accountPeriodStart`, `accountPeriodEnd`, `totalReceipts`, `totalDisbursements`, `finalBalance` | manual override |
| `TX-11` | `smallEstateValue`, `heirSummary` | computed |
| `TX-12` | `willDate` | captured |
| `TX-12` | `executorName` | computed |
| `TX-12` | `propertyDescription` | manual override required |

## Florida

| Form | Additional fields beyond shared foundation | Status |
| --- | --- | --- |
| `FL-1` | `testamentary` from `hasWill`, `intestate`, `personalRepresentativeName`, `estimatedEstateValue` | captured + computed |
| `FL-2` | `smallEstateValue`, `heirSummary` | computed |
| `FL-2` | `summaryAdministrationBasis` | manual override required |
| `FL-3` | `noticeDate`, `personalRepresentativeName` | computed |
| `FL-3` | `creditorClaimDeadline` | manual override |
| `FL-4` | `personalRepresentativeName`, `oathDate` | computed |
| `FL-5` | `personalRepresentativeName` | computed |
| `FL-6` | `inventoryDate`, `totalRealProperty`, `totalPersonalProperty`, `totalEstateValue` | computed |
| `FL-7` | `noticeDate`, `personalRepresentativeName` | computed |
| `FL-7` | `creditorClaimDeadline` | manual override |
| `FL-8` | `creditorName`, `claimAmount`, `claimBasis` | manual override required |
| `FL-9` | `creditorName`, `claimAmount`, `objectionReason` | manual override |
| `FL-10` | `accountingPeriodStart`, `accountingPeriodEnd`, `totalReceipts`, `totalDisbursements`, `netBalance` | manual override |
| `FL-11` | `finalDistributionDate` | manual override |
| `FL-11` | `distributionPlan` | manual override required |
| `FL-11` | `totalEstateValue` | computed |
| `FL-12` | `accountingPeriodStart`, `accountingPeriodEnd`, `totalReceipts`, `totalDisbursements`, `finalBalance` | manual override |
| `FL-13` | `beneficiaryName`, `distributionAmount` | manual override required |
| `FL-13` | `releaseDate` | computed |
| `FL-14` | `smallEstateValue` | computed |
| `FL-14` | `claimantName`, `relationshipToDecedent` | manual override required |
| `FL-15` | `propertyAddress`, `propertyValue`, `survivingSpouseName` | manual override required |
| `FL-15` | `minorChildNames` | manual override |

## New Jersey

| Form | Additional fields beyond shared foundation | Status |
| --- | --- | --- |
| `NJ-1` | `decedentResidence` from `deceasedAddress` | migration pending |
| `NJ-1` | `hasWill` | captured |
| `NJ-2` | no additional fields beyond baseline | captured |

## Generic Fallback Forms

These are used when a state does not have a dedicated form service.

| Generic form | Additional fields beyond shared foundation | Status |
| --- | --- | --- |
| `PROBATE_PETITION` | estimated estate value | computed |
| `ADMINISTRATION_PETITION` | administrator name, heir summary, estimated estate value | computed |
| `INVENTORY` | inventory date and totals | computed |
| `SMALL_ESTATE_AFFIDAVIT` | estate value, heir summary | computed |

## Recommended Next Fix Order

1. Apply the new estate-field migration and backfill where needed:
   `publicationNewspaper`, `deceasedAddress`
2. Promote this matrix into a machine-readable checklist:
   add columns for `persisted`, `captured_in_ui`, `generator_uses`, `registry_uses`, `needs_migration`
3. Upgrade readiness rules:
   current readiness is still much looser than true filing readiness for several forms
4. Audit the remaining California legacy generators:
   `DE-315`, `DE-350`, `DE-351`, `DE-142`, `DE-143`, `DE-154`, `DE-115`, `DE-116`, `DE-295`, `DE-165`, `DE-260`, `DE-265`
