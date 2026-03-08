/**
 * SSOT Probate Engine — Admin Console
 * Full CRUD authoring, gap detection dashboard, publishing controls, audit logs
 *
 * All column references match prisma/ssot-migration.sql exactly.
 * Gap detection handles { summary, gaps } response from gapDetectionService.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import {
  Globe, Map, FileText, AlertTriangle, History, BarChart3,
  ChevronRight, Plus, Check, Eye, Loader2,
  Scale, DollarSign, BookOpen, Database
} from "lucide-react";

/* ─── Overview Tab ─────────────────────────────────────────────────────────── */
function OverviewTab() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["ssot-stats"], queryFn: api.ssot.getStats });

  if (isLoading) return <div className="flex items-center gap-2 p-8"><Loader2 className="animate-spin h-5 w-5" /> Loading stats...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jurisdictions", value: stats?.jurisdictions ?? 0, icon: Globe },
          { label: "Probate Types", value: stats?.probateTypes ?? 0, icon: Scale },
          { label: "Roadmaps", value: stats?.roadmaps ?? 0, icon: Map },
          { label: "Total Steps", value: stats?.steps ?? 0, icon: ChevronRight },
          { label: "Actions", value: stats?.actions ?? 0, icon: Check },
          { label: "Legal Forms", value: stats?.forms ?? 0, icon: FileText },
          { label: "Tax Rules", value: stats?.taxObligations ?? 0, icon: DollarSign },
          { label: "Published Roadmaps", value: stats?.publishedRoadmaps ?? 0, icon: BookOpen },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <s.icon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Jurisdictions Tab ────────────────────────────────────────────────────── */
function JurisdictionsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: jurisdictions = [], isLoading } = useQuery({ queryKey: ["ssot-jurisdictions"], queryFn: api.ssot.getJurisdictions });
  const publishMut = useMutation({
    mutationFn: (id: string) => api.ssot.publishJurisdiction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ssot-jurisdictions"] }); toast({ title: "Published!" }); },
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ state_code: "", state_name: "", is_community_property: false, is_upc_state: false });
  const createMut = useMutation({
    mutationFn: (d: any) => api.ssot.createJurisdiction(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ssot-jurisdictions"] }); setShowAdd(false); toast({ title: "Jurisdiction created" }); },
  });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Jurisdictions ({(jurisdictions as any[]).length}/50)</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-1" /> Add State</Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="State Code (e.g. CA)" value={form.state_code} onChange={(e) => setForm({ ...form, state_code: e.target.value.toUpperCase().slice(0, 2) })} />
              <Input placeholder="State Name" value={form.state_name} onChange={(e) => setForm({ ...form, state_name: e.target.value })} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_community_property} onChange={(e) => setForm({ ...form, is_community_property: e.target.checked })} /> Community Property</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_upc_state} onChange={(e) => setForm({ ...form, is_upc_state: e.target.checked })} /> UPC State</label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMut.mutate(form)} disabled={!form.state_code || !form.state_name}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Properties</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(jurisdictions as any[]).map((j: any) => (
              <tr key={j.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{j.state_code} — {j.state_name}</td>
                <td className="p-3 space-x-1">
                  {j.is_community_property && <Badge variant="outline" className="text-xs">Community Prop</Badge>}
                  {j.is_upc_state && <Badge variant="outline" className="text-xs">UPC</Badge>}
                  {j.has_estate_tax && <Badge variant="outline" className="text-xs">Estate Tax</Badge>}
                  {j.has_inheritance_tax && <Badge variant="outline" className="text-xs">Inheritance Tax</Badge>}
                </td>
                <td className="p-3">
                  <Badge variant={j.status === "PUBLISHED" ? "default" : "secondary"}>{j.status}</Badge>
                </td>
                <td className="p-3 text-right space-x-1">
                  {j.status !== "PUBLISHED" && (
                    <Button size="sm" variant="outline" onClick={() => publishMut.mutate(j.id)}><Eye className="h-3 w-3 mr-1" /> Publish</Button>
                  )}
                </td>
              </tr>
            ))}
            {(jurisdictions as any[]).length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No jurisdictions yet. Add your first state above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Roadmaps Tab ─────────────────────────────────────────────────────────── */
function RoadmapsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: roadmaps = [], isLoading } = useQuery({ queryKey: ["ssot-roadmaps"], queryFn: () => api.ssot.getRoadmaps() });
  const { data: jurisdictions = [] } = useQuery({ queryKey: ["ssot-jurisdictions"], queryFn: api.ssot.getJurisdictions });
  const [selectedRm, setSelectedRm] = useState<string | null>(null);
  const { data: fullRoadmap } = useQuery({
    queryKey: ["ssot-roadmap-full", selectedRm],
    queryFn: () => api.ssot.getRoadmapFull(selectedRm!),
    enabled: !!selectedRm,
  });
  const publishMut = useMutation({
    mutationFn: (id: string) => api.ssot.publishRoadmap(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ssot-roadmaps"] }); toast({ title: "Roadmap published!" }); },
  });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  const jMap = Object.fromEntries((jurisdictions as any[]).map((j: any) => [j.id, j.state_code]));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Roadmaps ({(roadmaps as any[]).length})</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(roadmaps as any[]).map((rm: any) => (
          <Card key={rm.id} className={`cursor-pointer transition-all ${selectedRm === rm.id ? "ring-2 ring-primary" : "hover:shadow-md"}`} onClick={() => setSelectedRm(rm.id)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">{rm.name}</CardTitle>
                  <CardDescription className="text-xs">{jMap[rm.jurisdiction_id] || "?"} • ~{rm.estimated_duration_months} months</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Badge variant={rm.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">{rm.status}</Badge>
                  {rm.status !== "PUBLISHED" && (
                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={(e) => { e.stopPropagation(); publishMut.mutate(rm.id); }}>Publish</Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedRm && fullRoadmap && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{fullRoadmap.name} — Full Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(fullRoadmap.phases || []).map((phase: any, pi: number) => (
              <div key={phase.id} className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{pi + 1}</Badge>
                  <span className="font-medium">{phase.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{phase.estimated_days}d • {(phase.steps || []).length} steps</span>
                </div>
                {(phase.steps || []).map((step: any, si: number) => (
                  <div key={step.id} className="ml-6 py-1 border-l-2 pl-3 text-sm">
                    <span className="font-medium">{si + 1}. {step.title}</span>
                    {!step.is_optional && <Badge variant="destructive" className="ml-2 text-[10px] h-4">Required</Badge>}
                    <span className="text-muted-foreground ml-2 text-xs">~{step.estimated_days}d</span>
                    {(step.actions || []).length > 0 && (
                      <div className="ml-4 mt-1 text-xs text-muted-foreground">
                        {(step.actions || []).map((a: any) => (
                          <div key={a.id} className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> {a.title} <Badge variant="outline" className="text-[9px] h-3 ml-1">{a.action_type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Gap Detection Tab ────────────────────────────────────────────────────── */
function GapDetectionTab() {
  const { data: gapReport, isLoading } = useQuery({ queryKey: ["ssot-gaps"], queryFn: api.ssot.getGaps });
  const { data: completeness } = useQuery({ queryKey: ["ssot-completeness"], queryFn: api.ssot.getStateCompleteness });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  // gapReport is { summary: { total, critical, warning, info }, gaps: GapItem[] }
  const allGaps: any[] = gapReport?.gaps || [];

  // Group gaps by category
  const gapsByCategory: Record<string, any[]> = {};
  for (const gap of allGaps) {
    const cat = gap.category || "Unknown";
    if (!gapsByCategory[cat]) gapsByCategory[cat] = [];
    gapsByCategory[cat].push(gap);
  }

  const severityIcon = (severity: string) => {
    if (severity === "CRITICAL") return "🔴";
    if (severity === "WARNING") return "🟠";
    return "🔵";
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> Gap Detection Dashboard</h3>

      {/* Summary bar */}
      {gapReport?.summary && (
        <div className="flex gap-4 text-sm">
          <Badge variant="destructive">{gapReport.summary.critical} Critical</Badge>
          <Badge variant="secondary" className="border-orange-400 text-orange-600">{gapReport.summary.warning} Warning</Badge>
          <Badge variant="outline">{gapReport.summary.info} Info</Badge>
          <span className="text-muted-foreground ml-auto">{gapReport.summary.total} total gaps</span>
        </div>
      )}

      {/* Gap categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(gapsByCategory).map(([category, items]) => {
          const hasCritical = items.some((g: any) => g.severity === "CRITICAL");
          const hasWarning = items.some((g: any) => g.severity === "WARNING");
          return (
            <Card key={category} className={hasCritical ? "border-red-300" : hasWarning ? "border-orange-300" : "border-blue-300"}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`h-5 w-5 ${hasCritical ? "text-red-500" : hasWarning ? "text-orange-500" : "text-blue-500"}`} />
                  <span className="font-medium text-sm">{category}</span>
                  <Badge variant={hasCritical ? "destructive" : "secondary"} className="ml-auto">{items.length}</Badge>
                </div>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                  {items.slice(0, 10).map((item: any, i: number) => (
                    <div key={i} className="truncate">{severityIcon(item.severity)} {item.message}</div>
                  ))}
                  {items.length > 10 && <div className="text-orange-600 font-medium">...and {items.length - 10} more</div>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {Object.keys(gapsByCategory).length === 0 && (
          <Card className="border-green-300 col-span-full">
            <CardContent className="pt-4 pb-3 text-center">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">No gaps found — all data is complete!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* State Completeness */}
      {completeness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              State Completeness — {completeness.configuredCount}/{completeness.totalStates} states ({completeness.completionPct}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${completeness.completionPct}%` }} />
            </div>

            {/* Configured states */}
            {(completeness.configured || []).length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Configured States</p>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
                  {(completeness.configured || []).map((s: any) => (
                    <div key={s.state_code} className="border rounded p-2 text-center">
                      <p className="font-bold text-sm">{s.state_code}</p>
                      <Badge variant={s.status === "PUBLISHED" ? "default" : "secondary"} className="text-[9px] mt-1">{s.status}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{s.roadmap_count} roadmaps • {s.form_count} forms</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing states */}
            {(completeness.missing || []).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-orange-600">Missing States ({completeness.missing.length})</p>
                <div className="flex flex-wrap gap-1">
                  {completeness.missing.map((sc: string) => (
                    <Badge key={sc} variant="outline" className="text-xs text-orange-600 border-orange-300">{sc}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Forms Tab ────────────────────────────────────────────────────────────── */
function FormsTab() {
  const { data: forms = [], isLoading } = useQuery({ queryKey: ["ssot-forms"], queryFn: () => api.ssot.getForms() });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Legal Forms ({(forms as any[]).length})</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Form #</th>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Fee</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(forms as any[]).map((f: any) => (
              <tr key={f.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{f.form_number}</td>
                <td className="p-3">{f.title}</td>
                <td className="p-3"><Badge variant="outline" className="text-xs">{f.category}</Badge></td>
                <td className="p-3">{f.filing_fee_amount && Number(f.filing_fee_amount) > 0 ? `$${Number(f.filing_fee_amount).toFixed(2)}` : "Free"}</td>
                <td className="p-3"><Badge variant={f.status === "PUBLISHED" ? "default" : "secondary"}>{f.status}</Badge></td>
              </tr>
            ))}
            {(forms as any[]).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No forms found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Audit Log Tab ────────────────────────────────────────────────────────── */
function AuditLogTab() {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["ssot-logs"], queryFn: () => api.ssot.getChangeLogs({ limit: 100 }) });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2"><History className="h-5 w-5" /> Change Audit Log</h3>
      <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Entity</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(logs as any[]).map((l: any) => (
              <tr key={l.id} className="border-t hover:bg-muted/30">
                <td className="p-3 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-3"><Badge variant="outline" className="text-xs">{l.entity_type}</Badge></td>
                <td className="p-3">
                  <Badge variant={l.action === "DELETE" ? "destructive" : l.action === "CREATE" ? "default" : "secondary"} className="text-xs">{l.action}</Badge>
                </td>
                <td className="p-3 text-xs">{l.changed_by?.slice(0, 8) || "system"}</td>
                <td className="p-3 text-xs text-muted-foreground truncate max-w-[200px]">{l.change_reason || "—"}</td>
              </tr>
            ))}
            {(logs as any[]).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No audit logs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Rules Tab (Accounting, Tax, Distribution) ────────────────────────────── */
function RulesTab() {
  const { data: accounting = [] } = useQuery({ queryKey: ["ssot-accounting"], queryFn: () => api.ssot.getAccountingRules() });
  const { data: tax = [] } = useQuery({ queryKey: ["ssot-tax"], queryFn: () => api.ssot.getTaxObligations() });
  const { data: dist = [] } = useQuery({ queryKey: ["ssot-dist"], queryFn: () => api.ssot.getDistributionRules() });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-3">Accounting Rules ({(accounting as any[]).length})</h3>
        <div className="grid gap-2">
          {(accounting as any[]).map((r: any) => (
            <Card key={r.id}>
              <CardContent className="pt-3 pb-2 flex items-start gap-3">
                <DollarSign className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{r.title} <Badge variant="outline" className="text-[10px] ml-1">{r.rule_type}</Badge></p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                  {r.deadline_rule && <p className="text-xs text-muted-foreground mt-1">⏰ {r.deadline_rule}</p>}
                </div>
                <code className="text-[10px] bg-muted p-1 rounded">{r.code}</code>
              </CardContent>
            </Card>
          ))}
          {(accounting as any[]).length === 0 && <p className="text-sm text-muted-foreground">No accounting rules configured</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-3">Tax Obligations ({(tax as any[]).length})</h3>
        <div className="grid gap-2">
          {(tax as any[]).map((t: any) => (
            <Card key={t.id}>
              <CardContent className="pt-3 pb-2 flex items-start gap-3">
                <Scale className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.title} {t.is_federal && <Badge className="text-[10px] ml-1">Federal</Badge>}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Form: {t.filing_form_number || "—"} • Due: {t.filing_deadline_rule || "—"}</p>
                </div>
                <code className="text-[10px] bg-muted p-1 rounded">{t.code}</code>
              </CardContent>
            </Card>
          ))}
          {(tax as any[]).length === 0 && <p className="text-sm text-muted-foreground">No tax obligations configured</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-3">Distribution Rules ({(dist as any[]).length})</h3>
        <div className="grid gap-2">
          {(dist as any[]).map((d: any) => (
            <Card key={d.id}>
              <CardContent className="pt-3 pb-2 flex items-start gap-3">
                <BookOpen className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{d.title} <Badge variant="outline" className="text-[10px] ml-1">{d.rule_type}</Badge></p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                  {d.share_formula && <p className="text-xs text-muted-foreground mt-1 italic">Formula: {d.share_formula}</p>}
                </div>
                <code className="text-[10px] bg-muted p-1 rounded">{d.code}</code>
              </CardContent>
            </Card>
          ))}
          {(dist as any[]).length === 0 && <p className="text-sm text-muted-foreground">No distribution rules configured</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function SSOTProbateEngine() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" /> SSOT Probate Engine
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Single Source of Truth for 50-state probate rules, roadmaps, forms, and compliance
            </p>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
              <TabsTrigger value="jurisdictions"><Globe className="h-4 w-4 mr-1" /> Jurisdictions</TabsTrigger>
              <TabsTrigger value="roadmaps"><Map className="h-4 w-4 mr-1" /> Roadmaps</TabsTrigger>
              <TabsTrigger value="forms"><FileText className="h-4 w-4 mr-1" /> Forms</TabsTrigger>
              <TabsTrigger value="rules"><Scale className="h-4 w-4 mr-1" /> Rules</TabsTrigger>
              <TabsTrigger value="gaps"><AlertTriangle className="h-4 w-4 mr-1" /> Gap Detection</TabsTrigger>
              <TabsTrigger value="audit"><History className="h-4 w-4 mr-1" /> Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="jurisdictions"><JurisdictionsTab /></TabsContent>
            <TabsContent value="roadmaps"><RoadmapsTab /></TabsContent>
            <TabsContent value="forms"><FormsTab /></TabsContent>
            <TabsContent value="rules"><RulesTab /></TabsContent>
            <TabsContent value="gaps"><GapDetectionTab /></TabsContent>
            <TabsContent value="audit"><AuditLogTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
