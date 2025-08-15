
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
import ChiaGaming from "./pages/ChiaGaming";
import Status from "./pages/Status";
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import OBSSettings from "./pages/OBSSettings";
import AlertsPage from "./pages/AlertsPage";

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
            <Route path="/chia_gaming" element={<ChiaGaming />} />
            <Route path="/status" element={<Status />} />
            
            {/* Authentication and Dashboard */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/obs" element={<OBSSettings />} />
            <Route path="/alerts/:token" element={<AlertsPage />} />
            
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
