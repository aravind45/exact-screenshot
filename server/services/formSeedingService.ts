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
        name: "DE-111",
        filename: "DE-111.pdf",
        title: "Petition for Probate",
        description: "The primary document used to start the probate process. Pre-filled with decedent and petitioner headers.",
        category: "Probate Initialization",
        icon: "ScrollText"
    },
    {
        name: "DE-150",
        filename: "DE-150 LETTERS (Probate).pdf",
        title: "Letters",
        description: "Official evidence of authority. Pre-filled with decedent and representative headers.",
        category: "Authority",
        icon: "Gavel"
    },
    {
        name: "DE-160",
        filename: "DE-160 INVENTORY AND APPRAISAL.pdf",
        title: "Inventory and Appraisal",
        description: "A complete list of assets. Pre-filled with estate and attorney headers.",
        category: "Assets",
        icon: "Scale"
    },
    {
        name: "DE-121",
        filename: "DE-121 NOTICE OF PETITION TO ADMINISTER ESTATE (Probate—Decedents’ Estates).pdf",
        title: "Notice of Petition to Administer Estate",
        description: "Official notice for heirs and creditors. Pre-filled with hearing information headers.",
        category: "Notices",
        icon: "FileText"
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
                        data: fileData
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
