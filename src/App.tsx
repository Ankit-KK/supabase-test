import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
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

// Individual streamer donation pages (only active streamers + ThunderX)
import Ankit from "./pages/Ankit";
import ChiaaGaming from "./pages/ChiaaGaming";
import LooteriyaGaming from "./pages/LooteriyaGaming";
import Sizzors from "./pages/Sizzors";
import DamaskPlays from "./pages/DamaskPlays";
import NekoXenpai from "./pages/NekoXenpai";
import ThunderX from "./pages/ThunderX";
import VIPBhai from "./pages/VIPBhai";

// Dashboard pages (active streamers + ThunderX)
import Dashboard from "./pages/dashboard/Dashboard";
import Auth from "./pages/Auth";
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import LooteriyaGamingDashboard from "./pages/dashboard/LooteriyaGamingDashboard";
import SizzorsDashboard from "./pages/dashboard/SizzorsDashboard";
import DamaskPlaysDashboard from "./pages/dashboard/DamaskPlaysDashboard";
import NekoXenpaiDashboard from "./pages/dashboard/NekoXenpaiDashboard";
import ThunderXDashboard from "./pages/dashboard/ThunderXDashboard";
import VIPBhaiDashboard from "./pages/dashboard/VIPBhaiDashboard";

// OBS Alert pages (active streamers + ThunderX)
import AnkitObsAlerts from "./pages/obs-alerts/AnkitObsAlerts";
import ChiaGamingObsAlerts from "./pages/obs-alerts/ChiaGamingObsAlerts";
import LooteriyaGamingObsAlerts from "./pages/obs-alerts/LooteriyaGamingObsAlerts";
import SizzorsObsAlerts from "./pages/obs-alerts/SizzorsObsAlerts";
import DamaskPlaysObsAlerts from "./pages/obs-alerts/DamaskPlaysObsAlerts";
import NekoXenpaiObsAlerts from "./pages/obs-alerts/NekoXenpaiObsAlerts";
import ThunderXObsAlerts from "./pages/obs-alerts/ThunderXObsAlerts";
import VIPBhaiObsAlerts from "./pages/obs-alerts/VIPBhaiObsAlerts";

// Audio Player pages (active streamers + ThunderX)
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import LooteriyaGamingAudioPlayer from "./pages/audio-player/LooteriyaGamingAudioPlayer";
import SizzorsAudioPlayer from "./pages/audio-player/SizzorsAudioPlayer";
import DamaskPlaysAudioPlayer from "./pages/audio-player/DamaskPlaysAudioPlayer";
import NekoXenpaiAudioPlayer from "./pages/audio-player/NekoXenpaiAudioPlayer";
import ThunderXAudioPlayer from "./pages/audio-player/ThunderXAudioPlayer";
import VIPBhaiAudioPlayer from "./pages/audio-player/VIPBhaiAudioPlayer";

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
              <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
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
              
              {/* Streamer donation pages - Active Streamers */}
              <Route path="/ankit" element={<Ankit />} />
              <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
              <Route path="/looteriya_gaming" element={<LooteriyaGaming />} />
              <Route path="/sizzors" element={<Sizzors />} />
              <Route path="/damask_plays" element={<DamaskPlays />} />
              <Route path="/neko_xenpai" element={<NekoXenpai />} />
              <Route path="/thunderx" element={<ThunderX />} />
              <Route path="/vipbhai" element={<VIPBhai />} />
              
              {/* Authentication */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
              <Route path="/dashboard/chiaa_gaming" element={<ChiaGamingDashboard />} />
              <Route path="/dashboard/looteriya_gaming" element={<LooteriyaGamingDashboard />} />
              <Route path="/dashboard/sizzors" element={<SizzorsDashboard />} />
              <Route path="/dashboard/damask_plays" element={<DamaskPlaysDashboard />} />
              <Route path="/dashboard/neko_xenpai" element={<NekoXenpaiDashboard />} />
              <Route path="/dashboard/thunderx" element={<ThunderXDashboard />} />
              <Route path="/dashboard/vipbhai" element={<VIPBhaiDashboard />} />
              
              {/* OBS Alert routes */}
              <Route path="/ankit/obs-alerts" element={<AnkitObsAlerts />} />
              <Route path="/chiaa_gaming/obs-alerts" element={<ChiaGamingObsAlerts />} />
              <Route path="/looteriya_gaming/obs-alerts" element={<LooteriyaGamingObsAlerts />} />
              <Route path="/sizzors/obs-alerts" element={<SizzorsObsAlerts />} />
              <Route path="/damask_plays/obs-alerts" element={<DamaskPlaysObsAlerts />} />
              <Route path="/neko_xenpai/obs-alerts" element={<NekoXenpaiObsAlerts />} />
              <Route path="/thunderx/obs-alerts" element={<ThunderXObsAlerts />} />
              <Route path="/vipbhai/obs-alerts" element={<VIPBhaiObsAlerts />} />
              
              {/* Audio Player routes */}
              <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
              <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
              <Route path="/looteriya_gaming/audio-player" element={<LooteriyaGamingAudioPlayer />} />
              <Route path="/sizzors/audio-player" element={<SizzorsAudioPlayer />} />
              <Route path="/damask_plays/audio-player" element={<DamaskPlaysAudioPlayer />} />
              <Route path="/neko_xenpai/audio-player" element={<NekoXenpaiAudioPlayer />} />
              <Route path="/thunderx/audio-player" element={<ThunderXAudioPlayer />} />
              <Route path="/vipbhai/audio-player" element={<VIPBhaiAudioPlayer />} />
              
              {/* Catch all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
