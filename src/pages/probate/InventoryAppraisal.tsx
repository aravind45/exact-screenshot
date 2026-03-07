import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Asset } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Save, Calculator, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadAutofillWithFallback } from "@/lib/formAutofill";

// Helper to determine default categories
const inferCategory = (asset: Asset): string => {
    if (asset.inventoryCategory) return asset.inventoryCategory;

    const type = asset.assetType?.toLowerCase() || "";
    const name = asset.name?.toLowerCase() || ""; // Assuming 'name' exists on Asset, or we use institution/assetType

    // Attachment 1: Real Property
    if (type.includes("real estate") || type.includes("land") || type.includes("property") || type.includes("home")) {
        return "ATTACHMENT_1";
    }
    // Attachment 2: Personal Property
    return "ATTACHMENT_2";
};

export default function InventoryAppraisal() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<Asset>>({});

    const { data: estate } = useQuery({ queryKey: ["estate"], queryFn: api.getMyEstate });
    const { data: assets } = useQuery({ queryKey: ["assets"], queryFn: () => api.getAssets() });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, updates: Partial<Asset> }) => api.updateAsset(data.id, data.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            setEditingId(null);
            toast.success("Asset updated");
        }
    });

    const handleSave = (id: string) => {
        updateMutation.mutate({ id, updates: editValues });
    };

    const handleEdit = (asset: Asset) => {
        setEditingId(asset.id);
        setEditValues({
            inventoryCategory: inferCategory(asset),
            inventoryValue: asset.inventoryValue ?? asset.value ?? 0,
            inventoryNote: asset.inventoryNote || ""
        });
    };

    const previewMutation = useMutation({
        mutationFn: () =>
            downloadAutofillWithFallback({
                formType: "DE-160",
                filename: "DE-160_Inventory_Appraisal.pdf",
                payload: estate ? { ...estate } : {},
                blankPdfUrl: "https://www.courts.ca.gov/documents/de160.pdf",
            }),
        onSuccess: (result) => {
            if (result.mode === "blank") {
                toast.info("Auto-fill unavailable. Opened blank DE-160 form.");
                return;
            }
            toast.success("DE-160 downloaded successfully");
        },
        onError: (err: any) => toast.error(err?.message || "Could not generate DE-160"),
    });

    if (!assets) return <div className="p-8">Loading assets...</div>;

    // Grouping
    const realProperty = assets.filter(a => inferCategory(a) === "ATTACHMENT_1");
    const personalProperty = assets.filter(a => inferCategory(a) === "ATTACHMENT_2");

    const totalReal = realProperty.reduce((sum, a) => sum + (a.inventoryValue ?? a.value ?? 0), 0);
    const totalPersonal = personalProperty.reduce((sum, a) => sum + (a.inventoryValue ?? a.value ?? 0), 0);
    const grandTotal = totalReal + totalPersonal;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Inventory & Appraisal (DE-160)</h1>
                            <p className="text-slate-500 mt-1">
                                Categorize and value every asset for the court.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => window.open("https://www.courts.ca.gov/documents/de160.pdf", "_blank")}>
                                <FileText className="w-4 h-4 mr-2" />
                                Instructions
                            </Button>
                            <Button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                                <Eye className="w-4 h-4 mr-2" />
                                {previewMutation.isPending ? "Generating..." : "Auto-Fill DE-160"}
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Real Property (Att. 1)</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalReal.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">{realProperty.length} items</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Property (Att. 2)</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalPersonal.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">{personalProperty.length} items</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 text-white">
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300">Total Estate Value</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${grandTotal.toLocaleString()}</div>
                                <p className="text-xs text-slate-400">Date of Death Value</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Inventory Lists */}
                    <div className="space-y-8">
                        {/* Attachment 1 */}
                        <InventorySection
                            title="Attachment 1: Real Property"
                            description="Real estate, land, and homes."
                            assets={realProperty}
                            editingId={editingId}
                            editValues={editValues}
                            onEdit={handleEdit}
                            onCancel={() => setEditingId(null)}
                            onSave={handleSave}
                            setEditValues={setEditValues}
                        />

                        {/* Attachment 2 */}
                        <InventorySection
                            title="Attachment 2: Personal Property"
                            description="Cash, bank accounts, vehicles, stocks, household goods."
                            assets={personalProperty}
                            editingId={editingId}
                            editValues={editValues}
                            onEdit={handleEdit}
                            onCancel={() => setEditingId(null)}
                            onSave={handleSave}
                            setEditValues={setEditValues}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

function InventorySection({ title, description, assets, editingId, editValues, onEdit, onCancel, onSave, setEditValues }: any) {
    if (assets.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {assets.map((asset: any) => (
                        <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            {editingId === asset.id ? (
                                <div className="flex-1 grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-4 space-y-1">
                                        <label className="text-xs font-medium">Description</label>
                                        <div className="text-sm font-semibold">{asset.institution} - {asset.assetType}</div>
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <label className="text-xs font-medium">Category</label>
                                        <Select
                                            value={editValues.inventoryCategory}
                                            onValueChange={(v) => setEditValues({ ...editValues, inventoryCategory: v })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ATTACHMENT_1">Attachment 1 (Real)</SelectItem>
                                                <SelectItem value="ATTACHMENT_2">Attachment 2 (Personal)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <label className="text-xs font-medium">Date of Death Value</label>
                                        <Input
                                            type="number"
                                            value={editValues.inventoryValue}
                                            onChange={(e) => setEditValues({ ...editValues, inventoryValue: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-2 flex gap-2">
                                        <Button size="sm" onClick={() => onSave(asset.id)}><Save className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{asset.institution || "Unnamed Asset"}</div>
                                        <div className="text-xs text-muted-foreground">{asset.assetType}</div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="font-bold text-sm">${(asset.inventoryValue ?? asset.value ?? 0).toLocaleString()}</div>
                                            {asset.inventoryValue !== undefined && <div className="text-[10px] text-green-600 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</div>}
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => onEdit(asset)}>Verify</Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

