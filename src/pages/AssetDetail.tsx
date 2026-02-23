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
import { AssetTaxonomyBadge } from "@/components/AssetTaxonomyBadge";
import { getAssetTaxonomyState, getTaxonomyInfo } from "@/lib/taxonomy";
import { AuthorityBadge, AuthorityType } from "@/components/AuthorityBadge";
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
  Scale,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { TRACK_STAGES, SettlementTrack } from "@/config/settlementStages";
import { calculateAuthorityRecommendation, getInstitutionAuthorityRequirement } from "@/lib/authorityEngine";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLettersTerm, getStateRule } from "@/lib/stateRules";
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
import { PhysicalAssetProtector } from "@/components/assets/PhysicalAssetProtector";
import { SubscriptionAudit } from "@/components/assets/SubscriptionAudit";
import { LetterPreviewDialog } from "@/components/LetterPreviewDialog";
import { generateMagicPipeUrl } from "@/lib/autofill";
import { AUTOMATION_MAPPINGS } from "@/config/automation";

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

function AutomateButton({ estate, asset }: { estate: any, asset: any }) {
  const currentDomain = asset?.institutionUrl || "";
  let config = null;
  let baseUrl = asset?.institutionUrl;

  for (const key in AUTOMATION_MAPPINGS) {
    if (currentDomain.includes(AUTOMATION_MAPPINGS[key].urlPattern) ||
      asset?.institution?.toLowerCase().includes(key)) {
      config = AUTOMATION_MAPPINGS[key];
      // If we don't have a specific URL but know it's Fidelity, use a default
      if (!baseUrl && key === 'fidelity') baseUrl = "https://www.fidelity.com/estate-services/overview";
      if (!baseUrl && key === 'robinhood') baseUrl = "https://robinhood.com/contact";
      break;
    }
  }

  if (!config || !baseUrl) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
      onClick={() => window.open(generateMagicPipeUrl(baseUrl, estate, asset), "_blank")}
    >
      <Zap className="w-4 h-4" />
      Automate with Extension
    </Button>
  );
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
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);

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

  const isViewer = (estate as any)?.userRole === 'VIEWER';

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications', id],
    queryFn: () => api.getCommunications(id!),
    enabled: !!id
  });

  // Calculate follow-up metrics
  const lastContact = communications
    .filter(c => c.direction === 'OUTBOUND')
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];

  const daysSinceContact = lastContact
    ? Math.floor((new Date().getTime() - new Date(lastContact.occurredAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const followUpStatus = daysSinceContact > 14 ? 'urgent' : daysSinceContact > 7 ? 'needed' : 'good';


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
        dateOfDeathValue: asset.dateOfDeathValue || 0,
        settledValue: asset.settledValue || 0,
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

  const handleSyncRoadmap = async (roadmapId: string) => {
    try {
      if (!estate) return;
      const completedTaskIds = estate.roadmapProgress?.completedTaskIds || [];
      if (!completedTaskIds.includes(roadmapId)) {
        const newIds = [...completedTaskIds, roadmapId];
        await api.updateRoadmap({
          completedTaskIds: newIds,
          completedPhases: estate.roadmapProgress?.completedPhases || [],
          taskId: roadmapId,
          action: 'COMPLETED'
        });
        queryClient.invalidateQueries({ queryKey: ["estate"] });
        toast({
          title: "Roadmap Sync",
          description: `Progress in "${uiAsset.institution}" updated your Roadmap.`,
        });
      }
    } catch (err) {
      console.error("Failed to sync roadmap:", err);
    }
  };

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

      // Auto-sync roadmap milestones
      if (stepId === "initial_notification") {
        if (asset.category === 'financial') handleSyncRoadmap("freeze_accounts");
        if (asset.category === 'property') handleSyncRoadmap("get_dod_values");
      } else if (stepId === "obtain_balance") {
        handleSyncRoadmap("get_dod_values");
      }

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

  const handleGenerateLetter = async (overrides?: any) => {
    setIsGeneratingLetter(true);
    try {
      const filename = `Settlement_Notice_${overrides?.institution || uiAsset.institution}.pdf`;
      await api.generateLetter(id!, overrides, filename);
      toast({ title: "Letter Generated", description: "Your settlement notice is ready to send." });
      setShowLetterPreview(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "PDF Failed", description: e.message });
    } finally {
      setIsGeneratingLetter(false);
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
    accountNumber: asset.accountNumber || '',
    institutionPhone: asset.institutionPhone || '',
    institutionEmail: asset.institutionEmail || '',
    institutionFax: asset.institutionFax || '',
    daysSinceContact: 0,
    communications: asset.communications || []
  };

  const CategoryIcon = getCategoryIcon(uiAsset.category);

  const rec = calculateAuthorityRecommendation(assets || [], estate?.deceasedState || "");

  const authReq = getInstitutionAuthorityRequirement(

    uiAsset.assetType,
    uiAsset.category,
    uiAsset.value,
    uiAsset.ownershipType
  );

  const rule = getStateRule(estate?.deceasedState || "");
  const requirementsMap: Record<string, string[]> = {
    "BENEFICIARY_ONLY": ["Death Certificate (certified)"],
    "AFFIDAVIT_ACCEPTED": ["Death Certificate (certified)", rule.smallEstateTerm],
    "SUMMARY_ADMINISTRATION": ["Death Certificate (certified)", "Summary Administration Order"],
    "VOLUNTARY_ADMINISTRATION": ["Death Certificate (certified)", "Affidavit of Voluntary Administration"],
    "LETTERS_REQUIRED": ["Death Certificate (certified)", getLettersTerm(estate?.deceasedState)],
    "LETTERS_PREFERRED": ["Death Certificate (certified)", getLettersTerm(estate?.deceasedState)],
    "VARIES": ["Death Certificate (certified)"]
  };

  const requiredDocs = requirementsMap[authReq.requirement] || ["Death Certificate (certified)"];


  const isLocked = (uiAsset.authorityType === 'COURT_REQUIRED' || (uiAsset.ownershipType === 'INDIVIDUAL' && !uiAsset.authorityType)) &&
    estate?.probateStatus !== 'EXECUTOR_APPOINTED';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50 bg-white/80 backdrop-blur-md">
          <div className="max-w-[1240px] w-full mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="rounded-full w-10 h-10 p-0 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-700">
                    {uiAsset.institution === 'Newly Identified Account' || !uiAsset.institution
                      ? `${uiAsset.assetType || 'Asset'} Account`
                      : uiAsset.institution}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isViewer && (
                  <>
                    <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button className="bg-[#5C7491] hover:bg-[#4A5E75] text-white rounded-xl font-bold px-6 shadow-lg shadow-slate-100">
                      Review
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
              <AssetAuthorityBlocker
                institutionName={uiAsset.institution}
                authorityType={uiAsset.authorityType}
                stateCode={estate?.deceasedState}
              />
            </div>
          )}

          {/* Compact Asset Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm"
          >
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Institution Name</label>
                    <Input
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Value at Death</label>
                    <Input
                      type="number"
                      value={formData.dateOfDeathValue}
                      onChange={(e) => setFormData({ ...formData, dateOfDeathValue: parseFloat(e.target.value) || 0 })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Actual Collected</label>
                    <Input
                      type="number"
                      value={formData.settledValue}
                      onChange={(e) => setFormData({ ...formData, settledValue: parseFloat(e.target.value) || 0 })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Current Value</label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Account Number</label>
                    <Input
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
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
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Institution Email</label>
                    <Input
                      value={formData.institutionEmail}
                      onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Institution Phone</label>
                    <Input
                      value={formData.institutionPhone}
                      onChange={(e) => setFormData({ ...formData, institutionPhone: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Institution Fax</label>
                    <Input
                      value={formData.institutionFax}
                      onChange={(e) => setFormData({ ...formData, institutionFax: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Authority Tier</label>
                    <Select
                      value={formData.authorityType}
                      onValueChange={(val) => setFormData({ ...formData, authorityType: val })}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-violet-200 bg-violet-50 text-violet-700">
                        <SelectValue placeholder="Select Authority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COURT_REQUIRED">Court Required</SelectItem>
                        <SelectItem value="TRUSTEE_DIRECT">Trustee Direct</SelectItem>
                        <SelectItem value="AFFIDAVIT_SMALL">Small Estate Affidavit</SelectItem>
                        <SelectItem value="BENEFICIARY_CONTRACT">Beneficiary Contract</SelectItem>
                        <SelectItem value="SURVIVORSHIP_TITLE">Survivorship Title</SelectItem>
                        <SelectItem value="LITIGATION_HOLD">Litigation Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg h-8 px-4 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-8 px-5 font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                    onClick={handleSave}
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6">
                {/* Left: Icon + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    uiAsset.category === 'retirement' && 'bg-violet-50 text-violet-600',
                    uiAsset.category === 'financial' && 'bg-blue-50 text-blue-600',
                    uiAsset.category === 'insurance' && 'bg-emerald-50 text-emerald-600',
                    uiAsset.category === 'property' && 'bg-orange-50 text-orange-600',
                  )}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold text-slate-900 truncate">{uiAsset.institution}</h1>
                      <AuthorityBadge type={uiAsset.authorityType} />
                      <StatusBadge status={uiAsset.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {getTaxonomyInfo(uiAsset as any, estate as any).secondary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">
                        {uiAsset.type.replace(/_/g, ' ')} • Account {uiAsset.accountNumber}
                      </p>
                      <button
                        onClick={() => navigate(`/inbox?q=${encodeURIComponent(uiAsset.institution)}`)}
                        className="text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View Settlement Trail
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Values + Action */}
                <div className="flex items-center gap-6">
                  <div className="text-right cursor-pointer group/val" onClick={() => setIsEditing(true)}>
                    <p className="text-[10px] font-medium uppercase text-slate-400 group-hover/val:text-indigo-500 transition-colors">Value at Death</p>
                    <p className="text-sm font-bold text-slate-600 group-hover/val:text-indigo-600">
                      {(uiAsset.dateOfDeathValue || 0) === 0 ? (
                        <span className="text-slate-400 italic">Unknown</span>
                      ) : (
                        formatCurrency(uiAsset.dateOfDeathValue || 0)
                      )}
                    </p>
                  </div>

                  <div className="text-right cursor-pointer group/val" onClick={() => setIsEditing(true)}>
                    <p className="text-[10px] font-medium uppercase text-emerald-600 group-hover/val:text-emerald-500 transition-colors">Actual Collected</p>
                    <p className="text-sm font-bold text-emerald-600 group-hover/val:text-emerald-500">
                      {(uiAsset.settledValue || 0) === 0 ? (
                        <span className="text-slate-400 italic">$0</span>
                      ) : (
                        formatCurrency(uiAsset.settledValue || 0)
                      )}
                    </p>
                  </div>

                  <div className="text-right cursor-pointer group/val" onClick={() => setIsEditing(true)}>
                    <p className="text-[10px] font-medium uppercase text-slate-400 group-hover/val:text-indigo-500 transition-colors">Current Value</p>
                    <p className="text-xl font-bold text-slate-900 group-hover/val:text-indigo-600">
                      {uiAsset.value === 0 ? (
                        <span className="text-slate-400 italic">Pending</span>
                      ) : (
                        formatCurrency(uiAsset.value)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Authority Resolution Tracker */}
            {!isEditing && (
              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authority Resolution</span>
                    <span className="text-[10px] font-black text-indigo-600">
                      {uiAsset.authorityType === 'COURT_REQUIRED'
                        ? (estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT' ? '100%' : '30%')
                        : '100%'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-1000"
                      style={{
                        width: uiAsset.authorityType === 'COURT_REQUIRED'
                          ? (estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT' ? '100%' : '30%')
                          : '100%'
                      }}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-6">
                  <ResolutionMilestone
                    label="Petition Prepared"
                    done={true} // In this architecture, discovery usually implies readiness for petition
                  />
                  <ResolutionMilestone
                    label="Documents Ready"
                    done={uiAsset.status !== 'discovered'}
                  />
                  <ResolutionMilestone
                    label="Letters/Order Issued"
                    done={estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT'}
                  />
                </div>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: ACTION & WORKFLOW */}
            <div className="lg:col-span-8 space-y-6">

              {/* PRIMARY ACTION CARD */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-900">
                    {uiAsset.status === 'approved' ? 'Record Receipt' :
                      uiAsset.status === 'discovered' ? 'Send Notification' :
                        uiAsset.status === 'notified' ? 'Request Balance' :
                          'Follow Up'}
                  </h2>
                  <p className="text-sm text-slate-600 font-medium">
                    {uiAsset.status === 'approved' ?
                      `Record the final amount received from ${uiAsset.institution}.` :
                      uiAsset.status === 'discovered' ?
                        `Notify ${uiAsset.institution} about the estate.` :
                        `Request date of death balance from ${uiAsset.institution}.`}
                  </p>
                </div>

                <div className="flex gap-3">
                  {uiAsset.status === 'approved' ? (
                    <Button
                      size="lg"
                      onClick={() => {
                        const amount = prompt("Enter the final amount received:", uiAsset.value?.toString());
                        if (amount) {
                          updateMutation.mutate({
                            status: 'distributed',
                            settledValue: parseFloat(amount),
                            settledAt: new Date().toISOString()
                          });
                        }
                      }}
                      className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Record Receipt
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => setShowDraftModal(true)}
                      className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Draft Message
                    </Button>
                  )}
                </div>
              </motion.div>


              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 bg-slate-100 p-1 rounded-2xl h-auto w-full justify-start">
                  <TabsTrigger value="workflow" className="gap-2 rounded-xl py-2 data-[state=active]:shadow-sm px-6">
                    <CheckSquare className="w-4 h-4" />
                    Settlement Guide
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-2 rounded-xl py-2 data-[state=active]:shadow-sm px-6">
                    <FileSearch className="w-4 h-4" />
                    Vault
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-white/50 text-slate-600 border-none text-[10px]">
                      {documents?.length || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="workflow" className="mt-0">
                  {(() => {
                    const enhancedAsset = {
                      ...asset,
                      ownershipType: asset.ownershipType,
                      isSmallEstateEligible: rec.isEligibleForSmallEstate,
                      authorityType: rec.type
                    };
                    const workflow: WorkflowConfig = getWorkflow(asset.category);


                    return (
                      <div className={cn("space-y-6", isLocked && "opacity-50 pointer-events-none grayscale")}>
                        {/* 
                            REMOVED OLD WORKFLOW ACCORDIONS TO REDUCE CLUTTER
                            Focus is now on the central Primary Action card above.
                        */}
                        <PhysicalAssetProtector assetCategory={uiAsset.category} assetType={uiAsset.type} />
                      </div>
                    );
                  })()}

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
                        {/* Authority Documents */}
                        {estateDocuments.filter(d => ['DE-150', 'DE-140'].includes(d.documentType)).map((doc: any) => (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-violet-100 text-violet-600"
                              onClick={() => api.downloadEstateDocument(doc.documentType, `${doc.name}.pdf`)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {/* Asset Documents */}
                        {documents?.map((doc: any) => (
                          <div key={doc.id} className="card-elevated p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <File className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{doc.name}</p>
                                <p className="text-[10px] text-slate-500">{doc.type} • {formatDate(doc.createdAt)}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_URL || ''}${doc.fileUrl}`, "_blank")}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* RIGHT COLUMN: CONTEXT & LOGS */}
            <div className="lg:col-span-4 space-y-6">

              {/* SMART FOLLOW-UP CARD */}
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Smart Follow-Up</h3>

                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-slate-100"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 * (1 - Math.min(daysSinceContact, 30) / 30)}
                        strokeLinecap="round"
                        className={cn(
                          "transition-all duration-1000",
                          followUpStatus === 'urgent' ? "text-rose-500" : followUpStatus === 'needed' ? "text-orange-500" : "text-blue-500"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Days</span>
                      <span className="text-3xl font-black text-slate-900 leading-none my-0.5">{daysSinceContact}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">since contact</span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-500 leading-relaxed px-2">
                    {lastContact
                      ? `Last contact with ${uiAsset.institution} was ${daysSinceContact} days ago. ${followUpStatus !== 'good' ? 'It is recommended to schedule a follow-up action.' : 'Your settlement trail is up to date.'}`
                      : `No contact history found for ${uiAsset.institution}. Start by sending an initial notification.`}
                  </p>

                  <Button
                    onClick={() => setShowCommDialog(true)}
                    className="w-full h-12 rounded-2xl bg-[#5C7491] hover:bg-[#4A5E75] text-white font-bold gap-2 shadow-lg shadow-slate-100"
                  >
                    <Clock className="w-4 h-4" />
                    Schedule Next Check
                  </Button>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Set a reminder for follow-up</p>
                </div>

                {/* Past Actions */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Past Actions</h4>
                  <div className="space-y-4">
                    {communications.length > 0 ? (
                      communications.slice(0, 3).map((comm, i) => (
                        <div key={comm.id} className="flex items-start gap-3">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 mt-0.5" />
                          <div className="text-[11px] font-bold text-slate-600">
                            {comm.subject || comm.type} <span className="text-slate-400 font-medium">— {formatDate(comm.occurredAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">No past actions recorded.</div>
                    )}
                  </div>
                </div>

                {/* Mini Calendar */}
                <div className="pt-4 border-t border-slate-50">
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <span key={day} className="text-[9px] font-black text-slate-300 py-1">{day}</span>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <span
                        key={day}
                        className={cn(
                          "text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-default",
                          day === 12 ? "bg-blue-500 text-white shadow-md shadow-blue-100" :
                            day === 14 ? "border-2 border-blue-500 text-blue-600" :
                              "text-slate-800 hover:bg-slate-50"
                        )}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Institution Intel (Only show if data exists) */}
              {(uiAsset.institutionPhone || uiAsset.institutionFax) && (
                <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Institution Intel</h3>
                    <EnrichDataButton assetId={id!} onEnrichComplete={() => queryClient.invalidateQueries({ queryKey: ["asset", id] })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Hotline</p>
                      <p className="text-xs font-bold text-slate-700">{uiAsset.institutionPhone}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Fax Line</p>
                      <p className="text-xs font-bold text-slate-700">{uiAsset.institutionFax}</p>
                    </div>
                  </div>
                  <AutomateButton estate={estate} asset={uiAsset} />
                </div>
              )}

            </div>

          </div>
        </main>

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
          onLogSent={(subject, notes) => {
            createCommMutation.mutate({
              contactChannel: "email",
              direction: "outbound",
              subject,
              notes,
              type: "initial_contact",
              occurredAt: new Date().toISOString().slice(0, 16),
              statusChange: "notified",
            } as any);
          }}
        />
        <LetterPreviewDialog
          open={showLetterPreview}
          onOpenChange={setShowLetterPreview}
          asset={uiAsset}
          estate={estate}
          onGenerate={handleGenerateLetter}
          isGenerating={isGeneratingLetter}
        />
      </div >
    </div >
  );
}

function ResolutionMilestone({ label, done }: { label: string, done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3.5 h-3.5 rounded-full flex items-center justify-center",
        done ? "bg-emerald-500 text-white" : "border-2 border-slate-200"
      )}>
        {done && <CheckCircle2 className="w-2.5 h-2.5" />}
      </div>
      <span className={cn(
        "text-[10px] font-black uppercase tracking-tight",
        done ? "text-slate-600" : "text-slate-300"
      )}>
        {label}
      </span>
    </div>
  );
}
