# SSOT Probate Engine — Architecture Documentation

## Overview

The Single Source of Truth (SSOT) Probate Engine is a normalized, production-grade relational system that serves as the authoritative data store for all 50-state U.S. probate rules, roadmaps, forms, accounting rules, tax obligations, and distribution rules powering [ExpectedEstate](https://www.expectedestate.com).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Console (React)                       │
│  /admin/probate-engine — Tabs: Overview | Jurisdictions |       │
│  Roadmaps | Forms | Rules | Gap Detection | Audit Log           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ api.ssot.*
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express API Layer  /api/ssot/*                      │
│  server/routes/ssotRoutes.ts  — 50+ REST endpoints              │
│  Auth: authenticate + isAdmin middleware                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ jurisdiction │ │   roadmap    │ │ formsAndTax  │
│  Service.ts  │ │  Service.ts  │ │  Service.ts  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │  gapDetection    │
              │   Service.ts     │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   dbClient.ts    │
              │ queryRows()      │
              │ executeSQL()     │
              │ logChange()      │
              └────────┬─────────┘
                       │ Prisma.$queryRawUnsafe
                       ▼
              ┌──────────────────┐
              │  PostgreSQL      │
              │  (Neon)          │
              │  ssot_* tables   │
              └──────────────────┘
```

## Database Schema (20+ Tables)

### Layer 1: Jurisdiction
| Table | Purpose |
|-------|---------|
| `ssot_jurisdictions` | 50 U.S. states + properties (community_property, upc_adopted, etc.) |
| `ssot_counties` | County-level data for jurisdictions requiring it |
| `ssot_court_types` | Court types available per jurisdiction |
| `ssot_probate_types` | Probate path types (Independent Admin, Muniment, Small Estate, etc.) |
| `ssot_jurisdiction_probate_types` | Junction: which probate types exist in which states |
| `ssot_statute_references` | Legal citations with URLs per jurisdiction |

### Layer 2: Roadmap / Workflow
| Table | Purpose |
|-------|---------|
| `ssot_probate_roadmaps` | One roadmap per jurisdiction+probate_type combo |
| `ssot_roadmap_phases` | Ordered phases within a roadmap (e.g., Filing, Hearing, Notice) |
| `ssot_roadmap_steps` | Ordered steps within phases, with estimated_days |
| `ssot_step_dependencies` | DAG of step prerequisites |

### Layer 3: Actions
| Table | Purpose |
|-------|---------|
| `ssot_step_actions` | Granular actions within steps (checklist, form_fill, upload, tip) |

### Layer 4: Forms
| Table | Purpose |
|-------|---------|
| `ssot_legal_forms` | Legal form catalog with codes, categories, filing fees |
| `ssot_form_versions` | Version history for form templates |
| `ssot_step_forms` | Junction: which forms are needed at which steps |

### Layer 5: Estate Structure
| Table | Purpose |
|-------|---------|
| `ssot_asset_types` | Asset type catalog (Real Property, Bank Accounts, etc.) |
| `ssot_asset_ownership_types` | Ownership types (Sole, Joint Tenancy, Community, etc.) |
| `ssot_probate_inclusion_rules` | Rules for whether assets pass through probate |
| `ssot_liability_types` | Liability categories with default priorities |
| `ssot_creditor_classes` | Jurisdiction-specific creditor priority classes |

### Layer 6: Accounting / Tax
| Table | Purpose |
|-------|---------|
| `ssot_accounting_rules` | Deadline, reporting, and bond rules per jurisdiction |
| `ssot_tax_obligations` | Federal/state tax filing requirements |
| `ssot_distribution_rules` | Intestacy, homestead, family allowance rules |

### Layer 7: Override & Audit
| Table | Purpose |
|-------|---------|
| `ssot_state_overrides` | JSON-patch overrides for state-specific variations |
| `ssot_change_logs` | Full audit trail: who changed what, when, with before/after snapshots |

## State Override Strategy

Instead of duplicating data per state, we use a **base + override** pattern:

1. **Base records** are stored in normalized tables (e.g., a "default" roadmap step)
2. **State overrides** in `ssot_state_overrides` apply JSON patches:
   ```json
   {
     "entity_type": "roadmap_step",
     "entity_id": "uuid-of-step",
     "jurisdiction_id": "uuid-of-TX",
     "override_data": { "estimated_days": 90, "description": "TX requires 90 days..." },
     "priority": 10
   }
   ```
3. At read time, overrides are merged with highest priority winning

## Publishing Controls

Every major entity supports a `status` field:
- `draft` — visible only in admin console
- `published` — live and available to users
- `archived` — soft-deleted, preserved for audit

Publishing actions are logged in `ssot_change_logs` with before/after snapshots.

## API Structure (50+ Endpoints)

All endpoints require authentication + ADMIN role.

### Stats & Gap Detection
- `GET /api/ssot/stats` — aggregate counts
- `GET /api/ssot/gaps` — 9-category gap analysis
- `GET /api/ssot/gaps/completeness` — per-state completeness %

### CRUD Endpoints (all follow REST pattern)
- `/api/ssot/jurisdictions` — GET, POST, PUT, POST /:id/publish
- `/api/ssot/probate-types` — GET, POST, PUT
- `/api/ssot/roadmaps` — GET, POST, PUT, GET /:id/full, POST /:id/publish
- `/api/ssot/phases` — POST, PUT, DELETE
- `/api/ssot/steps` — POST, PUT, DELETE
- `/api/ssot/actions` — POST, PUT, DELETE
- `/api/ssot/forms` — GET, POST, PUT
- `/api/ssot/asset-types` — GET, POST
- `/api/ssot/liability-types` — GET, POST
- `/api/ssot/accounting-rules` — GET, POST
- `/api/ssot/tax-obligations` — GET, POST
- `/api/ssot/distribution-rules` — GET, POST
- `/api/ssot/statute-references` — GET, POST
- `/api/ssot/change-logs` — GET (filterable)

## Admin Console UI

Located at `/admin/probate-engine` (ADMIN role only).

### Tabs:
1. **Overview** — stat cards for all entity counts
2. **Jurisdictions** — CRUD table with publish controls, property badges
3. **Roadmaps** — card grid with deep-drill viewer (phases → steps → actions)
4. **Forms** — sortable table with code, category, state, filing fee, status
5. **Rules** — accounting rules, tax obligations, distribution rules
6. **Gap Detection** — 9-category dashboard with color-coded cards, state completeness bars
7. **Audit Log** — timestamped change history with entity type, action, user, summary

## Gap Detection Categories

1. **Missing Jurisdictions** — states not yet in system (target: 50)
2. **Missing Roadmaps** — jurisdictions without any roadmap
3. **Empty Phases** — phases with zero steps
4. **Steps Without Actions** — steps lacking granular actions
5. **Missing Forms** — steps that should have forms but don't
6. **Orphaned Forms** — forms not linked to any step
7. **Unpublished Drafts** — content in draft status
8. **Missing Citations** — jurisdictions without statute references
9. **Incomplete Steps** — steps missing descriptions or estimates

## Seed Data

### Texas Vertical Slice (`scripts/seed-ssot-texas.ts`)
Complete example covering:
- 1 jurisdiction (TX) with community property, homestead protection
- 5 probate types (Independent Admin, Dependent Admin, Muniment, Small Estate, Affidavit of Heirship)
- 3 statute references
- 1 full roadmap: 7 phases, 28 steps, 10 actions
- 9 legal forms linked to steps
- 8 asset types, 6 liability types, 6 creditor classes
- 3 accounting rules, 3 tax obligations, 3 distribution rules

### Super Admin (`scripts/seed-ssot-admin.ts`)
Ensures `aravind45@gmail.com` has ADMIN role.

## Running

```bash
# 1. Apply migration
npx prisma db execute --file prisma/ssot-migration.sql

# 2. Seed admin user
npx tsx scripts/seed-ssot-admin.ts

# 3. Seed Texas data
npx tsx scripts/seed-ssot-texas.ts

# 4. Start server
npm run dev
# Navigate to /admin/probate-engine
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL (Neon) |
| ORM | Prisma (raw SQL via `$queryRawUnsafe` for SSOT tables) |
| API | Express.js + TypeScript |
| Frontend | React + Vite + shadcn/ui + TanStack Query |
| Auth | JWT + RBAC (ADMIN, ADVISOR, ATTORNEY, EXECUTOR, HEIR) |
| Hosting | Google Cloud Run |

## Design Decisions

1. **Raw SQL over Prisma models** — SSOT tables are a new governance layer that shouldn't be mixed with operational Prisma models. Raw SQL gives us full control over upserts, conflicts, and complex joins.

2. **UUID primary keys** — All tables use `gen_random_uuid()` for globally unique, non-sequential IDs.

3. **Audit-first** — Every mutation goes through `logChange()` which records entity_type, entity_id, action, user_id, before/after state, and summary.

4. **Publishing workflow** — Draft → Published → Archived lifecycle prevents accidental exposure of incomplete data.

5. **Gap detection as governance** — The gap detection system serves as a continuous quality check, ensuring content completeness across all 50 states before launch.

## File Inventory

```
prisma/ssot-migration.sql              — SQL DDL for 20+ tables
server/services/ssot/dbClient.ts       — Raw SQL helper + audit logging
server/services/ssot/jurisdictionService.ts — Jurisdiction CRUD
server/services/ssot/roadmapService.ts — Roadmap/Phase/Step/Action CRUD
server/services/ssot/formsAndTaxService.ts — Forms, Assets, Tax, Distribution CRUD
server/services/ssot/gapDetectionService.ts — Gap analysis + completeness
server/services/ssot/index.ts          — Barrel export
server/routes/ssotRoutes.ts            — 50+ REST endpoints
src/lib/api.ts                         — Frontend API client (api.ssot.*)
src/pages/admin/SSOTProbateEngine.tsx   — Admin Console UI
scripts/seed-ssot-texas.ts             — Texas vertical slice seed
scripts/seed-ssot-admin.ts             — Super admin promotion
```
