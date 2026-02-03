import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// ============================================================================
// FLORIDA PROBATE FORMS DOWNLOADER
// ============================================================================

const STATE_CODE = "FL";
const STATE_NAME = "Florida";

interface FormDefinition {
    code: string;
    filename: string;
    url: string;
    title: string;
    description: string;
    category: string;
    icon: string;
}

// Florida Probate Forms (11th Circuit - Miami-Dade as template)
// Official Source: https://www.jud11.flcourts.org/probate-smart-forms
// Note: Florida has 21 circuits - forms may vary by circuit
const FORMS_TO_DOWNLOAD: FormDefinition[] = [
    {
        code: "FL-1",
        filename: "FL-1.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/petition-for-administration.pdf",
        title: "Petition for Administration",
        description: "Petition to open formal probate administration.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "FL-2",
        filename: "FL-2.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/petition-for-summary-administration.pdf",
        title: "Petition for Summary Administration",
        description: "Simplified procedure for estates under $75,000.",
        category: "Small Estate",
        icon: "ScrollText"
    },
    {
        code: "FL-3",
        filename: "FL-3.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/notice-of-administration.pdf",
        title: "Notice of Administration",
        description: "Notice to interested parties of probate proceeding.",
        category: "Notices",
        icon: "Bell"
    },
    {
        code: "FL-4",
        filename: "FL-4.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/oath-of-personal-representative.pdf",
        title: "Oath of Personal Representative",
        description: "Sworn oath of personal representative duties.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "FL-5",
        filename: "FL-5.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/letters-of-administration.pdf",
        title: "Letters of Administration",
        description: "Official authority for personal representative to act.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "FL-6",
        filename: "FL-6.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/inventory.pdf",
        title: "Inventory",
        description: "Complete inventory of estate assets and values.",
        category: "Assets",
        icon: "Scale"
    },
    {
        code: "FL-7",
        filename: "FL-7.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/notice-to-creditors.pdf",
        title: "Notice to Creditors",
        description: "Published notice to creditors of the estate.",
        category: "Notices",
        icon: "Bell"
    },
    {
        code: "FL-8",
        filename: "FL-8.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/proof-of-claim.pdf",
        title: "Proof of Claim",
        description: "Form for creditors to file claims against estate.",
        category: "Creditor Claims",
        icon: "FileWarning"
    },
    {
        code: "FL-9",
        filename: "FL-9.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/objection-to-claim.pdf",
        title: "Objection to Claim",
        description: "Personal representative's objection to creditor claim.",
        category: "Creditor Claims",
        icon: "CheckSquare"
    },
    {
        code: "FL-10",
        filename: "FL-10.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/accounting.pdf",
        title: "Accounting",
        description: "Accounting of estate receipts and disbursements.",
        category: "Accounting",
        icon: "FileText"
    },
    {
        code: "FL-11",
        filename: "FL-11.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/petition-for-discharge.pdf",
        title: "Petition for Discharge",
        description: "Request to close estate and discharge representative.",
        category: "Estate Closing",
        icon: "CheckCircle2"
    },
    {
        code: "FL-12",
        filename: "FL-12.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/final-accounting.pdf",
        title: "Final Accounting",
        description: "Final accounting before estate closure.",
        category: "Accounting",
        icon: "FileText"
    },
    {
        code: "FL-13",
        filename: "FL-13.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/receipt-and-release.pdf",
        title: "Receipt and Release",
        description: "Beneficiary acknowledgment of distribution.",
        category: "Distribution",
        icon: "Users"
    },
    {
        code: "FL-14",
        filename: "FL-14.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/disposition-without-administration.pdf",
        title: "Disposition Without Administration",
        description: "Simplified procedure for very small estates.",
        category: "Small Estate",
        icon: "FileText"
    },
    {
        code: "FL-15",
        filename: "FL-15.pdf",
        url: "https://www.jud11.flcourts.org/docs/default-source/probate-forms/homestead-property-petition.pdf",
        title: "Homestead Property Petition",
        description: "Petition regarding homestead property rights.",
        category: "Spousal Property",
        icon: "Home"
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

        console.log('⚠️  NOTE: Florida has 21 judicial circuits.');
        console.log('    These forms are from 11th Circuit (Miami-Dade).');
        console.log('    Your local circuit may have different forms.\n');

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
            console.log('💡 Visit https://www.jud11.flcourts.org/probate-smart-forms to verify URLs.');
            console.log('💡 Alternative: Check your local circuit court website.\n');
        }

        if (this.downloadedCount > 0 || this.skippedCount > 0) {
            console.log('✨ Next steps:');
            console.log('   1. Run: npm run seed-forms');
            console.log('   2. Restart your server');
            console.log('   3. Select Florida in Forms page\n');
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
