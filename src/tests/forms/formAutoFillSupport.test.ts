import { describe, expect, it } from "vitest";

import {
  AUTO_FILL_FORMS,
  getDedicatedAutoFillState,
  isDedicatedAutoFillForm,
} from "@/lib/formAutoFillSupport";

describe("form auto-fill support", () => {
  it("recognizes dedicated TX and FL auto-fill forms", () => {
    expect(isDedicatedAutoFillForm("TX-1")).toBe(true);
    expect(isDedicatedAutoFillForm("TX-12")).toBe(true);
    expect(isDedicatedAutoFillForm("FL-1")).toBe(true);
    expect(isDedicatedAutoFillForm("FL-15")).toBe(true);
  });

  it("returns the owning state for dedicated auto-fill forms", () => {
    expect(getDedicatedAutoFillState("DE-111")).toBe("CA");
    expect(getDedicatedAutoFillState("ET-13")).toBe("NY");
    expect(getDedicatedAutoFillState("TX-9")).toBe("TX");
    expect(getDedicatedAutoFillState("FL-8")).toBe("FL");
    expect(getDedicatedAutoFillState("NJ-2")).toBe("NJ");
    expect(getDedicatedAutoFillState("DE-121")).toBeNull();
  });

  it("keeps the exported auto-fill set aligned with the dedicated state helper", () => {
    expect(AUTO_FILL_FORMS.has("TX-3")).toBe(true);
    expect(AUTO_FILL_FORMS.has("FL-11")).toBe(true);
    expect(AUTO_FILL_FORMS.has("DE-121")).toBe(false);
  });
});
