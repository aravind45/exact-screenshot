/**
 * Heirs & Beneficiaries Management Page
 *
 * Full CRUD for heirs: add, edit, delete, invite to collaborate.
 * This page is the single source of truth for heir management,
 * accessible from the sidebar at any time after registration.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Send,
  UserPlus,
  Shield,
  Baby,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Gavel,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTerminology } from "@/hooks/use-terminology";

interface Heir {
  id: string;
  name: string;
  relationship: string;
  isAdult: boolean;
  email?: string;
  phone?: string;
  address?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Son",
  "Daughter",
  "Child",
  "Mother",
  "Father",
  "Parent",
  "Brother",
  "Sister",
  "Sibling",
  "Grandchild",
  "Grandparent",
  "Niece",
  "Nephew",
  "Aunt",
  "Uncle",
  "Cousin",
  "Friend",
  "Partner",
  "Charity",
  "Trust",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  relationship: "",
  email: "",
  phone: "",
  address: "",
  isAdult: true,
};

export default function Heirs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const estateId = searchParams.get("estateId") || undefined;

  // XLSX path outcome — determines if heir distributions are legally blocked
  const { distributionsBlocked, isHighRisk, pathLabel, authorityType } = useTerminology();

  // ── State ──
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHeir, setEditingHeir] = useState<Heir | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Heir | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Queries ──
  const { data: heirs = [], isLoading } = useQuery<Heir[]>({
    queryKey: ["heirs", estateId],
    queryFn: () => api.getHeirs(estateId),
  });

  const { data: estate } = useQuery({
    queryKey: ["estate", estateId],
    queryFn: () => api.getMyEstate(estateId),
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.createHeir(data, estateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heirs"] });
      queryClient.invalidateQueries({ queryKey: ["estate"] });
      toast({ title: "Heir Added", description: "New heir has been added to the estate." });
      resetForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to add heir." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof EMPTY_FORM> }) =>
      api.updateHeir(id, data, { estateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heirs"] });
      queryClient.invalidateQueries({ queryKey: ["estate"] });
      toast({ title: "Heir Updated", description: "Changes saved successfully." });
      resetForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update heir." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteHeir(id, { estateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heirs"] });
      queryClient.invalidateQueries({ queryKey: ["estate"] });
      toast({ title: "Heir Removed", description: "Heir has been removed from the estate." });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove heir." });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (id: string) => api.inviteHeir(id, { estateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heirs"] });
      toast({ title: "Invitation Sent", description: "The heir will receive an email to create their account." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to send invitation." });
    },
  });

  // ── Helpers ──
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowAddDialog(false);
    setEditingHeir(null);
  };

  const openEdit = (heir: Heir) => {
    setEditingHeir(heir);
    setForm({
      name: heir.name,
      relationship: heir.relationship,
      email: heir.email || "",
      phone: heir.phone || "",
      address: heir.address || "",
      isAdult: heir.isAdult,
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter the heir's name." });
      return;
    }
    if (!form.relationship.trim()) {
      toast({ variant: "destructive", title: "Relationship Required", description: "Please specify the relationship." });
      return;
    }

    if (editingHeir) {
      updateMutation.mutate({ id: editingHeir.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const minorCount = heirs.filter((h) => !h.isAdult).length;
  const withEmailCount = heirs.filter((h) => h.email).length;
  const connectedCount = heirs.filter((h) => h.userId).length;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ── Page Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Heirs & Beneficiaries
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage all persons who will receive assets from the estate
                </p>
              </div>
            </div>
            <Button
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingHeir(null);
                setShowAddDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Heir
            </Button>
          </div>

          {/* ── Stats Bar ── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total Heirs",
                value: heirs.length,
                icon: Users,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Minor Children",
                value: minorCount,
                icon: Baby,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "With Email",
                value: withEmailCount,
                icon: Mail,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Connected",
                value: connectedCount,
                icon: Shield,
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Info Banner (if no heirs) ── */}
          {!isLoading && heirs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-900 mb-1">No heirs added yet</p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Add heirs and beneficiaries who should receive assets from the estate.
                  You can add them at any time — during initial setup, or later as you
                  discover more about the estate. Each heir can optionally be invited to
                  view the estate progress.
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setEditingHeir(null);
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Your First Heir
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── HARD BLOCKER: Insolvent / Contested Estate Warning ── */}
          {distributionsBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 flex gap-4 items-start shadow-sm shadow-red-100"
            >
              <div className="p-2 bg-red-100 rounded-xl flex-shrink-0">
                {authorityType === 'INSOLVENT_ESTATE'
                  ? <AlertTriangle className="w-5 h-5 text-red-600" />
                  : <Gavel className="w-5 h-5 text-red-600" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-black text-red-900">
                    {authorityType === 'INSOLVENT_ESTATE'
                      ? "⛔ Insolvent Estate — No Distributions Permitted"
                      : "⛔ Contested Estate — Distributions Frozen by Court"}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-600 text-white rounded-lg">
                    {pathLabel}
                  </span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed mb-2">
                  {authorityType === 'INSOLVENT_ESTATE'
                    ? "Heirs may be listed and managed here, but no distributions may be made. This estate has more debts than assets — creditors must be paid in the statutory priority order before any heir receives anything. Distributing to heirs before paying creditors exposes the Administrator to personal liability."
                    : "Heirs may be listed and managed here, but all distributions are frozen pending resolution of the contested claims in court. Do not distribute any assets until a court order authorizes it."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 rounded-lg text-[10px] font-bold text-red-700">
                    <XCircle className="w-3 h-3" />
                    Listing heirs: Allowed
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 rounded-lg text-[10px] font-bold text-red-700">
                    <XCircle className="w-3 h-3" />
                    Distributions: Prohibited
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Minor Heirs Warning ── */}
          {minorCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {minorCount} minor {minorCount === 1 ? "heir" : "heirs"} — guardian may be
                  required
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  A court-appointed guardian ad litem may need to represent minor beneficiaries
                  during probate proceedings. Consult an attorney.
                </p>
              </div>
            </div>
          )}

          {/* ── Heir List ── */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {heirs.map((heir, idx) => (
                  <motion.div
                    key={heir.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="rounded-2xl border-slate-100 hover:border-indigo-200 transition-colors group">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black",
                              heir.userId
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-indigo-100 text-indigo-700"
                            )}
                          >
                            {heir.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-bold text-slate-900 truncate">
                                {heir.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-500 rounded-lg"
                              >
                                {heir.relationship}
                              </Badge>
                              {!heir.isAdult && (
                                <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold border-none rounded-lg">
                                  <Baby className="w-3 h-3 mr-1" />
                                  Minor
                                </Badge>
                              )}
                              {heir.userId && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold border-none rounded-lg">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Connected
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                              {heir.email && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Mail className="w-3.5 h-3.5" />
                                  {heir.email}
                                </span>
                              )}
                              {heir.phone && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Phone className="w-3.5 h-3.5" />
                                  {heir.phone}
                                </span>
                              )}
                              {heir.address && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {heir.address}
                                </span>
                              )}
                              {!heir.email && !heir.phone && !heir.address && (
                                <span className="text-xs text-slate-400 italic">
                                  No contact info — click edit to add
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {heir.email && !heir.userId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => inviteMutation.mutate(heir.id)}
                                disabled={inviteMutation.isPending}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Invite
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => openEdit(heir)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(heir)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* ── Legal Note ── */}
          {heirs.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>Legal note:</strong> All persons who may have an interest in the estate
                should be identified and notified. This includes beneficiaries named in the Will
                (if any) and legal heirs under your state's intestacy laws. Consult an attorney
                if you're unsure who should be listed.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          ADD / EDIT DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={showAddDialog || !!editingHeir}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingHeir ? "Edit Heir" : "Add New Heir"}
            </DialogTitle>
            <DialogDescription>
              {editingHeir
                ? "Update this heir's information."
                : "Add a person who should receive assets from the estate."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Relationship <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_OPTIONS.slice(0, 12).map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                      form.relationship === rel
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                    )}
                    onClick={() => setForm({ ...form, relationship: rel })}
                  >
                    {rel}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or type a custom relationship..."
                value={
                  RELATIONSHIP_OPTIONS.includes(form.relationship)
                    ? ""
                    : form.relationship
                }
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className="rounded-xl mt-1.5"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phone
                </Label>
                <Input
                  type="tel"
                  placeholder="555-0123"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mailing Address
              </Label>
              <Input
                placeholder="123 Main St, City, State ZIP"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Minor toggle */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Checkbox
                id="isMinor"
                checked={!form.isAdult}
                onCheckedChange={(checked) => setForm({ ...form, isAdult: !checked })}
              />
              <div>
                <Label htmlFor="isMinor" className="text-sm font-bold text-slate-700 cursor-pointer">
                  This person is a minor (under 18)
                </Label>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Minor heirs may require a court-appointed guardian during probate.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm} className="rounded-xl">
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingHeir
                  ? "Save Changes"
                  : "Add Heir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Remove Heir
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-slate-700">{deleteTarget?.name}</strong> from the
              estate? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove Heir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
