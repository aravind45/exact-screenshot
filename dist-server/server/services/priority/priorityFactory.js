import { CaliforniaPrioritySystem } from "./california.js";
import { NewYorkPrioritySystem } from "./newyork.js";
import { FloridaPrioritySystem } from "./florida.js";
import { TexasPrioritySystem } from "./texas.js";
import { UPCPrioritySystem } from "./upc.js";
const SYSTEMS = {
    "CA": CaliforniaPrioritySystem,
    "NY": NewYorkPrioritySystem,
    "FL": FloridaPrioritySystem,
    "TX": TexasPrioritySystem,
    // UPC States
    "AK": UPCPrioritySystem, "AZ": UPCPrioritySystem, "CO": UPCPrioritySystem,
    "HI": UPCPrioritySystem, "ID": UPCPrioritySystem, "ME": UPCPrioritySystem,
    "MA": UPCPrioritySystem, "MI": UPCPrioritySystem, "MN": UPCPrioritySystem,
    "MT": UPCPrioritySystem, "NE": UPCPrioritySystem, "NJ": UPCPrioritySystem,
    "NM": UPCPrioritySystem, "ND": UPCPrioritySystem, "SC": UPCPrioritySystem,
    "SD": UPCPrioritySystem, "UT": UPCPrioritySystem, "WI": UPCPrioritySystem,
};
export class PriorityFactory {
    static getSystem(state) {
        // Use mapping, or fallback to UPC (most generic) then CA
        return SYSTEMS[state] || UPCPrioritySystem || CaliforniaPrioritySystem;
    }
    static getAllRules(state) {
        return this.getSystem(state).rules;
    }
}
