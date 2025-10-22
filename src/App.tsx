import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DriverOnboarding from "./pages/DriverOnboarding";
import Cliente from "./pages/Cliente";
import Motoboy from "./pages/Motoboy";
import Admin from "./pages/Admin";
import TrackingPublic from "./pages/TrackingPublic";
import NotFound from "./pages/NotFound";
import MapboxTokenInput from "./components/MapboxTokenInput";
import { hasMapboxToken } from "./lib/mapboxConfig";

const queryClient = new QueryClient();

const App = () => {
  const hasToken = hasMapboxToken();

  if (!hasToken) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <MapboxTokenInput />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/track/:token" element={<TrackingPublic />} />
              
              <Route path="/cliente" element={
                <ProtectedRoute requireRole="customer">
                  <Cliente />
                </ProtectedRoute>
              } />
              
              <Route path="/driver-onboarding" element={
                <ProtectedRoute>
                  <DriverOnboarding />
                </ProtectedRoute>
              } />
              
              <Route path="/motoboy" element={
                <ProtectedRoute requireRole="driver">
                  <Motoboy />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requireRole="admin">
                  <Admin />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
};

export default App;
