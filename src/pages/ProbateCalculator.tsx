import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Clock,
  Landmark,
  Scale,
  FileText,
  Info,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  calculateCAStatutoryFee,
  calculateFLStatutoryFee,
  calculateNYCommission,
  CALIFORNIA,
  FEDERAL_ESTATE_TAX,
  STATE_ESTATE_TAX_THRESHOLDS,
  INHERITANCE_TAX_STATES,
  PROBATE_TIMELINES,
  ANCILLARY_COSTS,
  getNYSurrogateFilingFee,
  evaluateNYEstateTax,
  NJ_INHERITANCE_TAX,
} from "@/lib/jurisdictionData";
import { STATE_RULES } from "@/lib/stateRules";

const STATES = Object.keys(STATE_RULES).sort();

interface CostBreakdown {
  label: string;
  amount: number;
  note?: string;
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ProbateCalculator() {
  const [state, setState] = useState("CA");
  const [valueInput, setValueInput] = useState("500000");
  const [includeExecutor, setIncludeExecutor] = useState(true);
  const [contested, setContested] = useState(false);

  const grossValue = Math.max(0, Number(valueInput.replace(/[^0-9.]/g, "")) || 0);

  const result = useMemo(() => {
    const rule = STATE_RULES[state];
    const breakdown: CostBreakdown[] = [];
    const smallEstateEligible = rule ? grossValue > 0 && grossValue <= rule.threshold : false;

    // ── Statutory / typical attorney fees ──────────────────────────────
    let attorneyFee = 0;
    let feeModel = "";
    if (state === "CA") {
      attorneyFee = calculateCAStatutoryFee(grossValue);
      feeModel = "Statutory schedule (Prob. Code §10810)";
    } else if (state === "FL") {
      attorneyFee = calculateFLStatutoryFee(grossValue);
      feeModel = "Presumptively reasonable schedule (Fla. Stat. §733.6171)";
    } else {
      // "Reasonable fee" states — estimate 2.5% blended, hourly states vary
      attorneyFee = Math.min(grossValue * 0.03, Math.max(3000, grossValue * 0.025));
      feeModel = "Reasonable-fee state (hourly/negotiated) — estimate";
    }
    breakdown.push({ label: "Attorney fees", amount: attorneyFee, note: feeModel });

    // ── Executor compensation ──────────────────────────────────────────
    let executorFee = 0;
    if (includeExecutor) {
      if (state === "CA") {
        executorFee = calculateCAStatutoryFee(grossValue);
      } else if (state === "NY") {
        executorFee = calculateNYCommission(grossValue);
      } else if (state === "TX") {
        executorFee = Math.min(grossValue * 0.05, grossValue * 0.05); // 5% on cash in/out, capped
      } else {
        executorFee = grossValue * 0.02;
      }
      breakdown.push({
        label: "Executor compensation",
        amount: executorFee,
        note:
          state === "CA"
            ? "Mirrors attorney schedule (Prob. Code §10800)"
            : state === "NY"
              ? "SCPA §2307 commissions"
              : state === "TX"
                ? "5% on cash received/paid (statutory cap)"
                : "Typical 2% 'reasonable' compensation",
      });
    }

    // ── Court & administrative ─────────────────────────────────────────
    const filingFee =
      state === "CA" ? CALIFORNIA.initialFilingFee
      : state === "NY" ? getNYSurrogateFilingFee(grossValue)
      : 300;
    breakdown.push({
      label: "Court filing fees",
      amount: filingFee,
      note:
        state === "CA" ? "Initial petition (2025 base fee)"
        : state === "NY" ? "SCPA §2402 tiered fee schedule"
        : "Typical initial petition",
    });

    const publication = (ANCILLARY_COSTS.publicationNotice.min + ANCILLARY_COSTS.publicationNotice.max) / 2;
    breakdown.push({ label: "Publication & notices", amount: publication });

    if (state === "CA") {
      const referee = grossValue * CALIFORNIA.refereeFeeRate;
      breakdown.push({ label: "Probate referee appraisal", amount: referee, note: "0.1% of appraised assets" });
    } else {
      breakdown.push({
        label: "Appraisals (est.)",
        amount: (ANCILLARY_COSTS.realPropertyAppraisal.min + ANCILLARY_COSTS.realPropertyAppraisal.max) / 2,
      });
    }

    breakdown.push({
      label: "Accounting / tax prep",
      amount: (ANCILLARY_COSTS.cpaFees.min + ANCILLARY_COSTS.cpaFees.max) / 2,
    });

    const subtotal = breakdown.reduce((s, b) => s + b.amount, 0);
    const multiplier = contested ? 2.5 : 1;
    const total = subtotal * multiplier;

    // ── Timeline ───────────────────────────────────────────────────────
    const tl = PROBATE_TIMELINES[state] ?? PROBATE_TIMELINES.DEFAULT;
    const timeline = contested
      ? { minMonths: tl.maxMonths, maxMonths: tl.maxMonths * 2, note: "Contested matters routinely double timelines." }
      : tl;

    // ── Tax flags ──────────────────────────────────────────────────────
    const fedExemption = FEDERAL_ESTATE_TAX.exemption2026;
    const stateThreshold = STATE_ESTATE_TAX_THRESHOLDS[state];
    const hasInheritanceTax = (INHERITANCE_TAX_STATES as readonly string[]).includes(state);
    const nyCliff = state === "NY" ? evaluateNYEstateTax(grossValue, 2026) : null;

    return { breakdown, subtotal, total, timeline, smallEstateEligible, fedExemption, stateThreshold, hasInheritanceTax, rule, nyCliff };
  }, [state, grossValue, includeExecutor, contested]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Probate Cost & Timeline Calculator | ExpectedEstate"
        description="Estimate probate attorney fees, executor compensation, court costs, and timelines by state. Updated with 2025–2026 thresholds including California's AB 2016 rules."
      />
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">2025–2026 data · 50-state thresholds</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Probate Cost &amp; Timeline Calculator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estimate what formal probate will cost and how long it will take in your state —
            including statutory fee schedules, court costs, and tax alerts.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Inputs ─────────────────────────────────────────────── */}
          <Card className="lg:col-span-2 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5" /> Your Estate
              </CardTitle>
              <CardDescription>Enter the gross probate estate value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="state">State of residence</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Gross estate value ($)</Label>
                <Input
                  id="value"
                  inputMode="numeric"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="500000"
                />
                <p className="text-xs text-muted-foreground">
                  Assets passing through probate — exclude trust assets, TOD/POD accounts, and joint property.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Paid executor</p>
                  <p className="text-xs text-muted-foreground">Include executor compensation</p>
                </div>
                <Button
                  variant={includeExecutor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIncludeExecutor(!includeExecutor)}
                >
                  {includeExecutor ? "Yes" : "No"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Contested / complex</p>
                  <p className="text-xs text-muted-foreground">Disputes, will contests, multi-state property</p>
                </div>
                <Button
                  variant={contested ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setContested(!contested)}
                >
                  {contested ? "Yes" : "No"}
                </Button>
              </div>

              {result.smallEstateEligible && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-900">
                        Likely eligible for {result.rule?.smallEstateTerm ?? "simplified procedures"}
                      </p>
                      <p className="text-emerald-800/80 text-xs mt-1">
                        At {money(grossValue)}, this estate is at or under the {state} threshold of{" "}
                        {money(result.rule?.threshold ?? 0)} — you may be able to skip formal probate entirely.
                      </p>
                      {state === "CA" && (
                        <p className="text-emerald-800/80 text-xs mt-1">
                          California note: a primary residence up to {money(CALIFORNIA.primaryResidencePetition.maxValue)} may
                          qualify for the AB 2016 petition even above this threshold.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Results ────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="w-5 h-5" /> Estimated Costs
                </CardTitle>
                <CardDescription>
                  {contested ? "Contested estimate (≈2.5× uncontested)" : "Uncontested formal probate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.breakdown.map((b) => (
                    <div key={b.label} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{b.label}</p>
                        {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{money(b.amount * (contested ? 2.5 : 1))}</p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Estimated total</p>
                    <p className="text-2xl font-bold tabular-nums">{money(result.total)}</p>
                  </div>
                  {grossValue > 0 && (
                    <p className="text-right text-sm text-muted-foreground">
                      ≈ {((result.total / grossValue) * 100).toFixed(1)}% of gross estate
                    </p>
                  )}
                  {(state === "CA" || state === "FL" || state === "NY") && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>
                        <strong>Extraordinary fees not included.</strong> Statutory schedules cover only
                        <em> ordinary</em> administration. Real property sales, tax controversies, litigation,
                        and will contests are billed separately as "extraordinary" services and routinely add
                        30–60% to professional fees in California.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5" /> Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {result.timeline.minMonths}–{result.timeline.maxMonths}{" "}
                    <span className="text-base font-normal text-muted-foreground">months</span>
                  </p>
                  {result.timeline.note && (
                    <p className="text-sm text-muted-foreground mt-2">{result.timeline.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Includes mandatory creditor periods (3–7 months in most states) that cannot be shortened.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Landmark className="w-5 h-5" /> Tax Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {grossValue > result.fedExemption ? (
                    <div className="flex items-start gap-2 text-destructive">
                      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>
                        Exceeds the 2026 federal exemption of {money(result.fedExemption)} — Form 706 likely due
                        within {FEDERAL_ESTATE_TAX.form706DueMonths} months of death.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                      <p>Below the 2026 federal estate tax exemption ({money(result.fedExemption)}/person).</p>
                    </div>
                  )}
                  {result.stateThreshold && (
                    <div className="flex items-start gap-2">
                      <Info className={`w-4 h-4 mt-0.5 shrink-0 ${grossValue > result.stateThreshold ? "text-amber-600" : "text-muted-foreground"}`} />
                      <p className={grossValue > result.stateThreshold ? "text-amber-700" : "text-muted-foreground"}>
                        {state} has its own estate tax with a {money(result.stateThreshold)} exemption
                        {grossValue > result.stateThreshold ? " — a state return may be required." : "."}
                      </p>
                    </div>
                  )}
                  {result.hasInheritanceTax && (
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                      <p className="text-muted-foreground">
                        {state === "NJ" ? (
                          <>
                            NJ inheritance tax (on recipients, not the estate): Class A (spouse, children, parents) exempt;
                            Class C (siblings, in-laws) {money(NJ_INHERITANCE_TAX.classes.C.exemption)} exempt then 11–16%;
                            Class D (all others) 15–16% from the first dollar. IT-R return due 8 months after death.
                          </>
                        ) : (
                          `${state} imposes an inheritance tax on certain beneficiaries (separate from estate tax).`
                        )}
                      </p>
                    </div>
                  )}
                  {result.nyCliff?.warning && (
                    <div className={`flex items-start gap-2 rounded-lg border p-3 ${result.nyCliff.cliffTriggered ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                      <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${result.nyCliff.cliffTriggered ? "text-red-600" : "text-amber-600"}`} />
                      <div className={result.nyCliff.cliffTriggered ? "text-red-800" : "text-amber-800"}>
                        <p className="text-xs font-semibold">NY Estate Tax Cliff (Tax Law §952)</p>
                        <p className="text-xs mt-0.5">{result.nyCliff.warning}</p>
                        <p className="text-xs mt-1 opacity-80">NY's exclusion is also NOT portable between spouses (unlike federal).</p>
                      </div>
                    </div>
                  )}
                  {state === "NJ" && (
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                      <p className="text-muted-foreground text-xs">
                        NJ tax waivers: banks may freeze up to 50% of accounts, and NJ real estate carries an automatic
                        tax lien, until Form L-8 (accounts) / L-9 (real estate) is presented — self-executing for Class A
                        beneficiaries. Small-estate affidavit is intestate-only.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-5">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Want a step-by-step plan for this estate?</p>
                    <p className="text-sm text-muted-foreground">
                      ExpectedEstate generates a personalized roadmap with every statutory deadline tracked.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/auth?mode=signup">
                    Get started free <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Estimates are for planning purposes only and are not legal or tax advice. Statutory schedules
              (CA Prob. Code §§10800/10810, Fla. Stat. §733.6171, NY SCPA §2307) apply to the gross estate
              value as defined by each state; actual fees vary by county, counsel, and complexity.
              Federal exemption: $15,000,000/person effective January 1, 2026 (P.L. 119-21).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
