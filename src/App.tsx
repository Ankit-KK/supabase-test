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
import TestAlerts from "./pages/TestAlerts";

// Individual streamer donation pages (using UniversalDonationForm)
import ChiaaGaming from "./pages/ChiaaGaming";
import Ankit from "./pages/Ankit";
import TechGamer from "./pages/TechGamer";
import MusicStream from "./pages/MusicStream";
import CodeLive from "./pages/CodeLive";
import ArtCreate from "./pages/ArtCreate";
import FitnessFlow from "./pages/FitnessFlow";

// Dashboard pages
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import DemoStreamerDashboard from "./pages/dashboard/DemoStreamerDashboard";
import Auth from "./pages/Auth";

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
              
              {/* Blog posts */}
              <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
              
              {/* Streamer donation pages */}
              <Route path="/ankit" element={<Ankit />} />
              <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
              <Route path="/techgamer" element={<TechGamer />} />
              <Route path="/musicstream" element={<MusicStream />} />
              <Route path="/codelive" element={<CodeLive />} />
              <Route path="/artcreate" element={<ArtCreate />} />
              <Route path="/fitnessflow" element={<FitnessFlow />} />
              
              {/* Authentication */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard pages */}
              <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
              <Route path="/dashboard/chia_gaming" element={<ChiaGamingDashboard />} />
              <Route path="/dashboard/demostreamer" element={<DemoStreamerDashboard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;