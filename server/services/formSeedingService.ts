import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';

interface DefaultTemplate {
    name: string;
    filename: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    state?: string;
}

// California Forms
const CA_TEMPLATES: DefaultTemplate[] = [
    {
        name: "DE-110",
        filename: "DE-110.pdf",
        title: "Petition for Probate of Will and for Letters Testamentary",
        description: "Petition to probate a will and request appointment as executor.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        name: "DE-111",
        filename: "DE-111.pdf",
        title: "Petition for Probate",
        description: "The primary document used to start the probate process.",
        category: "Probate Initialization",
        icon: "ScrollText"
    },
    {
        name: "DE-120",
        filename: "DE-120.pdf",
        title: "Notice of Hearing (Probate)",
        description: "Notice of the probate hearing date and time.",
        category: "Notices",
        icon: "Bell"
    },
    {
        name: "DE-121",
        filename: "DE-121.pdf",
        title: "Notice of Petition to Administer Estate",
        description: "Official notice for heirs and creditors.",
        category: "Notices",
        icon: "Bell"
    },
    {
        name: "DE-131",
        filename: "DE-131.pdf",
        title: "Proof of Subscribing Witness",
        description: "Witness testimony to prove the validity of a will.",
        category: "Probate Initialization",
        icon: "UserCheck"
    },
    {
        name: "DE-135",
        filename: "DE-135.pdf",
        title: "Proof of Holographic Instrument",
        description: "Proof of a handwritten will.",
        category: "Probate Initialization",
        icon: "PenTool"
    },
    {
        name: "DE-140",
        filename: "DE-140.pdf",
        title: "Order for Probate",
        description: "Court order granting probate and appointing the personal representative.",
        category: "Court Orders",
        icon: "Gavel"
    },
    {
        name: "DE-147",
        filename: "DE-147.pdf",
        title: "Duties and Liabilities of Personal Representative",
        description: "Information about executor responsibilities and duties.",
        category: "Authority",
        icon: "ShieldAlert"
    },
    {
        name: "DE-150",
        filename: "DE-150.pdf",
        title: "Letters",
        description: "Official evidence of authority to act as personal representative.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        name: "DE-157",
        filename: "DE-157.pdf",
        title: "Notice of Administration to Creditors",
        description: "Notice to creditors that probate has been opened.",
        category: "Notices",
        icon: "AlertCircle"
    },
    {
        name: "DE-160",
        filename: "DE-160.pdf",
        title: "Inventory and Appraisal",
        description: "A complete list of estate assets and their values.",
        category: "Assets",
        icon: "Scale"
    },
    {
        name: "DE-161",
        filename: "DE-161.pdf",
        title: "Inventory and Appraisal Attachment",
        description: "Additional pages for listing more assets.",
        category: "Assets",
        icon: "Paperclip"
    },
    {
        name: "DE-165",
        filename: "DE-165.pdf",
        title: "Notice of Proposed Action",
        description: "Notice to beneficiaries of proposed actions.",
        category: "Notices",
        icon: "AlertCircle"
    },
    {
        name: "DE-172",
        filename: "DE-172.pdf",
        title: "Creditor's Claim",
        description: "Form for creditors to file claims against the estate.",
        category: "Creditor Claims",
        icon: "FileWarning"
    },
    {
        name: "DE-174",
        filename: "DE-174.pdf",
        title: "Allowance or Rejection of Creditor's Claim",
        description: "Executor's response to creditor claims.",
        category: "Creditor Claims",
        icon: "CheckSquare"
    },
    {
        name: "DE-221",
        filename: "DE-221.pdf",
        title: "Spousal or Domestic Partner Property Petition",
        description: "Petition to confirm property passing to surviving spouse.",
        category: "Spousal Property",
        icon: "Heart"
    },
    {
        name: "DE-260",
        filename: "DE-260.pdf",
        title: "Ex Parte Petition for Authority to Sell Real Property",
        description: "Request court authorization to sell real estate.",
        category: "Asset Sales",
        icon: "Home"
    },
    {
        name: "DE-270",
        filename: "DE-270.pdf",
        title: "Ex Parte Petition for Authority to Sell Securities",
        description: "Request court authorization to sell stocks and bonds.",
        category: "Asset Sales",
        icon: "TrendingUp"
    },
    {
        name: "DE-295",
        filename: "DE-295.pdf",
        title: "Ex Parte Petition for Final Discharge",
        description: "Request to close the estate and discharge the executor.",
        category: "Estate Closing",
        icon: "CheckCircle2"
    },
    {
        name: "DE-305",
        filename: "DE-305.pdf",
        title: "Affidavit Re Real Property of Small Value",
        description: "Simplified procedure for small estates with real property.",
        category: "Small Estate",
        icon: "Home"
    },
    {
        name: "DE-310",
        filename: "DE-310.pdf",
        title: "Petition for Final Distribution",
        description: "Request to distribute remaining assets to beneficiaries.",
        category: "Distribution",
        icon: "Users"
    },
    {
        name: "DE-315",
        filename: "DE-315.pdf",
        title: "Order for Final Distribution",
        description: "Court order approving final distribution of assets.",
        category: "Distribution",
        icon: "CheckCircle"
    }
];

// New York Forms
const NY_TEMPLATES: DefaultTemplate[] = [
    {
        name: "ET-1",
        filename: "NY-ET-1.pdf",
        title: "Petition for Probate",
        description: "Petition to admit will to probate and appoint executor.",
        category: "Probate Initialization",
        icon: "FileText",
        state: "NY"
    },
    {
        name: "ET-2",
        filename: "NY-ET-2.pdf",
        title: "Petition for Administration",
        description: "Petition for letters of administration when there is no will.",
        category: "Probate Initialization",
        icon: "ScrollText",
        state: "NY"
    },
    {
        name: "ET-3",
        filename: "NY-ET-3.pdf",
        title: "Petition for Ancillary Probate",
        description: "Petition for ancillary probate of foreign will.",
        category: "Probate Initialization",
        icon: "FileText",
        state: "NY"
    },
    {
        name: "ET-4",
        filename: "NY-ET-4.pdf",
        title: "Citation",
        description: "Notice to interested parties of probate proceeding.",
        category: "Notices",
        icon: "Bell",
        state: "NY"
    },
    {
        name: "ET-5",
        filename: "NY-ET-5.pdf",
        title: "Waiver and Consent",
        description: "Waiver of citation and consent to probate.",
        category: "Notices",
        icon: "CheckSquare",
        state: "NY"
    },
    {
        name: "ET-6",
        filename: "NY-ET-6.pdf",
        title: "Letters Testamentary",
        description: "Official authority for executor to act.",
        category: "Authority",
        icon: "ShieldCheck",
        state: "NY"
    },
    {
        name: "ET-7",
        filename: "NY-ET-7.pdf",
        title: "Letters of Administration",
        description: "Official authority for administrator to act.",
        category: "Authority",
        icon: "ShieldCheck",
        state: "NY"
    },
    {
        name: "ET-8",
        filename: "NY-ET-8.pdf",
        title: "Inventory",
        description: "List of estate assets and values.",
        category: "Assets",
        icon: "Scale",
        state: "NY"
    },
    {
        name: "ET-9",
        filename: "NY-ET-9.pdf",
        title: "Account",
        description: "Accounting of estate receipts and disbursements.",
        category: "Accounting",
        icon: "FileText",
        state: "NY"
    },
    {
        name: "ET-10",
        filename: "NY-ET-10.pdf",
        title: "Petition for Judicial Settlement",
        description: "Petition for court approval of accounting.",
        category: "Accounting",
        icon: "Gavel",
        state: "NY"
    },
    {
        name: "ET-11",
        filename: "NY-ET-11.pdf",
        title: "Decree",
        description: "Court order approving accounting and distribution.",
        category: "Court Orders",
        icon: "Gavel",
        state: "NY"
    },
    {
        name: "ET-12",
        filename: "NY-ET-12.pdf",
        title: "Receipt and Release",
        description: "Beneficiary acknowledgment of distribution.",
        category: "Distribution",
        icon: "Users",
        state: "NY"
    },
    {
        name: "ET-13",
        filename: "NY-ET-13.pdf",
        title: "Petition for Final Distribution",
        description: "Request for court approval of final distribution.",
        category: "Distribution",
        icon: "Users",
        state: "NY"
    },
    {
        name: "ET-14",
        filename: "NY-ET-14.pdf",
        title: "Affidavit of Heirship",
        description: "Sworn statement identifying heirs.",
        category: "Small Estate",
        icon: "FileText",
        state: "NY"
    },
    {
        name: "ET-15",
        filename: "NY-ET-15.pdf",
        title: "Voluntary Administration Affidavit",
        description: "Simplified procedure for small estates.",
        category: "Small Estate",
        icon: "FileText",
        state: "NY"
    }
];

// Texas Forms
const TX_TEMPLATES: DefaultTemplate[] = [
    {
        name: "TX-1",
        filename: "TX-1.pdf",
        title: "Application for Probate of Will",
        description: "Application to admit will to probate and appoint executor.",
        category: "Probate Initialization",
        icon: "FileText",
        state: "TX"
    },
    {
        name: "TX-2",
        filename: "TX-2.pdf",
        title: "Application for Letters of Administration",
        description: "Application for letters when there is no will.",
        category: "Probate Initialization",
        icon: "ScrollText",
        state: "TX"
    },
    {
        name: "TX-3",
        filename: "TX-3.pdf",
        title: "Application for Independent Administration",
        description: "Application for independent administration (unique to Texas).",
        category: "Probate Initialization",
        icon: "FileText",
        state: "TX"
    },
    {
        name: "TX-4",
        filename: "TX-4.pdf",
        title: "Order Admitting Will to Probate",
        description: "Court order admitting will to probate.",
        category: "Court Orders",
        icon: "Gavel",
        state: "TX"
    },
    {
        name: "TX-5",
        filename: "TX-5.pdf",
        title: "Letters Testamentary",
        description: "Official authority for executor to act.",
        category: "Authority",
        icon: "ShieldCheck",
        state: "TX"
    },
    {
        name: "TX-6",
        filename: "TX-6.pdf",
        title: "Letters of Administration",
        description: "Official authority for administrator to act.",
        category: "Authority",
        icon: "ShieldCheck",
        state: "TX"
    },
    {
        name: "TX-7",
        filename: "TX-7.pdf",
        title: "Inventory, Appraisement and List of Claims",
        description: "Complete inventory of estate assets and claims.",
        category: "Assets",
        icon: "Scale",
        state: "TX"
    },
    {
        name: "TX-8",
        filename: "TX-8.pdf",
        title: "Annual Account",
        description: "Annual accounting of estate receipts and disbursements.",
        category: "Accounting",
        icon: "FileText",
        state: "TX"
    },
    {
        name: "TX-9",
        filename: "TX-9.pdf",
        title: "Application to Close Estate",
        description: "Application to close and distribute estate.",
        category: "Estate Closing",
        icon: "CheckCircle2",
        state: "TX"
    },
    {
        name: "TX-10",
        filename: "TX-10.pdf",
        title: "Final Account",
        description: "Final accounting before estate closure.",
        category: "Accounting",
        icon: "FileText",
        state: "TX"
    },
    {
        name: "TX-11",
        filename: "TX-11.pdf",
        title: "Small Estate Affidavit",
        description: "Simplified procedure for small estates under $75,000.",
        category: "Small Estate",
        icon: "FileText",
        state: "TX"
    },
    {
        name: "TX-12",
        filename: "TX-12.pdf",
        title: "Muniment of Title",
        description: "Simplified probate process unique to Texas.",
        category: "Small Estate",
        icon: "ScrollText",
        state: "TX"
    }
];

// Florida Forms
const FL_TEMPLATES: DefaultTemplate[] = [
    {
        name: "FL-1",
        filename: "FL-1.pdf",
        title: "Petition for Administration",
        description: "Petition to open formal probate administration.",
        category: "Probate Initialization",
        icon: "FileText",
        state: "FL"
    },
    {
        name: "FL-2",
        filename: "FL-2.pdf",
        title: "Petition for Summary Administration",
        description: "Simplified procedure for estates under $75,000.",
        category: "Small Estate",
        icon: "ScrollText",
        state: "FL"
    },
    {
        name: "FL-3",
        filename: "FL-3.pdf",
        title: "Notice of Administration",
        description: "Notice to interested parties of probate proceeding.",
        category: "Notices",
        icon: "Bell",
        state: "FL"
    },
    {
        name: "FL-4",
        filename: "FL-4.pdf",
        title: "Oath of Personal Representative",
        description: "Sworn oath of personal representative duties.",
        category: "Authority",
        icon: "ShieldCheck",
        state: "FL"
    },
    {
        name: "FL-5",
        filename: "FL-5.pdf",
        title: "Letters of Administration",
        description: "Official authority for personal representative to act.",
        category: "Authority",
        icon: "ShieldCheck",
        state: "FL"
    },
    {
        name: "FL-6",
        filename: "FL-6.pdf",
        title: "Inventory",
        description: "Complete inventory of estate assets and values.",
        category: "Assets",
        icon: "Scale",
        state: "FL"
    },
    {
        name: "FL-7",
        filename: "FL-7.pdf",
        title: "Notice to Creditors",
        description: "Published notice to creditors of the estate.",
        category: "Notices",
        icon: "Bell",
        state: "FL"
    },
    {
        name: "FL-8",
        filename: "FL-8.pdf",
        title: "Proof of Claim",
        description: "Form for creditors to file claims against estate.",
        category: "Creditor Claims",
        icon: "FileWarning",
        state: "FL"
    },
    {
        name: "FL-9",
        filename: "FL-9.pdf",
        title: "Objection to Claim",
        description: "Personal representative's objection to creditor claim.",
        category: "Creditor Claims",
        icon: "CheckSquare",
        state: "FL"
    },
    {
        name: "FL-10",
        filename: "FL-10.pdf",
        title: "Accounting",
        description: "Accounting of estate receipts and disbursements.",
        category: "Accounting",
        icon: "FileText",
        state: "FL"
    },
    {
        name: "FL-11",
        filename: "FL-11.pdf",
        title: "Petition for Discharge",
        description: "Request to close estate and discharge representative.",
        category: "Estate Closing",
        icon: "CheckCircle2",
        state: "FL"
    },
    {
        name: "FL-12",
        filename: "FL-12.pdf",
        title: "Final Accounting",
        description: "Final accounting before estate closure.",
        category: "Accounting",
        icon: "FileText",
        state: "FL"
    },
    {
        name: "FL-13",
        filename: "FL-13.pdf",
        title: "Receipt and Release",
        description: "Beneficiary acknowledgment of distribution.",
        category: "Distribution",
        icon: "Users",
        state: "FL"
    },
    {
        name: "FL-14",
        filename: "FL-14.pdf",
        title: "Disposition Without Administration",
        description: "Simplified procedure for very small estates.",
        category: "Small Estate",
        icon: "FileText",
        state: "FL"
    },
    {
        name: "FL-15",
        filename: "FL-15.pdf",
        title: "Homestead Property Petition",
        description: "Petition regarding homestead property rights.",
        category: "Spousal Property",
        icon: "Home",
        state: "FL"
    }
];

// Combine all templates
const DEFAULT_TEMPLATES: DefaultTemplate[] = [
    ...CA_TEMPLATES,
    ...NY_TEMPLATES,
    ...TX_TEMPLATES,
    ...FL_TEMPLATES
];

export class FormSeedingService {
    private static TEMPLATES_DIR = path.join(process.cwd(), 'server', 'templates');

    static async seedDefaults() {
        logger.info("🌱 Seeding default form templates...");

        for (const t of DEFAULT_TEMPLATES) {
            try {
                const filePath = path.join(this.TEMPLATES_DIR, t.filename);
                if (!fs.existsSync(filePath)) {
                    logger.warn(`⚠️  Skip seeding ${t.name}: File not found at ${filePath}`);
                    continue;
                }

                const fileData = fs.readFileSync(filePath);

                await prisma.formTemplate.upsert({
                    where: { name: t.name },
                    update: {
                        title: t.title,
                        description: t.description,
                        category: t.category,
                        icon: t.icon,
                        data: fileData,
                        state: t.state || "CA"
                    },
                    create: {
                        name: t.name,
                        title: t.title,
                        description: t.description,
                        category: t.category,
                        icon: t.icon,
                        data: fileData,
                        state: t.state || "CA"
                    }
                });
                logger.info(`✅ Seeded template: ${t.name} (${t.state || "CA"})`);
            } catch (error: any) {
                logger.error(`❌ Failed to seed template ${t.name}:`, error.message);
            }
        }
        logger.info("🏁 Default form templates seeding complete.");
    }
}
