/**
 * Jurisdiction Health Card Component
 * 
 * Displays a summary card for a single jurisdiction with health score and status.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export interface JurisdictionHealthCardProps {
  stateCode: string;
  stateName: string;
  healthScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  lastDiagnosticRun: string;
  totalViolations: number;
  criticalViolations: number;
  pendingOverrides: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  onClick?: () => void;
}

export function JurisdictionHealthCard({
  stateCode,
  stateName,
  healthScore,
  status,
  lastDiagnosticRun,
  totalViolations,
  criticalViolations,
  pendingOverrides,
  trend,
  onClick,
}: JurisdictionHealthCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'DECLINING':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'STABLE':
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScoreColor = () => {
    if (healthScore >= 90) return 'text-green-600';
    if (healthScore >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${onClick ? 'hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{stateCode}</CardTitle>
            <p className="text-sm text-muted-foreground">{stateName}</p>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${getScoreColor()}`}>
              {healthScore}
            </div>
            <p className="text-xs text-muted-foreground">Health Score</p>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground">{trend.toLowerCase()}</span>
          </div>
        </div>

        {/* Violations */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            {criticalViolations > 0 ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            <span className={criticalViolations > 0 ? 'text-red-600 font-medium' : ''}>
              {criticalViolations} Critical
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>{totalViolations - criticalViolations} Other</span>
          </div>
        </div>

        {/* Pending Overrides */}
        {pendingOverrides > 0 && (
          <div className="text-sm">
            <Badge variant="secondary" className="text-xs">
              {pendingOverrides} pending override{pendingOverrides > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Last Run */}
        <p className="text-xs text-muted-foreground">
          Last checked: {formatDate(lastDiagnosticRun)}
        </p>
      </CardContent>
    </Card>
  );
}
