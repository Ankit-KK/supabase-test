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
import Demo2 from "./pages/Demo2";
import Demo3 from "./pages/Demo3";
import Demo4 from "./pages/Demo4";

// Dashboard pages
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import DemoStreamerDashboard from "./pages/dashboard/DemoStreamerDashboard";
import TechGamerDashboard from "./pages/dashboard/TechGamerDashboard";
import MusicStreamDashboard from "./pages/dashboard/MusicStreamDashboard";
import FitnessFlowDashboard from "./pages/dashboard/FitnessFlowDashboard";
import CodeLiveDashboard from "./pages/dashboard/CodeLiveDashboard";
import ArtCreateDashboard from "./pages/dashboard/ArtCreateDashboard";
import Demo2Dashboard from "./pages/dashboard/Demo2Dashboard";
import Demo3Dashboard from "./pages/dashboard/Demo3Dashboard";
import Demo4Dashboard from "./pages/dashboard/Demo4Dashboard";
import Dashboard from "./pages/dashboard/Dashboard";
import Auth from "./pages/Auth";
import DemoStreamer from "./pages/DemoStreamer";

// OBS Alert pages
import AnkitObsAlerts from "./pages/obs-alerts/AnkitObsAlerts";
import ChiaGamingObsAlerts from "./pages/obs-alerts/ChiaGamingObsAlerts";
import DemoStreamerObsAlerts from "./pages/obs-alerts/DemoStreamerObsAlerts";
import TechGamerObsAlerts from "./pages/obs-alerts/TechGamerObsAlerts";
import MusicStreamObsAlerts from "./pages/obs-alerts/MusicStreamObsAlerts";
import FitnessFlowObsAlerts from "./pages/obs-alerts/FitnessFlowObsAlerts";
import CodeLiveObsAlerts from "./pages/obs-alerts/CodeLiveObsAlerts";
import ArtCreateObsAlerts from "./pages/obs-alerts/ArtCreateObsAlerts";
import Demo2ObsAlerts from "./pages/obs-alerts/Demo2ObsAlerts";
import Demo3ObsAlerts from "./pages/obs-alerts/Demo3ObsAlerts";
import Demo4ObsAlerts from "./pages/obs-alerts/Demo4ObsAlerts";

// Audio Player pages
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import DemoStreamerAudioPlayer from "./pages/audio-player/DemoStreamerAudioPlayer";
import TechGamerAudioPlayer from "./pages/audio-player/TechGamerAudioPlayer";
import MusicStreamAudioPlayer from "./pages/audio-player/MusicStreamAudioPlayer";
import FitnessFlowAudioPlayer from "./pages/audio-player/FitnessFlowAudioPlayer";
import CodeLiveAudioPlayer from "./pages/audio-player/CodeLiveAudioPlayer";
import ArtCreateAudioPlayer from "./pages/audio-player/ArtCreateAudioPlayer";
import Demo2AudioPlayer from "./pages/audio-player/Demo2AudioPlayer";
import Demo3AudioPlayer from "./pages/audio-player/Demo3AudioPlayer";
import Demo4AudioPlayer from "./pages/audio-player/Demo4AudioPlayer";

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
              <Route path="/demostreamer" element={<DemoStreamer />} />
              <Route path="/demo2" element={<Demo2 />} />
              <Route path="/demo3" element={<Demo3 />} />
              <Route path="/demo4" element={<Demo4 />} />
              
              {/* Authentication */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
              <Route path="/dashboard/techgamer" element={<TechGamerDashboard />} />
              <Route path="/dashboard/musicstream" element={<MusicStreamDashboard />} />
              <Route path="/dashboard/fitnessflow" element={<FitnessFlowDashboard />} />
              <Route path="/dashboard/codelive" element={<CodeLiveDashboard />} />
              <Route path="/dashboard/artcreate" element={<ArtCreateDashboard />} />
              <Route path="/dashboard/chiaa_gaming" element={<ChiaGamingDashboard />} />
              <Route path="/dashboard/demostreamer" element={<DemoStreamerDashboard />} />
              <Route path="/dashboard/demo2" element={<Demo2Dashboard />} />
              <Route path="/dashboard/demo3" element={<Demo3Dashboard />} />
              <Route path="/dashboard/demo4" element={<Demo4Dashboard />} />
              
              {/* OBS Alert routes */}
              <Route path="/ankit/obs-alerts" element={<AnkitObsAlerts />} />
              <Route path="/techgamer/obs-alerts" element={<TechGamerObsAlerts />} />
              <Route path="/musicstream/obs-alerts" element={<MusicStreamObsAlerts />} />
              <Route path="/fitnessflow/obs-alerts" element={<FitnessFlowObsAlerts />} />
              <Route path="/codelive/obs-alerts" element={<CodeLiveObsAlerts />} />
              <Route path="/artcreate/obs-alerts" element={<ArtCreateObsAlerts />} />
              <Route path="/chiaa_gaming/obs-alerts" element={<ChiaGamingObsAlerts />} />
              <Route path="/demostreamer/obs-alerts" element={<DemoStreamerObsAlerts />} />
              <Route path="/demo2/obs-alerts" element={<Demo2ObsAlerts />} />
              <Route path="/demo3/obs-alerts" element={<Demo3ObsAlerts />} />
              <Route path="/demo4/obs-alerts" element={<Demo4ObsAlerts />} />
              
              {/* Audio Player routes */}
              <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
              <Route path="/techgamer/audio-player" element={<TechGamerAudioPlayer />} />
              <Route path="/musicstream/audio-player" element={<MusicStreamAudioPlayer />} />
              <Route path="/fitnessflow/audio-player" element={<FitnessFlowAudioPlayer />} />
              <Route path="/codelive/audio-player" element={<CodeLiveAudioPlayer />} />
              <Route path="/artcreate/audio-player" element={<ArtCreateAudioPlayer />} />
              <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
              <Route path="/demostreamer/audio-player" element={<DemoStreamerAudioPlayer />} />
              <Route path="/demo2/audio-player" element={<Demo2AudioPlayer />} />
              <Route path="/demo3/audio-player" element={<Demo3AudioPlayer />} />
              <Route path="/demo4/audio-player" element={<Demo4AudioPlayer />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;