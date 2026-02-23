/**
 * Texas Vertical Slice Seed — SSOT Probate Engine
 * All column names match prisma/ssot-migration.sql exactly.
 *
 * Usage: npx tsx scripts/seed-ssot-texas.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const q = (sql: string, params: any[] = []) => prisma.$queryRawUnsafe(sql, ...params);

async function main() {
  console.log("🌟 Seeding Texas SSOT vertical slice...\n");

  // ── 1. Jurisdiction ──────────────────────────────────────────────────────
  const [jur]: any = await q(`
    INSERT INTO ssot_jurisdictions (state_code, state_name, is_community_property, is_upc_state, has_estate_tax, has_inheritance_tax, small_estate_threshold, creditor_claim_period_months, status, source_citation)
    VALUES ('TX','Texas',true,false,false,false,75000,4,'PUBLISHED','TX Estates Code')
    ON CONFLICT (state_code) DO UPDATE SET status='PUBLISHED', updated_at=now()
    RETURNING id
  `);
  const jId = jur.id;
  console.log("✅ Jurisdiction TX id=", jId);

  // ── 2. Probate Types ─────────────────────────────────────────────────────
  const ptypes = [
    { code: "INDEPENDENT_ADMIN", name: "Independent Administration", desc: "Most common TX path — executor acts without court supervision", category: "STANDARD" },
    { code: "DEPENDENT_ADMIN", name: "Dependent Administration", desc: "Court-supervised administration required for each action", category: "STANDARD" },
    { code: "MUNIMENT_OF_TITLE", name: "Muniment of Title", desc: "Simplified will-only probate when no unpaid debts exist", category: "SIMPLIFIED" },
    { code: "SMALL_ESTATE_AFFIDAVIT", name: "Small Estate Affidavit", desc: "For estates under $75,000 with no real property", category: "SIMPLIFIED" },
    { code: "AFFIDAVIT_OF_HEIRSHIP", name: "Affidavit of Heirship", desc: "Used to transfer real property without probate", category: "SIMPLIFIED" },
  ];
  const ptypeIds: Record<string, string> = {};
  for (const pt of ptypes) {
    const [row]: any = await q(`
      INSERT INTO ssot_probate_types (code, name, description, category, status)
      VALUES ($1,$2,$3,$4,'PUBLISHED')
      ON CONFLICT (code) DO UPDATE SET name=$2, description=$3, category=$4, updated_at=now()
      RETURNING id
    `, [pt.code, pt.name, pt.desc, pt.category]);
    ptypeIds[pt.code] = row.id;
    // Junction
    await q(`
      INSERT INTO ssot_jurisdiction_probate_types (jurisdiction_id, probate_type_id)
      VALUES ($1,$2) ON CONFLICT (jurisdiction_id, probate_type_id) DO NOTHING
    `, [jId, row.id]);
  }
  console.log("✅ Probate types:", Object.keys(ptypeIds).join(", "));

  // ── 3. Roadmap for Independent Administration ────────────────────────────
  const [roadmap]: any = await q(`
    INSERT INTO ssot_probate_roadmaps (jurisdiction_id, probate_type_id, name, description, estimated_duration_months, status, source_citation)
    VALUES ($1,$2,'Texas Independent Administration Roadmap','Full roadmap for independent administration in Texas',8,'PUBLISHED','TX Estates Code §401')
    ON CONFLICT (jurisdiction_id, probate_type_id) DO UPDATE SET name=EXCLUDED.name, status='PUBLISHED', updated_at=now()
    RETURNING id
  `, [jId, ptypeIds["INDEPENDENT_ADMIN"]]);
  const rmId = roadmap.id;
  console.log("✅ Roadmap id=", rmId);

  // ── 4. Phases ────────────────────────────────────────────────────────────
  const phases = [
    { code: "PRE_FILING", order: 1, title: "Pre-Filing Preparation", subtitle: "Gather documents, locate will, secure property", estDays: 14, isOptional: false },
    { code: "FILE_APP", order: 2, title: "File Application for Probate", subtitle: "Prepare and file probate application with county court", estDays: 14, isOptional: false },
    { code: "HEARING", order: 3, title: "Court Hearing & Letters", subtitle: "Attend hearing, obtain Letters Testamentary", estDays: 28, isOptional: false },
    { code: "CREDITORS", order: 4, title: "Creditor Notice Period", subtitle: "Publish notice and wait statutory period", estDays: 56, isOptional: false },
    { code: "INVENTORY", order: 5, title: "Asset Collection & Inventory", subtitle: "Collect assets, file inventory with court", estDays: 42, isOptional: false },
    { code: "DEBTS_TAX", order: 6, title: "Debt Settlement & Tax Filing", subtitle: "Pay valid claims, file final tax returns", estDays: 56, isOptional: false },
    { code: "DISTRIBUTION", order: 7, title: "Distribution & Closing", subtitle: "Distribute remaining assets, file closing documents", estDays: 28, isOptional: false },
  ];
  const phaseIds: string[] = [];
  for (const p of phases) {
    const [row]: any = await q(`
      INSERT INTO ssot_roadmap_phases (roadmap_id, code, title, subtitle, order_index, estimated_days, is_optional, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLISHED')
      ON CONFLICT (roadmap_id, code) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, order_index=EXCLUDED.order_index, updated_at=now()
      RETURNING id
    `, [rmId, p.code, p.title, p.subtitle, p.order, p.estDays, p.isOptional]);
    phaseIds.push(row.id);
  }
  console.log("✅ Phases:", phaseIds.length);

  // ── 5. Steps ─────────────────────────────────────────────────────────────
  const stepsData: Array<{ phaseIdx: number; code: string; order: number; title: string; desc: string; isOptional: boolean; estDays: number }> = [
    // Phase 1 — Pre-Filing
    { phaseIdx: 0, code: "LOCATE_WILL", order: 1, title: "Locate Original Will", desc: "Find the original signed will and any codicils", isOptional: false, estDays: 7 },
    { phaseIdx: 0, code: "DEATH_CERT", order: 2, title: "Obtain Death Certificate", desc: "Order 10+ certified copies of death certificate", isOptional: false, estDays: 5 },
    { phaseIdx: 0, code: "SECURE_PROP", order: 3, title: "Secure Estate Property", desc: "Change locks, redirect mail, secure vehicles and valuables", isOptional: false, estDays: 3 },
    { phaseIdx: 0, code: "ID_HEIRS", order: 4, title: "Identify Heirs and Beneficiaries", desc: "List all heirs-at-law and will beneficiaries", isOptional: false, estDays: 7 },
    // Phase 2 — File Application
    { phaseIdx: 1, code: "DET_COUNTY", order: 1, title: "Determine Correct County Court", desc: "File in county where decedent was domiciled", isOptional: false, estDays: 1 },
    { phaseIdx: 1, code: "PREP_APP", order: 2, title: "Prepare Application for Probate", desc: "Complete application per TX Estates Code §256", isOptional: false, estDays: 3 },
    { phaseIdx: 1, code: "FILE_APP", order: 3, title: "File Application & Pay Filing Fee", desc: "File at county clerk, typical fee $300-$400", isOptional: false, estDays: 1 },
    { phaseIdx: 1, code: "POST_CITATION", order: 4, title: "Post Citation / Serve Notice", desc: "Clerk posts citation at courthouse for 10 days", isOptional: false, estDays: 10 },
    // Phase 3 — Hearing
    { phaseIdx: 2, code: "ATTEND_HEARING", order: 1, title: "Attend Probate Hearing", desc: "Appear before judge, testify under oath", isOptional: false, estDays: 1 },
    { phaseIdx: 2, code: "ORDER_ADMIT", order: 2, title: "Obtain Order Admitting Will", desc: "Court issues order admitting will to probate", isOptional: false, estDays: 1 },
    { phaseIdx: 2, code: "GET_LETTERS", order: 3, title: "Obtain Letters Testamentary", desc: "Clerk issues Letters Testamentary — your authority document", isOptional: false, estDays: 3 },
    { phaseIdx: 2, code: "TAKE_OATH", order: 4, title: "Take Oath of Office", desc: "Executor takes oath before clerk within 20 days", isOptional: false, estDays: 1 },
    // Phase 4 — Creditors
    { phaseIdx: 3, code: "PUB_NOTICE", order: 1, title: "Publish Notice to Creditors", desc: "Publish in county newspaper per §308.051", isOptional: false, estDays: 1 },
    { phaseIdx: 3, code: "NOTIFY_SECURED", order: 2, title: "Send Secured Creditor Notices", desc: "Notify known secured creditors directly within 60 days", isOptional: false, estDays: 7 },
    { phaseIdx: 3, code: "WAIT_CLAIMS", order: 3, title: "Wait Creditor Claim Period", desc: "Statutory period for creditors to file claims", isOptional: false, estDays: 120 },
    // Phase 5 — Inventory
    { phaseIdx: 4, code: "OPEN_ACCT", order: 1, title: "Open Estate Bank Account", desc: "Open account using EIN and Letters Testamentary", isOptional: false, estDays: 3 },
    { phaseIdx: 4, code: "COLLECT_ASSETS", order: 2, title: "Collect & Retitle Assets", desc: "Transfer financial accounts, retitle real property", isOptional: false, estDays: 30 },
    { phaseIdx: 4, code: "APPRAISALS", order: 3, title: "Obtain Appraisals", desc: "Get fair market value appraisals for real estate and valuables", isOptional: true, estDays: 14 },
    { phaseIdx: 4, code: "FILE_INV", order: 4, title: "File Inventory with Court", desc: "File sworn inventory within 90 days of appointment", isOptional: false, estDays: 90 },
    // Phase 6 — Debts & Tax
    { phaseIdx: 5, code: "PAY_CLAIMS", order: 1, title: "Review & Pay Valid Claims", desc: "Accept or reject creditor claims, pay approved debts", isOptional: false, estDays: 30 },
    { phaseIdx: 5, code: "FILE_1040", order: 2, title: "File Final Income Tax Returns", desc: "File decedent's final 1040 and TX franchise tax if applicable", isOptional: false, estDays: 30 },
    { phaseIdx: 5, code: "FILE_706", order: 3, title: "File Estate Tax Return (if needed)", desc: "File Form 706 if gross estate > $12.92M (2023)", isOptional: true, estDays: 60 },
    { phaseIdx: 5, code: "TAX_CLEAR", order: 4, title: "Obtain Tax Clearance", desc: "Request IRS closing letter or account transcript", isOptional: true, estDays: 90 },
    // Phase 7 — Distribution
    { phaseIdx: 6, code: "DIST_PLAN", order: 1, title: "Prepare Distribution Plan", desc: "Calculate shares per will or intestacy statute", isOptional: false, estDays: 7 },
    { phaseIdx: 6, code: "HEIR_RECEIPTS", order: 2, title: "Obtain Heir Receipts", desc: "Have each beneficiary sign receipt and release", isOptional: false, estDays: 14 },
    { phaseIdx: 6, code: "DISTRIBUTE", order: 3, title: "Distribute Assets", desc: "Transfer property, issue checks, deed real estate", isOptional: false, estDays: 14 },
    { phaseIdx: 6, code: "CLOSE_RPT", order: 4, title: "File Closing Report", desc: "File affidavit of completion or accounting with court", isOptional: false, estDays: 7 },
  ];

  const stepIds: string[] = [];
  for (const s of stepsData) {
    const [row]: any = await q(`
      INSERT INTO ssot_roadmap_steps (phase_id, code, title, description, order_index, estimated_days, is_optional, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLISHED')
      ON CONFLICT (phase_id, code) DO UPDATE SET title=EXCLUDED.title, order_index=EXCLUDED.order_index, updated_at=now()
      RETURNING id
    `, [phaseIds[s.phaseIdx], s.code, s.title, s.desc, s.order, s.estDays, s.isOptional]);
    stepIds.push(row.id);
  }
  console.log("✅ Steps:", stepIds.length);

  // ── 6. Actions ───────────────────────────────────────────────────────────
  const actions = [
    { stepIdx: 0, code: "CHECK_SAFE", order: 1, title: "Check home safe / safety deposit box", actionType: "TASK", isRequired: true },
    { stepIdx: 0, code: "CONTACT_ATTY", order: 2, title: "Contact attorney who drafted will", actionType: "TASK", isRequired: false },
    { stepIdx: 1, code: "ORDER_CERTS", order: 1, title: "Order certified copies from county clerk", actionType: "TASK", isRequired: true },
    { stepIdx: 1, code: "ORDER_10", order: 2, title: "Order at least 10 copies", actionType: "TASK", isRequired: false },
    { stepIdx: 6, code: "FILL_APP", order: 1, title: "Complete probate application form", actionType: "FORM_FILL", isRequired: true },
    { stepIdx: 6, code: "ATTACH_ORIG", order: 2, title: "Attach original will and death certificate", actionType: "UPLOAD", isRequired: true },
    { stepIdx: 8, code: "BRING_DOCS", order: 1, title: "Bring original will, death cert, and photo ID", actionType: "TASK", isRequired: true },
    { stepIdx: 10, code: "REQ_COPIES", order: 1, title: "Request certified copies of Letters Testamentary", actionType: "TASK", isRequired: true },
    { stepIdx: 12, code: "SELECT_NEWS", order: 1, title: "Select newspaper in county of domicile", actionType: "TASK", isRequired: true },
    { stepIdx: 15, code: "APPLY_EIN", order: 1, title: "Apply for EIN from IRS (Form SS-4)", actionType: "FORM_FILL", isRequired: true },
  ];
  for (const a of actions) {
    await q(`
      INSERT INTO ssot_step_actions (step_id, code, title, order_index, action_type, is_required, status)
      VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED')
      ON CONFLICT (step_id, code) DO UPDATE SET title=EXCLUDED.title, order_index=EXCLUDED.order_index, updated_at=now()
    `, [stepIds[a.stepIdx], a.code, a.title, a.order, a.actionType, a.isRequired]);
  }
  console.log("✅ Actions seeded");

  // ── 7. Legal Forms ───────────────────────────────────────────────────────
  const forms = [
    { formNumber: "TX-PROB-APP", title: "Application for Probate of Will", cat: "probate_petition", fee: 300.00 },
    { formNumber: "TX-LETTERS-TEST", title: "Letters Testamentary", cat: "letters", fee: 0 },
    { formNumber: "TX-OATH", title: "Oath of Personal Representative", cat: "oath", fee: 0 },
    { formNumber: "TX-INVENTORY", title: "Sworn Inventory & Appraisement", cat: "inventory", fee: 0 },
    { formNumber: "TX-NOTICE-CRED", title: "Notice to Creditors", cat: "notice", fee: 50.00 },
    { formNumber: "TX-SMALL-EST", title: "Small Estate Affidavit", cat: "affidavit", fee: 150.00 },
    { formNumber: "TX-MUNIMENT", title: "Application for Muniment of Title", cat: "probate_petition", fee: 300.00 },
    { formNumber: "TX-HEIR-AFF", title: "Affidavit of Heirship", cat: "affidavit", fee: 0 },
    { formNumber: "TX-CLOSING-RPT", title: "Closing Report / Affidavit", cat: "accounting", fee: 0 },
  ];
  const formIds: Record<string, string> = {};
  for (const f of forms) {
    const [row]: any = await q(`
      INSERT INTO ssot_legal_forms (form_number, title, category, jurisdiction_id, filing_fee_amount, status)
      VALUES ($1,$2,$3,$4,$5,'PUBLISHED')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [f.formNumber, f.title, f.cat, jId, f.fee]);
    if (row) {
      formIds[f.formNumber] = row.id;
    } else {
      const existing: any = await q(`SELECT id FROM ssot_legal_forms WHERE form_number=$1 AND jurisdiction_id=$2 LIMIT 1`, [f.formNumber, jId]);
      if (existing[0]) formIds[f.formNumber] = existing[0].id;
    }
  }
  console.log("✅ Forms:", Object.keys(formIds).join(", "));

  // ── 8. Link forms to steps ───────────────────────────────────────────────
  const stepFormLinks = [
    { stepIdx: 5, formCode: "TX-PROB-APP" },   // Prepare Application
    { stepIdx: 10, formCode: "TX-LETTERS-TEST" }, // Obtain Letters
    { stepIdx: 11, formCode: "TX-OATH" },       // Take Oath
    { stepIdx: 12, formCode: "TX-NOTICE-CRED" }, // Publish Notice
    { stepIdx: 18, formCode: "TX-INVENTORY" },  // File Inventory
    { stepIdx: 26, formCode: "TX-CLOSING-RPT" }, // File Closing Report
  ];
  for (const link of stepFormLinks) {
    if (stepIds[link.stepIdx] && formIds[link.formCode]) {
      await q(`INSERT INTO ssot_step_forms (step_id, form_id) VALUES ($1,$2) ON CONFLICT (step_id, form_id) DO NOTHING`, [stepIds[link.stepIdx], formIds[link.formCode]]);
    }
  }
  console.log("✅ Step-form links created");

  // ── 9. Statute References ────────────────────────────────────────────────
  const statutes = [
    { entityType: "jurisdiction", entityId: jId, statuteCode: "TX-EST-401", statuteTitle: "TX Estates Code §401 — Independent Administration", statuteUrl: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.401.htm" },
    { entityType: "jurisdiction", entityId: jId, statuteCode: "TX-EST-257", statuteTitle: "TX Estates Code §257 — Muniment of Title", statuteUrl: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.257.htm" },
    { entityType: "jurisdiction", entityId: jId, statuteCode: "TX-EST-205", statuteTitle: "TX Estates Code §205 — Small Estate Affidavit", statuteUrl: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.205.htm" },
  ];
  for (const s of statutes) {
    await q(`
      INSERT INTO ssot_statute_references (jurisdiction_id, entity_type, entity_id, statute_code, statute_title, statute_url)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT DO NOTHING
    `, [jId, s.entityType, s.entityId, s.statuteCode, s.statuteTitle, s.statuteUrl]);
  }
  console.log("✅ Statute references seeded");

  // ── 10. Asset Types ──────────────────────────────────────────────────────
  const assetTypes = [
    { code: "REAL_PROPERTY", name: "Real Property", cat: "real_estate", reqsAppraisal: true },
    { code: "BANK_ACCOUNT", name: "Bank Accounts", cat: "financial", reqsAppraisal: false },
    { code: "INVESTMENT", name: "Investment Accounts", cat: "financial", reqsAppraisal: false },
    { code: "VEHICLE", name: "Vehicles", cat: "personal_property", reqsAppraisal: true },
    { code: "LIFE_INSURANCE", name: "Life Insurance", cat: "insurance", reqsAppraisal: false },
    { code: "RETIREMENT", name: "Retirement Accounts", cat: "financial", reqsAppraisal: false },
    { code: "BUSINESS_INTEREST", name: "Business Interests", cat: "business", reqsAppraisal: true },
    { code: "PERSONAL_PROPERTY", name: "Personal Property", cat: "personal_property", reqsAppraisal: false },
  ];
  for (const at of assetTypes) {
    await q(`
      INSERT INTO ssot_asset_types (code, name, category, requires_appraisal, status)
      VALUES ($1,$2,$3,$4,'PUBLISHED')
      ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, updated_at=now()
    `, [at.code, at.name, at.cat, at.reqsAppraisal]);
  }
  console.log("✅ Asset types seeded");

  // ── 11. Liability Types & Creditor Classes ───────────────────────────────
  const liabilityTypes = [
    { code: "MORTGAGE", name: "Mortgage", priorityClass: "SECURED", priorityRank: 1 },
    { code: "MEDICAL", name: "Medical Bills", priorityClass: "GENERAL", priorityRank: 4 },
    { code: "CREDIT_CARD", name: "Credit Card Debt", priorityClass: "GENERAL", priorityRank: 5 },
    { code: "FUNERAL", name: "Funeral Expenses", priorityClass: "PRIORITY", priorityRank: 1 },
    { code: "TAXES", name: "Tax Obligations", priorityClass: "PRIORITY", priorityRank: 2 },
    { code: "UTILITIES", name: "Utilities", priorityClass: "GENERAL", priorityRank: 5 },
  ];
  for (const lt of liabilityTypes) {
    await q(`
      INSERT INTO ssot_liability_types (code, name, priority_class, priority_rank, status)
      VALUES ($1,$2,$3,$4,'PUBLISHED')
      ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, priority_class=EXCLUDED.priority_class, priority_rank=EXCLUDED.priority_rank, updated_at=now()
    `, [lt.code, lt.name, lt.priorityClass, lt.priorityRank]);
  }

  const creditorClasses = [
    { rank: 1, name: "Funeral & Last Illness", desc: "Funeral expenses and costs of last illness", cite: "TX Estates Code §355.102(1)" },
    { rank: 2, name: "Administration Expenses", desc: "Costs of administration including attorney fees", cite: "TX Estates Code §355.102(2)" },
    { rank: 3, name: "Secured Claims", desc: "Claims secured by liens on estate property", cite: "TX Estates Code §355.102(3)" },
    { rank: 4, name: "Child Support Arrears", desc: "Unpaid child support", cite: "TX Estates Code §355.102(4)" },
    { rank: 5, name: "Taxes", desc: "Federal and state tax obligations", cite: "TX Estates Code §355.102(5)" },
    { rank: 6, name: "All Other Claims", desc: "General unsecured debts", cite: "TX Estates Code §355.102(6)" },
  ];
  for (const cc of creditorClasses) {
    await q(`
      INSERT INTO ssot_creditor_classes (jurisdiction_id, class_name, priority_rank, description, source_citation, status)
      VALUES ($1,$2,$3,$4,$5,'PUBLISHED')
      ON CONFLICT DO NOTHING
    `, [jId, cc.name, cc.rank, cc.desc, cc.cite]);
  }
  console.log("✅ Liability types & creditor classes seeded");

  // ── 12. Accounting Rules ─────────────────────────────────────────────────
  const accountingRules = [
    { code: "TX-INV-90", title: "Inventory Due 90 Days", desc: "Sworn inventory must be filed within 90 days of appointment", ruleType: "DEADLINE", deadlineRule: "90 days from appointment_date", deadlineDays: 90 },
    { code: "TX-ACCT-ANN", title: "Annual Accounting", desc: "Dependent admin must file annual accounting", ruleType: "REPORTING", deadlineRule: "Annual from appointment_date", deadlineDays: 365 },
    { code: "TX-BOND-WAIVER", title: "Bond Waiver", desc: "Independent admin with will waiving bond — no bond required", ruleType: "BOND", deadlineRule: null, deadlineDays: null },
  ];
  for (const ar of accountingRules) {
    await q(`
      INSERT INTO ssot_accounting_rules (jurisdiction_id, code, title, description, rule_type, deadline_rule, deadline_days, source_citation, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'TX Estates Code','PUBLISHED')
      ON CONFLICT DO NOTHING
    `, [jId, ar.code, ar.title, ar.desc, ar.ruleType, ar.deadlineRule, ar.deadlineDays]);
  }
  console.log("✅ Accounting rules seeded");

  // ── 13. Tax Obligations ──────────────────────────────────────────────────
  const taxObligations = [
    { code: "TX-FINAL-1040", title: "Final Federal Income Tax", desc: "File decedent's final Form 1040", taxType: "INCOME", formNumber: "IRS Form 1040", deadlineRule: "April 15 following death", isFederal: true },
    { code: "TX-ESTATE-706", title: "Federal Estate Tax", desc: "File Form 706 if gross estate exceeds exemption", taxType: "ESTATE", formNumber: "IRS Form 706", deadlineRule: "9 months from death", isFederal: true },
    { code: "TX-FIDUCIARY-1041", title: "Estate Income Tax", desc: "File Form 1041 for estate income during administration", taxType: "FIDUCIARY", formNumber: "IRS Form 1041", deadlineRule: "April 15 or fiscal year end", isFederal: true },
  ];
  for (const t of taxObligations) {
    await q(`
      INSERT INTO ssot_tax_obligations (jurisdiction_id, code, title, description, tax_type, filing_form_number, filing_deadline_rule, is_federal, source_citation, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'IRS / TX Estates Code','PUBLISHED')
      ON CONFLICT DO NOTHING
    `, [jId, t.code, t.title, t.desc, t.taxType, t.formNumber, t.deadlineRule, t.isFederal]);
  }
  console.log("✅ Tax obligations seeded");

  // ── 14. Distribution Rules ───────────────────────────────────────────────
  const distRules = [
    { code: "TX-INTESTATE-SPOUSE", title: "Surviving Spouse — Intestate", desc: "Community property: all to spouse. Separate: depends on children.", ruleType: "INTESTACY", priorityOrder: 1, conditionLogic: { communityProperty: "100% to spouse" }, shareFormula: "Community: 100% to spouse; Separate with children: 1/3 personal + life estate 1/3 real; Separate no children: all personal + 1/2 real" },
    { code: "TX-HOMESTEAD", title: "Homestead Exemption", desc: "Surviving spouse has right to occupy homestead for life", ruleType: "HOMESTEAD", priorityOrder: 2, conditionLogic: { rightOfOccupancy: true }, shareFormula: "Life estate in homestead" },
    { code: "TX-FAMILY-ALLOW", title: "Family Allowance", desc: "Court may set family allowance for surviving spouse and minor children", ruleType: "FAMILY_ALLOWANCE", priorityOrder: 3, conditionLogic: { maxMonths: 12 }, shareFormula: "Court discretion, up to 12 months" },
  ];
  for (const dr of distRules) {
    await q(`
      INSERT INTO ssot_distribution_rules (jurisdiction_id, code, title, description, rule_type, priority_order, condition_logic, share_formula, source_citation, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'TX Estates Code','PUBLISHED')
      ON CONFLICT DO NOTHING
    `, [jId, dr.code, dr.title, dr.desc, dr.ruleType, dr.priorityOrder, JSON.stringify(dr.conditionLogic), dr.shareFormula]);
  }
  console.log("✅ Distribution rules seeded");

  console.log("\n🎉 Texas vertical slice complete!\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
