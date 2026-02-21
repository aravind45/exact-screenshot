
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
 * Detailed rules for: CA, TX, FL, GA, NY
 * Generic rules for all other states based on common intestacy patterns.
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
        case "GA":
            return calculateGADistribution(spouse, children, parents, siblings);
        case "NY":
            return calculateNYDistribution(spouse, children, parents, siblings);
        default:
            // Generic distribution based on common intestacy patterns, labeled with actual state
            return calculateGenericDistribution(state, spouse, children, parents, siblings, heirs);
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

function calculateGADistribution(spouse: any, children: any[], parents: any[], siblings: any[]): DistributionResult[] {
    const results: DistributionResult[] = [];

    // Georgia: Spouse gets equal share with children but no less than 1/3
    if (spouse && children.length === 0 && parents.length === 0 && siblings.length === 0) {
        results.push({ heirId: spouse.id, percentage: 100, reason: "Surviving spouse inherits 100% (O.C.G.A. § 53-2-1)" });
    } else if (spouse && children.length > 0) {
        // Spouse gets equal share but not less than 1/3
        const equalShare = 100 / (children.length + 1);
        const spouseShare = Math.max(equalShare, 33.33);
        const remainingForChildren = 100 - spouseShare;
        const childShare = remainingForChildren / children.length;
        results.push({ heirId: spouse.id, percentage: spouseShare, reason: `Spouse inherits equal share, min 1/3 (O.C.G.A. § 53-2-1)` });
        children.forEach(c => results.push({ heirId: c.id, percentage: childShare, reason: `Children split remainder equally (O.C.G.A. § 53-2-1)` }));
    } else if (!spouse && children.length > 0) {
        const share = 100 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: share, reason: "Children split 100% equally (O.C.G.A. § 53-2-1)" }));
    } else if (!spouse && children.length === 0 && parents.length > 0) {
        const share = 100 / parents.length;
        parents.forEach(p => results.push({ heirId: p.id, percentage: share, reason: "Parents inherit equally (O.C.G.A. § 53-2-1)" }));
    } else if (!spouse && children.length === 0 && parents.length === 0 && siblings.length > 0) {
        const share = 100 / siblings.length;
        siblings.forEach(s => results.push({ heirId: s.id, percentage: share, reason: "Siblings inherit equally (O.C.G.A. § 53-2-1)" }));
    }

    return results;
}

function calculateNYDistribution(spouse: any, children: any[], parents: any[], siblings: any[]): DistributionResult[] {
    const results: DistributionResult[] = [];

    if (spouse && children.length === 0) {
        results.push({ heirId: spouse.id, percentage: 100, reason: "Surviving spouse inherits 100% (NY EPTL § 4-1.1)" });
    } else if (spouse && children.length > 0) {
        // Spouse gets $50k + half; children split the rest
        results.push({ heirId: spouse.id, percentage: 50, reason: "Spouse inherits first $50k + 50% of balance (NY EPTL § 4-1.1)" });
        const childShare = 50 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: childShare, reason: "Children split remaining 50% equally (NY EPTL § 4-1.1)" }));
    } else if (!spouse && children.length > 0) {
        const share = 100 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: share, reason: "Children split 100% equally (NY EPTL § 4-1.1)" }));
    } else if (!spouse && children.length === 0 && parents.length > 0) {
        const share = 100 / parents.length;
        parents.forEach(p => results.push({ heirId: p.id, percentage: share, reason: "Parents inherit equally (NY EPTL § 4-1.1)" }));
    }

    return results;
}

function calculateGenericDistribution(
    state: string,
    spouse: any,
    children: any[],
    parents: any[],
    siblings: any[],
    heirs: HeirInput[]
): DistributionResult[] {
    const results: DistributionResult[] = [];
    const cite = `${state} intestacy law`;

    // Most states follow similar patterns: spouse + children share, children-only get all, etc.
    if (spouse && children.length === 0 && parents.length === 0 && siblings.length === 0) {
        results.push({ heirId: spouse.id, percentage: 100, reason: `Surviving spouse inherits 100% (${cite})` });
    } else if (spouse && children.length > 0) {
        // Common pattern: spouse gets 50%, children split 50%
        results.push({ heirId: spouse.id, percentage: 50, reason: `Spouse inherits ~50% (${cite} — verify with attorney)` });
        const childShare = 50 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: childShare, reason: `Children split remainder equally (${cite})` }));
    } else if (!spouse && children.length > 0) {
        const share = 100 / children.length;
        children.forEach(c => results.push({ heirId: c.id, percentage: share, reason: `Children split 100% equally (${cite})` }));
    } else if (spouse && children.length === 0 && parents.length > 0) {
        results.push({ heirId: spouse.id, percentage: 50, reason: `Spouse inherits ~50% (${cite} — verify with attorney)` });
        const parentShare = 50 / parents.length;
        parents.forEach(p => results.push({ heirId: p.id, percentage: parentShare, reason: `Parents split remainder (${cite})` }));
    } else if (!spouse && children.length === 0 && parents.length > 0) {
        const share = 100 / parents.length;
        parents.forEach(p => results.push({ heirId: p.id, percentage: share, reason: `Parents inherit equally (${cite})` }));
    } else if (!spouse && children.length === 0 && parents.length === 0 && siblings.length > 0) {
        const share = 100 / siblings.length;
        siblings.forEach(s => results.push({ heirId: s.id, percentage: share, reason: `Siblings inherit equally (${cite})` }));
    } else if (heirs.length > 0) {
        const share = 100 / heirs.length;
        heirs.forEach(h => results.push({ heirId: h.id, percentage: share, reason: `Equal distribution among identified heirs (${cite})` }));
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
