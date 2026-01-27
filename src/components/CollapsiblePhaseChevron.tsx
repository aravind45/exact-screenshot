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
import { SETTLEMENT_PHASES } from '@/config/settlementPhases';
import { TASK_ACTIONS } from '@/config/taskActions';
import type { SettlementPhase } from './SettlementPhaseChevron';

interface CollapsiblePhaseChevronProps {
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

export function CollapsiblePhaseChevron({ onTaskToggle }: CollapsiblePhaseChevronProps) {
  const navigate = useNavigate();
  const { 
    currentPhase, 
    assetsByPhase, 
    phaseLocks, 
    phaseProgress,
    completedTaskIds,
    completedPhases 
  } = useWorkflow();
  
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
      {Object.entries(SETTLEMENT_PHASES).map(([phaseKey, phaseData]) => {
        const phase = phaseKey as SettlementPhase;
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
              className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
              disabled={lockStatus.isLocked}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : lockStatus.isLocked ? (
                    <Lock className="w-6 h-6 text-slate-400" />
                  ) : isCurrent ? (
                    <Circle className="w-6 h-6 text-primary fill-primary" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                
                {/* Phase Title & Progress */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-bold text-base",
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
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[200px]">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          isCompleted ? "bg-green-600" : "bg-primary"
                        )}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
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
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-600" />
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
                      
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-all",
                            isTaskCompleted ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:border-primary/30"
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
                            <h4 className={cn(
                              "text-sm font-semibold mb-1",
                              isTaskCompleted ? "line-through text-slate-500" : "text-slate-900"
                            )}>
                              {task.title}
                            </h4>
                            <p className="text-xs text-slate-600 mb-2">{task.description}</p>
                            
                            {/* Action Button */}
                            {action && !isTaskCompleted && (
                              <Button 
                                size="sm" 
                                variant={action.variant === 'primary' ? 'default' : 'outline'}
                                onClick={() => handleTaskAction(task.id)}
                                className="h-8 text-xs"
                              >
                                {action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
