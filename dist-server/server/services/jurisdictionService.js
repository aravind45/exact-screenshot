/**
 * Jurisdiction Service - Single Source of Truth for all 51 jurisdictions
 *
 * This module provides a unified interface for all jurisdiction-related operations
 * including statute binding, citation management, and state-specific rule resolution.
 *
 * Architecture:
 * - StatuteBindingService: Binds tasks to specific statutes
 * - JurisdictionRegistry: Manages all 51 state configurations
 * - CitationFormatter: Formats legal citations by state
 */
import { US_STATES } from "../../src/lib/states.js";
import { getStateRule } from "../../src/lib/stateRules.js";
/**
 * Supported jurisdictions (50 states + DC)
 */
export const ALL_JURISDICTIONS = US_STATES.map(s => s.abbr);
/**
 * Create jurisdiction configuration for all 51 states
 */
export function createJurisdictionConfig(stateCode) {
    const stateRule = getStateRule(stateCode);
    const stateInfo = US_STATES.find(s => s.abbr === stateCode);
    const formServiceMap = {
        "CA": true,
        "FL": true,
        "NJ": true,
        "NY": true,
        "TX": true,
    };
    const priorityServiceMap = {
        "CA": true,
        "FL": true,
        "NJ": true,
        "NY": true,
        "TX": true,
        // UPC states share the same priority service
        "AK": true,
        "AZ": true,
        "CO": true,
        "HI": true,
        "ID": true,
        "ME": true,
        "MA": true,
        "MI": true,
        "MN": true,
        "MT": true,
        "NE": true,
        "NM": true,
        "ND": true,
        "SC": true,
        "SD": true,
        "UT": true,
    };
    return {
        code: stateCode,
        name: stateInfo?.name || stateCode,
        probateCourt: getProbateCourtName(stateCode),
        surrogateCourt: getSurrogateCourtName(stateCode),
        smallEstateThreshold: stateRule.threshold,
        smallEstateTerm: stateRule.smallEstateTerm,
        probateTerm: stateRule.probateTerm,
        lettersTerm: stateRule.lettersTerm,
        isUPC: stateRule.isUPC,
        citationStyle: getCitationStyle(stateCode),
        formServiceAvailable: formServiceMap[stateCode] || false,
        priorityServiceAvailable: priorityServiceMap[stateCode] || false,
    };
}
/**
 * Get probate court name for a state
 */
function getProbateCourtName(stateCode) {
    const courtNames = {
        "CA": "Superior Court - Probate Division",
        "NY": "Surrogate's Court",
        "TX": "Probate Court",
        "FL": "Circuit Court - Probate Division",
        "NJ": "Superior Court - Chancery Division, Probate Part",
        "PA": "Orphan's Court",
        "IL": "Circuit Court - Probate Division",
        "OH": "Probate Court",
        "MA": "Probate and Family Court",
        "WA": "Superior Court - Probate Department",
    };
    return courtNames[stateCode] || "Probate Court";
}
/**
 * Get surrogate court name for a state (or generic)
 */
function getSurrogateCourtName(stateCode) {
    const surrogateCourts = {
        "NY": "Surrogate's Court",
        "CT": "Probate Court",
        "MD": "Orphan's Court",
        "PA": "Orphan's Court",
        "VA": "Circuit Court - Probate",
    };
    return surrogateCourts[stateCode] || getProbateCourtName(stateCode);
}
/**
 * Get citation style for a state
 */
function getCitationStyle(stateCode) {
    // New York uses its own style
    if (stateCode === "NY")
        return "state";
    // Most states follow Bluebook
    return "bluebook";
}
/**
 * Registry of all jurisdiction configurations
 */
export const JURISDICTION_REGISTRY = Object.fromEntries(ALL_JURISDICTIONS.map(code => [code, createJurisdictionConfig(code)]));
/**
 * Statute Binding Service
 * Provides binding between tasks and their statutory basis
 */
export const StatuteBindingService = {
    /**
     * Get all task bindings for a specific state
     */
    getBindingsForState(stateCode) {
        // This would be loaded from a database in production
        // For now, we return an empty array as bindings are embedded in tasks
        return [];
    },
    /**
     * Validate that a task has proper statute binding for a state
     */
    validateBinding(taskId, stateCode) {
        const warnings = [];
        const errors = [];
        const config = JURISDICTION_REGISTRY[stateCode];
        if (!config) {
            errors.push(`Unknown jurisdiction: ${stateCode}`);
            return { isValid: false, warnings, errors };
        }
        // Check if form service is available
        if (!config.formServiceAvailable) {
            warnings.push(`No dedicated form service for ${stateCode}`);
        }
        // Check if priority service is available
        if (!config.priorityServiceAvailable) {
            warnings.push(`No dedicated priority service for ${stateCode}`);
        }
        return {
            isValid: errors.length === 0,
            warnings,
            errors,
        };
    },
    /**
     * Get citations for a specific task and state
     */
    getCitationsForTask(taskId, stateCode) {
        const stateRule = getStateRule(stateCode);
        // Map task IDs to their statutory citations
        const taskCitationMap = {
            "file_probate_petition": [
                { code: stateCode, section: "Probate Code", fullCitation: stateRule.probateCitation[0] }
            ],
            "file_administration_petition": [
                { code: stateCode, section: "Probate Code", fullCitation: stateRule.probateCitation[0] }
            ],
            "small_estate_affidavit": [
                { code: stateCode, section: "Small Estate", fullCitation: stateRule.smallEstateCitation[0] }
            ],
            "publish_notice": [
                { code: stateCode, section: "Creditor Notice", fullCitation: stateRule.probateCitation[0] }
            ],
            "file_inventory": [
                { code: stateCode, section: "Inventory", fullCitation: stateRule.probateCitation[0] }
            ],
        };
        return taskCitationMap[taskId] || [];
    },
};
/**
 * Jurisdiction Validator Service
 * Validates jurisdiction-specific constraints
 */
export const JurisdictionValidator = {
    /**
     * Get all valid jurisdictions
     */
    getValidJurisdictions() {
        return [...ALL_JURISDICTIONS];
    },
    /**
     * Check if a jurisdiction is valid
     */
    isValidJurisdiction(stateCode) {
        return ALL_JURISDICTIONS.includes(stateCode);
    },
    /**
     * Get configuration for a jurisdiction
     */
    getConfig(stateCode) {
        return JURISDICTION_REGISTRY[stateCode];
    },
    /**
     * Validate an estate's jurisdiction settings
     */
    validateEstate(stateCode, county) {
        const warnings = [];
        const errors = [];
        if (!this.isValidJurisdiction(stateCode)) {
            errors.push(`Invalid state code: ${stateCode}`);
        }
        const config = this.getConfig(stateCode);
        if (config && !config.formServiceAvailable) {
            warnings.push(`State ${stateCode} does not have a dedicated form service`);
        }
        if (config && !config.priorityServiceAvailable) {
            warnings.push(`State ${stateCode} uses default priority service`);
        }
        return {
            isValid: errors.length === 0,
            warnings,
            errors,
        };
    },
};
/**
 * Citation Formatter Service
 * Formats legal citations according to state-specific rules
 */
export const CitationFormatter = {
    /**
     * Format a citation according to the state's citation style
     */
    format(citation, stateCode) {
        const config = JURISDICTION_REGISTRY[stateCode];
        if (!config)
            return citation;
        switch (config.citationStyle) {
            case "bluebook":
                return this.formatBluebook(citation);
            case "state":
                return this.formatStateStyle(citation, stateCode);
            default:
                return citation;
        }
    },
    /**
     * Format in Bluebook style
     */
    formatBluebook(citation) {
        // Bluebook: Title Code § Section (Year)
        // Example: 42 U.S.C. § 1983 (2020)
        return citation;
    },
    /**
     * Format in state-specific style
     */
    formatStateStyle(citation, stateCode) {
        // State-specific formatting
        if (stateCode === "NY") {
            // NY Surrogate's Court style
            return citation.replace(/NY\s+SCPA/i, "N.Y. Surrogate's Ct. Proc. Act §");
        }
        return citation;
    },
    /**
     * Extract statute code and section from a citation
     */
    parseCitation(citation) {
        const match = citation.match(/(\w+)\s+(\w+)?\.?\s*Code\s+§\s*(\d+[\w-]*)/i);
        if (match) {
            return {
                code: match[1],
                section: match[3],
            };
        }
        return null;
    },
};
/**
 * Get state rule with validation
 */
export function getValidatedStateRule(stateCode) {
    if (!JurisdictionValidator.isValidJurisdiction(stateCode)) {
        throw new Error(`Invalid jurisdiction: ${stateCode}`);
    }
    return getStateRule(stateCode);
}
/**
 * Export all jurisdictions for display
 */
export function getJurisdictionList() {
    return US_STATES.map(s => ({ code: s.abbr, name: s.name }));
}
