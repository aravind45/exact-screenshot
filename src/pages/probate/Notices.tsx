import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Estate } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, Clock, MapPin, Building, Calendar, Save, Newspaper,
  AlertTriangle, CheckCircle2, ChevronRight, Copy, Upload,
  FileText, Scale, DollarSign, ShieldAlert, Info
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

// State-specific creditor notice periods (in days)
const STATE_CREDITOR_PERIODS: Record<string, { days: number; method: string; note: string }> = {
  CA: { days: 120, method: "Mail + Publish in local newspaper", note: "Must publish for 3 consecutive weeks in a newspaper of general circulation in the county." },
  TX: { days: 180, method: "Publish in local newspaper", note: "Must publish once a week for 4 consecutive weeks." },
  FL: { days: 90,  method: "Mail + Publish in local newspaper", note: "3-month creditor period after first publication." },
  NY: { days: 180, method: "Publish in local newspaper", note: "Must publish in two newspapers for 4 consecutive weeks." },
  DEFAULT: { days: 120, method: "Mail + Publish in local newspaper", note: "State-specific requirements apply. Consult local court rules." },
};

// Creditor claim priority waterfall
const CLAIM_PRIORITY = [
  { rank: 1, label: "Court costs & administration fees",  color: "bg-indigo-100 text-indigo-700", desc: "Attorney fees, executor fees, court filing costs — paid first." },
  { rank: 2, label: "Funeral & burial expenses",          color: "bg-slate-100 text-slate-700",   desc: "Reasonable funeral costs are a priority claim." },
  { rank: 3, label: "Debts / taxes owed to government",   color: "bg-red-100 text-red-700",       desc: "Federal and state tax liens, government debts." },
  { rank: 4, label: "Family allowances (if applicable)",  color: "bg-amber-100 text-amber-700",   desc: "Surviving spouse/minor children may have a statutory allowance." },
  { rank: 5, label: "Secured creditors",                  color: "bg-orange-100 text-orange-700", desc: "Mortgage, auto loans, liens on specific assets." },
  { rank: 6, label: "Unsecured general creditors",        color: "bg-blue-100 text-blue-700",     desc: "Credit cards, medical bills, personal loans — paid pro-rata if insufficient funds." },
  { rank: 7, label: "Distributions to beneficiaries",     color: "bg-emerald-100 text-emerald-700", desc: "Heirs receive only after all valid claims are paid." },
];

export default function Notices() {
  const queryClient = useQueryClient();
  const [hearingData, setHearingData] = useState<Partial<Estate>>({});
  const [pubDate, setPubDate] = useState("");
  const [pubNewspaper, setPubNewspaper] = useState("");
  const [proofUploaded, setProofUploaded] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data: estate } = useQuery({
    queryKey: ["estate"],
    queryFn: api.getMyEstate,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (estate) {
      setHearingData({
        hearingDate: estate.hearingDate ? estate.hearingDate.split("T")[0] : "",
        hearingTime: (estate as any).hearingTime || "",
        hearingDept: (estate as any).hearingDept || "",
        hearingAddress: (estate as any).hearingAddress || "",
      });
      setPubNewspaper((estate as any).publicationNewspaper || "");
    }
  }, [estate]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Estate>) => api.updateMyEstate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estate"] });
      toast.success("Details saved");
    },
    onError: (err: any) => toast.error("Failed to save: " + err.message),
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      api.previewPetition({ ...estate, ...hearingData, formType: "DE-121" }),
    onError: (err: any) => toast.error("Preview failed: " + err.message),
  });

  if (!estate) return <div className="p-8">Loading...</div>;

  const stateCode = estate.deceasedState || "CA";
  const creditorRules =
    STATE_CREDITOR_PERIODS[stateCode] || STATE_CREDITOR_PERIODS.DEFAULT;
  const hearingStatus = hearingData.hearingDate ? "scheduled" : "pending";

  // Creditor deadline = appointedDate + days
  const appointedDate = (estate as any).appointedDate;
  const creditorDeadline = appointedDate
    ? new Date(
        new Date(appointedDate).getTime() +
          creditorRules.days * 24 * 60 * 60 * 1000
      ).toLocaleDateString()
    : null;

  // Legal notice template
  const noticeName = estate.hasWill ? "Executor" : "Administrator";
  const noticeTemplate = `NOTICE TO CREDITORS
Estate of ${estate.deceasedFirstName || "[DECEDENT FIRST NAME]"} ${estate.deceasedLastName || "[DECEDENT LAST NAME]"}, Deceased.
Case No. ${estate.courtCaseNumber || "[CASE NUMBER]"}

Notice is hereby given that ${estate.executorName || "[YOUR FULL NAME]"}, as ${noticeName} of the above estate, has been appointed and qualified. All persons having claims against the decedent are required to present their claims within ${creditorRules.days} days of the date of first publication of this notice, or they may be forever barred.

Claims must be filed with the Clerk of the Superior Court of ${estate.probateCounty || "[COUNTY]"} County, or mailed to the ${noticeName} at: [YOUR ADDRESS].

First Date of Publication: ${pubDate || "[DATE]"}
Published in: ${pubNewspaper || "[NEWSPAPER NAME]"}`;

  return (
    <DashboardLayout>
      <SEO
        title="Notices & Creditor Claims — Probate"
        description="Manage court hearing notices and the creditor publication notice workflow for estate settlement."
      />

      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Newspaper className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Notices & Creditor Claims
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-400 ml-1">
            Court hearing notices (DE-121) and the statutory creditor publication workflow
          </p>
        </div>
        {creditorDeadline && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Creditor Claim Deadline</p>
              <p className="text-sm font-black text-red-700">{creditorDeadline}</p>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="hearing" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-11">
          <TabsTrigger value="hearing" className="rounded-xl font-black text-[11px] uppercase tracking-widest">
            Court Hearing (DE-121)
          </TabsTrigger>
          <TabsTrigger value="creditor" className="rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5">
            Creditor Notice
            {!proofUploaded && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">!</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="priority" className="rounded-xl font-black text-[11px] uppercase tracking-widest">
            Claim Priority
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Court Hearing DE-121 ─────────────────────── */}
        <TabsContent value="hearing" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-100 shadow-sm rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Hearing Details
                </CardTitle>
                <CardDescription>Enter the date provided by the court clerk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hearing Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="date"
                      className="pl-9 rounded-xl"
                      value={hearingData.hearingDate || ""}
                      onChange={(e) => setHearingData({ ...hearingData, hearingDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Time</Label>
                    <Input
                      placeholder="9:00 AM"
                      value={(hearingData as any).hearingTime || ""}
                      onChange={(e) => setHearingData({ ...hearingData, hearingTime: e.target.value } as any)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dept / Room</Label>
                    <Input
                      placeholder="204"
                      value={(hearingData as any).hearingDept || ""}
                      onChange={(e) => setHearingData({ ...hearingData, hearingDept: e.target.value } as any)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Court Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 rounded-xl"
                      placeholder="Full courthouse address"
                      value={(hearingData as any).hearingAddress || ""}
                      onChange={(e) => setHearingData({ ...hearingData, hearingAddress: e.target.value } as any)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest"
                  onClick={() => updateMutation.mutate(hearingData)}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Hearing Details
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-none rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  DE-121 Notice of Petition
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Mail to all heirs and creditors at least 15 days before the hearing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-300">Hearing Status</span>
                    <Badge className={cn("text-[9px] font-black border-none", hearingStatus === "scheduled" ? "bg-emerald-600 text-white" : "bg-red-900 text-red-300")}>
                      {hearingStatus === "scheduled" ? "SCHEDULED" : "DATE MISSING"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    You need a confirmed hearing date from the court before generating DE-121.
                  </p>
                </div>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest rounded-xl"
                  onClick={() => { updateMutation.mutate(hearingData); previewMutation.mutate(); }}
                  disabled={!hearingData.hearingDate}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Preview DE-121 Form
                </Button>
              </CardContent>
            </Card>
          </div>

          {previewMutation.isSuccess && (
            <Card className="border-2 border-amber-200 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base font-black">DE-121 Preview</CardTitle>
              </CardHeader>
              <CardContent className="h-[600px] p-4">
                <iframe
                  src={`data:application/pdf;base64,${(previewMutation.data as any)?.pdfBase64}`}
                  className="w-full h-full rounded-xl border"
                  title="DE-121 Preview"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Creditor Publication Notice ──────────────── */}
        <TabsContent value="creditor" className="space-y-6">
          {/* State rules banner */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 items-start">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-black text-indigo-900">
                {stateCode} — {creditorRules.days}-Day Creditor Notice Period
              </p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                <strong>Method:</strong> {creditorRules.method}<br />
                {creditorRules.note}
              </p>
            </div>
            {creditorDeadline && (
              <div className="text-right flex-shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Claim Deadline</p>
                <p className="text-sm font-black text-indigo-900">{creditorDeadline}</p>
              </div>
            )}
          </div>

          {/* 4-step workflow */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: 1,
                title: "Choose a qualifying newspaper",
                done: !!pubNewspaper,
                content: (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Must be a newspaper of "general circulation" in the county where probate is filed. Call the court clerk to confirm which newspapers qualify. Legal notice departments at newspapers handle this regularly.
                    </p>
                    <Input
                      placeholder="Newspaper name (e.g. SF Chronicle)"
                      value={pubNewspaper}
                      onChange={(e) => setPubNewspaper(e.target.value)}
                      className="rounded-xl h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg"
                      onClick={() => updateMutation.mutate({ ...estate, publicationNewspaper: pubNewspaper } as any)}
                      disabled={!pubNewspaper}
                    >
                      Save Newspaper
                    </Button>
                  </div>
                ),
              },
              {
                step: 2,
                title: "Copy & submit the legal notice",
                done: copiedTemplate,
                content: (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500">
                      Copy this template, fill in missing fields, and submit to the newspaper's legal notice department.
                    </p>
                    <div className="bg-slate-900 text-slate-300 text-[10px] font-mono p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-slate-700 max-h-40 overflow-y-auto">
                      {noticeTemplate}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg border-indigo-200 text-indigo-700"
                      onClick={() => {
                        navigator.clipboard.writeText(noticeTemplate);
                        setCopiedTemplate(true);
                        toast.success("Notice template copied to clipboard");
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {copiedTemplate ? "Copied ✓" : "Copy Template"}
                    </Button>
                  </div>
                ),
              },
              {
                step: 3,
                title: "Set your first publication date",
                done: !!pubDate,
                content: (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500">
                      Record the first date of publication. The creditor claim period starts from this date.
                    </p>
                    <Input
                      type="date"
                      value={pubDate}
                      onChange={(e) => setPubDate(e.target.value)}
                      className="rounded-xl h-8 text-xs"
                    />
                    {pubDate && creditorRules && (
                      <div className="text-[10px] font-black text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
                        Creditor claim window closes:{" "}
                        {new Date(
                          new Date(pubDate).getTime() +
                            creditorRules.days * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                step: 4,
                title: "Upload Proof of Publication",
                done: proofUploaded,
                content: (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500">
                      The newspaper will send you a "Proof of Publication" affidavit. File this with the probate court immediately. Keep a copy — it's required to close the estate.
                    </p>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-500">
                        Upload Proof of Publication PDF
                      </p>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        id="proof-upload"
                        onChange={() => {
                          setProofUploaded(true);
                          toast.success("Proof of publication uploaded");
                        }}
                      />
                      <label htmlFor="proof-upload">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg mt-2 cursor-pointer"
                          asChild
                        >
                          <span>Choose File</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ),
              },
            ].map((item) => (
              <Card key={item.step} className={cn("border rounded-3xl shadow-sm", item.done ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100")}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center flex-shrink-0", item.done ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white")}>
                      {item.done ? "✓" : item.step}
                    </div>
                    <p className="text-xs font-black text-slate-800">{item.title}</p>
                  </div>
                  {item.content}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Creditor claim evaluation guide */}
          <Card className="border-slate-100 rounded-3xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-500" />
                How to Evaluate Creditor Claims
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { action: "Allow",   color: "bg-emerald-100 text-emerald-800", when: "Claim is valid, within period, properly documented. Pay per priority waterfall." },
                { action: "Dispute", color: "bg-amber-100 text-amber-800",   when: "Claim is incorrect in amount, lacks documentation, or may be barred by statute of limitations." },
                { action: "Reject",  color: "bg-red-100 text-red-800",       when: "Claim is filed after the deadline, already paid, or fraudulent. File Notice of Rejection with court." },
              ].map((row) => (
                <div key={row.action} className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-2xl">
                  <Badge className={cn("flex-shrink-0 border-none font-black text-[10px]", row.color)}>{row.action}</Badge>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{row.when}</p>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                ⚠️ <strong>Personal liability risk:</strong> If you distribute estate assets to beneficiaries before paying all valid creditor claims, you can be personally liable for the unpaid balance. When in doubt, consult an estate attorney.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Claim Priority Waterfall ─────────────────── */}
        <TabsContent value="priority" className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-xs font-black text-slate-700 mb-1">Payment Priority Waterfall</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Debts must be paid in this exact order. You cannot pay a lower-priority creditor if a higher-priority claim exists and the estate is insufficient to cover both.
            </p>
          </div>

          <div className="space-y-2">
            {CLAIM_PRIORITY.map((item) => (
              <div key={item.rank} className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className={cn("w-8 h-8 rounded-xl text-sm font-black flex items-center justify-center flex-shrink-0", item.color)}>
                  {item.rank}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
            <div className="flex gap-2 items-start">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-red-900">Insolvent Estate Warning</p>
                <p className="text-[10px] text-red-700 mt-0.5 leading-relaxed">
                  If the estate cannot pay all claims in full, lower-priority creditors receive nothing (or pro-rata shares). Beneficiaries receive nothing until all creditors in ranks 1-6 are paid. Document every distribution decision carefully.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
