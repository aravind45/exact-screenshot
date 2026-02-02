/**
 * Probate Blocker Alert
 * 
 * Displays a prominent alert when assets are blocked by missing
 * Letters Testamentary (DE-150).
 */

import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ArrowRight, FileText } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getPrimaryAuthorityDocName } from '@/config/settlementStages';

export function ProbateBlockerAlert() {
  const { probateBlockers } = useWorkflow();
  const navigate = useNavigate();

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
  });

  if (probateBlockers.length === 0) return null;

  const track = (estate?.estateType || 'FORMAL_PROBATE') as any;
  const stateCode = estate?.deceasedState || 'CA';

  const getBlockerConfig = () => {
    const docName = getPrimaryAuthorityDocName(stateCode, track);

    switch (track) {
      case 'SMALL_ESTATE':
        return {
          title: 'Small Estate Blocker',
          docName,
          description: `These assets require a notarized ${docName} before you can collect them.`,
          actionLabel: 'Go to Vault',
          actionRoute: '/vault'
        };
      case 'TRUST_ADMIN':
        return {
          title: 'Trust Authority Blocker',
          docName,
          description: 'These assets are titled in the Trust and require a Certification of Trust for access.',
          actionLabel: 'Go to Documents',
          actionRoute: '/vault'
        };
      case 'SPOUSAL_PETITION':
        return {
          title: 'Spousal Order Required',
          docName,
          description: `These assets require a ${docName} from the court.`,
          actionLabel: 'Probate Hub',
          actionRoute: '/probate'
        };
      default:
        return {
          title: 'Authority Support Required',
          docName,
          description: `These assets require probate authority (${docName}) to complete the transfer process.`,
          actionLabel: 'Finalize Documents',
          actionRoute: '/probate?action=upload-letters'
        };
    }
  };

  const config = getBlockerConfig();

  return (
    <Alert variant="default" className="border border-indigo-200 bg-indigo-50/50 rounded-xl py-2 px-3">
      <Info className="h-4 w-4 text-indigo-600" />
      <div className="ml-2">
        <AlertTitle className="text-indigo-900 font-black text-xs tracking-tight">
          {config.title}
        </AlertTitle>
        <AlertDescription className="text-indigo-800">
          <p className="mb-1 text-[10px] font-medium">
            <strong className="font-black">{probateBlockers.length} asset{probateBlockers.length !== 1 ? 's are' : ' is'}</strong> awaiting your <strong className="font-bold text-indigo-900">{config.docName}</strong> to finalize ownership.
          </p>
          <p className="mb-2 text-[10px] text-indigo-600/70 font-medium">
            {config.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate(config.actionRoute)}
              className="bg-indigo-600 hover:bg-indigo-700 h-7 font-black px-2 text-[10px] uppercase tracking-wider text-white border-none"
            >
              <FileText className="w-3 h-3 mr-1" />
              {config.actionLabel}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/assets?filter=blocked')}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-100 h-7 font-black px-2 text-[10px] uppercase tracking-wider"
            >
              View Asset List <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}
