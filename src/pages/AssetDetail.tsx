import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, AssetStatus } from "@/components/StatusBadge";
import { PriorityBadge, Priority } from "@/components/PriorityBadge";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge, AssetCategory, getCategoryIcon } from "@/components/CategoryBadge";
import {
  ArrowLeft,
  Phone,
  Mail,
  Printer,
  Plus,
  Clock,
  MessageSquare,
  FileText,
  ExternalLink,
  Landmark,
  Pencil,
  Trash2,
  Save,
  X,
  Upload,
  File,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  CheckSquare,
  LayoutGrid,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { TRACK_STAGES, SettlementTrack } from "@/config/settlementStages";
import { calculateAuthorityRecommendation, getInstitutionAuthorityRequirement } from "@/lib/authorityEngine";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CommunicationLog } from "@/components/communications/CommunicationLog";
import { CommunicationLogDialog, CommunicationData } from "@/components/CommunicationLogDialog";
import { fidelityWorkflow } from "@/config/workflows/fidelity";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";

// Helper to normalize status/priority from DB
const normalize = (str: string | null) => str?.toLowerCase() || '';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

const methodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  email: Mail,
  fax: Printer,
  mail: FileText,
  portal: ExternalLink,
};

function EnrichDataButton({ assetId, onEnrichComplete }: { assetId: string, onEnrichComplete: () => void }) {
  const { toast } = useToast();
  const [enriching, setEnriching] = useState(false);

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const result = await api.enrichAsset(assetId);
      if (result && result.extracted) {
        toast({
          title: "Enrichment Successful",
          description: `Found info from ${result.sourceUrl}`
        });
        onEnrichComplete();
      } else {
        toast({
          title: "Enrichment Completed",
          description: "No specific contact info found.",
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "Enrichment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setEnriching(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnrich}
      disabled={enriching}
      className="w-full gap-2 border-violet-500/20 text-violet-700 bg-violet-500/10 hover:bg-violet-500/20"
    >
      {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
      {enriching ? "Searching Web..." : "Auto-Find Contact Info"}
    </Button>
  )
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [showCommDialog, setShowCommDialog] = useState(false);
  const [currentStepId, setCurrentStepId] = useState("initial_contact");
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => api.getAsset(id!),
    enabled: !!id
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => api.getAssetDocuments(id!),
    enabled: !!id
  });

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

  useEffect(() => {
    if (asset?.workflowState) {
      const state = asset.workflowState as any;
      if (state.currentStepId) setCurrentStepId(state.currentStepId);
      if (state.completedStepIds) setCompletedStepIds(state.completedStepIds);
    }
  }, [asset]);

  // Form State
  const [formData, setFormData] = useState<any>({});

  // Sync form data when asset loads
  useEffect(() => {
    if (asset) {
      setFormData({
        institution: asset.institution || "",
        assetType: asset.assetType || "",
        category: asset.category || "",
        value: asset.value || 0,
        priority: asset.priority || "medium",
        status: asset.status || "discovered",
        accountNumber: asset.accountNumber || "",
        institutionPhone: asset.institutionPhone || "",
        institutionEmail: asset.institutionEmail || "",
        institutionFax: asset.institutionFax || "",
        institutionAddress: asset.institutionAddress || "",
        institutionUrl: asset.institutionUrl || "",
        notes: asset.notes || ""
      });
    }
  }, [asset]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => api.updateAsset(id!, updates),
    onSuccess: () => {
      toast({ title: "Asset Updated", description: "Changes saved successfully." });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      setIsEditing(false);
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteAsset(id!),
    onSuccess: () => {
      toast({ title: "Asset Deleted", description: "Asset removed successfully." });
      navigate("/dashboard");
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: () => api.uploadAssetDocument(id!, uploadFile!, uploadType),
    onSuccess: () => {
      toast({ title: "Document Uploaded", description: "File attached to asset." });
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      setUploadFile(null);
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    }
  });

  const createCommMutation = useMutation({
    mutationFn: (data: CommunicationData) => api.createCommunication({ ...data, assetId: id! } as any),
    onSuccess: () => {
      toast({ title: "Communication Logged", description: "Successfully logged communication." });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      setShowCommDialog(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to Log", description: err.message });
    }
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: (state: any) => api.updateAsset(id!, { workflowState: state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
    }
  });

  const handleStepComplete = (stepId: string) => {
    const newCompleted = [...completedStepIds];
    if (!newCompleted.includes(stepId)) {
      newCompleted.push(stepId);
      setCompletedStepIds(newCompleted);

      // Auto-advance to next step if possible
      const currentIndex = fidelityWorkflow.steps.findIndex(s => s.id === stepId);
      const nextStep = fidelityWorkflow.steps[currentIndex + 1];
      const nextId = nextStep ? nextStep.id : stepId;

      if (nextStep) setCurrentStepId(nextId);

      updateWorkflowMutation.mutate({
        currentStepId: nextId,
        completedStepIds: newCompleted,
        lastUpdated: new Date().toISOString()
      });
    }
  };

  const handleStepSelect = (stepId: string) => {
    setCurrentStepId(stepId);
    updateWorkflowMutation.mutate({
      currentStepId: stepId,
      completedStepIds,
      lastUpdated: new Date().toISOString()
    });
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this asset? This cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleUpload = () => {
    if (!uploadFile) return;
    uploadMutation.mutate();
  };

  const handleGenerateLetter = async () => {
    try {
      const blob = await api.generateLetter(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Settlement_Notice_${uiAsset.institution}.pdf`;
      a.click();
      toast({ title: "Letter Generated", description: "Your settlement notice is ready to send." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "PDF Failed", description: e.message });
    }
  };

  useEffect(() => {
    if (asset && normalize(asset.status) === 'discovered') {
      setActiveTab("workflow");
    }
  }, [asset]);

  if (isLoading) return <div className="p-8">Loading asset details...</div>;
  if (error || !asset) return <div className="p-8 text-red-500">Error loading asset: {(error as Error)?.message || "Not found"}</div>;

  // Normalize data for UI
  const uiAsset = {
    ...asset,
    type: normalize(asset.assetType),
    category: normalize(asset.category) as AssetCategory,
    status: normalize(asset.status) as AssetStatus,
    priority: normalize(asset.priority) as Priority,
    accountNumber: asset.accountNumber || 'N/A',
    institutionPhone: asset.institutionPhone || 'N/A',
    institutionEmail: asset.institutionEmail || 'N/A',
    institutionFax: asset.institutionFax || 'N/A',
    daysSinceContact: 0,
    communications: asset.communications || []
  };

  const CategoryIcon = getCategoryIcon(uiAsset.category);

  // Logic for Required Documents
  const getRequiredDocs = () => {
    if (uiAsset.category === 'financial') return ['Death Certificate', 'Claim Form'];
    if (uiAsset.category === 'property') return ['Deed', 'Appraisal'];
    if (uiAsset.category === 'insurance') return ['Death Certificate', 'Policy Document', 'Claim Form'];
    return ['Death Certificate'];
  };

  const requiredDocs = getRequiredDocs();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Asset
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="section-container py-8 space-y-6">
        {/* RECOMMENDED NEXT STEP HERO */}
        {!isEditing && uiAsset.status === 'discovered' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/5"
          >
            <div className="flex items-center gap-5 text-left">
              <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/40">
                <ArrowRight className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recommended Next Step</h2>
                <p className="text-slate-600 font-medium">Formally notify <strong>{uiAsset.institution}</strong> of the death to secure the account.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => setActiveTab("workflow")}
                size="lg"
                className="flex-1 md:flex-none h-14 px-8 font-bold bg-slate-900 hover:bg-slate-800"
              >
                Start Legal Process
              </Button>
            </div>
          </motion.div>
        )}

        {/* Asset Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-elevated p-6"
        >
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Institution Name</label>
                  <Input
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Value</label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Number</label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discovered">Discovered</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="font-semibold text-sm">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={formData.institutionPhone}
                      onChange={(e) => setFormData({ ...formData, institutionPhone: e.target.value })}
                      placeholder="e.g. 1-800-..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={formData.institutionEmail}
                      onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
                      placeholder="contact@bank.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fax</label>
                    <Input
                      value={formData.institutionFax}
                      onChange={(e) => setFormData({ ...formData, institutionFax: e.target.value })}
                      placeholder="Fax number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={formData.institutionAddress}
                      onChange={(e) => setFormData({ ...formData, institutionAddress: e.target.value })}
                      placeholder="Mailing Address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Source URL</label>
                    <Input
                      value={formData.institutionUrl}
                      onChange={(e) => setFormData({ ...formData, institutionUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  'p-4 rounded-xl shrink-0',
                  uiAsset.category === 'retirement' && 'bg-violet-500/10 text-violet-600',
                  uiAsset.category === 'financial' && 'bg-primary/10 text-primary',
                  uiAsset.category === 'insurance' && 'bg-success/10 text-success',
                  uiAsset.category === 'employer' && 'bg-warning/10 text-warning',
                  uiAsset.category === 'property' && 'bg-orange-500/10 text-orange-600',
                )}>
                  <CategoryIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {uiAsset.institution}
                  </h1>
                  <p className="text-muted-foreground capitalize mb-3">
                    {uiAsset.type.replace(/_/g, ' ')} • Account {uiAsset.accountNumber}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={uiAsset.status} />
                    <PriorityBadge priority={uiAsset.priority} />
                    <CategoryBadge category={uiAsset.category} />
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(uiAsset.value)}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs for Details vs Guide vs Documents */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="details" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Details & Logs
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Settlement Guide
              {completedStepIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1 bg-primary/10 text-primary border-none text-[10px]">
                  {completedStepIds.length}/{fidelityWorkflow.steps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileSearch className="w-4 h-4" />
              Documents
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-muted rounded-full">
                {documents?.length || 0}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="mt-0">
            {(() => {
              const rec = calculateAuthorityRecommendation(assets, estate?.deceasedState || "CA");
              const enhancedAsset = {
                ...asset,
                ownershipType: asset.ownershipType, // explicit
                isSmallEstateEligible: rec.isEligibleForSmallEstate,
                authorityType: rec.type
              };

              return (
                <SettlementWorkflow
                  asset={enhancedAsset}
                  workflow={fidelityWorkflow}
                  currentStepId={currentStepId}
                  completedStepIds={completedStepIds}
                  onStepSelect={handleStepSelect}
                  onStepComplete={handleStepComplete}
                  onLogCommunication={() => setShowCommDialog(true)}
                  onSendFax={() => toast({ title: "Coming Soon", description: "Faxing will be available in the next update." })}
                  onGenerateLetter={handleGenerateLetter}
                />
              );
            })()}
          </TabsContent>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {!isEditing && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <CommunicationLog assetId={id!} />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Authority Requirement */}
                {(() => {
                  const authReq = getInstitutionAuthorityRequirement(
                    uiAsset.assetType,
                    uiAsset.category,
                    uiAsset.value,
                    uiAsset.ownershipType
                  );

                  const getReqColor = (req: string) => {
                    switch (req) {
                      case "AFFIDAVIT_ACCEPTED": return "bg-green-50 border-green-100 text-green-900";
                      case "LETTERS_PREFERRED": return "bg-amber-50 border-amber-100 text-amber-900";
                      case "LETTERS_REQUIRED": return "bg-red-50 border-red-100 text-red-900";
                      case "BENEFICIARY_ONLY": return "bg-blue-50 border-blue-100 text-blue-900";
                      default: return "bg-slate-50 border-slate-100 text-slate-900";
                    }
                  };

                  const getReqLabel = (req: string) => {
                    switch (req) {
                      case "AFFIDAVIT_ACCEPTED": return "Small Estate Affidavit Accepted";
                      case "LETTERS_PREFERRED": return "Letters Testamentary Preferred";
                      case "LETTERS_REQUIRED": return "Letters Testamentary Required";
                      case "BENEFICIARY_ONLY": return "Direct Beneficiary Claim";
                      default: return "Varies by Institution";
                    }
                  };

                  return (
                    <div className="card-elevated p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Authority Required</h3>
                        <Badge className={cn("text-[10px] font-black tracking-tighter", getReqColor(authReq.requirement))}>
                          {getReqLabel(authReq.requirement)}
                        </Badge>
                      </div>

                      {authReq.warning && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-xs text-amber-900 font-medium leading-relaxed">
                            ⚠️ {authReq.warning}
                          </p>
                        </div>
                      )}

                      {authReq.conditions && authReq.conditions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conditions</p>
                          <div className="space-y-1.5">
                            {authReq.conditions.map((cond, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                <span className="text-xs text-slate-600 font-medium leading-tight">{cond}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="card-elevated p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Institutional Contact</h3>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{uiAsset.institution}</Badge>
                  </div>

                  {!isEditing && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        {[
                          { icon: Phone, label: "Phone", value: uiAsset.institutionPhone },
                          { icon: Mail, label: "Email", value: uiAsset.institutionEmail },
                          { icon: Printer, label: "Fax", value: uiAsset.institutionFax },
                          { icon: Landmark, label: "Address", value: uiAsset.institutionAddress },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white text-slate-400 group-hover:text-primary transition-colors">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">{label}</p>
                                <p className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">{value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-border/50">
                        {uiAsset.institutionUrl && uiAsset.institutionUrl !== 'N/A' && (
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 border-slate-200 hover:border-primary/30 transition-all rounded-xl shadow-sm text-slate-600 mb-2"
                            asChild
                          >
                            <a
                              href={(() => {
                                const url = uiAsset.institutionUrl.startsWith('http') ? uiAsset.institutionUrl : `https://${uiAsset.institutionUrl}`;
                                if (!estate) return url;
                                const syncData = {
                                  deceasedFirstName: estate.deceasedFirstName,
                                  deceasedLastName: estate.deceasedLastName,
                                  deceasedSSN: estate.deceasedSsn,
                                  deceasedDOB: estate.deceasedDateOfBirth?.split('T')[0],
                                  dateOfDeath: estate.deceasedDateOfDeath?.split('T')[0],
                                };
                                try {
                                  const base64 = btoa(JSON.stringify(syncData));
                                  return `${url}#ee_data=${base64}`;
                                } catch (e) {
                                  return url;
                                }
                              })()}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="font-bold text-xs uppercase tracking-wider">Visit {uiAsset.institution} Portal</span>
                            </a>
                          </Button>
                        )}
                        <EnrichDataButton assetId={id!} onEnrichComplete={() => queryClient.invalidateQueries({ queryKey: ["asset", id] })} />
                        <Button
                          variant="default"
                          size="lg"
                          className="w-full gap-3 h-14 bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/20 transition-all font-bold rounded-2xl border-none"
                          onClick={handleGenerateLetter}
                        >
                          <FileText className="w-5 h-5" />
                          Generate Settlement Notice
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Required Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Based on this asset being a <strong>{uiAsset.category}</strong> asset.
                </p>
                <div className="space-y-2">
                  {requiredDocs.map(docName => {
                    const isUploaded = documents?.some((d: any) => d.type === docName || d.name.includes(docName));
                    return (
                      <div key={docName} className="flex items-center p-3 card-elevated">
                        {isUploaded ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-400 mr-3" />
                        )}
                        <span className={cn("text-sm font-medium", isUploaded && "line-through text-muted-foreground")}>
                          {docName}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="card-elevated p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">Document Type</label>
                      <Select value={uploadType} onValueChange={setUploadType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEATH_CERTIFICATE">Death Certificate</SelectItem>
                          <SelectItem value="CLAIM_FORM">Claim Form</SelectItem>
                          <SelectItem value="WILL">Will / Trust</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium">File</label>
                      <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button onClick={handleUpload} disabled={!uploadFile || uploadMutation.isPending}>
                      {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Upload
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {documents?.map((doc: any) => (
                    <div key={doc.id} className="card-elevated p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <File className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} • {formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_URL || ''}${doc.fileUrl}`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                  {documents?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                      No documents uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Communication Log Dialog */}
      <CommunicationLogDialog
        open={showCommDialog}
        onOpenChange={setShowCommDialog}
        onSubmit={(data) => createCommMutation.mutate(data)}
        isLoading={createCommMutation.isPending}
        assetId={id}
        workflowContext={(() => {
          const step = fidelityWorkflow.steps.find(s => s.id === currentStepId);
          if (!step) return undefined;

          const renderText = (text: string) => {
            if (!text) return "";
            return text
              .replace(/{{institution}}/g, asset.institution || "Institution")
              .replace(/{{deceasedName}}/g, estate ? `${estate.deceasedFirstName} ${estate.deceasedLastName}` : "the deceased")
              .replace(/{{accountNumber}}/g, asset.accountNumber || "account");
          };

          return {
            title: renderText(step.title),
            description: renderText(step.description)
          };
        })()}
      />
    </div>
  );
}
