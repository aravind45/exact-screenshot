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
  Bitcoin,
  Cloud,
  Mail,
  Smartphone,
  Globe,
  Wallet,
  KeyRound,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";
import { RUFADAA } from "@/lib/jurisdictionData";

// ── Types ──────────────────────────────────────────────────────────────────
interface DigitalAsset {
  id: string;
  category: string;
  platform: string;
  identifier: string; // username / wallet hint / account email
  valueEstimate: string;
  accessMethod: string;
  legacyToolConfigured: string; // yes | no | unknown
  notes: string;
}

const CATEGORIES = [
  { value: "financial", label: "Financial accounts", icon: Wallet, examples: "Online banking, PayPal, Venmo, brokerage logins" },
  { value: "crypto", label: "Crypto & wallets", icon: Bitcoin, examples: "Exchange accounts, self-custody wallets, seed phrases" },
  { value: "email", label: "Email & communications", icon: Mail, examples: "Gmail, Outlook — often the master key to everything else" },
  { value: "cloud", label: "Cloud storage & files", icon: Cloud, examples: "Google Drive, iCloud, Dropbox, photo libraries" },
  { value: "social", label: "Social media", icon: Smartphone, examples: "Facebook, Instagram, X, LinkedIn — memorialization options" },
  { value: "business", label: "Business & revenue", icon: Globe, examples: "Domains, ad accounts, storefronts, subscriptions" },
  { value: "devices", label: "Devices & access", icon: KeyRound, examples: "Phone passcodes, password managers, 2FA devices" },
];

const ACCESS_METHODS = [
  "Password manager (shared/emergency access)",
  "Credentials written in estate documents",
  "Platform legacy tool (Google/Apple/Meta)",
  "Recovery via email/phone",
  "Court order / RUFADAA request",
  "Unknown — needs discovery",
];

const STORAGE_KEY = "ee_digital_asset_inventory";

function loadInventory(): DigitalAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const emptyAsset = (): DigitalAsset => ({
  id: crypto.randomUUID(),
  category: "financial",
  platform: "",
  identifier: "",
  valueEstimate: "",
  accessMethod: "",
  legacyToolConfigured: "unknown",
  notes: "",
});

export default function DigitalAssets() {
  const [assets, setAssets] = useState<DigitalAsset[]>(loadInventory);
  const [draft, setDraft] = useState<DigitalAsset>(emptyAsset);

  const persist = (next: DigitalAsset[]) => {
    setAssets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addAsset = () => {
    if (!draft.platform.trim()) return;
    persist([...assets, draft]);
    setDraft(emptyAsset());
  };

  const removeAsset = (id: string) => persist(assets.filter((a) => a.id !== id));

  const exportCsv = () => {
    const header = "Category,Platform,Identifier,Est. Value,Access Method,Legacy Tool,Notes\n";
    const rows = assets
      .map((a) =>
        [a.category, a.platform, a.identifier, a.valueEstimate, a.accessMethod, a.legacyToolConfigured, a.notes]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "digital-asset-inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const noAccess = assets.filter((a) => a.accessMethod === "Unknown — needs discovery" || !a.accessMethod).length;
    const noLegacy = assets.filter((a) => a.legacyToolConfigured !== "yes").length;
    return { total: assets.length, noAccess, noLegacy };
  }, [assets]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Digital Asset Inventory — RUFADAA Planning | ExpectedEstate"
        description="Catalog digital assets — crypto, email, cloud, social — with RUFADAA-compliant access guidance so executors can actually recover them."
      />
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">RUFADAA · {RUFADAA.statesEnacted} states + D.C.</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Digital Asset Inventory</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unorganized digital assets routinely add $5,000–$25,000+ in legal discovery costs.
            Catalog them now so your executor isn't locked out later.
          </p>
        </div>

        {/* RUFADAA explainer */}
        <Card className="mb-8 border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> How fiduciaries get access: the RUFADAA three-tier priority
            </CardTitle>
            <CardDescription>{RUFADAA.citation} — enacted in {RUFADAA.statesEnacted} states + D.C.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            {RUFADAA.tiers.map((t) => {
              const [tier, rest] = t.split(") ");
              return (
                <div key={t} className="rounded-lg bg-background border p-3">
                  <p className="font-semibold text-blue-700 mb-1">Tier {tier})</p>
                  <p className="text-muted-foreground">{rest}</p>
                </div>
              );
            })}
            <div className="md:col-span-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{RUFADAA.contentNote}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Assets cataloged</p>
            </CardContent></Card>
            <Card><CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold ${stats.noAccess > 0 ? "text-amber-600" : "text-emerald-600"}`}>{stats.noAccess}</p>
              <p className="text-xs text-muted-foreground">Need access discovery</p>
            </CardContent></Card>
            <Card><CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold ${stats.noLegacy > 0 ? "text-amber-600" : "text-emerald-600"}`}>{stats.noLegacy}</p>
              <p className="text-xs text-muted-foreground">Legacy tools not configured</p>
            </CardContent></Card>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Add form */}
          <Card className="lg:col-span-2 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5" /> Add a digital asset
              </CardTitle>
              <CardDescription>Saved in this browser only — export to CSV to share with your attorney or store securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === draft.category)?.examples}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Platform / institution *</Label>
                <Input
                  value={draft.platform}
                  onChange={(e) => setDraft({ ...draft, platform: e.target.value })}
                  placeholder="e.g., Coinbase, Gmail, iCloud"
                />
              </div>

              <div className="space-y-2">
                <Label>Identifier (username / account hint)</Label>
                <Input
                  value={draft.identifier}
                  onChange={(e) => setDraft({ ...draft, identifier: e.target.value })}
                  placeholder="e.g., john@gmail.com — never store passwords here"
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated value (optional)</Label>
                <Input
                  value={draft.valueEstimate}
                  onChange={(e) => setDraft({ ...draft, valueEstimate: e.target.value })}
                  placeholder="e.g., $12,000 or Unknown"
                />
              </div>

              <div className="space-y-2">
                <Label>How would your executor get in?</Label>
                <Select value={draft.accessMethod} onValueChange={(v) => setDraft({ ...draft, accessMethod: v })}>
                  <SelectTrigger><SelectValue placeholder="Select access method" /></SelectTrigger>
                  <SelectContent>
                    {ACCESS_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Platform legacy tool configured?</Label>
                <Select value={draft.legacyToolConfigured} onValueChange={(v) => setDraft({ ...draft, legacyToolConfigured: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes (e.g., Google Inactive Account Manager)</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="e.g., seed phrase stored in safe deposit box"
                />
              </div>

              <Button onClick={addAsset} disabled={!draft.platform.trim()} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Add to inventory
              </Button>

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Never store actual passwords or seed phrases in this inventory. Record <em>where</em> they're secured (password manager, safe, attorney), not the secrets themselves.</p>
              </div>
            </CardContent>
          </Card>

          {/* Inventory list */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your inventory ({assets.length})</h2>
              {assets.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              )}
            </div>

            {assets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No digital assets yet</p>
                  <p className="text-sm mt-1">Start with email — it's the recovery key for almost every other account.</p>
                </CardContent>
              </Card>
            ) : (
              assets.map((a) => {
                const cat = CATEGORIES.find((c) => c.value === a.category);
                const Icon = cat?.icon ?? Globe;
                return (
                  <Card key={a.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{a.platform}</p>
                            <p className="text-sm text-muted-foreground">
                              {cat?.label}{a.identifier ? ` · ${a.identifier}` : ""}{a.valueEstimate ? ` · ${a.valueEstimate}` : ""}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {a.accessMethod && (
                                <Badge variant={a.accessMethod.includes("Unknown") ? "destructive" : "secondary"} className="text-xs">
                                  {a.accessMethod}
                                </Badge>
                              )}
                              <Badge variant={a.legacyToolConfigured === "yes" ? "default" : "outline"} className="text-xs">
                                Legacy tool: {a.legacyToolConfigured}
                              </Badge>
                            </div>
                            {a.notes && <p className="text-xs text-muted-foreground mt-2">{a.notes}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeAsset(a.id)} aria-label="Remove">
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            <Separator className="my-6" />

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-5">
                <div>
                  <p className="font-medium">Settling an estate with digital assets?</p>
                  <p className="text-sm text-muted-foreground">
                    ExpectedEstate tracks RUFADAA-compliant recovery steps as part of your settlement roadmap.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/auth?mode=signup">Get started <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              This inventory is stored only in your browser (localStorage) — it never leaves this device and won't
              sync across devices. Export the CSV and store it with your estate documents. Not legal advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
