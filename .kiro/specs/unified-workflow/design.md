# Unified Workflow Integration - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Dashboard                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Current Phase: Phase 1 - Court Filing              │  │
│  │  Progress: 3/5 tasks complete (60%)                 │  │
│  │  ⚠️  Probate Blocker: 3 assets waiting for Letters  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────┬──────────────┐
                            ▼                 ▼              ▼
                    ┌───────────────┐  ┌──────────┐  ┌──────────┐
                    │    Roadmap    │  │  Assets  │  │ Probate  │
                    │               │  │          │  │          │
                    │ Phase Cards   │  │ Filtered │  │ Wizard   │
                    │ + Tasks       │  │ by Phase │  │ + Status │
                    │ + Actions     │  │          │  │          │
                    └───────────────┘  └──────────┘  └──────────┘
                            │                 │              │
                            └─────────────────┴──────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │  Workflow Context     │
                            │  - Current Phase      │
                            │  - Active Filters     │
                            │  - Blockers           │
                            │  - Progress           │
                            └───────────────────────┘
```

---

## Data Model Changes

### 1. Asset Phase Calculation

Add computed field to Asset:

```typescript
// lib/assetPhase.ts
export type AssetPhaseStatus = 
  | 'immediate_actions'    // Just discovered
  | 'court_filing'         // Blocked by probate
  | 'asset_discovery'      // Ready for DOD values
  | 'creditor_claims'      // In review/claims
  | 'liquidation'          // Ready to sell
  | 'final_distribution';  // Distributed

export function calculateAssetPhase(
  asset: Asset, 
  estate: Estate
): AssetPhaseStatus {
  // Phase 0: Newly discovered
  if (asset.status === 'DISCOVERED') {
    return 'immediate_actions';
  }
  
  // Phase 1: Blocked by probate (INDIVIDUAL ownership only)
  if (asset.ownershipType === 'INDIVIDUAL' && !estate.lettersReceived) {
    return 'court_filing';
  }
  
  // Phase 2: Asset discovery (contacted, waiting for docs)
  if (['CONTACTED', 'NOTIFIED', 'PENDING_DOCUMENTS'].includes(asset.status)) {
    return 'asset_discovery';
  }
  
  // Phase 3: Creditor claims (in review)
  if (['IN_REVIEW', 'CLAIM_FILED', 'CLAIM_PENDING'].includes(asset.status)) {
    return 'creditor_claims';
  }
  
  // Phase 4: Liquidation (approved, ready to distribute)
  if (['APPROVED', 'READY_TO_DISTRIBUTE', 'PENDING_SALE'].includes(asset.status)) {
    return 'liquidation';
  }
  
  // Phase 5: Final distribution (done)
  if (['DISTRIBUTED', 'CLOSED'].includes(asset.status)) {
    return 'final_distribution';
  }
  
  return 'immediate_actions'; // Default fallback
}

export function getAssetsByPhase(
  assets: Asset[], 
  estate: Estate
): Record<AssetPhaseStatus, Asset[]> {
  const byPhase: Record<AssetPhaseStatus, Asset[]> = {
    immediate_actions: [],
    court_filing: [],
    asset_discovery: [],
    creditor_claims: [],
    liquidation: [],
    final_distribution: []
  };
  
  assets.forEach(asset => {
    const phase = calculateAssetPhase(asset, estate);
    byPhase[phase].push(asset);
  });
  
  return byPhase;
}
```

---

### 2. Phase Lock Logic

```typescript
// lib/phaseLock.ts
export interface PhaseLockStatus {
  isLocked: boolean;
  reason?: string;
  unlockAction?: {
    label: string;
    route: string;
  };
}

export function getPhaseLocksStatus(
  phase: SettlementPhase,
  estate: Estate,
  assets: Asset[]
): PhaseLockStatus {
  switch (phase) {
    case 'immediate_actions':
    case 'court_filing':
      return { isLocked: false }; // Always accessible
      
    case 'asset_discovery':
      if (!estate.lettersReceived) {
        return {
          isLocked: true,
          reason: 'Letters Testamentary (DE-150) required',
          unlockAction: {
            label: 'Upload Letters',
            route: '/probate?action=upload-letters'
          }
        };
      }
      return { isLocked: false };
      
    case 'creditor_claims':
      const discoveryComplete = assets.every(a => 
        !['DISCOVERED', 'CONTACTED', 'NOTIFIED'].includes(a.status)
      );
      if (!discoveryComplete) {
        return {
          isLocked: true,
          reason: 'Complete asset discovery first',
          unlockAction: {
            label: 'View Assets',
            route: '/assets?phase=asset_discovery'
          }
        };
      }
      return { isLocked: false };
      
    case 'liquidation':
      // Check if all claims resolved
      const claimsResolved = true; // TODO: Check liabilities
      if (!claimsResolved) {
        return {
          isLocked: true,
          reason: 'Resolve all creditor claims first',
          unlockAction: {
            label: 'View Claims',
            route: '/liabilities'
          }
        };
      }
      return { isLocked: false };
      
    case 'final_distribution':
      const liquidationComplete = assets.every(a =>
        ['DISTRIBUTED', 'CLOSED', 'READY_TO_DISTRIBUTE'].includes(a.status)
      );
      if (!liquidationComplete) {
        return {
          isLocked: true,
          reason: 'Complete liquidation first',
          unlockAction: {
            label: 'View Assets',
            route: '/assets?phase=liquidation'
          }
        };
      }
      return { isLocked: false };
      
    default:
      return { isLocked: false };
  }
}
```

---

### 3. Task Action Configuration

```typescript
// config/taskActions.ts
export interface TaskAction {
  type: 'navigate' | 'modal' | 'external';
  target: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export const TASK_ACTIONS: Record<string, TaskAction> = {
  // Phase 0
  'secure_property': {
    type: 'modal',
    target: 'property-checklist',
    label: 'Open Checklist',
    icon: 'CheckSquare'
  },
  'notify_ssa': {
    type: 'modal',
    target: 'ssa-notification',
    label: 'Notify SSA',
    icon: 'Send'
  },
  
  // Phase 1
  'file_de111': {
    type: 'navigate',
    target: '/probate/petition-wizard',
    label: 'Start Petition',
    icon: 'FileText',
    variant: 'primary'
  },
  'upload_letters': {
    type: 'modal',
    target: 'upload-letters',
    label: 'Upload Letters',
    icon: 'Upload',
    variant: 'primary'
  },
  'order_certified_copies': {
    type: 'modal',
    target: 'copy-tracker',
    label: 'Track Copies',
    icon: 'Copy'
  },
  
  // Phase 2
  'identify_accounts': {
    type: 'navigate',
    target: '/assets?action=add',
    label: 'Add Assets',
    icon: 'Plus'
  },
  'freeze_accounts': {
    type: 'navigate',
    target: '/assets?phase=asset_discovery&action=freeze',
    label: 'Freeze Accounts',
    icon: 'Lock',
    variant: 'primary'
  },
  'request_dod_values': {
    type: 'navigate',
    target: '/assets?phase=asset_discovery&filter=needs_dod',
    label: 'Get DOD Values',
    icon: 'DollarSign'
  },
  'generate_de160': {
    type: 'navigate',
    target: '/probate/inventory-generator',
    label: 'Generate DE-160',
    icon: 'FileText',
    variant: 'primary'
  },
  
  // Phase 3
  'review_claims': {
    type: 'navigate',
    target: '/liabilities?filter=pending',
    label: 'Review Claims',
    icon: 'AlertCircle'
  },
  'pay_priority_debts': {
    type: 'navigate',
    target: '/liabilities?filter=priority',
    label: 'Pay Debts',
    icon: 'CreditCard',
    variant: 'primary'
  },
  
  // Phase 4
  'file_tax_returns': {
    type: 'navigate',
    target: '/tax-management',
    label: 'File Taxes',
    icon: 'FileText'
  },
  'generate_accounting': {
    type: 'navigate',
    target: '/accounting',
    label: 'Generate Report',
    icon: 'BarChart'
  },
  
  // Phase 5
  'file_distribution_petition': {
    type: 'navigate',
    target: '/probate/distribution-petition',
    label: 'File Petition',
    icon: 'FileText',
    variant: 'primary'
  },
  'collect_receipts': {
    type: 'navigate',
    target: '/receipts',
    label: 'Track Receipts',
    icon: 'CheckCircle'
  }
};
```

---

## Component Architecture

### 1. Workflow Context Provider

```typescript
// contexts/WorkflowContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { calculateAssetPhase, getAssetsByPhase } from '@/lib/assetPhase';
import { getPhaseLocksStatus } from '@/lib/phaseLock';

interface WorkflowContextValue {
  currentPhase: SettlementPhase;
  setCurrentPhase: (phase: SettlementPhase) => void;
  assetsByPhase: Record<AssetPhaseStatus, Asset[]>;
  phaseLocks: Record<SettlementPhase, PhaseLockStatus>;
  probateBlockers: Asset[];
  phaseProgress: Record<SettlementPhase, { completed: number; total: number }>;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [currentPhase, setCurrentPhase] = useState<SettlementPhase>('immediate_actions');
  
  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate
  });
  
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets
  });
  
  // Calculate asset distribution by phase
  const assetsByPhase = getAssetsByPhase(assets, estate);
  
  // Calculate phase locks
  const phaseLocks = {
    immediate_actions: { isLocked: false },
    court_filing: { isLocked: false },
    asset_discovery: getPhaseLocksStatus('asset_discovery', estate, assets),
    creditor_claims: getPhaseLocksStatus('creditor_claims', estate, assets),
    liquidation: getPhaseLocksStatus('liquidation', estate, assets),
    final_distribution: getPhaseLocksStatus('final_distribution', estate, assets)
  };
  
  // Find probate blockers
  const probateBlockers = assets.filter(a => 
    a.ownershipType === 'INDIVIDUAL' && !estate?.lettersReceived
  );
  
  // Calculate phase progress
  const phaseProgress = calculatePhaseProgress(estate?.roadmapProgress);
  
  return (
    <WorkflowContext.Provider value={{
      currentPhase,
      setCurrentPhase,
      assetsByPhase,
      phaseLocks,
      probateBlockers,
      phaseProgress
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
}
```

---

### 2. Enhanced Phase Card Component

```typescript
// components/EnhancedPhaseCard.tsx
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle, ArrowRight } from 'lucide-react';

interface EnhancedPhaseCardProps {
  phase: SettlementPhase;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
}

export function EnhancedPhaseCard({ 
  phase, 
  title, 
  description, 
  isActive, 
  isCompleted 
}: EnhancedPhaseCardProps) {
  const { assetsByPhase, phaseLocks, phaseProgress, setCurrentPhase } = useWorkflow();
  const navigate = useNavigate();
  
  const assetCount = assetsByPhase[phase]?.length || 0;
  const lockStatus = phaseLocks[phase];
  const progress = phaseProgress[phase];
  
  const handleClick = () => {
    if (lockStatus.isLocked) {
      // Show unlock modal
      return;
    }
    setCurrentPhase(phase);
    navigate(`/roadmap?phase=${phase}`);
  };
  
  return (
    <div 
      className={cn(
        "relative p-6 rounded-2xl border-2 transition-all cursor-pointer",
        isActive && "border-primary bg-primary/5",
        isCompleted && "border-green-500 bg-green-50",
        lockStatus.isLocked && "opacity-60 cursor-not-allowed"
      )}
      onClick={handleClick}
    >
      {/* Lock Icon */}
      {lockStatus.isLocked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
      )}
      
      {/* Completed Icon */}
      {isCompleted && (
        <div className="absolute top-4 right-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      
      {/* Progress Bar */}
      {progress && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{progress.completed}/{progress.total} tasks</span>
            <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Asset Count Badge */}
      {assetCount > 0 && (
        <Badge variant="secondary" className="mb-3">
          {assetCount} asset{assetCount !== 1 ? 's' : ''} in this phase
        </Badge>
      )}
      
      {/* Lock Message */}
      {lockStatus.isLocked && lockStatus.reason && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
          <p className="text-xs text-amber-800 font-medium">{lockStatus.reason}</p>
          {lockStatus.unlockAction && (
            <Button 
              size="sm" 
              variant="link" 
              className="p-0 h-auto text-amber-900 font-bold mt-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(lockStatus.unlockAction!.route);
              }}
            >
              {lockStatus.unlockAction.label} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      )}
      
      {/* View Details Button */}
      {!lockStatus.isLocked && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/roadmap?phase=${phase}`);
          }}
        >
          View Tasks <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
```

---

### 3. Actionable Task Component

```typescript
// components/ActionableTask.tsx
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TASK_ACTIONS } from '@/config/taskActions';
import * as Icons from 'lucide-react';

interface ActionableTaskProps {
  taskId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  onToggle: (completed: boolean) => void;
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function ActionableTask({
  taskId,
  title,
  description,
  isCompleted,
  onToggle,
  estimatedTime,
  difficulty
}: ActionableTaskProps) {
  const navigate = useNavigate();
  const action = TASK_ACTIONS[taskId];
  
  const handleAction = () => {
    if (!action) return;
    
    if (action.type === 'navigate') {
      navigate(action.target);
    } else if (action.type === 'modal') {
      // Open modal (implement modal system)
      openModal(action.target);
    } else if (action.type === 'external') {
      window.open(action.target, '_blank');
    }
  };
  
  const Icon = action?.icon ? Icons[action.icon as keyof typeof Icons] : null;
  
  return (
    <div className={cn(
      "p-4 rounded-xl border-2 transition-all",
      isCompleted ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox 
          checked={isCompleted}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-semibold text-slate-900",
              isCompleted && "line-through text-slate-500"
            )}>
              {title}
            </h4>
            {estimatedTime && (
              <Badge variant="outline" className="text-xs">
                {estimatedTime}
              </Badge>
            )}
            {difficulty && (
              <Badge 
                variant={difficulty === 'hard' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {difficulty}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          
          {/* Action Button */}
          {action && !isCompleted && (
            <Button 
              size="sm" 
              variant={action.variant || 'default'}
              onClick={handleAction}
              className="gap-2"
            >
              {Icon && <Icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Probate Blocker Alert

```typescript
// components/ProbateBlockerAlert.tsx
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export function ProbateBlockerAlert() {
  const { probateBlockers } = useWorkflow();
  const navigate = useNavigate();
  
  if (probateBlockers.length === 0) return null;
  
  return (
    <Alert variant="destructive" className="border-2 border-rose-200 bg-rose-50">
      <AlertTriangle className="h-5 w-5 text-rose-600" />
      <AlertTitle className="text-rose-900 font-bold">
        Probate Blocker Detected
      </AlertTitle>
      <AlertDescription className="text-rose-800">
        <p className="mb-3">
          {probateBlockers.length} asset{probateBlockers.length !== 1 ? 's are' : ' is'} blocked 
          until you receive Letters Testamentary (DE-150).
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => navigate('/probate?action=upload-letters')}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Upload Letters <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/assets?filter=blocked')}
            className="border-rose-300 text-rose-700"
          >
            View Blocked Assets
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

---

### 5. Phase-Filtered Assets Page

```typescript
// pages/Assets.tsx (Enhanced)
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useSearchParams } from 'react-router-dom';

export default function Assets() {
  const [searchParams] = useSearchParams();
  const { assetsByPhase, currentPhase } = useWorkflow();
  
  const phaseFilter = searchParams.get('phase') as AssetPhaseStatus | null;
  const actionFilter = searchParams.get('filter'); // 'needs_dod', 'blocked', etc.
  
  // Filter assets
  let filteredAssets = assets;
  
  if (phaseFilter) {
    filteredAssets = assetsByPhase[phaseFilter] || [];
  }
  
  if (actionFilter === 'needs_dod') {
    filteredAssets = filteredAssets.filter(a => !a.dateOfDeathValue);
  } else if (actionFilter === 'blocked') {
    filteredAssets = filteredAssets.filter(a => 
      a.ownershipType === 'INDIVIDUAL' && !estate?.lettersReceived
    );
  } else if (actionFilter === 'needs_freeze') {
    filteredAssets = filteredAssets.filter(a => 
      a.status === 'DISCOVERED' || a.status === 'CONTACTED'
    );
  }
  
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64">
        {/* Breadcrumb */}
        {phaseFilter && (
          <div className="p-4 bg-white border-b">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/roadmap" className="text-primary hover:underline">
                Roadmap
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 font-medium">
                {PHASE_LABELS[phaseFilter]}
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600">
                {filteredAssets.length} Assets
              </span>
            </div>
          </div>
        )}
        
        {/* Rest of Assets page... */}
      </div>
    </div>
  );
}
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create WorkflowContext provider
- [ ] Implement asset phase calculation logic
- [ ] Implement phase lock logic
- [ ] Add task action configuration
- [ ] Update URL routing to support query params

### Phase 2: UI Components (Week 2)
- [ ] Build EnhancedPhaseCard component
- [ ] Build ActionableTask component
- [ ] Build ProbateBlockerAlert component
- [ ] Update PhaseTaskList with actions
- [ ] Add breadcrumb navigation

### Phase 3: Page Integration (Week 3)
- [ ] Update Dashboard with workflow context
- [ ] Update Roadmap page with enhanced cards
- [ ] Update Assets page with phase filtering
- [ ] Update Probate page with return navigation
- [ ] Add phase badges to asset cards

### Phase 4: Testing & Polish (Week 4)
- [ ] Test all navigation flows
- [ ] Test phase locking logic
- [ ] Test asset filtering
- [ ] Mobile responsiveness
- [ ] Accessibility audit

---

## Success Criteria

- [ ] Users can navigate from roadmap task → action → completion
- [ ] Assets page shows phase-filtered views
- [ ] Probate blockers are clearly visible
- [ ] Phase locks prevent premature access
- [ ] Progress indicators update in real-time
- [ ] All navigation maintains context

---

**Created**: January 27, 2026  
**Status**: Ready for Implementation
