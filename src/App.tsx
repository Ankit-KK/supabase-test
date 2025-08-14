
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefunds from "./pages/CancellationRefunds";
import Shipping from "./pages/Shipping";
import Blog from "./pages/Blog";
import Sitemap from "./pages/Sitemap";
import SitemapXml from "./pages/SitemapXml";
import NotFound from "./pages/NotFound";
import DemoPaymentFlow from "./pages/DemoPaymentFlow";

import FeatureShowcase from "./pages/FeatureShowcase";

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
          <Route path="/feature-showcase" element={<FeatureShowcase />} />
          <Route path="/demo-payment" element={<DemoPaymentFlow />} />
          
          
          
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
  </QueryClientProvider>
);

export default App;
