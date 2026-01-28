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
  FileCheck,
  CheckSquare,
  LayoutGrid,
  ArrowRight,
  Gavel,
  History as HistoryIcon,
  Scale
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
import { fidelityWorkflow, WorkflowConfig } from "@/config/workflows/fidelity";
import { bankWorkflow } from "@/config/workflows/bank";
import { propertyWorkflow } from "@/config/workflows/property";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";
import { ProbateProgressMini } from "@/components/ProbateProgressMini";
import { SmartEmailDraft } from "@/components/SmartEmailDraft";
import { AssetValueTracker } from "@/components/financials/AssetValueTracker";
import { Sidebar } from "@/components/Sidebar";
import { AssetAuthorityBlocker } from "@/components/assets/AssetAuthorityBlocker";

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
  const [activeTab, setActiveTab] = useState("workflow");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [showCommDialog, setShowCommDialog] = useState(false);
  const [currentStepId, setCurrentStepId] = useState("initial_contact");
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [hasSetInitialTab, setHasSetInitialTab] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const getWorkflow = (category: string, type?: string) => {
    const isBrokerage = type?.toLowerCase().includes('brokerage') || type?.toLowerCase().includes('401k') || type?.toLowerCase().includes('retirement');
    if (isBrokerage) return fidelityWorkflow;
    if (category === 'financial') return bankWorkflow;
    if (category === 'property') return propertyWorkflow;
    return fidelityWorkflow; // Default
  };

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

  const { data: estateDocuments = [] } = useQuery({
    queryKey: ["estate", "documents"],
    queryFn: api.getEstateDocuments,
    enabled: !!estate
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
    onSuccess: (newComm: any) => {
      toast({ title: "Communication Logged", description: "Successfully logged communication." });
      queryClient.invalidateQueries({ queryKey: ['communications', id] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      setShowCommDialog(false);

      // If the communication included a status change, update the asset
      if (newComm.statusChange && newComm.statusChange !== 'none') {
        updateMutation.mutate({ status: newComm.statusChange });
      }
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
      const workflow = getWorkflow(asset?.category || '');
      const currentIndex = workflow.steps.findIndex(s => s.id === stepId);
      const nextStep = workflow.steps[currentIndex + 1];
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
    if (asset && !hasSetInitialTab) {
      if (normalize(asset.status) === 'discovered') {
        setActiveTab("workflow");
      }
      setHasSetInitialTab(true);
    }
  }, [asset, hasSetInitialTab]);

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


  const isLocked = asset.ownershipType === 'INDIVIDUAL' && estate?.probateStatus !== 'EXECUTOR_APPOINTED';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50 bg-white/80 backdrop-blur-md">
          <div className="max-w-[1200px] w-full mx-auto px-6">
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

        <main className="max-w-[1240px] w-full mx-auto px-6 py-8 space-y-6">

          {/* BLOCKER ALERT - Top of Page */}
          {isLocked && (
            <div className="animate-in slide-in-from-top duration-500">
              <AssetAuthorityBlocker institutionName={uiAsset.institution} />
            </div>
          )}

          {/* Compact Asset Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm"
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
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-3 rounded-2xl',
                    uiAsset.category === 'retirement' && 'bg-violet-100 text-violet-600',
                    uiAsset.category === 'financial' && 'bg-blue-100 text-blue-600',
                    uiAsset.category === 'insurance' && 'bg-emerald-100 text-emerald-600',
                    uiAsset.category === 'property' && 'bg-orange-100 text-orange-600',
                  )}>
                    <CategoryIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{uiAsset.institution}</h1>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={uiAsset.status} />
                        <PriorityBadge priority={uiAsset.priority} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                      {uiAsset.type.replace(/_/g, ' ')} • Account {uiAsset.accountNumber}
                    </p>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 gap-2 rounded-xl"
                      onClick={() => navigate(`/inbox?q=${encodeURIComponent(uiAsset.institution)}`)}
                    >
                      <HistoryIcon className="w-3.5 h-3.5" />
                      View Audit Trail
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Value</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(uiAsset.value)}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {!isEditing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssetValueTracker
                assetId={uiAsset.id}
                currentValue={uiAsset.value || 0}
                dateOfDeathValue={uiAsset.dateOfDeathValue || 0}
              />
            </div>
          )}

          {/* Tabs for Details vs Guide vs Documents */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 bg-slate-100 p-1 rounded-2xl h-auto">
              <TabsTrigger value="workflow" className="gap-2 rounded-xl py-2.5 data-[state=active]:shadow-sm">
                <CheckSquare className="w-4 h-4 text-primary" />
                Settlement Guide
                {completedStepIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1 bg-primary/10 text-primary border-none text-[10px]">
                    {completedStepIds.length}/{getWorkflow(uiAsset.category).steps.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2 rounded-xl py-2.5 data-[state=active]:shadow-sm">
                <LayoutGrid className="w-4 h-4" />
                Details & Logs
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 rounded-xl py-2.5 data-[state=active]:shadow-sm">
                <FileSearch className="w-4 h-4" />
                Documents
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/50 rounded-full">
                  {documents?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="mt-0">
              {(() => {
                const rec = calculateAuthorityRecommendation(assets, estate?.deceasedState || "CA");
                const enhancedAsset = {
                  ...asset,
                  ownershipType: asset.ownershipType,
                  isSmallEstateEligible: rec.isEligibleForSmallEstate,
                  authorityType: rec.type
                };

                // The BLOCKER logic is now handled at the top of the page.
                // We render the workflow regardless (or we could hide it, but user might want to see what's next).
                // Let's keep it visible but maybe disabled? 
                // For now, let's just render the workflow. The top alert is sufficient.
                const workflow: WorkflowConfig = getWorkflow(asset.category);

                return (
                  <div className={cn("space-y-6", isLocked && "opacity-50 pointer-events-none grayscale")}>
                    {/* If locked, we overlay or just dim it? The top alert is better. Let's dim. */}

                    <SettlementWorkflow
                      asset={enhancedAsset}

                      workflow={workflow}
                      currentStepId={currentStepId}
                      completedStepIds={completedStepIds}
                      onStepSelect={handleStepSelect}
                      onStepComplete={handleStepComplete}
                      onLogCommunication={() => setShowCommDialog(true)}
                      onSendFax={async () => {
                        if (!asset.institutionFax) {
                          toast({
                            title: "Fax Number Missing",
                            description: "Please update the institution fax number in the details section first.",
                            variant: "destructive"
                          });
                          return;
                        }

                        try {
                          const res = await api.sendFax({
                            assetId: id!,
                            faxNumber: asset.institutionFax,
                            subject: `Estate Settlement: ${asset.institution} - ${asset.assetType}`,
                            documentType: currentStepId
                          });

                          toast({
                            title: "Fax Sent",
                            description: res.message || "Your document has been queued for transmission.",
                          });

                          // Refetch asset/comms since status might have changed
                          queryClient.invalidateQueries({ queryKey: ['asset', id] });
                          queryClient.invalidateQueries({ queryKey: ['communications', id] });
                        } catch (err: any) {
                          toast({
                            title: "Fax Failed",
                            description: err.message,
                            variant: "destructive"
                          });
                        }
                      }}
                      onGenerateLetter={handleGenerateLetter}
                    />

                    {/* Smart Document Checklist */}
                    <div className="card-elevated p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900">Settlement Checklist</h3>
                      </div>

                      <p className="text-xs text-slate-500">
                        Based on this asset's ownership ({asset.ownershipType}) and value ({formatCurrency(asset.value)}),
                        the following documents are required for settlement:
                      </p>

                      <div className="space-y-2 pt-2">
                        {(() => {
                          const authReq = getInstitutionAuthorityRequirement(
                            uiAsset.assetType,
                            uiAsset.category,
                            uiAsset.value,
                            uiAsset.ownershipType
                          );

                          const requirementsMap: Record<string, string[]> = {
                            "BENEFICIARY_ONLY": ["Death Certificate (certified)"],
                            "AFFIDAVIT_ACCEPTED": ["Death Certificate (certified)", "Small Estate Affidavit (DE-310)"],
                            "LETTERS_REQUIRED": ["Death Certificate (certified)", "DE-150 Letters", "DE-111 Petition"],
                            "LETTERS_PREFERRED": ["Death Certificate (certified)", "DE-150 Letters"],
                            "VARIES": ["Death Certificate (certified)"]
                          };

                          const docs = requirementsMap[authReq.requirement] || ["Death Certificate (certified)"];

                          return docs.map((docType, idx) => {
                            const uploaded = estateDocuments.find(d =>
                              d.documentType.toLowerCase().includes(docType.split('(')[0].trim().toLowerCase()) ||
                              docType.toLowerCase().includes(d.name.toLowerCase())
                            );

                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                <div className="flex items-center gap-3">
                                  {uploaded ? (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                      <Clock className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className={cn("text-xs font-bold", uploaded ? "text-slate-900" : "text-slate-600")}>{docType}</p>
                                    <p className="text-[10px] text-slate-500">{uploaded ? `Obtained ${new Date(uploaded.obtainedDate!).toLocaleDateString()}` : "Action Required"}</p>
                                  </div>
                                </div>

                                {uploaded ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => window.open(api.getEstateDocumentDownloadUrl(uploaded.documentType), "_blank")}
                                  >
                                    <Download className="w-3.5 h-3.5 mr-2" />
                                    Download
                                  </Button>
                                ) : (
                                  <Link to="/documents">
                                    <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                      Go to Vault
                                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
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

                  {/* Value Proposition: Why Use Pilar? */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Scale className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <Badge className="bg-blue-500 text-white border-none px-3 py-1 font-black uppercase text-[10px] tracking-widest">Executor Protection</Badge>
                      <h3 className="text-xl font-bold tracking-tight">Why log every email here?</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Gmail is for chatting; **Pilar is for Probate.** Every interaction you log here is converted into a **Court-Admissible Audit Trail**.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs font-bold text-blue-400 uppercase mb-1">Legal Liability</p>
                          <p className="text-[11px] text-slate-400">Proves to the judge and heirs that you acted with maximum "Due Diligence."</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs font-bold text-emerald-400 uppercase mb-1">One-Click Report</p>
                          <p className="text-[11px] text-slate-400">Export your entire verified history as a PDF for the final accounting.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Probate Progress Mini */}
                  <ProbateProgressMini />

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
                              {label === "Email" && value !== "N/A" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => setShowDraftModal(true)}
                                >
                                  Send Professional Draft
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                          <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                            <strong>How to Send:</strong> Use your personal email (Gmail/Outlook) to send documents. Then, use the <strong>Log History</strong> tool to create your legal audit trail.
                          </p>
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
                          {activeTab === 'workflow' && (
                            <Button
                              variant="default"
                              size="lg"
                              className="w-full gap-3 h-14 bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/20 transition-all font-bold rounded-2xl border-none"
                              onClick={handleGenerateLetter}
                            >
                              <FileText className="w-5 h-5" />
                              Generate Settlement Notice
                            </Button>
                          )}
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
                    {Array.isArray(requiredDocs) && requiredDocs.map(docName => {
                      const isUploaded = Array.isArray(documents) && documents.some((d: any) => d && (d.type === docName || d.name?.includes(docName)));
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
                    {/* Probate Authority Documents (The Golden Bridge) */}
                    {(() => {
                      const authorityDocs = Array.isArray(estateDocuments)
                        ? [
                          estateDocuments.find(d => d.documentType === 'DE-150'),
                          estateDocuments.find(d => d.documentType === 'DE-140')
                        ].filter(Boolean)
                        : [];

                      if (authorityDocs.length === 0) return null;

                      return authorityDocs.map((doc: any) => (
                        <div key={doc.id} className="card-elevated p-4 flex items-center justify-between border-violet-100 bg-violet-50/20">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                              <Scale className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-violet-900">{doc.name}</p>
                                <Badge className="bg-violet-600 text-[8px] uppercase font-black tracking-tighter h-4">Probate Authority</Badge>
                              </div>
                              <p className="text-[10px] text-violet-600 font-medium">{doc.documentType} • Court Certified Document</p>
                            </div>
                          </div>
                          <a href={api.getEstateDocumentDownloadUrl(doc.documentType)} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="hover:bg-violet-100 text-violet-600">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      ));
                    })()}

                    {/* Asset-Specific Documents */}
                    {Array.isArray(documents) && documents.map((doc: any) => (
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
                    {documents?.length === 0 && (!estateDocuments.find(d => d.documentType === 'DE-150')) && (
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
          availableDocuments={[...(Array.isArray(estateDocuments) ? estateDocuments : []), ...(Array.isArray(documents) ? documents : [])]}
          workflowContext={(() => {
            const workflow = getWorkflow(asset.category);
            const step = workflow.steps.find(s => s.id === currentStepId);
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

        <SmartEmailDraft
          open={showDraftModal}
          onOpenChange={setShowDraftModal}
          asset={uiAsset}
          estate={estate}
          onLogSent={(subject, content) => {
            createCommMutation.mutate({
              method: "email",
              direction: "outbound",
              subject,
              notes: content,
              type: "initial_contact",
              occurredAt: new Date().toISOString().slice(0, 16),
              statusChange: "none"
            } as any);
          }}
        />
      </div>
    </div>
  );
}
