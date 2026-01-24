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
  LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
    mutationFn: (data: CommunicationData) => api.createCommunication(id!, data),
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

      <main className="section-container py-8">
        {/* Asset Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-elevated p-6 mb-6"
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
            <SettlementWorkflow
              asset={asset}
              workflow={fidelityWorkflow}
              currentStepId={currentStepId}
              completedStepIds={completedStepIds}
              onStepSelect={handleStepSelect}
              onStepComplete={handleStepComplete}
              onLogCommunication={() => setShowCommDialog(true)}
              onSendFax={() => toast({ title: "Coming Soon", description: "Faxing will be available in the next update." })}
            />
          </TabsContent>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {!isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-elevated"
                  >
                    <div className="p-5 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-foreground">Communication Log</h2>
                      </div>
                      <Button size="sm" className="gap-2" onClick={() => setShowCommDialog(true)}>
                        <Plus className="w-4 h-4" />
                        Log Communication
                      </Button>
                    </div>
                    <div className="divide-y divide-border/50">
                      {uiAsset.communications.length === 0 && (
                        <div className="p-5 text-center text-muted-foreground">
                          No communications logged yet.
                        </div>
                      )}
                      {uiAsset.communications.map((comm: any) => {
                        const MethodIcon = methodIcons[comm.method] || MessageSquare;
                        return (
                          <div key={comm.id} className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                                <MethodIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-sm">{comm.subject}</h3>
                                  <span className="text-[10px] text-muted-foreground">{formatDate(comm.communicationDate)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{comm.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-6">
                <div className="card-elevated p-5">
                  <h3 className="font-semibold mb-4">Contact Info</h3>
                  {!isEditing && (
                    <div className="space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{uiAsset.institutionPhone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{uiAsset.institutionEmail}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Printer className="w-4 h-4 text-muted-foreground" />
                          <span>{uiAsset.institutionFax || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Landmark className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{uiAsset.institutionAddress || 'N/A'}</span>
                        </div>
                        {uiAsset.institutionUrl && uiAsset.institutionUrl !== 'N/A' && (
                          <div className="flex items-center gap-3">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
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
                              className="text-primary hover:underline truncate max-w-[200px]"
                            >
                              {uiAsset.institutionUrl.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </div>
                      <EnrichDataButton assetId={id!} onEnrichComplete={() => queryClient.invalidateQueries({ queryKey: ["asset", id] })} />
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2 shadow-lg shadow-primary/20"
                        onClick={async () => {
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
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Generate Settlement Notice
                      </Button>
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
