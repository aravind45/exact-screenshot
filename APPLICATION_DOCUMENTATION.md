# ExpectedEstate: Application Documentation & Functionality Detail

ExpectedEstate is a digital platform designed to help executors and administrators manage the estate settlement process. This document provides a detailed, stepwise breakdown of all key functionalities within the application.

---

## 1. Onboarding & Estate Setup

The onboarding process is designed to be empathetic and efficient, guiding the user from registration to a personalized dashboard.

### Step-by-Step Flow:
1.  **Registration**: User signs up with email, password, and name.
2.  **Role Selection**: User identifies as an **Executor** (responsible for management) or an **Heir** (tracking progress).
3.  **Estate Basics**:
    *   Enter deceased person's full name and date of death.
    *   Select state of residence (affects legal requirements).
    *   Provide approximate estate value (used for shortcut recommendations).
4.  **Legal Flags**: User confirms if there was a Will, if they are the surviving spouse, and if there is out-of-state property.
5.  **Track Identification**: The "Track Scout" engine calculates the appropriate legal path (e.g., Small Estate Affidavit vs. Full Probate) based on state laws and estate value.
    *   **Authority Decision Guide**: Onboarding now displays *specific legal citations* (e.g., California Probate Code §13100) explaining *why* a specific track was chosen, transparently referencing asset values and state limits.
6.  **Heirs & Beneficiaries**: Add key people involved (Name, Relationship, Email).
7.  **Document Upload**: Upload the Death Certificate (the "Magic Key" for all institutions).
8.  **Initial Asset Entry**: Add primary bank accounts or institutions known at the start.
9.  **Team Assembly**: Invite co-executors, attorneys, or family members to collaborate.
10. **Completion**: The secure dashboard is initialized on the identified legal track.

---

## 2. Fiduciary Compliance Roadmap (6-Phase Guide)

The Roadmap is a deterministic workflow assistant designed to help executors document their fiduciary duties and build a record of reasonable care.

### The Six Phases:
1.  **Phase 1: Immediate Actions**
    *   Secure the property (locks, mail).
    *   Notify SSA and cancel cards.
    *   Locate the original Will.
    *   Open an Estate Bank Account.
2.  **Phase 2: Court Filing**
    *   File Petition for Probate (DE-111).
    *   Publish Creditor Notice and mail to known creditors.
    *   Attend probate hearing.
    *   Receive **Letters Testamentary (DE-150)**.
3.  **Phase 3: Asset Discovery**
    *   Freeze financial accounts.
    *   Obtain Date-of-Death (DOD) values.
    *   Hire Probate Referee for appraisals.
    *   File **Inventory & Appraisal (DE-160)**.
4.  **Phase 4: Creditor Claims**
    *   Wait for 4-month claim period.
    *   Review, approve, or reject claims.
    *   Pay approved debts in legal priority order.
5.  **Phase 5: Asset Liquidation**
    *   Present Letters to institutions.
    *   Transfer or sell assets (real estate, stocks).
    *   Pay final taxes (1040, 1041).
    *   Prepare final accounting.
6.  **Phase 6: Final Distribution**
    *   File Petition for Final Distribution.
    *   Distribute assets according to the court order.
    *   File final discharge and **Close Estate**.

---

## 3. Assisted Discovery Service

ExpectedEstate uses deterministic document intelligence to assist executors in identifying potential assets within provided paperwork.

### Manual Asset Management:
*   Add asset details: Type, Institution, Account Number, Value.
*   Track per-asset status: Discovered → Contacted → Documents Submitted → In Review → Approved → Distributed.
*   **Asset Detail Page**: View specific forms, communication logs, and checklists for each asset.

### Discovery Assistance Flow:
1.  **Upload**: User drags and drops tax returns, bank statements, or old mail.
2.  **Analysis**: Assists in extracting text and using deterministic patterns to find potential institution names and values.
3.  **Potential Findings**: User reviews potential leads with a "Confidence Score" and source text citations.
4.  **Confirmation**: Click "Add to Ledger" to formalize the entry.

---

## 4. Liabilities & Solvency Tracking

A critical module to prevent executor liability by ensuring debts are paid in the correct order.

### Key Features:
*   **Liabilities Ledger**: Track every debt including Type (Medical, Tax, Credit Card, Mortgage).
*   **Claims Priority Engine**: Automatically categorizes debts into priority levels (Class 1-7 depending on state).
*   **Solvency Tracker**: Compares total estate assets against total liabilities to alert the executor if the estate is "Insolvent" (not enough money to pay all debts).
*   **Payment Logging**: Track when claims are filed, reviewed, and paid.

### Executor Risk Monitor (New):
To shield the executor from personal liability, the system now enforces real-time legal checks:
*   **Insolvency Alert**: IMMEDIATELY warns if Liabilities > Assets, instructing the user to stop all payments and follow statutory priority.
*   **Premature Distribution Lock**: The "Generate Final Petition" button is **disabled** if the statutory 4-month creditor period has not passed.
*   **Priority Violation Signal**: Flags if a General Debt is marked "PAID" while higher-priority taxes or funeral expenses remain "UNPAID".

---

## 5. Document Management & PDF Engine

The "Vault" centralizes all legal paperwork and automates form generation.

### Step-by-Step Form Flow:
1.  **Form Selection**: Select from California Probate forms (DE-111, DE-150, etc.) or institution-specific forms (Fidelity, Vanguard).
2.  **Auto-Fill**: Platform pulls estate and asset data to pre-fill PDF fields.
3.  **Preview**: Integrated PDF viewer for final review.
4.  **Distribution**: Download or send directly to institutions via **Integrated Fax (PamFax)**.
5.  **Storage**: All generated and uploaded documents are stored securely with version history.

---

## 6. Communication & Follow-up Trail

This module solves the "14-day institutional black hole" by tracking every interaction.

### Interaction Steps:
1.  **Log Communication**: Record method (Phone, Fax, Email), date, and summary.
2.  **Evidence Storage**: Attach fax confirmations or call recordings to the log.
3.  **Automatic Follow-ups**: The system triggers reminders at 7, 14, 21, and 30 days if no response is logged for an asset.
4.  **Escalation Logic**: If an institution fails to respond, the system suggests escalation letters or regulatory complaints.

---

## 7. Final Estate Dossier (The Endgame Proof)

When the estate is closed, the executor needs proof of their faithful service.

### Dossier Functionality:
*   **One-Click Export**: Available on the Distribution page.
*   **Audit Trail**: Generates a court-ready text/PDF report containing:
    *   Full Asset Ledger (Inventory vs. Final Value).
    *   Creditor Claims Log (Filed, Allowed, Paid with Priority Class).
    *   Fiduciary Activity Log (Timestamped record of every uploaded document, logged call, and decision).
*   **Defensibility**: Designed to be handed to beneficiaries or judges if questions arise years later.

---

## 8. Collaboration & Team Management

ExpectedEstate is built for team collaboration, allowing the executor to invite legal advisors and family members to help with the case.

### Invitation Flow:
1.  **Shared Access**: Invite Heirs (VIEWER), Co-Executors (CO_EXECUTOR), or Attorneys (ATTORNEY).
2.  **Direct Invitations**: Executors can invite as many collaborators as needed directly via email.
3.  **Invite Member Dialog**: Accessible in the **Settings > Team** tab.
4.  **Secure Access**: Collaborators receive a unique token via email and create their own account to access the specific estate.
5.  **Role-Based Permissions**: Invitations are tagged with a specific role, ensuring proper access levels upon acceptance.

---

## Technical Architecture Overview

*   **Fiduciary Risk Monitor**: Dynamically calculates legal risks based on state-specific laws:
    *   **Notice Periods**: Automatically adjusts distribution locks based on the state's creditor notice period (e.g., California: 120 days, Florida: 90 days, New York: 7 months).
    *   **Priority Enforcement**: Uses a state-specific rules engine to prevent premature payment of low-priority debts when high-priority claims (specific to each state's probate code) are still open.
*   **Frontend**: React + TypeScript + Vite. Uses **Workflow Context** to synchronize roadmap state with asset data.
*   **Backend**: Node.js + Express. Prisma ORM connects to **Neon (PostgreSQL)**.
*   **Security**: All sensitive data (SSNs, Account Numbers) is encrypted.

---

## Trust, Limits, and Legal Boundaries

ExpectedEstate is designed to bridge the gap between "DIY" executors and professional legal standards by providing a systematic process monitor.

### What We Guarantee:
*   **Process Integrity**: We guarantee that the activity logs, timestamped actions, and document discovery results represent a faithful digital record of the executor's diligence.
*   **Deterministic Logic**: Our notice period clocks and distribution locks follow the exact statutory days (e.g., 120 days for CA, 90 days for FL) as defined in the state probate codes.

### What We Do Not Replace:
*   **Professional Judgment**: We do not provide legal, tax, or financial advice. The platform does not replace the need for an attorney to review complex estate issues or tax filings.
*   **Verification Duty**: The platform assists in discovery and tracking, but the executor remains responsible for verifying the accuracy of all account values and creditor claim statuses before distributing funds.

### Court & Attorney Interpretation:
The **Fiduciary Activity Report** (formerly "Dossier") is designed to be presented to heirs, attorneys, and probate judges as **Evidence of Reasonable Care**. It demonstrates that the executor followed a rigorous, state-specific settlement process, significantly lowering the risk of liability claims.
