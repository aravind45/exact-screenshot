export const CA_AUTO_FILL_FORMS = new Set(["DE-111", "DE-160", "DE-310"]);
export const NY_AUTO_FILL_FORMS = new Set(["ET-1", "ET-2", "ET-3", "ET-8", "ET-13"]);
export const TX_AUTO_FILL_FORMS = new Set([
  "TX-1",
  "TX-2",
  "TX-3",
  "TX-4",
  "TX-5",
  "TX-6",
  "TX-7",
  "TX-8",
  "TX-9",
  "TX-10",
  "TX-11",
  "TX-12",
]);
export const FL_AUTO_FILL_FORMS = new Set([
  "FL-1",
  "FL-2",
  "FL-3",
  "FL-4",
  "FL-5",
  "FL-6",
  "FL-7",
  "FL-8",
  "FL-9",
  "FL-10",
  "FL-11",
  "FL-12",
  "FL-13",
  "FL-14",
  "FL-15",
]);
export const NJ_AUTO_FILL_FORMS = new Set(["NJ-1", "NJ-2"]);

export const DEDICATED_AUTO_FILL_FORMS = {
  CA: CA_AUTO_FILL_FORMS,
  NY: NY_AUTO_FILL_FORMS,
  TX: TX_AUTO_FILL_FORMS,
  FL: FL_AUTO_FILL_FORMS,
  NJ: NJ_AUTO_FILL_FORMS,
} as const;

export const AUTO_FILL_FORMS = new Set(
  Object.values(DEDICATED_AUTO_FILL_FORMS).flatMap((formSet) => Array.from(formSet)),
);

export type DedicatedAutoFillState = keyof typeof DEDICATED_AUTO_FILL_FORMS;

export function getDedicatedAutoFillState(formId: string): DedicatedAutoFillState | null {
  const normalizedFormId = String(formId || "").trim().toUpperCase();

  for (const [stateCode, formIds] of Object.entries(DEDICATED_AUTO_FILL_FORMS)) {
    if (formIds.has(normalizedFormId)) {
      return stateCode as DedicatedAutoFillState;
    }
  }

  return null;
}

export function isDedicatedAutoFillForm(formId: string): boolean {
  return getDedicatedAutoFillState(formId) !== null;
}
