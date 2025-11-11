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
import LooteriyaGaming from "./pages/LooteriyaGaming";
import ArtCreate from "./pages/ArtCreate";
import FitnessFlow from "./pages/FitnessFlow";
import Demo2 from "./pages/Demo2";
import Demo3 from "./pages/Demo3";
import Demo4 from "./pages/Demo4";
import ValorantPro from "./pages/ValorantPro";
import CraftMaster from "./pages/CraftMaster";
import ApexLegend from "./pages/ApexLegend";
import LofiBeats from "./pages/LofiBeats";
import YogaTime from "./pages/YogaTime";
import Streamer17 from "./pages/Streamer17";
import Streamer18 from "./pages/Streamer18";
import Streamer19 from "./pages/Streamer19";
import Streamer20 from "./pages/Streamer20";
import Streamer21 from "./pages/Streamer21";
import Streamer22 from "./pages/Streamer22";
import Streamer23 from "./pages/Streamer23";
import Streamer24 from "./pages/Streamer24";
import Streamer25 from "./pages/Streamer25";
import Streamer26 from "./pages/Streamer26";
import Streamer27 from "./pages/Streamer27";
import Streamer28 from "./pages/Streamer28";
import Streamer29 from "./pages/Streamer29";
import Streamer30 from "./pages/Streamer30";
import Streamer31 from "./pages/Streamer31";
import Streamer32 from "./pages/Streamer32";
import Streamer33 from "./pages/Streamer33";
import Streamer34 from "./pages/Streamer34";
import Streamer35 from "./pages/Streamer35";
import Streamer36 from "./pages/Streamer36";
import Streamer37 from "./pages/Streamer37";
import Streamer38 from "./pages/Streamer38";
import Streamer39 from "./pages/Streamer39";
import Streamer40 from "./pages/Streamer40";
import Streamer41 from "./pages/Streamer41";
import Streamer42 from "./pages/Streamer42";
import Streamer43 from "./pages/Streamer43";
import Streamer44 from "./pages/Streamer44";
import Streamer45 from "./pages/Streamer45";
import Streamer46 from "./pages/Streamer46";

// Dashboard pages
import AnkitDashboard from "./pages/dashboard/AnkitDashboard";
import ChiaGamingDashboard from "./pages/dashboard/ChiaGamingDashboard";
import DemoStreamerDashboard from "./pages/dashboard/DemoStreamerDashboard";
import TechGamerDashboard from "./pages/dashboard/TechGamerDashboard";
import MusicStreamDashboard from "./pages/dashboard/MusicStreamDashboard";
import FitnessFlowDashboard from "./pages/dashboard/FitnessFlowDashboard";
import CodeLiveDashboard from "./pages/dashboard/CodeLiveDashboard";
import LooteriyaGamingDashboard from "./pages/dashboard/LooteriyaGamingDashboard";
import ArtCreateDashboard from "./pages/dashboard/ArtCreateDashboard";
import Demo2Dashboard from "./pages/dashboard/Demo2Dashboard";
import Demo3Dashboard from "./pages/dashboard/Demo3Dashboard";
import Demo4Dashboard from "./pages/dashboard/Demo4Dashboard";
import ValorantProDashboard from "./pages/dashboard/ValorantProDashboard";
import CraftMasterDashboard from "./pages/dashboard/CraftMasterDashboard";
import ApexLegendDashboard from "./pages/dashboard/ApexLegendDashboard";
import LofiBeatsDashboard from "./pages/dashboard/LofiBeatsDashboard";
import YogaTimeDashboard from "./pages/dashboard/YogaTimeDashboard";
import Streamer17Dashboard from "./pages/dashboard/Streamer17Dashboard";
import Streamer18Dashboard from "./pages/dashboard/Streamer18Dashboard";
import Streamer19Dashboard from "./pages/dashboard/Streamer19Dashboard";
import Streamer20Dashboard from "./pages/dashboard/Streamer20Dashboard";
import Streamer21Dashboard from "./pages/dashboard/Streamer21Dashboard";
import Streamer22Dashboard from "./pages/dashboard/Streamer22Dashboard";
import Streamer23Dashboard from "./pages/dashboard/Streamer23Dashboard";
import Streamer24Dashboard from "./pages/dashboard/Streamer24Dashboard";
import Streamer25Dashboard from "./pages/dashboard/Streamer25Dashboard";
import Streamer26Dashboard from "./pages/dashboard/Streamer26Dashboard";
import Streamer27Dashboard from "./pages/dashboard/Streamer27Dashboard";
import Streamer28Dashboard from "./pages/dashboard/Streamer28Dashboard";
import Streamer29Dashboard from "./pages/dashboard/Streamer29Dashboard";
import Streamer30Dashboard from "./pages/dashboard/Streamer30Dashboard";
import Streamer31Dashboard from "./pages/dashboard/Streamer31Dashboard";
import Streamer32Dashboard from "./pages/dashboard/Streamer32Dashboard";
import Streamer33Dashboard from "./pages/dashboard/Streamer33Dashboard";
import Streamer34Dashboard from "./pages/dashboard/Streamer34Dashboard";
import Streamer35Dashboard from "./pages/dashboard/Streamer35Dashboard";
import Streamer36Dashboard from "./pages/dashboard/Streamer36Dashboard";
import Streamer37Dashboard from "./pages/dashboard/Streamer37Dashboard";
import Streamer38Dashboard from "./pages/dashboard/Streamer38Dashboard";
import Streamer39Dashboard from "./pages/dashboard/Streamer39Dashboard";
import Streamer40Dashboard from "./pages/dashboard/Streamer40Dashboard";
import Streamer41Dashboard from "./pages/dashboard/Streamer41Dashboard";
import Streamer42Dashboard from "./pages/dashboard/Streamer42Dashboard";
import Streamer43Dashboard from "./pages/dashboard/Streamer43Dashboard";
import Streamer44Dashboard from "./pages/dashboard/Streamer44Dashboard";
import Streamer45Dashboard from "./pages/dashboard/Streamer45Dashboard";
import Streamer46Dashboard from "./pages/dashboard/Streamer46Dashboard";
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
import LooteriyaGamingObsAlerts from "./pages/obs-alerts/LooteriyaGamingObsAlerts";
import ArtCreateObsAlerts from "./pages/obs-alerts/ArtCreateObsAlerts";
import Demo2ObsAlerts from "./pages/obs-alerts/Demo2ObsAlerts";
import Demo3ObsAlerts from "./pages/obs-alerts/Demo3ObsAlerts";
import Demo4ObsAlerts from "./pages/obs-alerts/Demo4ObsAlerts";
import ValorantProObsAlerts from "./pages/obs-alerts/ValorantProObsAlerts";
import CraftMasterObsAlerts from "./pages/obs-alerts/CraftMasterObsAlerts";
import ApexLegendObsAlerts from "./pages/obs-alerts/ApexLegendObsAlerts";
import LofiBeatsObsAlerts from "./pages/obs-alerts/LofiBeatsObsAlerts";
import YogaTimeObsAlerts from "./pages/obs-alerts/YogaTimeObsAlerts";
import Streamer17ObsAlerts from "./pages/obs-alerts/Streamer17ObsAlerts";
import Streamer18ObsAlerts from "./pages/obs-alerts/Streamer18ObsAlerts";
import Streamer19ObsAlerts from "./pages/obs-alerts/Streamer19ObsAlerts";
import Streamer20ObsAlerts from "./pages/obs-alerts/Streamer20ObsAlerts";
import Streamer21ObsAlerts from "./pages/obs-alerts/Streamer21ObsAlerts";
import Streamer22ObsAlerts from "./pages/obs-alerts/Streamer22ObsAlerts";
import Streamer23ObsAlerts from "./pages/obs-alerts/Streamer23ObsAlerts";
import Streamer24ObsAlerts from "./pages/obs-alerts/Streamer24ObsAlerts";
import Streamer25ObsAlerts from "./pages/obs-alerts/Streamer25ObsAlerts";
import Streamer26ObsAlerts from "./pages/obs-alerts/Streamer26ObsAlerts";
import Streamer27ObsAlerts from "./pages/obs-alerts/Streamer27ObsAlerts";
import Streamer28ObsAlerts from "./pages/obs-alerts/Streamer28ObsAlerts";
import Streamer29ObsAlerts from "./pages/obs-alerts/Streamer29ObsAlerts";
import Streamer30ObsAlerts from "./pages/obs-alerts/Streamer30ObsAlerts";
import Streamer31ObsAlerts from "./pages/obs-alerts/Streamer31ObsAlerts";
import Streamer32ObsAlerts from "./pages/obs-alerts/Streamer32ObsAlerts";
import Streamer33ObsAlerts from "./pages/obs-alerts/Streamer33ObsAlerts";
import Streamer34ObsAlerts from "./pages/obs-alerts/Streamer34ObsAlerts";
import Streamer35ObsAlerts from "./pages/obs-alerts/Streamer35ObsAlerts";
import Streamer36ObsAlerts from "./pages/obs-alerts/Streamer36ObsAlerts";
import Streamer37ObsAlerts from "./pages/obs-alerts/Streamer37ObsAlerts";
import Streamer38ObsAlerts from "./pages/obs-alerts/Streamer38ObsAlerts";
import Streamer39ObsAlerts from "./pages/obs-alerts/Streamer39ObsAlerts";
import Streamer40ObsAlerts from "./pages/obs-alerts/Streamer40ObsAlerts";
import Streamer41ObsAlerts from "./pages/obs-alerts/Streamer41ObsAlerts";
import Streamer42ObsAlerts from "./pages/obs-alerts/Streamer42ObsAlerts";
import Streamer43ObsAlerts from "./pages/obs-alerts/Streamer43ObsAlerts";
import Streamer44ObsAlerts from "./pages/obs-alerts/Streamer44ObsAlerts";
import Streamer45ObsAlerts from "./pages/obs-alerts/Streamer45ObsAlerts";
import Streamer46ObsAlerts from "./pages/obs-alerts/Streamer46ObsAlerts";

// Audio Player pages
import AnkitAudioPlayer from "./pages/audio-player/AnkitAudioPlayer";
import ChiaGamingAudioPlayer from "./pages/audio-player/ChiaGamingAudioPlayer";
import DemoStreamerAudioPlayer from "./pages/audio-player/DemoStreamerAudioPlayer";
import TechGamerAudioPlayer from "./pages/audio-player/TechGamerAudioPlayer";
import MusicStreamAudioPlayer from "./pages/audio-player/MusicStreamAudioPlayer";
import FitnessFlowAudioPlayer from "./pages/audio-player/FitnessFlowAudioPlayer";
import CodeLiveAudioPlayer from "./pages/audio-player/CodeLiveAudioPlayer";
import LooteriyaGamingAudioPlayer from "./pages/audio-player/LooteriyaGamingAudioPlayer";
import ArtCreateAudioPlayer from "./pages/audio-player/ArtCreateAudioPlayer";
import Demo2AudioPlayer from "./pages/audio-player/Demo2AudioPlayer";
import Demo3AudioPlayer from "./pages/audio-player/Demo3AudioPlayer";
import Demo4AudioPlayer from "./pages/audio-player/Demo4AudioPlayer";
import ValorantProAudioPlayer from "./pages/audio-player/ValorantProAudioPlayer";
import CraftMasterAudioPlayer from "./pages/audio-player/CraftMasterAudioPlayer";
import ApexLegendAudioPlayer from "./pages/audio-player/ApexLegendAudioPlayer";
import LofiBeatsAudioPlayer from "./pages/audio-player/LofiBeatsAudioPlayer";
import YogaTimeAudioPlayer from "./pages/audio-player/YogaTimeAudioPlayer";
import Streamer17AudioPlayer from "./pages/audio-player/Streamer17AudioPlayer";
import Streamer18AudioPlayer from "./pages/audio-player/Streamer18AudioPlayer";
import Streamer19AudioPlayer from "./pages/audio-player/Streamer19AudioPlayer";
import Streamer20AudioPlayer from "./pages/audio-player/Streamer20AudioPlayer";
import Streamer21AudioPlayer from "./pages/audio-player/Streamer21AudioPlayer";
import Streamer22AudioPlayer from "./pages/audio-player/Streamer22AudioPlayer";
import Streamer23AudioPlayer from "./pages/audio-player/Streamer23AudioPlayer";
import Streamer24AudioPlayer from "./pages/audio-player/Streamer24AudioPlayer";
import Streamer25AudioPlayer from "./pages/audio-player/Streamer25AudioPlayer";
import Streamer26AudioPlayer from "./pages/audio-player/Streamer26AudioPlayer";
import Streamer27AudioPlayer from "./pages/audio-player/Streamer27AudioPlayer";
import Streamer28AudioPlayer from "./pages/audio-player/Streamer28AudioPlayer";
import Streamer29AudioPlayer from "./pages/audio-player/Streamer29AudioPlayer";
import Streamer30AudioPlayer from "./pages/audio-player/Streamer30AudioPlayer";
import Streamer31AudioPlayer from "./pages/audio-player/Streamer31AudioPlayer";
import Streamer32AudioPlayer from "./pages/audio-player/Streamer32AudioPlayer";
import Streamer33AudioPlayer from "./pages/audio-player/Streamer33AudioPlayer";
import Streamer34AudioPlayer from "./pages/audio-player/Streamer34AudioPlayer";
import Streamer35AudioPlayer from "./pages/audio-player/Streamer35AudioPlayer";
import Streamer36AudioPlayer from "./pages/audio-player/Streamer36AudioPlayer";
import Streamer37AudioPlayer from "./pages/audio-player/Streamer37AudioPlayer";
import Streamer38AudioPlayer from "./pages/audio-player/Streamer38AudioPlayer";
import Streamer39AudioPlayer from "./pages/audio-player/Streamer39AudioPlayer";
import Streamer40AudioPlayer from "./pages/audio-player/Streamer40AudioPlayer";
import Streamer41AudioPlayer from "./pages/audio-player/Streamer41AudioPlayer";
import Streamer42AudioPlayer from "./pages/audio-player/Streamer42AudioPlayer";
import Streamer43AudioPlayer from "./pages/audio-player/Streamer43AudioPlayer";
import Streamer44AudioPlayer from "./pages/audio-player/Streamer44AudioPlayer";
import Streamer45AudioPlayer from "./pages/audio-player/Streamer45AudioPlayer";
import Streamer46AudioPlayer from "./pages/audio-player/Streamer46AudioPlayer";

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
              <Route path="/looteriya_gaming" element={<LooteriyaGaming />} />
              <Route path="/artcreate" element={<ArtCreate />} />
              <Route path="/fitnessflow" element={<FitnessFlow />} />
              <Route path="/demostreamer" element={<DemoStreamer />} />
              <Route path="/demo2" element={<Demo2 />} />
              <Route path="/demo3" element={<Demo3 />} />
              <Route path="/demo4" element={<Demo4 />} />
              <Route path="/valorantpro" element={<ValorantPro />} />
              <Route path="/craftmaster" element={<CraftMaster />} />
              <Route path="/apexlegend" element={<ApexLegend />} />
              <Route path="/lofibeats" element={<LofiBeats />} />
              <Route path="/yogatime" element={<YogaTime />} />
              <Route path="/streamer17" element={<Streamer17 />} />
              <Route path="/streamer18" element={<Streamer18 />} />
              <Route path="/streamer19" element={<Streamer19 />} />
              <Route path="/streamer20" element={<Streamer20 />} />
              <Route path="/streamer21" element={<Streamer21 />} />
              <Route path="/streamer22" element={<Streamer22 />} />
              <Route path="/streamer23" element={<Streamer23 />} />
              <Route path="/streamer24" element={<Streamer24 />} />
              <Route path="/streamer25" element={<Streamer25 />} />
              <Route path="/streamer26" element={<Streamer26 />} />
              <Route path="/streamer27" element={<Streamer27 />} />
              <Route path="/streamer28" element={<Streamer28 />} />
              <Route path="/streamer29" element={<Streamer29 />} />
              <Route path="/streamer30" element={<Streamer30 />} />
              <Route path="/streamer31" element={<Streamer31 />} />
              <Route path="/streamer32" element={<Streamer32 />} />
              <Route path="/streamer33" element={<Streamer33 />} />
              <Route path="/streamer34" element={<Streamer34 />} />
              <Route path="/streamer35" element={<Streamer35 />} />
              <Route path="/streamer36" element={<Streamer36 />} />
              <Route path="/streamer37" element={<Streamer37 />} />
              <Route path="/streamer38" element={<Streamer38 />} />
              <Route path="/streamer39" element={<Streamer39 />} />
              <Route path="/streamer40" element={<Streamer40 />} />
              <Route path="/streamer41" element={<Streamer41 />} />
              <Route path="/streamer42" element={<Streamer42 />} />
              <Route path="/streamer43" element={<Streamer43 />} />
              <Route path="/streamer44" element={<Streamer44 />} />
              <Route path="/streamer45" element={<Streamer45 />} />
              <Route path="/streamer46" element={<Streamer46 />} />
              
              {/* Authentication */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/ankit" element={<AnkitDashboard />} />
              <Route path="/dashboard/techgamer" element={<TechGamerDashboard />} />
              <Route path="/dashboard/musicstream" element={<MusicStreamDashboard />} />
              <Route path="/dashboard/fitnessflow" element={<FitnessFlowDashboard />} />
              <Route path="/dashboard/codelive" element={<CodeLiveDashboard />} />
              <Route path="/dashboard/looteriya_gaming" element={<LooteriyaGamingDashboard />} />
              <Route path="/dashboard/artcreate" element={<ArtCreateDashboard />} />
              <Route path="/dashboard/chiaa_gaming" element={<ChiaGamingDashboard />} />
              <Route path="/dashboard/demostreamer" element={<DemoStreamerDashboard />} />
              <Route path="/dashboard/demo2" element={<Demo2Dashboard />} />
              <Route path="/dashboard/demo3" element={<Demo3Dashboard />} />
              <Route path="/dashboard/demo4" element={<Demo4Dashboard />} />
              <Route path="/dashboard/valorantpro" element={<ValorantProDashboard />} />
              <Route path="/dashboard/craftmaster" element={<CraftMasterDashboard />} />
              <Route path="/dashboard/apexlegend" element={<ApexLegendDashboard />} />
              <Route path="/dashboard/lofibeats" element={<LofiBeatsDashboard />} />
              <Route path="/dashboard/yogatime" element={<YogaTimeDashboard />} />
              <Route path="/dashboard/streamer17" element={<Streamer17Dashboard />} />
              <Route path="/dashboard/streamer18" element={<Streamer18Dashboard />} />
              <Route path="/dashboard/streamer19" element={<Streamer19Dashboard />} />
              <Route path="/dashboard/streamer20" element={<Streamer20Dashboard />} />
              <Route path="/dashboard/streamer21" element={<Streamer21Dashboard />} />
              <Route path="/dashboard/streamer22" element={<Streamer22Dashboard />} />
              <Route path="/dashboard/streamer23" element={<Streamer23Dashboard />} />
              <Route path="/dashboard/streamer24" element={<Streamer24Dashboard />} />
              <Route path="/dashboard/streamer25" element={<Streamer25Dashboard />} />
              <Route path="/dashboard/streamer26" element={<Streamer26Dashboard />} />
              <Route path="/dashboard/streamer27" element={<Streamer27Dashboard />} />
              <Route path="/dashboard/streamer28" element={<Streamer28Dashboard />} />
              <Route path="/dashboard/streamer29" element={<Streamer29Dashboard />} />
              <Route path="/dashboard/streamer30" element={<Streamer30Dashboard />} />
              <Route path="/dashboard/streamer31" element={<Streamer31Dashboard />} />
              <Route path="/dashboard/streamer32" element={<Streamer32Dashboard />} />
              <Route path="/dashboard/streamer33" element={<Streamer33Dashboard />} />
              <Route path="/dashboard/streamer34" element={<Streamer34Dashboard />} />
              <Route path="/dashboard/streamer35" element={<Streamer35Dashboard />} />
              <Route path="/dashboard/streamer36" element={<Streamer36Dashboard />} />
              <Route path="/dashboard/streamer37" element={<Streamer37Dashboard />} />
              <Route path="/dashboard/streamer38" element={<Streamer38Dashboard />} />
              <Route path="/dashboard/streamer39" element={<Streamer39Dashboard />} />
              <Route path="/dashboard/streamer40" element={<Streamer40Dashboard />} />
              <Route path="/dashboard/streamer41" element={<Streamer41Dashboard />} />
              <Route path="/dashboard/streamer42" element={<Streamer42Dashboard />} />
              <Route path="/dashboard/streamer43" element={<Streamer43Dashboard />} />
              <Route path="/dashboard/streamer44" element={<Streamer44Dashboard />} />
              <Route path="/dashboard/streamer45" element={<Streamer45Dashboard />} />
              <Route path="/dashboard/streamer46" element={<Streamer46Dashboard />} />
              
              {/* OBS Alert routes */}
              <Route path="/ankit/obs-alerts" element={<AnkitObsAlerts />} />
              <Route path="/techgamer/obs-alerts" element={<TechGamerObsAlerts />} />
              <Route path="/musicstream/obs-alerts" element={<MusicStreamObsAlerts />} />
              <Route path="/fitnessflow/obs-alerts" element={<FitnessFlowObsAlerts />} />
              <Route path="/codelive/obs-alerts" element={<CodeLiveObsAlerts />} />
              <Route path="/looteriya_gaming/obs-alerts" element={<LooteriyaGamingObsAlerts />} />
              <Route path="/artcreate/obs-alerts" element={<ArtCreateObsAlerts />} />
              <Route path="/chiaa_gaming/obs-alerts" element={<ChiaGamingObsAlerts />} />
              <Route path="/demostreamer/obs-alerts" element={<DemoStreamerObsAlerts />} />
              <Route path="/demo2/obs-alerts" element={<Demo2ObsAlerts />} />
              <Route path="/demo3/obs-alerts" element={<Demo3ObsAlerts />} />
              <Route path="/demo4/obs-alerts" element={<Demo4ObsAlerts />} />
              <Route path="/valorantpro/obs-alerts" element={<ValorantProObsAlerts />} />
              <Route path="/craftmaster/obs-alerts" element={<CraftMasterObsAlerts />} />
              <Route path="/apexlegend/obs-alerts" element={<ApexLegendObsAlerts />} />
              <Route path="/lofibeats/obs-alerts" element={<LofiBeatsObsAlerts />} />
              <Route path="/yogatime/obs-alerts" element={<YogaTimeObsAlerts />} />
              <Route path="/streamer17/obs-alerts" element={<Streamer17ObsAlerts />} />
              <Route path="/streamer18/obs-alerts" element={<Streamer18ObsAlerts />} />
              <Route path="/streamer19/obs-alerts" element={<Streamer19ObsAlerts />} />
              <Route path="/streamer20/obs-alerts" element={<Streamer20ObsAlerts />} />
              <Route path="/streamer21/obs-alerts" element={<Streamer21ObsAlerts />} />
              <Route path="/streamer22/obs-alerts" element={<Streamer22ObsAlerts />} />
              <Route path="/streamer23/obs-alerts" element={<Streamer23ObsAlerts />} />
              <Route path="/streamer24/obs-alerts" element={<Streamer24ObsAlerts />} />
              <Route path="/streamer25/obs-alerts" element={<Streamer25ObsAlerts />} />
              <Route path="/streamer26/obs-alerts" element={<Streamer26ObsAlerts />} />
              <Route path="/streamer27/obs-alerts" element={<Streamer27ObsAlerts />} />
              <Route path="/streamer28/obs-alerts" element={<Streamer28ObsAlerts />} />
              <Route path="/streamer29/obs-alerts" element={<Streamer29ObsAlerts />} />
              <Route path="/streamer30/obs-alerts" element={<Streamer30ObsAlerts />} />
              <Route path="/streamer31/obs-alerts" element={<Streamer31ObsAlerts />} />
              <Route path="/streamer32/obs-alerts" element={<Streamer32ObsAlerts />} />
              <Route path="/streamer33/obs-alerts" element={<Streamer33ObsAlerts />} />
              <Route path="/streamer34/obs-alerts" element={<Streamer34ObsAlerts />} />
              <Route path="/streamer35/obs-alerts" element={<Streamer35ObsAlerts />} />
              <Route path="/streamer36/obs-alerts" element={<Streamer36ObsAlerts />} />
              <Route path="/streamer37/obs-alerts" element={<Streamer37ObsAlerts />} />
              <Route path="/streamer38/obs-alerts" element={<Streamer38ObsAlerts />} />
              <Route path="/streamer39/obs-alerts" element={<Streamer39ObsAlerts />} />
              <Route path="/streamer40/obs-alerts" element={<Streamer40ObsAlerts />} />
              <Route path="/streamer41/obs-alerts" element={<Streamer41ObsAlerts />} />
              <Route path="/streamer42/obs-alerts" element={<Streamer42ObsAlerts />} />
              <Route path="/streamer43/obs-alerts" element={<Streamer43ObsAlerts />} />
              <Route path="/streamer44/obs-alerts" element={<Streamer44ObsAlerts />} />
              <Route path="/streamer45/obs-alerts" element={<Streamer45ObsAlerts />} />
              <Route path="/streamer46/obs-alerts" element={<Streamer46ObsAlerts />} />
              
              {/* Audio Player routes */}
              <Route path="/ankit/audio-player" element={<AnkitAudioPlayer />} />
              <Route path="/techgamer/audio-player" element={<TechGamerAudioPlayer />} />
              <Route path="/musicstream/audio-player" element={<MusicStreamAudioPlayer />} />
              <Route path="/fitnessflow/audio-player" element={<FitnessFlowAudioPlayer />} />
              <Route path="/codelive/audio-player" element={<CodeLiveAudioPlayer />} />
              <Route path="/looteriya_gaming/audio-player" element={<LooteriyaGamingAudioPlayer />} />
              <Route path="/artcreate/audio-player" element={<ArtCreateAudioPlayer />} />
              <Route path="/chiaa_gaming/audio-player" element={<ChiaGamingAudioPlayer />} />
              <Route path="/demostreamer/audio-player" element={<DemoStreamerAudioPlayer />} />
              <Route path="/demo2/audio-player" element={<Demo2AudioPlayer />} />
              <Route path="/demo3/audio-player" element={<Demo3AudioPlayer />} />
              <Route path="/demo4/audio-player" element={<Demo4AudioPlayer />} />
              <Route path="/valorantpro/audio-player" element={<ValorantProAudioPlayer />} />
              <Route path="/craftmaster/audio-player" element={<CraftMasterAudioPlayer />} />
              <Route path="/apexlegend/audio-player" element={<ApexLegendAudioPlayer />} />
              <Route path="/lofibeats/audio-player" element={<LofiBeatsAudioPlayer />} />
              <Route path="/yogatime/audio-player" element={<YogaTimeAudioPlayer />} />
              <Route path="/streamer17/audio-player" element={<Streamer17AudioPlayer />} />
              <Route path="/streamer18/audio-player" element={<Streamer18AudioPlayer />} />
              <Route path="/streamer19/audio-player" element={<Streamer19AudioPlayer />} />
              <Route path="/streamer20/audio-player" element={<Streamer20AudioPlayer />} />
              <Route path="/streamer21/audio-player" element={<Streamer21AudioPlayer />} />
              <Route path="/streamer22/audio-player" element={<Streamer22AudioPlayer />} />
              <Route path="/streamer23/audio-player" element={<Streamer23AudioPlayer />} />
              <Route path="/streamer24/audio-player" element={<Streamer24AudioPlayer />} />
              <Route path="/streamer25/audio-player" element={<Streamer25AudioPlayer />} />
              <Route path="/streamer26/audio-player" element={<Streamer26AudioPlayer />} />
              <Route path="/streamer27/audio-player" element={<Streamer27AudioPlayer />} />
              <Route path="/streamer28/audio-player" element={<Streamer28AudioPlayer />} />
              <Route path="/streamer29/audio-player" element={<Streamer29AudioPlayer />} />
              <Route path="/streamer30/audio-player" element={<Streamer30AudioPlayer />} />
              <Route path="/streamer31/audio-player" element={<Streamer31AudioPlayer />} />
              <Route path="/streamer32/audio-player" element={<Streamer32AudioPlayer />} />
              <Route path="/streamer33/audio-player" element={<Streamer33AudioPlayer />} />
              <Route path="/streamer34/audio-player" element={<Streamer34AudioPlayer />} />
              <Route path="/streamer35/audio-player" element={<Streamer35AudioPlayer />} />
              <Route path="/streamer36/audio-player" element={<Streamer36AudioPlayer />} />
              <Route path="/streamer37/audio-player" element={<Streamer37AudioPlayer />} />
              <Route path="/streamer38/audio-player" element={<Streamer38AudioPlayer />} />
              <Route path="/streamer39/audio-player" element={<Streamer39AudioPlayer />} />
              <Route path="/streamer40/audio-player" element={<Streamer40AudioPlayer />} />
              <Route path="/streamer41/audio-player" element={<Streamer41AudioPlayer />} />
              <Route path="/streamer42/audio-player" element={<Streamer42AudioPlayer />} />
              <Route path="/streamer43/audio-player" element={<Streamer43AudioPlayer />} />
              <Route path="/streamer44/audio-player" element={<Streamer44AudioPlayer />} />
              <Route path="/streamer45/audio-player" element={<Streamer45AudioPlayer />} />
              <Route path="/streamer46/audio-player" element={<Streamer46AudioPlayer />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;