/**
 * Diagnostic Result List Component
 * 
 * Displays a list of diagnostic violations with filtering and grouping.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, XCircle, Info, Lightbulb, Search, Filter, CheckCircle2 } from "lucide-react";
import type { Violation, DiagnosticResult } from "@/jurisdiction/diagnostics/types";

interface DiagnosticResultListProps {
  results: DiagnosticResult[];
}

type SeverityFilter = 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO';

export function DiagnosticResultList({ results }: DiagnosticResultListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [selectedPolicy, setSelectedPolicy] = useState<string | 'ALL'>('ALL');

  // Collect all violations
  const allViolations: Array<{ violation: Violation; policyName: string }> = [];
  for (const result of results) {
    for (const violation of result.violations) {
      allViolations.push({ violation, policyName: result.policyName });
    }
  }

  // Get unique policy names
  const policyNames = ['ALL', ...new Set(results.map(r => r.policyName))];

  // Filter violations
  const filteredViolations = allViolations.filter(({ violation, policyName }) => {
    // Severity filter
    if (severityFilter !== 'ALL' && violation.severity !== severityFilter) {
      return false;
    }

    // Policy filter
    if (selectedPolicy !== 'ALL' && policyName !== selectedPolicy) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        violation.message.toLowerCase().includes(search) ||
        violation.code.toLowerCase().includes(search) ||
        (violation.taskId && violation.taskId.toLowerCase().includes(search))
      );
    }

    return true;
  });

  // Group by severity
  const groupedBySeverity = {
    CRITICAL: filteredViolations.filter(v => v.violation.severity === 'CRITICAL'),
    WARNING: filteredViolations.filter(v => v.violation.severity === 'WARNING'),
    INFO: filteredViolations.filter(v => v.violation.severity === 'INFO'),
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const severityButtons: SeverityFilter[] = ['ALL', 'CRITICAL', 'WARNING', 'INFO'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search violations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {policyNames.map(name => (
              <option key={name} value={name}>
                {name === 'ALL' ? 'All Policies' : name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Severity Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {severityButtons.map((severity) => (
          <Button
            key={severity}
            variant={severityFilter === severity ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeverityFilter(severity)}
            className={severityFilter === severity ? '' : 'text-muted-foreground'}
          >
            {severity === 'ALL' ? 'All' : severity}
            <Badge variant="secondary" className="ml-2 text-xs">
              {severity === 'ALL' 
                ? allViolations.length 
                : allViolations.filter(v => v.violation.severity === severity).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Violations List */}
      {filteredViolations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">No violations found</p>
            <p className="text-sm text-muted-foreground">
              {allViolations.length === 0 
                ? "All policy checks passed!" 
                : "Try adjusting your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Critical Section */}
          {groupedBySeverity.CRITICAL.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Critical Violations ({groupedBySeverity.CRITICAL.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {groupedBySeverity.CRITICAL.map(({ violation, policyName }, index) => (
                    <AccordionItem key={`critical-${index}`} value={`critical-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge className={getSeverityBadgeColor(violation.severity)}>
                            {violation.code}
                          </Badge>
                          <span className="text-sm font-medium truncate max-w-md">
                            {violation.message}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ViolationDetails violation={violation} policyName={policyName} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Warning Section */}
          {groupedBySeverity.WARNING.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Warnings ({groupedBySeverity.WARNING.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {groupedBySeverity.WARNING.map(({ violation, policyName }, index) => (
                    <AccordionItem key={`warning-${index}`} value={`warning-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge className={getSeverityBadgeColor(violation.severity)}>
                            {violation.code}
                          </Badge>
                          <span className="text-sm font-medium truncate max-w-md">
                            {violation.message}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ViolationDetails violation={violation} policyName={policyName} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          {groupedBySeverity.INFO.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Info ({groupedBySeverity.INFO.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {groupedBySeverity.INFO.map(({ violation, policyName }, index) => (
                    <AccordionItem key={`info-${index}`} value={`info-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge className={getSeverityBadgeColor(violation.severity)}>
                            {violation.code}
                          </Badge>
                          <span className="text-sm font-medium truncate max-w-md">
                            {violation.message}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ViolationDetails violation={violation} policyName={policyName} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface ViolationDetailsProps {
  violation: Violation;
  policyName: string;
}

function ViolationDetails({ violation, policyName }: ViolationDetailsProps) {
  return (
    <div className="pl-4 border-l-2 border-muted space-y-3">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Policy</p>
        <p className="text-sm">{policyName}</p>
      </div>
      
      {violation.taskId && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Task ID</p>
          <code className="text-sm bg-muted px-2 py-1 rounded">{violation.taskId}</code>
        </div>
      )}

      {violation.context && Object.keys(violation.context).length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Context</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(violation.context, null, 2)}
          </pre>
        </div>
      )}

      {violation.suggestion && (
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Suggestion</p>
            <p className="text-sm">{violation.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
