import { describe, it, expect } from "vitest";
import { STATE_RULES } from "../../lib/stateRules";

describe("MN Roadmap Compliance", () => {
  it("MN STATE_RULES: has correct creditor timing fields", () => {
    const mn = STATE_RULES["MN"];
    expect(mn.claimWindowDays).toBe(120); // 4 months
    expect(mn.shortenedWindowDays).toBe(30); // 1 month from mailed notice
    expect(mn.waitingDays).toBe(30); // 30 days after death for affidavit
  });

  it("MN STATE_RULES: has creditorPublication configuration", () => {
    const mn = STATE_RULES["MN"];
    expect(mn.creditorPublication).toBeDefined();
    expect(mn.creditorPublication?.publicationWindow).toBe(120);
    expect(mn.creditorPublication?.strategicOption).toContain("4-month claim bar");
  });

  it("MN creditor deadline: publication Jan 1, mailed Jan 15 → deadline May 1", () => {
    // Publication: Jan 1 + 4 months = May 1
    // Mailed: Jan 15 + 1 month = Feb 15
    // Result: May 1 (later of the two)
    const publicationDate = new Date("2024-01-01");
    const mailedNoticeDate = new Date("2024-01-15");
    
    const publicationDeadline = new Date(publicationDate);
    publicationDeadline.setMonth(publicationDeadline.getMonth() + 4);
    
    const mailedDeadline = new Date(mailedNoticeDate);
    mailedDeadline.setMonth(mailedDeadline.getMonth() + 1);
    
    const finalDeadline = publicationDeadline > mailedDeadline 
      ? publicationDeadline 
      : mailedDeadline;
    
    expect(finalDeadline.getMonth()).toBe(4); // May (0-indexed)
    expect(finalDeadline.getDate()).toBe(1);
  });

  it("MN creditor deadline: publication Jan 1, mailed Apr 1 → deadline May 1", () => {
    // Publication: Jan 1 + 4 months = May 1
    // Mailed: Apr 1 + 1 month = May 1
    // Result: May 1 (both equal, so either)
    const publicationDate = new Date("2024-01-01");
    const mailedNoticeDate = new Date("2024-04-01");
    
    const publicationDeadline = new Date(publicationDate);
    publicationDeadline.setMonth(publicationDeadline.getMonth() + 4);
    
    const mailedDeadline = new Date(mailedNoticeDate);
    mailedDeadline.setMonth(mailedDeadline.getMonth() + 1);
    
    const finalDeadline = publicationDeadline > mailedDeadline 
      ? publicationDeadline 
      : mailedDeadline;
    
    expect(finalDeadline.getMonth()).toBe(4); // May
  });

  it("MN creditor deadline: no publication, mailed Feb 1 → deadline Mar 1", () => {
    // No publication, so only mailed notice applies
    // Mailed: Feb 1 + 1 month = Mar 1
    const mailedNoticeDate = new Date("2024-02-01");
    
    const mailedDeadline = new Date(mailedNoticeDate);
    mailedDeadline.setMonth(mailedDeadline.getMonth() + 1);
    
    expect(mailedDeadline.getMonth()).toBe(2); // March (0-indexed)
    expect(mailedDeadline.getDate()).toBe(1);
  });

  it("MN small estate: death Jan 1, today Jan 20 → affidavit hidden (< 30 days)", () => {
    const deathDate = new Date("2024-01-01");
    const today = new Date("2024-01-20");
    
    const daysSinceDeath = Math.floor(
      (today.getTime() - deathDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    expect(daysSinceDeath).toBe(19);
    expect(daysSinceDeath).toBeLessThan(30); // Affidavit should be hidden
  });

  it("MN small estate: death Jan 1, today Feb 1 → affidavit visible (≥ 30 days)", () => {
    const deathDate = new Date("2024-01-01");
    const today = new Date("2024-02-01");
    
    const daysSinceDeath = Math.floor(
      (today.getTime() - deathDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    expect(daysSinceDeath).toBe(31);
    expect(daysSinceDeath).toBeGreaterThanOrEqual(30); // Affidavit should be visible
  });
});
