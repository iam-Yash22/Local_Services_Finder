import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIHelpButton from "@/components/AIHelpButton";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import AddService from "@/pages/AddService";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function RequireSignIn({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/services" element={<RequireSignIn><Services /></RequireSignIn>} />
                <Route path="/services/:id" element={<RequireSignIn><ServiceDetail /></RequireSignIn>} />
                <Route path="/add-service" element={<RequireSignIn><AddService /></RequireSignIn>} />
                <Route path="/profile" element={<RequireSignIn><Profile /></RequireSignIn>} />
                <Route path="/admin" element={<RequireSignIn><Admin /></RequireSignIn>} />
                <Route path="*" element={<RequireSignIn><NotFound /></RequireSignIn>} />
              </Routes>
            </main>
            <Footer />
            <AIHelpButton />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
