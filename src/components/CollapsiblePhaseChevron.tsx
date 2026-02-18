/**
 * Collapsible Phase Chevron
 * 
 * An accordion-style roadmap that shows all 6 phases with expandable
 * task lists. Completed phases collapse, current phase expands, future
 * phases show lock status.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Lock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { SETTLEMENT_PHASE_TASKS, type PhaseTask } from '@/config/settlementPhases';
import { TASK_ACTIONS } from '@/config/taskActions';
import { type SettlementPhase } from '@/config/settlementPhases';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DOCUMENT_REGISTRY, findCanonicalDoc } from "@/config/documents";
import { FileUp, FileText, CheckCircle2, Download, Trash2, Loader2 as Spinner, Eye, CalendarClock, Ban } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CollapsiblePhaseChevronProps {
  onTaskToggle: (taskId: string, completed: boolean, taskTitle: string, phaseName: string) => void;
}

const PHASE_COLORS: Record<string, {
  border: string;
  bgActive: string;
  bgLight: string;
  text: string;
  progress: string;
  badge: string;
  icon: string;
}> = {
  immediate_actions: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bgActive: 'bg-white',
    bgLight: 'bg-indigo-50/20',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600'
  },
  court_filing: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bgActive: 'bg-white',
    bgLight: 'bg-indigo-50/20',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600'
  },
  asset_discovery: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bgActive: 'bg-white',
    bgLight: 'bg-indigo-50/20',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600'
  },
  creditor_claims: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bgActive: 'bg-white',
    bgLight: 'bg-indigo-50/20',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600'
  },
  asset_liquidation: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bgActive: 'bg-white',
    bgLight: 'bg-indigo-50/20',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600'
  },
  final_distribution: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bgActive: 'bg-white',
    bgLight: 'bg-indigo-50/20',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600'
  }
};

export function CollapsiblePhaseChevron({ onTaskToggle }: CollapsiblePhaseChevronProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    currentPhase,
    assetsByPhase,
    phaseLocks,
    phaseProgress,
    completedTaskIds,
    completedPhases
  } = useWorkflow();

  const { data: documents = [] } = useQuery({
    queryKey: ["estate-documents"],
    queryFn: api.getEstateDocuments,
  });

  const { data: estate } = useQuery({
    queryKey: ["estate"],
    queryFn: api.getMyEstate,
  });

  // Fetch roadmap from database
  const { data: roadmapData, isLoading: isLoadingRoadmap } = useQuery({
    queryKey: ['roadmap', estate?.id],
    queryFn: () => api.getEstateRoadmap(estate!.id),
    enabled: !!estate?.id,
  });

  const dynamicRoadmap = useMemo(() => {
    return roadmapData?.phases || [];
  }, [roadmapData]);

  const handleSyncRoadmap = async (roadmapId: string, taskTitle?: string, phaseName?: string) => {
    try {
      if (!estate) return;
      const currentCompletedIds = estate.roadmapProgress?.completedTaskIds || [];
      if (!currentCompletedIds.includes(roadmapId)) {
        const newIds = [...currentCompletedIds, roadmapId];
        await api.updateRoadmap({
          completedTaskIds: newIds,
          completedPhases: estate.roadmapProgress?.completedPhases || [],
          taskId: roadmapId,
          action: 'COMPLETED',
          taskTitle,
          phaseName
        });
        queryClient.invalidateQueries({ queryKey: ["estate"] });
        toast.info(`Automatically marked roadmap task as "Complete".`);
      }
    } catch (err) {
      console.error("Failed to sync roadmap:", err);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: ({ type, name, file }: { type: string; name: string; file: File }) =>
      api.uploadEstateDocument(type, name, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estate-documents"] });
      toast.success("Document uploaded successfully");

      // Auto-sync roadmap if this doc matches a task in any phase
      if (dynamicRoadmap && dynamicRoadmap.length > 0) {
        for (const p of dynamicRoadmap) {
          const taskWithDoc = p.tasks.find(t => t.requiredDocs?.includes(variables.type));
          if (taskWithDoc) {
            handleSyncRoadmap(taskWithDoc.id, taskWithDoc.title, p.title);
            break;
          }
        }
      }
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.deleteEstateDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estate-documents"] });
      toast.success("Document deleted");
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleDocumentUpload = async (type: string, name: string, file: File) => {
    uploadMutation.mutate({ type, name, file });
  };

  const [expandedPhases, setExpandedPhases] = useState<Set<SettlementPhase>>(
    new Set([currentPhase])
  );

  const togglePhase = (phase: SettlementPhase) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  };

  const handleTaskAction = (taskId: string) => {
    const action = TASK_ACTIONS[taskId];
    if (!action) return;

    if (action.type === 'navigate') {
      navigate(action.target);
    } else if (action.type === 'modal') {
      // TODO: Implement modal system
      console.log('Open modal:', action.target);
    } else if (action.type === 'external') {
      window.open(action.target, '_blank');
    }
  };

  // Show loading state
  if (isLoadingRoadmap) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-slate-500">
          Loading roadmap...
        </div>
      </div>
    );
  }

  // Show empty state if no roadmap
  if (!dynamicRoadmap || dynamicRoadmap.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-slate-500">
          No roadmap available. Please configure your settlement type.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dynamicRoadmap.map((phaseData) => {
        const phase = phaseData.phase;
        const phaseTheme = PHASE_COLORS[phase] || {
          border: 'border-slate-200',
          bgActive: 'bg-slate-50',
          bgLight: 'bg-white',
          text: 'text-slate-900',
          progress: 'bg-slate-600',
          badge: 'bg-slate-100 text-slate-700',
          icon: 'text-slate-400'
        };

        const isExpanded = expandedPhases.has(phase);
        const isCompleted = completedPhases.includes(phase);
        const isCurrent = phase === currentPhase;
        // Fallback for lockStatus if phase not found in phaseLocks (database roadmap may have different phase codes)
        const lockStatus = phaseLocks[phase] || { isLocked: false };
        // Fallback for progress if phase not found in phaseProgress
        const progress = phaseProgress[phase] || { completed: 0, total: 0, percentage: 0 };
        const assetCount = assetsByPhase[phase]?.length || 0;

        return (
          <div
            key={phase}
            className={cn(
              "rounded-2xl border-2 overflow-hidden transition-all shadow-sm",
              isCompleted && "border-green-500 bg-green-50/40",
              isCurrent && !isCompleted && cn(phaseTheme.border.replace('hover:', ''), phaseTheme.bgActive),
              lockStatus.isLocked && "border-slate-100 bg-slate-50/30 opacity-80",
              !isCompleted && !isCurrent && !lockStatus.isLocked && cn(phaseTheme.border, "bg-white")
            )}
          >
            {/* Phase Header */}
            <button
              onClick={() => !lockStatus.isLocked && togglePhase(phase)}
              className="w-full p-2.5 flex items-center justify-between hover:bg-black/5 transition-colors"
              disabled={lockStatus.isLocked}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600 focus:outline-none" />
                  ) : lockStatus.isLocked ? (
                    <Lock className="w-5 h-5 text-slate-400" />
                  ) : isCurrent ? (
                    <div className={cn("relative flex items-center justify-center")}>
                      <Circle className={cn("w-5 h-5 fill-current", phaseTheme.icon)} />
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                        className={cn("absolute w-5 h-5 rounded-full border-2", phaseTheme.border.split(' ')[0])}
                      />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                {/* Phase Title & Progress */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-bold text-sm tracking-tight",
                      isCompleted && "text-green-900",
                      isCurrent && !isCompleted && phaseTheme.text,
                      lockStatus.isLocked && "text-slate-500"
                    )}>
                      {phaseData.title}
                    </h3>
                    {isCurrent && !isCompleted && (
                      <Badge variant="default" className={cn("text-[10px] h-4 px-1.5 uppercase font-black tracking-widest leading-none", phaseTheme.badge)}>Current</Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[150px] border border-slate-200/50">
                      <div
                        className={cn(
                          "h-full transition-all duration-700 ease-in-out shadow-sm",
                          isCompleted ? "bg-green-500" : phaseTheme.progress
                        )}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {progress.completed}/{progress.total}
                    </span>
                    {assetCount > 0 && (
                      <Badge variant="secondary" className={cn("text-[10px] font-black h-4 px-1.5 border uppercase tracking-tight", phaseTheme.badge)}>
                        {assetCount} asset{assetCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                {!lockStatus.isLocked && (
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* Lock Message */}
            {lockStatus.isLocked && lockStatus.reason && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-900">{lockStatus.reason}</p>
                    {lockStatus.unlockAction && (
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 h-auto text-amber-900 font-bold mt-1"
                        onClick={() => navigate(lockStatus.unlockAction!.route)}
                      >
                        {lockStatus.unlockAction.label} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Task List (Expandable) */}
            <AnimatePresence>
              {isExpanded && !lockStatus.isLocked && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-200"
                >
                  <div className="p-4 space-y-2 bg-white/50">
                    {phaseData.tasks.map((task) => {
                      const isTaskCompleted = completedTaskIds.includes(task.id);
                      const action = TASK_ACTIONS[task.id];
                      const isNext = isCurrent && !isTaskCompleted && phaseData.tasks.find(t => !completedTaskIds.includes(t.id))?.id === task.id;

                      // Check dependencies
                      const missingDependencies = task.dependencies?.filter(depId => !completedTaskIds.includes(depId)) || [];
                      const isLockedByDependency = missingDependencies.length > 0;

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                            isTaskCompleted
                              ? "bg-white border-slate-100 opacity-60"
                              : isNext && !isLockedByDependency
                                ? "bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-200 shadow-sm"
                                : "bg-white border-slate-200 hover:border-indigo-200",
                            isLockedByDependency && "bg-slate-50 border-slate-200 opacity-60"
                          )}
                        >
                          {/* Round Checkbox (Custom Style) */}
                          <div className="mt-1">
                            <button
                              onClick={() => !isLockedByDependency && onTaskToggle(task.id, !isTaskCompleted, task.title, phaseData.title)}
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                isTaskCompleted
                                  ? "bg-green-500 border-green-500"
                                  : isNext
                                    ? "bg-white border-indigo-500 hover:bg-indigo-50"
                                    : "bg-white border-slate-300 hover:border-indigo-400",
                                isLockedByDependency && "border-slate-200 cursor-not-allowed"
                              )}
                              disabled={isLockedByDependency}
                            >
                              {isTaskCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </button>
                          </div>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className={cn(
                                "text-sm font-semibold tracking-tight",
                                isTaskCompleted ? "line-through text-slate-400" : "text-slate-900",
                                isLockedByDependency && "text-slate-400"
                              )}>
                                {task.title}
                              </h4>
                              {isNext && !isLockedByDependency && <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase h-5 px-1.5 tracking-tight border border-indigo-200">Next Step</Badge>}
                              {task.isOptional && <Badge variant="outline" className="text-slate-500 text-[9px] uppercase tracking-wider h-5 px-1.5 border-slate-200">Optional</Badge>}
                              {task.deadlineWarningId && (
                                <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 text-[9px] font-bold h-5 px-1.5 gap-1 hover:bg-red-100">
                                  <CalendarClock className="w-3 h-3" />
                                  Check Deadline
                                </Badge>
                              )}
                              {isLockedByDependency && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] uppercase tracking-wider h-5 px-1.5 border-slate-200 gap-1">
                                  <Ban className="w-3 h-3" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{task.description}</p>

                            {/* Integrated Document Controls */}
                            {!isTaskCompleted && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {task.requiredDocs && task.requiredDocs.map((doc, idx) => {
                                  const canon = findCanonicalDoc(doc);
                                  const uploaded = documents.find(d => {
                                    if (d.documentType === doc) return true;
                                    if (canon) {
                                      const uploadedCanon = findCanonicalDoc(d.documentType) || findCanonicalDoc(d.name);
                                      return uploadedCanon?.code === canon.code;
                                    }
                                    return false;
                                  });

                                  if (uploaded) return (
                                    <div key={idx} className="flex items-center gap-2">
                                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-bold py-0 h-7 px-2">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {doc} Obtained
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            api.viewEstateDocument(uploaded.documentType);
                                          }}
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMutation.mutate(uploaded.id);
                                          }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );

                                  return (
                                    <div key={idx} className="relative">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium tracking-tight gap-2 shadow-sm"
                                      >
                                        <FileUp className="w-3.5 h-3.5 text-slate-500" />
                                        Upload {doc}
                                      </Button>
                                      <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleDocumentUpload(doc, doc, file);
                                        }}
                                        disabled={uploadMutation.isPending}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {isTaskCompleted && task.requiredDocs && task.requiredDocs.length > 0 && (
                              <div className="mt-1 flex gap-2">
                                {task.requiredDocs.map((doc, idx) => {
                                  const canon = findCanonicalDoc(doc);
                                  const uploaded = documents.find(d => {
                                    if (d.documentType === doc) return true;
                                    if (canon) {
                                      const uploadedCanon = findCanonicalDoc(d.documentType) || findCanonicalDoc(d.name);
                                      return uploadedCanon?.code === canon.code;
                                    }
                                    return false;
                                  });

                                  if (!uploaded) return null;
                                  return (
                                    <div key={idx} className="flex items-center gap-2">
                                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-bold py-0 h-5 px-2">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {doc} Obtained
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-slate-400 hover:text-indigo-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            api.viewEstateDocument(uploaded.documentType);
                                          }}
                                        >
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-slate-400 hover:text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMutation.mutate(uploaded.id);
                                          }}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Action Button (Legacy/Secondary) */}
                            {action && !isTaskCompleted && action.target !== 'none' && (
                              <Button
                                size="sm"
                                variant={action.variant === 'primary' ? 'default' : 'outline'}
                                onClick={() => handleTaskAction(task.id)}
                                className={cn("h-8 text-xs font-bold mt-2", isNext && "shadow-sm shadow-primary/20")}
                              >
                                {action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Discovered / Other Documents for this Phase */}
                    {documents.filter(d => {
                      const canon = findCanonicalDoc(d.documentType) || findCanonicalDoc(d.name);
                      if (canon) return false;
                      // Logic: If it's the 'court_filing' phase, show all OTHER/OTHER_DISCOVERY docs
                      // This is a simplification; ideally we'd map OTHER docs to phases too.
                      // For now, let's show them in the first active expanded phase.
                      return phase === 'court_filing';
                    }).length > 0 && (
                        <div className="p-3 bg-slate-50/30 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Documents</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {documents.filter(d => !findCanonicalDoc(d.documentType) && !findCanonicalDoc(d.name)).map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-white/80 rounded-xl border border-slate-200/60 shadow-sm text-xs group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="truncate font-bold text-slate-700">{doc.name || doc.documentType}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => api.viewEstateDocument(doc.documentType)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => deleteMutation.mutate(doc.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Phase Footer Action (Upload Miscellaneous) */}
                    <div className="p-3 bg-slate-50/50 flex justify-center border-t border-slate-100">
                      <div className="relative">
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest gap-2 hover:text-primary transition-colors h-7">
                          <FileUp className="w-3.5 h-3.5" /> Upload Miscellaneous
                        </Button>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const name = window.prompt("Enter a name for this document:");
                              if (name) handleDocumentUpload("OTHER", name, file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
