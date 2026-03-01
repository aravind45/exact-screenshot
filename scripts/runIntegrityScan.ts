#!/usr/bin/env tsx

/**
 * Integrity Scan CI Script
 * 
 * Runs a full integrity scan across all states and exits with non-zero status
 * if any BLOCKER findings are found. Used in CI/CD pipelines.
 */

import { runFullScan, aggregateFindings } from '../src/shared/integrityChecks/index.js';
import { logger } from '../server/lib/logger.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ScanOptions {
    stateCode?: string;
    checkIds?: string[];
    skipCache?: boolean;
    output?: string;
    verbose?: boolean;
}

function parseArgs(): ScanOptions {
    const args = process.argv.slice(2);
    const options: ScanOptions = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--state' || arg === '-s') {
            options.stateCode = args[++i];
        } else if (arg === '--checks' || arg === '-c') {
            options.checkIds = args[++i].split(',');
        } else if (arg === '--skip-cache') {
            options.skipCache = true;
        } else if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Usage: tsx scripts/runIntegrityScan.ts [options]

Options:
  -s, --state <CODE>       Run scan for a specific state (e.g., CA, TX, NY)
  -c, --checks <LIST>      Comma-separated list of check IDs to run
  --skip-cache              Skip caching and run fresh checks
  -o, --output <FILE>      Save JSON report to file
  -v, --verbose             Show detailed output
  -h, --help               Show this help message

Examples:
  tsx scripts/runIntegrityScan.ts
  tsx scripts/runIntegrityScan.ts --state CA
  tsx scripts/runIntegrityScan.ts --checks crossStateStatuteLeak,authorityScopeLeak
  tsx scripts/runIntegrityScan.ts --output scan-report.json --verbose

Exit Codes:
  0 - All checks passed (no BLOCKER findings)
  1 - BLOCKER findings found
  2 - Error occurred during scan
            `);
            process.exit(0);
        }
    }

    return options;
}

async function main() {
    const options = parseArgs();
    const startTime = Date.now();

    console.log('🔍 Starting Integrity Scan...');
    console.log(`   Scan Type: ${options.stateCode ? 'STATE' : 'FULL'}`);
    if (options.stateCode) console.log(`   State: ${options.stateCode}`);
    if (options.checkIds) console.log(`   Checks: ${options.checkIds.join(', ')}`);
    console.log(`   Skip Cache: ${options.skipCache || false}`);
    console.log('');

    try {
        // Run the scan
        const report = await runFullScan({
            stateCode: options.stateCode,
            checkIds: options.checkIds,
            skipCache: options.skipCache,
            verbose: options.verbose,
        });

        const duration = Date.now() - startTime;

        // Print summary
        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║                    INTEGRITY SCAN RESULTS                        ║');
        console.log('╚════════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`Overall Status: ${report.overallStatus}`);
        console.log(`Total Checks: ${report.totalChecks}`);
        console.log(`Passed: ${report.passedChecks} | Failed: ${report.failedChecks}`);
        console.log('');
        console.log('Findings Summary:');
        console.log(`  🔴 BLOCKER:   ${report.totalFindings.BLOCKER}`);
        console.log(`  🟠 CRITICAL:  ${report.totalFindings.CRITICAL}`);
        console.log(`  🟡 WARNING:   ${report.totalFindings.WARNING}`);
        console.log(`  🔵 INFO:      ${report.totalFindings.INFO}`);
        console.log('');
        console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`Started: ${report.metadata.startedAt}`);
        console.log(`Completed: ${report.metadata.completedAt || 'In Progress'}`);
        console.log('');

        // Show check results
        if (options.verbose || report.totalFindings.BLOCKER > 0 || report.totalFindings.CRITICAL > 0) {
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('CHECK RESULTS');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');

            for (const checkResult of report.checkResults) {
                const status = checkResult.passed ? '✅ PASS' : '❌ FAIL';
                console.log(`${status} - ${checkResult.checkName}`);
                console.log(`    ID: ${checkResult.checkId}`);
                console.log(`    Findings: ${checkResult.findings.length} (${checkResult.severityCounts.BLOCKER} BLOCKER, ${checkResult.severityCounts.CRITICAL} CRITICAL)`);
                console.log(`    Time: ${checkResult.executionTimeMs}ms`);

                if (!checkResult.passed && (options.verbose || checkResult.severityCounts.BLOCKER > 0 || checkResult.severityCounts.CRITICAL > 0)) {
                    console.log('    Violations:');
                    for (const finding of checkResult.findings) {
                        const severityEmoji = finding.severity === 'BLOCKER' ? '🔴' :
                                          finding.severity === 'CRITICAL' ? '🟠' :
                                          finding.severity === 'WARNING' ? '🟡' : '🔵';
                        console.log(`      ${severityEmoji} [${finding.code}] ${finding.message}`);
                        if (finding.taskId) console.log(`         Task: ${finding.taskId}`);
                        if (finding.suggestion) console.log(`         💡 ${finding.suggestion}`);
                    }
                }
                console.log('');
            }
        }

        // Save to file if specified
        if (options.output) {
            const outputPath = join(process.cwd(), options.output);
            writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
            console.log(`✅ Report saved to: ${outputPath}`);
            console.log('');
        }

        // Determine exit code
        if (report.totalFindings.BLOCKER > 0) {
            console.log('❌ Scan failed with BLOCKER findings');
            console.log('   Please review and fix the issues above before merging.');
            process.exit(1);
        } else if (report.overallStatus === 'FAILED') {
            console.log('⚠️  Scan failed with CRITICAL findings');
            console.log('   Review recommended but not blocking.');
            process.exit(0); // Not blocking for CI
        } else {
            console.log('✅ All checks passed!');
            process.exit(0);
        }

    } catch (error) {
        console.error('');
        console.error('❌ Error during integrity scan:');
        console.error(error);
        console.error('');
        console.error('Please check the error and try again.');
        process.exit(2);
    }
}

main();
