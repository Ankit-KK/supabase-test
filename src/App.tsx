
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
import ChiaaGaming from "./pages/ChiaaGaming";
import Status from "./pages/Status";
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import ChiaaGamingLogin from "./pages/ChiaaGamingLogin";
import StreamerDashboard from "./pages/StreamerDashboard";
import AlertsPage from "./pages/AlertsPage";
import Ankit from "./pages/Ankit";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import AnkitAlerts from "./pages/AnkitAlerts";
import AnkitOBSAlerts from "./pages/AnkitOBSAlerts";
import DemoStreamer from "./pages/DemoStreamer";
import DemoStreamerLogin from "./pages/DemoStreamerLogin";
import DemoStreamerDashboard from "./pages/DemoStreamerDashboard";
import DemoStreamerAlerts from "./pages/DemoStreamerAlerts";
import TestAlerts from "./pages/TestAlerts";
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
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/sitemap.xml" element={<SitemapXml />} />
            <Route path="/feature-showcase" element={<FeatureShowcase />} />
            <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
            <Route path="/ankit" element={<Ankit />} />
            <Route path="/demostreamer" element={<DemoStreamer />} />
            <Route path="/techgamer" element={<TechGamer />} />
            <Route path="/musicstream" element={<MusicStream />} />
            <Route path="/codelive" element={<CodeLive />} />
            <Route path="/artcreate" element={<ArtCreate />} />
            <Route path="/fitnessflow" element={<FitnessFlow />} />
            <Route path="/status" element={<Status />} />
            
            {/* Authentication */}
            <Route path="/chiaa_gaming/login" element={<ChiaaGamingLogin />} />
            <Route path="/chiaa_gaming/dashboard" element={<StreamerDashboard />} />
            <Route path="/ankit/login" element={<AnkitLogin />} />
            <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
            <Route path="/demostreamer/login" element={<DemoStreamerLogin />} />
            <Route path="/demostreamer/dashboard" element={<DemoStreamerDashboard />} />
            
            {/* OBS Alerts */}
            <Route path="/alerts/:token" element={<AlertsPage />} />
            <Route path="/ankit-alerts/:token" element={<AnkitAlerts />} />
            <Route path="/ankit/obs-alerts/:token" element={<AnkitOBSAlerts />} />
            <Route path="/demostreamer-alerts/:token" element={<DemoStreamerAlerts />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/techgamer-alerts/:token" element={<TechGamerAlerts />} />
            <Route path="/techgamer/login" element={<TechGamerLogin />} />
            <Route path="/techgamer/dashboard" element={<TechGamerDashboard />} />
            <Route path="/test-alerts" element={<TestAlerts />} />
            
            {/* Blog posts */}
            <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
