
export type Relationship =
    | "SPOUSE"
    | "CHILD"
    | "PARENT"
    | "SIBLING"
    | "GRANDPARENT"
    | "AUNT_UNCLE"
    | "COUSIN"
    | "OTHER";

export interface HeirInput {
    id: string;
    name: string;
    relationship: Relationship;
}

export interface DistributionResult {
    heirId: string;
    percentage: number;
    reason: string;
}

/**
 * Intestacy Engine
 * Calculates legal distribution percentages based on state succession laws.
 * Supported: CA, TX, FL
 */
export function calculateIntestacyDistribution(
    state: string,
    heirs: HeirInput[]
): DistributionResult[] {
    const spouse = heirs.find(h => h.relationship === "SPOUSE");
    const children = heirs.filter(h => h.relationship === "CHILD");
    const parents = heirs.filter(h => h.relationship === "PARENT");
    const siblings = heirs.filter(h => h.relationship === "SIBLING");

    const results: DistributionResult[] = [];

    switch (state) {
        case "CA":
            return calculateCADistribution(spouse, children, parents, siblings);
        case "TX":
            return calculateTXDistribution(spouse, children, parents, siblings);
        case "FL":
            return calculateFLDistribution(spouse, children, parents, siblings);
        default:
            // Fallback: Equal split among children or spouse
            return fallbackDistribution(heirs);
    }
}

function calculateCADistribution(spouse: any, children: any[], parents: any[], siblings: any[]): DistributionResult[] {
    const results: DistributionResult[] = [];

    if (spouse && children.length === 0 && parents.length === 0 && siblings.length === 0) {
        results.push({ heirId: spouse.id, percentage: 100, reason: "Surviving spouse inherits 100% (CA Prob. Code §6401)" });
    } else if (spouse && children.length === 1) {
        results.push({ heirId: spouse.id, percentage: 50, reason: "Spouse inherits 50% of separate property (CA Prob. Code §6401)" });
        results.push({ heirId: children[0].id, percentage: 50, reason: "Sole child inherits 50% (CA Prob. Code §6402)" });
    } else if (spouse && children.length > 1) {
        results.push({ heirId: spouse.id, percentage: 33.33, reason: "Spouse inherits 1/3 of separate property (CA Prob. Code §6401)" });
        const childShare = 66.67 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: childShare, reason: "Children split 2/3 equally (CA Prob. Code §6402)" }));
    } else if (!spouse && children.length > 0) {
        const share = 100 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: share, reason: "Children split 100% equally (CA Prob. Code §6402)" }));
    } else if (spouse && !children.length && (parents.length > 0 || siblings.length > 0)) {
        results.push({ heirId: spouse.id, percentage: 50, reason: "Spouse inherits 50% of separate property when parents/siblings exist (CA Prob. Code §6401)" });
        if (parents.length > 0) {
            const parentShare = 50 / parents.length;
            parents.forEach(p => results.push({ heirId: p.id, percentage: parentShare, reason: "Parents split remaining 50% (CA Prob. Code §6402)" }));
        } else {
            const siblingShare = 50 / siblings.length;
            siblings.forEach(s => results.push({ heirId: s.id, percentage: siblingShare, reason: "Siblings split remaining 50% (CA Prob. Code §6402)" }));
        }
    }

    return results;
}

function calculateTXDistribution(spouse: any, children: any[], parents: any[], siblings: any[]): DistributionResult[] {
    const results: DistributionResult[] = [];

    // Texas is complex due to Community vs Separate property. 
    // Simplified logic assuming most assets are Community Property.
    if (spouse && children.length === 0) {
        results.push({ heirId: spouse.id, percentage: 100, reason: "Spouse inherits 100% of community property (TX Estates Code §201.003)" });
    } else if (spouse && children.length > 0) {
        // If all children are also spouse's children
        results.push({ heirId: spouse.id, percentage: 100, reason: "Spouse inherits 100% of community property if all children are common (TX Estates Code §201.003)" });
        // Handling separate property or non-common children would need more inputs
    } else if (!spouse && children.length > 0) {
        const share = 100 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: share, reason: "Children split 100% equally (TX Estates Code §201.001)" }));
    }

    return results;
}

function calculateFLDistribution(spouse: any, children: any[], parents: any[], siblings: any[]): DistributionResult[] {
    const results: DistributionResult[] = [];

    if (spouse && children.length === 0) {
        results.push({ heirId: spouse.id, percentage: 100, reason: "Spouse inherits 100% (FL Stat. §732.102)" });
    } else if (spouse && children.length > 0) {
        // If all children are common
        results.push({ heirId: spouse.id, percentage: 100, reason: "Spouse inherits 100% if all descendants are common (FL Stat. §732.102)" });
    } else if (!spouse && children.length > 0) {
        const share = 100 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: share, reason: "Descendants split 100% equally (FL Stat. §732.103)" }));
    }

    return results;
}

function fallbackDistribution(heirs: HeirInput[]): DistributionResult[] {
    if (heirs.length === 0) return [];
    const share = 100 / heirs.length;
    return heirs.map(h => ({
        heirId: h.id,
        percentage: share,
        reason: "Equal distribution among identified heirs (Default)"
    }));
}
