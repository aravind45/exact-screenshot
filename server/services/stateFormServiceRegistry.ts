/**
 * State Form Service Registry
 * 
 * Central registry that provides form services for all 51 jurisdictions.
 * Manages fallback to generic services when state-specific services are unavailable.
 * 
 * Architecture:
 * - StateFormServiceRegistry: Main entry point for form generation
 * - StateFormServiceLoader: Dynamic loader for state-specific services
 * - GenericFormService: Fallback for states without dedicated services
 */

import { logger } from "../lib/logger.js";

// Import state-specific form services (if available)
import { NYFormService } from "./nyFormService.js";
import { TXFormService } from "./txFormService.js";
import { CAFormService } from "./caFormService.js";
import { FLFormService } from "./flFormService.js";
import { NJFormService } from "./njFormService.js";

// Import generic form service
import { GenericFormService } from "./genericFormService.js";

// Import priority services
import { StatePrioritySystem } from "./priority/types.js";
import { CaliforniaPrioritySystem } from "./priority/california.js";
import { TexasPrioritySystem } from "./priority/texas.js";
import { FloridaPrioritySystem } from "./priority/florida.js";
import { NewYorkPrioritySystem } from "./priority/newyork.js";
import { UPCPrioritySystem } from "./priority/upc.js";

/**
 * Form service interface
 */
export interface FormService {
  resolveFields(input: any): { fieldValues: Record<string, any>; validationErrors: string[] };
  generate(input: any): Promise<{ pdfBytes: Uint8Array; fieldValues: Record<string, any>; validationErrors: string[] }>;
  getUISchema(formId: string): Array<{ key: string; label: string; type: string; required: boolean; description?: string; overridable: boolean }>;
}

/**
 * Form service availability
 */
export interface FormServiceAvailability {
  stateCode: string;
  serviceAvailable: boolean;
  serviceName: string;
  supportedForms: string[];
}

/**
 * State form service configuration
 */
interface StateFormServiceConfig {
  service: FormService | null;
  serviceName: string;
  supportedForms: string[];
  isGeneric: boolean;
}

// Registry of all state form services
const stateFormServices: Map<string, StateFormServiceConfig> = new Map();

/**
 * Initialize the registry with all state form services
 */
function initializeRegistry(): void {
  // Register NY form service
  stateFormServices.set("NY", {
    service: NYFormService,
    serviceName: "NYFormService",
    supportedForms: ["ET-1", "ET-2", "ET-3", "ET-8", "ET-13", "ET-14", "ET-15", "ET-16"],
    isGeneric: false,
  });

  // Register TX form service
  stateFormServices.set("TX", {
    service: TXFormService,
    serviceName: "TXFormService",
    supportedForms: ["TX-1", "TX-2", "TX-3", "TX-4", "TX-5", "TX-6", "TX-7", "TX-8", "TX-9", "TX-10", "TX-11", "TX-12"],
    isGeneric: false,
  });

  // Register CA form service
  stateFormServices.set("CA", {
    service: CAFormService,
    serviceName: "CAFormService",
    supportedForms: ["DE-111", "DE-120", "DE-121", "DE-131", "DE-140", "DE-147", "DE-150", "DE-151", "DE-221"],
    isGeneric: false,
  });

  // Register FL form service
  stateFormServices.set("FL", {
    service: FLFormService,
    serviceName: "FLFormService",
    supportedForms: ["FL-1", "FL-2", "FL-3", "FL-4", "FL-5", "FL-6"],
    isGeneric: false,
  });

  // Register NJ form service
  stateFormServices.set("NJ", {
    service: NJFormService,
    serviceName: "NJFormService",
    supportedForms: ["NJ-1", "NJ-2", "NJ-3", "NJ-4"],
    isGeneric: false,
  });

  // Register all other states with generic service
  const allStates = [
    "AL", "AK", "AZ", "AR", "CO", "CT", "DE", "DC", "GA", "HI",
    "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
    "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NM", "NC",
    "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "UT",
    "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  for (const state of allStates) {
    if (!stateFormServices.has(state)) {
      stateFormServices.set(state, {
        service: GenericFormService,
        serviceName: "GenericFormService",
        supportedForms: [],
        isGeneric: true,
      });
    }
  }
}

// Initialize on module load
initializeRegistry();

/**
 * State Form Service Registry - Main API
 */
export const StateFormServiceRegistry = {
  /**
   * Get the form service for a specific state
   */
  getService(stateCode: string): FormService {
    const config = stateFormServices.get(stateCode);
    
    if (!config || !config.service) {
      logger.warn(`[StateFormServiceRegistry] No service for ${stateCode}, using generic`);
      return GenericFormService;
    }
    
    return config.service;
  },

  /**
   * Get service configuration for a state
   */
  getConfig(stateCode: string): StateFormServiceConfig | undefined {
    return stateFormServices.get(stateCode);
  },

  /**
   * Check if a state has a dedicated form service
   */
  hasDedicatedService(stateCode: string): boolean {
    const config = stateFormServices.get(stateCode);
    return config ? !config.isGeneric : false;
  },

  /**
   * Get availability for all states
   */
  getAvailability(): FormServiceAvailability[] {
    const availability: FormServiceAvailability[] = [];
    
    for (const [stateCode, config] of stateFormServices) {
      availability.push({
        stateCode,
        serviceAvailable: config.service !== null,
        serviceName: config.serviceName,
        supportedForms: config.supportedForms,
      });
    }
    
    return availability;
  },

  /**
   * Generate a form for a specific state
   */
  async generateForm(stateCode: string, formId: string, input: any): Promise<{
    pdfBytes: Uint8Array;
    fieldValues: Record<string, any>;
    validationErrors: string[];
    serviceUsed: string;
  }> {
    const service = this.getService(stateCode);
    const config = this.getConfig(stateCode);
    
    try {
      const result = await service.generate(input);
      return {
        ...result,
        serviceUsed: config?.serviceName || "GenericFormService",
      };
    } catch (error) {
      logger.error(`[StateFormServiceRegistry] Error generating form ${formId} for ${stateCode}:`, error);
      throw error;
    }
  },

  /**
   * Resolve fields for a form
   */
  resolveFields(stateCode: string, formId: string, input: any): {
    fieldValues: Record<string, any>;
    validationErrors: string[];
    serviceUsed: string;
  } {
    const service = this.getService(stateCode);
    const config = this.getConfig(stateCode);
    
    const result = service.resolveFields(input);
    return {
      ...result,
      serviceUsed: config?.serviceName || "GenericFormService",
    };
  },

  /**
   * Get UI schema for a form
   */
  getUISchema(stateCode: string, formId: string): Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    overridable: boolean;
  }> {
    const service = this.getService(stateCode);
    return service.getUISchema(formId);
  },

  /**
   * Get supported forms for a state
   */
  getSupportedForms(stateCode: string): string[] {
    const config = stateFormServices.get(stateCode);
    return config?.supportedForms || [];
  },

  /**
   * Get states with dedicated services
   */
  getStatesWithDedicatedServices(): string[] {
    const states: string[] = [];
    for (const [stateCode, config] of stateFormServices) {
      if (!config.isGeneric) {
        states.push(stateCode);
      }
    }
    return states;
  },

  /**
   * Validate form support for a state
   */
  validateFormSupport(stateCode: string, formId: string): {
    supported: boolean;
    service: string;
    warning?: string;
  } {
    const config = this.getConfig(stateCode);
    const supported = config?.supportedForms.includes(formId) || false;
    
    return {
      supported,
      service: config?.serviceName || "Unknown",
      warning: !config?.service || config.isGeneric 
        ? `Using ${config?.serviceName || "fallback"} for ${stateCode}` 
        : undefined,
    };
  },
};

/**
 * Priority Service Registry
 * Similar registry for priority/deadline services
 */

const statePriorityServices: Map<string, { service: StatePrioritySystem | null; serviceName: string }> = new Map();

function initializePriorityRegistry(): void {
  // Register state-specific priority services
  statePriorityServices.set("CA", { service: CaliforniaPrioritySystem, serviceName: "CaliforniaPrioritySystem" });
  statePriorityServices.set("TX", { service: TexasPrioritySystem, serviceName: "TexasPrioritySystem" });
  statePriorityServices.set("FL", { service: FloridaPrioritySystem, serviceName: "FloridaPrioritySystem" });
  statePriorityServices.set("NY", { service: NewYorkPrioritySystem, serviceName: "NewYorkPrioritySystem" });

  // Register UPC states with the UPC service
  const upcStates = ["AK", "AZ", "CO", "HI", "ID", "ME", "MA", "MI", "MN", "MT", "NE", "NM", "ND", "SC", "SD", "UT"];
  for (const state of upcStates) {
    if (!statePriorityServices.has(state)) {
      statePriorityServices.set(state, { service: UPCPrioritySystem, serviceName: "UPCPrioritySystem" });
    }
  }

  // All other states get null (will use default handling)
  const allStates = [
    "AL", "AR", "CT", "DE", "DC", "GA", "IL", "IN", "IA", "KS",
    "KY", "LA", "MD", "MS", "MO", "NV", "NH", "NJ", "NC", "OH",
    "OK", "OR", "PA", "RI", "TN", "VT", "VA", "WA", "WV", "WI", "WY"
  ];
  for (const state of allStates) {
    if (!statePriorityServices.has(state)) {
      statePriorityServices.set(state, { service: null, serviceName: "DefaultPriorityService" });
    }
  }
}

initializePriorityRegistry();

export const StatePriorityServiceRegistry = {
  /**
   * Get priority service for a state
   */
  getService(stateCode: string): StatePrioritySystem | null {
    const config = statePriorityServices.get(stateCode);
    return config?.service || null;
  },

  /**
   * Get service name for a state
   */
  getServiceName(stateCode: string): string {
    const config = statePriorityServices.get(stateCode);
    return config?.serviceName || "DefaultPriorityService";
  },

  /**
   * Get all states with dedicated priority services
   */
  getStatesWithServices(): string[] {
    const states: string[] = [];
    for (const [stateCode, config] of statePriorityServices) {
      if (config.service) {
        states.push(stateCode);
      }
    }
    return states;
  },
};
