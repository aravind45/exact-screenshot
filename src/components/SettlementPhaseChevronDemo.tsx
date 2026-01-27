import { useState } from "react";
import { SettlementPhaseChevron, SettlementPhase } from "./SettlementPhaseChevron";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function SettlementPhaseChevronDemo() {
  const [currentPhase, setCurrentPhase] = useState<SettlementPhase>("court_filing");
  const [completedPhases, setCompletedPhases] = useState<SettlementPhase[]>(["immediate_actions"]);

  const allPhases: SettlementPhase[] = [
    "immediate_actions",
    "court_filing",
    "asset_discovery",
    "creditor_claims",
    "asset_liquidation",
    "final_distribution"
  ];

  const handleNext = () => {
    const currentIndex = allPhases.indexOf(currentPhase);
    if (currentIndex < allPhases.length - 1) {
      setCompletedPhases([...completedPhases, currentPhase]);
      setCurrentPhase(allPhases[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = allPhases.indexOf(currentPhase);
    if (currentIndex > 0) {
      const newCompleted = completedPhases.filter(p => p !== currentPhase);
      setCompletedPhases(newCompleted);
      setCurrentPhase(allPhases[currentIndex - 1]);
    }
  };

  const handleReset = () => {
    setCurrentPhase("immediate_actions");
    setCompletedPhases([]);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Estate Settlement Progress</CardTitle>
          <CardDescription>
            Track your progress through the 6 phases of estate settlement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettlementPhaseChevron
            currentPhase={currentPhase}
            completedPhases={completedPhases}
          />

          <div className="flex gap-2 mt-6">
            <Button onClick={handlePrevious} variant="outline" disabled={currentPhase === "immediate_actions"}>
              Previous Phase
            </Button>
            <Button onClick={handleNext} disabled={currentPhase === "final_distribution"}>
              Complete & Next Phase
            </Button>
            <Button onClick={handleReset} variant="ghost">
              Reset
            </Button>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-sm mb-2">Current Phase: {currentPhase.replace(/_/g, " ").toUpperCase()}</h3>
            <p className="text-sm text-slate-600">
              {getPhaseDescription(currentPhase)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPhaseDescription(phase: SettlementPhase): string {
  const descriptions: Record<SettlementPhase, string> = {
    immediate_actions: "Secure property, notify key parties, locate important documents, and open estate bank account.",
    court_filing: "File petition for probate, publish creditor notice, attend hearing, and receive Letters Testamentary.",
    asset_discovery: "Freeze accounts, get date-of-death values, hire appraisers, and complete Inventory & Appraisal (DE-160).",
    creditor_claims: "Wait for 4-month claim period, review submitted claims, approve or reject, and pay approved claims.",
    asset_liquidation: "Present Letters to institutions, transfer or sell assets, pay final bills and taxes, and prepare accounting.",
    final_distribution: "File petition for final distribution, attend final hearing, distribute assets to heirs, and close estate."
  };
  return descriptions[phase];
}
