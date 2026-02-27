/**
 * Jurisdiction Health Dashboard
 * 
 * Admin dashboard for monitoring jurisdiction compliance and health.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  Map, 
  FileDiff, 
  History,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { JurisdictionHealthCard } from "@/components/admin/JurisdictionHealthCard";
import { DiagnosticResultList } from "@/components/admin/DiagnosticResultList";
import { RoadmapPreviewPanel } from "@/components/admin/RoadmapPreviewPanel";
import { CountyOverrideManager } from "@/components/admin/CountyOverrideManager";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { JurisdictionHealthSummary } from "@/jurisdiction/diagnostics/types";

export default function JurisdictionHealthDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Fetch all jurisdiction health summaries
  const { 
    data: healthSummaries, 
    isLoading: summariesLoading,
    refetch: refetchSummaries,
  } = useQuery({
    queryKey: ["admin", "jurisdictions", "health"],
    queryFn: () => api.admin.getJurisdictionHealth(),
  });

  // Fetch detailed diagnostics for selected state
  const {
    data: diagnosticReport,
    isLoading: reportLoading,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["admin", "jurisdictions", selectedState, "diagnostics"],
    queryFn: () => api.admin.getStateDiagnostics(selectedState!),
    enabled: !!selectedState,
  });

  // Fetch diagnostic history for selected state
  const {
    data: diagnosticHistory,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ["admin", "jurisdictions", selectedState, "history"],
    queryFn: () => api.admin.getStateDiagnosticHistory(selectedState!),
    enabled: !!selectedState,
  });

  const handleRefresh = async () => {
    await refetchSummaries();
    if (selectedState) {
      await refetchReport();
    }
    toast({ title: "Refreshed", description: "Dashboard data has been updated." });
  };

  const getHealthStats = (summaries: JurisdictionHealthSummary[]) => {
    const healthy = summaries.filter(s => s.status === 'HEALTHY').length;
    const degraded = summaries.filter(s => s.status === 'DEGRADED').length;
    const critical = summaries.filter(s => s.status === 'CRITICAL').length;
    const total = summaries.length;
    const avgScore = total > 0 
      ? Math.round(summaries.reduce((sum, s) => sum + s.healthScore, 0) / total)
      : 0;

    return { healthy, degraded, critical, total, avgScore };
  };

  const stats = healthSummaries?.data ? getHealthStats(healthSummaries.data) : null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="section-container">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Admin
                </Button>
                <div className="h-6 w-px bg-border mx-2" />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <h1 className="font-bold text-lg tracking-tight">Jurisdiction Health</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="section-container py-8 space-y-8">
          {/* KPI Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="card-elevated border-none bg-green-50">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Healthy
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-700">
                    {stats.healthy}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="card-elevated border-none bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-yellow-600" /> Degraded
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-yellow-700">
                    {stats.degraded}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="card-elevated border-none bg-red-50">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Critical
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-700">
                    {stats.critical}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="card-elevated border-none">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Map className="w-4 h-4" /> Total States
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {stats.total}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="card-elevated border-none">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Avg Health
                  </CardDescription>
                  <CardTitle className={`text-3xl font-bold ${
                    stats.avgScore >= 90 ? 'text-green-600' : 
                    stats.avgScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.avgScore}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="overview">
                <Map className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="diagnostics">
                <Activity className="w-4 h-4 mr-2" />
                Diagnostics
              </TabsTrigger>
              <TabsTrigger value="preview">
                <FileDiff className="w-4 h-4 mr-2" />
                Roadmap Preview
              </TabsTrigger>
              <TabsTrigger value="overrides">
                <History className="w-4 h-4 mr-2" />
                County Overrides
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Jurisdiction Health Overview</CardTitle>
                  <CardDescription>
                    Click on a jurisdiction to view detailed diagnostics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summariesLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : healthSummaries?.data?.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No jurisdiction data available</p>
                      <p className="text-sm text-muted-foreground">
                        Run diagnostics to populate the dashboard
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {healthSummaries?.data?.map((summary) => (
                        <JurisdictionHealthCard
                          key={summary.stateCode}
                          {...summary}
                          onClick={() => {
                            setSelectedState(summary.stateCode);
                            setActiveTab("diagnostics");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagnostics Tab */}
            <TabsContent value="diagnostics" className="mt-6">
              <div className="space-y-6">
                {/* State Selector */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium">Select State:</label>
                      <select
                        value={selectedState || ''}
                        onChange={(e) => setSelectedState(e.target.value || null)}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select a state...</option>
                        {healthSummaries?.data?.map((summary) => (
                          <option key={summary.stateCode} value={summary.stateCode}>
                            {summary.stateCode} - {summary.stateName}
                          </option>
                        ))}
                      </select>
                      {selectedState && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => refetchReport()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Re-run Diagnostics
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Diagnostic Results */}
                {selectedState ? (
                  reportLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : diagnosticReport ? (
                    <div className="space-y-6">
                      {/* Summary Header */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{selectedState} Diagnostics</CardTitle>
                              <CardDescription>
                                Health Score: {diagnosticReport.healthScore}/100
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={diagnosticReport.passed ? "default" : "destructive"}
                              className="text-lg px-4 py-2"
                            >
                              {diagnosticReport.passed ? 'PASS' : 'FAIL'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-red-50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {diagnosticReport.totalViolations.CRITICAL}
                              </div>
                              <div className="text-sm text-red-700">Critical</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600">
                                {diagnosticReport.totalViolations.WARNING}
                              </div>
                              <div className="text-sm text-yellow-700">Warnings</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {diagnosticReport.totalViolations.INFO}
                              </div>
                              <div className="text-sm text-blue-700">Info</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Violations List */}
                      <DiagnosticResultList results={diagnosticReport.policyResults} />

                      {/* History */}
                      {diagnosticHistory && diagnosticHistory.data.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Diagnostic History</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {diagnosticHistory.data.slice(0, 10).map((run: { createdAt: string; healthScore: number; criticalCount: number; overallStatus: string }) => (
                                <div
                                  key={run.createdAt}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {new Date(run.createdAt).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Score: {run.healthScore} | Critical: {run.criticalCount}
                                    </p>
                                  </div>
                                  <Badge variant={run.overallStatus === 'PASS' ? 'default' : 'destructive'}>
                                    {run.overallStatus}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : null
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Select a state</p>
                      <p className="text-sm text-muted-foreground">
                        Choose a state from the dropdown above to view diagnostics
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-6">
              <RoadmapPreviewPanel defaultStateCode={selectedState || 'CA'} />
            </TabsContent>

            {/* Overrides Tab */}
            <TabsContent value="overrides" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>County Override Governance</CardTitle>
                  <CardDescription>
                    Review and approve county-specific task overrides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CountyOverrideManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
