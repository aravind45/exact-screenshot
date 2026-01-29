/**
 * Collapsible Phase Chevron
 * 
 * An accordion-style roadmap that shows all 6 phases with expandable
 * task lists. Completed phases collapse, current phase expands, future
 * phases show lock status.
 */

import { useState } from 'react';
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
import type { SettlementPhase } from './SettlementPhaseChevron';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DOCUMENT_REGISTRY, findCanonicalDoc } from "@/config/documents";
import { FileUp, FileText, CheckCircle2, Download, Trash2, Loader2 as Spinner } from "lucide-react";

interface CollapsiblePhaseChevronProps {
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

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

  const handleSyncRoadmap = async (roadmapId: string) => {
    try {
      if (!estate) return;
      const currentCompletedIds = estate.roadmapProgress?.completedTaskIds || [];
      if (!currentCompletedIds.includes(roadmapId)) {
        const newIds = [...currentCompletedIds, roadmapId];
        await api.updateRoadmap({
          completedTaskIds: newIds,
          completedPhases: estate.roadmapProgress?.completedPhases || [],
          taskId: roadmapId,
          action: 'COMPLETED'
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
      for (const p of SETTLEMENT_PHASE_TASKS) {
        const taskWithDoc = p.tasks.find(t => t.requiredDocs?.includes(variables.type));
        if (taskWithDoc) {
          handleSyncRoadmap(taskWithDoc.id);
          break;
        }
      }
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
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

  return (
    <div className="space-y-3">
      {SETTLEMENT_PHASE_TASKS.map((phaseData) => {
        const phase = phaseData.phase;
        const isExpanded = expandedPhases.has(phase);
        const isCompleted = completedPhases.includes(phase);
        const isCurrent = phase === currentPhase;
        const lockStatus = phaseLocks[phase];
        const progress = phaseProgress[phase];
        const assetCount = assetsByPhase[phase]?.length || 0;

        return (
          <div
            key={phase}
            className={cn(
              "rounded-2xl border-2 overflow-hidden transition-all",
              isCompleted && "border-green-500 bg-green-50/50",
              isCurrent && !isCompleted && "border-primary bg-primary/5",
              lockStatus.isLocked && "border-slate-200 bg-slate-50/50",
              !isCompleted && !isCurrent && !lockStatus.isLocked && "border-slate-200 bg-white"
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
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : lockStatus.isLocked ? (
                    <Lock className="w-5 h-5 text-slate-400" />
                  ) : isCurrent ? (
                    <Circle className="w-5 h-5 text-primary fill-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                {/* Phase Title & Progress */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-bold text-sm",
                      isCompleted && "text-green-900",
                      isCurrent && !isCompleted && "text-primary",
                      lockStatus.isLocked && "text-slate-500"
                    )}>
                      {phaseData.title}
                    </h3>
                    {isCurrent && !isCompleted && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden max-w-[150px]">
                      <div
                        className={cn(
                          "h-full transition-all",
                          isCompleted ? "bg-green-600" : "bg-primary"
                        )}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">
                      {progress.completed}/{progress.total}
                    </span>
                    {assetCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
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

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-2.5 p-2.5 rounded-lg border transition-all",
                            isTaskCompleted
                              ? "bg-green-50 border-green-200"
                              : task.category === 'probate'
                                ? "bg-amber-50 border-amber-200 hover:border-amber-400"
                                : task.category === 'court-issued'
                                  ? "bg-violet-50 border-violet-200 hover:border-violet-400"
                                  : "bg-white border-slate-200 hover:border-primary/30",
                            isNext && "ring-2 ring-primary/20 border-primary shadow-sm"
                          )}
                        >
                          {/* Checkbox */}
                          <Checkbox
                            checked={isTaskCompleted}
                            onCheckedChange={(checked) => onTaskToggle(task.id, !!checked)}
                            className="mt-0.5"
                          />

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-semibold",
                                isTaskCompleted ? "line-through text-slate-500" : "text-slate-900"
                              )}>
                                {task.title}
                              </h4>
                              {isNext && <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-black uppercase h-4 px-1">Next Step</Badge>}
                            </div>
                            <p className="text-xs text-slate-600 mb-2">{task.description}</p>

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
                                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-bold py-0 h-6">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      {doc} Obtained
                                    </Badge>
                                  );

                                  return (
                                    <div key={idx} className="relative">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold uppercase tracking-tight gap-1.5"
                                      >
                                        <FileUp className="w-3 h-3" />
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
                                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-bold py-0 h-5">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      {doc} Obtained
                                    </Badge>
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
