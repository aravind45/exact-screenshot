type FieldSource = "estate" | "user" | "assets" | "heirs" | "computed" | "override";

type ReadinessFieldDefinition = {
  label: string;
  source: FieldSource;
  path?: string;
  required?: boolean;
};

type ReadinessRegistry = Record<string, ReadinessFieldDefinition>;

export type FormReadinessStageGate = {
  ready: boolean;
  reason: string;
  statusYes: string;
  statusNo: string;
  authorityTier?: string;
};

type AdditionalRequiredField = {
  label: string;
  source?: Exclude<FieldSource, "computed" | "override">;
  path?: string;
  when?: (context: FormReadinessContext) => boolean;
};

export type FormReadinessContext = {
  estate: Record<string, any>;
  assets?: any[];
  heirs?: any[];
};

export type FormReadinessEntry = {
  ready: boolean;
  reason: string;
  status: string;
  authorityTier: string;
};

type BuildRegistryReadinessInput = FormReadinessContext & {
  registry: ReadinessRegistry;
  stageGate: FormReadinessStageGate;
  additionalRequiredFields?: AdditionalRequiredField[];
};

type BuildRegistryReadinessMapInput = FormReadinessContext & {
  registries: Record<string, ReadinessRegistry>;
  stageGates?: Record<string, FormReadinessStageGate>;
  additionalRequiredFieldsByForm?: Record<string, AdditionalRequiredField[]>;
  defaultStageGate?: FormReadinessStageGate;
};

function getNestedValue(value: any, path?: string): any {
  if (!path) return value;
  return path.split(".").reduce((acc, key) => acc?.[key], value);
}

function isMissingValue(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function getSourceValue(source: Exclude<FieldSource, "computed" | "override">, context: FormReadinessContext, path?: string): any {
  switch (source) {
    case "user":
      return getNestedValue(context.estate?.user, path);
    case "assets":
      return path ? getNestedValue(context.assets, path) : context.assets;
    case "heirs":
      return path ? getNestedValue(context.heirs, path) : context.heirs;
    case "estate":
    default:
      return getNestedValue(context.estate, path);
  }
}

export function getMissingCapturedFields(
  registry: ReadinessRegistry,
  context: FormReadinessContext,
  additionalRequiredFields: AdditionalRequiredField[] = [],
): string[] {
  const missingFields = new Set<string>();

  for (const definition of Object.values(registry)) {
    if (!definition.required) continue;
    if (definition.source === "computed" || definition.source === "override") continue;

    const value = getSourceValue(definition.source, context, definition.path);
    if (isMissingValue(value)) {
      missingFields.add(definition.label);
    }
  }

  for (const additionalField of additionalRequiredFields) {
    if (additionalField.when && !additionalField.when(context)) {
      continue;
    }

    const source = additionalField.source || "estate";
    const value = getSourceValue(source, context, additionalField.path);
    if (isMissingValue(value)) {
      missingFields.add(additionalField.label);
    }
  }

  return Array.from(missingFields);
}

export function buildRegistryReadinessEntry(input: BuildRegistryReadinessInput): FormReadinessEntry {
  const {
    registry,
    stageGate,
    additionalRequiredFields = [],
    ...context
  } = input;

  const missingFields = getMissingCapturedFields(registry, context, additionalRequiredFields);

  if (missingFields.length > 0) {
    return {
      ready: false,
      reason: `Missing captured data: ${missingFields.join(", ")}`,
      status: "LOCKED",
      authorityTier: stageGate.authorityTier || "COURT_REQUIRED",
    };
  }

  if (!stageGate.ready) {
    return {
      ready: false,
      reason: stageGate.reason,
      status: stageGate.statusNo,
      authorityTier: stageGate.authorityTier || "COURT_REQUIRED",
    };
  }

  return {
    ready: true,
    reason: stageGate.reason,
    status: stageGate.statusYes,
    authorityTier: stageGate.authorityTier || "COURT_REQUIRED",
  };
}

export function buildRegistryReadinessMap(input: BuildRegistryReadinessMapInput): Record<string, FormReadinessEntry> {
  const {
    registries,
    stageGates = {},
    additionalRequiredFieldsByForm = {},
    defaultStageGate = {
      ready: true,
      reason: "Required captured estate data is available.",
      statusYes: "READY",
      statusNo: "LOCKED",
    },
    ...context
  } = input;

  return Object.fromEntries(
    Object.entries(registries).map(([formId, registry]) => [
      formId,
      buildRegistryReadinessEntry({
        registry,
        stageGate: stageGates[formId] || defaultStageGate,
        additionalRequiredFields: additionalRequiredFieldsByForm[formId] || [],
        ...context,
      }),
    ]),
  );
}
