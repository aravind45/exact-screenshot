import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { useTerminology } from "@/hooks/useTerminology";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRoute } from "@/components/RoleRoute";
import { ProfileGuard } from "@/components/ProfileGuard";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import AdvisorLayout from '@/components/AdvisorLayout';
import { EstateAgentChatWrapper } from "@/components/EstateAgentChatWrapper";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { CookieConsent } from "@/components/CookieConsent";
// Pages

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OnboardingGuidedWizard = lazy(() => import("./components/OnboardingGuidedWizard"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Assets & Documents
const Assets = lazy(() => import("./pages/Assets"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const AddAsset = lazy(() => import("./pages/AddAsset"));
const AddLiability = lazy(() => import("./pages/AddLiability"));
const UploadDocument = lazy(() => import("./pages/UploadDocument"));
const Documents = lazy(() => import("./pages/Documents"));

// Estate Management
const SettlementRoadmap = lazy(() => import("./pages/SettlementRoadmap"));
const SettlementRoadmapNew = lazy(() => import("./pages/SettlementRoadmapNew"));
const SettlementTrail = lazy(() => import("./pages/SettlementTrail"));
const Inbox = lazy(() => import("./pages/Inbox"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const Forms = lazy(() => import("./pages/Forms"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));

// Profile & Settings
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Settings = lazy(() => import("./pages/Settings"));

// Probate Toolset
const PetitionWizard = lazy(() => import("./pages/probate/PetitionWizard"));
const ProbatePetition = lazy(() => import("./pages/ProbatePetition"));
const InventoryAppraisal = lazy(() => import("./pages/probate/InventoryAppraisal"));
const Notices = lazy(() => import("./pages/probate/Notices"));
const InventoryGenerator = lazy(() => import("./pages/InventoryGenerator"));
const ClosingStatement = lazy(() => import("./pages/ClosingStatement"));
const DistributionPetition = lazy(() => import("./pages/DistributionPetition"));
const SpousalPropertyPetition = lazy(() => import("./pages/SpousalPropertyPetition"));
const SuccessionPetition = lazy(() => import("./pages/SuccessionPetition"));
const GuardianAdLitem = lazy(() => import("./pages/GuardianAdLitem"));
const BondWaiver = lazy(() => import("./pages/BondWaiver"));
const SpecialNotice = lazy(() => import("./pages/SpecialNotice"));
const ContestedProbate = lazy(() => import("./pages/ContestedProbate"));
const AssetSaleAuthorization = lazy(() => import("./pages/AssetSaleAuthorization"));
const FinalDistribution = lazy(() => import("./pages/FinalDistribution"));
const SmallEstateAffidavit = lazy(() => import("./pages/SmallEstateAffidavit"));
const Letters = lazy(() => import("./pages/probate/Letters"));
const Discovery = lazy(() => import("./pages/Discovery"));
const Liabilities = lazy(() => import("./pages/Liabilities"));
const Accounting = lazy(() => import("./pages/Accounting"));
const TaxManagement = lazy(() => import("./pages/TaxManagement"));
const Receipts = lazy(() => import("./pages/Receipts"));
const Distribution = lazy(() => import("./pages/Distribution"));
const Heirs = lazy(() => import("./pages/Heirs"));
const NonProbate = lazy(() => import("./pages/NonProbate"));

// Admin
const AdminSystemUsersPage = lazy(() => import("./pages/admin/AdminSystemUsersPage"));
const AdminBillingLedgerPage = lazy(() => import("./pages/admin/AdminBillingLedgerPage"));
const AdminInstitutionMasterPage = lazy(() => import("./pages/admin/AdminInstitutionMasterPage"));
const AdminFormTemplatesPage = lazy(() => import("./pages/admin/AdminFormTemplatesPage"));
const AdminKnowledgeBasePage = lazy(() => import("./pages/admin/AdminKnowledgeBasePage"));
const AdminCommunicationsPage = lazy(() => import("./pages/admin/AdminCommunicationsPage"));
const AdminMarketingLeadsPage = lazy(() => import("./pages/admin/AdminMarketingLeadsPage"));
const AdminAdvisorVerificationPage = lazy(() => import("./pages/admin/AdminAdvisorVerificationPage"));
const AdminStateRulesPage = lazy(() => import("./pages/admin/AdminStateRulesPage"));
const AdminInstitutions = lazy(() => import("./pages/admin/AdminInstitutions"));
const AdminAdvisorQueue = lazy(() => import("./pages/admin/AdminAdvisorQueue"));
const AdminAdvisorQaChecklistPage = lazy(() => import("./pages/admin/AdminAdvisorQaChecklistPage"));
const AdminAdvisorPayoutsPage = lazy(() => import("./pages/admin/AdminAdvisorPayoutsPage"));
const AdminWorkflowReliabilityPage = lazy(() => import("./pages/admin/AdminWorkflowReliabilityPage"));
const SSOTProbateEngine = lazy(() => import("./pages/admin/SSOTProbateEngine"));
const JurisdictionHealthDashboard = lazy(() => import("./pages/admin/JurisdictionHealthDashboard"));
const DebugMARoadmapPage = lazy(() => import("./pages/DebugMARoadmapPage"));

// Advisor
const AdvisorDashboardLegacy = lazy(() => import("./pages/advisor/Dashboard"));
const AdvisorOnboarding = lazy(() => import("./pages/advisor/Onboarding"));
const AdvisorDashboardNew = lazy(() => import("./pages/advisor/AdvisorDashboardNew"));
const AdvisorBookings = lazy(() => import("./pages/advisor/Bookings"));
const AdvisorProfileSettings = lazy(() => import("./pages/advisor/Profile"));
const AdvisorAccountSettings = lazy(() => import("./pages/advisor/Settings"));
const AdvisorMarketplace = lazy(() => import("./pages/AdvisorMarketplace"));
const AdvisorPayouts = lazy(() => import("./pages/AdvisorPayouts"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ConsultationCalendar = lazy(() => import("./pages/ConsultationCalendar"));

// Marketplace (new two-sided marketplace)
const AdvisorDirectory = lazy(() => import("./pages/marketplace/AdvisorDirectory"));
const AdvisorProfilePage = lazy(() => import("./pages/marketplace/AdvisorProfile"));
const BookingCheckout = lazy(() => import("./pages/marketplace/BookingCheckout"));

// Others
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const EstateAgents = lazy(() => import("./pages/EstateAgents"));
const ChecklistLanding = lazy(() => import("./pages/ChecklistLanding"));
const DiscoveryQuiz = lazy(() => import("./components/landing/DiscoveryQuiz"));
const ProbateGuide = lazy(() => import("./pages/guides/ProbateGuide"));
const CaliforniaProbateDeadlines = lazy(() => import("./pages/guides/CaliforniaProbateDeadlines"));
const TexasProbateDeadlines = lazy(() => import("./pages/guides/TexasProbateDeadlines"));
const FloridaProbateDeadlines = lazy(() => import("./pages/guides/FloridaProbateDeadlines"));

// Public landing page (SEO-optimized marketing page)
const Landing = lazy(() => import("./pages/Landing"));
const LandingTexasLawyer = lazy(() => import("./pages/LandingTexasLawyer"));
const FirmDashboard = lazy(() => import("./pages/FirmDashboard"));
const ClientStatusReport = lazy(() => import("./pages/ClientStatusReport"));

// B2B Pilot Pages
const PilotAccessForm = lazy(() => import("./components/PilotAccessForm"));

// Legal Pages
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));

// SEO Pillar Pages
const ProbateProcess = lazy(() => import("./pages/content/ProbateProcess"));
const ExecutorChecklist = lazy(() => import("./pages/content/ExecutorChecklist"));
const ProbateTimeline = lazy(() => import("./pages/content/ProbateTimeline"));
const SmallEstateAffidavitPage = lazy(() => import("./pages/content/SmallEstateAffidavit"));
const ProbateTexas = lazy(() => import("./pages/content/ProbateTexas"));
const WhatToDoWhenSomeoneDies = lazy(() => import("./pages/content/WhatToDoWhenSomeoneDies"));
const ProbateCalifornia = lazy(() => import("./pages/content/ProbateCalifornia"));
const ProbateFlorida = lazy(() => import("./pages/content/ProbateFlorida"));
const TransferCarTitle = lazy(() => import("./pages/content/TransferCarTitle"));
const LifeInsuranceClaim = lazy(() => import("./pages/content/LifeInsuranceClaim"));
const IntestateWithoutWill = lazy(() => import("./pages/content/IntestateWithoutWill"));
const ProbateCost = lazy(() => import("./pages/content/ProbateCost"));
const ProbateCalculator = lazy(() => import("./pages/ProbateCalculator"));
const DigitalAssets = lazy(() => import("./pages/DigitalAssets"));
const EstateSettlementChecklist = lazy(() => import("./pages/content/EstateSettlementChecklist"));
const EstatePathGuide = lazy(() => import("./pages/EstatePathGuide"));

// Competitor Comparison
const CompetitorComparison = lazy(() => import("./pages/CompetitorComparison"));


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
              <TenantProvider>
                <AppRoutes />
              </TenantProvider>
            </NavigationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

const AppRoutes = () => {
  const { tenant } = useTenant();
  const { isB2BTexas } = useTerminology();

  return (
    <AuthProvider>
      <WorkflowProvider>
        <Suspense fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm font-medium text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={tenant?.id === 'texas_lawyer' ? <LandingTexasLawyer /> : <Landing />} />
            <Route path="/landing/texas-lawyer" element={<LandingTexasLawyer />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth?mode=signup" replace />} />
            <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/checklist" element={<ChecklistLanding />} />
            <Route path="/start" element={<DiscoveryQuiz />} />
            <Route path="/guides/probate" element={<ProbateGuide />} />
            <Route path="/guides/california-probate-deadlines" element={<CaliforniaProbateDeadlines />} />
            <Route path="/guides/texas-probate-deadlines" element={<TexasProbateDeadlines />} />
            <Route path="/guides/florida-probate-deadlines" element={<FloridaProbateDeadlines />} />

            <Route path="/probate-process" element={<ProbateProcess />} />
            <Route path="/probate-timeline" element={<ProbateTimeline />} />
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
            <Route path="/probate-calculator" element={<ProbateCalculator />} />
            <Route path="/digital-assets" element={<DigitalAssets />} />
            <Route path="/estate-settlement-checklist" element={<EstateSettlementChecklist />} />
            <Route path="/estate-path-guide" element={<EstatePathGuide />} />
            <Route path="/competitor-comparison" element={<CompetitorComparison />} />

            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Legacy onboarding deep links */}
            <Route path="/onboarding/track_selection" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/track-selection" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/state_selection" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/state-selection" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/authority_setup" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/authority-setup" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={
              <RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}>
                <OnboardingGuidedWizard />
              </RoleRoute>
            } />

            {/* B2B Texas Pilot Routes */}
            {isB2BTexas && (
              <>
                <Route path="/firm/dashboard" element={<ProtectedRoute><FirmDashboard /></ProtectedRoute>} />
                <Route path="/reports/client-status" element={<ProtectedRoute><ClientStatusReport /></ProtectedRoute>} />
              </>
            )}

            <Route path="/dashboard" element={<RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><Dashboard /></RoleRoute>} />
            <Route path="/assets" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Assets /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/asset/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><AssetDetail /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/add-asset" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><AddAsset /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/add-liability" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><AddLiability /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><UploadDocument /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Documents /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

            <Route path="/inbox" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><Inbox /></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/follow-ups" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><FollowUps /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

            <Route path="/roadmap" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SettlementRoadmapNew /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/roadmap-old" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SettlementRoadmap /></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/settlement-trail" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><SettlementTrail /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

            <Route path="/forms" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Forms /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/probate" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Navigate to="/probate/petition" replace /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
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
            <Route path="/heirs" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Heirs /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

            <Route path="/accounting" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Accounting /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/tax-management" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><TaxManagement /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/receipts" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Receipts /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/distribution" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><Distribution /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/non-probate" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><NonProbate /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><ProfileSettings /></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><Settings /></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><HelpCenter /></ProfileGuard></RoleRoute></ProtectedRoute>} />

            <Route path="/estate-agent" element={<Navigate to="/dashboard" replace />} />
            <Route path="/estates/:estateId/agents" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><SubscriptionGuard><EstateAgents /></SubscriptionGuard></ProfileGuard></RoleRoute></ProtectedRoute>} />
            <Route path="/marketplace-legacy" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><AdvisorMarketplace /></RoleRoute></ProtectedRoute>} />

            {!isB2BTexas && (
              <>
                <Route path="/advisor/marketplace" element={<Navigate to="/marketplace" replace />} />
                <Route path="/marketplace" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><AdvisorDirectory /></RoleRoute></ProtectedRoute>} />
                <Route path="/marketplace/:advisorId" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><AdvisorProfilePage /></RoleRoute></ProtectedRoute>} />
                <Route path="/marketplace/:advisorId/book" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><BookingCheckout /></RoleRoute></ProtectedRoute>} />
                <Route path="/my-bookings" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><MyBookings /></RoleRoute></ProtectedRoute>} />
                <Route path="/consultations/calendar" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ConsultationCalendar /></RoleRoute></ProtectedRoute>} />
                <Route path="/my-bookings/calendar" element={<Navigate to="/consultations/calendar" replace />} />
              </>
            )}

            <Route path="/payment-success" element={<ProtectedRoute><RoleRoute allowedRoles={['EXECUTOR', 'HEIR', 'USER']}><ProfileGuard><PaymentSuccess /></ProfileGuard></RoleRoute></ProtectedRoute>} />

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
              <Route index element={<Navigate to="/advisor/dashboard" replace />} />
              <Route path="dashboard" element={<AdvisorDashboardNew />} />
              <Route path="dashboard-legacy" element={<AdvisorDashboardLegacy />} />
              <Route path="profile" element={<AdvisorProfileSettings />} />
              <Route path="bookings" element={<AdvisorBookings />} />
              <Route path="earnings" element={<Navigate to="/advisor/payouts" replace />} />
              <Route path="settings" element={<AdvisorAccountSettings />} />
              <Route path="payouts" element={<AdvisorPayouts />} />
            </Route>

            <Route path="/admin" element={<Navigate to="/admin/system-users" replace />} />
            <Route path="/admin/system-users" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminSystemUsersPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/billing-ledger" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminBillingLedgerPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/institution-master" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminInstitutionMasterPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/form-templates" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminFormTemplatesPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/knowledge-base" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminKnowledgeBasePage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/communications" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminCommunicationsPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/marketing-leads" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminMarketingLeadsPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/advisor-verification" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminAdvisorVerificationPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/state-rules" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminStateRulesPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/institutions" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminInstitutions /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/advisors" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminAdvisorQueue /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/advisor-qa" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminAdvisorQaChecklistPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/advisor-payouts" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminAdvisorPayoutsPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/workflow-reliability" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminWorkflowReliabilityPage /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/probate-engine" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><SSOTProbateEngine /></RoleRoute></ProtectedRoute>} />
            <Route path="/admin/jurisdiction-health" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><JurisdictionHealthDashboard /></RoleRoute></ProtectedRoute>} />
            <Route path="/debug/ma-roadmap" element={<ProtectedRoute><DebugMARoadmapPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <EstateAgentChatWrapper />
        <LegalDisclaimer />
        <CookieConsent />
      </WorkflowProvider>
    </AuthProvider>
  );
};

export default App;





