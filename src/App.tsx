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

// Individual streamer donation pages (only active 4)
import Ankit from "./pages/Ankit";
import ChiaaGaming from "./pages/ChiaaGaming";
import LooteriyaGaming from "./pages/LooteriyaGaming";
import Sizzors from "./pages/Sizzors";

// Dashboard pages (only active 4)
import Dashboard from "./pages/dashboard/Dashboard";
import Auth from "./pages/Auth";
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import LooteriyaGamingDashboard from "./pages/dashboard/LooteriyaGamingDashboard";
import SizzorsDashboard from "./pages/dashboard/SizzorsDashboard";

// OBS Alert pages (only active 4)
import AnkitObsAlerts from "./pages/obs-alerts/AnkitObsAlerts";
import ChiaGamingObsAlerts from "./pages/obs-alerts/ChiaGamingObsAlerts";
import LooteriyaGamingObsAlerts from "./pages/obs-alerts/LooteriyaGamingObsAlerts";
import SizzorsObsAlerts from "./pages/obs-alerts/SizzorsObsAlerts";

// Audio Player pages (only active 4)
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import LooteriyaGamingAudioPlayer from "./pages/audio-player/LooteriyaGamingAudioPlayer";
import SizzorsAudioPlayer from "./pages/audio-player/SizzorsAudioPlayer";

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
              
              {/* Streamer donation pages - Only 4 Active Streamers */}
              <Route path="/ankit" element={<Ankit />} />
              <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
              <Route path="/looteriya_gaming" element={<LooteriyaGaming />} />
              <Route path="/sizzors" element={<Sizzors />} />
              
              {/* Authentication */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard routes - Only 4 Active Streamers */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
              <Route path="/dashboard/chiaa_gaming" element={<ChiaGamingDashboard />} />
              <Route path="/dashboard/looteriya_gaming" element={<LooteriyaGamingDashboard />} />
              <Route path="/dashboard/sizzors" element={<SizzorsDashboard />} />
              
              {/* OBS Alert routes - Only 4 Active Streamers */}
              <Route path="/ankit/obs-alerts" element={<AnkitObsAlerts />} />
              <Route path="/chiaa_gaming/obs-alerts" element={<ChiaGamingObsAlerts />} />
              <Route path="/looteriya_gaming/obs-alerts" element={<LooteriyaGamingObsAlerts />} />
              <Route path="/sizzors/obs-alerts" element={<SizzorsObsAlerts />} />
              
              {/* Audio Player routes - Only 4 Active Streamers */}
              <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
              <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
              <Route path="/looteriya_gaming/audio-player" element={<LooteriyaGamingAudioPlayer />} />
              <Route path="/sizzors/audio-player" element={<SizzorsAudioPlayer />} />
              
              {/* Catch all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
