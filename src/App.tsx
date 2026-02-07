import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileGuard } from "@/components/ProfileGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AssetDetail from "./pages/AssetDetail";
import AddAsset from "./pages/AddAsset";
import UploadDocument from "./pages/UploadDocument";
import ProfileSettings from "./pages/ProfileSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminInstitutions from "./pages/admin/AdminInstitutions";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import PetitionWizard from "./pages/probate/PetitionWizard";
import Inbox from "./pages/Inbox";
import FollowUps from "./pages/FollowUps";
import OnboardingWizard from "./pages/OnboardingWizard";
import Assets from "./pages/Assets";
import SettlementRoadmap from "./pages/SettlementRoadmap";
import SettlementRoadmapNew from "./pages/SettlementRoadmapNew";
import Settings from "./pages/Settings";
import ProbatePetition from "./pages/ProbatePetition";
import InventoryAppraisal from "./pages/probate/InventoryAppraisal";
import Notices from "./pages/probate/Notices";
import Discovery from "./pages/Discovery";
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
import SuccessionPetition from "./pages/SuccessionPetition";
import GuardianAdLitem from "./pages/GuardianAdLitem";
import BondWaiver from "./pages/BondWaiver";
import SpecialNotice from "./pages/SpecialNotice";
import ContestedProbate from "./pages/ContestedProbate";
import AssetSaleAuthorization from "./pages/AssetSaleAuthorization";
import FinalDistribution from "./pages/FinalDistribution";
import SmallEstateAffidavit from "./pages/SmallEstateAffidavit";
import HelpCenter from "./pages/HelpCenter";
import SettlementTrail from "./pages/SettlementTrail";
import Letters from "./pages/probate/Letters";
import Forms from "./pages/Forms";
import { HelmetProvider } from "react-helmet-async";
import { EstateAgentChatWrapper } from "@/components/EstateAgentChatWrapper";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import CaliforniaProbateGuide from "./pages/guides/CaliforniaProbateGuide";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
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
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <OnboardingWizard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/dashboard" element={<ProtectedRoute><ProfileGuard><Dashboard /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/asset/:id" element={<ProtectedRoute><ProfileGuard><AssetDetail /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/add-asset" element={<ProtectedRoute><ProfileGuard><AddAsset /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute><ProfileGuard><UploadDocument /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate" element={<Navigate to="/roadmap" replace />} />
                    <Route path="/assets" element={<ProtectedRoute><ProfileGuard><Assets /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/petition/wizard" element={<ProtectedRoute><ProfileGuard><PetitionWizard /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/settlement-trail" element={<ProtectedRoute><ProfileGuard><SettlementTrail /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/follow-ups" element={<ProtectedRoute><ProfileGuard><FollowUps /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/roadmap" element={<ProtectedRoute><ProfileGuard><SettlementRoadmapNew /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/roadmap-old" element={<ProtectedRoute><ProfileGuard><SettlementRoadmap /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/forms" element={<ProtectedRoute><ProfileGuard><Forms /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/documents" element={<ProtectedRoute><ProfileGuard><Documents /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileGuard><ProfileSettings /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><ProfileGuard><AdminDashboard /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/admin/institutions" element={<ProtectedRoute><ProfileGuard><AdminInstitutions /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/petition" element={<ProtectedRoute><ProfileGuard><ProbatePetition /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/liabilities" element={<ProtectedRoute><ProfileGuard><Liabilities /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/inventory" element={<ProtectedRoute><ProfileGuard><InventoryAppraisal /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/notices" element={<ProtectedRoute><ProfileGuard><Notices /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/inventory-generator" element={<ProtectedRoute><ProfileGuard><InventoryGenerator /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/closing-statement" element={<ProtectedRoute><ProfileGuard><ClosingStatement /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/distribution-petition" element={<ProtectedRoute><ProfileGuard><DistributionPetition /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/spousal-petition" element={<ProtectedRoute><ProfileGuard><SpousalPropertyPetition /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/succession-petition" element={<ProtectedRoute><ProfileGuard><SuccessionPetition /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/guardian-ad-litem" element={<ProtectedRoute><ProfileGuard><GuardianAdLitem /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/bond-waiver" element={<ProtectedRoute><ProfileGuard><BondWaiver /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/special-notice" element={<ProtectedRoute><ProfileGuard><SpecialNotice /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/contested-probate" element={<ProtectedRoute><ProfileGuard><ContestedProbate /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/asset-sale" element={<ProtectedRoute><ProfileGuard><AssetSaleAuthorization /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/final-distribution" element={<ProtectedRoute><ProfileGuard><FinalDistribution /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/small-estate" element={<ProtectedRoute><ProfileGuard><SmallEstateAffidavit /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/letters" element={<ProtectedRoute><ProfileGuard><Letters /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/discovery" element={<ProtectedRoute><ProfileGuard><Discovery /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/distribution" element={<ProtectedRoute><ProfileGuard><Distribution /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><ProfileGuard><Settings /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/pricing" element={<ProtectedRoute><ProfileGuard><Pricing /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/accounting" element={<ProtectedRoute><ProfileGuard><Accounting /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/tax-management" element={<ProtectedRoute><ProfileGuard><TaxManagement /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/receipts" element={<ProtectedRoute><ProfileGuard><Receipts /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/liabilities" element={<ProtectedRoute><ProfileGuard><Liabilities /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/non-probate" element={<ProtectedRoute><ProfileGuard><NonProbate /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/help" element={<ProtectedRoute><ProfileGuard><HelpCenter /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/estate-agent" element={<ProtectedRoute><ProfileGuard><EstateAgentChatWrapper /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/guides/california-probate" element={<CaliforniaProbateGuide />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <LegalDisclaimer />
                </WorkflowProvider>
              </AuthProvider>
            </NavigationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
