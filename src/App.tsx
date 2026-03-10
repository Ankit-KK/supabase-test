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
import Zishu from "./pages/Zishu";
import Brigzard from "./pages/Brigzard";
import WEra from "./pages/WEra";
import MrChampion from "./pages/MrChampion";
import Demigod from "./pages/Demigod";
import NovaPlays from "./pages/NovaPlays";
import StarlightAnya from "./pages/StarlightAnya";
import ReynaYadav from "./pages/ReynaYadav";

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
import ZishuDashboard from "./pages/dashboard/ZishuDashboard";
import BrigzardDashboard from "./pages/dashboard/BrigzardDashboard";
import WEraDashboard from "./pages/dashboard/WEraDashboard";
import MrChampionDashboard from "./pages/dashboard/MrChampionDashboard";
import DemigodDashboard from "./pages/dashboard/DemigodDashboard";
import NovaPlaysDashboard from "./pages/dashboard/NovaPlaysDashboard";
import StarlightAnyaDashboard from "./pages/dashboard/StarlightAnyaDashboard";
import ReynaYadavDashboard from "./pages/dashboard/ReynaYadavDashboard";

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
import ZishuObsAlerts from "./pages/obs-alerts/ZishuObsAlerts";
import ZishuGoalOverlay from "./pages/obs-alerts/ZishuGoalOverlay";
import BrigzardObsAlerts from "./pages/obs-alerts/BrigzardObsAlerts";
import BrigzardGoalOverlay from "./pages/obs-alerts/BrigzardGoalOverlay";
import WEraObsAlerts from "./pages/obs-alerts/WEraObsAlerts";
import WEraGoalOverlay from "./pages/obs-alerts/WEraGoalOverlay";
import MrChampionObsAlerts from "./pages/obs-alerts/MrChampionObsAlerts";
import MrChampionGoalOverlay from "./pages/obs-alerts/MrChampionGoalOverlay";
import DemigodObsAlerts from "./pages/obs-alerts/DemigodObsAlerts";
import DemigodGoalOverlay from "./pages/obs-alerts/DemigodGoalOverlay";
import NovaPlaysObsAlerts from "./pages/obs-alerts/NovaPlaysObsAlerts";
import NovaPlaysGoalOverlay from "./pages/obs-alerts/NovaPlaysGoalOverlay";
import StarlightAnyaObsAlerts from "./pages/obs-alerts/StarlightAnyaObsAlerts";
import StarlightAnyaGoalOverlay from "./pages/obs-alerts/StarlightAnyaGoalOverlay";
import ReynaYadavObsAlerts from "./pages/obs-alerts/ReynaYadavObsAlerts";
import ReynaYadavGoalOverlay from "./pages/obs-alerts/ReynaYadavGoalOverlay";

// Audio Player pages
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import AnkitMediaSourcePlayer from "./pages/audio-player/AnkitMediaSourcePlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import ChiaGamingMediaSourcePlayer from "./pages/audio-player/ChiaGamingMediaSourcePlayer";
import LooteriyaGamingMediaSourcePlayer from "./pages/audio-player/LooteriyaGamingMediaSourcePlayer";
import ClumsyGodMediaSourcePlayer from "./pages/audio-player/ClumsyGodMediaSourcePlayer";
import WolfyMediaSourcePlayer from "./pages/audio-player/WolfyMediaSourcePlayer";
import DorpPlaysMediaSourcePlayer from "./pages/audio-player/DorpPlaysMediaSourcePlayer";
import ZishuMediaSourcePlayer from "./pages/audio-player/ZishuMediaSourcePlayer";
import BrigzardMediaSourcePlayer from "./pages/audio-player/BrigzardMediaSourcePlayer";
import WEraMediaSourcePlayer from "./pages/audio-player/WEraMediaSourcePlayer";
import MrChampionMediaSourcePlayer from "./pages/audio-player/MrChampionMediaSourcePlayer";
import DemigodMediaSourcePlayer from "./pages/audio-player/DemigodMediaSourcePlayer";
import NovaPlaysMediaSourcePlayer from "./pages/audio-player/NovaPlaysMediaSourcePlayer";
import StarlightAnyaMediaSourcePlayer from "./pages/audio-player/StarlightAnyaMediaSourcePlayer";
import ReynaYadavMediaSourcePlayer from "./pages/audio-player/ReynaYadavMediaSourcePlayer";

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
            <Route path="/zishu" element={<Zishu />} />
            <Route path="/brigzard" element={<Brigzard />} />
            <Route path="/w_era" element={<WEra />} />
            <Route path="/mr_champion" element={<MrChampion />} />
            <Route path="/demigod" element={<Demigod />} />
            <Route path="/nova_plays" element={<NovaPlays />} />
            <Route path="/starlight_anya" element={<StarlightAnya />} />
            <Route path="/reyna_yadav" element={<ReynaYadav />} />
            
            
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
            <Route path="/dashboard/zishu" element={<ZishuDashboard />} />
            <Route path="/dashboard/brigzard" element={<BrigzardDashboard />} />
            <Route path="/dashboard/w_era" element={<WEraDashboard />} />
            <Route path="/dashboard/mr_champion" element={<MrChampionDashboard />} />
            <Route path="/dashboard/demigod" element={<DemigodDashboard />} />
            <Route path="/dashboard/nova_plays" element={<NovaPlaysDashboard />} />
            <Route path="/dashboard/starlight_anya" element={<StarlightAnyaDashboard />} />
            <Route path="/dashboard/reyna_yadav" element={<ReynaYadavDashboard />} />
            
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
            <Route path="/zishu/obs-alerts" element={<ZishuObsAlerts />} />
            <Route path="/zishu/goal-overlay" element={<ZishuGoalOverlay />} />
            <Route path="/brigzard/obs-alerts" element={<BrigzardObsAlerts />} />
            <Route path="/brigzard/goal-overlay" element={<BrigzardGoalOverlay />} />
            <Route path="/w_era/obs-alerts" element={<WEraObsAlerts />} />
            <Route path="/w_era/goal-overlay" element={<WEraGoalOverlay />} />
            <Route path="/mr_champion/obs-alerts" element={<MrChampionObsAlerts />} />
            <Route path="/mr_champion/goal-overlay" element={<MrChampionGoalOverlay />} />
            <Route path="/demigod/obs-alerts" element={<DemigodObsAlerts />} />
            <Route path="/demigod/goal-overlay" element={<DemigodGoalOverlay />} />
            <Route path="/nova_plays/obs-alerts" element={<NovaPlaysObsAlerts />} />
            <Route path="/nova_plays/goal-overlay" element={<NovaPlaysGoalOverlay />} />
            <Route path="/starlight_anya/obs-alerts" element={<StarlightAnyaObsAlerts />} />
            <Route path="/starlight_anya/goal-overlay" element={<StarlightAnyaGoalOverlay />} />
            <Route path="/reyna_yadav/obs-alerts" element={<ReynaYadavObsAlerts />} />
            <Route path="/reyna_yadav/goal-overlay" element={<ReynaYadavGoalOverlay />} />
            
            {/* Audio Player routes */}
            <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
            <Route path="/ankit/media-audio-player" element={<AnkitMediaSourcePlayer />} />
            <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
            <Route path="/chiaa_gaming/media-audio-player" element={<ChiaGamingMediaSourcePlayer />} />
            <Route path="/looteriya_gaming/media-audio-player" element={<LooteriyaGamingMediaSourcePlayer />} />
            <Route path="/clumsy_god/media-audio-player" element={<ClumsyGodMediaSourcePlayer />} />
            <Route path="/wolfy/media-audio-player" element={<WolfyMediaSourcePlayer />} />
            <Route path="/dorp_plays/media-audio-player" element={<DorpPlaysMediaSourcePlayer />} />
            <Route path="/zishu/media-audio-player" element={<ZishuMediaSourcePlayer />} />
            <Route path="/brigzard/media-audio-player" element={<BrigzardMediaSourcePlayer />} />
            <Route path="/w_era/media-audio-player" element={<WEraMediaSourcePlayer />} />
            <Route path="/mr_champion/media-audio-player" element={<MrChampionMediaSourcePlayer />} />
            <Route path="/demigod/media-audio-player" element={<DemigodMediaSourcePlayer />} />
            <Route path="/nova_plays/media-audio-player" element={<NovaPlaysMediaSourcePlayer />} />
            <Route path="/starlight_anya/media-audio-player" element={<StarlightAnyaMediaSourcePlayer />} />
            <Route path="/reyna_yadav/media-audio-player" element={<ReynaYadavMediaSourcePlayer />} />
            
            {/* Catch all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
