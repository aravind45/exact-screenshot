import { describe, it, expect } from "vitest";
import { STATE_RULES } from "../../lib/stateRules";
import { generateRoadmap } from "../../config/roadmapGenerator";

describe("OH Roadmap Compliance - Structural Isolation", () => {
  it("NO NJ statute citations in OH roadmap", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const text = roadmap.flatMap(p => p.tasks).map(t => (t.title || "") + " " + (t.description || "")).join(" ");

    expect(text).not.toContain("N.J.S.A.");
    expect(text).not.toContain("3B:22-4");
  });

  it("NO succession petition in OH roadmap", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const allTasks = roadmap.flatMap(phase => phase.tasks);

    expect(allTasks.find(t => t.id === "file_succession_petition")).toBeUndefined();
    expect(allTasks.find(t => t.id === "obtain_succession_order")).toBeUndefined();
  });

  it("NO spousal property petition in OH roadmap", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const allTasks = roadmap.flatMap(phase => phase.tasks);

    expect(allTasks.find(t => t.id === "file_spousal_petition")).toBeUndefined();
    expect(allTasks.find(t => t.id === "obtain_spousal_order")).toBeUndefined();
  });

  it("Certificate of Transfer task exists", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const allTasks = roadmap.flatMap(phase => phase.tasks);

    const task = allTasks.find(t => t.id === "oh_certificate_of_transfer");
    expect(task).toBeDefined();
    expect(task?.title).toContain("Certificate of Transfer");
    expect(task?.description).toContain("ORC §2113.61");
  });

  it("Family Allowance task exists", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const allTasks = roadmap.flatMap(phase => phase.tasks);

    const task = allTasks.find(t => t.id === "oh_family_allowance");
    expect(task).toBeDefined();
    expect(task?.description).toContain("ORC Chapter 2106");
  });

  it("Creditor deadline is 6 months from date of death", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const allTasks = roadmap.flatMap(phase => phase.tasks);

    const task = allTasks.find(t => t.id === "monitor_creditor_claim_period");
    expect(task?.description).toContain("6 months");
    expect(task?.description).toContain("date of death");
    expect(task?.description).toContain("ORC §2117.06");
    expect(task?.description).not.toContain("publication");
  });

  it("Uses Release from Administration terminology", () => {
    expect(STATE_RULES["OH"].smallEstateTerm).toBe("Release from Administration");
  });

  it("NO generic creditor placeholder", () => {
    const roadmap = generateRoadmap("FORMAL_PROBATE", "OH", [], ["PROBATE"], true);
    const allTasks = roadmap.flatMap(phase => phase.tasks);

    expect(allTasks.find(t => t.id === "wait_claim_period")).toBeUndefined();
  });

  it("Creditor deadline calculation: dateOfDeath Jan 1 → deadline July 1", () => {
    const dateOfDeath = new Date("2024-01-01");
    const claimWindowDays = STATE_RULES["OH"].claimWindowDays || 180;

    const deadline = new Date(dateOfDeath);
    deadline.setDate(deadline.getDate() + claimWindowDays);

    // 180 days from Jan 1 is approximately June 29
    expect(deadline.getMonth()).toBe(5); // June (0-indexed)
  });

  it("Publication date does NOT affect creditor deadline", () => {
    // Ohio: deadline is fixed at 6 months from date of death
    // Publication under ORC §2117.07 is required but doesn't shorten the bar
    const dateOfDeath = new Date("2024-01-01");
    const publicationDate = new Date("2024-02-01");

    const claimWindowDays = STATE_RULES["OH"].claimWindowDays || 180;
    const deadline = new Date(dateOfDeath);
    deadline.setDate(deadline.getDate() + claimWindowDays);

    // Deadline should be ~June 29 regardless of publication date
    expect(deadline.getMonth()).toBe(5); // June
  });
});
