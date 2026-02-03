import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// ============================================================================
// STATE CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const STATE_CODE = "XX";  // Two-letter state code (e.g., "NY", "TX", "FL")
const STATE_NAME = "State Name";  // Full state name (e.g., "New York")

// ============================================================================
// FORM DEFINITIONS - ADD YOUR STATE'S FORMS HERE
// ============================================================================

interface FormDefinition {
    code: string;        // State's official form code
    filename: string;    // Filename to save as (e.g., "ET-1.pdf")
    url: string;         // Direct URL to PDF
    title: string;       // Form title
    description: string; // Brief description
    category: string;    // Category (see list below)
    icon: string;        // Lucide icon name
}

/**
 * CATEGORY OPTIONS:
 * - "Probate Initialization"
 * - "Notices"
 * - "Court Orders"
 * - "Authority"
 * - "Assets"
 * - "Creditor Claims"
 * - "Spousal Property"
 * - "Asset Sales"
 * - "Estate Closing"
 * - "Small Estate"
 * - "Distribution"
 * - "Accounting"
 * 
 * ICON OPTIONS (Lucide React):
 * - FileText, ScrollText, Bell, Gavel, ShieldCheck, ShieldAlert
 * - Scale, Paperclip, FileWarning, CheckSquare, Heart, Home
 * - TrendingUp, CheckCircle2, Users, CheckCircle, AlertCircle
 * - UserCheck, PenTool
 */

const FORMS_TO_DOWNLOAD: FormDefinition[] = [
    {
        code: "FORM-1",
        filename: "FORM-1.pdf",
        url: "https://state-courts.gov/forms/form1.pdf",
        title: "Petition for Probate",
        description: "Initial petition to open probate proceedings.",
        category: "Probate Initialization",
        icon: "FileText"
    },
    {
        code: "FORM-2",
        filename: "FORM-2.pdf",
        url: "https://state-courts.gov/forms/form2.pdf",
        title: "Notice to Creditors",
        description: "Official notice to creditors of the estate.",
        category: "Notices",
        icon: "Bell"
    },
    // ADD MORE FORMS HERE (aim for 10-20 forms)
    // Copy the structure above and update with your state's forms
];

// ============================================================================
// DOWNLOADER CLASS - NO NEED TO MODIFY BELOW THIS LINE
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
            console.log(`💡 Tip: Visit the ${STATE_NAME} courts website to verify URLs.\n`);
        }

        if (this.downloadedCount > 0 || this.skippedCount > 0) {
            console.log('✨ Next steps:');
            console.log('   1. Run: npm run seed-forms');
            console.log('   2. Restart your server');
            console.log('   3. Check the Forms page to see the new forms\n');
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

        console.log(`Copy this to server/services/formSeedingService.ts:\n`);
        console.log(`const ${STATE_CODE}_TEMPLATES: DefaultTemplate[] = [`);
        console.log(formsList);
        console.log('];\n');
        console.log(`Then add to DEFAULT_TEMPLATES array:`);
        console.log(`const DEFAULT_TEMPLATES = [...CA_TEMPLATES, ...${STATE_CODE}_TEMPLATES];\n`);
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

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
