import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FormDefinition {
    code: string;
    filename: string;
    url: string;
    title: string;
    description: string;
    category: string;
    icon: string;
}

// California Probate Forms to Download
const FORMS_TO_DOWNLOAD: FormDefinition[] = [
    {
        code: "DE-110",
        filename: "DE-110.pdf",
        url: "https://www.courts.ca.gov/documents/de110.pdf",
        title: "Petition for Probate of Will and for Letters Testamentary",
        description: "Petition to probate a will and request appointment as executor.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "DE-111",
        filename: "DE-111.pdf",
        url: "https://www.courts.ca.gov/documents/de111.pdf",
        title: "Petition for Probate",
        description: "The primary document used to start the probate process.",
        category: "Probate Initialization",
        icon: "ScrollText"
    },
    {
        code: "DE-120",
        filename: "DE-120.pdf",
        url: "https://www.courts.ca.gov/documents/de120.pdf",
        title: "Notice of Hearing (Probate)",
        description: "Notice of the probate hearing date and time.",
        category: "Notices",
        icon: "Bell"
    },
    {
        code: "DE-121",
        filename: "DE-121.pdf",
        url: "https://www.courts.ca.gov/documents/de121.pdf",
        title: "Notice of Petition to Administer Estate",
        description: "Official notice for heirs and creditors.",
        category: "Notices",
        icon: "Bell"
    },
    {
        code: "DE-131",
        filename: "DE-131.pdf",
        url: "https://www.courts.ca.gov/documents/de131.pdf",
        title: "Proof of Subscribing Witness",
        description: "Witness testimony to prove the validity of a will.",
        category: "Probate Initialization",
        icon: "UserCheck"
    },
    {
        code: "DE-135",
        filename: "DE-135.pdf",
        url: "https://www.courts.ca.gov/documents/de135.pdf",
        title: "Proof of Holographic Instrument",
        description: "Proof of a handwritten will.",
        category: "Probate Initialization",
        icon: "PenTool"
    },
    {
        code: "DE-140",
        filename: "DE-140.pdf",
        url: "https://www.courts.ca.gov/documents/de140.pdf",
        title: "Order for Probate",
        description: "Court order granting probate and appointing the personal representative.",
        category: "Court Orders",
        icon: "Gavel"
    },
    {
        code: "DE-147",
        filename: "DE-147.pdf",
        url: "https://www.courts.ca.gov/documents/de147.pdf",
        title: "Duties and Liabilities of Personal Representative",
        description: "Information about executor responsibilities and duties.",
        category: "Authority",
        icon: "ShieldAlert"
    },
    {
        code: "DE-150",
        filename: "DE-150.pdf",
        url: "https://www.courts.ca.gov/documents/de150.pdf",
        title: "Letters",
        description: "Official evidence of authority to act as personal representative.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "DE-157",
        filename: "DE-157.pdf",
        url: "https://www.courts.ca.gov/documents/de157.pdf",
        title: "Notice of Administration to Creditors",
        description: "Notice to creditors that probate has been opened.",
        category: "Notices",
        icon: "AlertCircle"
    },
    {
        code: "DE-160",
        filename: "DE-160.pdf",
        url: "https://www.courts.ca.gov/documents/de160.pdf",
        title: "Inventory and Appraisal",
        description: "A complete list of estate assets and their values.",
        category: "Assets",
        icon: "Scale"
    },
    {
        code: "DE-161",
        filename: "DE-161.pdf",
        url: "https://www.courts.ca.gov/documents/de161.pdf",
        title: "Inventory and Appraisal Attachment",
        description: "Additional pages for listing more assets.",
        category: "Assets",
        icon: "Paperclip"
    },
    {
        code: "DE-165",
        filename: "DE-165.pdf",
        url: "https://www.courts.ca.gov/documents/de165.pdf",
        title: "Notice of Proposed Action",
        description: "Notice to beneficiaries of proposed actions.",
        category: "Notices",
        icon: "AlertCircle"
    },
    {
        code: "DE-172",
        filename: "DE-172.pdf",
        url: "https://www.courts.ca.gov/documents/de172.pdf",
        title: "Creditor's Claim",
        description: "Form for creditors to file claims against the estate.",
        category: "Creditor Claims",
        icon: "FileWarning"
    },
    {
        code: "DE-174",
        filename: "DE-174.pdf",
        url: "https://www.courts.ca.gov/documents/de174.pdf",
        title: "Allowance or Rejection of Creditor's Claim",
        description: "Executor's response to creditor claims.",
        category: "Creditor Claims",
        icon: "CheckSquare"
    },
    {
        code: "DE-221",
        filename: "DE-221.pdf",
        url: "https://www.courts.ca.gov/documents/de221.pdf",
        title: "Spousal or Domestic Partner Property Petition",
        description: "Petition to confirm property passing to surviving spouse.",
        category: "Spousal Property",
        icon: "Heart"
    },
    {
        code: "DE-260",
        filename: "DE-260.pdf",
        url: "https://www.courts.ca.gov/documents/de260.pdf",
        title: "Ex Parte Petition for Authority to Sell Real Property",
        description: "Request court authorization to sell real estate.",
        category: "Asset Sales",
        icon: "Home"
    },
    {
        code: "DE-270",
        filename: "DE-270.pdf",
        url: "https://www.courts.ca.gov/documents/de270.pdf",
        title: "Ex Parte Petition for Authority to Sell Securities",
        description: "Request court authorization to sell stocks and bonds.",
        category: "Asset Sales",
        icon: "TrendingUp"
    },
    {
        code: "DE-295",
        filename: "DE-295.pdf",
        url: "https://www.courts.ca.gov/documents/de295.pdf",
        title: "Ex Parte Petition for Final Discharge",
        description: "Request to close the estate and discharge the executor.",
        category: "Estate Closing",
        icon: "CheckCircle2"
    },
    {
        code: "DE-305",
        filename: "DE-305.pdf",
        url: "https://www.courts.ca.gov/documents/de305.pdf",
        title: "Affidavit Re Real Property of Small Value",
        description: "Simplified procedure for small estates with real property.",
        category: "Small Estate",
        icon: "Home"
    },
    {
        code: "DE-310",
        filename: "DE-310.pdf",
        url: "https://www.courts.ca.gov/documents/de310.pdf",
        title: "Petition to Determine Succession to Real Property",
        description: "Petition to determine who inherits real property in estates under $184,500.",
        category: "Succession",
        icon: "FileSignature"
    },
    {
        code: "DE-315",
        filename: "DE-315.pdf",
        url: "https://www.courts.ca.gov/documents/de315.pdf",
        title: "Order Determining Succession to Real Property",
        description: "Court order determining succession to real property.",
        category: "Court Orders",
        icon: "Gavel"
    },
    {
        code: "DE-350",
        filename: "DE-350.pdf",
        url: "https://www.courts.ca.gov/documents/de350.pdf",
        title: "Petition for Appointment of Guardian Ad Litem—Probate",
        description: "Petition to appoint a guardian ad litem for a minor or incapacitated person.",
        category: "Guardian Ad Litem",
        icon: "UserPlus"
    },
    {
        code: "DE-351",
        filename: "DE-351.pdf",
        url: "https://www.courts.ca.gov/documents/de351.pdf",
        title: "Order Appointing Guardian Ad Litem—Probate",
        description: "Court order appointing a guardian ad litem.",
        category: "Court Orders",
        icon: "ShieldCheck"
    },
    {
        code: "DE-154",
        filename: "DE-154.pdf",
        url: "https://www.courts.ca.gov/documents/de154.pdf",
        title: "Request for Special Notice",
        description: "Request to receive notice of all filings in a probate case.",
        category: "Notices",
        icon: "MailSearch"
    },
    {
        code: "DE-226",
        filename: "DE-226.pdf",
        url: "https://www.courts.ca.gov/documents/de226.pdf",
        title: "Spousal or Domestic Partner Property Order",
        description: "Court order confirming property passing to surviving spouse.",
        category: "Court Orders",
        icon: "HeartHandshake"
    },
    {
        code: "DE-142",
        filename: "DE-142.pdf",
        url: "https://www.courts.ca.gov/documents/de142.pdf",
        title: "Waiver of Bond by Heir or Beneficiary",
        description: "Form for heirs to waive the requirement for executor bond.",
        category: "Bond Waiver",
        icon: "UserMinus"
    },
    {
        code: "DE-115",
        filename: "DE-115.pdf",
        url: "https://www.courts.ca.gov/documents/de115.pdf",
        title: "Objection to Probate of Will",
        description: "Formal objection filed to contest the validity of a will.",
        category: "Contest",
        icon: "XCircle"
    },
    {
        code: "DE-200",
        filename: "DE-200.pdf",
        url: "https://www.courts.ca.gov/documents/de200.pdf",
        title: "Order Prescribing Notice",
        description: "Court order determining the notice required for a specific hearing.",
        category: "Court Orders",
        icon: "BellRing"
    },
    {
        code: "DE-166",
        filename: "DE-166.pdf",
        url: "https://www.courts.ca.gov/documents/de166.pdf",
        title: "Waiver of Notice of Proposed Action",
        description: "Heir's waiver of the 15-day notice period for IAEA actions.",
        category: "Asset Sales",
        icon: "UserCheck"
    },
    {
        code: "DE-143",
        filename: "DE-143.pdf",
        url: "", // Placeholder
        title: "Order Waiving Bond (Custom/DE-143)",
        description: "Placeholder for the court order waiving bond requirement.",
        category: "Court Orders",
        icon: "Gavel"
    },
    {
        code: "DE-116",
        filename: "DE-116.pdf",
        url: "", // Placeholder
        title: "Petition for Determination of Will Validity",
        description: "Placeholder for contested will validity petition.",
        category: "Contest",
        icon: "FileQuestion"
    },
    {
        code: "DE-130",
        filename: "DE-130.pdf",
        url: "https://www.courts.ca.gov/documents/de130.pdf",
        title: "Proof of Publication (DE-130)",
        description: "Affidavit from newspaper proving notice publication.",
        category: "Notices",
        icon: "Newspaper"
    },
    {
        code: "FINAL_ORDER",
        filename: "FINAL_ORDER.pdf",
        url: "", // Template needed
        title: "Order for Final Distribution",
        description: "Court order approving the final distribution of assets.",
        category: "Distribution",
        icon: "Gavel"
    },
    {
        code: "DE-275",
        filename: "DE-275.pdf",
        url: "https://www.courts.ca.gov/documents/de275.pdf",
        title: "Order Confirming Sale of Securities",
        description: "Court order approving the sale of stocks or bonds.",
        category: "Court Orders",
        icon: "CheckCircle"
    },
    {
        code: "DE-147S",
        filename: "DE-147s.pdf",
        url: "https://www.courts.ca.gov/documents/de147s.pdf",
        title: "Confidential Supplement to Duties and Liabilities",
        description: "Confidential social security and driver's license info for PR.",
        category: "Authority",
        icon: "Lock"
    },
    {
        code: "SECTION_13100",
        filename: "Section_13100_Affidavit.pdf",
        url: "", // Template needed
        title: "Affidavit for Collection of Personal Property",
        description: "13100 Affidavit for small estates without real property.",
        category: "Small Estate",
        icon: "FileText"
    },
    {
        code: "DE-120A",
        filename: "DE-120A.pdf",
        url: "https://www.courts.ca.gov/documents/de120a.pdf",
        title: "Attachment to Notice of Hearing",
        description: "Additional persons to be served with notice.",
        category: "Notices",
        icon: "Users"
    }
];

class FormDownloader {
    private templatesDir: string;
    private downloadedCount = 0;
    private failedCount = 0;
    private skippedCount = 0;

    constructor() {
        this.templatesDir = path.join(process.cwd(), 'server', 'templates');
        this.ensureTemplatesDir();
    }

    private ensureTemplatesDir() {
        if (!fs.existsSync(this.templatesDir)) {
            fs.mkdirSync(this.templatesDir, { recursive: true });
            console.log(`📁 Created templates directory: ${this.templatesDir}`);
        }
    }

    private downloadFile(url: string, destination: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(destination);

            protocol.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        file.close();
                        fs.unlinkSync(destination);
                        return this.downloadFile(redirectUrl, destination).then(resolve).catch(reject);
                    }
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destination);
                    return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (err) => {
                    file.close();
                    fs.unlinkSync(destination);
                    reject(err);
                });
            }).on('error', (err) => {
                file.close();
                if (fs.existsSync(destination)) {
                    fs.unlinkSync(destination);
                }
                reject(err);
            });
        });
    }

    private async downloadForm(form: FormDefinition): Promise<boolean> {
        const destination = path.join(this.templatesDir, form.filename);

        // Check if file already exists
        if (fs.existsSync(destination)) {
            const stats = fs.statSync(destination);
            if (stats.size > 0) {
                console.log(`⏭️  Skipped ${form.code}: Already exists (${(stats.size / 1024).toFixed(1)} KB)`);
                this.skippedCount++;
                return true;
            }
        }

        try {
            console.log(`⬇️  Downloading ${form.code}: ${form.title}...`);
            await this.downloadFile(form.url, destination);

            const stats = fs.statSync(destination);
            console.log(`✅ Downloaded ${form.code}: ${(stats.size / 1024).toFixed(1)} KB`);
            this.downloadedCount++;
            return true;
        } catch (error: any) {
            console.error(`❌ Failed to download ${form.code}: ${error.message}`);
            this.failedCount++;
            return false;
        }
    }

    async downloadAll(forceRedownload: boolean = false) {
        console.log('🚀 California Probate Forms Downloader');
        console.log('=====================================\n');
        console.log(`📂 Target directory: ${this.templatesDir}`);
        console.log(`📋 Forms to download: ${FORMS_TO_DOWNLOAD.length}\n`);

        if (forceRedownload) {
            console.log('🔄 Force re-download enabled\n');
        }

        for (const form of FORMS_TO_DOWNLOAD) {
            if (forceRedownload) {
                const destination = path.join(this.templatesDir, form.filename);
                if (fs.existsSync(destination)) {
                    fs.unlinkSync(destination);
                }
            }
            await this.downloadForm(form);
            // Small delay to be respectful to the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n=====================================');
        console.log('📊 Download Summary:');
        console.log(`   ✅ Downloaded: ${this.downloadedCount}`);
        console.log(`   ⏭️  Skipped: ${this.skippedCount}`);
        console.log(`   ❌ Failed: ${this.failedCount}`);
        console.log(`   📁 Total files: ${this.downloadedCount + this.skippedCount}`);
        console.log('=====================================\n');

        if (this.failedCount > 0) {
            console.log('⚠️  Some forms failed to download. Check the errors above.');
            console.log('💡 Tip: The California Courts website may have moved or renamed some forms.');
            console.log('   Visit https://www.courts.ca.gov/forms.htm to verify URLs.\n');
        }

        if (this.downloadedCount > 0 || this.skippedCount > 0) {
            console.log('✨ Next steps:');
            console.log('   1. Run: npm run seed-forms');
            console.log('   2. Restart your server');
            console.log('   3. Check the Forms page to see the new forms\n');
        }
    }

    generateFormsList() {
        console.log('\n📝 Generating forms list for formSeedingService.ts...\n');

        const formsList = FORMS_TO_DOWNLOAD.map(form => {
            return `    {
        name: "${form.code}",
        filename: "${form.filename}",
        title: "${form.title}",
        description: "${form.description}",
        category: "${form.category}",
        icon: "${form.icon}"
    }`;
        }).join(',\n');

        console.log('Copy this to server/services/formSeedingService.ts:\n');
        console.log('const DEFAULT_TEMPLATES: DefaultTemplate[] = [');
        console.log(formsList);
        console.log('];\n');
    }
}

// Main execution
const args = process.argv.slice(2);
const forceRedownload = args.includes('--force') || args.includes('-f');
const generateList = args.includes('--list') || args.includes('-l');

const downloader = new FormDownloader();

if (generateList) {
    downloader.generateFormsList();
} else {
    downloader.downloadAll(forceRedownload)
        .then(() => {
            console.log('✅ Form download process completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}
