import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Task descriptions mapping
 * Provides helpful, actionable descriptions for each task
 */
const TASK_DESCRIPTIONS: Record<string, string> = {
    // Preliminary Assessment
    "gather_death_certs": "Order at least 10 certified copies of the death certificate. You'll need these for banks, insurance companies, government agencies, and court filings.",
    "locate_will": "Search for the original will in safe deposit boxes, home safes, attorney offices, or with the deceased's important papers. The original is required for probate.",
    "identify_assets": "Create a preliminary list of all assets including bank accounts, real estate, vehicles, investments, and personal property. This helps determine the estate value.",
    "check_small_estate": "Determine if the estate qualifies for simplified small estate procedures (typically under $184,500 in California). This can save time and money.",
    "confirm_executor_role": "Verify you are named as executor in the will or are eligible to serve as administrator. Review your fiduciary duties and responsibilities.",

    // Court Petition
    "file_petition": "Complete and file the Petition for Probate (Form DE-111) with the Superior Court. This initiates the formal probate process and requests appointment as executor.",
    "lodge_will": "File the original will with the court. The court requires the physical original document, not a copy, to validate its authenticity.",
    "publish_notice": "Publish a Notice of Petition to Administer Estate in a local newspaper for 3 consecutive weeks. This provides public notice of the probate proceedings.",
    "mail_notice": "Send written notice of the probate petition to all heirs, beneficiaries, and interested parties at least 15 days before the hearing date.",

    // Fiduciary Authority
    "attend_hearing": "Attend the probate hearing where the judge will review your petition and may ask questions about the estate and your qualifications as executor.",
    "bond": "Obtain a fiduciary bond (surety bond) if required by the will or court. This protects beneficiaries from potential executor misconduct.",
    "letters": "Obtain certified Letters Testamentary (Form DE-150) from the court. These official documents prove your legal authority to act on behalf of the estate.",
    "ein": "Apply for an Employer Identification Number (EIN) from the IRS for the estate. This is required for opening estate bank accounts and filing tax returns.",
    "receive_letters": "Receive and make multiple certified copies of your Letters Testamentary. You'll need these to access accounts and conduct estate business.",

    // Discovery & Inventory
    "notify_banks": "Send Letters Testamentary to all financial institutions to notify them of the death and establish your authority to access accounts.",
    "inventory_assets": "Create a detailed inventory of all estate assets with date-of-death values. This includes real estate, vehicles, bank accounts, investments, and personal property.",
    "appraise_property": "Hire a professional appraiser to determine the fair market value of real estate and valuable personal property as of the date of death.",
    "file_inventory": "File the Inventory and Appraisal (Form DE-160) with the court within 4 months of your appointment, listing all assets and their values.",

    // Creditor Claims
    "publish_creditor_notice": "Publish a Notice to Creditors in a newspaper to inform potential creditors they have 4 months to file claims against the estate.",
    "mail_creditor_notice": "Send direct written notice to all known creditors informing them of the probate and the deadline to file claims (typically 60 days from mailing).",
    "review_claims": "Review all creditor claims filed with the court for validity. You have the right to accept, reject, or negotiate claims.",
    "pay_priority_debts": "Pay valid creditor claims in the order of priority established by law: funeral expenses, administration costs, taxes, then general debts.",
    "reject_invalid_claims": "Formally reject any claims that are invalid, untimely, or unsupported by documentation. Creditors can then challenge your rejection in court.",
    "notify_creditors": "Send formal notifications to all creditors about the estate proceedings and claims process.",

    // Asset Liquidation
    "list_real_estate": "List real estate for sale if needed to pay debts or distribute proceeds. May require court approval depending on the will and circumstances.",
    "sell_vehicles": "Transfer or sell vehicles as directed by the will or as needed. Obtain DMV transfer forms and handle title transfers properly.",
    "sell_property": "Complete the sale of estate property following court approval if required. Ensure proper documentation and distribution of proceeds.",
    "close_accounts": "Close bank accounts, credit cards, and other financial accounts after all transactions are complete and funds are distributed.",
    "file_tax_returns": "File final income tax returns for the deceased and any required estate tax returns. Consult a tax professional for complex estates.",

    // Final Distribution
    "prepare_accounting": "Prepare a detailed accounting of all estate receipts and disbursements from the date of death to distribution.",
    "file_final_petition": "File the Petition for Final Distribution with the court, requesting approval to distribute remaining assets to beneficiaries.",
    "file_distribution_petition": "Submit the final distribution petition showing how assets will be divided among beneficiaries according to the will or intestacy law.",
    "distribute_assets": "Distribute estate assets to beneficiaries according to the court-approved distribution plan. Obtain signed receipts from all beneficiaries.",
    "collect_receipts": "Collect signed receipts from all beneficiaries acknowledging their receipt of distributed assets. File these with the court.",
    "file_closing_statement": "File a final accounting and closing statement with the court showing all estate transactions have been completed properly.",
    "close_estate": "Obtain the court's order closing the estate and discharging you from your duties as executor.",
    "discharge_executor": "Receive formal discharge from the court, releasing you from further liability and officially closing the probate case.",

    // Trust Administration
    "accept_trusteeship": "Formally accept your role as successor trustee by signing an acceptance document. Review the trust terms and your fiduciary duties.",
    "issue_cert_trust": "Prepare a Certification of Trust (short-form trust document) to provide to financial institutions without revealing private trust details.",
    "notify_beneficiaries": "Send written notice to all trust beneficiaries informing them of the settlor's death and your role as trustee, as required by law.",
    "inventory_trust_assets": "Create a complete inventory of all trust assets including real estate, accounts, investments, and personal property.",
    "fund_trust": "Transfer any assets that should have been in the trust but weren't (pour-over assets) into the trust name.",
    "pay_trust_debts": "Pay all valid debts, final expenses, and taxes from trust assets before distributing to beneficiaries.",
    "distribute_trust_assets": "Distribute trust assets to beneficiaries according to the trust terms. Obtain signed receipts and maintain detailed records.",
    "final_trust_accounting": "Prepare a final accounting for beneficiaries showing all trust receipts, disbursements, and distributions.",

    // Small Estate Affidavit
    "prepare_affidavit": "Complete the Small Estate Affidavit form declaring the estate value is under the statutory limit and listing all assets and heirs.",
    "file_affidavit": "File the Small Estate Affidavit with the court or present it directly to asset holders (banks, DMV, etc.) to claim assets.",
    "collect_small_assets": "Use the affidavit to collect estate assets from banks, insurance companies, and other holders without formal probate.",
    "pay_small_debts": "Pay any outstanding debts and final expenses from collected assets before distributing to heirs.",
    "distribute_small_estate": "Distribute remaining assets to heirs according to the will or intestacy law. Keep records of all distributions.",

    // Spousal Property
    "verify_community_property": "Confirm which assets are community property (owned jointly by spouses) versus separate property.",
    "prepare_spousal_petition": "Complete the Spousal Property Petition to confirm community property passes to the surviving spouse without probate.",
    "file_spousal_petition": "File the Spousal Property Petition with the court requesting confirmation of property ownership.",
    "attend_spousal_hearing": "Attend the court hearing on your spousal property petition. The judge will review and approve the property transfer.",
    "obtain_spousal_order": "Obtain the court order confirming your ownership of community property and any other property passing to you.",
    "record_spousal_order": "Record the court order with the county recorder for any real estate to officially transfer title to your name.",

    // POD/TOD Transfers
    "verify_beneficiary_designation": "Confirm you are the named beneficiary on POD (Payable on Death) or TOD (Transfer on Death) accounts or deeds.",
    "gather_beneficiary_docs": "Collect required documents: death certificate, beneficiary designation forms, and your identification.",
    "submit_beneficiary_claim": "Submit the claim forms and documents to the financial institution or county recorder to claim the assets.",
    "receive_pod_transfer": "Receive the transferred funds or property directly as the named beneficiary, bypassing probate.",

    // Intestate (No Will)
    "determine_heirs": "Identify legal heirs according to state intestacy laws (typically spouse and children, then parents, siblings, etc.).",
    "establish_heir_priority": "Determine the order of priority for heirs based on their relationship to the deceased under intestacy law.",
    "petition_administrator": "File a Petition for Letters of Administration requesting appointment as administrator since there is no will.",
    "post_administrator_bond": "Post a bond as required for administrators (typically higher than executor bonds since there's no will waiving it).",
    "obtain_letters_administration": "Receive Letters of Administration from the court granting you authority to administer the intestate estate.",

    // Ancillary Probate
    "verify_domiciliary_probate": "Confirm the primary (domiciliary) probate is complete or in progress in the state where the deceased lived.",
    "obtain_exemplified_will": "Get an exemplified copy of the will and probate order from the domiciliary state, certified for use in other states.",
    "file_ancillary_petition": "File an ancillary probate petition in the state where the out-of-state property is located.",
    "hire_local_counsel": "Retain an attorney licensed in the ancillary state to handle local probate requirements and procedures.",
    "transfer_ancillary_property": "Complete the transfer or sale of property in the ancillary state according to local court orders.",

    // Insolvent Estate
    "determine_insolvency": "Calculate total debts versus total assets to confirm the estate is insolvent (debts exceed assets).",
    "classify_creditor_priority": "Categorize all creditors by legal priority: administration costs, funeral, taxes, secured debts, then unsecured debts.",
    "notify_insolvency": "Notify all creditors that the estate is insolvent and claims will be paid pro-rata within each priority class.",
    "obtain_court_approval": "Get court approval for the insolvency determination and proposed pro-rata payment plan.",
    "liquidate_insolvent_assets": "Sell all estate assets to generate maximum cash for creditor payments.",
    "distribute_pro_rata": "Pay creditors proportionally within each priority class since there aren't enough assets to pay everyone in full.",

    // Special/Contested
    "assess_contest_risk": "Evaluate the likelihood and grounds for will contests, disputes, or litigation.",
    "retain_litigation_counsel": "Hire an experienced probate litigation attorney to handle contested matters.",
    "respond_to_contest": "File appropriate responses to any will contests or objections filed by interested parties.",
    "attend_litigation_hearing": "Participate in court hearings related to contested issues, disputes, or litigation.",
    "resolve_litigation": "Work toward resolution through settlement, mediation, or trial as appropriate.",
    "implement_settlement": "Carry out the terms of any settlement agreement or court order resolving the dispute.",
};

async function addTaskDescriptions() {
    console.log('📝 Adding task descriptions to database...\n');

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const [taskCode, description] of Object.entries(TASK_DESCRIPTIONS)) {
        try {
            const result = await prisma.roadmapTask.updateMany({
                where: { taskCode },
                data: { description },
            });

            if (result.count > 0) {
                console.log(`✅ Updated ${result.count} task(s): ${taskCode}`);
                updatedCount += result.count;
            } else {
                console.log(`⚠️  Task not found: ${taskCode}`);
                notFoundCount++;
            }
        } catch (error) {
            console.error(`❌ Error updating ${taskCode}:`, error);
        }
    }

    console.log('\n✨ Description update complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   • Tasks updated: ${updatedCount}`);
    console.log(`   • Tasks not found: ${notFoundCount}`);
    console.log(`   • Descriptions defined: ${Object.keys(TASK_DESCRIPTIONS).length}`);
}

addTaskDescriptions()
    .catch((e) => {
        console.error('❌ Failed to add descriptions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
