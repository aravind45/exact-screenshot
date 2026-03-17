type AnyRecord = Record<string, any>;

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeEstateForForms<T extends AnyRecord>(estate: T | null | undefined): T & AnyRecord {
  const base = (estate || {}) as T & AnyRecord;
  const codicilDates = normalizeStringArray(base.codicilDates);
  const hasCodicil =
    typeof base.hasCodicil === "boolean" ? base.hasCodicil : codicilDates.length > 0;

  const normalized: AnyRecord = {
    ...base,
    codicilDates,
    hasCodicil,
    codicilDate: hasCodicil ? base.codicilDate || codicilDates[0] : undefined,
    isSpouse:
      typeof base.isSpouse === "boolean"
        ? base.isSpouse
        : typeof base.isSurvivingSpouse === "boolean"
          ? base.isSurvivingSpouse
          : undefined,
    petitionerEmail:
      base.petitionerEmail ||
      base.user?.personalEmail ||
      base.user?.email ||
      undefined,
  };

  return normalized as T & AnyRecord;
}

export function normalizeEstateUpdateInput<T extends AnyRecord>(input: T | null | undefined): T & AnyRecord {
  const normalized = { ...(input || {}) } as AnyRecord;

  if (typeof normalized.isSpouse === "boolean" && normalized.isSurvivingSpouse === undefined) {
    normalized.isSurvivingSpouse = normalized.isSpouse;
  }

  const codicilDates = normalizeStringArray(normalized.codicilDates);

  if (normalized.hasCodicil === false) {
    normalized.codicilDates = [];
  } else if (typeof normalized.codicilDate === "string" && normalized.codicilDate.trim()) {
    normalized.codicilDates = [normalized.codicilDate.trim()];
  } else if (codicilDates.length > 0) {
    normalized.codicilDates = codicilDates;
  }

  if (typeof normalized.publicationNewspaper === "string") {
    normalized.publicationNewspaper = normalized.publicationNewspaper.trim();
  }

  if (typeof normalized.deceasedAddress === "string") {
    normalized.deceasedAddress = normalized.deceasedAddress.trim();
  }

  delete normalized.hasCodicil;
  delete normalized.codicilDate;
  delete normalized.isSpouse;

  return normalized as T & AnyRecord;
}

export function mergeEstateFormContext<T extends AnyRecord, U extends AnyRecord>(
  estate: T | null | undefined,
  overrides?: U | null,
): T & U & AnyRecord {
  const normalizedOverrides = normalizeEstateUpdateInput(overrides);

  return normalizeEstateForForms({
    ...(estate || {}),
    ...normalizedOverrides,
  }) as T & U & AnyRecord;
}
