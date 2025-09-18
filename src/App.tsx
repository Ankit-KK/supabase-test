import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefunds from "./pages/CancellationRefunds";
import Shipping from "./pages/Shipping";
import Blog from "./pages/Blog";
import Sitemap from "./pages/Sitemap";
import SitemapXml from "./pages/SitemapXml";
import NotFound from "./pages/NotFound";
import FeatureShowcase from "./pages/FeatureShowcase";
import Status from "./pages/Status";
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import AdminDashboard from "./pages/AdminDashboard";
import TestAlerts from "./pages/TestAlerts";

// New Universal Components
import UniversalLogin from "./pages/UniversalLogin";
import UniversalDashboard from "./pages/UniversalDashboard";
import UniversalAlerts from "./pages/UniversalAlerts";
import UniversalDonationForm from "./components/UniversalDonationForm";

// Individual streamer donation pages (using UniversalDonationForm)
import ChiaaGaming from "./pages/ChiaaGaming";
import Ankit from "./pages/Ankit";
import TechGamer from "./pages/TechGamer";
import MusicStream from "./pages/MusicStream";
import CodeLive from "./pages/CodeLive";
import ArtCreate from "./pages/ArtCreate";
import FitnessFlow from "./pages/FitnessFlow";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/sitemap.xml" element={<SitemapXml />} />
            <Route path="/feature-showcase" element={<FeatureShowcase />} />
            <Route path="/status" element={<Status />} />
            <Route path="/test-alerts" element={<TestAlerts />} />
            
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Blog posts */}
            <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
            
            {/* Universal Streamer Routes - All 8 streamers use the same components */}
            {/* Ankit */}
            <Route path="/ankit" element={<Ankit />} />
            <Route path="/ankit/login" element={<UniversalLogin />} />
            <Route path="/ankit/dashboard" element={<UniversalDashboard />} />
            
            {/* Chia Gaming */}
            <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
            <Route path="/chiaa_gaming/login" element={<UniversalLogin />} />
            <Route path="/chiaa_gaming/dashboard" element={<UniversalDashboard />} />
            
            {/* Demo Streamer */}
            <Route path="/demostreamer" element={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"><UniversalDonationForm streamerSlug="demostreamer" /></div>} />
            <Route path="/demostreamer/login" element={<UniversalLogin />} />
            <Route path="/demostreamer/dashboard" element={<UniversalDashboard />} />
            
            {/* Tech Gamer */}
            <Route path="/techgamer" element={<TechGamer />} />
            <Route path="/techgamer/login" element={<UniversalLogin />} />
            <Route path="/techgamer/dashboard" element={<UniversalDashboard />} />
            
            {/* Music Stream */}
            <Route path="/musicstream" element={<MusicStream />} />
            <Route path="/musicstream/login" element={<UniversalLogin />} />
            <Route path="/musicstream/dashboard" element={<UniversalDashboard />} />
            
            {/* Code Live */}
            <Route path="/codelive" element={<CodeLive />} />
            <Route path="/codelive/login" element={<UniversalLogin />} />
            <Route path="/codelive/dashboard" element={<UniversalDashboard />} />
            
            {/* Art Create */}
            <Route path="/artcreate" element={<ArtCreate />} />
            <Route path="/artcreate/login" element={<UniversalLogin />} />
            <Route path="/artcreate/dashboard" element={<UniversalDashboard />} />
            
            {/* Fitness Flow */}
            <Route path="/fitnessflow" element={<FitnessFlow />} />
            <Route path="/fitnessflow/login" element={<UniversalLogin />} />
            <Route path="/fitnessflow/dashboard" element={<UniversalDashboard />} />
            
            {/* Universal OBS Alerts - Single endpoint for all streamers */}
            <Route path="/alerts/:token" element={<UniversalAlerts />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;