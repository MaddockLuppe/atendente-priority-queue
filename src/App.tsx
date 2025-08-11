import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import PrivateRoute from "@/components/PrivateRoute";
import AdminSetup from "@/components/AdminSetup";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [needsAdminSetup, setNeedsAdminSetup] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) throw error;
      setNeedsAdminSetup(!data || data.length === 0);
    } catch (error) {
      setNeedsAdminSetup(true);
    }
  };

  const handleAdminCreated = () => {
    setNeedsAdminSetup(false);
  };

  // Show loading while checking
  if (needsAdminSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // Show admin setup if needed
  if (needsAdminSetup) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdminSetup onAdminCreated={handleAdminCreated} />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show normal app
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/atendimentos" replace />} />
              <Route path="/atendimentos" element={<PrivateRoute><Index /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};


export default App;
