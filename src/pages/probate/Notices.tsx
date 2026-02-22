import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Estate } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye, Clock, MapPin, Building, Calendar, Save, Newspaper,
  AlertTriangle, CheckCircle2, ChevronRight, Copy, Upload,
  FileText, Scale, DollarSign, ShieldAlert, Info, Target,
  Gavel, Zap, Flag, Mail, FileCheck, Users, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";

// State-specific creditor notice periods (in days)
const STATE_CREDITOR_PERIODS: Record<string, { days: number; method: string; note: string }> = {
  CA: { days: 120, method: "Mail + Publish in local newspaper", note: "Must publish for 3 consecutive weeks in a newspaper of general circulation in the county." },
  TX: { days: 180, method: "Publish in local newspaper", note: "Must publish once a week for 4 consecutive weeks." },
  FL: { days: 90, method: "Mail + Publish in local newspaper", note: "3-month creditor period after first publication." },
  NY: { days: 210, method: "Publish in local newspaper", note: "Must publish in two newspapers for 4 consecutive weeks. Creditors have 7 months to file." },
  DEFAULT: { days: 120, method: "Mail + Publish in local newspaper", note: "State-specific requirements apply. Consult local court rules." },
};

// Creditor claim priority waterfall
const CLAIM_PRIORITY = [
  { rank: 1, label: "Court costs & administration fees", color: "bg-indigo-100 text-indigo-700", desc: "Attorney fees, executor fees, court filing costs — paid first." },
  { rank: 2, label: "Funeral & burial expenses", color: "bg-slate-100 text-slate-700", desc: "Reasonable funeral costs are a priority claim." },
  { rank: 3, label: "Debts / taxes owed to government", color: "bg-red-100 text-red-700", desc: "Federal and state tax liens, government debts." },
  { rank: 4, label: "Family allowances (if applicable)", color: "bg-amber-100 text-amber-700", desc: "Surviving spouse/minor children may have a statutory allowance." },
  { rank: 5, label: "Secured creditors", color: "bg-orange-100 text-orange-700", desc: "Mortgage, auto loans, liens on specific assets." },
  { rank: 6, label: "Unsecured general creditors", color: "bg-blue-100 text-blue-700", desc: "Credit cards, medical bills, personal loans — paid pro-rata if insufficient funds." },
  { rank: 7, label: "Distributions to beneficiaries", color: "bg-emerald-100 text-emerald-700", desc: "Heirs receive only after all valid claims are paid." },
];

export default function Notices() {
  const queryClient = useQueryClient();
  const [hearingData, setHearingData] = useState<Partial<Estate>>({});
  const [pubDate, setPubDate] = useState("");
  const [pubNewspaper, setPubNewspaper] = useState("");
  const [proofUploaded, setProofUploaded] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hearing: true,
    creditor: false,
    priority: false
  });

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
      api.previewPetition({ ...estate, ...hearingData, formType: "NOTICE_OF_HEARING" }),
    onError: (err: any) => toast.error("Preview failed: " + err.message),
  });

  if (!estate) return <div className="p-8">Loading...</div>;

  const stateCode = estate.deceasedState || "";
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

  // Calculate current phase
  const currentPhase = useMemo(() => {
    if (!hearingData.hearingDate) return "hearing";
    if (!pubDate) return "creditor";
    return "priority";
  }, [hearingData.hearingDate, pubDate]);

  // Legal notice template
  const noticeName = estate.hasWill ? "Executor" : "Administrator";
  const noticeTemplate = `NOTICE TO CREDITORS
Estate of ${estate.deceasedFirstName || "[DECEDENT FIRST NAME]"} ${estate.deceasedLastName || "[DECEDENT LAST NAME]"}, Deceased.
Case No. ${estate.courtCaseNumber || "[CASE NUMBER]"}

Notice is hereby given that ${estate.executorName || "[YOUR FULL NAME]"}, as ${noticeName} of the above estate, has been appointed and qualified. All persons having claims against the decedent are required to present their claims within ${creditorRules.days} days of the date of first publication of this notice, or they may be forever barred.

Claims must be filed with the Clerk of the Superior Court of ${estate.probateCounty || "[COUNTY]"} County, or mailed to the ${noticeName} at: [YOUR ADDRESS].

First Date of Publication: ${pubDate || "[DATE]"}
Published in: ${pubNewspaper || "[NEWSPAPER NAME]"}`;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <DashboardLayout>
      <SEO
        title="Notices & Creditor Claims — Probate"
        description="Manage court hearing notices and the creditor publication notice workflow for estate settlement."
      />

      {/* Executive Summary Dashboard */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Newspaper className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Notices & Creditor Claims
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Your step-by-step guide to court notices and creditor management
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Current Phase:</span>
                <Badge className="bg-indigo-100 text-indigo-700 text-xs font-black px-3 py-1 rounded-full">
                  {currentPhase === "hearing" && "1. Court Hearing"}
                  {currentPhase === "creditor" && "2. Creditor Notice"}
                  {currentPhase === "priority" && "3. Claim Management"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Progress:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((phase) => (
                    <div
                      key={phase}
                      className={cn(
                        "w-8 h-2 rounded-full transition-all",
                        phase === 1 && hearingData.hearingDate ? "bg-emerald-500" : "bg-slate-200",
                        phase === 2 && pubDate ? "bg-emerald-500" : "bg-slate-200",
                        phase === 3 && creditorDeadline ? "bg-emerald-500" : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Deadlines */}
          <div className="space-y-2">
            {creditorDeadline && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-red-500">Critical Deadline</p>
                  <p className="text-sm font-black text-red-700">Creditor Claims Due: {creditorDeadline}</p>
                </div>
              </div>
            )}
            {hearingData.hearingDate && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Calendar className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-amber-500">Court Hearing</p>
                  <p className="text-sm font-black text-amber-700">{hearingData.hearingDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PhaseCard
            phase="hearing"
            title="Court Hearing Notice"
            description="Schedule your probate hearing and notify all interested parties"
            status={hearingData.hearingDate ? "completed" : "current"}
            icon={<Building className="w-5 h-5" />}
            onClick={() => toggleSection("hearing")}
          />
          <PhaseCard
            phase="creditor"
            title="Creditor Publication"
            description="Publish legal notice to creditors and track the claim period"
            status={pubDate ? "completed" : hearingData.hearingDate ? "current" : "pending"}
            icon={<Newspaper className="w-5 h-5" />}
            onClick={() => toggleSection("creditor")}
          />
          <PhaseCard
            phase="priority"
            title="Claim Management"
            description="Evaluate creditor claims and follow payment priority rules"
            status={creditorDeadline ? "current" : "pending"}
            icon={<Scale className="w-5 h-5" />}
            onClick={() => toggleSection("priority")}
          />
        </div>
      </div>

      {/* Phase 1: Court Hearing */}
      <PhaseSection
        id="hearing"
        title="Phase 1: Court Hearing Notice"
        icon={<Target className="w-5 h-5" />}
        isExpanded={expandedSections.hearing}
        onToggle={() => toggleSection("hearing")}
        status={hearingData.hearingDate ? "completed" : "current"}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Hearing Details
              </CardTitle>
              <CardDescription>Enter the date provided by the court clerk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Hearing Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-9 rounded-xl h-10"
                    value={hearingData.hearingDate || ""}
                    onChange={(e) => setHearingData({ ...hearingData, hearingDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Time</Label>
                  <Input
                    placeholder="9:00 AM"
                    value={(hearingData as any).hearingTime || ""}
                    onChange={(e) => setHearingData({ ...hearingData, hearingTime: e.target.value } as any)}
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Dept / Room</Label>
                  <Input
                    placeholder="204"
                    value={(hearingData as any).hearingDept || ""}
                    onChange={(e) => setHearingData({ ...hearingData, hearingDept: e.target.value } as any)}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Court Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl h-10"
                    placeholder="Full courthouse address"
                    value={(hearingData as any).hearingAddress || ""}
                    onChange={(e) => setHearingData({ ...hearingData, hearingAddress: e.target.value } as any)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Why this matters:</strong> Without a confirmed hearing date, you cannot file the required notice of hearing. This notice must be mailed to all heirs and creditors according to the statutory timeline.
                </p>
                <p className="text-xs text-slate-400">
                  <strong>Next step:</strong> Once you have the hearing date, generate and mail the notice form to all interested parties.
                </p>
              </div>
              <Button
                className="w-full rounded-xl font-black text-xs uppercase tracking-widest h-11"
                onClick={() => updateMutation.mutate(hearingData)}
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Hearing Details
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2 text-slate-100">
                <FileCheck className="w-4 h-4 text-amber-400" />
                Notice of Petition / Hearing
              </CardTitle>
              <CardDescription className="text-slate-300 text-sm">
                Mail to all heirs and creditors at least 15 days before the hearing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">Status</span>
                  <Badge className={cn("text-xs font-black border-none", hearingData.hearingDate ? "bg-emerald-600 text-white" : "bg-red-900 text-red-300")}>
                    {hearingData.hearingDate ? "READY TO GENERATE" : "HEARING DATE REQUIRED"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {hearingData.hearingDate
                    ? "You have all the information needed to generate the notice form."
                    : "You need a confirmed hearing date from the court before generating the notice."
                  }
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  <strong>What to do:</strong> Generate the DE-121 form, print it, and mail it to all heirs and creditors at least 15 days before your hearing date.
                </p>
                <p className="text-xs text-slate-400">
                  <strong>Where to send:</strong> All interested parties must receive notice. Keep copies of all mailed notices for your records.
                </p>
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl h-11"
                onClick={() => { updateMutation.mutate(hearingData); previewMutation.mutate(); }}
                disabled={!hearingData.hearingDate}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview & Generate Notice Form
              </Button>
            </CardContent>
          </Card>
        </div>

        {previewMutation.isSuccess && (
          <Card className="border-2 border-amber-200 rounded-2xl overflow-hidden mt-6">
            <CardHeader>
              <CardTitle className="text-base font-black">DE-121 Preview</CardTitle>
              <CardDescription>Review the generated form before printing and mailing</CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] p-4">
              <iframe
                src={`data:application/pdf;base64,${(previewMutation.data as any)?.pdfBase64}`}
                className="w-full h-full rounded-xl border"
                title="Notice Form Preview"
              />
            </CardContent>
          </Card>
        )}
      </PhaseSection>

      {/* Phase 2: Creditor Publication */}
      <PhaseSection
        id="creditor"
        title="Phase 2: Creditor Publication Notice"
        icon={<Users className="w-5 h-5" />}
        isExpanded={expandedSections.creditor}
        onToggle={() => toggleSection("creditor")}
        status={pubDate ? "completed" : hearingData.hearingDate ? "current" : "pending"}
      >
        {/* State rules banner */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 items-start mb-6">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-indigo-900 mb-1">
              {stateCode} — {creditorRules.days}-Day Creditor Notice Period
            </p>
            <p className="text-sm text-indigo-700 leading-relaxed">
              <strong>Method:</strong> {creditorRules.method}<br />
              {creditorRules.note}
            </p>
          </div>
          {creditorDeadline && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Claim Deadline</p>
              <p className="text-lg font-black text-indigo-900">{creditorDeadline}</p>
            </div>
          )}
        </div>

        {/* 4-step workflow */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[
            {
              step: 1,
              title: "Choose a qualifying newspaper",
              done: !!pubNewspaper,
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Must be a newspaper of "general circulation" in the county where probate is filed. Call the court clerk to confirm which newspapers qualify. Legal notice departments at newspapers handle this regularly.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Newspaper Name</Label>
                    <Input
                      placeholder="Newspaper name (e.g. SF Chronicle)"
                      value={pubNewspaper}
                      onChange={(e) => setPubNewspaper(e.target.value)}
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-9 text-xs font-black uppercase tracking-widest rounded-lg"
                      onClick={() => updateMutation.mutate({ ...estate, publicationNewspaper: pubNewspaper } as any)}
                      disabled={!pubNewspaper}
                    >
                      Save Newspaper
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-black uppercase tracking-widest rounded-lg border-slate-200"
                      onClick={() => {
                        // Mock court clerk contact
                        toast.info("Contact your local court clerk to confirm qualifying newspapers in your county");
                      }}
                    >
                      Find Qualifying Papers
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              step: 2,
              title: "Copy & submit the legal notice",
              done: copiedTemplate,
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Copy this template, fill in missing fields, and submit to the newspaper's legal notice department.
                  </p>
                  <div className="bg-slate-900 text-slate-300 text-sm font-mono p-4 rounded-xl leading-relaxed whitespace-pre-wrap border border-slate-700 max-h-48 overflow-y-auto">
                    {noticeTemplate}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-black uppercase tracking-widest rounded-lg border-indigo-200 text-indigo-700"
                      onClick={() => {
                        navigator.clipboard.writeText(noticeTemplate);
                        setCopiedTemplate(true);
                        toast.success("Notice template copied to clipboard");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedTemplate ? "Copied ✓" : "Copy Template"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-black uppercase tracking-widest rounded-lg border-slate-200"
                      onClick={() => {
                        // Mock newspaper contact
                        toast.info("Contact the newspaper's legal notice department with this template");
                      }}
                    >
                      Submit to Newspaper
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              step: 3,
              title: "Set your first publication date",
              done: !!pubDate,
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Record the first date of publication. The creditor claim period starts from this date.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">First Publication Date</Label>
                    <Input
                      type="date"
                      value={pubDate}
                      onChange={(e) => setPubDate(e.target.value)}
                      className="rounded-xl h-10"
                    />
                  </div>
                  {pubDate && creditorRules && (
                    <div className="text-sm font-black text-indigo-700 bg-indigo-50 rounded-lg px-4 py-3">
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
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The newspaper will send you a "Proof of Publication" affidavit. File this with the probate court immediately. Keep a copy — it's required to close the estate.
                  </p>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500 mb-3">
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
                        className="h-10 text-xs font-black uppercase tracking-widest rounded-lg mt-2 cursor-pointer border-slate-200"
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
            <Card key={item.step} className={cn("border rounded-2xl shadow-sm", item.done ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg text-sm font-black flex items-center justify-center flex-shrink-0", item.done ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white")}>
                    {item.done ? "✓" : item.step}
                  </div>
                  <p className="text-base font-black text-slate-800">{item.title}</p>
                </div>
                {item.content}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Risk Alert */}
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
          <div className="flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-900 mb-1">Critical Compliance Requirement</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Failure to properly publish the creditor notice can result in personal liability. The notice must be published for the full statutory period in a qualifying newspaper. Keep all proof of publication documents safe — you'll need them to close the estate.
              </p>
            </div>
          </div>
        </div>
      </PhaseSection>

      {/* Phase 3: Claim Management */}
      <PhaseSection
        id="priority"
        title="Phase 3: Creditor Claim Management"
        icon={<Scale className="w-5 h-5" />}
        isExpanded={expandedSections.priority}
        onToggle={() => toggleSection("priority")}
        status={creditorDeadline ? "current" : "pending"}
      >
        <div className="space-y-6">
          {/* Payment Priority Waterfall */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-base font-black text-slate-700 mb-2">Payment Priority Rules</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Debts must be paid in this exact order. You cannot pay a lower-priority creditor if a higher-priority claim exists and the estate is insufficient to cover both.
              </p>
            </div>

            <div className="space-y-3">
              {CLAIM_PRIORITY.map((item) => (
                <div key={item.rank} className="flex gap-4 items-start p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div className={cn("w-10 h-10 rounded-xl text-base font-black flex items-center justify-center flex-shrink-0", item.color)}>
                    {item.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-slate-800 mb-1">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-black text-red-900 mb-1">Insolvent Estate Warning</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    If the estate cannot pay all claims in full, lower-priority creditors receive nothing (or pro-rata shares). Beneficiaries receive nothing until all creditors in ranks 1-6 are paid. Document every distribution decision carefully.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Claim Evaluation Guide */}
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-base font-black text-indigo-900 mb-2">How to Evaluate Creditor Claims</p>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Use this guide to determine how to handle each creditor claim you receive.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                { action: "Allow", color: "bg-emerald-100 text-emerald-800", when: "Claim is valid, within period, properly documented. Pay per priority waterfall." },
                { action: "Dispute", color: "bg-amber-100 text-amber-800", when: "Claim is incorrect in amount, lacks documentation, or may be barred by statute of limitations." },
                { action: "Reject", color: "bg-red-100 text-red-800", when: "Claim is filed after the deadline, already paid, or fraudulent. File Notice of Rejection with court." },
              ].map((row) => (
                <div key={row.action} className="flex gap-4 items-start p-4 bg-white border border-slate-100 rounded-xl">
                  <Badge className={cn("flex-shrink-0 border-none font-black text-sm", row.color)}>{row.action}</Badge>
                  <p className="text-sm text-slate-600 leading-relaxed">{row.when}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm font-black text-red-900 mb-2">⚠️ Personal Liability Risk</p>
              <p className="text-sm text-red-700 leading-relaxed">
                If you distribute estate assets to beneficiaries before paying all valid creditor claims, you can be personally liable for the unpaid balance. When in doubt, consult an estate attorney.
              </p>
            </div>
          </div>
        </div>
      </PhaseSection>
    </DashboardLayout>
  );
}

// Helper Components
interface PhaseCardProps {
  phase: string;
  title: string;
  description: string;
  status: "pending" | "current" | "completed";
  icon: React.ReactNode;
  onClick: () => void;
}

function PhaseCard({ phase, title, description, status, icon, onClick }: PhaseCardProps) {
  const statusConfig = {
    pending: { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100" },
    current: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" }
  };

  const config = statusConfig[status];

  return (
    <Card
      className={cn("border rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all", config.border, config.bg)}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", status === "completed" ? "bg-white" : "bg-white/50")}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{title}</p>
              <p className={cn("text-sm", config.text)}>{description}</p>
            </div>
          </div>
          <Badge className={cn("text-xs font-black border-none px-2 py-1",
            status === "completed" ? "bg-emerald-100 text-emerald-700" :
              status === "current" ? "bg-indigo-100 text-indigo-700" :
                "bg-slate-100 text-slate-500"
          )}>
            {status === "completed" ? "Done" : status === "current" ? "In Progress" : "Up Next"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface PhaseSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  status: "pending" | "current" | "completed";
  children: React.ReactNode;
}

function PhaseSection({ id, title, icon, isExpanded, onToggle, status, children }: PhaseSectionProps) {
  const statusConfig = {
    pending: { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100" },
    current: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" }
  };

  const config = statusConfig[status];

  return (
    <Card className={cn("border rounded-2xl shadow-sm mb-6", config.border, config.bg)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", status === "completed" ? "bg-white" : "bg-white/50")}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-900">{title}</CardTitle>
              <CardDescription className={config.text}>
                {status === "completed" ? "Phase completed successfully" :
                  status === "current" ? "Currently working on this phase" :
                    "Complete previous phases to unlock"}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-4">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
