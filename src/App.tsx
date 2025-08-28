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
import ChiaaGamingLogin from "./pages/ChiaaGamingLogin";
import Status from "./pages/Status";
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import Ankit from "./pages/Ankit";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import NewStreamer from "./pages/NewStreamer";
import NewStreamerLogin from "./pages/NewStreamerLogin";
import NewStreamerDashboard from "./pages/NewStreamerDashboard";
import NewStreamerAlerts from "./pages/NewStreamerAlerts";
import VoiceAlerts from "./pages/VoiceAlerts";
import AlertsPage from "./pages/AlertsPage";
import AnkitAlerts from "./pages/AnkitAlerts";
import { MessagesModerationPage } from "./pages/MessagesModerationPage";

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
            <Route path="/features" element={<FeatureShowcase />} />
            <Route path="/status" element={<Status />} />
            
            {/* Chia Gaming Routes */}
            <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
            <Route path="/chiaa_gaming/login" element={<ChiaaGamingLogin />} />
            
            {/* Ankit Routes */}
            <Route path="/ankit" element={<Ankit />} />
            <Route path="/ankit/login" element={<AnkitLogin />} />
            <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
            
            {/* New Streamer Routes */}
            <Route path="/newstreamer" element={<NewStreamer />} />
            <Route path="/newstreamer/login" element={<NewStreamerLogin />} />
            <Route path="/newstreamer/dashboard" element={<NewStreamerDashboard />} />
            
            {/* Alerts Routes */}
            <Route path="/voice-alerts/:token" element={<VoiceAlerts />} />
            <Route path="/alerts/:token" element={<AlertsPage />} />
            <Route path="/ankit-alerts/:token" element={<AnkitAlerts />} />
            <Route path="/newstreamer-alerts/:token" element={<NewStreamerAlerts />} />
            
            {/* Moderation Routes */}
            <Route path="/messages-moderation" element={<MessagesModerationPage />} />
            
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