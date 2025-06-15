import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ObsConfigProvider } from "@/contexts/ObsConfigContext";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefunds from "./pages/CancellationRefunds";
import Shipping from "./pages/Shipping";
import Blog from "./pages/Blog";
import Sitemap from "./pages/Sitemap";
import SitemapXml from "./pages/SitemapXml";
import NotFound from "./pages/NotFound";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentStatus from "./pages/PaymentStatus";
import DemoPaymentFlow from "./pages/DemoPaymentFlow";
import Ankit from "./pages/Ankit";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import AnkitDonationMessages from "./pages/AnkitDonationMessages";
import AnkitObsOverlay from "./pages/AnkitObsOverlay";
import ChiaaGaming from "./pages/ChiaaGaming";
import ChiaaGamingLogin from "./pages/ChiaaGamingLogin";
import ChiaaGamingDashboard from "./pages/ChiaaGamingDashboard";
import ChiaaGamingDonationMessages from "./pages/ChiaaGamingDonationMessages";
import ChiaaGamingObsOverlay from "./pages/ChiaaGamingObsOverlay";

// Blog posts
import EarnMoneyStreamingIndia from "./pages/blog/EarnMoneyStreamingIndia";
import BestUpiTippingPlatforms from "./pages/blog/BestUpiTippingPlatforms";
import CompleteGuideMonetizeContentIndia from "./pages/blog/CompleteGuideMonetizeContentIndia";
import FanEngagementTools2025 from "./pages/blog/FanEngagementTools2025";
import StreamerDonationAppStrategy from "./pages/blog/StreamerDonationAppStrategy";
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import VirtualGiftsMaximizeRevenue from "./pages/blog/VirtualGiftsMaximizeRevenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ObsConfigProvider>
        <TooltipProvider>
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
              <Route path="/payment/:streamerId" element={<PaymentCheckout />} />
              <Route path="/payment-checkout" element={<PaymentCheckout />} />
              <Route path="/payment-status" element={<PaymentStatus />} />
              <Route path="/demo-payment" element={<DemoPaymentFlow />} />
              
              {/* Ankit routes */}
              <Route path="/ankit" element={<Ankit />} />
              <Route path="/ankit/login" element={<AnkitLogin />} />
              <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
              <Route path="/ankit/messages" element={<AnkitDonationMessages />} />
              <Route path="/ankit/obs/:obsId" element={<AnkitObsOverlay />} />
              
              {/* Chiaa Gaming routes */}
              <Route path="/chiaa_gaming" element={<ChiaaGaming />} />
              <Route path="/chiaa_gaming/login" element={<ChiaaGamingLogin />} />
              <Route path="/chiaa_gaming/dashboard" element={<ChiaaGamingDashboard />} />
              <Route path="/chiaa_gaming/messages" element={<ChiaaGamingDonationMessages />} />
              <Route path="/chiaa_gaming/obs/:obsId" element={<ChiaaGamingObsOverlay />} />
              
              {/* Blog posts */}
              <Route path="/blog/earn-money-streaming-india" element={<EarnMoneyStreamingIndia />} />
              <Route path="/blog/best-upi-tipping-platforms" element={<BestUpiTippingPlatforms />} />
              <Route path="/blog/complete-guide-monetize-content-india" element={<CompleteGuideMonetizeContentIndia />} />
              <Route path="/blog/fan-engagement-tools-2025" element={<FanEngagementTools2025/>} />
              <Route path="/blog/streamer-donation-app-strategy" element={<StreamerDonationAppStrategy />} />
              <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
              <Route path="/blog/virtual-gifts-maximize-revenue" element={<VirtualGiftsMaximizeRevenue />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ObsConfigProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
