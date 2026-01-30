import { StatePrioritySystem } from "./types.js";
import { CaliforniaPrioritySystem } from "./california.js";

const SYSTEMS: Record<string, StatePrioritySystem> = {
    "CA": CaliforniaPrioritySystem,
    // Future: "NY": NewYorkPrioritySystem
};

export class PriorityFactory {
    static getSystem(state: string): StatePrioritySystem {
        // Default to CA or a generic permissive system if state unknown
        return SYSTEMS[state] || SYSTEMS["CA"];
    }

    static getAllRules(state: string) {
        return this.getSystem(state).rules;
    }
}
