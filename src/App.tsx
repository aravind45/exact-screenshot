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
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
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
import ProbateGuide from "./pages/guides/ProbateGuide";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import AcceptInvite from "./pages/AcceptInvite";
import EstateAgents from "./pages/EstateAgents";

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
                    <Route path="/asset/:id" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><AssetDetail /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/add-asset" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><AddAsset /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><UploadDocument /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate" element={<Navigate to="/roadmap" replace />} />
                    <Route path="/assets" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Assets /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/petition/wizard" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><PetitionWizard /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/settlement-trail" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><SettlementTrail /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/follow-ups" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><FollowUps /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/roadmap" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><SettlementRoadmapNew /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/roadmap-old" element={<ProtectedRoute><ProfileGuard><SettlementRoadmap /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/forms" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Forms /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/documents" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Documents /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileGuard><ProfileSettings /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><ProfileGuard><AdminDashboard /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/admin/institutions" element={<ProtectedRoute><ProfileGuard><AdminInstitutions /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/petition" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><ProbatePetition /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/liabilities" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Liabilities /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/inventory" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><InventoryAppraisal /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/notices" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Notices /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/inventory-generator" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><InventoryGenerator /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/closing-statement" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><ClosingStatement /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/distribution-petition" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><DistributionPetition /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/spousal-petition" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><SpousalPropertyPetition /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/succession-petition" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><SuccessionPetition /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/guardian-ad-litem" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><GuardianAdLitem /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/bond-waiver" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><BondWaiver /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/special-notice" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><SpecialNotice /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/contested-probate" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><ContestedProbate /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/asset-sale" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><AssetSaleAuthorization /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/final-distribution" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><FinalDistribution /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/small-estate" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><SmallEstateAffidavit /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/probate/letters" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Letters /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/discovery" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Discovery /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/distribution" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Distribution /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><ProfileGuard><Settings /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/pricing" element={<ProtectedRoute><ProfileGuard><Pricing /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/payment-success" element={<ProtectedRoute><ProfileGuard><PaymentSuccess /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/accounting" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Accounting /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/tax-management" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><TaxManagement /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/receipts" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Receipts /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/liabilities" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><Liabilities /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/non-probate" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><NonProbate /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/help" element={<ProtectedRoute><ProfileGuard><HelpCenter /></ProfileGuard></ProtectedRoute>} />
                    <Route path="/estate-agent" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><EstateAgentChatWrapper /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
                    <Route path="/guides/probate" element={<ProbateGuide />} />
                    <Route path="/invite/:token" element={<AcceptInvite />} />
                    <Route path="/estates/:estateId/agents" element={<ProtectedRoute><ProfileGuard><SubscriptionGuard><EstateAgents /></SubscriptionGuard></ProfileGuard></ProtectedRoute>} />
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
