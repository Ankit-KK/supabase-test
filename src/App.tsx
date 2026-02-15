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
import ClumsyGod from "./pages/ClumsyGod";
import Wolfy from "./pages/Wolfy";
import DorpPlays from "./pages/DorpPlays";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import LooteriyaGamingDashboard from "./pages/dashboard/LooteriyaGamingDashboard";
import ClumsyGodDashboard from "./pages/dashboard/ClumsyGodDashboard";
import WolfyDashboard from "./pages/dashboard/WolfyDashboard";
import DorpPlaysDashboard from "./pages/dashboard/DorpPlaysDashboard";

// OBS Alert pages
import AnkitObsAlerts from "./pages/obs-alerts/AnkitObsAlerts";
import AnkitGoalOverlay from "./pages/obs-alerts/AnkitGoalOverlay";
import ChiaGamingObsAlerts from "./pages/obs-alerts/ChiaGamingObsAlerts";
import ChiaGamingGoalOverlay from "./pages/obs-alerts/ChiaGamingGoalOverlay";
import LooteriyaGamingObsAlerts from "./pages/obs-alerts/LooteriyaGamingObsAlerts";
import LooteriyaGamingGoalOverlay from "./pages/obs-alerts/LooteriyaGamingGoalOverlay";
import ClumsyGodObsAlerts from "./pages/obs-alerts/ClumsyGodObsAlerts";
import ClumsyGodGoalOverlay from "./pages/obs-alerts/ClumsyGodGoalOverlay";
import WolfyObsAlerts from "./pages/obs-alerts/WolfyObsAlerts";
import WolfyGoalOverlay from "./pages/obs-alerts/WolfyGoalOverlay";
import DorpPlaysObsAlerts from "./pages/obs-alerts/DorpPlaysObsAlerts";
import DorpPlaysGoalOverlay from "./pages/obs-alerts/DorpPlaysGoalOverlay";

// Audio Player pages
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import AnkitMediaSourcePlayer from "./pages/audio-player/AnkitMediaSourcePlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import ChiaGamingMediaSourcePlayer from "./pages/audio-player/ChiaGamingMediaSourcePlayer";
import LooteriyaGamingMediaSourcePlayer from "./pages/audio-player/LooteriyaGamingMediaSourcePlayer";
import ClumsyGodMediaSourcePlayer from "./pages/audio-player/ClumsyGodMediaSourcePlayer";
import WolfyMediaSourcePlayer from "./pages/audio-player/WolfyMediaSourcePlayer";
import DorpPlaysMediaSourcePlayer from "./pages/audio-player/DorpPlaysMediaSourcePlayer";

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
            <Route path="/clumsy_god" element={<ClumsyGod />} />
            <Route path="/wolfy" element={<Wolfy />} />
            <Route path="/dorp_plays" element={<DorpPlays />} />
            
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-request" element={<ForgotPassword />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
            <Route path="/dashboard/chiaa_gaming" element={<ChiaGamingDashboard />} />
            <Route path="/dashboard/looteriya_gaming" element={<LooteriyaGamingDashboard />} />
            <Route path="/dashboard/clumsy_god" element={<ClumsyGodDashboard />} />
            <Route path="/dashboard/wolfy" element={<WolfyDashboard />} />
            <Route path="/dashboard/dorp_plays" element={<DorpPlaysDashboard />} />
            
            {/* OBS Alert routes */}
            <Route path="/ankit/obs-alerts" element={<AnkitObsAlerts />} />
            <Route path="/ankit/goal-overlay" element={<AnkitGoalOverlay />} />
            <Route path="/chiaa_gaming/obs-alerts" element={<ChiaGamingObsAlerts />} />
            <Route path="/chiaa_gaming/goal-overlay" element={<ChiaGamingGoalOverlay />} />
            <Route path="/looteriya_gaming/obs-alerts" element={<LooteriyaGamingObsAlerts />} />
            <Route path="/looteriya_gaming/goal-overlay" element={<LooteriyaGamingGoalOverlay />} />
            <Route path="/clumsy_god/obs-alerts" element={<ClumsyGodObsAlerts />} />
            <Route path="/clumsy_god/goal-overlay" element={<ClumsyGodGoalOverlay />} />
            <Route path="/wolfy/obs-alerts" element={<WolfyObsAlerts />} />
            <Route path="/wolfy/goal-overlay" element={<WolfyGoalOverlay />} />
            <Route path="/dorp_plays/obs-alerts" element={<DorpPlaysObsAlerts />} />
            <Route path="/dorp_plays/goal-overlay" element={<DorpPlaysGoalOverlay />} />
            
            {/* Audio Player routes */}
            <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
            <Route path="/ankit/media-audio-player" element={<AnkitMediaSourcePlayer />} />
            <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
            <Route path="/chiaa_gaming/media-audio-player" element={<ChiaGamingMediaSourcePlayer />} />
            <Route path="/looteriya_gaming/media-audio-player" element={<LooteriyaGamingMediaSourcePlayer />} />
            <Route path="/clumsy_god/media-audio-player" element={<ClumsyGodMediaSourcePlayer />} />
            <Route path="/wolfy/media-audio-player" element={<WolfyMediaSourcePlayer />} />
            <Route path="/dorp_plays/media-audio-player" element={<DorpPlaysMediaSourcePlayer />} />
            
            {/* Catch all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
