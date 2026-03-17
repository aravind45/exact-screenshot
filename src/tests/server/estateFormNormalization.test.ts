import { describe, expect, it } from "vitest";

import {
  mergeEstateFormContext,
  normalizeEstateForForms,
  normalizeEstateUpdateInput,
} from "../../../server/lib/estateFormNormalization";

describe("estate form normalization", () => {
  it("derives form-friendly aliases from stored estate data", () => {
    const normalized = normalizeEstateForForms({
      codicilDates: ["2026-01-15"],
      isSurvivingSpouse: true,
      user: {
        personalEmail: "petitioner@example.com",
      },
    });

    expect(normalized.hasCodicil).toBe(true);
    expect(normalized.codicilDate).toBe("2026-01-15");
    expect(normalized.isSpouse).toBe(true);
    expect(normalized.petitionerEmail).toBe("petitioner@example.com");
  });

  it("prefers explicit estate-level values when they already exist", () => {
    const normalized = normalizeEstateForForms({
      hasCodicil: false,
      codicilDates: ["2026-01-15"],
      isSpouse: false,
      isSurvivingSpouse: true,
      petitionerEmail: "estate-level@example.com",
      user: {
        personalEmail: "user@example.com",
      },
    });

    expect(normalized.hasCodicil).toBe(false);
    expect(normalized.isSpouse).toBe(false);
    expect(normalized.petitionerEmail).toBe("estate-level@example.com");
  });

  it("normalizes update payload aliases into canonical stored fields", () => {
    const normalized = normalizeEstateUpdateInput({
      hasCodicil: true,
      codicilDate: "2026-02-20",
      isSpouse: true,
      publicationNewspaper: "San Francisco Chronicle",
      administrationType: "INDEPENDENT",
      deceasedAddress: "123 Market St, San Francisco, CA 94105",
    });

    expect(normalized).toMatchObject({
      codicilDates: ["2026-02-20"],
      isSurvivingSpouse: true,
      publicationNewspaper: "San Francisco Chronicle",
      administrationType: "INDEPENDENT",
      deceasedAddress: "123 Market St, San Francisco, CA 94105",
    });

    expect(normalized.hasCodicil).toBeUndefined();
    expect(normalized.codicilDate).toBeUndefined();
    expect(normalized.isSpouse).toBeUndefined();
  });

  it("clears codicil dates when hasCodicil is false", () => {
    const normalized = normalizeEstateUpdateInput({
      hasCodicil: false,
      codicilDate: "2026-02-20",
    });

    expect(normalized.codicilDates).toEqual([]);
  });

  it("merges stored estate data and overrides into the form-friendly shape", () => {
    const merged = mergeEstateFormContext(
      {
        codicilDates: ["2026-01-15"],
        isSurvivingSpouse: false,
      },
      {
        hasCodicil: false,
        isSpouse: true,
      },
    );

    expect(merged.codicilDates).toEqual([]);
    expect(merged.hasCodicil).toBe(false);
    expect(merged.codicilDate).toBeUndefined();
    expect(merged.isSurvivingSpouse).toBe(true);
    expect(merged.isSpouse).toBe(true);
  });
});
