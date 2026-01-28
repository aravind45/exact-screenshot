import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AssetDetail from "./pages/AssetDetail";
import AddAsset from "./pages/AddAsset";
import UploadDocument from "./pages/UploadDocument";
import ProfileSettings from "./pages/ProfileSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminInstitutions from "./pages/admin/AdminInstitutions";
import Discovery from "./pages/Discovery";
import Probate from "./pages/Probate";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import PetitionWizard from "./pages/probate/PetitionWizard";
import Inbox from "./pages/Inbox";
import FollowUps from "./pages/FollowUps";
import OnboardingWizard from "./pages/OnboardingWizard";
import Assets from "./pages/Assets";
import SettlementRoadmap from "./pages/SettlementRoadmap";
import SettlementRoadmapNew from "./pages/SettlementRoadmapNew";
import ProbatePetition from "./pages/ProbatePetition";
import Liabilities from "./pages/Liabilities";
import Accounting from "./pages/Accounting";
import TaxManagement from "./pages/TaxManagement";
import InventoryGenerator from "./pages/InventoryGenerator";
import Distribution from "./pages/Distribution";
import Receipts from "./pages/Receipts";
import ClosingStatement from "./pages/ClosingStatement";
import DistributionPetition from "./pages/DistributionPetition";
import NonProbate from "./pages/NonProbate";
import SpousalPropertyPetition from "./pages/SpousalPropertyPetition";
import { EstateAgentChatWrapper } from "@/components/EstateAgentChatWrapper";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavigationProvider>
            <AuthProvider>
              <WorkflowProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingWizard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/asset/:id"
                    element={
                      <ProtectedRoute>
                        <AssetDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-asset"
                    element={
                      <ProtectedRoute>
                        <AddAsset />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute>
                        <UploadDocument />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/discovery"
                    element={
                      <ProtectedRoute>
                        <Discovery />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/probate"
                    element={
                      <ProtectedRoute>
                        <Probate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assets"
                    element={
                      <ProtectedRoute>
                        <Assets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/probate/petition/wizard"
                    element={
                      <ProtectedRoute>
                        <PetitionWizard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inbox"
                    element={
                      <ProtectedRoute>
                        <Inbox />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/follow-ups"
                    element={
                      <ProtectedRoute>
                        <FollowUps />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roadmap"
                    element={
                      <ProtectedRoute>
                        <SettlementRoadmapNew />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roadmap-old"
                    element={
                      <ProtectedRoute>
                        <SettlementRoadmap />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documents"
                    element={
                      <ProtectedRoute>
                        <Documents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfileSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/institutions"
                    element={
                      <ProtectedRoute>
                        <AdminInstitutions />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/probate/petition" element={<ProtectedRoute><ProbatePetition /></ProtectedRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route
                    path="/liabilities"
                    element={
                      <ProtectedRoute>
                        <Liabilities />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting"
                    element={
                      <ProtectedRoute>
                        <Accounting />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tax-management"
                    element={
                      <ProtectedRoute>
                        <TaxManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/probate/inventory-generator"
                    element={
                      <ProtectedRoute>
                        <InventoryGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/distribution"
                    element={
                      <ProtectedRoute>
                        <Distribution />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts"
                    element={
                      <ProtectedRoute>
                        <Receipts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/probate/closing-statement"
                    element={
                      <ProtectedRoute>
                        <ClosingStatement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/probate/distribution-petition"
                    element={
                      <ProtectedRoute>
                        <DistributionPetition />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/non-probate"
                    element={
                      <ProtectedRoute>
                        <NonProbate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/probate/spousal-petition"
                    element={
                      <ProtectedRoute>
                        <SpousalPropertyPetition />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <EstateAgentChatWrapper />
              </WorkflowProvider>
            </AuthProvider>
          </NavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
