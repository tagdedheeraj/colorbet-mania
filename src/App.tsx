
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
  const { initialize, isLoading, isAuthenticated, error, isInitialized } = useSupabaseAuthStore();

  useEffect(() => {
    // Initialize auth with shorter timeout
    const initTimeout = setTimeout(() => {
      console.log('App initialization timeout - proceeding anyway');
    }, 2000);

    initialize().finally(() => {
      clearTimeout(initTimeout);
    });
  }, [initialize]);

  // Show loading screen briefly, then proceed
  if (!isInitialized && isLoading) {
    return <LoadingScreen />;
  }

  // Show error state if critical authentication failed
  if (error && !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Reload Page
              </button>
            </div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-[#0F0F12] text-white">
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
