import { describe, expect, it } from "vitest";

import { buildRegistryReadinessEntry } from "../../../server/lib/formReadiness";
import { TX_FORM_REGISTRY } from "../../../server/services/txFormRegistry";

const baseEstate = {
  deceasedFirstName: "Jane",
  deceasedLastName: "Doe",
  deceasedDateOfDeath: "2026-01-15",
  probateCounty: "Harris",
  petitionerPhone: "5551234567",
  administrationType: "Independent Administration",
  user: {
    fullName: "Alex Petitioner",
    address: "100 Main St",
    city: "Houston",
    state: "TX",
    zip: "77002",
    personalEmail: "alex@example.com",
  },
};

describe("form readiness", () => {
  it("ignores required manual override fields when captured estate data is otherwise sufficient", () => {
    const entry = buildRegistryReadinessEntry({
      registry: TX_FORM_REGISTRY["TX-8"],
      estate: baseEstate,
      stageGate: {
        ready: true,
        reason: "Requires estate accounting.",
        statusYes: "READY",
        statusNo: "COLLECTING DATA",
      },
    });

    expect(entry.ready).toBe(true);
    expect(entry.status).toBe("READY");
  });

  it("blocks readiness when captured registry-backed fields are missing", () => {
    const entry = buildRegistryReadinessEntry({
      registry: TX_FORM_REGISTRY["TX-1"],
      estate: {
        ...baseEstate,
        probateCounty: "",
      },
      stageGate: {
        ready: true,
        reason: "Requires captured estate data.",
        statusYes: "READY",
        statusNo: "LOCKED",
      },
    });

    expect(entry.ready).toBe(false);
    expect(entry.status).toBe("LOCKED");
    expect(entry.reason).toContain("Probate Court County");
  });

  it("preserves lifecycle gating even when captured form data is present", () => {
    const entry = buildRegistryReadinessEntry({
      registry: TX_FORM_REGISTRY["TX-4"],
      estate: baseEstate,
      stageGate: {
        ready: false,
        reason: "Requires court appointment.",
        statusYes: "READY (Letters Issued)",
        statusNo: "PENDING COURT ORDER",
      },
    });

    expect(entry.ready).toBe(false);
    expect(entry.status).toBe("PENDING COURT ORDER");
    expect(entry.reason).toBe("Requires court appointment.");
  });
});
