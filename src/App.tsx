
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Referral from "./pages/Referral";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import LoadingScreen from "./components/LoadingScreen";
import useSupabaseAuthStore from "./store/supabaseAuthStore";

const queryClient = new QueryClient();

function App() {
  const { initialize, isLoading, isAuthenticated } = useSupabaseAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route 
                path="/auth" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} 
              />
              <Route 
                path="/" 
                element={isAuthenticated ? <Index /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/profile" 
                element={isAuthenticated ? <Profile /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/wallet" 
                element={isAuthenticated ? <Wallet /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/referral" 
                element={isAuthenticated ? <Referral /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/about" 
                element={isAuthenticated ? <About /> : <Navigate to="/auth" replace />} 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {isAuthenticated && <BottomNav />}
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
