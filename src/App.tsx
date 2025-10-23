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
import DriverPending from "./pages/DriverPending";
import Cliente from "./pages/Cliente";
import Motoboy from "./pages/Motoboy";
import Admin from "./pages/Admin";
import TrackingPublic from "./pages/TrackingPublic";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import NewRoute from "./pages/NewRoute";
import RouteDetails from "./pages/RouteDetails";
import RideTracking from "./pages/RideTracking";
import Products from "./pages/Products";
const queryClient = new QueryClient();

const App = () => {
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
              <Route path="/ride/:rideId" element={<RideTracking />} />
              <Route path="/products" element={<Products />} />
              
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
              
              <Route path="/driver-pending" element={
                <ProtectedRoute requireRole="driver">
                  <DriverPending />
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
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/customers" element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } />
              
              <Route path="/new-route" element={
                <ProtectedRoute>
                  <NewRoute />
                </ProtectedRoute>
              } />
              
              <Route path="/route-details/:batchId" element={
                <ProtectedRoute>
                  <RouteDetails />
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
