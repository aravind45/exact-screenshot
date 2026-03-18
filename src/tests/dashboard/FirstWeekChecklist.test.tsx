import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FirstWeekChecklist } from "@/components/dashboard/FirstWeekChecklist";
import { useQuery } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe("FirstWeekChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not assume checklist query payloads are arrays", () => {
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey?.[0] === "assets") {
        return { data: { data: [] } } as any;
      }

      if (queryKey?.[0] === "liabilities") {
        return { data: { data: [] } } as any;
      }

      if (queryKey?.[0] === "estate-documents") {
        return { data: { data: [] } } as any;
      }

      return { data: undefined } as any;
    });

    expect(() =>
      render(
        <MemoryRouter>
          <FirstWeekChecklist completedTaskIds={[]} />
        </MemoryRouter>
      )
    ).not.toThrow();
  });
});
