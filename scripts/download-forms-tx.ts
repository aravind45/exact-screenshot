import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// ============================================================================
// TEXAS PROBATE FORMS DOWNLOADER
// ============================================================================

const STATE_CODE = "TX";
const STATE_NAME = "Texas";

interface FormDefinition {
    code: string;
    filename: string;
    url: string;
    title: string;
    description: string;
    category: string;
    icon: string;
}

// Texas Probate Forms
// Official Source: https://www.txcourts.gov/forms/
// Note: Texas forms are less centralized - URLs may need verification
const FORMS_TO_DOWNLOAD: FormDefinition[] = [
    {
        code: "TX-1",
        filename: "TX-1.pdf",
        url: "https://www.txcourts.gov/media/1435951/application-for-probate-of-will.pdf",
        title: "Application for Probate of Will",
        description: "Application to admit will to probate and appoint executor.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "TX-2",
        filename: "TX-2.pdf",
        url: "https://www.txcourts.gov/media/1435952/application-for-letters-of-administration.pdf",
        title: "Application for Letters of Administration",
        description: "Application for letters when there is no will.",
        category: "Probate Initialization",
        icon: "ScrollText"
    },
    {
        code: "TX-3",
        filename: "TX-3.pdf",
        url: "https://www.txcourts.gov/media/1435953/application-for-independent-administration.pdf",
        title: "Application for Independent Administration",
        description: "Application for independent administration (unique to Texas).",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "TX-4",
        filename: "TX-4.pdf",
        url: "https://www.txcourts.gov/media/1435954/order-admitting-will-to-probate.pdf",
        title: "Order Admitting Will to Probate",
        description: "Court order admitting will to probate.",
        category: "Court Orders",
        icon: "Gavel"
    },
    {
        code: "TX-5",
        filename: "TX-5.pdf",
        url: "https://www.txcourts.gov/media/1435955/letters-testamentary.pdf",
        title: "Letters Testamentary",
        description: "Official authority for executor to act.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "TX-6",
        filename: "TX-6.pdf",
        url: "https://www.txcourts.gov/media/1435956/letters-of-administration.pdf",
        title: "Letters of Administration",
        description: "Official authority for administrator to act.",
        category: "Authority",
        icon: "ShieldCheck"
    },
    {
        code: "TX-7",
        filename: "TX-7.pdf",
        url: "https://www.txcourts.gov/media/1435957/inventory-appraisement-list-of-claims.pdf",
        title: "Inventory, Appraisement and List of Claims",
        description: "Complete inventory of estate assets and claims.",
        category: "Assets",
        icon: "Scale"
    },
    {
        code: "TX-8",
        filename: "TX-8.pdf",
        url: "https://www.txcourts.gov/media/1435958/annual-account.pdf",
        title: "Annual Account",
        description: "Annual accounting of estate receipts and disbursements.",
        category: "Accounting",
        icon: "FileText"
    },
    {
        code: "TX-9",
        filename: "TX-9.pdf",
        url: "https://www.txcourts.gov/media/1435959/application-to-close-estate.pdf",
        title: "Application to Close Estate",
        description: "Application to close and distribute estate.",
        category: "Estate Closing",
        icon: "CheckCircle2"
    },
    {
        code: "TX-10",
        filename: "TX-10.pdf",
        url: "https://www.txcourts.gov/media/1435960/final-account.pdf",
        title: "Final Account",
        description: "Final accounting before estate closure.",
        category: "Accounting",
        icon: "FileText"
    },
    {
        code: "TX-11",
        filename: "TX-11.pdf",
        url: "https://www.txcourts.gov/media/1435961/small-estate-affidavit.pdf",
        title: "Small Estate Affidavit",
        description: "Simplified procedure for small estates under $75,000.",
        category: "Small Estate",
        icon: "FileText"
    },
    {
        code: "TX-12",
        filename: "TX-12.pdf",
        url: "https://www.txcourts.gov/media/1435962/muniment-of-title.pdf",
        title: "Muniment of Title",
        description: "Simplified probate process unique to Texas.",
        category: "Small Estate",
        icon: "ScrollText"
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

        console.log('⚠️  NOTE: Texas forms are less centralized than other states.');
        console.log('    URLs may need verification from county websites.\n');

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
            console.log('💡 Visit https://www.txcourts.gov/rules-forms/forms/ to verify URLs.');
            console.log('💡 Alternative: Check major county websites (Harris, Dallas, Travis).\n');
        }

        if (this.downloadedCount > 0 || this.skippedCount > 0) {
            console.log('✨ Next steps:');
            console.log('   1. Run: npm run seed-forms');
            console.log('   2. Restart your server');
            console.log('   3. Select Texas in Forms page\n');
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
