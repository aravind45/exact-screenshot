import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStateRule } from "@/lib/stateRules";

/**
 * useTerminology
 * Returns role names, authority document names, and estate context
 * based on the current estate's authorityType.
 *
 * Covers all 7 path outcomes from Estate_Path_Combinations_All_50_States.xlsx:
 *   1. General Probate Administration  → FORMAL_PROBATE / INFORMAL_PROBATE
 *   2. Intestate Probate               → INTESTATE
 *   3. Trust Administration (Revocable)→ TRUST_ADMIN_REVOCABLE
 *   4. Irrevocable Trust Administration→ TRUST_ADMIN_IRREVOCABLE
 *   5. Ancillary Probate Required      → ANCILLARY_PROBATE
 *   6. Contested Probate Litigation    → CONTESTED_ESTATE
 *   7. Insolvent Estate Administration → INSOLVENT_ESTATE
 */
export function useTerminology() {
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const authorityType = estate?.authorityType || "UNSET";
    const stateRule = getStateRule(estate?.deceasedState || "");

    /**
     * Role name shown throughout the UI for the person managing the estate.
     *
     * XLSX path → Role:
     *   General Probate (with will)    → Executor
     *   Intestate Probate (no will)    → Administrator
     *   Trust Admin (revocable)        → Successor Trustee
     *   Trust Admin (irrevocable)      → Trustee
     *   Ancillary Probate              → Executor / Administrator (same as home state)
     *   Contested Probate              → Executor (pending court resolution)
     *   Insolvent Estate               → Administrator (under court supervision)
     *   Small Estate / Affidavit       → Affiant / Petitioner
     *   Spousal Petition               → Surviving Spouse / Petitioner
     */
    const getRoleName = (): string => {
        switch (authorityType) {
            // XLSX Outcome 2: Intestate Probate
            case "INTESTATE":
                return "Administrator";

            // XLSX Outcome 3: Trust Administration (Revocable Living Trust)
            case "TRUST_ADMIN_REVOCABLE":
            case "POUR_OVER_WILL":
                return "Successor Trustee";

            // XLSX Outcome 4: Irrevocable Trust Administration
            case "TRUST_ADMIN_IRREVOCABLE":
                return "Trustee";

            // XLSX Outcome 5: Ancillary Probate — same role as home state proceeding
            case "ANCILLARY_PROBATE":
                return "Executor";

            // XLSX Outcome 6: Contested Probate Litigation
            case "CONTESTED_ESTATE":
                return "Executor";   // Role is same; litigation is handled by attorney

            // XLSX Outcome 7: Insolvent Estate Administration
            case "INSOLVENT_ESTATE":
                return "Administrator";  // Court-supervised; no distributions until debts resolved

            // Small estate / affidavit paths
            case "SMALL_ESTATE":
                return "Petitioner";

            // Spousal petition paths
            case "SPOUSAL_PETITION":
            case "ELECTIVE_SHARE":
            case "FAMILY_ALLOWANCE":
                return "Surviving Spouse";

            // XLSX Outcome 1: General Probate Administration (with will)
            case "FORMAL_PROBATE":
            case "INFORMAL_PROBATE":
            case "MUNIMENT_OF_TITLE":
                return "Executor";

            default:
                return "Executor";
        }
    };

    /**
     * The authority document name (Letters Testamentary, Trust Certification, etc.)
     * shown throughout the UI when referring to the document granting legal authority.
     */
    const getAuthorityDocName = (): string => {
        switch (authorityType) {
            case "TRUST_ADMIN_REVOCABLE":
            case "TRUST_ADMIN_IRREVOCABLE":
            case "POUR_OVER_WILL":
                return "Trust Certification";

            case "SMALL_ESTATE":
                return "Affidavit";

            case "SPOUSAL_PETITION":
            case "ELECTIVE_SHARE":
            case "FAMILY_ALLOWANCE":
                return "Court Order";

            case "INTESTATE":
                return "Letters of Administration";

            case "INSOLVENT_ESTATE":
                return "Letters of Administration";  // Court-issued, supervised

            case "ANCILLARY_PROBATE":
                return "Ancillary Letters";

            case "MUNIMENT_OF_TITLE":
                return "Muniment of Title Order";

            case "CONTESTED_ESTATE":
            case "FORMAL_PROBATE":
            case "INFORMAL_PROBATE":
            default:
                return "Letters Testamentary";
        }
    };

    /**
     * Human-readable label for the current path outcome.
     * Matches exactly the "Primary Path Outcome" column in the XLSX.
     */
    const getPathLabel = (): string => {
        switch (authorityType) {
            case "INSOLVENT_ESTATE":      return "Insolvent Estate Administration";
            case "TRUST_ADMIN_REVOCABLE": return "Trust Administration (Revocable Living Trust)";
            case "TRUST_ADMIN_IRREVOCABLE":return "Irrevocable Trust Administration";
            case "CONTESTED_ESTATE":      return "Contested Probate Litigation";
            case "ANCILLARY_PROBATE":     return "Ancillary Probate Required";
            case "INTESTATE":             return "Intestate Probate";
            case "FORMAL_PROBATE":
            case "INFORMAL_PROBATE":
            case "SMALL_ESTATE":
            case "SPOUSAL_PETITION":
            case "MUNIMENT_OF_TITLE":     return "General Probate Administration";
            default:                      return "Estate Administration";
        }
    };

    /**
     * True when the estate has legal risk factors that should be prominently
     * displayed in the UI (insolvent, contested, out-of-state complexity).
     */
    const getIsHighRisk = (): boolean => {
        return authorityType === "INSOLVENT_ESTATE" ||
               authorityType === "CONTESTED_ESTATE";
    };

    /**
     * True when distributions to heirs should be blocked in the UI.
     * Insolvent and contested estates must not distribute before resolution.
     */
    const getDistributionsBlocked = (): boolean => {
        return authorityType === "INSOLVENT_ESTATE" ||
               authorityType === "CONTESTED_ESTATE";
    };

    return {
        roleName: getRoleName(),
        authorityDocName: getAuthorityDocName(),
        pathLabel: getPathLabel(),
        isHighRisk: getIsHighRisk(),
        distributionsBlocked: getDistributionsBlocked(),
        estateName: estate?.name || "the Estate",
        authorityType,
        estate,
        stateRule,
        smallEstateThreshold: stateRule.threshold,
    };
}
