/**
 * Integrity Dashboard
 * 
 * Admin dashboard for monitoring and managing roadmap integrity scans.
 * Provides visibility into scan history, findings, and remediation guidance.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  Play, 
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SUPPORTED_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NY', name: 'New York' },
  { code: 'OH', name: 'Ohio' },
  { code: 'TX', name: 'Texas' },
];

export default function IntegrityDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Fetch scan runs
  const { 
    data: scanRunsData, 
    isLoading: runsLoading,
    refetch: refetchRuns,
  } = useQuery({
    queryKey: ["admin", "integrity", "runs"],
    queryFn: () => api.admin.integrity.getScanRuns(50),
  });

  const scanRuns = scanRunsData?.data || [];

  // Get latest run
  const latestRun = scanRuns[0];

  // Run scan mutation
  const runScanMutation = useMutation({
    mutationFn: async (stateCode?: string) => {
      return api.admin.integrity.runScan(stateCode ? { stateCode } : undefined);
    },
    onSuccess: (result) => {
      toast({ 
        title: "Scan Completed", 
        description: `Scan ${result.report.overallStatus} with ${result.report.totalFindings.BLOCKER} blockers`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "integrity", "runs"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Scan Failed", 
        description: error.message || "Failed to run integrity scan",
        variant: "destructive",
      });
    },
  });

  const handleRunScan = (stateCode?: string) => {
    runScanMutation.mutate(stateCode);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Passed</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityCount = (run: any, severity: string) => {
    switch (severity) {
      case 'BLOCKER': return run.blockerCount;
      case 'CRITICAL': return run.criticalCount;
      case 'WARNING': return run.warningCount;
      case 'INFO': return run.infoCount;
      default: return 0;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="section-container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">State Integrity Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Monitor and manage roadmap integrity across all states
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchRuns()}
                  disabled={runsLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${runsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRunScan()}
                  disabled={runScanMutation.isPending}
                >
                  {runScanMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Run Full Scan
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="section-container py-8">
            {/* Latest Scan Status */}
            {latestRun && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Latest Scan Results
                  </CardTitle>
                  <CardDescription>
                    Scan completed {new Date(latestRun.completedAt || latestRun.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Overall Status</p>
                        <p className="text-lg font-bold">{getStatusBadge(latestRun.overallStatus)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Passed Checks</p>
                        <p className="text-lg font-bold">{latestRun.passedChecks}/{latestRun.totalChecks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-50">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Blockers</p>
                        <p className="text-lg font-bold text-red-600">{latestRun.blockerCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-50">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Critical</p>
                        <p className="text-lg font-bold text-orange-600">{latestRun.criticalCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-lg font-bold">{(latestRun.durationMs / 1000).toFixed(2)}s</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="states">State Status</TabsTrigger>
                <TabsTrigger value="history">Scan History</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{scanRuns.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Passed Scans</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">
                        {scanRuns.filter(r => r.overallStatus === 'PASSED').length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Failed Scans</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-red-600">
                        {scanRuns.filter(r => r.overallStatus === 'FAILED').length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {scanRuns.reduce((sum, r) => sum + r.blockerCount + r.criticalCount + r.warningCount + r.infoCount, 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Scans */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Scan Runs</CardTitle>
                    <CardDescription>Latest integrity scan results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scanRuns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No scan runs yet. Click "Run Full Scan" to get started.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {scanRuns.slice(0, 10).map((run) => (
                          <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              {getStatusBadge(run.overallStatus)}
                              <div>
                                <p className="font-medium">
                                  {run.scanType === 'FULL' ? 'Full Scan' : `State: ${run.stateCode}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(run.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-bold">{run.blockerCount}</span>
                                <span className="text-muted-foreground">Blockers</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-orange-600 font-bold">{run.criticalCount}</span>
                                <span className="text-muted-foreground">Critical</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-600 font-bold">{run.warningCount}</span>
                                <span className="text-muted-foreground">Warnings</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* State Status Tab */}
              <TabsContent value="states" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SUPPORTED_STATES.map((state) => (
                    <Card key={state.code} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{state.name}</CardTitle>
                          <Badge variant="outline">{state.code}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            {getStatusBadge('NEVER_RUN')}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Scan</span>
                            <span>Never</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleRunScan(state.code)}
                            disabled={runScanMutation.isPending}
                          >
                            Run Scan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Scan History</CardTitle>
                    <CardDescription>All integrity scan runs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scanRuns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No scan runs yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {scanRuns.map((run) => (
                          <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {run.scanType === 'FULL' ? 'Full Scan' : `State Scan: ${run.stateCode}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(run.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(run.overallStatus)}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-red-600 font-bold">{run.blockerCount}B</span>
                                <span className="text-orange-600 font-bold">{run.criticalCount}C</span>
                                <span className="text-yellow-600 font-bold">{run.warningCount}W</span>
                              </div>
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {(run.durationMs / 1000).toFixed(2)}s
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
