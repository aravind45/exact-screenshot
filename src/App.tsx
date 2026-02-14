import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRoute } from "@/components/RoleRoute";
import { ProfileGuard } from "@/components/ProfileGuard";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import AdvisorLayout from '@/components/AdvisorLayout';

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import OnboardingWizard from "./pages/OnboardingWizard";

// Assets & Documents
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import AddAsset from "./pages/AddAsset";
import UploadDocument from "./pages/UploadDocument";
import Documents from "./pages/Documents";

// Estate Management
// import EstateOverview from "./pages/EstateOverview";
import SettlementRoadmap from "./pages/SettlementRoadmap";
import SettlementRoadmapNew from "./pages/SettlementRoadmapNew";
import SettlementTrail from "./pages/SettlementTrail";
import Inbox from "./pages/Inbox";
import FollowUps from "./pages/FollowUps";
// import Communications from "./pages/Communications";
// import Collaboration from "./pages/Collaboration";
// import Heirs from "./pages/Heirs";
import Forms from "./pages/Forms";
import HelpCenter from "./pages/HelpCenter";
// import Feed from "./pages/Feed";

// Profile & Settings
import ProfileSettings from "./pages/ProfileSettings";
import Settings from "./pages/Settings";

// Probate Toolset
import PetitionWizard from "./pages/probate/PetitionWizard";
import ProbatePetition from "./pages/ProbatePetition";
import InventoryAppraisal from "./pages/probate/InventoryAppraisal";
import Notices from "./pages/probate/Notices";
import InventoryGenerator from "./pages/InventoryGenerator";
import ClosingStatement from "./pages/ClosingStatement";
import DistributionPetition from "./pages/DistributionPetition";
import SpousalPropertyPetition from "./pages/SpousalPropertyPetition";
import SuccessionPetition from "./pages/SuccessionPetition";
import GuardianAdLitem from "./pages/GuardianAdLitem";
import BondWaiver from "./pages/BondWaiver";
import SpecialNotice from "./pages/SpecialNotice";
import ContestedProbate from "./pages/ContestedProbate";
import AssetSaleAuthorization from "./pages/AssetSaleAuthorization";
import FinalDistribution from "./pages/FinalDistribution";
import SmallEstateAffidavit from "./pages/SmallEstateAffidavit";
import Letters from "./pages/probate/Letters";
import Discovery from "./pages/Discovery";
import Liabilities from "./pages/Liabilities";
import Accounting from "./pages/Accounting";
import TaxManagement from "./pages/TaxManagement";
import Receipts from "./pages/Receipts";
import Distribution from "./pages/Distribution";
import NonProbate from "./pages/NonProbate";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminInstitutions from "./pages/admin/AdminInstitutions";

// Advisor
import AdvisorDashboard from "./pages/advisor/Dashboard";
import AdvisorOnboarding from "./pages/advisor/Onboarding";
import AdvisorBookings from "./pages/advisor/Bookings";
import AdvisorMarketplace from "./pages/AdvisorMarketplace";
import AdvisorPayouts from "./pages/AdvisorPayouts";
import MyBookings from "./pages/MyBookings";

// Others
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import AcceptInvite from "./pages/AcceptInvite";
import EstateAgents from "./pages/EstateAgents";
import ChecklistLanding from "./pages/ChecklistLanding";
import DiscoveryQuiz from "./components/landing/DiscoveryQuiz";
import { EstateAgentChatWrapper } from "@/components/EstateAgentChatWrapper";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import ProbateGuide from "./pages/guides/ProbateGuide";

// SEO Pillar Pages
const ProbateProcess = lazy(() => import("./pages/content/ProbateProcess"));
const ExecutorChecklist = lazy(() => import("./pages/content/ExecutorChecklist"));
const SmallEstateAffidavitPage = lazy(() => import("./pages/content/SmallEstateAffidavit"));
const ProbateTexas = lazy(() => import("./pages/content/ProbateTexas"));
const WhatToDoWhenSomeoneDies = lazy(() => import("./pages/content/WhatToDoWhenSomeoneDies"));
const ProbateCalifornia = lazy(() => import("./pages/content/ProbateCalifornia"));
const ProbateFlorida = lazy(() => import("./pages/content/ProbateFlorida"));
const TransferCarTitle = lazy(() => import("./pages/content/TransferCarTitle"));
const LifeInsuranceClaim = lazy(() => import("./pages/content/LifeInsuranceClaim"));
const IntestateWithoutWill = lazy(() => import("./pages/content/IntestateWithoutWill"));
const ProbateCost = lazy(() => import("./pages/content/ProbateCost"));
const EstateSettlementChecklist = lazy(() => import("./pages/content/EstateSettlementChecklist"));

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
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/invite/:token" element={<AcceptInvite />} />
                    <Route path="/checklist" element={<ChecklistLanding />} />
                    <Route path="/start" element={<DiscoveryQuiz />} />
                    <Route path="/guides/probate" element={<ProbateGuide />} />

                    {/* SEO Pillar Pages */}
                    <Route path="/probate-process" element={<ProbateProcess />} />
                    <Route path="/executor-checklist" element={<ExecutorChecklist />} />
                    <Route path="/small-estate-affidavit" element={<SmallEstateAffidavitPage />} />
                    <Route path="/probate-texas" element={<ProbateTexas />} />
                    <Route path="/what-to-do-when-someone-dies" element={<WhatToDoWhenSomeoneDies />} />
                    <Route path="/probate-california" element={<ProbateCalifornia />} />
                    <Route path="/probate-florida" element={<ProbateFlorida />} />
                    <Route path="/transfer-car-title-after-death" element={<TransferCarTitle />} />
                    <Route path="/life-insurance-claim-process" element={<LifeInsuranceClaim />} />
                    <Route path="/intestate-without-will" element={<IntestateWithoutWill />} />
                    <Route path="/probate-cost" element={<ProbateCost />} />
                    <Route path="/estate-settlement-checklist" element={<EstateSettlementChecklist />} />

                    {/* Executor / User Routes */}
                    <Route
                      path="/onboarding"
                      element={
                        <RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}>
                          <OnboardingWizard />
                        </RoleRoute>
                      }
                    />

                    {/* All protected routes rendered flatly as pages manage their own layouts */}
                    <Route path="/dashboard" element={<RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><Dashboard /></ProfileGuard></RoleRoute>} />
                    <Route path="/assets" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Assets /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/asset/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><AssetDetail /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/add-asset" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><AddAsset /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><UploadDocument /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

                    <Route path="/documents" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Documents /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    {/* <Route path="/estate" element={<ProtectedRoute><ProfileGuard><EstateOverview /></ProfileGuard></ProtectedRoute>} /> */}

                    {/* Communications */}
                    <Route path="/inbox" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><Inbox /></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    {/* <Route path="/communications" element={<ProtectedRoute><ProfileGuard><Communications /></ProfileGuard></ProtectedRoute>} /> */}
                    <Route path="/follow-ups" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><FollowUps /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

                    {/* Roadmap & Trail */}
                    <Route path="/roadmap" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SettlementRoadmapNew /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/roadmap-old" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SettlementRoadmap /></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/settlement-trail" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SettlementTrail /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

                    {/* Probate Tools */}
                    <Route path="/forms" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Forms /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/petition/wizard" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><PetitionWizard /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/petition" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><ProbatePetition /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/inventory" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><InventoryAppraisal /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/notices" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Notices /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/inventory-generator" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><InventoryGenerator /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/closing-statement" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><ClosingStatement /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/distribution-petition" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><DistributionPetition /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/spousal-petition" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SpousalPropertyPetition /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/succession-petition" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SuccessionPetition /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/guardian-ad-litem" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><GuardianAdLitem /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/bond-waiver" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><BondWaiver /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/special-notice" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SpecialNotice /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/contested-probate" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><ContestedProbate /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/asset-sale" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><AssetSaleAuthorization /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/final-distribution" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><FinalDistribution /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/small-estate" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SmallEstateAffidavit /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/probate/letters" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Letters /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

                    <Route path="/discovery" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Discovery /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/liabilities" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Liabilities /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    {/* <Route path="/heirs" element={<ProtectedRoute><ProfileGuard><Heirs /></ProfileGuard></ProtectedRoute>} /> */}
                    {/* <Route path="/collaboration" element={<ProtectedRoute><ProfileGuard><Collaboration /></ProfileGuard></ProtectedRoute>} /> */}

                    {/* Financials */}
                    <Route path="/accounting" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Accounting /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/tax-management" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><TaxManagement /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/receipts" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Receipts /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/distribution" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Distribution /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/non-probate" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><NonProbate /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

                    {/* Settings & Help */}
                    <Route path="/profile" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><ProfileSettings /></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><Settings /></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/help" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><HelpCenter /></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    {/* <Route path="/feed" element={<ProtectedRoute><ProfileGuard><Feed /></ProfileGuard></ProtectedRoute>} /> */}

                    {/* Services */}
                    <Route path="/estate-agent" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><EstateAgentChatWrapper /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/estates/:estateId/agents" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><EstateAgents /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
                    <Route path="/marketplace" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><AdvisorMarketplace /></RoleRoute></ProtectedRoute>} />
                    <Route path="/my-bookings" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><MyBookings /></RoleRoute></ProtectedRoute>} />
                    <Route path="/payment-success" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><PaymentSuccess /></ProfileGuard></RoleRoute></ProtectedRoute>} />

                    {/* Advisor Routes - Valid Layout Used Here */}
                    <Route path="/advisor/onboarding" element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['ADVISOR', 'ADMIN']}>
                          <AdvisorOnboarding />
                        </RoleRoute>
                      </ProtectedRoute>
                    } />

                    <Route path="/advisor" element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['ADVISOR', 'ADMIN']}>
                          <AdvisorLayout />
                        </RoleRoute>
                      </ProtectedRoute>
                    }>
                      <Route path="dashboard" element={<AdvisorDashboard />} />
                      <Route path="profile" element={<div className="p-8">Profile Settings (Coming Soon)</div>} />
                      <Route path="bookings" element={<AdvisorBookings />} />
                      <Route path="earnings" element={<Navigate to="/advisor/payouts" replace />} />
                      <Route path="settings" element={<div className="p-8">Account Settings (Coming Soon)</div>} />
                      <Route path="payouts" element={<AdvisorPayouts />} />
                    </Route>

                    {/* Admin Routes - Flattened as AdminLayout is missing */}
                    <Route path="/admin" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute></ProtectedRoute>} />
                    <Route path="/admin/institutions" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminInstitutions /></RoleRoute></ProtectedRoute>} />

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
