import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// ============================================================================
// NEW YORK PROBATE FORMS DOWNLOADER
// ============================================================================

const STATE_CODE = "NY";
const STATE_NAME = "New York";

interface FormDefinition {
    code: string;
    filename: string;
    url: string;
    title: string;
    description: string;
    category: string;
    icon: string;
}

// New York Surrogate's Court Forms
// Official Source: https://ww2.nycourts.gov/forms/surrogates/
const FORMS_TO_DOWNLOAD: FormDefinition[] = [
    {
        code: "ET-1",
        filename: "NY-ET-1.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Petition_for_Probate.pdf",
        title: "Petition for Probate",
        description: "Petition to admit will to probate and appoint executor.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "ET-2",
        filename: "NY-ET-2.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Petition_for_Administration.pdf",
        title: "Petition for Administration",
        description: "Petition for letters of administration when there is no will.",
        category: "Probate Initialization",
        icon: "ScrollText"
    },
    {
        code: "ET-3",
        filename: "NY-ET-3.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Petition_for_Ancillary_Probate.pdf",
        title: "Petition for Ancillary Probate",
        description: "Petition for ancillary probate of foreign will.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "ET-4",
        filename: "NY-ET-4.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Citation.pdf",
        title: "Citation",
        description: "Notice to interested parties of probate proceeding.",
        category: "Notices",
        icon: "Bell"
    },
    {
        code: "ET-5",
        filename: "NY-ET-5.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Waiver_and_Consent.pdf",
        title: "Waiver and Consent",
        description: "Waiver of citation and consent to probate.",
        category: "Notices",
        icon: "CheckSquare"
    },
    {
        code: "ET-6",
        filename: "NY-ET-6.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Letters_Testamentary.pdf",
        title: "Letters Testamentary",
        description: "Official authority for executor to act.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "ET-7",
        filename: "NY-ET-7.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Letters_of_Administration.pdf",
        title: "Letters of Administration",
        description: "Official authority for administrator to act.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "ET-8",
        filename: "NY-ET-8.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Inventory.pdf",
        title: "Inventory",
        description: "List of estate assets and values.",
        category: "Assets",
        icon: "Scale"
    },
    {
        code: "ET-9",
        filename: "NY-ET-9.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Account.pdf",
        title: "Account",
        description: "Accounting of estate receipts and disbursements.",
        category: "Accounting",
        icon: "FileText"
    },
    {
        code: "ET-10",
        filename: "NY-ET-10.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Petition_for_Judicial_Settlement.pdf",
        title: "Petition for Judicial Settlement",
        description: "Petition for court approval of accounting.",
        category: "Accounting",
        icon: "Gavel"
    },
    {
        code: "ET-11",
        filename: "NY-ET-11.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Decree.pdf",
        title: "Decree",
        description: "Court order approving accounting and distribution.",
        category: "Court Orders",
        icon: "Gavel"
    },
    {
        code: "ET-12",
        filename: "NY-ET-12.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Receipt_and_Release.pdf",
        title: "Receipt and Release",
        description: "Beneficiary acknowledgment of distribution.",
        category: "Distribution",
        icon: "Users"
    },
    {
        code: "ET-13",
        filename: "NY-ET-13.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Petition_for_Final_Distribution.pdf",
        title: "Petition for Final Distribution",
        description: "Request for court approval of final distribution.",
        category: "Distribution",
        icon: "Users"
    },
    {
        code: "ET-14",
        filename: "NY-ET-14.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Affidavit_of_Heirship.pdf",
        title: "Affidavit of Heirship",
        description: "Sworn statement identifying heirs.",
        category: "Small Estate",
        icon: "FileText"
    },
    {
        code: "ET-15",
        filename: "NY-ET-15.pdf",
        url: "https://ww2.nycourts.gov/sites/default/files/document/files/2018-03/Voluntary_Administration.pdf",
        title: "Voluntary Administration Affidavit",
        description: "Simplified procedure for small estates.",
        category: "Small Estate",
        icon: "FileText"
    }
];

// ============================================================================
// DOWNLOADER CLASS
// ============================================================================

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
        console.log(`🚀 ${STATE_NAME} Probate Forms Downloader`);
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
            console.log('⚠️  Some forms failed to download.');
            console.log('💡 Visit https://ww2.nycourts.gov/forms/surrogates/ to verify URLs.\n');
        }

        if (this.downloadedCount > 0 || this.skippedCount > 0) {
            console.log('✨ Next steps:');
            console.log('   1. Run: npm run seed-forms');
            console.log('   2. Restart your server');
            console.log('   3. Select New York in Forms page\n');
        }
    }

    generateFormsList() {
        console.log(`\n📝 Generating forms list for formSeedingService.ts...\n`);
        
        const formsList = FORMS_TO_DOWNLOAD.map(form => {
            return `    {
        name: "${form.code}",
        filename: "${form.filename}",
        title: "${form.title}",
        description: "${form.description}",
        category: "${form.category}",
        icon: "${form.icon}",
        state: "${STATE_CODE}"
    }`;
        }).join(',\n');

        console.log(`const ${STATE_CODE}_TEMPLATES: DefaultTemplate[] = [`);
        console.log(formsList);
        console.log('];\n');
    }
}

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
