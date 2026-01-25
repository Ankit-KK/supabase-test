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

// Active streamer donation pages
import Ankit from "./pages/Ankit";
import ChiaaGaming from "./pages/ChiaaGaming";
import LooteriyaGaming from "./pages/LooteriyaGaming";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Auth from "./pages/Auth";
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import LooteriyaGamingDashboard from "./pages/dashboard/LooteriyaGamingDashboard";

// OBS Alert pages
import AnkitObsAlerts from "./pages/obs-alerts/AnkitObsAlerts";
import AnkitGoalOverlay from "./pages/obs-alerts/AnkitGoalOverlay";
import ChiaGamingObsAlerts from "./pages/obs-alerts/ChiaGamingObsAlerts";
import ChiaGamingGoalOverlay from "./pages/obs-alerts/ChiaGamingGoalOverlay";
import LooteriyaGamingObsAlerts from "./pages/obs-alerts/LooteriyaGamingObsAlerts";
import LooteriyaGamingGoalOverlay from "./pages/obs-alerts/LooteriyaGamingGoalOverlay";

// Audio Player pages
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import AnkitMediaSourcePlayer from "./pages/audio-player/AnkitMediaSourcePlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import ChiaGamingMediaSourcePlayer from "./pages/audio-player/ChiaGamingMediaSourcePlayer";
import LooteriyaGamingMediaSourcePlayer from "./pages/audio-player/LooteriyaGamingMediaSourcePlayer";

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
            
            {/* Blog posts */}
            <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
            
            {/* Streamer donation pages */}
            <Route path="/ankit" element={<Ankit />} />
            <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
            <Route path="/looteriya_gaming" element={<LooteriyaGaming />} />
            
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
            <Route path="/dashboard/chiaa_gaming" element={<ChiaGamingDashboard />} />
            <Route path="/dashboard/looteriya_gaming" element={<LooteriyaGamingDashboard />} />
            
            {/* OBS Alert routes */}
            <Route path="/ankit/obs-alerts" element={<AnkitObsAlerts />} />
            <Route path="/ankit/goal-overlay" element={<AnkitGoalOverlay />} />
            <Route path="/chiaa_gaming/obs-alerts" element={<ChiaGamingObsAlerts />} />
            <Route path="/chiaa_gaming/goal-overlay" element={<ChiaGamingGoalOverlay />} />
            <Route path="/looteriya_gaming/obs-alerts" element={<LooteriyaGamingObsAlerts />} />
            <Route path="/looteriya_gaming/goal-overlay" element={<LooteriyaGamingGoalOverlay />} />
            
            {/* Audio Player routes */}
            <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
            <Route path="/ankit/media-audio-player" element={<AnkitMediaSourcePlayer />} />
            <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
            <Route path="/chiaa_gaming/media-audio-player" element={<ChiaGamingMediaSourcePlayer />} />
            <Route path="/looteriya_gaming/media-audio-player" element={<LooteriyaGamingMediaSourcePlayer />} />
            
            {/* Catch all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
