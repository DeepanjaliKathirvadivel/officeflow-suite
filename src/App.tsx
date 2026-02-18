import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import Bills from "@/pages/Bills";
import NewBill from "@/pages/NewBill";
import BillDetail from "@/pages/BillDetail";
import CourierList from "@/pages/courier/CourierList";
import CourierEntry from "@/pages/courier/CourierEntry";
import CourierDetail from "@/pages/courier/CourierDetail";
import CourierDashboard from "@/pages/courier/CourierDashboard";
import AssetList from "@/pages/assets/AssetList";
import AssetRegister from "@/pages/assets/AssetRegister";
import AssetDetail from "@/pages/assets/AssetDetail";
import ComplaintList from "@/pages/complaints/ComplaintList";
import ComplaintSubmit from "@/pages/complaints/ComplaintSubmit";
import ComplaintDetail from "@/pages/complaints/ComplaintDetail";
import ComplaintDashboard from "@/pages/complaints/ComplaintDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/bills/new" element={<ProtectedRoute><NewBill /></ProtectedRoute>} />
            <Route path="/bills/:id" element={<ProtectedRoute><BillDetail /></ProtectedRoute>} />
            <Route path="/couriers" element={<ProtectedRoute><CourierList /></ProtectedRoute>} />
            <Route path="/couriers/new" element={<ProtectedRoute><CourierEntry /></ProtectedRoute>} />
            <Route path="/couriers/:id" element={<ProtectedRoute><CourierDetail /></ProtectedRoute>} />
            <Route path="/couriers/dashboard" element={<ProtectedRoute><CourierDashboard /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><AssetList /></ProtectedRoute>} />
            <Route path="/assets/register" element={<ProtectedRoute><AssetRegister /></ProtectedRoute>} />
            <Route path="/assets/:id" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><ComplaintList /></ProtectedRoute>} />
            <Route path="/complaints/new" element={<ProtectedRoute><ComplaintSubmit /></ProtectedRoute>} />
            <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
            <Route path="/complaints/dashboard" element={<ProtectedRoute><ComplaintDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
