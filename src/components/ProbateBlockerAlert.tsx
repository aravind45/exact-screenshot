/**
 * Probate Blocker Alert
 * 
 * Displays a prominent alert when assets are blocked by missing
 * Letters Testamentary (DE-150).
 */

import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

export function ProbateBlockerAlert() {
  const { probateBlockers } = useWorkflow();
  const navigate = useNavigate();
  
  if (probateBlockers.length === 0) return null;
  
  return (
    <Alert variant="destructive" className="border-2 border-rose-300 bg-rose-50">
      <AlertTriangle className="h-5 w-5 text-rose-600" />
      <AlertTitle className="text-rose-900 font-bold text-base">
        Probate Blocker Detected
      </AlertTitle>
      <AlertDescription className="text-rose-800">
        <p className="mb-3 text-sm">
          <strong>{probateBlockers.length} asset{probateBlockers.length !== 1 ? 's are' : ' is'}</strong> blocked 
          until you receive <strong>Letters Testamentary (DE-150)</strong> from the court.
        </p>
        <p className="mb-4 text-xs text-rose-700">
          These assets have INDIVIDUAL ownership and require probate authority before you can access them.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => navigate('/probate?action=upload-letters')}
            className="bg-rose-600 hover:bg-rose-700 h-9"
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload Letters
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/assets?filter=blocked')}
            className="border-rose-300 text-rose-700 hover:bg-rose-100 h-9"
          >
            View Blocked Assets <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate('/probate')}
            className="text-rose-700 hover:bg-rose-100 h-9"
          >
            Go to Probate Hub
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
