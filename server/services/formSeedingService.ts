import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';

interface DefaultTemplate {
    name: string;
    filename: string;
    title: string;
    description: string;
    category: string;
    icon: string;
}

const DEFAULT_TEMPLATES: DefaultTemplate[] = [
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

export class FormSeedingService {
    private static TEMPLATES_DIR = path.join(process.cwd(), 'server', 'templates');

    static async seedDefaults() {
        console.log("🌱 Seeding default form templates...");

        for (const t of DEFAULT_TEMPLATES) {
            try {
                const filePath = path.join(this.TEMPLATES_DIR, t.filename);
                if (!fs.existsSync(filePath)) {
                    console.warn(`⚠️  Skip seeding ${t.name}: File not found at ${filePath}`);
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
                        data: fileData
                    },
                    create: {
                        name: t.name,
                        title: t.title,
                        description: t.description,
                        category: t.category,
                        icon: t.icon,
                        data: fileData,
                        state: "CA"
                    }
                });
                console.log(`✅ Seeded template: ${t.name}`);
            } catch (error) {
                console.error(`❌ Failed to seed template ${t.name}:`, error);
            }
        }
        console.log("🏁 Default form templates seeding complete.");
    }
}
