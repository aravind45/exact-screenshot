export type EstateAuthorityType = "PROBATE" | "TRUST" | "BOTH";

export function deriveEstateAuthorityTypeFromEngines(activeEngines: string[] = []): EstateAuthorityType {
    const hasProbate = activeEngines.includes("PROBATE");
    const hasTrust = activeEngines.includes("TRUST");

    if (hasProbate && hasTrust) return "BOTH";
    if (hasTrust) return "TRUST";
    return "PROBATE";
}

export function deriveEstateAuthorityTypeFromLegacyAuthority(authorityType?: string | null): EstateAuthorityType {
    const normalized = (authorityType || "").toString().trim().toUpperCase();

    if (normalized === "BOTH") return "BOTH";
    if (normalized === "TRUST" || normalized.includes("TRUST")) return "TRUST";
    return "PROBATE";
}
