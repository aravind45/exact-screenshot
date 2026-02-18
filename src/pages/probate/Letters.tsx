import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Estate } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, Gavel, CheckCircle2, AlertTriangle, Save, Copy,
  Building2, Clock, Info, Plus, Trash2, ChevronDown, ChevronRight,
  FileText, ShieldCheck, Printer, ExternalLink, CheckSquare, Square
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";

// ─── Institution Dispatch Tracker ────────────────────────────────────────────
// Each institution that commonly requires Letters Testamentary / Administration
type CopyStatus = "not_sent" | "requested" | "sent" | "acknowledged" | "returned_stale";

interface Institution {
  id: string;
  name: string;
  type: string;
  needsOriginal: boolean;
  status: CopyStatus;
  sentDate?: string;
  notes?: string;
}

const DEFAULT_INSTITUTIONS: Institution[] = [
  { id: "bank_primary",    name: "Primary Bank / Checking",        type: "Bank",        needsOriginal: true,  status: "not_sent" },
  { id: "bank_secondary",  name: "Secondary Bank / Savings",       type: "Bank",        needsOriginal: false, status: "not_sent" },
  { id: "brokerage",       name: "Investment / Brokerage Account", type: "Brokerage",   needsOriginal: true,  status: "not_sent" },
  { id: "retirement",      name: "Retirement Account (IRA/401k)",  type: "Financial",   needsOriginal: false, status: "not_sent" },
  { id: "life_insurance",  name: "Life Insurance Company",         type: "Insurance",   needsOriginal: false, status: "not_sent" },
  { id: "real_estate",     name: "Title Company / Real Estate",    type: "Real Estate", needsOriginal: true,  status: "not_sent" },
  { id: "safe_deposit",    name: "Safe Deposit Box Access",        type: "Bank",        needsOriginal: true,  status: "not_sent" },
  { id: "irs",             name: "IRS / Tax Authorities",          type: "Government",  needsOriginal: false, status: "not_sent" },
  { id: "ssa",             name: "Social Security Administration", type: "Government",  needsOriginal: true,  status: "not_sent" },
  { id: "dmv",             name: "DMV / Vehicle Transfer",         type: "Government",  needsOriginal: false, status: "not_sent" },
  { id: "employer",        name: "Employer (Final Pay / Benefits)", type: "Employer",   needsOriginal: false, status: "not_sent" },
  { id: "attorney",        name: "Estate Attorney",                type: "Legal",       needsOriginal: false, status: "not_sent" },
];

const STATUS_CONFIG: Record<CopyStatus, { label: string; color: string }> = {
  not_sent:       { label: "Not Sent",          color: "bg-slate-100 text-slate-500" },
  requested:      { label: "Copy Requested",    color: "bg-amber-100 text-amber-700" },
  sent:           { label: "Copy Sent",         color: "bg-blue-100 text-blue-700" },
  acknowledged:   { label: "Acknowledged ✓",   color: "bg-emerald-100 text-emerald-700" },
  returned_stale: { label: "Returned — Stale", color: "bg-red-100 text-red-700" },
};

const TYPE_COLORS: Record<string, string> = {
  Bank: "bg-blue-50 text-blue-600",
  Brokerage: "bg-purple-50 text-purple-600",
  Financial: "bg-indigo-50 text-indigo-600",
  Insurance: "bg-green-50 text-green-600",
  Government: "bg-amber-50 text-amber-600",
  "Real Estate": "bg-orange-50 text-orange-600",
  Employer: "bg-teal-50 text-teal-600",
  Legal: "bg-slate-50 text-slate-600",
};

function useInstitutionTracker(estateId: string) {
  const storageKey = `letters_tracker_${estateId}`;
  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_INSTITUTIONS;
    } catch { return DEFAULT_INSTITUTIONS; }
  });

  const save = useCallback((updated: Institution[]) => {
    setInstitutions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [storageKey]);

  const updateStatus = (id: string, status: CopyStatus, sentDate?: string) =>
    save(institutions.map(i => i.id === id ? { ...i, status, sentDate } : i));

  const addCustom = (name: string, type: string) =>
    save([...institutions, { id: `custom_${Date.now()}`, name, type, needsOriginal: false, status: "not_sent" }]);

  const remove = (id: string) =>
    save(institutions.filter(i => i.id !== id));

  const reset = () => save(DEFAULT_INSTITUTIONS);

  return { institutions, updateStatus, addCustom, remove, reset };
}

export default function Letters() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Estate>>({});
  const [newInstName, setNewInstName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: estate } = useQuery({
    queryKey: ["estate"],
    queryFn: api.getMyEstate,
    staleTime: 0,
  });

  useEffect(() => {
    if (estate) {
      setFormData({
        iaeaType: estate.iaeaType || "FULL",
        appointedDate: estate.appointedDate ? estate.appointedDate.split("T")[0] : "",
      });
    }
  }, [estate]);

  const { institutions, updateStatus, addCustom, remove, reset } =
    useInstitutionTracker(estate?.id || "default");

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Estate>) => api.updateMyEstate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estate"] });
      toast.success("Authority details saved");
    },
    onError: (err: any) => toast.error("Failed to save: " + err.message),
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      api.previewPetition({ ...estate, ...formData, formType: "DE-150" }),
    onError: (err: any) => toast.error("Preview failed: " + err.message),
  });

  const isProbatePath =
    estate?.authorityType === "FORMAL_PROBATE" ||
    estate?.authorityType === "INFORMAL_PROBATE" ||
    estate?.authorityType === "INTESTATE" ||
    estate?.authorityType === "SUMMARY_ADMINISTRATION";

  const lettersType = estate?.hasWill
    ? "Letters Testamentary"
    : "Letters of Administration";

  const hasBond = !estate?.bondWaived && (estate?.bondAmount || 0) > 0;

  // Recommended copy count: count institutions + buffer
  const originals = institutions.filter((i) => i.needsOriginal).length;
  const recommended = Math.max(originals + 3, 8);

  const acknowledged = institutions.filter((i) => i.status === "acknowledged").length;
  const stale = institutions.filter((i) => i.status === "returned_stale").length;

  return (
    <DashboardLayout>
      <SEO
        title="Letters Testamentary — Authority Documents"
        description="Track your Letters Testamentary or Letters of Administration, manage certified copies, and dispatch to institutions."
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Gavel className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {lettersType}
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-400 ml-1">
            Your proof of legal authority — every bank, brokerage, and court requires this document.
          </p>
        </div>
        <div className="flex gap-3">
          {!isProbatePath && (
            <Badge className="bg-amber-100 text-amber-800 border-none font-bold px-3">
              Not Required for Your Track
            </Badge>
          )}
          {isProbatePath && formData.appointedDate && (
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold px-3">
              ✓ Issued {new Date(formData.appointedDate).toLocaleDateString()}
            </Badge>
          )}
          {isProbatePath && !formData.appointedDate && (
            <Badge className="bg-amber-100 text-amber-700 border-none font-bold px-3 animate-pulse">
              Awaiting Court Issuance
            </Badge>
          )}
        </div>
      </div>

      {/* ── Not-applicable notice ─────────────────────────────── */}
      {!isProbatePath && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-amber-900">
              {estate?.authorityType?.replace(/_/g, " ")} — No Court Letters Required
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Your track uses a different authority document. Trusts use a <strong>Certificate of Trust</strong>; small estates use an <strong>Affidavit</strong>; TOD/POD assets transfer by beneficiary claim. The institution tracker below still applies.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-11">
          <TabsTrigger value="overview" className="rounded-xl font-black text-[11px] uppercase tracking-widest">
            Overview & Authority
          </TabsTrigger>
          <TabsTrigger value="copies" className="rounded-xl font-black text-[11px] uppercase tracking-widest">
            Certified Copies
          </TabsTrigger>
          <TabsTrigger value="tracker" className="rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5">
            Institution Tracker
            {stale > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {stale}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview & Authority Config ───────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Step-by-step guide */}
            <Card className="border-slate-100 shadow-sm rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" />
                  How to Get Your Letters
                </CardTitle>
                <CardDescription>4 steps from hearing to certified copies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { n: 1, title: "File & attend your probate hearing", desc: "The court will name you Executor / Administrator at the hearing. Bring your petition, death certificate, and ID." },
                  { n: 2, title: "Receive the signed Order", desc: "The judge signs the Order for Probate. Keep the original — certified copies are made from this." },
                  { n: 3, title: "Order certified copies from the clerk", desc: `Order ${recommended} certified copies. Typical fee is $15–$30 per copy. Each institution gets one and will NOT return it.` },
                  { n: 4, title: "Dispatch copies to institutions", desc: "Use the Institution Tracker tab to log which institutions received copies and when they acknowledged authority." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                      {step.n}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{step.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Authority config + generate */}
            <div className="space-y-4">
              <Card className="border-slate-100 shadow-sm rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Authority Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Date Appointed / Letters Issued
                    </Label>
                    <Input
                      type="date"
                      value={formData.appointedDate || ""}
                      onChange={(e) => setFormData({ ...formData, appointedDate: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400">
                      This starts the creditor notice period and inventory deadline clock.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      IAEA Authority Level
                    </Label>
                    <Select
                      value={formData.iaeaType || "FULL"}
                      onValueChange={(v: any) => setFormData({ ...formData, iaeaType: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL">Full Authority (IAEA)</SelectItem>
                        <SelectItem value="LIMITED">Limited Authority</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">
                      {formData.iaeaType === "FULL"
                        ? "Full Authority: sell real property without court approval."
                        : "Limited: court must approve real estate sales."}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      onClick={() => updateMutation.mutate(formData)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest border-indigo-200 text-indigo-700"
                      onClick={() => { updateMutation.mutate(formData); previewMutation.mutate(); }}
                      disabled={!formData.appointedDate || previewMutation.isPending}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Preview DE-150
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bond + staleness warning */}
              <div className="p-4 bg-slate-900 text-white rounded-3xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Bond Status</span>
                  <span className={hasBond ? "text-amber-400 font-black" : "text-emerald-400 font-black"}>
                    {hasBond ? `Required — $${estate?.bondAmount?.toLocaleString()}` : "Waived"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-700 leading-relaxed">
                  ⚠️ <strong className="text-amber-400">Letters go stale.</strong> Many courts require letters issued within 6 months. If an institution returns letters as "stale," you must return to court for a reissuance. Track this in the Institution Tracker.
                </div>
              </div>
            </div>
          </div>

          {previewMutation.isSuccess && (
            <Card className="border-2 border-indigo-200 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base font-black">DE-150 Preview</CardTitle>
              </CardHeader>
              <CardContent className="h-[600px] p-4">
                <iframe
                  src={`data:application/pdf;base64,${(previewMutation.data as any)?.pdfBase64}`}
                  className="w-full h-full rounded-xl border"
                  title="Letters Preview"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Certified Copies Guide ─────────────────────── */}
        <TabsContent value="copies" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-slate-100 shadow-sm rounded-3xl bg-indigo-600 text-white col-span-1">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <Copy className="w-10 h-10 text-indigo-200 mb-3" />
                <p className="text-5xl font-black text-white tracking-tighter mb-1">{recommended}</p>
                <p className="text-indigo-200 text-[11px] font-black uppercase tracking-widest">
                  Recommended Copies
                </p>
                <p className="text-indigo-300 text-[10px] mt-2 leading-relaxed">
                  Based on your {institutions.length} institutions + 3 reserve copies
                </p>
              </CardContent>
            </Card>

            <div className="col-span-2 space-y-3">
              {[
                { icon: <Building2 className="w-4 h-4" />, title: "One copy per institution", desc: "Each bank, brokerage, and institution keeps the certified copy permanently. They are never returned to you.", color: "bg-blue-50 text-blue-600" },
                { icon: <Clock className="w-4 h-4" />, title: "Order immediately after appointment", desc: "Some courts issue letters the same day. Others mail them within 1-2 weeks. Order the maximum copies upfront to avoid return trips.", color: "bg-amber-50 text-amber-600" },
                { icon: <Printer className="w-4 h-4" />, title: "Cost: $15–$30 per certified copy", desc: "Court clerk fees vary by county. This is a reimbursable estate expense — keep all receipts.", color: "bg-emerald-50 text-emerald-600" },
                { icon: <AlertTriangle className="w-4 h-4" />, title: "Originals vs photocopies", desc: "Institutions require CERTIFIED ORIGINAL copies — a court-stamped copy with raised seal. Regular photocopies are rejected.", color: "bg-red-50 text-red-600" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className={cn("p-2 rounded-xl", item.color)}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Institution Dispatch Tracker ──────────────── */}
        <TabsContent value="tracker" className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Acknowledged", value: acknowledged, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
              { label: "In Progress", value: institutions.filter(i => i.status === "sent" || i.status === "requested").length, color: "bg-blue-50 text-blue-700 border-blue-100" },
              { label: "Stale / Issue", value: stale, color: stale > 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-slate-50 text-slate-400 border-slate-100" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-2xl border p-4 text-center", s.color)}>
                <p className="text-3xl font-black tracking-tighter">{s.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Institution list */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {institutions.length} Institutions
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg border-slate-200"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg text-slate-400"
                  onClick={reset}
                >
                  Reset
                </Button>
              </div>
            </div>

            {showAddForm && (
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-2">
                <Input
                  placeholder="Institution name (e.g. Chase Bank)"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
                <Button
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase rounded-lg px-4"
                  onClick={() => {
                    if (newInstName.trim()) {
                      addCustom(newInstName.trim(), "Bank");
                      setNewInstName("");
                      setShowAddForm(false);
                      toast.success("Institution added");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            )}

            <div className="divide-y divide-slate-50">
              {institutions.map((inst) => (
                <div
                  key={inst.id}
                  className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide flex-shrink-0 w-20 text-center", TYPE_COLORS[inst.type] || "bg-slate-100 text-slate-600")}>
                    {inst.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{inst.name}</p>
                    {inst.needsOriginal && (
                      <p className="text-[9px] text-amber-600 font-black uppercase tracking-wide">Certified Original Required</p>
                    )}
                  </div>
                  <select
                    value={inst.status}
                    onChange={(e) => updateStatus(inst.id, e.target.value as CopyStatus)}
                    className={cn(
                      "text-[9px] font-black uppercase tracking-wide rounded-lg px-2 py-1 border-none outline-none cursor-pointer",
                      STATUS_CONFIG[inst.status].color
                    )}
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <option key={val} value={val}>{cfg.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(inst.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium">
            Tracker data is saved locally on this device. Export your audit trail from the Settlement Trail page.
          </p>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
