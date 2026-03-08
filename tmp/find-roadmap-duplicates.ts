import { prisma } from "../server/db.js";

async function main() {
  const estates = await prisma.estate.findMany({
    where: {
      deceasedState: { not: "" },
      probateCounty: { not: null },
    },
    select: { deceasedState: true, probateCounty: true },
  });

  const byState = new Map<string, Set<string>>();
  for (const e of estates) {
    const st = (e.deceasedState || "").toUpperCase();
    const county = (e.probateCounty || "").trim();
    if (!st || !county) continue;
    if (!byState.has(st)) byState.set(st, new Set());
    byState.get(st)!.add(county);
  }

  let statesWithCounty = 0;
  let countyTotal = 0;
  for (const [state, counties] of [...byState.entries()].sort()) {
    statesWithCounty += 1;
    countyTotal += counties.size;
    if (counties.size <= 5) {
      console.log(state, counties.size, [...counties].join(" | "));
    } else {
      console.log(state, counties.size, [...counties].slice(0, 5).join(" | "), "...");
    }
  }
  console.log("statesWithCounty", statesWithCounty);
  console.log("countyTotal", countyTotal);
}

main().finally(async () => { await prisma.$disconnect(); });
