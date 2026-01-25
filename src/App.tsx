import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
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
import Discovery from "./pages/Discovery";
import Probate from "./pages/Probate";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import PetitionWizard from "./pages/probate/PetitionWizard";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
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
                  path="/probate/petition"
                  element={
                    <ProtectedRoute>
                      <PetitionWizard />
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </NavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
