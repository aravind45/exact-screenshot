import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTerminology() {
    const { data: estate } = useQuery({
        queryKey: ["my-estate"],
        queryFn: api.getMyEstate,
    });

    const authorityType = estate?.authorityType || "UNSET";

    /**
     * Terminology Mapping
     * 
     * Executor: Formal Probate + Will
     * Administrator: Intestacy (No Will)
     * Trustee: Fiduciary Administered (Trusts)
     * Petitioner/Affiant: Small Estate / Spousal Petition
     */
    const getRoleName = () => {
        switch (authorityType) {
            case "INTESTATE":
                return "Administrator";
            case "TRUST_ADMIN_REVOCABLE":
            case "TRUST_ADMIN_IRREVOCABLE":
            case "POUR_OVER_WILL":
                return "Trustee";
            case "SMALL_ESTATE":
            case "SPOUSAL_PETITION":
                return "Petitioner";
            case "FORMAL_PROBATE":
            case "INFORMAL_PROBATE":
                return "Executor";
            default:
                return "Executor";
        }
    };

    const getAuthorityDocName = () => {
        switch (authorityType) {
            case "TRUST_ADMIN_REVOCABLE":
            case "TRUST_ADMIN_IRREVOCABLE":
                return "Trust Certification";
            case "SMALL_ESTATE":
                return "Affidavit";
            case "SPOUSAL_PETITION":
                return "Court Order";
            default:
                return "Letters";
        }
    };

    return {
        roleName: getRoleName(),
        authorityDocName: getAuthorityDocName(),
        estateName: estate?.name || "the Estate",
        authorityType,
        estate,
    };
}
