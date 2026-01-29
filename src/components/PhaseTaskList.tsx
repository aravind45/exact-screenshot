import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, FileText, AlertTriangle, Info, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SETTLEMENT_PHASE_TASKS, type PhaseTask } from "@/config/settlementPhases";
import type { SettlementPhase } from "@/components/SettlementPhaseChevron";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Eye, FileUp, Download, Loader2 as Spinner } from "lucide-react";

interface PhaseTaskListProps {
  phase: SettlementPhase;
  completedTaskIds?: string[];
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  className?: string;
}

export function PhaseTaskList({
  phase,
  completedTaskIds = [],
  onTaskToggle,
  className
}: PhaseTaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

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

      // Auto-sync roadmap if this doc matches a task
      // This is a bit more dynamic: if the task that contains this doc is not complete, complete it.
      // We look for the task in the current phase that listed this doc.
      const taskWithDoc = phaseData.tasks.find(t => t.requiredDocs?.includes(variables.type));
      if (taskWithDoc) {
        handleSyncRoadmap(taskWithDoc.id);
      }
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleDocumentUpload = async (type: string, name: string, file: File) => {
    uploadMutation.mutate({ type, name, file });
  };

  const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === phase);

  if (!phaseData) return null;

  const completedCount = phaseData.tasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalCount = phaseData.tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "important": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "caution": return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "info": return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "important": return "bg-red-50 border-red-200 text-red-900";
      case "warning": return "bg-amber-50 border-amber-200 text-amber-900";
      case "caution": return "bg-orange-50 border-orange-200 text-orange-900";
      case "info": return "bg-blue-50 border-blue-200 text-blue-900";
      default: return "bg-slate-50 border-slate-200 text-slate-900";
    }
  };

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            completedCount === totalCount ? "bg-green-100" : "bg-slate-100"
          )}>
            {completedCount === totalCount ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <span className="text-sm font-bold text-slate-700">{completedCount}/{totalCount}</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-900">{phaseData.title}</h3>
            <p className="text-[10px] text-slate-500">{phaseData.subtitle} • {phaseData.duration}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  completedCount === totalCount ? "bg-green-600" : "bg-indigo-600"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-600">{progressPercent}%</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {/* Phase Description */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <p className="text-[11px] text-slate-700 leading-relaxed">{phaseData.description}</p>
          </div>

          {/* Task List */}
          <div className="divide-y divide-slate-100">
            {phaseData.tasks.map((task) => {
              const isCompleted = completedTaskIds.includes(task.id);

              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={isCompleted}
                  onToggle={(completed) => onTaskToggle?.(task.id, completed)}
                  getAlertIcon={getAlertIcon}
                  getAlertColor={getAlertColor}
                  documents={documents}
                  onUpload={handleDocumentUpload}
                  isUploading={uploadMutation.isPending}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: PhaseTask;
  isCompleted: boolean;
  onToggle: (completed: boolean) => void;
  getAlertIcon: (type: string) => JSX.Element;
  getAlertColor: (type: string) => string;
  documents: any[];
  onUpload: (type: string, name: string, file: File) => void;
  isUploading: boolean;
}

function TaskItem({ task, isCompleted, onToggle, getAlertIcon, getAlertColor, documents, onUpload, isUploading }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(
      "p-3.5 transition-colors",
      isCompleted && "bg-green-50/30"
    )}>
      {/* Task Header */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle(checked === true)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 text-left group"
            >
              <h4 className={cn(
                "text-sm font-bold group-hover:text-indigo-600 transition-colors",
                isCompleted ? "text-slate-500 line-through" : "text-slate-900"
              )}>
                {task.title}
              </h4>
              <p className={cn(
                "text-xs mt-1",
                isCompleted ? "text-slate-400" : "text-slate-600"
              )}>
                {task.description}
              </p>
            </button>

            {task.estimatedTime && (
              <Badge variant="outline" className="text-[10px] font-bold text-slate-600 border-slate-200 flex-shrink-0">
                <Clock className="w-3 h-3 mr-1" />
                {task.estimatedTime}
              </Badge>
            )}
          </div>

          {!isCompleted && (
            <div className="mt-3 flex flex-wrap gap-2">
              {task.requiredDocs && task.requiredDocs.map((doc, idx) => {
                const uploaded = documents.find(d => d.documentType === doc);
                if (uploaded) return null;
                return (
                  <div key={idx} className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-black uppercase tracking-wider gap-1.5"
                    >
                      <FileUp className="w-3 h-3" />
                      Upload {doc}
                    </Button>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(doc, doc, file);
                      }}
                      disabled={isUploading}
                    />
                  </div>
                );
              })}

              {task.id === 'file_petition' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-[10px] bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-black uppercase tracking-wider gap-1.5"
                  onClick={() => window.location.href = '/probate'}
                >
                  <FileText className="w-3 h-3" />
                  Generate DE-111
                </Button>
              )}

              {task.links && task.links.map((link, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-[10px] bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-black uppercase tracking-wider gap-1.5"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                  {link.label}
                </Button>
              ))}
            </div>
          )}

          {isCompleted && task.requiredDocs && task.requiredDocs.length > 0 && (
            <div className="mt-2 flex gap-2">
              {task.requiredDocs.map((doc, idx) => {
                const uploaded = documents.find(d => d.documentType === doc);
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

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {/* Required Documents */}
              {task.requiredDocs && task.requiredDocs.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">Required Documents</span>
                  </div>
                  <ul className="space-y-2 mt-2">
                    {task.requiredDocs.map((doc, idx) => {
                      const uploadedDoc = documents.find(d => d.documentType === doc);
                      return (
                        <li key={idx} className="text-xs text-slate-600 flex items-center justify-between gap-2 p-2 bg-slate-100/50 rounded-lg border border-slate-200/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              uploadedDoc ? "bg-green-100" : "bg-slate-200"
                            )}>
                              <FileText className={cn("w-4 h-4", uploadedDoc ? "text-green-600" : "text-slate-500")} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn("font-bold", uploadedDoc ? "text-slate-900" : "text-slate-600")}>{doc}</span>
                                {uploadedDoc && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-none h-4 px-1 text-[8px] uppercase font-black tracking-tight">
                                    Obtained
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">Required Document</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {uploadedDoc ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-[10px] font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                                  onClick={() => window.open(api.getEstateDocumentDownloadUrl(doc), "_blank")}
                                >
                                  <Download className="w-3.5 h-3.5 mr-2" />
                                  Download
                                </Button>
                                <div className="relative">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                                    disabled={isUploading}
                                  >
                                    {isUploading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5 mr-1" />}
                                    Update
                                  </Button>
                                  <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) onUpload(doc, doc, file);
                                    }}
                                    disabled={isUploading}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="relative">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-[10px] font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                                  disabled={isUploading}
                                >
                                  {isUploading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5 mr-2" />}
                                  Upload
                                </Button>
                                <input
                                  type="file"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onUpload(doc, doc, file);
                                  }}
                                  disabled={isUploading}
                                />
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Alerts */}
              {task.alerts && task.alerts.length > 0 && (
                <div className="space-y-2">
                  {task.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-2",
                        getAlertColor(alert.type)
                      )}
                    >
                      {getAlertIcon(alert.type)}
                      <p className="text-xs flex-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Links */}
              {task.links && task.links.length > 0 && (
                <div className="space-y-2">
                  {task.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
